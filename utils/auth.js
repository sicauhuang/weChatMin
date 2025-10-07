/**
 * 认证工具模块
 * 提供登录、登出、token管理等认证相关功能
 */

const request = require('./request.js');
const storage = require('./storage.js');

/**
 * 微信登录
 * @returns {Promise} 登录结果
 */
function wxLogin() {
    return new Promise((resolve, reject) => {
        console.log('开始微信登录...');

        wx.login({
            success: (res) => {
                if (res.code) {
                    console.log('微信登录成功，code:', res.code);
                    resolve(res.code);
                } else {
                    console.error('微信登录失败:', res.errMsg);
                    reject(new Error('微信登录失败: ' + res.errMsg));
                }
            },
            fail: (err) => {
                console.error('微信登录失败:', err);
                reject(new Error('微信登录失败: ' + err.errMsg));
            }
        });
    });
}

/**
 * 获取手机号授权
 * @param {Object} event 按钮事件对象
 * @returns {Promise} 手机号数据
 */
function getPhoneNumber(event) {
    return new Promise((resolve, reject) => {
        console.log('开始获取手机号授权...');

        const { encryptedData, iv, errMsg } = event.detail;

        if (errMsg === 'getPhoneNumber:ok') {
            console.log('手机号授权成功');
            resolve({
                encryptedData,
                iv
            });
        } else {
            console.error('手机号授权失败:', errMsg);
            reject(new Error('手机号授权失败: ' + errMsg));
        }
    });
}

/**
 * 获取用户详细信息
 * @returns {Promise} 用户信息
 */
async function fetchUserProfile() {
    try {
        console.log('开始获取用户详细信息...');

        const result = await request.get(
            '/api/user/profile',
            {},
            {
                showLoading: false,
                loadingTitle: '获取用户信息...'
            }
        );

        if (result.success && result.data) {
            console.log('用户信息获取成功:', result.data);
            return result.data;
        } else {
            console.log('服务器无用户信息，返回默认信息');
            return {
                phoneNumber: '',
                name: '',
                permissions: ['qrcode', 'buy-car']
            };
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        // 返回默认信息作为备选
        return {
            phoneNumber: '',
            name: '',
            permissions: ['qrcode', 'buy-car']
        };
    }
}

/**
 * 完整的登录流程
 * @param {Object} phoneData 手机号数据
 * @param {string} phoneData.encryptedData 加密数据
 * @param {string} phoneData.iv 初始向量
 * @returns {Promise} 登录结果
 */
async function performLogin(phoneData) {
    try {
        console.log('开始执行统一登录流程...');

        // 1. 获取微信登录code
        const code = await wxLogin();

        // 2. 调用统一登录接口（只获取tokens）
        console.log('调用统一登录接口...');
        const loginResult = await request.post(
            '/api/login',
            {
                code,
                encryptedData: phoneData.encryptedData,
                iv: phoneData.iv
            },
            {
                needAuth: false,
                showLoading: true,
                loadingTitle: '登录中...'
            }
        );

        if (!loginResult.success) {
            throw new Error(loginResult.message || '登录失败');
        }

        const { accessToken, refreshToken } = loginResult.data;
        console.log('统一登录成功，获取到tokens');
        console.log('- accessToken:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
        console.log('- refreshToken:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'null');

        // 3. 保存tokens到本地
        storage.setAccessToken(accessToken);
        storage.setRefreshToken(refreshToken);
        storage.setLoginStatus(true);

        // 4. 获取用户详细信息
        console.log('获取用户详细信息...');
        const userProfile = await fetchUserProfile();

        // 5. 构建完整的用户信息并保存
        const loginData = {
            accessToken,
            refreshToken,
            userInfo: {
                userId: userProfile.userId, // 新增userId字段
                avatarUrl: '/assets/imgs/logo.png', // 使用logo作为头像
                identity: '游客', // 身份信息
                phoneNumber: userProfile.phoneNumber,
                name: userProfile.name,
                permissions: userProfile.permissions
            }
        };

        // 保存用户信息
        storage.setUserInfo(loginData.userInfo);

        console.log('登录流程完成');
        return {
            success: true,
            message: '登录成功',
            data: loginData
        };
    } catch (error) {
        console.error('登录流程失败:', error);
        // 登录失败时清除可能的部分数据
        storage.clearAuth();
        throw error;
    }
}

/**
 * 生成访问令牌（模拟实现）
 * @param {string} openid 用户openid
 * @returns {string} 访问令牌
 */
function generateAccessToken(openid) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `access_${openid}_${timestamp}_${random}`;
}

/**
 * 生成刷新令牌（模拟实现）
 * @param {string} openid 用户openid
 * @returns {string} 刷新令牌
 */
function generateRefreshToken(openid) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `refresh_${openid}_${timestamp}_${random}`;
}

/**
 * 检查登录状态
 * @returns {boolean} 是否已登录
 */
function checkLoginStatus() {
    return storage.isLoggedIn();
}

/**
 * 获取当前用户信息
 * @returns {Object|null} 用户信息
 */
function getCurrentUser() {
    if (!checkLoginStatus()) {
        return null;
    }

    return storage.getLoginData();
}

/**
 * 登出
 * @returns {Promise} 登出结果
 */
function logout() {
    return new Promise((resolve) => {
        console.log('用户登出...');

        // 清除本地存储
        storage.logout();

        // 显示登出成功提示
        wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
        });

        resolve({
            success: true,
            message: '登出成功'
        });
    });
}

/**
 * 通用重试工具函数
 * @param {Function} operation 要执行的异步操作
 * @param {number} maxRetries 最大重试次数
 * @param {number} baseDelay 基础延迟时间（毫秒）
 * @returns {Promise} 操作结果
 */
async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = baseDelay * attempt; // 递增延迟：1s, 2s, 3s
                console.log(`第${attempt}次重试，延迟${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            const result = await operation();

            if (attempt > 0) {
                console.log(`重试成功，第${attempt}次尝试`);
            }

            return result;
        } catch (error) {
            lastError = error;
            console.error(`操作失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message);

            if (attempt === maxRetries) {
                console.error('所有重试都失败了，抛出最后一个错误');
                throw lastError;
            }
        }
    }
}

/**
 * 刷新用户信息（带重试机制）
 * @returns {Promise} 刷新结果
 */
async function refreshUserInfo() {
    try {
        if (!checkLoginStatus()) {
            throw new Error('用户未登录');
        }

        console.log('开始刷新用户信息（带重试机制）...');

        // 使用重试机制执行用户信息刷新
        const userProfile = await retryOperation(async () => {
            console.log('执行用户信息获取...');
            return await fetchUserProfile();
        }, 3, 1000);

        // 构建用户信息对象
        const userInfo = {
            userId: userProfile.userId, // 新增userId字段
            nickName: userProfile.phoneNumber || '微信用户',
            avatarUrl: '/assets/imgs/logo.png', // 使用logo作为头像
            identity: '游客', // 身份信息
            phoneNumber: userProfile.phoneNumber,
            name: userProfile.name,
            permissions: userProfile.permissions
        };

        // 更新本地用户信息
        storage.updateUserInfo(userInfo);
        console.log('用户信息刷新成功（含重试机制）');
        return userInfo;
    } catch (error) {
        console.error('用户信息刷新最终失败（已重试3次）:', error);
        // 返回本地信息作为备选
        const localUserInfo = storage.getUserInfo();
        return localUserInfo || {
            nickName: '微信用户',
            avatarUrl: '/assets/imgs/touxiang.png',
            identity: '未登录',
            phoneNumber: '',
            name: '',
            permissions: ['qrcode', 'buy-car']
        };
    }
}

/**
 * 更新用户信息到服务器
 * @param {Object} userInfo 用户信息
 * @returns {Promise} 更新结果
 */
async function updateUserInfo(userInfo) {
    try {
        const loginData = storage.getLoginData();
        if (!loginData.openid) {
            throw new Error('用户未登录');
        }

        console.log('更新用户信息到服务器...');
        const result = await request.post(
            '/api/save-user-info',
            {
                openid: loginData.openid,
                ...userInfo
            },
            {
                showLoading: true,
                loadingTitle: '保存用户信息...'
            }
        );

        if (result.success) {
            // 更新本地用户信息
            storage.updateUserInfo(userInfo);
            console.log('用户信息更新成功');
            return result;
        } else {
            throw new Error(result.message || '更新用户信息失败');
        }
    } catch (error) {
        console.error('更新用户信息失败:', error);
        throw error;
    }
}

/**
 * 刷新访问令牌
 * @returns {Promise} 刷新结果
 */
async function refreshToken() {
    try {
        const refreshToken = storage.getRefreshToken();
        if (!refreshToken) {
            throw new Error('没有刷新令牌');
        }

        console.log('开始刷新访问令牌...');
        const result = await request.post(
            '/api/auth/refresh',
            {
                refreshToken
            },
            {
                needAuth: false,
                showLoading: false
            }
        );

        if (!result.success) {
            throw new Error(result.message || '刷新令牌失败');
        }

        const { accessToken, refreshToken: newRefreshToken } = result.data;
        console.log('令牌刷新成功');

        // 保存新的令牌
        storage.setAccessToken(accessToken);
        if (newRefreshToken) {
            storage.setRefreshToken(newRefreshToken);
        }

        console.log('新令牌已保存');
        return {
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken || refreshToken
            }
        };
    } catch (error) {
        console.error('刷新令牌失败:', error);
        // 刷新失败，清除本地认证信息
        storage.clearAuth();
        throw error;
    }
}

/**
 * 检查并处理登录状态
 * 在应用启动时调用，检查本地登录状态的有效性
 */
async function checkAndHandleLoginStatus() {
    try {
        const isLoggedIn = checkLoginStatus();
        console.log('检查登录状态:', isLoggedIn);

        if (isLoggedIn) {
            const refreshTokenValue = storage.getRefreshToken();

            if (refreshTokenValue) {
                try {
                    // 检测到refreshToken，执行刷新流程
                    console.log('检测到refreshToken，执行刷新流程...');
                    await refreshToken();
                    console.log('令牌刷新成功，登录状态有效');

                    // 刷新用户信息
                    await refreshUserInfo();
                    return true;
                } catch (refreshError) {
                    console.error('令牌刷新失败:', refreshError);
                    // 刷新失败，清除登录状态
                    storage.clearAuth();
                    return false;
                }
            } else {
                // 没有refreshToken，但有登录状态，尝试验证
                console.log('没有refreshToken，尝试验证当前登录状态...');
                try {
                    await refreshUserInfo();
                    console.log('登录状态验证成功');
                    return true;
                } catch (error) {
                    console.error('登录状态验证失败:', error);
                    storage.clearAuth();
                    return false;
                }
            }
        } else {
            console.log('用户未登录');
            return false;
        }
    } catch (error) {
        console.error('登录状态检查失败:', error);
        // 如果检查失败，清除本地登录状态
        storage.clearAuth();
        return false;
    }
}

/**
 * 强制跳转到登录页
 */
function redirectToLogin() {
    wx.navigateTo({
        url: '/pages/login/login'
    });
}

/**
 * 需要登录的页面守卫
 * @param {Function} callback 登录成功后的回调
 * @param {boolean} showTip 是否显示提示
 */
function requireLogin(callback, showTip = true) {
    if (checkLoginStatus()) {
        // 已登录，执行回调
        if (typeof callback === 'function') {
            callback();
        }
        return true;
    } else {
        // 未登录，显示提示并跳转
        if (showTip) {
            wx.showModal({
                title: '提示',
                content: '请先登录后再使用此功能',
                showCancel: true,
                cancelText: '取消',
                confirmText: '去登录',
                success: (res) => {
                    if (res.confirm) {
                        redirectToLogin();
                    }
                }
            });
        } else {
            redirectToLogin();
        }
        return false;
    }
}

module.exports = {
    // 登录相关
    wxLogin,
    getPhoneNumber,
    performLogin,
    logout,

    // 状态检查
    checkLoginStatus,
    getCurrentUser,
    checkAndHandleLoginStatus,

    // token管理
    refreshToken,

    // 用户信息管理
    fetchUserProfile,
    refreshUserInfo,
    updateUserInfo,

    // 工具方法
    redirectToLogin,
    requireLogin,
    retryOperation,

    // 内部方法（供测试使用）
    generateAccessToken,
    generateRefreshToken
};
