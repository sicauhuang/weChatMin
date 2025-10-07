// pages/car-selling/car-selling.js
const auth = require('../../utils/auth.js');
const storage = require('../../utils/storage.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    vehicleList: [],
    hasMore: true,
    pageSize: 10,
    currentPage: 1,
    
    // 模拟数据
    mockVehicles: [
      {
        carId: '001',
        carModel: '奥迪 A4',
        licensePlate: '京A12345',
        ownerName: '张三',
        contactPhone: '138****1234',
        price: 25.8,
        condition: '9成新',
        location: '北京',
        description: '车况良好，手续齐全，个人一手车，非营运车辆。定期保养，无重大事故。',
        images: ['/assets/imgs/car-placeholder.jpg'],
        status: 'ON_SALE',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        userId: 'user123'
      },
      {
        carId: '002',
        carModel: '宝马 320i',
        licensePlate: '沪B67890',
        ownerName: '李四',
        contactPhone: '139****5678',
        price: 18.5,
        condition: '8成新',
        location: '上海',
        description: '精品车况，原厂保养，可按揭，支持置换。',
        images: ['/assets/imgs/car-placeholder.jpg'],
        status: 'RESERVED',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18',
        userId: 'user456'
      },
      {
        carId: '003',
        carModel: '大众 帕萨特',
        licensePlate: '粤C11111',
        ownerName: '王五',
        contactPhone: '136****9999',
        price: 15.2,
        condition: '7成新',
        location: '深圳',
        description: '商务用车，空间宽敞，动力充沛，适合家用和商务。',
        images: ['/assets/imgs/car-placeholder.jpg'],
        status: 'ON_SALE',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-15',
        userId: 'user789'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('卖车管理页面加载');
    this.checkLoginStatus();
    this.loadVehicleList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('卖车管理页面显示');
    // 刷新车辆列表
    this.loadVehicleList();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const isLoggedIn = auth.checkLoginStatus();
    if (!isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再使用卖车功能',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            });
          } else {
            wx.navigateBack();
          }
        }
      });
      return false;
    }
    return true;
  },

  /**
   * 加载车辆列表
   */
  async loadVehicleList(refresh = true) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      // 模拟API调用延时
      await new Promise(resolve => setTimeout(resolve, 500));

      if (refresh) {
        // 刷新数据
        this.setData({
          vehicleList: this.data.mockVehicles,
          currentPage: 1,
          hasMore: false
        });
      } else {
        // 加载更多数据
        this.setData({
          vehicleList: [...this.data.vehicleList, ...this.data.mockVehicles],
          currentPage: this.data.currentPage + 1
        });
      }

      console.log('车辆列表加载成功');
    } catch (error) {
      console.error('加载车辆列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 新建车辆
   */
  onCreateVehicle() {
    if (!this.checkLoginStatus()) return;

    wx.navigateTo({
      url: '/pages/car-form/car-form?mode=create',
      success: () => {
        console.log('跳转到新建车辆页面成功');
      },
      fail: (error) => {
        console.error('跳转到新建车辆页面失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 车辆卡片点击事件
   */
  onVehicleCardTap(e) {
    const { carId } = e.currentTarget.dataset;
    if (!carId) return;

    wx.navigateTo({
      url: `/pages/car-detail/car-detail?carId=${carId}`,
      success: () => {
        console.log('跳转到车辆详情页面成功:', carId);
      },
      fail: (error) => {
        console.error('跳转到车辆详情页面失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    console.log('下拉刷新车辆列表');
    this.loadVehicleList(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      console.log('上拉加载更多车辆');
      this.loadVehicleList(false);
    }
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '卖车管理',
      path: '/pages/car-selling/car-selling'
    };
  }
});