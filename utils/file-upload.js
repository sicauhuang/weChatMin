/**
 * 文件上传管理器
 * 基于腾讯云COS的流式上传管理，支持多文件并发上传、失败重试、进度回调
 */

const request = require('./request.js');
const { generateRandomString } = require('./util.js');

/**
 * 文件上传管理器类
 */
class FileUploadManager {
    constructor(options = {}) {
        // 配置参数
        this.config = {
            maxConcurrent: options.maxConcurrent || 4,        // 最大并发数
            maxRetries: options.maxRetries || 3,              // 最大重试次数
            retryDelay: options.retryDelay || 1000,           // 重试延迟(ms)
            timeout: options.timeout || 30000,                // 上传超时(ms)
            maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 最大文件大小 5MB
            supportedTypes: options.supportedTypes || ['png', 'jpg', 'jpeg'], // 支持的文件类型
            ...options
        };

        // 上传队列和状态
        this.uploadQueue = [];                // 上传队列
        this.activeUploads = new Map();       // 活跃的上传任务
        this.completedTasks = [];             // 已完成的任务
        this.failedTasks = [];                // 失败的任务
    }

    /**
     * 主要上传方法
     * @param {Object} options 上传选项
     * @param {Array} options.fileList 微信小程序文件列表
     * @param {string} options.type 文件类型 ('car' | 'logo')
     * @param {Function} options.onProgress 进度回调
     * @param {Function} options.onComplete 完成回调
     * @returns {Promise<UploadResult>} 上传结果
     */
    async upload(options) {
        const { fileList, type = 'car', onProgress, onComplete } = options;

        // 参数验证
        if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
            throw new Error('文件列表不能为空');
        }

        if (!['car', 'logo'].includes(type)) {
            throw new Error('文件类型必须是 car 或 logo');
        }

        // 文件验证
        const validationResult = this.validateFiles(fileList);
        if (!validationResult.isValid) {
            throw new Error(validationResult.message);
        }

        console.log('开始文件上传流程:', { fileCount: fileList.length, type });

        try {
            // 生成文件名并获取预签名URL
            const uploadTasks = await this.prepareUploadTasks(fileList, type);
            
            // 执行并发上传
            const results = await this.executeUploads(uploadTasks, onProgress);
            
            // 构建结果
            const uploadResult = this.buildUploadResult(results);
            
            if (onComplete) {
                onComplete(uploadResult);
            }
            
            return uploadResult;
        } catch (error) {
            console.error('文件上传流程失败:', error);
            const failedResult = {
                successFiles: [],
                failedFiles: fileList.map((_, index) => this.generateFileName(type)),
                total: fileList.length,
                message: error.message || '上传失败'
            };
            
            if (onComplete) {
                onComplete(failedResult);
            }
            
            throw error;
        }
    }

    /**
     * 验证文件
     * @param {Array} fileList 文件列表
     * @returns {Object} 验证结果
     */
    validateFiles(fileList) {
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            
            // 检查文件大小
            if (file.size && file.size > this.config.maxFileSize) {
                return {
                    isValid: false,
                    message: `文件大小不能超过 ${this.config.maxFileSize / 1024 / 1024}MB`
                };
            }
            
            // 检查文件类型
            if (file.path) {
                const extension = this.getFileExtension(file.path);
                if (!this.config.supportedTypes.includes(extension.toLowerCase())) {
                    return {
                        isValid: false,
                        message: `仅支持 ${this.config.supportedTypes.join(', ')} 格式的图片`
                    };
                }
            }
        }
        
        return { isValid: true };
    }

    /**
     * 准备上传任务
     * @param {Array} fileList 文件列表
     * @param {string} type 文件类型
     * @returns {Promise<Array>} 上传任务列表
     */
    async prepareUploadTasks(fileList, type) {
        // 为每个文件生成唯一文件名
        const fileNames = fileList.map(() => this.generateFileName(type));
        
        console.log('生成的文件名列表:', fileNames);
        
        // 批量获取预签名URL
        const uploadUrls = await this.getPreSignedUrls(fileNames);
        
        // 创建上传任务
        const uploadTasks = fileList.map((file, index) => ({
            id: `task_${Date.now()}_${index}`,
            file: file,
            fileName: fileNames[index],
            uploadUrl: uploadUrls[index].uploadUrl,
            retryCount: 0,
            status: 'pending',
            progress: 0
        }));
        
        return uploadTasks;
    }

    /**
     * 生成文件名
     * @param {string} type 文件类型
     * @returns {string} 生成的文件名
     */
    generateFileName(type) {
        const uuid = generateRandomString(10);
        const timestamp = Date.now();
        // 根据需求文档，后缀名统一为png
        const extension = 'png';
        
        return `${type}/${uuid}_${timestamp}.${extension}`;
    }

    /**
     * 获取文件扩展名
     * @param {string} filePath 文件路径
     * @returns {string} 扩展名
     */
    getFileExtension(filePath) {
        const lastDot = filePath.lastIndexOf('.');
        return lastDot !== -1 ? filePath.substring(lastDot + 1) : '';
    }

    /**
     * 获取预签名URL
     * @param {Array} fileNames 文件名列表
     * @returns {Promise<Array>} 预签名URL信息列表
     */
    async getPreSignedUrls(fileNames) {
        try {
            console.log('请求预签名URL:', fileNames);
            
            const response = await request.post('/api/mp/file/query-upload-url', {
                fileNameList: fileNames
            }, {
                showLoading: false,
                showErrorToast: false
            });
            
            if (!response || !Array.isArray(response)) {
                throw new Error('预签名URL响应格式错误');
            }
            
            console.log('获取预签名URL成功:', response);
            return response;
        } catch (error) {
            console.error('获取预签名URL失败:', error);
            throw new Error('获取上传地址失败');
        }
    }

    /**
     * 执行并发上传
     * @param {Array} uploadTasks 上传任务列表
     * @param {Function} onProgress 进度回调
     * @returns {Promise<Array>} 上传结果列表
     */
    async executeUploads(uploadTasks, onProgress) {
        return new Promise((resolve) => {
            this.uploadQueue = [...uploadTasks];
            this.activeUploads.clear();
            this.completedTasks = [];
            this.failedTasks = [];
            
            // 开始处理队列
            this.processUploadQueue(onProgress);
            
            // 监听完成状态
            const checkCompletion = () => {
                const totalTasks = uploadTasks.length;
                const completedCount = this.completedTasks.length + this.failedTasks.length;
                
                if (completedCount >= totalTasks) {
                    resolve([...this.completedTasks, ...this.failedTasks]);
                } else {
                    // 继续检查
                    setTimeout(checkCompletion, 100);
                }
            };
            
            checkCompletion();
        });
    }

    /**
     * 处理上传队列
     * @param {Function} onProgress 进度回调
     */
    processUploadQueue(onProgress) {
        while (this.uploadQueue.length > 0 && this.activeUploads.size < this.config.maxConcurrent) {
            const task = this.uploadQueue.shift();
            this.startUploadTask(task, onProgress);
        }
    }

    /**
     * 开始单个上传任务
     * @param {Object} task 上传任务
     * @param {Function} onProgress 进度回调
     */
    async startUploadTask(task, onProgress) {
        this.activeUploads.set(task.id, task);
        task.status = 'uploading';
        
        try {
            console.log(`开始上传文件: ${task.fileName}`);
            
            const success = await this.uploadSingleFile(task);
            
            if (success) {
                task.status = 'success';
                task.progress = 100;
                this.completedTasks.push(task);
                console.log(`文件上传成功: ${task.fileName}`);
            } else {
                throw new Error('上传失败');
            }
        } catch (error) {
            console.error(`文件上传失败: ${task.fileName}`, error);
            
            if (task.retryCount < this.config.maxRetries) {
                // 重试
                task.retryCount++;
                task.status = 'retrying';
                
                setTimeout(() => {
                    this.retryUpload(task, onProgress);
                }, this.config.retryDelay * Math.pow(2, task.retryCount - 1)); // 指数退避
            } else {
                // 失败
                task.status = 'failed';
                task.error = error.message;
                this.failedTasks.push(task);
            }
        } finally {
            this.activeUploads.delete(task.id);
            
            // 触发进度回调
            if (onProgress) {
                this.reportProgress(onProgress);
            }
            
            // 继续处理队列
            this.processUploadQueue(onProgress);
        }
    }

    /**
     * 重试上传
     * @param {Object} task 上传任务
     * @param {Function} onProgress 进度回调
     */
    retryUpload(task, onProgress) {
        console.log(`重试上传文件: ${task.fileName}, 第${task.retryCount}次重试`);
        this.startUploadTask(task, onProgress);
    }

    /**
     * 上传单个文件到COS
     * @param {Object} task 上传任务
     * @returns {Promise<boolean>} 是否成功
     */
    async uploadSingleFile(task) {
        return new Promise((resolve, reject) => {
            const { file, uploadUrl } = task;
            
            // 检测是否是微信小程序文件对象
            if (!file.path && !file.url) {
                reject(new Error('无效的文件对象'));
                return;
            }
            
            const filePath = file.path || file.url;
            
            // 根据需求文档，需要使用PUT方法上传二进制数据到腾讯云COS
            // 先读取文件的二进制数据
            wx.getFileSystemManager().readFile({
                filePath: filePath,
                success: (readRes) => {
                    console.log('文件读取成功，准备上传到COS:', {
                        fileName: task.fileName,
                        fileSize: readRes.data.byteLength || readRes.data.length
                    });
                    
                    // 使用wx.request的PUT方法上传二进制数据
                    wx.request({
                        url: uploadUrl,
                        method: 'PUT',
                        data: readRes.data, // 二进制数据
                        header: {
                            'Content-Type': 'application/octet-stream' // 二进制数据类型
                        },
                        timeout: this.config.timeout,
                        success: (res) => {
                            console.log('COS上传响应:', {
                                statusCode: res.statusCode,
                                fileName: task.fileName
                            });
                            
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                console.log(`文件上传成功: ${task.fileName}`);
                                resolve(true);
                            } else {
                                console.error(`上传失败，状态码: ${res.statusCode}`, res);
                                reject(new Error(`上传失败，状态码: ${res.statusCode}`));
                            }
                        },
                        fail: (error) => {
                            console.error('COS上传请求失败:', error);
                            reject(new Error('网络上传失败: ' + (error.errMsg || error.message || 'unknown error')));
                        }
                    });
                },
                fail: (error) => {
                    console.error('文件读取失败:', error);
                    reject(new Error('文件读取失败: ' + (error.errMsg || error.message || 'unknown error')));
                }
            });
        });
    }

    /**
     * 报告进度
     * @param {Function} onProgress 进度回调
     */
    reportProgress(onProgress) {
        const totalTasks = this.completedTasks.length + this.failedTasks.length + this.activeUploads.size + this.uploadQueue.length;
        const completedCount = this.completedTasks.length;
        const failedCount = this.failedTasks.length;
        const uploadingCount = this.activeUploads.size;
        const pendingCount = this.uploadQueue.length;
        
        const progress = {
            total: totalTasks,
            completed: completedCount,
            failed: failedCount,
            uploading: uploadingCount,
            pending: pendingCount,
            percentage: totalTasks > 0 ? Math.round((completedCount + failedCount) / totalTasks * 100) : 0
        };
        
        onProgress(progress);
    }

    /**
     * 构建上传结果
     * @param {Array} results 所有任务结果
     * @returns {Object} 上传结果
     */
    buildUploadResult(results) {
        const successFiles = results
            .filter(task => task.status === 'success')
            .map(task => task.fileName);
        
        const failedFiles = results
            .filter(task => task.status === 'failed')
            .map(task => task.fileName);
        
        const total = results.length;
        const successCount = successFiles.length;
        const failedCount = failedFiles.length;
        
        let message = '';
        if (failedCount === 0) {
            message = `${successCount}个文件上传成功`;
        } else if (successCount === 0) {
            message = `${failedCount}个文件上传失败`;
        } else {
            message = `${successCount}个文件上传成功，${failedCount}个文件上传失败`;
        }
        
        return {
            successFiles,
            failedFiles,
            total,
            message,
            isAllSuccess: failedCount === 0,
            isPartialSuccess: successCount > 0 && failedCount > 0,
            isAllFailed: successCount === 0
        };
    }
}

/**
 * 创建文件上传管理器实例
 * @param {Object} options 配置选项
 * @returns {FileUploadManager} 管理器实例
 */
function createUploadManager(options = {}) {
    return new FileUploadManager(options);
}

/**
 * 便捷的上传方法
 * @param {Object} options 上传选项
 * @returns {Promise<Object>} 上传结果
 */
async function uploadFiles(options) {
    const manager = createUploadManager();
    return await manager.upload(options);
}

module.exports = {
    FileUploadManager,
    createUploadManager,
    uploadFiles
};