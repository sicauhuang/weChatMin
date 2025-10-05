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

        // 2. 调用统一登录接口（包含微信登录验证和手机号解密）
        console.log('调用统一登录接口...');
        const loginResult = await request.post('/api/login', {
            code,
            encryptedData: phoneData.encryptedData,
            iv: phoneData.iv
        }, {
            needAuth: false,
            showLoading: true,
            loadingTitle: '登录中...'
        });

        if (!loginResult.success) {
            throw new Error(loginResult.message || '登录失败');
        }

        const { accessToken, refreshToken, phoneNumber, openid } = loginResult.data;
        console.log('统一登录成功');
        console.log('- openid:', openid);
        console.log('- phoneNumber:', phoneNumber);
        console.log('- accessToken:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');

        // 3. 保存登录信息
        const loginData = {
            accessToken,
            refreshToken,
            openid,
            phoneNumber,
            userInfo: {
                nickName: phoneNumber, // 使用手机号作为昵称
                avatarUrl: '/assets/imgs/logo.png', // 使用logo作为头像
                identity: '游客', // 身份信息
                phoneNumber
            }
        };

        storage.saveLoginData(loginData);

        console.log('登录流程完成');
        return {
            success: true,
            message: '登录成功',
            data: loginData
        };

    } catch (error) {
        console.error('登录流程失败:', error);
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
 * 刷新用户信息
 * @returns {Promise} 刷新结果
 */
async function refreshUserInfo() {
    try {
        const loginData = storage.getLoginData();
        if (!loginData.openid) {
            throw new Error('用户未登录');
        }

        console.log('刷新用户信息...');
        const result = await request.get(`/api/get-user-info/${loginData.openid}`, {}, {
            showLoading: true,
            loadingTitle: '获取用户信息...'
        });

        if (result.success && result.data) {
            // 更新本地用户信息
            storage.updateUserInfo(result.data);
            console.log('用户信息刷新成功');
            return result.data;
        } else {
            console.log('服务器无用户信息，使用本地信息');
            return loginData.userInfo;
        }

    } catch (error) {
        console.error('刷新用户信息失败:', error);
        // 返回本地信息作为备选
        return storage.getUserInfo();
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
        const result = await request.post('/api/save-user-info', {
            openid: loginData.openid,
            ...userInfo
        }, {
            showLoading: true,
            loadingTitle: '保存用户信息...'
        });

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
        const result = await request.post('/api/auth/refresh', {
            refreshToken
        }, {
            needAuth: false,
            showLoading: false
        });

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
    refreshUserInfo,
    updateUserInfo,

    // 工具方法
    redirectToLogin,
    requireLogin,

    // 内部方法（供测试使用）
    generateAccessToken,
    generateRefreshToken
};
