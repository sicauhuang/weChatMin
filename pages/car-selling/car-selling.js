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

    // 删除模式相关状态
    isDeleteMode: false,           // 是否处于删除模式
    selectedVehicleIds: [],        // 已选中的车辆ID列表
    isDeleting: false,             // 是否正在删除中

    // 模拟数据 - 符合设计文档的车辆卡片数据模型
    mockVehicles: [
      {
        carId: '001',
        previewImage: '/assets/imgs/logo.png',
        brand: '奥迪',
        series: 'A4L',
        model: '2023款 35 TFSI 进取致雅型',
        registrationDate: '2020-05-15',
        mileage: 8.5,
        color: '珍珠白',
        transferCount: 1,
        retailPrice: 25.8,
        isFavorited: false
      },
      {
        carId: '002',
        previewImage: '/assets/imgs/logo.png',
        brand: '宝马',
        series: '3系',
        model: '2022款 320i M运动套装',
        registrationDate: '2021-08-22',
        mileage: 3.2,
        color: '矿石灰',
        transferCount: 0,
        retailPrice: 32.5,
        isFavorited: false
      },
      {
        carId: '003',
        previewImage: '/assets/imgs/logo.png',
        brand: '大众',
        series: '帕萨特',
        model: '2021款 380TSI 豪华版',
        registrationDate: '2019-03-10',
        mileage: 12.8,
        color: '雅士银',
        transferCount: 2,
        retailPrice: 18.6,
        isFavorited: true
      },
      {
        carId: '004',
        previewImage: '/assets/imgs/logo.png',
        brand: '奔驰',
        series: 'C级',
        model: '2023款 C 260 L 豪华型',
        registrationDate: '2022-11-05',
        mileage: 1.8,
        color: '极地白',
        transferCount: 0,
        retailPrice: 45.2,
        isFavorited: false
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

      // 格式化车辆数据
      const formattedVehicles = this.data.mockVehicles.map(vehicle => ({
        ...vehicle,
        formattedPrice: this.formatPrice(vehicle.retailPrice),
        formattedMileage: this.formatMileage(vehicle.mileage),
        formattedDate: this.formatDate(vehicle.registrationDate),
        formattedTransfer: this.formatTransferCount(vehicle.transferCount),
        isSelected: false              // 在删除模式下的选中状态
      }));

      if (refresh) {
        // 刷新数据
        this.setData({
          vehicleList: formattedVehicles,
          currentPage: 1,
          hasMore: false
        });
      } else {
        // 加载更多数据
        this.setData({
          vehicleList: [...this.data.vehicleList, ...formattedVehicles],
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
   * 格式化价格
   */
  formatPrice(price) {
    if (!price) return '面议';
    return `${price.toFixed(1)}万`;
  },

  /**
   * 格式化里程
   */
  formatMileage(mileage) {
    if (!mileage || mileage === 0) return '准新车';
    return `${mileage.toFixed(1)}万公里`;
  },

  /**
   * 格式化日期
   */
  formatDate(dateString) {
    if (!dateString) return '--';
    return dateString;
  },

  /**
   * 格式化过户次数
   */
  formatTransferCount(count) {
    if (count === 0) return '未过户';
    return `过户${count}次`;
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
   * 车辆卡片组件事件处理方法
   */

  /**
   * 处理车辆卡片点击事件
   */
  handleCardTap(e) {
    const { vehicleData } = e.detail;
    if (!vehicleData || !vehicleData.carId) return;

    wx.navigateTo({
      url: `/pages/car-detail/car-detail?carId=${vehicleData.carId}`,
      success: () => {
        console.log('跳转到车辆详情页面成功:', vehicleData.carId);
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
   * 处理收藏状态切换事件
   */
  handleFavoriteToggle(e) {
    const { vehicleData, isFavorited } = e.detail;

    if (!vehicleData || !vehicleData.carId) {
      console.error('收藏操作缺少必要参数:', { vehicleData });
      return;
    }

    console.log('收藏状态切换:', { carId: vehicleData.carId, isFavorited });

    // 获取当前车辆列表
    const vehicleList = [...this.data.vehicleList];
    const vehicleIndex = vehicleList.findIndex(vehicle => vehicle.carId === vehicleData.carId);

    if (vehicleIndex === -1) {
      console.error('未找到对应车辆信息:', { carId: vehicleData.carId });
      wx.showToast({
        title: '操作失败',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 更新收藏状态
    vehicleList[vehicleIndex].isFavorited = isFavorited;

    // 更新数据
    this.setData({
      vehicleList: vehicleList
    });

    // 显示反馈消息
    const action = isFavorited ? '收藏' : '取消收藏';
    console.log(`${action}成功:`, vehicleData.brand, vehicleData.series);

    wx.showToast({
      title: `${action}成功`,
      icon: 'success',
      duration: 1000
    });

    // TODO: 调用后端 API 更新收藏状态
    // this.updateFavoriteStatus(vehicleData.carId, isFavorited);
  },

  /**
   * 处理选中状态变化事件（删除模式下）
   */
  handleSelectionChange(e) {
    const { vehicleData, isSelected } = e.detail;
    
    if (!vehicleData || !vehicleData.carId) {
      console.error('选择车辆缺少必要参数:', { vehicleData });
      return;
    }

    const vehicleList = [...this.data.vehicleList];
    const vehicleIndex = vehicleList.findIndex(vehicle => vehicle.carId === vehicleData.carId);
    
    if (vehicleIndex === -1) {
      console.error('车辆数据异常:', { carId: vehicleData.carId });
      return;
    }

    // 切换选中状态
    vehicleList[vehicleIndex].isSelected = isSelected;
    
    // 更新选中列表
    let selectedVehicleIds = [...this.data.selectedVehicleIds];
    if (isSelected) {
      if (!selectedVehicleIds.includes(vehicleData.carId)) {
        selectedVehicleIds.push(vehicleData.carId);
      }
    } else {
      selectedVehicleIds = selectedVehicleIds.filter(id => id !== vehicleData.carId);
    }

    this.setData({
      vehicleList: vehicleList,
      selectedVehicleIds: selectedVehicleIds
    });

    console.log('车辆选中状态更新:', {
      carId: vehicleData.carId,
      isSelected: isSelected,
      selectedCount: selectedVehicleIds.length
    });
  },

  /**
   * 车辆卡片点击事件（弃用，保留兼容）
   */
  onVehicleCardTap(e) {
    // 在删除模式下，点击卡片切换选中状态，而不是跳转详情
    if (this.data.isDeleteMode) {
      this.toggleVehicleSelection(e);
      return;
    }

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
   * 收藏按钮点击事件（弃用，保留兼容）
   */
  onFavoriteToggle(e) {
    // 立即阻止事件冒泡，防止触发卡片点击事件
    // 注意：使用catchtap时这行代码是冗余的，但保留以确保兼容性
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    const { carId, index } = e.currentTarget.dataset;

    // 验证必要参数
    if (!carId || index === undefined || index === null) {
      console.error('收藏操作缺少必要参数:', { carId, index });
      return;
    }

    console.log('收藏状态切换:', { carId, index });

    // 获取当前车辆列表
    const vehicleList = [...this.data.vehicleList];
    const vehicleIndex = parseInt(index);
    const vehicle = vehicleList[vehicleIndex];

    // 验证车辆数据
    if (!vehicle) {
      console.error('未找到对应车辆信息:', { carId, index: vehicleIndex });
      wx.showToast({
        title: '操作失败',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 验证车辆ID匹配
    if (vehicle.carId !== carId) {
      console.error('车辆ID不匹配:', {
        expectedCarId: carId,
        actualCarId: vehicle.carId,
        index: vehicleIndex
      });
      wx.showToast({
        title: '数据异常',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 切换收藏状态
    const previousState = vehicle.isFavorited;
    vehicle.isFavorited = !vehicle.isFavorited;

    // 更新数据
    this.setData({
      vehicleList: vehicleList
    });

    // 显示反馈消息
    const action = vehicle.isFavorited ? '收藏' : '取消收藏';
    console.log(`${action}成功:`, vehicle.brand, vehicle.series);

    // 可选：显示用户反馈
    wx.showToast({
      title: `${action}成功`,
      icon: 'success',
      duration: 1000
    });

    // 这里可以添加调用后端API的逻辑
    // TODO: 调用收藏/取消收藏的API接口
    // this.updateFavoriteStatus(carId, vehicle.isFavorited);
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
  },

  /**
   * =============================
   * 删除模式相关方法
   * =============================
   */

  /**
   * 进入删除模式
   */
  enterDeleteMode() {
    console.log('进入删除模式');
    this.setData({
      isDeleteMode: true,
      selectedVehicleIds: []
    });

    // 显示操作引导（仅首次使用）
    this.showDeleteModeGuide();
  },

  /**
   * 退出删除模式
   */
  exitDeleteMode() {
    console.log('退出删除模式');
    
    // 清空所有选中状态
    const vehicleList = this.data.vehicleList.map(vehicle => ({
      ...vehicle,
      isSelected: false
    }));

    this.setData({
      isDeleteMode: false,
      selectedVehicleIds: [],
      vehicleList: vehicleList
    });
  },

  /**
   * 切换车辆选中状态
   */
  toggleVehicleSelection(e) {
    const { carId, index } = e.currentTarget.dataset;
    const vehicleIndex = parseInt(index);
    
    if (!carId || vehicleIndex === undefined) {
      console.error('选择车辆缺少必要参数:', { carId, index });
      return;
    }

    const vehicleList = [...this.data.vehicleList];
    const vehicle = vehicleList[vehicleIndex];
    
    if (!vehicle || vehicle.carId !== carId) {
      console.error('车辆数据异常:', { carId, vehicleIndex });
      return;
    }

    // 切换选中状态
    vehicle.isSelected = !vehicle.isSelected;
    
    // 更新选中列表
    let selectedVehicleIds = [...this.data.selectedVehicleIds];
    if (vehicle.isSelected) {
      if (!selectedVehicleIds.includes(carId)) {
        selectedVehicleIds.push(carId);
      }
    } else {
      selectedVehicleIds = selectedVehicleIds.filter(id => id !== carId);
    }

    this.setData({
      vehicleList: vehicleList,
      selectedVehicleIds: selectedVehicleIds
    });

    console.log('车辆选中状态更新:', {
      carId,
      isSelected: vehicle.isSelected,
      selectedCount: selectedVehicleIds.length
    });
  },

  /**
   * 删除按钮点击事件
   */
  onDeleteButtonTap() {
    if (!this.checkLoginStatus()) return;
    
    if (this.data.vehicleList.length === 0) {
      wx.showToast({
        title: '暂无可删除的车辆',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.enterDeleteMode();
  },

  /**
   * 取消删除按钮点击事件
   */
  onCancelDeleteTap() {
    this.exitDeleteMode();
  },

  /**
   * 确认删除按钮点击事件
   */
  onConfirmDeleteTap() {
    if (this.data.selectedVehicleIds.length === 0) {
      wx.showToast({
        title: '请选择要删除的车辆',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.showDeleteConfirmModal();
  },

  /**
   * 显示删除确认弹窗
   */
  showDeleteConfirmModal() {
    const selectedCount = this.data.selectedVehicleIds.length;
    const confirmText = selectedCount === 1 ? '删除这辆车' : `删除这${selectedCount}辆车`;
    
    wx.showModal({
      title: '确认删除',
      content: `${confirmText}后无法恢复，是否继续？`,
      confirmText: '确认删除',
      confirmColor: '#ff4757',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.performDelete();
        }
      }
    });
  },

  /**
   * 执行删除操作
   */
  async performDelete() {
    if (this.data.isDeleting) return;
    
    this.setData({ isDeleting: true });
    
    try {
      console.log('开始删除车辆:', this.data.selectedVehicleIds);
      
      // 显示加载提示
      wx.showLoading({
        title: '删除中...',
        mask: true
      });
      
      // 模拟API调用延时
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: 调用实际的删除API
      // const result = await this.callDeleteAPI(this.data.selectedVehicleIds);
      
      // 模拟删除成功
      const result = {
        success: true,
        data: {
          deletedCount: this.data.selectedVehicleIds.length,
          failedIds: []
        }
      };
      
      if (result.success) {
        // 从列表中移除已删除的车辆
        const remainingVehicles = this.data.vehicleList.filter(
          vehicle => !this.data.selectedVehicleIds.includes(vehicle.carId)
        );
        
        this.setData({
          vehicleList: remainingVehicles
        });
        
        // 退出删除模式
        this.exitDeleteMode();
        
        wx.hideLoading();
        wx.showToast({
          title: `成功删除${result.data.deletedCount}辆车`,
          icon: 'success',
          duration: 2000
        });
        
        console.log('删除成功:', result);
      } else {
        throw new Error(result.message || '删除失败');
      }
      
    } catch (error) {
      console.error('删除车辆失败:', error);
      wx.hideLoading();
      wx.showModal({
        title: '删除失败',
        content: error.message || '网络异常，请稍后重试',
        showCancel: false,
        confirmText: '知道了'
      });
    } finally {
      this.setData({ isDeleting: false });
    }
  },

  /**
   * 显示删除模式操作引导（仅首次使用）
   */
  showDeleteModeGuide() {
    // 检查是否是首次使用删除功能
    const hasShownGuide = wx.getStorageSync('car_selling_delete_guide_shown');
    if (hasShownGuide) return;
    
    // 显示引导提示
    setTimeout(() => {
      wx.showToast({
        title: '点击车辆卡片进行选择',
        icon: 'none',
        duration: 3000
      });
    }, 500);
    
    // 标记已显示引导
    wx.setStorageSync('car_selling_delete_guide_shown', true);
  }
});
