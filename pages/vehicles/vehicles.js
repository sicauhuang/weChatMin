// pages/vehicles/vehicles.js
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

        // Mock车辆数据
        mockVehicleData: [
            {
                id: 'vehicle_001',
                brand: '奔驰',
                series: 'C级',
                model: 'C200L',
                year: '2023款',
                licensePlate: '京A12345',
                registrationDate: '2023-01',
                mileage: 1.5,
                color: '黑色',
                transferCount: 0,
                retailPrice: 32.98,
                dealPrice: 30.5,
                status: 'ON_SALE',
                statusName: '在售',
                isFavorited: false,
                publishTime: '2024-01-15',
                location: '北京',
                previewImage: '/assets/imgs/logo.png'
            },
            {
                id: 'vehicle_002',
                brand: '宝马',
                series: '3系',
                model: '320Li',
                year: '2022款',
                licensePlate: '沪B67890',
                registrationDate: '2022-06',
                mileage: 2.8,
                color: '白色',
                transferCount: 1,
                retailPrice: 28.9,
                dealPrice: 26.5,
                status: 'ON_SALE',
                statusName: '在售',
                isFavorited: true,
                publishTime: '2024-01-14',
                location: '上海',
                previewImage: '/assets/imgs/logo.png'
            },
            {
                id: 'vehicle_003',
                brand: '奥迪',
                series: 'A4L',
                model: '40 TFSI',
                year: '2021款',
                licensePlate: '粤C11111',
                registrationDate: '2021-12',
                mileage: 3.2,
                color: '银色',
                transferCount: 0,
                retailPrice: 25.8,
                dealPrice: 23.8,
                status: 'ON_SALE',
                statusName: '在售',
                isFavorited: false,
                publishTime: '2024-01-13',
                location: '深圳',
                previewImage: '/assets/imgs/logo.png'
            }
        ]
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

        // 加载车辆数据
        this.loadVehicleList(true);
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
        this.loadVehicleList(true);
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

        // 模拟API请求
        setTimeout(() => {
            const { mockVehicleData } = this.data;
            const { pageNum, pageSize } = this.data.pagination;

            // 模拟筛选逻辑
            let filteredData = this.applyFilters(mockVehicleData);

            // 模拟排序
            filteredData = this.applySorting(filteredData);

            // 模拟分页
            const startIndex = (pageNum - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageData = filteredData.slice(startIndex, endIndex);

            const hasMore = endIndex < filteredData.length;

            if (refresh) {
                this.setData({
                    vehicleList: pageData,
                    loading: false,
                    hasMore,
                    'pagination.total': filteredData.length
                });
            } else {
                this.setData({
                    vehicleList: [...this.data.vehicleList, ...pageData],
                    loadingMore: false,
                    hasMore,
                    'pagination.pageNum': pageNum + 1
                });
            }

            this.updateComputedData();
        }, 800);
    },

    /**
     * 应用筛选条件
     */
    applyFilters(data) {
        if (!this.data || !this.data.filterConditions) {
            return data;
        }

        const { keyword, brandInfo, ageRange, priceRange } = this.data.filterConditions;

        return data.filter((item) => {
            // 关键词筛选
            if (keyword) {
                const searchText = `${item.brand} ${item.series} ${item.model}`.toLowerCase();
                if (!searchText.includes(keyword.toLowerCase())) {
                    return false;
                }
            }

            // 品牌筛选
            if (brandInfo.brandName && item.brand !== brandInfo.brandName) {
                return false;
            }

            // 车系筛选
            if (brandInfo.seriesName && item.series !== brandInfo.seriesName) {
                return false;
            }

            // 车龄筛选（这里简化处理，实际应该根据注册日期计算）
            if (ageRange.type && ageRange.type !== 'unlimited') {
                // 简化：根据里程数模拟车龄
                const simulatedAge = Math.floor(item.mileage);
                if (simulatedAge < ageRange.min || simulatedAge > ageRange.max) {
                    return false;
                }
            }

            // 价格筛选
            if (priceRange.type && priceRange.type !== 'unlimited') {
                if (item.retailPrice < priceRange.min || item.retailPrice > priceRange.max) {
                    return false;
                }
            }

            return true;
        });
    },

    /**
     * 应用排序条件
     */
    applySorting(data) {
        if (!this.data || !this.data.filterConditions) {
            return data;
        }

        const { sortType } = this.data.filterConditions;

        switch (sortType) {
            case 'LATEST_PUBLISHED':
                return data.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
            case 'LOWEST_PRICE':
                return data.sort((a, b) => a.retailPrice - b.retailPrice);
            case 'HIGHEST_PRICE':
                return data.sort((a, b) => b.retailPrice - a.retailPrice);
            case 'SHORTEST_AGE':
                return data.sort((a, b) => a.mileage - b.mileage);
            default:
                return data; // 智能排序保持原顺序
        }
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

    onVehicleFavoriteToggle(e) {
        const { vehicleData, isFavorited } = e.detail;
        // 处理收藏/取消收藏逻辑
        const updatedList = this.data.vehicleList.map((item) => {
            if (item.id === vehicleData.id) {
                return { ...item, isFavorited };
            }
            return item;
        });

        this.setData({ vehicleList: updatedList });

        // TODO: 调用收藏接口
        wx.showToast({
            title: isFavorited ? '已收藏' : '已取消收藏',
            icon: 'success'
        });
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
    }
});
