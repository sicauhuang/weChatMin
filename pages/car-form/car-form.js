// pages/car-form/car-form.js
const auth = require('../../utils/auth.js');
const storage = require('../../utils/storage.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    mode: 'create', // create | edit
    carId: null,
    
    // 表单数据
    formData: {
      carModel: '',
      licensePlate: '',
      ownerName: '',
      contactPhone: '',
      price: '',
      condition: '',
      location: '',
      description: '',
      images: []
    },
    
    // 表单验证
    errors: {},
    
    // 选择器数据
    carModels: [
      '奥迪 A4', '奥迪 A6', '宝马 320i', '宝马 525i', 
      '大众 帕萨特', '大众 迈腾', '丰田 凯美瑞', '本田 雅阁',
      '奔驰 C200', '奔驰 E300', '其他'
    ],
    carModelIndex: -1,
    
    conditions: [
      '新车', '9成新', '8成新', '7成新', '6成及以下'
    ],
    conditionIndex: -1,
    
    locations: [
      '北京', '上海', '广州', '深圳', '天津', '重庆',
      '杭州', '南京', '苏州', '成都', '武汉', '西安',
      '其他'
    ],
    locationIndex: -1,
    
    // UI状态
    loading: false,
    submitting: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('新建车辆页面加载:', options);
    
    const { mode = 'create', carId } = options;
    this.setData({
      mode,
      carId: carId || null
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: mode === 'edit' ? '编辑车辆' : '新建车辆'
    });

    // 如果是编辑模式，加载车辆信息
    if (mode === 'edit' && carId) {
      this.loadVehicleData(carId);
    }

    // 初始化用户信息
    this.initUserInfo();
  },

  /**
   * 初始化用户信息
   */
  initUserInfo() {
    const userInfo = storage.getUserInfo();
    if (userInfo) {
      this.setData({
        'formData.ownerName': userInfo.name || userInfo.nickName || '',
        'formData.contactPhone': userInfo.phoneNumber || ''
      });
    }
  },

  /**
   * 加载车辆数据（编辑模式）
   */
  async loadVehicleData(carId) {
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
        price: '25.8',
        condition: '9成新',
        location: '北京',
        description: '车况良好，手续齐全，个人一手车，非营运车辆。定期保养，无重大事故。',
        images: []
      };

      // 设置选择器索引
      const carModelIndex = this.data.carModels.indexOf(mockData.carModel);
      const conditionIndex = this.data.conditions.indexOf(mockData.condition);
      const locationIndex = this.data.locations.indexOf(mockData.location);

      this.setData({
        formData: mockData,
        carModelIndex,
        conditionIndex,
        locationIndex
      });

      console.log('车辆数据加载成功');
    } catch (error) {
      console.error('加载车辆数据失败:', error);
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
   * 输入框值改变
   */
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: '' // 清除错误信息
    });
  },

  /**
   * 车型选择
   */
  onCarModelChange(e) {
    const index = parseInt(e.detail.value);
    const carModel = this.data.carModels[index];
    
    this.setData({
      carModelIndex: index,
      'formData.carModel': carModel,
      'errors.carModel': ''
    });
  },

  /**
   * 车况选择
   */
  onConditionChange(e) {
    const index = parseInt(e.detail.value);
    const condition = this.data.conditions[index];
    
    this.setData({
      conditionIndex: index,
      'formData.condition': condition,
      'errors.condition': ''
    });
  },

  /**
   * 地区选择
   */
  onLocationChange(e) {
    const index = parseInt(e.detail.value);
    const location = this.data.locations[index];
    
    this.setData({
      locationIndex: index,
      'formData.location': location,
      'errors.location': ''
    });
  },

  /**
   * 图片上传
   */
  onImageUpload() {
    wx.chooseMedia({
      count: 9 - this.data.formData.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFiles = res.tempFiles;
        const images = [...this.data.formData.images];
        
        tempFiles.forEach(file => {
          if (images.length < 9) {
            images.push(file.tempFilePath);
          }
        });
        
        this.setData({
          'formData.images': images
        });
        
        console.log('选择图片成功:', images);
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 删除图片
   */
  onImageDelete(e) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.formData.images];
    images.splice(index, 1);
    
    this.setData({
      'formData.images': images
    });
  },

  /**
   * 预览图片
   */
  onImagePreview(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.formData.images,
      current: url
    });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data;
    const errors = {};
    
    // 必填字段验证
    if (!formData.carModel.trim()) {
      errors.carModel = '请选择车型';
    }
    
    if (!formData.licensePlate.trim()) {
      errors.licensePlate = '请输入车牌号';
    }
    
    if (!formData.ownerName.trim()) {
      errors.ownerName = '请输入车主姓名';
    }
    
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      errors.contactPhone = '请输入正确的手机号';
    }
    
    if (!formData.price.trim()) {
      errors.price = '请输入售价';
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      errors.price = '请输入正确的价格格式';
    }
    
    if (!formData.condition.trim()) {
      errors.condition = '请选择车辆状况';
    }
    
    if (!formData.location.trim()) {
      errors.location = '请选择所在地区';
    }
    
    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  /**
   * 保存车辆信息
   */
  async onSave() {
    if (this.data.submitting) return;
    
    // 表单验证
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    try {
      const { mode, carId, formData } = this.data;
      
      // TODO: 实际项目中这里应该调用API保存数据
      console.log('保存车辆信息:', { mode, carId, formData });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      wx.showToast({
        title: mode === 'edit' ? '更新成功' : '创建成功',
        icon: 'success',
        duration: 2000
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
      
    } catch (error) {
      console.error('保存车辆信息失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 取消操作
   */
  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '取消后已填写的信息将不会保存',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  }
});