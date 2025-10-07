/**
 * 本地存储工具封装
 * 提供统一的存储接口，管理用户认证信息和其他数据
 */

// 存储键名常量
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_INFO: 'user_info',
    PHONE_NUMBER: 'phone_number',
    LOGIN_STATUS: 'login_status',
    OPENID: 'openid'
};

/**
 * 设置存储数据
 * @param {string} key 存储键
 * @param {any} value 存储值
 * @returns {boolean} 是否成功
 */
function setStorage(key, value) {
    try {
        wx.setStorageSync(key, value);
        console.log(`存储数据成功: ${key}`);
        return true;
    } catch (error) {
        console.error(`存储数据失败: ${key}`, error);
        return false;
    }
}

/**
 * 获取存储数据
 * @param {string} key 存储键
 * @param {any} defaultValue 默认值
 * @returns {any} 存储的值或默认值
 */
function getStorage(key, defaultValue = null) {
    try {
        const value = wx.getStorageSync(key);
        return value !== '' ? value : defaultValue;
    } catch (error) {
        console.error(`获取存储数据失败: ${key}`, error);
        return defaultValue;
    }
}

/**
 * 删除存储数据
 * @param {string} key 存储键
 * @returns {boolean} 是否成功
 */
function removeStorage(key) {
    try {
        wx.removeStorageSync(key);
        console.log(`删除存储数据成功: ${key}`);
        return true;
    } catch (error) {
        console.error(`删除存储数据失败: ${key}`, error);
        return false;
    }
}

/**
 * 清空所有存储数据
 * @returns {boolean} 是否成功
 */
function clearStorage() {
    try {
        wx.clearStorageSync();
        console.log('清空所有存储数据成功');
        return true;
    } catch (error) {
        console.error('清空存储数据失败', error);
        return false;
    }
}

// ==================== 认证相关 ====================

/**
 * 设置访问令牌
 * @param {string} token 访问令牌
 */
function setAccessToken(token) {
    return setStorage(STORAGE_KEYS.ACCESS_TOKEN, token);
}

/**
 * 获取访问令牌
 * @returns {string|null} 访问令牌
 */
function getAccessToken() {
    return getStorage(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * 设置刷新令牌
 * @param {string} token 刷新令牌
 */
function setRefreshToken(token) {
    return setStorage(STORAGE_KEYS.REFRESH_TOKEN, token);
}

/**
 * 获取刷新令牌
 * @returns {string|null} 刷新令牌
 */
function getRefreshToken() {
    return getStorage(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * 设置OpenID
 * @param {string} openid 微信OpenID
 */
function setOpenId(openid) {
    return setStorage(STORAGE_KEYS.OPENID, openid);
}

/**
 * 获取OpenID
 * @returns {string|null} 微信OpenID
 */
function getOpenId() {
    return getStorage(STORAGE_KEYS.OPENID);
}

/**
 * 设置手机号
 * @param {string} phoneNumber 手机号
 */
function setPhoneNumber(phoneNumber) {
    return setStorage(STORAGE_KEYS.PHONE_NUMBER, phoneNumber);
}

/**
 * 获取手机号
 * @returns {string|null} 手机号
 */
function getPhoneNumber() {
    return getStorage(STORAGE_KEYS.PHONE_NUMBER);
}

/**
 * 设置登录状态
 * @param {boolean} status 登录状态
 */
function setLoginStatus(status) {
    return setStorage(STORAGE_KEYS.LOGIN_STATUS, status);
}

/**
 * 获取登录状态
 * @returns {boolean} 登录状态
 */
function getLoginStatus() {
    return getStorage(STORAGE_KEYS.LOGIN_STATUS, false);
}

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
    const accessToken = getAccessToken();
    const loginStatus = getLoginStatus();
    return !!(accessToken && loginStatus);
}

/**
 * 检查token是否即将过期
 * @param {number} threshold 提前刷新的时间阈值（分钟），默认30分钟
 * @returns {boolean} 是否即将过期
 */
function isTokenExpiringSoon(threshold = 30) {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return false;
    }

    try {
        // 解析token中的时间戳（假设token格式为 access_openid_timestamp_random）
        const parts = accessToken.split('_');
        if (parts.length >= 3) {
            const timestamp = parseInt(parts[2]);
            if (!isNaN(timestamp)) {
                const tokenTime = timestamp;
                const currentTime = Date.now();
                const timeDiff = currentTime - tokenTime;

                // token有效期24小时，提前threshold分钟刷新
                const tokenValidTime = 24 * 60 * 60 * 1000; // 24小时
                const refreshThreshold = threshold * 60 * 1000; // threshold分钟

                return timeDiff > (tokenValidTime - refreshThreshold);
            }
        }
    } catch (error) {
        console.error('解析token时间戳失败:', error);
    }

    return false;
}

/**
 * 检查token是否已过期
 * @returns {boolean} 是否已过期
 */
function isTokenExpired() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return true;
    }

    try {
        // 解析token中的时间戳
        const parts = accessToken.split('_');
        if (parts.length >= 3) {
            const timestamp = parseInt(parts[2]);
            if (!isNaN(timestamp)) {
                const tokenTime = timestamp;
                const currentTime = Date.now();
                const timeDiff = currentTime - tokenTime;

                // token有效期24小时
                const tokenValidTime = 24 * 60 * 60 * 1000;

                return timeDiff > tokenValidTime;
            }
        }
    } catch (error) {
        console.error('解析token时间戳失败:', error);
    }

    return true;
}

/**
 * 获取token剩余有效时间（毫秒）
 * @returns {number} 剩余时间，-1表示无法计算
 */
function getTokenRemainingTime() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return -1;
    }

    try {
        const parts = accessToken.split('_');
        if (parts.length >= 3) {
            const timestamp = parseInt(parts[2]);
            if (!isNaN(timestamp)) {
                const tokenTime = timestamp;
                const currentTime = Date.now();
                const timeDiff = currentTime - tokenTime;

                // token有效期24小时
                const tokenValidTime = 24 * 60 * 60 * 1000;
                const remainingTime = tokenValidTime - timeDiff;

                return Math.max(0, remainingTime);
            }
        }
    } catch (error) {
        console.error('计算token剩余时间失败:', error);
    }

    return -1;
}

/**
 * 清除认证信息
 */
function clearAuth() {
    removeStorage(STORAGE_KEYS.ACCESS_TOKEN);
    removeStorage(STORAGE_KEYS.REFRESH_TOKEN);
    removeStorage(STORAGE_KEYS.LOGIN_STATUS);
    removeStorage(STORAGE_KEYS.OPENID);
    removeStorage(STORAGE_KEYS.PHONE_NUMBER);
    console.log('已清除所有认证信息');
}

// ==================== 用户信息相关 ====================

/**
 * 设置用户信息
 * @param {Object} userInfo 用户信息
 * @param {string} userInfo.nickName 昵称
 * @param {string} userInfo.avatarUrl 头像URL
 * @param {string} userInfo.phoneNumber 手机号
 * @param {string} userInfo.openid OpenID
 */
function setUserInfo(userInfo) {
    const userData = {
        ...userInfo,
        updateTime: new Date().toISOString()
    };
    return setStorage(STORAGE_KEYS.USER_INFO, userData);
}

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息
 */
function getUserInfo() {
    return getStorage(STORAGE_KEYS.USER_INFO);
}

/**
 * 更新用户信息
 * @param {Object} updates 要更新的字段
 */
function updateUserInfo(updates) {
    const currentInfo = getUserInfo() || {};
    const newInfo = {
        ...currentInfo,
        ...updates,
        updateTime: new Date().toISOString()
    };
    console.log('更新用户信息，添加时间戳:', newInfo.updateTime);
    return setUserInfo(newInfo);
}

/**
 * 清除用户信息
 */
function clearUserInfo() {
    return removeStorage(STORAGE_KEYS.USER_INFO);
}

// ==================== 登录相关业务方法 ====================

/**
 * 保存登录信息
 * @param {Object} loginData 登录数据
 * @param {string} loginData.accessToken 访问令牌
 * @param {string} loginData.refreshToken 刷新令牌
 * @param {string} loginData.openid OpenID
 * @param {string} loginData.phoneNumber 手机号
 * @param {Object} loginData.userInfo 用户信息
 */
function saveLoginData(loginData) {
    const {
        accessToken,
        refreshToken,
        openid,
        phoneNumber,
        userInfo
    } = loginData;

    // 保存认证信息
    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    if (openid) setOpenId(openid);
    if (phoneNumber) setPhoneNumber(phoneNumber);

    // 保存用户信息
    if (userInfo) {
        setUserInfo({
            ...userInfo,
            openid,
            phoneNumber
        });
    }

    // 设置登录状态
    setLoginStatus(true);

    console.log('登录信息保存成功');
}

/**
 * 获取完整的登录信息
 * @returns {Object} 登录信息
 */
function getLoginData() {
    return {
        accessToken: getAccessToken(),
        refreshToken: getRefreshToken(),
        openid: getOpenId(),
        phoneNumber: getPhoneNumber(),
        userInfo: getUserInfo(),
        isLoggedIn: isLoggedIn()
    };
}

/**
 * 登出
 */
function logout() {
    clearAuth();
    clearUserInfo();
    console.log('用户已登出');
}

// ==================== 工具方法 ====================

/**
 * 获取存储信息统计
 * @returns {Object} 存储统计信息
 */
function getStorageInfo() {
    try {
        const info = wx.getStorageInfoSync();
        return {
            keys: info.keys,
            currentSize: info.currentSize,
            limitSize: info.limitSize
        };
    } catch (error) {
        console.error('获取存储信息失败', error);
        return null;
    }
}

/**
 * 打印所有存储的数据（调试用）
 */
function debugStorage() {
    console.log('=== 存储数据调试信息 ===');
    Object.values(STORAGE_KEYS).forEach(key => {
        const value = getStorage(key);
        console.log(`${key}:`, value);
    });
    console.log('存储统计:', getStorageInfo());
    console.log('=== 存储数据调试信息结束 ===');
}

module.exports = {
    // 基础存储方法
    setStorage,
    getStorage,
    removeStorage,
    clearStorage,

    // 认证相关
    setAccessToken,
    getAccessToken,
    setRefreshToken,
    getRefreshToken,
    setOpenId,
    getOpenId,
    setPhoneNumber,
    getPhoneNumber,
    setLoginStatus,
    getLoginStatus,
    isLoggedIn,
    clearAuth,

    // token有效性检查
    isTokenExpiringSoon,
    isTokenExpired,
    getTokenRemainingTime,

    // 用户信息相关
    setUserInfo,
    getUserInfo,
    updateUserInfo,
    clearUserInfo,

    // 登录业务方法
    saveLoginData,
    getLoginData,
    logout,

    // 工具方法
    getStorageInfo,
    debugStorage,

    // 常量
    STORAGE_KEYS
};
