// pages/car-detail/car-detail.js
const auth = require('../../utils/auth.js');
const storage = require('../../utils/storage.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    carId: null,
    vehicleData: null,
    
    // 图片轮播
    currentImageIndex: 0,
    
    // 操作菜单
    showActionSheet: false,
    actionSheetItems: [
      { key: 'edit', text: '编辑车辆', icon: 'icon-bianji' },
      { key: 'status', text: '状态管理', icon: 'icon-zhuangtai' },
      { key: 'share', text: '分享车辆', icon: 'icon-fenxiang' },
      { key: 'delete', text: '删除车辆', icon: 'icon-shanchu', danger: true }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('车辆详情页面加载:', options);
    
    const { carId } = options;
    if (!carId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none',
        duration: 2000
      });
      wx.navigateBack();
      return;
    }

    this.setData({ carId });
    this.loadVehicleDetail(carId);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时重新加载数据，确保数据最新
    if (this.data.carId) {
      this.loadVehicleDetail(this.data.carId);
    }
  },

  /**
   * 加载车辆详情
   */
  async loadVehicleDetail(carId) {
    try {
      this.setData({ loading: true });
      
      // TODO: 实际项目中这里应该调用API获取车辆详情
      // 这里使用模拟数据
      const mockData = {
        carId: carId,
        carModel: '奥迪 A4',
        licensePlate: '京A12345',
        ownerName: '张三',
        contactPhone: '138****1234',
        price: 25.8,
        condition: '9成新',
        location: '北京',
        description: '车况良好，手续齐全，个人一手车，非营运车辆。定期保养，无重大事故。内饰干净，外观无明显划痕，发动机运转正常，变速箱换挡平顺。',
        images: [
          '/assets/imgs/car-placeholder.jpg',
          '/assets/imgs/car-placeholder.jpg',
          '/assets/imgs/car-placeholder.jpg'
        ],
        status: 'ON_SALE',
        createdAt: '2024-01-15 10:30:00',
        updatedAt: '2024-01-20 14:45:00',
        userId: 'user123'
      };

      this.setData({
        vehicleData: mockData,
        currentImageIndex: 0
      });

      console.log('车辆详情加载成功:', mockData);
    } catch (error) {
      console.error('加载车辆详情失败:', error);
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
   * 图片轮播改变
   */
  onImageSwiperChange(e) {
    const { current } = e.detail;
    this.setData({
      currentImageIndex: current
    });
  },

  /**
   * 图片预览
   */
  onImagePreview() {
    const { vehicleData } = this.data;
    if (!vehicleData || !vehicleData.images || vehicleData.images.length === 0) return;

    wx.previewImage({
      urls: vehicleData.images,
      current: vehicleData.images[this.data.currentImageIndex]
    });
  },

  /**
   * 拨打电话
   */
  onCallPhone() {
    const { vehicleData } = this.data;
    if (!vehicleData || !vehicleData.contactPhone) return;

    // 显示完整手机号（实际项目中需要权限验证）
    const phoneNumber = vehicleData.contactPhone.replace(/\*/g, '8'); // 临时处理
    
    wx.makePhoneCall({
      phoneNumber: phoneNumber,
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (error) => {
        console.error('拨打电话失败:', error);
        wx.showToast({
          title: '拨打失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 显示操作菜单
   */
  onShowActionSheet() {
    this.setData({
      showActionSheet: true
    });
  },

  /**
   * 隐藏操作菜单
   */
  onHideActionSheet() {
    this.setData({
      showActionSheet: false
    });
  },

  /**
   * 操作菜单项点击
   */
  onActionSheetItemTap(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({
      showActionSheet: false
    });

    setTimeout(() => {
      switch (key) {
        case 'edit':
          this.onEditVehicle();
          break;
        case 'status':
          this.onManageStatus();
          break;
        case 'share':
          this.onShareVehicle();
          break;
        case 'delete':
          this.onDeleteVehicle();
          break;
      }
    }, 300);
  },

  /**
   * 编辑车辆
   */
  onEditVehicle() {
    const { carId } = this.data;
    wx.navigateTo({
      url: `/pages/car-form/car-form?mode=edit&carId=${carId}`,
      success: () => {
        console.log('跳转到编辑页面成功');
      },
      fail: (error) => {
        console.error('跳转到编辑页面失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 状态管理
   */
  onManageStatus() {
    const { vehicleData } = this.data;
    if (!vehicleData) return;

    const actions = [];
    
    if (vehicleData.status === 'ON_SALE') {
      actions.push('下架车辆', '标记为已预订', '标记为已售出');
    } else if (vehicleData.status === 'OFFLINE') {
      actions.push('重新上架');
    } else if (vehicleData.status === 'RESERVED') {
      actions.push('标记为已售出', '重新上架');
    }

    if (actions.length === 0) {
      wx.showToast({
        title: '当前状态无法修改',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const selectedAction = actions[res.tapIndex];
        this.handleStatusChange(selectedAction);
      }
    });
  },

  /**
   * 处理状态变更
   */
  async handleStatusChange(action) {
    try {
      let newStatus = this.data.vehicleData.status;
      
      switch (action) {
        case '下架车辆':
          newStatus = 'OFFLINE';
          break;
        case '重新上架':
          newStatus = 'ON_SALE';
          break;
        case '标记为已预订':
          newStatus = 'RESERVED';
          break;
        case '标记为已售出':
          newStatus = 'SOLD';
          break;
      }

      // TODO: 实际项目中这里应该调用API更新状态
      console.log('更新车辆状态:', newStatus);
      
      // 更新本地数据
      const updatedData = {
        ...this.data.vehicleData,
        status: newStatus,
        updatedAt: new Date().toLocaleString()
      };
      
      this.setData({
        vehicleData: updatedData
      });

      wx.showToast({
        title: '状态更新成功',
        icon: 'success',
        duration: 2000
      });

    } catch (error) {
      console.error('更新状态失败:', error);
      wx.showToast({
        title: '更新失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 分享车辆
   */
  onShareVehicle() {
    const { vehicleData } = this.data;
    if (!vehicleData) return;

    // TODO: 实际项目中可以生成分享链接或二维码
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 删除车辆
   */
  onDeleteVehicle() {
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这辆车吗？',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            // TODO: 实际项目中这里应该调用API删除车辆
            console.log('删除车辆:', this.data.carId);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 2000
            });

            // 返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);

          } catch (error) {
            console.error('删除车辆失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    const { vehicleData } = this.data;
    if (!vehicleData) {
      return {
        title: '车辆详情',
        path: '/pages/car-detail/car-detail'
      };
    }

    return {
      title: `${vehicleData.carModel} - ${vehicleData.price}万元`,
      path: `/pages/car-detail/car-detail?carId=${vehicleData.carId}`,
      imageUrl: vehicleData.images && vehicleData.images[0] ? vehicleData.images[0] : ''
    };
  }
});