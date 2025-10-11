// pages/car-form/car-form.js
const auth = require('../../utils/auth.js');
const storage = require('../../utils/storage.js');
const request = require('../../utils/request.js');
const apiConfig = require('../../config/api.js');
const { Toast } = require('../../utils/vant-helper.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        mode: 'create', // create | edit
        carId: null,

        // 根据设计文档的数据模型
        formData: {
            // 车辆信息
            carName: '',
            brandModel: '',
            carAge: '',
            color: '',
            mileage: '',
            transferCount: '',
            plateDate: '',
            plateCity: '',
            usageType: '',
            condition: '',
            modifications: '',
            images: [],

            // 售卖信息
            lowPrice: '',
            sellPrice: '',
            contactInfo: ''
        },

        // 表单验证错误
        errors: {},

        // Vant 弹窗状态
        showDatePopup: false,
        showVehiclePicker: false,
        currentDate: new Date().getTime(),

        // 图片列表（Vant Uploader格式）
        imageList: [],

        // UI状态
        loading: false,
        submitting: false,
        scrollTop: 0 // 用于scroll-view的滚动定位
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('车辆表单页面加载:', options);

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
        } else {
            // 新建模式：初始化用户信息
            this.initUserInfo();
        }
    },

    /**
     * 初始化用户信息（新建模式）
     */
    initUserInfo() {
        // 新建模式不自动回填手机号，因为填写的手机号不一定是机主的
        console.log('新建模式：不自动回填用户手机号');
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
                carName: '2020款奥迪A4L',
                brandModel: '奥迪A4L',
                carAge: 3,
                color: '珍珠白',
                mileage: 5.5,
                transferCount: 1,
                plateDate: '2020-08-15',
                plateCity: '北京',
                usageType: '非营运',
                condition: '车况良好，定期保养',
                modifications: '原厂导航，倒车雷达',
                images: [],
                lowPrice: 18.5,
                sellPrice: 20.8,
                contactInfo: '138****1234'
            };

            this.setData({
                formData: mockData
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
     * 输入框值改变（Vant Field）
     */
    onInputChange(e) {
        const { field } = e.currentTarget.dataset;
        const { value } = e.detail;

        this.setData({
            [`formData.${field}`]: value
        });
    },

    // ===== Vant 选择器相关方法 =====

    /**
     * 显示车型选择器
     */
    showVehiclePicker() {
        this.setData({ showVehiclePicker: true });
    },

    /**
     * 隐藏车型选择器
     */
    hideVehiclePicker() {
        this.setData({ showVehiclePicker: false });
    },

    /**
     * 车型选择确认
     */
    onVehicleConfirm(e) {
        const { displayText, modelId, brandInfo, seriesInfo, modelInfo } = e.detail;
        
        console.log('车型选择结果:', {
            displayText,
            modelId,
            brandInfo,
            seriesInfo,
            modelInfo
        });
        
        // 更新表单数据
        this.setData({
            'formData.brandModel': displayText,
            'formData.modelId': modelId,
            showVehiclePicker: false
        });
        
        Toast.success('选择成功');
    },

    /**
     * 车型选择取消
     */
    onVehicleCancel() {
        this.setData({ showVehiclePicker: false });
    },

    /**
     * 显示日期选择器
     */
    showDatePicker() {
        // 设置当前日期为默认值
        const currentDate = this.data.formData.plateDate
            ? new Date(this.data.formData.plateDate).getTime()
            : new Date().getTime();

        this.setData({
            showDatePopup: true,
            currentDate: currentDate
        });
    },

    /**
     * 隐藏日期选择器
     */
    hideDatePicker() {
        this.setData({ showDatePopup: false });
    },

    /**
     * 日期选择确认
     */
    onDateConfirm(e) {
        console.log('日期选择事件参数:', e);
        
        // 正确的获取方式：event.detail 直接就是日期值（时间戳）
        const timestamp = e.detail;
        
        if (!timestamp || isNaN(timestamp)) {
            console.error('日期格式错误:', timestamp);
            return;
        }
        
        const date = new Date(timestamp);
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            console.error('日期对象无效:', timestamp);
            return;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        this.setData({
            'formData.plateDate': formattedDate,
            showDatePopup: false
        });
        
        console.log('日期选择结果:', formattedDate);
    },

    /**
     * 图片上传（Vant Uploader）
     */
    onImageUpload(e) {
        const { file } = e.detail;
        const maxImages = 5;
        const currentCount = this.data.imageList.length;

        if (currentCount >= maxImages) {
            Toast.fail(`最多只能上传${maxImages}张图片`);
            return;
        }

        // 更新图片列表
        const imageList = [...this.data.imageList];
        const images = [...this.data.formData.images];

        // 添加新图片
        imageList.push({
            url: file.url || file.path,
            name: file.name || 'image',
            isImage: true
        });

        images.push(file.url || file.path);

        this.setData({
            imageList: imageList,
            'formData.images': images
        });

        console.log('图片上传成功:', file);
    },

    /**
     * 删除图片（Vant Uploader）
     */
    onImageDelete(e) {
        const { index } = e.detail;
        const imageList = [...this.data.imageList];
        const images = [...this.data.formData.images];

        // 删除指定索引的图片
        imageList.splice(index, 1);
        images.splice(index, 1);

        this.setData({
            imageList: imageList,
            'formData.images': images
        });

        console.log('图片删除成功, 索引:', index);
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

        // 定义字段映射表（用于显示友好的字段名称）
        const fieldLabels = {
            carName: '车辆名称',
            brandModel: '品牌车型',
            carAge: '车龄',
            color: '车辆颜色',
            mileage: '里程数',
            transferCount: '过户次数',
            plateDate: '上牌日期',
            plateCity: '上牌城市',
            usageType: '使用性质',
            lowPrice: '底价',
            sellPrice: '售价',
            contactInfo: '联系方式'
        };

        // 字段验证顺序（按照页面上的显示顺序）
        const fieldOrder = [
            'carName',
            'brandModel',
            'carAge',
            'color',
            'mileage',
            'transferCount',
            'plateDate',
            'plateCity',
            'usageType',
            'lowPrice',
            'sellPrice',
            'contactInfo'
        ];

        // 必填字段验证
        if (!formData.brandModel.trim()) {
            errors.brandModel = '请输入品牌车型';
        }

        if (!formData.carAge) {
            errors.carAge = '请输入车龄';
        } else if (!/^\d+$/.test(formData.carAge) || parseInt(formData.carAge) < 0) {
            errors.carAge = '请输入正确的车龄';
        }

        if (!formData.color.trim()) {
            errors.color = '请输入车辆颜色';
        }

        if (!formData.mileage) {
            errors.mileage = '请输入里程数';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.mileage)) {
            errors.mileage = '请输入正确的里程格式';
        }

        if (
            formData.transferCount === '' ||
            formData.transferCount === null ||
            formData.transferCount === undefined
        ) {
            errors.transferCount = '请输入过户次数';
        } else if (!/^\d+$/.test(formData.transferCount) || parseInt(formData.transferCount) < 0) {
            errors.transferCount = '请输入正确的过户次数';
        }

        if (!formData.plateDate.trim()) {
            errors.plateDate = '请选择上牌日期';
        }

        if (!formData.plateCity.trim()) {
            errors.plateCity = '请输入上牌城市';
        }

        if (!formData.usageType.trim()) {
            errors.usageType = '请输入使用性质';
        }

        if (!formData.lowPrice) {
            errors.lowPrice = '请输入底价';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.lowPrice)) {
            errors.lowPrice = '请输入正确的价格格式';
        }

        if (!formData.sellPrice) {
            errors.sellPrice = '请输入售价';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.sellPrice)) {
            errors.sellPrice = '请输入正确的价格格式';
        }

        if (!formData.contactInfo.trim()) {
            errors.contactInfo = '请输入联系方式';
        } else if (!/^1[3-9]\d{9}$/.test(formData.contactInfo)) {
            errors.contactInfo = '请输入正确的手机号';
        }

        // 价格交叉验证
        if (formData.lowPrice && formData.sellPrice) {
            const lowPrice = parseFloat(formData.lowPrice);
            const sellPrice = parseFloat(formData.sellPrice);
            if (lowPrice > sellPrice) {
                errors.lowPrice = '底价不能高于售价';
            }
        }

        // 返回验证结果
        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) {
            // 找到第一个错误字段
            const firstErrorField = fieldOrder.find((field) => errors[field]);
            return {
                isValid: false,
                firstErrorField: firstErrorField,
                firstErrorMessage: errors[firstErrorField],
                firstErrorLabel: fieldLabels[firstErrorField]
            };
        }

        return { isValid: true };
    },

    /**
     * 保存车辆信息
     */
    async onSave() {
        if (this.data.submitting) return;

        // 表单验证
        const validationResult = this.validateForm();
        if (!validationResult.isValid) {
            // 显示toast提示
            Toast(`请完善「${validationResult.firstErrorLabel}」`);

            // 滚动到错误字段
            this.scrollToField(validationResult.firstErrorField);
            return;
        }

        this.setData({ submitting: true });

        try {
            const { mode, carId, formData } = this.data;

            if (mode === 'create') {
                // 新建模式：调用创建 API
                await this.createVehicle(formData);
                Toast.success('创建成功');
            } else {
                // 编辑模式：调用更新 API
                await this.updateVehicle(carId, formData);
                Toast.success('更新成功');
            }

            // 返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        } catch (error) {
            console.error('保存车辆信息失败:', error);
            Toast.fail('保存失败');
        } finally {
            this.setData({ submitting: false });
        }
    },

    /**
     * 滚动到指定字段
     */
    scrollToField(fieldName) {
        // 字段对应的选择器ID映射
        const fieldSelectors = {
            carName: '.van-field[data-field="carName"]',
            brandModel: '.car-brandModel',
            carAge: '.van-field[data-field="carAge"]',
            color: '.van-field[data-field="color"]',
            mileage: '.van-field[data-field="mileage"]',
            transferCount: '.van-field[data-field="transferCount"]',
            plateDate: '.car-plateDate',
            plateCity: '.van-field[data-field="plateCity"]',
            usageType: '.van-field[data-field="usageType"]',
            lowPrice: '.van-field[data-field="lowPrice"]',
            sellPrice: '.van-field[data-field="sellPrice"]',
            contactInfo: '.van-field[data-field="contactInfo"]'
        };

        const selector = fieldSelectors[fieldName];
        if (selector) {
            // 使用scroll-view的scrollIntoView方式
            // 首先获取元素位置
            wx.createSelectorQuery()
                .in(this)
                .select(selector)
                .boundingClientRect((rect) => {
                    if (rect) {
                        // 获取scroll-view的位置
                        wx.createSelectorQuery()
                            .in(this)
                            .select('.form-container')
                            .boundingClientRect((scrollRect) => {
                                if (scrollRect) {
                                    // 计算相对于scroll-view的位置
                                    const scrollTop = rect.top - scrollRect.top - 50; // 预留50rpx的上边距

                                    // 设置scroll-view的scrollTop
                                    this.setData({
                                        scrollTop: Math.max(0, scrollTop)
                                    });
                                }
                            })
                            .exec();
                    }
                })
                .exec();
        }
    },

    /**
     * 创建车辆（新建模式）
     */
    async createVehicle(formData) {
        // TODO: 实际项目中调用真实的API
        const apiUrl = apiConfig.currentEnv.getApiUrl('/api/vehicles');

        // 模拟 API 调用
        console.log('创建车辆 API 调用:', {
            url: apiUrl,
            method: 'POST',
            data: formData
        });

        // 模拟网络延时
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 模拟成功响应
        return {
            success: true,
            data: {
                carId: 'new_car_' + Date.now(),
                message: '车辆创建成功'
            }
        };
    },

    /**
     * 更新车辆（编辑模式）
     */
    async updateVehicle(carId, formData) {
        // TODO: 实际项目中调用真实的API
        const apiUrl = apiConfig.currentEnv.getApiUrl(`/api/vehicles/${carId}`);

        // 模拟 API 调用
        console.log('更新车辆 API 调用:', {
            url: apiUrl,
            method: 'PUT',
            data: formData
        });

        // 模拟网络延时
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 模拟成功响应
        return {
            success: true,
            data: {
                carId: carId,
                message: '车辆更新成功'
            }
        };
    }
});
