// app.js
const auth = require('./utils/auth.js');
const storage = require('./utils/storage.js');
const permission = require('./utils/permission.js');

App({
  onLaunch() {
    console.log('小程序启动');

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  onError(error) {
    console.error('小程序错误:', error);
  },

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      console.log('检查应用登录状态...');
      const isLoggedIn = await auth.checkAndHandleLoginStatus();

      if (isLoggedIn) {
        const loginData = storage.getLoginData();
        const userInfo = storage.getUserInfo();

        this.globalData.isLoggedIn = true;
        this.globalData.userInfo = userInfo;
        this.globalData.openid = loginData.openid;
        this.globalData.phoneNumber = userInfo ? userInfo.phoneNumber : '';
        console.log('用户已登录:', userInfo);
        
        // 初始化权限系统
        try {
          if (userInfo && userInfo.permissions) {
            permission.initPermissions(userInfo.permissions, {
              userId: userInfo.userId,
              roleId: userInfo.roleId,
              roleName: userInfo.roleName
            });
            console.log('应用启动时权限系统初始化成功');
          }
        } catch (permissionError) {
          console.error('应用启动时权限系统初始化失败:', permissionError);
        }
      } else {
        this.globalData.isLoggedIn = false;
        this.globalData.userInfo = null;
        this.globalData.openid = null;
        this.globalData.phoneNumber = null;
        console.log('用户未登录');
        
        // 清除权限数据
        try {
          permission.clearPermissions();
          console.log('未登录状态，权限数据已清除');
        } catch (permissionError) {
          console.error('清除权限数据失败:', permissionError);
        }
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      this.globalData.openid = null;
      this.globalData.phoneNumber = null;
    }
  },

  /**
   * 更新全局登录状态
   * @param {Object} loginData 登录数据
   */
  updateLoginStatus(loginData) {
    if (loginData) {
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = loginData.userInfo;
      this.globalData.openid = loginData.openid;
      this.globalData.phoneNumber = loginData.userInfo ? loginData.userInfo.phoneNumber : '';
      console.log('全局登录状态已更新:', loginData);
    } else {
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      this.globalData.openid = null;
      this.globalData.phoneNumber = null;
      console.log('全局登录状态已清除');
    }
  },

  /**
   * 获取登录状态
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return this.globalData.isLoggedIn || false;
  },

  /**
   * 获取用户信息
   * @returns {Object|null} 用户信息
   */
  getUserInfo() {
    return this.globalData.userInfo || null;
  },

  /**
   * 登出
   */
  async logout() {
    try {
      await auth.logout();
      this.updateLoginStatus(null);
      console.log('全局登出成功');
    } catch (error) {
      console.error('全局登出失败:', error);
    }
  },

  /**
   * 需要登录检查
   * @param {Function} callback 登录成功后的回调
   * @param {boolean} showTip 是否显示提示
   * @returns {boolean} 是否已登录
   */
  requireLogin(callback, showTip = true) {
    return auth.requireLogin(callback, showTip);
  },

  globalData: {
    isLoggedIn: false,
    userInfo: null,
    openid: null,
    phoneNumber: null
  }
})
