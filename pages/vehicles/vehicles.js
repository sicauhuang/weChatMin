// pages/vehicles/vehicles.js
const vehicleApi = require('../../utils/vehicle-api.js');
const auth = require('../../utils/auth.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        // 筛选条件
        filterConditions: {
            keyword: '',
            sortType: 'SMART',
            brandInfo: {
                brandId: '',
                brandName: '',
                seriesId: '',
                seriesName: '',
                modelId: '',
                modelName: ''
            },
            ageRange: {
                min: 0,
                max: 0,
                type: 'unlimited'
            },
            priceRange: {
                min: 0,
                max: 0,
                type: 'unlimited'
            }
        },

        // 车辆列表数据
        vehicleList: [],

        // UI状态
        loading: false,
        refreshing: false,
        loadingMore: false,
        hasMore: true,
        showVehiclePicker: false,

        // 分页信息
        pagination: {
            pageNum: 1,
            pageSize: 20,
            total: 0
        },

        // 排序选项
        sortOptions: [
            { text: '智能排序', value: 'SMART' },
            { text: '最新上架', value: 'LATEST_PUBLISHED' },
            { text: '价格最低', value: 'LOWEST_PRICE' },
            { text: '价格最高', value: 'HIGHEST_PRICE' },
            { text: '车龄最短', value: 'SHORTEST_AGE' }
        ],

        // 车龄选项
        ageOptions: [
            { label: '不限', value: 'unlimited' },
            { label: '1年以内', value: '0-1' },
            { label: '3年以内', value: '0-3' },
            { label: '5年以内', value: '0-5' },
            { label: '10年以内', value: '0-10' },
            { label: '1-3年', value: '1-3' },
            { label: '3-5年', value: '3-5' },
            { label: '5-10年', value: '5-10' },
            { label: '10年以上', value: '10-999' },
            { label: '自定义', value: 'custom' }
        ],

        // 价格选项
        priceOptions: [
            { label: '不限', value: 'unlimited' },
            { label: '1万以下', value: '0-1' },
            { label: '5万以下', value: '0-5' },
            { label: '5-10万', value: '5-10' },
            { label: '10-15万', value: '10-15' },
            { label: '15-20万', value: '15-20' },
            { label: '20万以上', value: '20-999' },
            { label: '自定义', value: 'custom' }
        ],

        // 临时选择状态（用于筛选面板）
        tempAgeSelection: 'unlimited',
        tempAgeRange: { min: '', max: '' },
        tempPriceSelection: 'unlimited',
        tempPriceRange: { min: '', max: '' },

        // 筛选标题显示
        brandTitle: '品牌',
        ageTitle: '车龄',
        priceTitle: '价格',

        // 排序选项映射
        sortTypeMap: {
            'SMART': '智能排序',
            'LATEST_PUBLISHED': '最新上架',
            'LOWEST_PRICE': '价格最低',
            'HIGHEST_PRICE': '价格最高',
            'SHORTEST_AGE': '车龄最短'
        },

        // 登录状态
        isLoggedIn: false
    },

    /**
     * 计算属性
     */
    computed: {
        // 是否有激活的筛选条件
        hasActiveFilters() {
            if (!this.data || !this.data.filterConditions) {
                return false;
            }
            const { brandInfo, ageRange, priceRange } = this.data.filterConditions;
            return !!(
                brandInfo.brandName ||
                (ageRange.type && ageRange.type !== 'unlimited') ||
                (priceRange.type && priceRange.type !== 'unlimited')
            );
        },

        // 车龄显示文本
        ageDisplayText() {
            if (!this.data || !this.data.filterConditions) {
                return '';
            }
            return this.getAgeDisplayText(this.data.filterConditions.ageRange);
        },

        // 价格显示文本
        priceDisplayText() {
            if (!this.data || !this.data.filterConditions) {
                return '';
            }
            return this.getPriceDisplayText(this.data.filterConditions.priceRange);
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 从本地存储读取筛选条件（先初始化数据）
        this.loadFilterConditionsFromStorage();

        // 初始化计算属性
        this.updateComputedData();

        // 检查登录状态并加载数据
        this.checkLoginAndLoadData();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 设置tabBar选中状态
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 1
            });
        }

        // 重新检查登录状态
        this.checkLoginAndLoadData();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        // 检查登录状态
        const isLoggedIn = auth.checkLoginStatus();
        if (isLoggedIn) {
            this.loadVehicleList(true);
        }
        setTimeout(() => {
            wx.stopPullDownRefresh();
        }, 1000);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        if (this.data.hasMore && !this.data.loadingMore) {
            this.loadVehicleList(false);
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '车源信息',
            path: '/pages/vehicles/vehicles'
        };
    },

    /**
     * 加载车辆列表数据
     */
    loadVehicleList(refresh = false) {
        if (refresh) {
            this.setData({
                loading: true,
                vehicleList: [],
                'pagination.pageNum': 1
            });
        } else {
            this.setData({ loadingMore: true });
        }

        // 构建请求参数
        const params = this.buildApiParams();

        console.log('vehicles: 请求车辆列表参数:', params);

        // 调用真实API
        vehicleApi.queryOnSaleCarPage(params)
            .then((response) => {
                console.log('vehicles: 车辆列表响应:', response);

                // 处理响应数据
                const { list = [], total = 0, pageNum, pageSize } = response;

                // 转换数据格式
                const processedList = this.processVehicleData(list);

                // 计算是否还有更多数据
                const hasMore = (pageNum * pageSize) < total;

                if (refresh) {
                    this.setData({
                        vehicleList: processedList,
                        loading: false,
                        hasMore,
                        'pagination.total': total,
                        'pagination.pageNum': pageNum + 1
                    });
                } else {
                    this.setData({
                        vehicleList: [...this.data.vehicleList, ...processedList],
                        loadingMore: false,
                        hasMore,
                        'pagination.pageNum': pageNum + 1
                    });
                }

                this.updateComputedData();
            })
            .catch((error) => {
                console.error('vehicles: 车辆列表请求失败:', error);

                this.setData({
                    loading: false,
                    loadingMore: false
                });

                // 根据错误类型显示不同提示
                if (error.code === 'NETWORK_ERROR') {
                    wx.showToast({
                        title: '网络连接失败',
                        icon: 'none',
                        duration: 2000
                    });
                } else {
                    wx.showToast({
                        title: error.userMessage || '加载失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            });
    },

    /**
     * 构建API请求参数
     */
    buildApiParams() {
        const { filterConditions, pagination } = this.data;
        const { keyword, sortType, brandInfo, ageRange, priceRange } = filterConditions;
        const { pageNum, pageSize } = pagination;

        const params = {
            pageNum,
            pageSize
        };

        // 关键词搜索
        if (keyword && keyword.trim()) {
            params.keyword = keyword.trim();
        }

        // 排序方式
        if (sortType) {
            params.sortType = sortType;
        }

        // 品牌筛选
        if (brandInfo.brandName) {
            params.brand = brandInfo.brandName;
        }

        // 车系筛选
        if (brandInfo.seriesName) {
            params.series = brandInfo.seriesName;
        }

        // 款式筛选
        if (brandInfo.modelName) {
            params.variant = brandInfo.modelName;
        }

        // 车龄筛选
        if (ageRange.type && ageRange.type !== 'unlimited') {
            if (ageRange.min !== undefined && ageRange.min > 0) {
                params.startAge = ageRange.min;
            }
            if (ageRange.max !== undefined && ageRange.max < 999) {
                params.endAge = ageRange.max;
            }
        }

        // 价格筛选
        if (priceRange.type && priceRange.type !== 'unlimited') {
            if (priceRange.min !== undefined && priceRange.min > 0) {
                params.startPrice = priceRange.min;
            }
            if (priceRange.max !== undefined && priceRange.max < 999) {
                params.endPrice = priceRange.max;
            }
        }

        return params;
    },

    /**
     * 处理车辆数据格式
     */
    processVehicleData(vehicleList) {
        return vehicleList.map(vehicle => {
            // 转换数据格式以适配car-card组件
            return {
                // 基础ID字段，car-card组件需要carId字段
                id: vehicle.id,
                carId: vehicle.id,

                // 车辆基本信息
                name: vehicle.name || `${vehicle.brand} ${vehicle.series} ${vehicle.variant}`,
                brand: vehicle.brand,
                series: vehicle.series,
                model: vehicle.variant, // car-card组件使用model字段，接口返回的是variant
                variant: vehicle.variant,

                // 车辆详细信息
                age: vehicle.age,
                registrationDate: vehicle.licenseDate, // car-card组件期望registrationDate字段
                licenseDate: vehicle.licenseDate, // 保留原字段名
                mileage: vehicle.mileage,
                color: vehicle.color,
                transferCount: vehicle.transferCount,

                // 价格信息，car-card组件期望retailPrice字段
                retailPrice: vehicle.sellPrice, // car-card组件使用retailPrice字段
                sellPrice: vehicle.sellPrice, // 保留原字段名
                floorPrice: vehicle.floorPrice,

                // 状态和收藏信息
                status: vehicle.status,
                statusName: vehicle.statusName,
                isFavorited: vehicle.favorStatus === 'FAVORITE',
                favorStatus: vehicle.favorStatus,

                // 时间和联系信息
                publishTime: vehicle.publishTime,
                contactPhone: vehicle.contactPhone,

                // 图片信息
                imageUrlList: vehicle.imageUrlList,
                previewImage: vehicle.imageUrlList && vehicle.imageUrlList.length > 0
                    ? vehicle.imageUrlList[0].fileUrl
                    : '/assets/imgs/logo.png'
            };
        });
    },

    /**
     * 更新计算属性数据
     */
    updateComputedData() {
        // 添加安全检查
        if (!this.data || !this.data.filterConditions) {
            return;
        }

        this.setData({
            hasActiveFilters: this.computed.hasActiveFilters(),
            ageDisplayText: this.computed.ageDisplayText(),
            priceDisplayText: this.computed.priceDisplayText()
        });
    },

    /**
     * 工具方法
     */
    getAgeDisplayText(ageRange) {
        if (!ageRange.type || ageRange.type === 'unlimited') {
            return '';
        }

        if (ageRange.type === 'custom') {
            return `${ageRange.min}-${ageRange.max}年`;
        }

        const option = this.data.ageOptions.find((opt) => opt.value === ageRange.type);
        return option ? option.label : '';
    },

    getPriceDisplayText(priceRange) {
        if (!priceRange.type || priceRange.type === 'unlimited') {
            return '';
        }

        if (priceRange.type === 'custom') {
            return `${priceRange.min}-${priceRange.max}万`;
        }

        const option = this.data.priceOptions.find((opt) => opt.value === priceRange.type);
        return option ? option.label : '';
    },

    /**
     * 本地存储相关
     */
    saveFilterConditionsToStorage() {
        try {
            wx.setStorageSync('vehicles_filter_conditions', this.data.filterConditions);
        } catch (e) {
            console.error('保存筛选条件失败:', e);
        }
    },

    loadFilterConditionsFromStorage() {
        try {
            const filterConditions = wx.getStorageSync('vehicles_filter_conditions');
            if (filterConditions) {
                this.setData({ filterConditions });
                this.updateComputedData();
            }
        } catch (e) {
            console.error('读取筛选条件失败:', e);
        }
    },

    /**
     * 搜索相关事件
     */
    onSearch() {
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    onSearchChange(e) {
        this.setData({
            'filterConditions.keyword': e.detail
        });
    },

    onSearchClear() {
        this.setData({
            'filterConditions.keyword': ''
        });
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    /**
     * 排序相关事件
     */
    onSortChange(e) {
        this.setData({
            'filterConditions.sortType': e.detail
        });
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    /**
     * 车龄筛选相关事件
     */
    onAgeDropdownOpen() {
        // 重置临时选择状态
        if (!this.data || !this.data.filterConditions) {
            return;
        }
        const { ageRange } = this.data.filterConditions;
        this.setData({
            tempAgeSelection: ageRange.type || 'unlimited',
            tempAgeRange: {
                min: ageRange.min || '',
                max: ageRange.max || ''
            }
        });
    },

    onAgeDropdownClose() {
        // 可以在这里处理关闭事件
    },

    onAgeOptionSelect(e) {
        const { value } = e.currentTarget.dataset;
        this.setData({ tempAgeSelection: value });

        if (value !== 'custom') {
            this.setData({
                tempAgeRange: { min: '', max: '' }
            });
        }
    },

    onAgeMinChange(e) {
        this.setData({
            'tempAgeRange.min': e.detail
        });
    },

    onAgeMaxChange(e) {
        this.setData({
            'tempAgeRange.max': e.detail
        });
    },

    onConfirmAge() {
        const { tempAgeSelection, tempAgeRange } = this.data;
        let ageRange = { type: tempAgeSelection };

        if (tempAgeSelection === 'custom') {
            ageRange.min = parseFloat(tempAgeRange.min) || 0;
            ageRange.max = parseFloat(tempAgeRange.max) || 999;
        } else if (tempAgeSelection !== 'unlimited') {
            // 解析预设范围
            const parts = tempAgeSelection.split('-');
            ageRange.min = parseFloat(parts[0]) || 0;
            ageRange.max = parseFloat(parts[1]) || 999;
        }

        this.setData({
            'filterConditions.ageRange': ageRange
        });
        this.updateComputedData();
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();

        // 关闭筛选下拉面板
        this.selectComponent('#vehicleDropdownMenu').close();
    },

    onResetAge() {
        this.setData({
            tempAgeSelection: 'unlimited',
            tempAgeRange: { min: '', max: '' }
        });
    },

    onClearAge() {
        this.setData({
            'filterConditions.ageRange': {
                min: 0,
                max: 0,
                type: 'unlimited'
            }
        });
        this.updateComputedData();
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    /**
     * 价格筛选相关事件
     */
    onPriceDropdownOpen() {
        // 重置临时选择状态
        if (!this.data || !this.data.filterConditions) {
            return;
        }
        const { priceRange } = this.data.filterConditions;
        this.setData({
            tempPriceSelection: priceRange.type || 'unlimited',
            tempPriceRange: {
                min: priceRange.min || '',
                max: priceRange.max || ''
            }
        });
    },

    onPriceDropdownClose() {
        // 可以在这里处理关闭事件
    },

    onPriceOptionSelect(e) {
        const { value } = e.currentTarget.dataset;
        this.setData({ tempPriceSelection: value });

        if (value !== 'custom') {
            this.setData({
                tempPriceRange: { min: '', max: '' }
            });
        }
    },

    onPriceMinChange(e) {
        this.setData({
            'tempPriceRange.min': e.detail
        });
    },

    onPriceMaxChange(e) {
        this.setData({
            'tempPriceRange.max': e.detail
        });
    },

    onConfirmPrice() {
        const { tempPriceSelection, tempPriceRange } = this.data;
        let priceRange = { type: tempPriceSelection };

        if (tempPriceSelection === 'custom') {
            priceRange.min = parseFloat(tempPriceRange.min) || 0;
            priceRange.max = parseFloat(tempPriceRange.max) || 999;
        } else if (tempPriceSelection !== 'unlimited') {
            // 解析预设范围
            const parts = tempPriceSelection.split('-');
            priceRange.min = parseFloat(parts[0]) || 0;
            priceRange.max = parseFloat(parts[1]) || 999;
        }

        this.setData({
            'filterConditions.priceRange': priceRange
        });
        this.updateComputedData();
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();

        // 关闭筛选下拉面板
        this.selectComponent('#vehicleDropdownMenu').close();
    },

    onResetPrice() {
        this.setData({
            tempPriceSelection: 'unlimited',
            tempPriceRange: { min: '', max: '' }
        });
    },

    onClearPrice() {
        this.setData({
            'filterConditions.priceRange': {
                min: 0,
                max: 0,
                type: 'unlimited'
            }
        });
        this.updateComputedData();
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    /**
     * 筛选条件管理
     */
    onClearAllFilters() {
        this.setData({
            'filterConditions.keyword': '',
            'filterConditions.brandInfo': {
                brandId: '',
                brandName: '',
                seriesId: '',
                seriesName: '',
                modelId: '',
                modelName: ''
            },
            'filterConditions.ageRange': {
                min: 0,
                max: 0,
                type: 'unlimited'
            },
            'filterConditions.priceRange': {
                min: 0,
                max: 0,
                type: 'unlimited'
            }
        });
        this.updateComputedData();
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    /**
     * 车辆卡片相关事件
     */
    onVehicleCardTap(e) {
        const { vehicleData } = e.detail;
        // 跳转到车辆详情页
        wx.navigateTo({
            url: `/pages/car-detail/car-detail?id=${vehicleData.id}`
        });
    },

    /**
     * 处理收藏状态变化事件（新版本）
     * car-card组件已经处理了API调用，这里只需要更新本地数据
     */
    onVehicleFavoriteToggle(e) {
        const { vehicleData, isFavorited, success } = e.detail;

        // 只在成功时更新本地数据
        if (success && vehicleData && vehicleData.carId) {
            console.log('vehicles: 收藏状态变化，更新本地数据:', {
                carId: vehicleData.carId,
                isFavorited
            });

            // 获取当前车辆列表
            const vehicleList = [...this.data.vehicleList];
            const vehicleIndex = vehicleList.findIndex(
                (vehicle) => vehicle.carId === vehicleData.carId
            );

            if (vehicleIndex !== -1) {
                // 更新收藏状态
                vehicleList[vehicleIndex].isFavorited = isFavorited;

                // 更新数据
                this.setData({
                    vehicleList: vehicleList
                });

                console.log('vehicles: 本地数据更新成功');
            } else {
                console.warn('vehicles: 未找到对应车辆信息:', { carId: vehicleData.carId });
            }
        } else if (!success) {
            console.log('vehicles: 收藏操作失败，不更新本地数据');
        }
    },

    /**
     * 品牌选择相关事件
     */
    onBrandBeforeToggle(e) {
        const { status, callback } = e.detail;
        if (status) {
            // 当尝试打开下拉面板时，阻止默认行为，改为显示 vehicle-picker
            this.setData({ showVehiclePicker: true });
            callback(false); // 阻止下拉面板展开
        } else {
            // 关闭操作，允许正常关闭
            callback(true);
        }
    },

    onShowVehiclePicker() {
        this.setData({ showVehiclePicker: true });
    },

    onVehiclePickerConfirm(e) {
        const { brandInfo, seriesInfo, modelInfo } = e.detail;
        this.setData({
            'filterConditions.brandInfo': {
                brandId: brandInfo.brandId,
                brandName: brandInfo.brandName,
                seriesId: seriesInfo.seriesId,
                seriesName: seriesInfo.seriesName,
                modelId: modelInfo.modelId,
                modelName: modelInfo.modelName
            },
            showVehiclePicker: false
        });
        this.updateComputedData();
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    onVehiclePickerCancel() {
        this.setData({ showVehiclePicker: false });
    },

    onVehiclePickerClose() {
        this.setData({ showVehiclePicker: false });
    },

    onClearBrand() {
        this.setData({
            'filterConditions.brandInfo': {
                brandId: '',
                brandName: '',
                seriesId: '',
                seriesName: '',
                modelId: '',
                modelName: ''
            }
        });
        this.updateComputedData();
        this.loadVehicleList(true);
        this.saveFilterConditionsToStorage();
    },

    /**
     * 车辆卡片点击事件
     * @param {Object} event 事件对象
     */
    onVehicleCardTap(event) {
        const { vehicleData } = event.detail;
        if (!vehicleData || !vehicleData.id) {
            console.error('车辆数据无效:', vehicleData);
            return;
        }

        console.log('点击车辆卡片:', vehicleData.id);

        // 跳转到车辆详情页
        wx.navigateTo({
            url: `/pages/car-detail/car-detail?carId=${vehicleData.id}`,
            success: () => {
                console.log('跳转到车辆详情页面成功:', vehicleData.id);
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
     * 检查登录状态并加载数据
     */
    checkLoginAndLoadData() {
        console.log('vehicles: 检查登录状态');
        const isLoggedIn = auth.checkLoginStatus();

        this.setData({ isLoggedIn });

        if (isLoggedIn) {
            console.log('vehicles: 用户已登录，加载车辆数据');
            this.loadVehicleList(true);
        } else {
            console.log('vehicles: 用户未登录，显示登录提示');
            this.setData({
                vehicleList: [],
                loading: false
            });
        }
    },

    /**
     * 跳转到登录页面
     */
    onGoLogin() {
        console.log('vehicles: 跳转到登录页面');
        wx.navigateTo({
            url: '/pages/login/login',
            success: () => {
                console.log('vehicles: 跳转登录页面成功');
            },
            fail: (error) => {
                console.error('vehicles: 跳转登录页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

});
