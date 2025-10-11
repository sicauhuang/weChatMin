/**
 * 认证工具模块
 * 提供登录、登出、token管理等认证相关功能
 */

const request = require('./request.js');
const storage = require('./storage.js');
const permission = require('./permission.js');
const SUCCESS_CODE = '200';
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
 * 获取用户详细信息（带重试机制）
 * @param {number} maxRetries 最大重试次数，默认3次
 * @returns {Promise} 标准化用户信息
 */
async function fetchUserProfile(maxRetries = 3) {
    // 使用重试机制执行用户信息获取
    return await retryOperation(
        async () => {
            console.log('执行用户信息获取...');

            const result = await request.get(
                '/api/mp/user/query-user-profile',
                {},
                {
                    showLoading: false,
                    loadingTitle: '获取用户信息...'
                }
            );

            if (result && result) {
                console.log('用户信息获取成功:', result);

                // 数据模型转换：将API响应转换为标准化用户信息
                const standardizedUserInfo = {
                    userId: result.userId,
                    phoneNumber: result.phone || '',
                    name: result.name || '',
                    // 优先使用miniProgramPermList，兼容permissions字段
                    permissions: result.miniProgramPermList || result.permissions || [],
                    roleId: result.roleId,
                    roleName: result.roleName || '游客'
                };

                console.log('标准化用户信息:', {
                    ...standardizedUserInfo,
                    permissionSource: result.miniProgramPermList ? 'miniProgramPermList' : 
                                    result.permissions ? 'permissions' : 'empty'
                });

                // 缓存用户信息到本地存储
                const cachedUserInfo = {
                    ...standardizedUserInfo,
                    avatarUrl: '/assets/imgs/logo.png',
                    identity: standardizedUserInfo.roleName,
                    nickName: standardizedUserInfo.phoneNumber || '微信用户',
                    // 保留miniProgramPermList字段用于兼容性
                    miniProgramPermList: result.miniProgramPermList || [],
                    cacheTime: Date.now() // 添加缓存时间戳
                };
                storage.updateUserInfo(cachedUserInfo);
                console.log('用户信息已缓存到本地');

                // 初始化权限系统
                try {
                    permission.initPermissions(standardizedUserInfo.permissions, {
                        userId: standardizedUserInfo.userId,
                        roleId: standardizedUserInfo.roleId,
                        roleName: standardizedUserInfo.roleName
                    });
                    console.log('权限系统初始化成功');
                } catch (permissionError) {
                    console.error('权限系统初始化失败:', permissionError);
                }

                return standardizedUserInfo;
            } else {
                console.log('服务器返回无效数据，使用默认信息');
                throw new Error('服务器返回无效数据');
            }
        },
        maxRetries,
        1000 // 基础延迟1秒
    ).catch((error) => {
        console.error(`用户信息获取最终失败（已重试${maxRetries}次）:`, error);

        // 尝试从本地缓存获取
        const cachedUserInfo = storage.getUserInfo();
        if (cachedUserInfo && cachedUserInfo.cacheTime) {
            const cacheAge = Date.now() - cachedUserInfo.cacheTime;
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24小时

            if (cacheAge < maxCacheAge) {
                console.log('使用本地缓存的用户信息');
                return {
                    userId: cachedUserInfo.userId,
                    phoneNumber: cachedUserInfo.phoneNumber || '',
                    name: cachedUserInfo.name || '',
                    // 优先使用permissions，其次使用miniProgramPermList
                    permissions: cachedUserInfo.permissions || cachedUserInfo.miniProgramPermList || [],
                    roleId: cachedUserInfo.roleId,
                    roleName: cachedUserInfo.roleName || '游客'
                };
            }
        }

        // 返回默认信息作为最后的备选
        console.log('无有效缓存，返回默认用户信息');
        return getDefaultUserInfo();
    });
}

/**
 * 获取默认用户信息
 * @returns {Object} 默认用户信息
 */
function getDefaultUserInfo() {
    return {
        userId: null,
        phoneNumber: '',
        name: '',
        permissions: [],
        roleId: null,
        roleName: '游客'
    };
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
        console.log('调用统一登录接口...', {
            code,
            encryptedData: phoneData.encryptedData,
            iv: phoneData.iv
        });
        const loginResult = await request.post(
            '/api/mp/auth/login',
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

        // request.js已经预处理成功响应，直接使用数据
        // 如果这里没有抛出异常，说明登录成功
        const { accessToken, refreshToken } = loginResult;
        console.log('统一登录成功，获取到tokens');
        console.log('- accessToken:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
        console.log('- refreshToken:', refreshToken);

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
                userId: userProfile.userId,
                avatarUrl: '/assets/imgs/logo.png', // 使用logo作为头像
                identity: userProfile.roleName || '游客', // 使用roleName作为身份显示
                phoneNumber: userProfile.phoneNumber,
                name: userProfile.name,
                permissions: userProfile.permissions,
                roleId: userProfile.roleId,
                roleName: userProfile.roleName
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
 * @param {Object} options 登出配置参数
 * @param {boolean} options.serverLogout 是否调用服务端登出接口，默认true
 * @param {boolean} options.showLoading 是否显示加载提示，默认true
 * @param {string} options.redirectTo 登出后跳转的页面，可选
 * @returns {Promise} 登出结果
 */
async function logout(options = {}) {
    const { serverLogout = true, showLoading = true, redirectTo = null } = options;

    console.log('用户登出...，配置:', { serverLogout, showLoading, redirectTo });

    try {
        // 显示加载提示
        if (showLoading) {
            wx.showLoading({
                title: '退出中...',
                mask: true
            });
        }

        // 检查登录状态
        const isLoggedIn = checkLoginStatus();

        // 如果用户已登录且需要服务端登出，则调用登出接口
        if (isLoggedIn && serverLogout) {
            try {
                console.log('调用服务端登出接口...');
                const result = await request.post(
                    '/api/mp/auth/logout',
                    {},
                    {
                        needAuth: true,
                        showLoading: false // 已经显示了全局加载
                    }
                );

                // request.js已经预处理成功响应，如果这里没有抛出异常说明服务端登出成功
                console.log('服务端登出成功');
            } catch (serverError) {
                console.warn('服务端登出出现异常，但继续执行本地清理:', serverError.message);
            }
        }

        // 无论服务端登出是否成功，都执行本地清理
        console.log('执行本地数据清理...');
        storage.logout();
        
        // 清除权限数据
        try {
            permission.clearPermissions();
            console.log('权限数据已清除');
        } catch (permissionError) {
            console.error('清除权限数据失败:', permissionError);
        }

        // 隐藏加载提示
        if (showLoading) {
            wx.hideLoading();
        }

        // 显示登出成功提示
        wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
        });

        // 处理页面跳转
        if (redirectTo) {
            setTimeout(() => {
                wx.navigateTo({
                    url: redirectTo,
                    fail: () => {
                        // 如果跳转失败，尝试重定向
                        wx.redirectTo({
                            url: redirectTo,
                            fail: () => {
                                console.warn('页面跳转失败:', redirectTo);
                            }
                        });
                    }
                });
            }, 1600); // 等待Toast显示完成后跳转
        }

        console.log('登出流程完成');
        return {
            success: true,
            message: '登出成功'
        };
    } catch (error) {
        console.error('登出流程出现异常:', error);

        // 隐藏加载提示
        if (showLoading) {
            wx.hideLoading();
        }

        // 即使出现异常，也要执行本地清理以确保系统安全
        storage.logout();
        
        // 清除权限数据
        try {
            permission.clearPermissions();
        } catch (permissionError) {
            console.error('清除权限数据失败:', permissionError);
        }

        wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
        });

        return {
            success: true,
            message: '登出成功',
            warning: error.message
        };
    }
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
                await new Promise((resolve) => setTimeout(resolve, delay));
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
        const userProfile = await retryOperation(
            async () => {
                console.log('执行用户信息获取...');
                return await fetchUserProfile();
            },
            3,
            1000
        );

        // 构建用户信息对象
        const userInfo = {
            userId: userProfile.userId,
            nickName: userProfile.phoneNumber || '微信用户',
            avatarUrl: '/assets/imgs/logo.png', // 使用logo作为头像
            identity: userProfile.roleName || '游客', // 使用roleName作为身份显示
            phoneNumber: userProfile.phoneNumber,
            name: userProfile.name,
            permissions: userProfile.permissions,
            // 保留miniProgramPermList字段用于兼容性
            miniProgramPermList: userProfile.permissions || [],
            roleId: userProfile.roleId,
            roleName: userProfile.roleName
        };

        // 更新本地用户信息
        storage.updateUserInfo(userInfo);
        console.log('用户信息刷新成功（含重试机制）');
        
        // 刷新权限系统
        try {
            permission.initPermissions(userProfile.permissions, {
                userId: userProfile.userId,
                roleId: userProfile.roleId,
                roleName: userProfile.roleName
            });
            console.log('权限系统刷新成功');
        } catch (permissionError) {
            console.error('权限系统刷新失败:', permissionError);
        }
        return userInfo;
    } catch (error) {
        console.error('用户信息刷新最终失败（已重试3次）:', error);
        // 返回本地信息作为备选
        const localUserInfo = storage.getUserInfo();
        return (
            localUserInfo || {
                userId: null,
                nickName: '微信用户',
                avatarUrl: '/assets/imgs/touxiang.png',
                identity: '未登录',
                phoneNumber: '',
                name: '',
                permissions: [],
                roleId: null,
                roleName: '游客'
            }
        );
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
        const refreshTokenValue = storage.getRefreshToken();
        const accessTokenValue = storage.getAccessToken();
        if (!refreshTokenValue) {
            throw new Error('没有刷新令牌');
        }

        console.log('开始刷新访问令牌...', accessTokenValue);
        const result = await request.post(
            '/api/mp/auth/refresh-token',
            {
                refreshToken: refreshTokenValue
            },
            {
                needAuth: true,
                showLoading: false
            }
        );

        // request.js已经预处理成功响应，直接使用数据
        const { accessToken, expiresIn, refreshToken: newRefreshToken } = result;
        console.log('令牌刷新成功，过期时间:', expiresIn, '秒');

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
                refreshToken: newRefreshToken || refreshTokenValue,
                expiresIn
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

/**
 * 用户注销（解绑小程序）
 * @param {Object} options 注销配置选项
 * @param {boolean} options.showConfirm 是否显示确认对话框，默认true
 * @param {boolean} options.showLoading 是否显示加载提示，默认true
 * @param {string} options.redirectTo 注销后跳转页面，默认登录页
 * @returns {Promise<Object>} 注销操作结果
 */
async function unbindMiniProgram(options = {}) {
    const { showConfirm = true, showLoading = true, redirectTo = '/pages/login/login' } = options;

    console.log('开始用户注销流程...', { showConfirm, showLoading, redirectTo });

    try {
        // 防重复调用机制
        if (unbindMiniProgram._isUnbinding) {
            return Promise.reject(new Error('注销操作正在进行中'));
        }
        unbindMiniProgram._isUnbinding = true;

        // 显示确认对话框
        if (showConfirm) {
            const confirmResult = await new Promise((resolve) => {
                wx.showModal({
                    title: '确认注销',
                    content: '注销后将清除所有数据，且无法恢复。确定要注销吗？',
                    showCancel: true,
                    cancelText: '取消',
                    confirmText: '确认注销',
                    confirmColor: '#ff4444',
                    success: (res) => {
                        resolve(res.confirm);
                    },
                    fail: () => {
                        resolve(false);
                    }
                });
            });

            if (!confirmResult) {
                console.log('用户取消注销操作');
                unbindMiniProgram._isUnbinding = false;
                return {
                    success: false,
                    message: '用户取消注销操作'
                };
            }
        }

        // 检查登录状态
        const isLoggedIn = checkLoginStatus();
        if (!isLoggedIn) {
            unbindMiniProgram._isUnbinding = false;
            wx.showToast({
                title: '用户未登录',
                icon: 'none',
                duration: 2000
            });
            return {
                success: false,
                message: '用户未登录'
            };
        }

        // 显示加载提示
        if (showLoading) {
            wx.showLoading({
                title: '注销中...',
                mask: true
            });
        }

        let serverSuccess = false;
        let serverError = null;

        // 调用服务端注销接口
        try {
            console.log('调用服务端泣销接口...');
            const result = await request.post(
                '/api/mp/user/unbind-miniprogram',
                {},
                {
                    needAuth: true,
                    showLoading: false // 已经显示了全局加载
                }
            );

            // request.js已经预处理成功响应，如果这里没有抛出异常说明服务端注销成功
            console.log('服务端注销成功');
            serverSuccess = true;
        } catch (error) {
            console.warn('服务端注销出现异常，但继续执行本地清理:', error.message);
            serverError = error.message;
        }

        // 执行现有的登出逻辑（本地清理）
        console.log('执行本地数据清理...');
        await logout({
            serverLogout: false, // 不再调用服务端登出，因为已经调用了注销接口
            showLoading: false, // 不显示加载提示，使用统一的加载提示
            redirectTo: null // 不在logout中进行跳转，统一在注销方法中处理
        });

        // 隐藏加载提示
        if (showLoading) {
            wx.hideLoading();
        }

        // 显示注销成功提示
        wx.showToast({
            title: '注销成功',
            icon: 'success',
            duration: 1500
        });

        // 处理页面跳转
        if (redirectTo) {
            setTimeout(() => {
                wx.navigateTo({
                    url: redirectTo,
                    fail: () => {
                        // 如果跳转失败，尝试重定向
                        wx.redirectTo({
                            url: redirectTo,
                            fail: () => {
                                console.warn('页面跳转失败:', redirectTo);
                            }
                        });
                    }
                });
            }, 1600); // 等待Toast显示完成后跳转
        }

        unbindMiniProgram._isUnbinding = false;

        console.log('用户注销流程完成');
        return {
            success: true,
            serverSuccess,
            localCleared: true,
            message: '注销成功',
            warning: serverError ? `服务端处理异常: ${serverError}` : null
        };
    } catch (error) {
        console.error('注销流程出现异常:', error);

        // 隐藏加载提示
        if (showLoading) {
            wx.hideLoading();
        }

        // 即使出现异常，也要执行本地清理以确保系统安全
        try {
            console.log('执行紧急本地数据清理...');
            storage.logout();
            permission.clearPermissions();
        } catch (cleanupError) {
            console.error('本地数据清理失败:', cleanupError);
        }

        unbindMiniProgram._isUnbinding = false;

        wx.showToast({
            title: '注销异常，已清理本地数据',
            icon: 'none',
            duration: 2000
        });

        return {
            success: false,
            serverSuccess: false,
            localCleared: true,
            message: '注销过程出现异常，但已清理本地数据',
            error: error.message
        };
    }
}

module.exports = {
    // 登录相关
    wxLogin,
    getPhoneNumber,
    performLogin,
    logout,
    unbindMiniProgram,

    // 状态检查
    checkLoginStatus,
    getCurrentUser,
    checkAndHandleLoginStatus,

    // token管理
    refreshToken,

    // 用户信息管理
    fetchUserProfile,
    getDefaultUserInfo,
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
