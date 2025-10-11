/**
 * 权限包装器组件
 * 基于设计文档的简化版本，专注于权限控制功能
 */

const permission = require('../../utils/permission.js');

Component({
  /**
   * 组件属性
   */
  properties: {
    // 权限标识符
    permission: {
      type: String,
      value: ''
    },
    
    // 调试模式，在控制台输出详细信息
    debug: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件数据
   */
  data: {
    hasPermission: false,
    initialized: false,
    _isValidating: false  // 防止并发验证
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    /**
     * 组件实例被创建
     */
    created() {
      if (this.properties.debug) {
        console.log('PermissionWrapper created:', this.properties.permission);
      }
    },

    /**
     * 组件实例进入页面节点树
     */
    attached() {
      // 延迟初始化验证，避免构造阶段的循环
      setTimeout(() => {
        this.validatePermission();
      }, 0);
    },

    /**
     * 组件被移动到节点树另一位置
     */
    moved() {
      // 重新验证权限，防止页面切换导致的权限状态不一致
      if (this.data.initialized) {
        this.validatePermission();
      }
    }
  },

  /**
   * 组件所在页面生命周期
   */
  pageLifetimes: {
    /**
     * 页面显示时
     */
    show() {
      // 页面显示时重新验证权限，确保权限状态最新
      if (this.data.initialized) {
        this.validatePermission();
      }
    }
  },

  /**
   * 属性变化监听
   */
  observers: {
    'permission': function(newPermission) {
      // 权限属性变化时重新验证
      if (this.data.initialized && !this.data._isValidating) {
        this.validatePermission();
      }
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 验证权限
     */
    validatePermission() {
      // 防止并发验证
      if (this.data._isValidating) {
        return;
      }
      
      this.setData({ _isValidating: true });
      
      const { permission: singlePermission, debug } = this.properties;
      
      let hasPermission = false;
      let validationInfo = '';

      try {
        if (singlePermission) {
          // 单一权限验证
          hasPermission = permission.hasPermission(singlePermission);
          validationInfo = `权限验证: ${singlePermission} => ${hasPermission}`;
        } else {
          // 无权限配置，默认允许显示
          hasPermission = true;
          validationInfo = '无权限配置，默认允许';
        }

        if (debug) {
          console.log(`PermissionWrapper: ${validationInfo}`);
        }

        // 使用wx.nextTick异步更新UI，避免同步计算问题
        wx.nextTick(() => {
          this.setData({
            hasPermission,
            initialized: true,
            _isValidating: false
          });
        });

        // 触发权限验证完成事件
        this.triggerEvent('permissionValidated', {
          hasPermission,
          permission: singlePermission,
          info: validationInfo
        });

      } catch (error) {
        console.error('PermissionWrapper 权限验证失败:', error);
        
        // 验证失败时默认无权限
        wx.nextTick(() => {
          this.setData({
            hasPermission: false,
            initialized: true,
            _isValidating: false
          });
        });

        // 触发权限验证错误事件
        this.triggerEvent('permissionError', {
          error: error.message,
          permission: singlePermission
        });
      }
    },

    /**
     * 手动刷新权限
     */
    refreshPermission() {
      if (this.properties.debug) {
        console.log('PermissionWrapper: 手动刷新权限');
      }
      this.validatePermission();
    },

    /**
     * 获取当前权限状态
     */
    getPermissionStatus() {
      return {
        hasPermission: this.data.hasPermission,
        initialized: this.data.initialized
      };
    }
  }
});