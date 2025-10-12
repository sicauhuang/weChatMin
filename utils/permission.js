/**
 * 权限管理模块
 * 提供统一的权限验证和管理功能
 */

const storage = require('./storage.js');
const auth = require('./auth.js');

/**
 * 权限缓存管理器
 */
class PermissionCache {
    constructor() {
        this.memoryCache = null;
        this.cacheExpireTime = 30 * 60 * 1000; // 30分钟缓存过期
    }

    /**
     * 设置权限缓存
     * @param {Array} permissions 权限列表
     * @param {Object} metadata 元数据
     */
    setCache(permissions, metadata = {}) {
        this.memoryCache = {
            permissions: permissions || [],
            metadata: {
                userId: metadata.userId,
                roleId: metadata.roleId,
                roleName: metadata.roleName,
                ...metadata
            },
            cacheTime: Date.now(),
            expireTime: Date.now() + this.cacheExpireTime
        };

        // 同时存储到本地
        storage.setStorage('permission_cache', this.memoryCache);
        console.log('权限数据已缓存:', {
            permissions: permissions?.length || 0,
            expireTime: new Date(this.memoryCache.expireTime).toLocaleString()
        });
    }

    /**
     * 获取权限缓存
     * @returns {Object|null} 缓存数据
     */
    getCache() {
        // 优先使用内存缓存
        if (this.memoryCache && this.isCacheValid(this.memoryCache)) {
            return this.memoryCache;
        }

        // 尝试从本地存储获取
        const localCache = storage.getStorage('permission_cache');
        if (localCache && this.isCacheValid(localCache)) {
            this.memoryCache = localCache;
            return localCache;
        }

        return null;
    }

    /**
     * 检查缓存是否有效
     * @param {Object} cache 缓存数据
     * @returns {boolean} 是否有效
     */
    isCacheValid(cache) {
        if (!cache || !cache.expireTime) return false;
        return Date.now() < cache.expireTime;
    }

    /**
     * 清除权限缓存
     */
    clearCache() {
        this.memoryCache = null;
        storage.removeStorage('permission_cache');
        console.log('权限缓存已清除');
    }
}

/**
 * 权限变化事件管理器
 */
class PermissionEventManager {
    constructor() {
        this.listeners = [];
    }

    /**
     * 添加权限变化监听器
     * @param {Function} listener 监听器函数
     * @returns {Function} 取消监听的函数
     */
    addListener(listener) {
        if (typeof listener !== 'function') {
            console.warn('权限监听器必须是函数');
            return () => {};
        }

        this.listeners.push(listener);
        console.log('权限变化监听器已添加，当前监听器数量:', this.listeners.length);

        // 返回取消监听的函数
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
                console.log('权限变化监听器已移除，当前监听器数量:', this.listeners.length);
            }
        };
    }

    /**
     * 触发权限变化事件
     * @param {Object} eventData 事件数据
     */
    emit(eventData = {}) {
        console.log('触发权限变化事件，监听器数量:', this.listeners.length, '事件数据:', eventData);

        this.listeners.forEach((listener, index) => {
            try {
                listener(eventData);
            } catch (error) {
                console.error(`权限监听器[${index}]执行失败:`, error);
            }
        });
    }

    /**
     * 清除所有监听器
     */
    clearListeners() {
        const count = this.listeners.length;
        this.listeners = [];
        console.log(`已清除${count}个权限变化监听器`);
    }
}

/**
 * 权限管理器
 */
class PermissionManager {
    constructor() {
        this.cache = new PermissionCache();
        this.isRefreshing = false;
        this.eventManager = new PermissionEventManager();
    }

    /**
     * 初始化权限管理器
     * @param {Array} permissionList 权限列表
     * @param {Object} userMetadata 用户元数据
     */
    init(permissionList, userMetadata = {}) {
        console.log('权限管理器初始化:', {
            permissions: permissionList?.length || 0,
            metadata: userMetadata
        });

        this.cache.setCache(permissionList, userMetadata);
    }

    /**
     * 检查单个权限
     * @param {string} permission 权限标识符
     * @returns {boolean} 是否有权限
     */
    checkPermission(permission) {
        if (!permission) return false;

        try {
            const cache = this.cache.getCache();
            if (!cache || !Array.isArray(cache.permissions)) {
                console.warn('权限缓存不存在或格式错误，尝试从用户信息获取');
                return this.checkPermissionFromUserInfo(permission);
            }

            const hasPermission = cache.permissions.includes(permission);
            console.log(`权限验证: ${permission} => ${hasPermission ? '通过' : '拒绝'}`);
            return hasPermission;
        } catch (error) {
            console.error('权限检查异常:', error);
            // 异常时尝试从用户信息获取
            return this.checkPermissionFromUserInfo(permission);
        }
    }

    /**
     * 检查多个权限（或关系）
     * @param {Array} permissions 权限列表
     * @param {boolean} requireAll 是否需要全部权限，默认false（或关系）
     * @returns {boolean} 是否有权限
     */
    checkPermissions(permissions, requireAll = false) {
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return false;
        }

        try {
            const results = permissions.map((permission) => this.checkPermission(permission));

            if (requireAll) {
                // 与关系：需要全部权限
                const hasAllPermissions = results.every((result) => result);
                console.log(
                    `多权限验证(与): [${permissions.join(', ')}] => ${
                        hasAllPermissions ? '通过' : '拒绝'
                    }`
                );
                return hasAllPermissions;
            } else {
                // 或关系：只需要任一权限
                const hasAnyPermission = results.some((result) => result);
                console.log(
                    `多权限验证(或): [${permissions.join(', ')}] => ${
                        hasAnyPermission ? '通过' : '拒绝'
                    }`
                );
                return hasAnyPermission;
            }
        } catch (error) {
            console.error('多权限检查异常:', error);
            return false;
        }
    }

    /**
     * 从用户信息中检查权限（备用方法）
     * @param {string} permission 权限标识符
     * @returns {boolean} 是否有权限
     */
    checkPermissionFromUserInfo(permission) {
        try {

            const userInfo = storage.getUserInfo();
            if (userInfo && Array.isArray(userInfo.permissions)) {
                return userInfo.permissions.includes(permission);
            }
            // 尝试从miniProgramPermList获取权限数据
            if (userInfo && Array.isArray(userInfo.miniProgramPermList)) {
                return userInfo.miniProgramPermList.includes(permission);
            }
        } catch (error) {
            console.error('从用户信息检查权限失败:', error);
        }
        return false;
    }

    /**
     * 刷新权限数据
     * @returns {Promise<boolean>} 刷新是否成功
     */
    async refreshPermissions() {
        if (this.isRefreshing) {
            console.log('权限刷新正在进行中，跳过重复请求');
            return false;
        }

        this.isRefreshing = true;

        try {
            console.log('开始刷新权限数据...');

            // 调用认证模块的用户信息刷新
            const userProfile = await auth.fetchUserProfile(2); // 最多重试2次

            if (userProfile && userProfile.permissions) {
                // 更新权限缓存
                this.init(userProfile.permissions, {
                    userId: userProfile.userId,
                    roleId: userProfile.roleId,
                    roleName: userProfile.roleName
                });

                console.log('权限数据刷新成功');
                return true;
            } else {
                console.warn('刷新权限数据失败：无有效权限数据');
                return false;
            }
        } catch (error) {
            console.error('刷新权限数据失败:', error);
            return false;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * 获取用户权限级别
     * @returns {string} 权限级别: admin, advanced, basic, guest
     */
    getPermissionLevel() {
        const cache = this.cache.getCache();
        if (!cache || !cache.permissions) {
            return 'guest';
        }

        const { permissions } = cache;
        const { roleName } = cache.metadata || {};
        const permissionCount = Array.isArray(permissions) ? permissions.length : 0;

        // 根据角色名称和权限数量判断级别
        if (roleName && roleName.includes('管理')) {
            return 'admin';
        } else if (permissionCount > 5) {
            return 'advanced';
        } else if (permissionCount > 0) {
            return 'basic';
        } else {
            return 'guest';
        }
    }

    /**
     * 检查权限并提供降级方案
     * @param {string} permission 权限标识符
     * @param {Object} options 降级选项
     * @param {boolean} options.allowGuest 是否允许游客访问
     * @param {string} options.fallbackPermission 备用权限
     * @returns {Object} 权限检查结果
     */
    checkPermissionWithFallback(permission, options = {}) {
        const { allowGuest = false, fallbackPermission = null } = options;

        // 主权限检查
        const hasMainPermission = this.checkPermission(permission);
        if (hasMainPermission) {
            return {
                granted: true,
                permission: permission,
                reason: 'main_permission',
                level: this.getPermissionLevel()
            };
        }

        // 备用权限检查
        if (fallbackPermission) {
            const hasFallbackPermission = this.checkPermission(fallbackPermission);
            if (hasFallbackPermission) {
                return {
                    granted: true,
                    permission: fallbackPermission,
                    reason: 'fallback_permission',
                    level: this.getPermissionLevel()
                };
            }
        }

        // 游客权限检查
        if (allowGuest) {
            return {
                granted: true,
                permission: 'guest',
                reason: 'guest_access',
                level: 'guest'
            };
        }

        // 权限拒绝
        return {
            granted: false,
            permission: permission,
            reason: 'permission_denied',
            level: this.getPermissionLevel()
        };
    }

    /**
     * 获取当前权限摘要
     * @returns {Object} 权限摘要信息
     */
    getPermissionSummary() {
        const cache = this.cache.getCache();
        if (!cache) {
            return {
                hasPermissions: false,
                permissionCount: 0,
                level: 'guest',
                lastUpdate: null,
                userInfo: null
            };
        }

        return {
            hasPermissions: Array.isArray(cache.permissions) && cache.permissions.length > 0,
            permissionCount: cache.permissions?.length || 0,
            permissions: cache.permissions || [],
            level: this.getPermissionLevel(),
            lastUpdate: cache.cacheTime ? new Date(cache.cacheTime).toLocaleString() : null,
            userInfo: cache.metadata || null
        };
    }

    /**
     * 清除权限数据
     */
    clear() {
        this.cache.clearCache();
        this.isRefreshing = false;

        // 触发权限变化事件
        this.eventManager.emit({
            type: 'permission_cleared',
            timestamp: Date.now(),
            reason: 'manual_clear'
        });

        console.log('权限管理器已清除');
    }

    /**
     * 添加权限变化监听器
     * @param {Function} listener 监听器函数
     * @returns {Function} 取消监听的函数
     */
    addPermissionChangeListener(listener) {
        return this.eventManager.addListener(listener);
    }

    /**
     * 触发权限变化事件
     * @param {Object} eventData 事件数据
     */
    emitPermissionChange(eventData) {
        this.eventManager.emit(eventData);
    }

    /**
     * 清除所有权限变化监听器
     */
    clearPermissionChangeListeners() {
        this.eventManager.clearListeners();
    }
}

// 创建全局权限管理器实例
const permissionManager = new PermissionManager();

/**
 * 权限验证工具函数
 */

/**
 * 检查单个权限
 * @param {string} permission 权限标识符
 * @returns {boolean} 是否有权限
 */
function hasPermission(permission) {
    return permissionManager.checkPermission(permission);
}

/**
 * 检查多个权限
 * @param {Array} permissions 权限列表
 * @param {boolean} requireAll 是否需要全部权限
 * @returns {boolean} 是否有权限
 */
function hasPermissions(permissions, requireAll = false) {
    return permissionManager.checkPermissions(permissions, requireAll);
}

/**
 * 检查是否有任一权限（或关系）
 * @param {Array} permissions 权限列表
 * @returns {boolean} 是否有任一权限
 */
function hasAnyPermission(permissions) {
    return permissionManager.checkPermissions(permissions, false);
}

/**
 * 检查是否有全部权限（与关系）
 * @param {Array} permissions 权限列表
 * @returns {boolean} 是否有全部权限
 */
function hasAllPermissions(permissions) {
    return permissionManager.checkPermissions(permissions, true);
}

/**
 * 初始化权限系统
 * @param {Array} permissionList 权限列表
 * @param {Object} userMetadata 用户元数据
 */
function initPermissions(permissionList, userMetadata) {
    permissionManager.init(permissionList, userMetadata);
}

/**
 * 刷新权限数据
 * @returns {Promise<boolean>} 刷新是否成功
 */
function refreshPermissions() {
    return permissionManager.refreshPermissions();
}

/**
 * 获取权限摘要
 * @returns {Object} 权限摘要
 */
function getPermissionSummary() {
    return permissionManager.getPermissionSummary();
}

/**
 * 获取用户权限级别
 * @returns {string} 权限级别
 */
function getPermissionLevel() {
    return permissionManager.getPermissionLevel();
}

/**
 * 检查权限并提供降级方案
 * @param {string} permission 权限标识符
 * @param {Object} options 降级选项
 * @returns {Object} 权限检查结果
 */
function checkPermissionWithFallback(permission, options = {}) {
    return permissionManager.checkPermissionWithFallback(permission, options);
}

/**
 * 清除权限数据
 */
function clearPermissions() {
    permissionManager.clear();
}

/**
 * 添加权限变化监听器
 * @param {Function} listener 监听器函数
 * @returns {Function} 取消监听的函数
 */
function addPermissionChangeListener(listener) {
    return permissionManager.addPermissionChangeListener(listener);
}

/**
 * 触发权限变化事件
 * @param {Object} eventData 事件数据
 */
function emitPermissionChange(eventData) {
    permissionManager.emitPermissionChange(eventData);
}

/**
 * 清除所有权限变化监听器
 */
function clearPermissionChangeListeners() {
    permissionManager.clearPermissionChangeListeners();
}

/**
 * 权限常量定义
 */
const PERMISSIONS = {
    // 页面访问权限
    PAGE: {
        TEACH: 'miniprogram:page.teach', // 模拟票助考页面
        CHECK: 'miniprogram:page.check', // 模拟票核销页面
        SELL: 'miniprogram:page.sell', // 我要卖车页面
        APPROVE: 'miniprogram:page.approve' // 审批车辆页面
    },

    // 卖车模块操作权限
    SELL_ACTION: {
        ADD: 'miniprogram:page.sell:action.add', // 新建车辆
        DELETE: 'miniprogram:page.sell:action.delete', // 删除车辆
        EDIT: 'miniprogram:page.sell:action.edit' // 编辑车辆
    },

    // 审批模块操作权限
    APPROVE_ACTION: {
        APPROVE: 'miniprogram:page.approve:action.approve', // 审批操作
        EDIT: 'miniprogram:page.approve:action.edit', // 审批编辑
        DELETE: 'miniprogram:page.approve:action.delete' // 审批删除
    },

    // 特殊功能权限
    SPECIAL: {
        VIEW_FLOOR_PRICE: 'miniprogram:action.view-floor-price' // 查看底价
    }
};

module.exports = {
    // 权限管理器实例
    permissionManager,

    // 便捷函数
    hasPermission,
    hasPermissions,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionWithFallback,

    // 管理函数
    initPermissions,
    refreshPermissions,
    getPermissionSummary,
    getPermissionLevel,
    clearPermissions,

    // 权限变化监听
    addPermissionChangeListener,
    emitPermissionChange,
    clearPermissionChangeListeners,

    // 权限常量
    PERMISSIONS,

    // 类导出（供高级用户使用）
    PermissionManager,
    PermissionCache,
    PermissionEventManager
};
