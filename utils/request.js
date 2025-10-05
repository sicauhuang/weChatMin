/**
 * 网络请求工具封装
 * 提供统一的请求接口，自动处理认证和错误
 */

const { currentEnv } = require('../config/api.js');
const storage = require('./storage.js');

/**
 * 封装的请求方法
 * @param {Object} options 请求配置
 * @param {string} options.url 请求地址（相对路径，如 '/api/login'）
 * @param {string} options.method 请求方法，默认 'GET'
 * @param {Object} options.data 请求数据
 * @param {Object} options.header 请求头
 * @param {boolean} options.needAuth 是否需要认证，默认 true
 * @param {boolean} options.showLoading 是否显示加载提示，默认 false
 * @param {string} options.loadingTitle 加载提示文字
 * @returns {Promise} 请求Promise
 */
function request(options = {}) {
    return new Promise((resolve, reject) => {
        const {
            url,
            method = 'GET',
            data = {},
            header = {},
            needAuth = true,
            showLoading = false,
            loadingTitle = '请求中...'
        } = options;

        // 显示加载提示
        if (showLoading) {
            wx.showLoading({
                title: loadingTitle,
                mask: true
            });
        }

        // 构建完整URL
        const fullUrl = url.startsWith('http') ? url : currentEnv.getApiUrl(url);

        // 构建请求头
        const requestHeader = {
            'Content-Type': 'application/json',
            ...header
        };

        // 添加认证信息
        if (needAuth) {
            const accessToken = storage.getAccessToken();
            if (accessToken) {
                requestHeader['_token'] = `${accessToken}`;
            }
        }

        console.log('发起请求:', {
            url: fullUrl,
            method,
            data,
            header: requestHeader
        });

        wx.request({
            url: fullUrl,
            method,
            data,
            header: requestHeader,
            success: (res) => {
                console.log('请求成功:', res);

                if (showLoading) {
                    wx.hideLoading();
                }

                // 处理HTTP状态码
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // 检查业务状态码
                    if (res.data && res.data.success === false) {
                        // 业务错误
                        handleBusinessError(res.data, reject);
                    } else {
                        resolve(res.data);
                    }
                } else if (res.statusCode === 401) {
                    // 认证失败，尝试刷新token
                    handleAuthError(options, resolve, reject);
                } else {
                    // HTTP错误
                    const error = {
                        code: res.statusCode,
                        message: `请求失败 (${res.statusCode})`,
                        data: res.data
                    };
                    handleError(error, reject);
                }
            },
            fail: (err) => {
                console.error('请求失败:', err);

                if (showLoading) {
                    wx.hideLoading();
                }

                const error = {
                    code: 'NETWORK_ERROR',
                    message: '网络请求失败，请检查网络连接',
                    originalError: err
                };
                handleError(error, reject);
            }
        });
    });
}

/**
 * 处理业务错误
 */
function handleBusinessError(data, reject) {
    const error = {
        code: data.code || 'BUSINESS_ERROR',
        message: data.message || '业务处理失败',
        data: data.data
    };

    // 显示错误提示
    wx.showToast({
        title: error.message,
        icon: 'none',
        duration: 2000
    });

    reject(error);
}

/**
 * 处理认证错误
 */
function handleAuthError(originalOptions, resolve, reject) {
    console.log('认证失败，尝试刷新token');

    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) {
        // 没有刷新token，跳转到登录页
        redirectToLogin();
        reject({
            code: 'NO_REFRESH_TOKEN',
            message: '请重新登录'
        });
        return;
    }

    // 尝试刷新token
    refreshAccessToken()
        .then(() => {
            // 刷新成功，重新发起原请求
            console.log('token刷新成功，重新发起请求');
            request(originalOptions).then(resolve).catch(reject);
        })
        .catch((err) => {
            console.error('token刷新失败:', err);
            // 刷新失败，跳转到登录页
            redirectToLogin();
            reject({
                code: 'REFRESH_TOKEN_FAILED',
                message: '登录已过期，请重新登录'
            });
        });
}

/**
 * 处理通用错误
 */
function handleError(error, reject) {
    console.error('请求错误:', error);

    // 显示错误提示
    wx.showToast({
        title: error.message,
        icon: 'none',
        duration: 2000
    });

    reject(error);
}

/**
 * 刷新访问令牌
 */
function refreshAccessToken() {
    return new Promise((resolve, reject) => {
        const refreshToken = storage.getRefreshToken();
        if (!refreshToken) {
            reject(new Error('没有刷新令牌'));
            return;
        }

        console.log('request.js: 开始刷新访问令牌...');
        wx.request({
            url: currentEnv.getApiUrl('/api/auth/refresh'),
            method: 'POST',
            data: {
                refreshToken
            },
            header: {
                'Content-Type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data.success) {
                    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
                    console.log('request.js: 令牌刷新成功');

                    // 保存新的token
                    storage.setAccessToken(accessToken);
                    if (newRefreshToken) {
                        storage.setRefreshToken(newRefreshToken);
                    }

                    console.log('request.js: 新令牌已保存');
                    resolve();
                } else {
                    console.error('request.js: 刷新token失败:', res.data);
                    reject(new Error('刷新token失败'));
                }
            },
            fail: (err) => {
                console.error('request.js: 刷新token请求失败:', err);
                reject(err);
            }
        });
    });
}

/**
 * 跳转到登录页
 */
function redirectToLogin() {
    // 清除本地存储的认证信息
    storage.clearAuth();

    // 跳转到登录页
    wx.navigateTo({
        url: '/pages/login/login'
    });
}

/**
 * GET请求
 */
function get(url, data = {}, options = {}) {
    return request({
        url,
        method: 'GET',
        data,
        ...options
    });
}

/**
 * POST请求
 */
function post(url, data = {}, options = {}) {
    return request({
        url,
        method: 'POST',
        data,
        ...options
    });
}

/**
 * PUT请求
 */
function put(url, data = {}, options = {}) {
    return request({
        url,
        method: 'PUT',
        data,
        ...options
    });
}

/**
 * DELETE请求
 */
function del(url, data = {}, options = {}) {
    return request({
        url,
        method: 'DELETE',
        data,
        ...options
    });
}

/**
 * 文件上传
 */
function upload(url, filePath, options = {}) {
    return new Promise((resolve, reject) => {
        const {
            name = 'file',
            formData = {},
            header = {},
            needAuth = true,
            showLoading = false,
            loadingTitle = '上传中...'
        } = options;

        if (showLoading) {
            wx.showLoading({
                title: loadingTitle,
                mask: true
            });
        }

        // 构建完整URL
        const fullUrl = url.startsWith('http') ? url : currentEnv.getApiUrl(url);

        // 构建请求头
        const requestHeader = { ...header };
        if (needAuth) {
            const accessToken = storage.getAccessToken();
            if (accessToken) {
                requestHeader['Authorization'] = `Bearer ${accessToken}`;
            }
        }

        wx.uploadFile({
            url: fullUrl,
            filePath,
            name,
            formData,
            header: requestHeader,
            success: (res) => {
                if (showLoading) {
                    wx.hideLoading();
                }

                try {
                    const data = JSON.parse(res.data);
                    if (data.success) {
                        resolve(data);
                    } else {
                        reject({
                            code: 'UPLOAD_FAILED',
                            message: data.message || '上传失败'
                        });
                    }
                } catch (err) {
                    reject({
                        code: 'PARSE_ERROR',
                        message: '响应数据解析失败'
                    });
                }
            },
            fail: (err) => {
                if (showLoading) {
                    wx.hideLoading();
                }
                reject({
                    code: 'UPLOAD_ERROR',
                    message: '上传失败',
                    originalError: err
                });
            }
        });
    });
}

module.exports = {
    request,
    get,
    post,
    put,
    delete: del,
    upload
};
