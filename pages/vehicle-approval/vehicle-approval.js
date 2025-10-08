// pages/vehicle-approval/vehicle-approval.js
const auth = require('../../utils/auth.js');
const request = require('../../utils/request.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false, // 数据加载状态
    vehicleList: [], // 待审批车辆列表
    hasMore: true, // 是否有更多数据
    pageSize: 10, // 每页数据条数
    currentPage: 1, // 当前页码
    isEmpty: false, // 是否为空状态
    // 删除模式相关
    deleteMode: false, // 是否处于删除模式
    selectedVehicles: [] // 已选中的车辆ID列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('审批车辆页面加载');
    this.checkPermissionAndLoad();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('审批车辆页面显示');
    // 从审批页面返回时刷新数据
    this.refreshData();
  },

  /**
   * 检查权限并加载数据
   */
  checkPermissionAndLoad() {
    console.log('检查用户权限...');

    if (!auth.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再使用审批功能',
        showCancel: true,
        cancelText: '取消',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }, 300);
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }

    // 加载审批车辆列表
    this.loadVehicleList();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    console.log('触发下拉刷新');
    this.refreshData();
  },

  /**
   * 上拉加载更多（原生页面事件，保留作为备用）
   */
  onReachBottom() {
    console.log('触发上拉加载');
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData();
    }
  },

  /**
   * scroll-view滚动到底部事件
   */
  onScrollToLower() {
    console.log('scroll-view触发滚动到底部');
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData();
    }
  },

  /**
   * scroll-view滚动事件
   * @param {Object} event 滚动事件对象
   */
  onScroll(event) {
    // 可以根据需要处理滚动事件
    // 例如：显示/隐藏回到顶部按钮
    const { scrollTop } = event.detail;
    console.log('scroll-view滚动位置:', scrollTop);
  },

  /**
   * 刷新数据
   */
  refreshData() {
    this.setData({
      currentPage: 1,
      hasMore: true,
      vehicleList: []
    });
    this.loadVehicleList();
  },

  /**
   * 加载更多数据
   */
  loadMoreData() {
    const nextPage = this.data.currentPage + 1;
    this.setData({
      currentPage: nextPage
    });
    this.loadVehicleList(false);
  },

  /**
   * 加载车辆列表数据
   * @param {boolean} isRefresh 是否为刷新操作
   */
  async loadVehicleList(isRefresh = true) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      console.log(`加载第${this.data.currentPage}页数据...`);

      // 模拟API请求 - 获取待审批车辆列表
      const result = await this.mockGetApprovalVehicles({
        page: this.data.currentPage,
        pageSize: this.data.pageSize,
        status: 'pending'
      });

      if (result.success) {
        const { list, pagination } = result.data;

        let newVehicleList;
        if (isRefresh || this.data.currentPage === 1) {
          newVehicleList = list;
        } else {
          newVehicleList = [...this.data.vehicleList, ...list];
        }

        this.setData({
          vehicleList: newVehicleList,
          hasMore: pagination.hasMore,
          isEmpty: newVehicleList.length === 0,
          loading: false
        });

        console.log(`加载成功，当前共${newVehicleList.length}条数据`);
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (error) {
      console.error('加载车辆列表失败:', error);
      this.setData({ loading: false });

      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 模拟获取待审批车辆列表API
   * @param {Object} params 请求参数
   */
  async mockGetApprovalVehicles(params) {
    console.log('模拟API请求 - 获取待审批车辆列表:', params);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    // 模拟待审批车辆数据
    const mockVehicles = [
      {
        carId: 'approval_001',
        previewImage: '/assets/imgs/logo.png',
        brand: '奥迪',
        series: 'A4L',
        model: '2023款 35 TFSI 进取致雅型',
        registrationDate: '2020-05-15',
        mileage: 8.5,
        color: '珍珠白',
        transferCount: 1,
        retailPrice: 25.8,
        status: 'pending',
        submitTime: '2024-01-15 10:30:00',
        submitterId: 'user_123',
        isFavorited: false
      },
      {
        carId: 'approval_002',
        previewImage: '/assets/imgs/logo.png',
        brand: '宝马',
        series: '3系',
        model: '2022款 325Li M运动套装',
        registrationDate: '2019-08-20',
        mileage: 12.3,
        color: '矿石灰',
        transferCount: 2,
        retailPrice: 32.5,
        status: 'pending',
        submitTime: '2024-01-14 15:45:00',
        submitterId: 'user_124',
        isFavorited: false
      },
      {
        carId: 'approval_003',
        previewImage: '/assets/imgs/logo.png',
        brand: '奔驰',
        series: 'C级',
        model: '2023款 C 260 L',
        registrationDate: '2021-03-10',
        mileage: 6.8,
        color: '北极白',
        transferCount: 0,
        retailPrice: 38.9,
        status: 'pending',
        submitTime: '2024-01-13 09:20:00',
        submitterId: 'user_125',
        isFavorited: false
      }
    ];

    // 根据页码返回对应数据
    const { page, pageSize } = params;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = mockVehicles.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        list: pageData,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalCount: mockVehicles.length,
          totalPages: Math.ceil(mockVehicles.length / pageSize),
          hasMore: endIndex < mockVehicles.length
        }
      }
    };
  },

  /**
   * 车辆卡片点击事件
   * @param {Object} event 事件对象
   */
  onCardTap(event) {
    const { vehicleData } = event.detail;
    console.log('点击车辆卡片:', vehicleData);

    if (!vehicleData || !vehicleData.carId) {
      wx.showToast({
        title: '车辆信息错误',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 跳转到车辆审批页面
    wx.navigateTo({
      url: `/pages/car-form/car-form?mode=approval&carId=${vehicleData.carId}`,
      success: () => {
        console.log('成功跳转到车辆审批页面');
      },
      fail: (error) => {
        console.error('跳转到车辆审批页面失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 车辆收藏状态切换（审批页面暂不需要）
   * @param {Object} event 事件对象
   */
  onFavoriteToggle(event) {
    console.log('审批页面不支持收藏功能');
    // 审批场景下不需要收藏功能
  },

  /**
   * 车辆选择状态变化（删除模式）
   * @param {Object} event 事件对象
   */
  onSelectionChange(event) {
    const { vehicleData, isSelected } = event.detail;
    console.log('车辆选择状态变化:', vehicleData.carId, isSelected);

    let selectedVehicles = [...this.data.selectedVehicles];

    if (isSelected) {
      if (!selectedVehicles.includes(vehicleData.carId)) {
        selectedVehicles.push(vehicleData.carId);
      }
    } else {
      selectedVehicles = selectedVehicles.filter(id => id !== vehicleData.carId);
    }

    this.setData({
      selectedVehicles
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '审批车辆',
      path: '/pages/vehicle-approval/vehicle-approval'
    };
  }
});
