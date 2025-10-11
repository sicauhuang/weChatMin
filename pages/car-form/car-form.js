// pages/car-form/car-form.js
const auth = require('../../utils/auth.js');
const storage = require('../../utils/storage.js');
const request = require('../../utils/request.js');
const apiConfig = require('../../config/api.js');
const { Toast } = require('../../utils/vant-helper.js');
const { uploadFiles } = require('../../utils/file-upload.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        mode: 'create', // create | edit
        carId: null,

        // 根据设计文档的数据模型
        formData: {
            // 车辆信息
            carName: '',
            brandModel: '',
            modelId: null, // 车型ID，通过车型选择器获取
            carAge: '',
            color: '',
            mileage: '',
            transferCount: '',
            plateDate: '',
            plateCity: '',
            usageType: '',
            condition: '',
            modifications: '',
            images: [], // 存储文件名数组，用于API提交

            // 售卖信息
            lowPrice: '',
            sellPrice: '',
            contactInfo: ''
        },

        // 表单验证错误
        errors: {},

        // Vant 弹窗状态
        showDatePopup: false,
        showVehiclePicker: false,
        showActionDialog: false, // 添加操作选择弹窗状态
        currentDate: new Date().getTime(),

        // 图片列表（Vant Uploader格式）
        imageList: [],

        // UI状态
        loading: false,
        submitting: false,
        scrollTop: 0, // 用于scroll-view的滚动定位

        // 上传状态
        uploadProgress: {
            show: false,
            percentage: 0,
            message: ''
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('车辆表单页面加载:', options);

        const { mode = 'create', carId } = options;
        this.setData({
            mode,
            carId: carId || null
        });

        // 设置导航栏标题
        wx.setNavigationBarTitle({
            title: mode === 'edit' ? '编辑车辆' : '新建车辆'
        });

        // 如果是编辑模式，加载车辆信息
        if (mode === 'edit' && carId) {
            this.loadVehicleData(carId);
        } else {
            // 新建模式：初始化用户信息
            this.initUserInfo();
        }
    },

    /**
     * 初始化用户信息（新建模式）
     */
    initUserInfo() {
        // 新建模式不自动回填手机号，因为填写的手机号不一定是机主的
        console.log('新建模式：不自动回填用户手机号');
    },

    /**
     * 加载车辆数据（编辑模式）
     */
    async loadVehicleData(carId) {
        try {
            this.setData({ loading: true });

            console.log('开始加载车辆详情:', carId);

            // 调用车辆详情查询API
            const apiData = await this.queryVehicleDetail(carId);

            console.log('车辆详情API响应:', apiData);

            // 将API数据映射到表单格式
            const formData = this.mapApiDataToForm(apiData);

            console.log('表单数据映射结果:', formData);

            // 更新表单数据
            this.setData({
                formData: formData
            });

            // 处理图片数据回显
            if (apiData.basicInfo && apiData.basicInfo.imageUrlList) {
                this.handleImageDataLoad(apiData.basicInfo.imageUrlList);
            }

            console.log('车辆数据加载成功');
        } catch (error) {
            console.error('加载车辆数据失败:', error);

            // 根据错误类型提供不同的用户反馈
            this.handleLoadError(error);
        } finally {
            this.setData({ loading: false });
        }
    },

    /**
     * 查询车辆详情
     * @param {string} carId 车辆ID
     * @returns {Promise<Object>} 车辆详情数据
     */
    async queryVehicleDetail(carId) {
        if (!carId) {
            throw new Error('车辆ID不能为空');
        }

        try {
            const response = await request.get(
                '/api/mp/car/query-car-detail',
                {
                    carId: carId
                },
                {
                    showLoading: false, // 使用页面自己的loading状态
                    showErrorToast: false // 使用页面自己的错误处理
                }
            );

            // 验证响应数据结构
            if (!response || !response.basicInfo) {
                throw new Error('车辆详情数据格式错误');
            }

            return response;
        } catch (error) {
            console.error('车辆详情API调用失败:', error);
            throw error;
        }
    },

    /**
     * 将API数据映射到表单格式
     * @param {Object} apiData API响应数据
     * @returns {Object} 表单数据
     */
    mapApiDataToForm(apiData) {
        const { basicInfo, modelInfo, name } = apiData;

        // 构建品牌车型显示文本
        let brandModel = '';
        if (modelInfo) {
            const parts = [modelInfo.series, modelInfo.variant].filter(Boolean);
            brandModel = parts.join(' ');
        }

        return {
            // 车辆信息映射
            carName: name || basicInfo.name || '',
            brandModel: brandModel,
            modelId: basicInfo.modelId || null,
            carAge: basicInfo.age || '',
            color: basicInfo.color || '',
            mileage: basicInfo.mileage || '',
            transferCount: basicInfo.transferCount || '',
            plateDate: basicInfo.licenseDate || '',
            plateCity: basicInfo.licenseCity || '',
            usageType: basicInfo.usage || '',
            condition: basicInfo.remark || '',
            modifications: basicInfo.modifyItems || '',

            // 售卖信息映射
            lowPrice: basicInfo.floorPrice || '',
            sellPrice: basicInfo.sellPrice || '',
            contactInfo: basicInfo.contactPhone || '',

            // 图片数据将在handleImageDataLoad中单独处理
            images: []
        };
    },

    /**
     * 处理图片数据加载
     * @param {Array} imageUrlList 图片URL列表
     */
    handleImageDataLoad(imageUrlList) {
        if (!Array.isArray(imageUrlList) || imageUrlList.length === 0) {
            console.log('没有图片数据需要回显');
            return;
        }

        console.log('开始处理图片数据回显:', imageUrlList);

        // 将API返回的图片数据转换为Vant Uploader格式
        const imageList = imageUrlList
            .map((imageItem, index) => {
                let imageUrl = '';
                let imageName = '';

                if (typeof imageItem === 'object' && imageItem.fileUrl) {
                    // 标准对象格式：{fileUrl: 'xxx', fileName: 'xxx'}
                    imageUrl = imageItem.fileUrl;
                    imageName = imageItem.fileName || `image_${index + 1}`;
                } else if (typeof imageItem === 'string') {
                    // 直接字符串URL格式
                    imageUrl = imageItem;
                    imageName = `image_${index + 1}`;
                } else {
                    console.warn('不支持的图片数据格式:', imageItem);
                    return null;
                }

                return {
                    url: imageUrl,
                    name: imageName,
                    isImage: true,
                    isUploaded: true, // 标识为已上传的图片，区分新增图片
                    file: null // 已上传的图片没有原始文件对象
                };
            })
            .filter((item) => item !== null); // 过滤无效数据

        console.log('图片数据转换结果:', imageList);

        // 更新图片列表显示
        this.setData({
            imageList: imageList
        });

        // 更新表单数据中的图片文件名数组（用于API提交）
        const imageFileNames = imageList.map((item) => item.name);
        this.setData({
            'formData.images': imageFileNames
        });
    },

    /**
     * 处理加载错误
     * @param {Object} error 错误对象
     */
    handleLoadError(error) {
        let errorMessage = '加载车辆信息失败';
        let shouldNavigateBack = false;

        // 根据错误类型提供不同的处理策略
        switch (error.code) {
            case 'NETWORK_ERROR':
                errorMessage = '网络连接失败，请检查网络后重试';
                break;
            case '404':
                errorMessage = '车辆信息不存在';
                shouldNavigateBack = true;
                break;
            case '403':
                errorMessage = '没有权限访问此车辆信息';
                shouldNavigateBack = true;
                break;
            case '401':
                errorMessage = '登录已过期，请重新登录';
                // request.js会自动处理登录跳转
                break;
            default:
                errorMessage = error.userMessage || error.message || '加载失败，请重试';
                break;
        }

        if (shouldNavigateBack) {
            // 需要返回上一页的错误
            wx.showModal({
                title: '加载失败',
                content: errorMessage,
                showCancel: false,
                confirmText: '返回',
                success: () => {
                    wx.navigateBack({
                        delta: 1,
                        fail: () => {
                            // 如果返回失败，尝试跳转到车辆列表页
                            wx.redirectTo({
                                url: '/pages/car-selling/car-selling'
                            });
                        }
                    });
                }
            });
        } else {
            // 可重试的错误
            wx.showModal({
                title: '加载失败',
                content: errorMessage,
                confirmText: '重试',
                cancelText: '返回',
                success: (res) => {
                    if (res.confirm) {
                        // 重试加载
                        setTimeout(() => {
                            this.loadVehicleData(this.data.carId);
                        }, 300);
                    } else {
                        // 返回上一页
                        wx.navigateBack({
                            delta: 1,
                            fail: () => {
                                // 如果返回失败，尝试跳转到车辆列表页
                                wx.redirectTo({
                                    url: '/pages/car-selling/car-selling'
                                });
                            }
                        });
                    }
                }
            });
        }
    },

    /**
     * 输入框值改变（Vant Field）
     */
    onInputChange(e) {
        const { field } = e.currentTarget.dataset;

        this.setData({
            [`formData.${field}`]: e.detail
        });
    },

    // ===== Vant 选择器相关方法 =====

    /**
     * 显示车型选择器
     */
    showVehiclePicker() {
        this.setData({ showVehiclePicker: true });
    },

    /**
     * 隐藏车型选择器
     */
    hideVehiclePicker() {
        this.setData({ showVehiclePicker: false });
    },

    /**
     * 车型选择确认
     */
    onVehicleConfirm(e) {
        const { displayText, modelId, brandInfo, seriesInfo, modelInfo } = e.detail;

        console.log('车型选择结果:', {
            displayText,
            modelId,
            brandInfo,
            seriesInfo,
            modelInfo
        });

        // 更新表单数据，保存modelId用于API提交
        this.setData({
            'formData.brandModel': displayText,
            'formData.modelId': modelId || '1', // 保存车型ID用于API调用
            showVehiclePicker: false
        });
    },

    /**
     * 车型选择取消
     */
    onVehicleCancel() {
        console.log('用户取消车型选择');
        this.setData({ showVehiclePicker: false });
    },

    /**
     * 显示操作选择弹窗
     */
    showActionDialog() {
        this.setData({ showActionDialog: true });
    },

    /**
     * 隐藏操作选择弹窗
     */
    hideActionDialog() {
        this.setData({ showActionDialog: false });
    },

    /**
     * 继续新建车辆
     */
    onContinueCreate() {
        // 先关闭弹窗
        this.setData({ showActionDialog: false });

        // 清空表单数据，重置为初始状态
        this.resetForm();

        console.log('用户选择继续新建车辆');
    },

    /**
     * 返回上一页
     */
    onGoBack() {
        // 先关闭弹窗
        this.setData({ showActionDialog: false });

        // 返回上一页，使用与编辑成功后一致的逻辑
        setTimeout(() => {
            wx.navigateBack({
                delta: 1,
                success: () => {
                    console.log('新建车辆成功，用户选择返回上一页');
                },
                fail: (error) => {
                    console.error('返回上一页失败:', error);
                    // 如果返回失败，尝试重新跳转到车辆列表页
                    wx.redirectTo({
                        url: '/pages/car-selling/car-selling'
                    });
                }
            });
        }, 300);

        console.log('用户选择返回上一页');
    },

    /**
     * 重置表单数据
     */
    resetForm() {
        this.setData({
            formData: {
                // 车辆信息
                carName: '',
                brandModel: '',
                modelId: null,
                carAge: '',
                color: '',
                mileage: '',
                transferCount: '',
                plateDate: '',
                plateCity: '',
                usageType: '',
                condition: '',
                modifications: '',
                images: [],

                // 售卖信息
                lowPrice: '',
                sellPrice: '',
                contactInfo: ''
            },
            errors: {},
            imageList: [],
            scrollTop: 0
        });

        console.log('表单数据已重置');
    },

    /**
     * 显示日期选择器
     */
    showDatePicker() {
        // 设置当前日期为默认值
        const currentDate = this.data.formData.plateDate
            ? new Date(this.data.formData.plateDate).getTime()
            : new Date().getTime();

        this.setData({
            showDatePopup: true,
            currentDate: currentDate
        });
    },

    /**
     * 隐藏日期选择器
     */
    hideDatePicker() {
        this.setData({ showDatePopup: false });
    },

    /**
     * 日期选择确认
     */
    onDateConfirm(e) {
        console.log('日期选择事件参数:', e);

        // 正确的获取方式：event.detail 直接就是日期值（时间戳）
        const timestamp = e.detail;

        if (!timestamp || isNaN(timestamp)) {
            console.error('日期格式错误:', timestamp);
            return;
        }

        const date = new Date(timestamp);

        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            console.error('日期对象无效:', timestamp);
            return;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        this.setData({
            'formData.plateDate': formattedDate,
            showDatePopup: false
        });

        console.log('日期选择结果:', formattedDate);
    },

    /**
     * 图片上传（Vant Uploader）
     * 注意：这里只更新UI，实际上传在保存时执行
     */
    onImageUpload(e) {
        // 获取上传的文件，可能是单个文件或文件数组
        const { file } = e.detail;
        const files = Array.isArray(file) ? file : [file];
        const maxImages = 5;
        const currentCount = this.data.imageList.length;

        // 检查是否超过最大数量限制
        if (currentCount + files.length > maxImages) {
            Toast.fail(`最多只能上传${maxImages}张图片`);
            return;
        }

        // 更新图片列表（UI显示用）
        const imageList = [...this.data.imageList];

        // 处理每个文件
        files.forEach((fileItem) => {
            // 文件验证
            const validationResult = this.validateImageFile(fileItem);
            if (!validationResult.isValid) {
                Toast.fail(validationResult.message);
                return;
            }

            // 添加新图片
            const imageItem = {
                url: fileItem.url || fileItem.path, // UI显示用的URL
                name:
                    fileItem.name ||
                    `image_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // 临时文件名
                isImage: true,
                isUploaded: false, // 标识为新添加的图片，需要上传
                file: fileItem // 保存原始文件对象，用于后续上传
            };

            imageList.push(imageItem);
        });

        this.setData({
            imageList: imageList
        });

        console.log('图片选择成功:', {
            fileCount: files.length,
            currentCount: imageList.length
        });
    },

    /**
     * 验证图片文件
     * @param {Object} file 文件对象
     * @returns {Object} 验证结果
     */
    validateImageFile(file) {
        const { uploadConfig } = apiConfig;

        // 检查文件大小
        if (file.size && file.size > uploadConfig.maxFileSize) {
            return {
                isValid: false,
                message: `图片大小不能超过 ${uploadConfig.maxFileSize / 1024 / 1024}MB`
            };
        }

        // 检查文件类型
        if (file.path) {
            const extension = this.getFileExtension(file.path);
            if (!uploadConfig.supportedTypes.includes(extension.toLowerCase())) {
                return {
                    isValid: false,
                    message: `仅支持 ${uploadConfig.supportedTypes.join(', ')} 格式的图片`
                };
            }
        }

        return { isValid: true };
    },

    /**
     * 获取文件扩展名
     * @param {string} filePath 文件路径
     * @returns {string} 扩展名
     */
    getFileExtension(filePath) {
        const lastDot = filePath.lastIndexOf('.');
        return lastDot !== -1 ? filePath.substring(lastDot + 1) : '';
    },

    /**
     * 删除图片（Vant Uploader）
     */
    onImageDelete(e) {
        const { index } = e.detail;
        const imageList = [...this.data.imageList];

        // 删除指定索引的图片
        const deletedItem = imageList[index];
        imageList.splice(index, 1);

        this.setData({
            imageList: imageList
        });

        console.log('图片删除成功:', {
            deletedFileName: deletedItem.name,
            remainingCount: imageList.length
        });
    },

    /**
     * 预览图片
     */
    onImagePreview(e) {
        const { index } = e.currentTarget.dataset;
        const urls = this.data.imageList.map((item) => item.url);

        wx.previewImage({
            urls: urls,
            current: urls[index]
        });
    },

    /**
     * 表单验证
     */
    validateForm() {
        const { formData } = this.data;
        const errors = {};
        console.log('验证表单数据:', formData);
        // 定义字段映射表（用于显示友好的字段名称）
        const fieldLabels = {
            // 必填字段
            brandModel: '品牌车型',
            carAge: '车龄',
            color: '车辆颜色',
            mileage: '里程数',
            lowPrice: '底价',
            sellPrice: '售价',
            contactInfo: '联系方式',
            // 可选字段
            carName: '车辆名称',
            transferCount: '过户次数',
            plateDate: '上牌日期',
            plateCity: '上牌城市',
            usageType: '使用性质'
        };

        // 字段验证顺序（必填字段优先）
        const fieldOrder = [
            // 必填字段
            'brandModel',
            'carAge',
            'color',
            'mileage',
            'lowPrice',
            'sellPrice',
            'contactInfo',
            // 可选字段
            'carName',
            'transferCount',
            'plateDate',
            'plateCity',
            'usageType'
        ];

        // === 必填字段验证（根据用户要求） ===

        // 品牌车型（必填）- 需要modelId
        if (!formData.brandModel.trim() || !formData.modelId) {
            errors.brandModel = '请选择品牌车型';
        }

        // 车龄（必填）- age
        if (!formData.carAge) {
            errors.carAge = '请输入车龄';
        } else if (!/^\d+$/.test(formData.carAge) || parseInt(formData.carAge) < 0) {
            errors.carAge = '请输入正确的车龄（非负整数）';
        }

        // 颜色（必填）- color
        if (!formData.color.trim()) {
            errors.color = '请输入车辆颜色';
        }

        // 里程数（必填）- mileage
        if (!formData.mileage) {
            errors.mileage = '请输入里程数';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.mileage)) {
            errors.mileage = '请输入正确的里程格式（最多2位小数）';
        } else if (parseFloat(formData.mileage) < 0) {
            errors.mileage = '里程数不能为负数';
        }

        // 底价（必填）- floorPrice
        if (!formData.lowPrice) {
            errors.lowPrice = '请输入底价';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.lowPrice)) {
            errors.lowPrice = '请输入正确的价格格式（最多2位小数）';
        } else if (parseFloat(formData.lowPrice) <= 0) {
            errors.lowPrice = '底价必须大于0';
        }

        // 售价（必填）- sellPrice
        if (!formData.sellPrice) {
            errors.sellPrice = '请输入售价';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.sellPrice)) {
            errors.sellPrice = '请输入正确的价格格式（最多2位小数）';
        } else if (parseFloat(formData.sellPrice) <= 0) {
            errors.sellPrice = '售价必须大于0';
        }

        // 联系方式（必填）- contactPhone
        if (!formData.contactInfo.trim()) {
            errors.contactInfo = '请输入联系方式';
        }

        // === 可选字段验证（如果填写了则需要校验格式） ===

        // 过户次数（可选）- transferCount
        if (
            formData.transferCount !== '' &&
            formData.transferCount !== null &&
            formData.transferCount !== undefined
        ) {
            if (!/^\d+$/.test(formData.transferCount) || parseInt(formData.transferCount) < 0) {
                errors.transferCount = '请输入正确的过户次数（非负整数）';
            }
        }

        // 上牌日期（可选）- licenseDate
        if (formData.plateDate) {
            const plateDate = new Date(formData.plateDate);
            const currentDate = new Date();
            if (plateDate > currentDate) {
                errors.plateDate = '上牌日期不能晚于当前日期';
            }
        }

        // === 交叉验证规则 ===

        // 价格交叉验证：底价不能高于售价
        if (formData.lowPrice && formData.sellPrice) {
            const lowPrice = parseFloat(formData.lowPrice);
            const sellPrice = parseFloat(formData.sellPrice);
            if (lowPrice > sellPrice) {
                errors.lowPrice = '底价不能高于售价';
            }
        }

        // 车龄与上牌日期的逻辑一致性检查
        if (formData.carAge && formData.plateDate) {
            const carAge = parseInt(formData.carAge);
            const plateYear = new Date(formData.plateDate).getFullYear();
            const currentYear = new Date().getFullYear();
            const calculatedAge = currentYear - plateYear;

            // 允许1年的误差范围
            if (Math.abs(carAge - calculatedAge) > 1) {
                errors.carAge = '车龄与上牌日期不符';
            }
        }

        // 返回验证结果
        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) {
            // 找到第一个错误字段（优先显示必填字段错误）
            const firstErrorField = fieldOrder.find((field) => errors[field]);
            return {
                isValid: false,
                firstErrorField: firstErrorField,
                firstErrorMessage: errors[firstErrorField],
                firstErrorLabel: fieldLabels[firstErrorField],
                allErrors: errors
            };
        }

        return { isValid: true };
    },

    /**
     * 保存车辆信息
     */
    async onSave() {
        if (this.data.submitting) return;

        // 表单验证
        const validationResult = this.validateForm();
        if (!validationResult.isValid) {
            // 显示toast提示
            Toast.fail(validationResult.firstErrorMessage);

            // 滚动到错误字段
            this.scrollToField(validationResult.firstErrorField);
            return;
        }

        this.setData({ submitting: true });

        try {
            const { mode, carId, formData, imageList } = this.data;
            let finalImageFileNames = [];

            // 处理图片数据：分离新增图片和已有图片
            if (imageList.length > 0) {
                // 分离需要上传的新图片和已有图片
                const newImages = imageList.filter((item) => !item.isUploaded && item.file);
                const existingImages = imageList.filter((item) => item.isUploaded);

                console.log('图片处理分析:', {
                    total: imageList.length,
                    newImages: newImages.length,
                    existingImages: existingImages.length
                });

                // 如果有新图片需要上传
                if (newImages.length > 0) {
                    console.log('开始上传新图片:', newImages.length, '个');

                    // 显示上传进度
                    this.setData({
                        'uploadProgress.show': true,
                        'uploadProgress.percentage': 0,
                        'uploadProgress.message': '正在上传图片...'
                    });

                    const filesToUpload = newImages.map((item) => item.file);
                    const uploadResult = await uploadFiles({
                        fileList: filesToUpload,
                        type: 'car', // 车辆图片类型
                        onProgress: (progress) => {
                            this.setData({
                                'uploadProgress.percentage': progress.percentage,
                                'uploadProgress.message': `上传中... ${progress.completed}/${progress.total}`
                            });
                        }
                    });

                    // 隐藏上传进度
                    this.setData({
                        'uploadProgress.show': false
                    });

                    if (uploadResult.isAllFailed) {
                        Toast.fail('图片上传失败，请重试');
                        return;
                    } else if (uploadResult.isPartialSuccess) {
                        // 部分成功，询问是否继续
                        const confirmed = await this.showConfirmDialog(
                            '部分图片上传失败',
                            `${uploadResult.message}，是否继续保存？`
                        );
                        if (!confirmed) {
                            return;
                        }
                    }

                    console.log('新图片上传完成:', uploadResult.successFiles);

                    // 合并已有图片和新上传图片的文件名
                    const existingFileNames = existingImages.map((item) => item.name);
                    finalImageFileNames = [...existingFileNames, ...uploadResult.successFiles];
                } else {
                    // 只有已有图片，直接使用现有文件名
                    finalImageFileNames = existingImages.map((item) => item.name);
                    console.log('没有新图片需要上传，使用现有图片:', finalImageFileNames);
                }
            }

            // 构建提交数据，将最终的图片文件名列表设置到images字段
            const submitData = {
                ...formData,
                images: finalImageFileNames
            };

            console.log('最终提交的图片文件名:', finalImageFileNames);

            // 提交表单数据
            if (mode === 'create') {
                // 新建模式：调用创建 API
                await this.createVehicle(submitData);
                Toast.success('创建成功');

                // 新建成功后显示操作选择弹窗
                this.showActionDialog();
            } else {
                // 编辑模式：调用更新 API
                await this.updateVehicle(carId, submitData);
                Toast.success('更新成功');

                // 编辑模式：成功后立即返回上一页
                setTimeout(() => {
                    wx.navigateBack({
                        delta: 1,
                        success: () => {
                            console.log('车辆更新成功，已返回上一页');
                        },
                        fail: (error) => {
                            console.error('返回上一页失败:', error);
                            // 如果返回失败，尝试重新跳转到车辆列表页
                            wx.redirectTo({
                                url: '/pages/car-selling/car-selling'
                            });
                        }
                    });
                }, 800); // 缩短延迟时间到0.8秒，给用户足够时间看到成功提示
            }
        } catch (error) {
            console.error('保存车辆信息失败:', error);

            // 隐藏上传进度
            this.setData({
                'uploadProgress.show': false
            });

            // 根据错误类型提供不同的用户反馈
            this.handleSaveError(error);
        } finally {
            this.setData({ submitting: false });
        }
    },

    /**
     * 处理保存错误
     * @param {Object} error 错误对象
     */
    handleSaveError(error) {
        let errorMessage = '保存失败';
        let showRetryButton = false;

        // 根据错误类型提供不同的提示
        switch (error.code) {
            case 'NETWORK_ERROR':
                errorMessage = '网络连接失败，请检查网络后重试';
                showRetryButton = true;
                break;
            case 'NO_REFRESH_TOKEN':
            case 'REFRESH_TOKEN_FAILED':
                errorMessage = '登录已过期，请重新登录';
                // 不显示重试按钮，因为request.js已经处理了跳转
                break;
            case '400':
                errorMessage = '请求参数错误，请检查表单信息';
                break;
            case '403':
                errorMessage = '没有权限进行此操作';
                break;
            case '500':
            case '502':
            case '503':
            case '504':
                errorMessage = '服务器繁忙，请稍后重试';
                showRetryButton = true;
                break;
            default:
                // 优先使用用户友好的错误信息
                errorMessage = error.userMessage || error.message || '保存失败，请重试';
                showRetryButton = true;
                break;
        }

        // 显示错误提示
        if (showRetryButton) {
            // 显示带重试按钮的错误对话框
            this.showErrorDialog(errorMessage);
        } else {
            // 显示简单的Toast提示
            Toast.fail(errorMessage);
        }
    },

    /**
     * 显示错误对话框（带重试按钮）
     * @param {string} message 错误信息
     */
    showErrorDialog(message) {
        wx.showModal({
            title: '操作失败',
            content: message,
            confirmText: '重试',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    // 用户点击重试，重新执行保存操作
                    setTimeout(() => {
                        this.onSave();
                    }, 300);
                }
            }
        });
    },

    /**
     * 显示确认对话框
     * @param {string} title 标题
     * @param {string} content 内容
     * @returns {Promise<boolean>} 用户是否确认
     */
    showConfirmDialog(title, content) {
        return new Promise((resolve) => {
            wx.showModal({
                title: title,
                content: content,
                confirmText: '继续',
                cancelText: '取消',
                success: (res) => {
                    resolve(res.confirm);
                },
                fail: () => {
                    resolve(false);
                }
            });
        });
    },

    /**
     * 滚动到指定字段
     */
    scrollToField(fieldName) {
        // 字段对应的选择器ID映射
        const fieldSelectors = {
            carName: '.van-field[data-field="carName"]',
            brandModel: '.car-brandModel',
            carAge: '.van-field[data-field="carAge"]',
            color: '.van-field[data-field="color"]',
            mileage: '.van-field[data-field="mileage"]',
            transferCount: '.van-field[data-field="transferCount"]',
            plateDate: '.car-plateDate',
            plateCity: '.van-field[data-field="plateCity"]',
            usageType: '.van-field[data-field="usageType"]',
            lowPrice: '.van-field[data-field="lowPrice"]',
            sellPrice: '.van-field[data-field="sellPrice"]',
            contactInfo: '.van-field[data-field="contactInfo"]'
        };

        const selector = fieldSelectors[fieldName];
        if (selector) {
            // 使用scroll-view的scrollIntoView方式
            // 首先获取元素位置
            wx.createSelectorQuery()
                .in(this)
                .select(selector)
                .boundingClientRect((rect) => {
                    if (rect) {
                        // 获取scroll-view的位置
                        wx.createSelectorQuery()
                            .in(this)
                            .select('.form-container')
                            .boundingClientRect((scrollRect) => {
                                if (scrollRect) {
                                    // 计算相对于scroll-view的位置
                                    const scrollTop = rect.top - scrollRect.top - 50; // 预留50rpx的上边距

                                    // 设置scroll-view的scrollTop
                                    this.setData({
                                        scrollTop: Math.max(0, scrollTop)
                                    });
                                }
                            })
                            .exec();
                    }
                })
                .exec();
        }
    },

    /**
     * 创建车辆（新建模式）
     */
    async createVehicle(formData) {
        // 调用真实的新增车辆API
        const apiUrl = '/api/mp/car/create-car';

        // 将前端表单数据映射为后端API需要的格式
        const apiData = this.mapFormDataToApi(formData);

        console.log('创建车辆 API 调用:', {
            url: apiUrl,
            method: 'POST',
            data: apiData
        });

        try {
            const response = await request.post(apiUrl, apiData, {
                showLoading: true,
                loadingTitle: '正在创建车辆...'
            });

            // API返回的是车辆ID（number类型）
            console.log('车辆创建成功，ID:', response);

            return {
                success: true,
                carId: response,
                message: '车辆创建成功'
            };
        } catch (error) {
            console.error('创建车辆API调用失败:', error);
            throw error;
        }
    },

    /**
     * 更新车辆（编辑模式）
     */
    async updateVehicle(carId, formData) {
        if (!carId) {
            throw new Error('车辆ID不能为空');
        }

        const apiUrl = '/api/mp/car/update-car';

        // 将前端表单数据映射为后端API需要的格式，包含carId
        const apiData = this.mapFormDataToApiForUpdate(carId, formData);

        console.log('更新车辆 API 调用:', {
            url: apiUrl,
            method: 'POST',
            carId: carId,
            data: apiData
        });

        try {
            const response = await request.post(apiUrl, apiData, {
                showLoading: true,
                loadingTitle: '正在更新车辆...',
                showErrorToast: false // 使用页面自己的错误处理
            });

            console.log('车辆更新成功:', response);

            return {
                success: true,
                carId: carId,
                data: response,
                message: '车辆更新成功'
            };
        } catch (error) {
            console.error('更新车辆API调用失败:', error);
            throw error;
        }
    },

    /**
     * 将前端表单数据映射为后端API格式
     * @param {Object} formData 前端表单数据
     * @returns {Object} 后端API需要的数据格式
     */
    mapFormDataToApi(formData) {
        // 根据接口文档进行字段映射
        const apiData = {
            // 必填字段
            modelId: formData.modelId, // 车型ID，通过车型选择器获取
            floorPrice: parseFloat(formData.lowPrice), // 底价（万元）
            sellPrice: parseFloat(formData.sellPrice), // 售价（万元）
            contactPhone: formData.contactInfo, // 联系电话

            // 可选字段
            name: formData.carName || null, // 车辆名称
            age: formData.carAge ? parseInt(formData.carAge) : null, // 车龄（年）
            color: formData.color || null, // 颜色
            mileage: formData.mileage ? parseFloat(formData.mileage) : null, // 里程（万公里）
            transferCount: formData.transferCount ? parseInt(formData.transferCount) : null, // 过户次数
            licenseDate: formData.plateDate || null, // 上牌日期
            licenseCity: formData.plateCity || null, // 上牌城市
            usage: formData.usageType || null, // 使用性质
            remark: formData.condition || null, // 车况描述
            modifyItems: formData.modifications || null, // 加装项目
            imageFileIds: this.formatImageFileIds(formData.images) // 图片文件ID列表
        };

        // 移除null值字段（可选）
        Object.keys(apiData).forEach((key) => {
            if (apiData[key] === null || apiData[key] === '') {
                delete apiData[key];
            }
        });

        console.log('表单数据映射结果:', {
            原始数据: formData,
            映射后数据: apiData
        });

        return apiData;
    },

    /**
     * 将前端表单数据映射为更新车辆API格式（包含carId）
     * @param {string|number} carId 车辆ID
     * @param {Object} formData 前端表单数据
     * @returns {Object} 后端更新API需要的数据格式
     */
    mapFormDataToApiForUpdate(carId, formData) {
        // 获取基本映射数据
        const baseApiData = this.mapFormDataToApi(formData);

        // 添加carId字段（更新接口必须）
        const updateApiData = {
            carId: carId.toString(),
            ...baseApiData
        };

        console.log('更新车辆数据映射结果:', {
            carId: carId,
            原始表单数据: formData,
            最终API数据: updateApiData
        });

        return updateApiData;
    },

    /**
     * 格式化图片文件ID列表
     * @param {Array} images 图片文件名数组
     * @returns {string} 逗号分隔的文件ID字符串
     */
    formatImageFileIds(images) {
        if (!images || !Array.isArray(images) || images.length === 0) {
            return '';
        }

        // 图片文件名数组转换为逗号分隔的字符串
        return images.join(',');
    }
});
