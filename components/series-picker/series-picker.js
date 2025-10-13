// components/series-picker/series-picker.js
const { queryBrandDropdownList } = require('../../utils/vehicle-api.js');

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        // 控制组件显示隐藏
        show: {
            type: Boolean,
            value: false
        },
        // 弹窗标题
        title: {
            type: String,
            value: '选择车系'
        },
        // 默认选中值
        defaultValue: {
            type: Object,
            value: {}
        },
        // 占位提示文本
        placeholder: {
            type: String,
            value: '请选择车系'
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        // 加载状态
        loading: false,

        // 品牌数据
        brandList: [],

        // 已确认的选择状态（上一次确认的结果）
        confirmedBrandId: '',
        confirmedBrand: null,
        confirmedSeriesIds: [], // 已确认的车系ID数组

        // 临时选择状态（当前编辑中的状态）
        selectedBrandId: '',
        selectedBrand: null,
        selectedSeriesIds: [], // 临时选择的车系ID数组
    },

    /**
     * 生命周期函数
     */
    lifetimes: {
        attached() {
            this.loadVehicleData();
        }
    },

    /**
     * 属性观察器
     */
    observers: {
        'show': function(show) {
            if (show) {
                // 组件显示时，初始化临时选择状态
                this.initTempSelection();
            }
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 加载车型数据
         */
        loadVehicleData() {
            this.setData({ loading: true });

            // 调用真实接口获取品牌数据
            queryBrandDropdownList()
                .then((brandData) => {
                    console.log('品牌数据接口返回:', brandData);

                    // 适配数据结构，确保与组件期望的格式一致
                    const adaptedBrandList = this.adaptBrandData(brandData || []);

                    this.setData({
                        brandList: adaptedBrandList,
                        loading: false
                    });

                    // 如果有默认值，设置默认选中状态
                    if (this.data.defaultValue && this.data.defaultValue.brandId) {
                        this.setDefaultSelection();
                    } else {
                        // 没有默认值时，默认选中第一个品牌
                        this.setDefaultFirstBrand();
                    }

                    console.log('车型数据加载完成:', {
                        brandCount: this.data.brandList.length,
                        firstBrand: this.data.brandList[0]?.brandName
                    });
                })
                .catch((error) => {
                    console.error('加载品牌数据失败:', error);

                    // 设置默认选中状态
                    if (this.data.defaultValue && this.data.defaultValue.brandId) {
                        this.setDefaultSelection();
                    } else {
                        this.setDefaultFirstBrand();
                    }

                    // 显示错误提示（可选，因为request.js已经处理了错误提示）
                    wx.showToast({
                        title: '加载品牌数据失败，使用默认数据',
                        icon: 'none',
                        duration: 2000
                    });
                });
        },

        /**
         * 适配品牌数据结构
         * 将接口返回的数据格式适配为组件期望的格式
         */
        adaptBrandData(brandData) {
            if (!Array.isArray(brandData)) {
                console.warn('品牌数据格式异常，返回空数组');
                return [];
            }

            return brandData.map((brand) => {
                // 适配品牌数据结构
                const adaptedBrand = {
                    brandId: brand.brandId || brand.brandName, // 使用brandId，如果没有则使用brandName
                    brandName: brand.brandName || '',
                    brandLogo: brand.brandLogo || '', // 品牌logo
                    seriesList: []
                };

                // 适配车系数据
                if (Array.isArray(brand.seriesList)) {
                    adaptedBrand.seriesList = brand.seriesList.map((series) => {
                        const adaptedSeries = {
                            seriesId: series.seriesId || series.seriesName, // 使用seriesId，如果没有则使用seriesName
                            seriesName: series.seriesName || '',
                            modelList: []
                        };

                        // 适配车型数据
                        if (Array.isArray(series.modelList)) {
                            adaptedSeries.modelList = series.modelList.map((model) => ({
                                modelId: model.modelId, // 接口返回的是number类型
                                modelName: model.modelName || model.variant || '', // 款式名称
                                brand: model.brand || brand.brandName, // 品牌
                                series: model.series || series.seriesName, // 车系
                                variant: model.variant || model.modelName // 款式
                            }));
                        }

                        return adaptedSeries;
                    });
                }

                return adaptedBrand;
            });
        },

        /**
         * 设置默认选中第一个品牌
         */
        setDefaultFirstBrand() {
            const brandList = this.data.brandList;
            if (brandList && brandList.length > 0) {
                const firstBrand = brandList[0];
                // 同时设置已确认状态和临时选择状态
                this.setData({
                    // 已确认状态
                    confirmedBrandId: firstBrand.brandId,
                    confirmedBrand: firstBrand,
                    confirmedSeriesIds: [],
                    // 临时选择状态
                    selectedBrandId: firstBrand.brandId,
                    selectedBrand: firstBrand,
                    selectedSeriesIds: []
                });
            }
        },

        /**
         * 设置默认选中状态
         */
        setDefaultSelection() {
            const { brandId, seriesIds } = this.data.defaultValue;
            const brand = this.data.brandList.find((item) => item.brandId === brandId);

            if (brand) {
                // 同时设置已确认状态和临时选择状态
                this.setData({
                    // 已确认状态
                    confirmedBrandId: brandId,
                    confirmedBrand: brand,
                    confirmedSeriesIds: seriesIds || [],
                    // 临时选择状态
                    selectedBrandId: brandId,
                    selectedBrand: brand,
                    selectedSeriesIds: seriesIds || []
                });
            }
        },

        /**
         * 初始化临时选择状态
         * 组件显示时，将已确认状态复制到临时选择状态
         */
        initTempSelection() {
            const { confirmedBrandId, confirmedBrand, confirmedSeriesIds } = this.data;

            console.log('series-picker: 初始化临时选择状态', {
                confirmedBrandId,
                confirmedBrandName: confirmedBrand?.brandName,
                confirmedSeriesCount: confirmedSeriesIds.length
            });

            // 将已确认状态复制到临时选择状态
            this.setData({
                selectedBrandId: confirmedBrandId,
                selectedBrand: confirmedBrand,
                selectedSeriesIds: [...confirmedSeriesIds] // 创建新数组，避免引用问题
            });
        },

        /**
         * 保存确认状态
         * 将临时选择状态保存为已确认状态
         */
        saveConfirmedState() {
            const { selectedBrandId, selectedBrand, selectedSeriesIds } = this.data;

            console.log('series-picker: 保存确认状态', {
                selectedBrandId,
                selectedBrandName: selectedBrand?.brandName,
                selectedSeriesCount: selectedSeriesIds.length
            });

            // 将临时选择状态保存为已确认状态
            this.setData({
                confirmedBrandId: selectedBrandId,
                confirmedBrand: selectedBrand,
                confirmedSeriesIds: [...selectedSeriesIds] // 创建新数组，避免引用问题
            });
        },

        /**
         * 恢复到已确认状态
         * 取消时，将已确认状态恢复到临时选择状态
         */
        restoreToConfirmedState() {
            const { confirmedBrandId, confirmedBrand, confirmedSeriesIds } = this.data;

            console.log('series-picker: 恢复到已确认状态', {
                confirmedBrandId,
                confirmedBrandName: confirmedBrand?.brandName,
                confirmedSeriesCount: confirmedSeriesIds.length
            });

            // 将已确认状态恢复到临时选择状态
            this.setData({
                selectedBrandId: confirmedBrandId,
                selectedBrand: confirmedBrand,
                selectedSeriesIds: [...confirmedSeriesIds] // 创建新数组，避免引用问题
            });
        },

        /**
         * 品牌选择事件（直接切换，无loading）
         */
        onBrandSelect(e) {
            const brand = e.currentTarget.dataset.brand;
            // 直接切换品牌，清空选中的车系
            this.setData({
                selectedBrandId: brand.brandId,
                selectedBrand: brand,
                selectedSeriesIds: [] // 切换品牌时清空车系选择
            });

            console.log('品牌切换:', {
                brandName: brand.brandName,
                seriesCount: brand.seriesList ? brand.seriesList.length : 0
            });
        },

        /**
         * 车系选择事件（多选切换）
         */
        onSeriesSelect(e) {
            const { series } = e.currentTarget.dataset;
            const seriesId = series.seriesId;
            let selectedSeriesIds = [...this.data.selectedSeriesIds];

            // 切换选中状态
            const index = selectedSeriesIds.indexOf(seriesId);
            if (index > -1) {
                // 已选中，取消选择
                selectedSeriesIds.splice(index, 1);
            } else {
                // 未选中，添加选择
                selectedSeriesIds.push(seriesId);
            }

            this.setData({
                selectedSeriesIds: selectedSeriesIds
            });

            console.log('车系选择切换:', {
                seriesName: series.seriesName,
                isSelected: index === -1,
                totalSelected: selectedSeriesIds.length
            });
        },

        /**
         * 检查车系是否被选中
         */
        isSeriesSelected(seriesId) {
            return this.data.selectedSeriesIds.indexOf(seriesId) > -1;
        },

        /**
         * 确认选择
         */
        onConfirm() {
            const { selectedBrand, selectedSeriesIds } = this.data;

            if (!selectedBrand || selectedSeriesIds.length === 0) {
                wx.showToast({
                    title: '请选择车系',
                    icon: 'none'
                });
                return;
            }

            // 保存当前选择为已确认状态
            this.saveConfirmedState();

            // 构造选中的车系信息
            const selectedSeriesList = selectedBrand.seriesList.filter(
                series => selectedSeriesIds.indexOf(series.seriesId) > -1
            );

            // 构造回调数据
            const result = {
                brandInfo: {
                    brandId: selectedBrand.brandId,
                    brandName: selectedBrand.brandName
                },
                seriesList: selectedSeriesList.map(series => ({
                    seriesId: series.seriesId,
                    seriesName: series.seriesName
                })),
                selectedSeriesIds: selectedSeriesIds,
                displayText: selectedSeriesList.map(series => series.seriesName).join('、')
            };

            console.log('确认选择车系:', result);

            // 触发确认事件
            this.triggerEvent('onConfirm', result);

            // 延迟关闭组件，让用户看到选中效果
            setTimeout(() => {
                this.triggerEvent('onClose');
            }, 200);
        },

        /**
         * 取消选择
         */
        onCancel() {
            console.log('series-picker: 取消选择，恢复到上一次确认状态');

            // 恢复到上一次确认的状态
            this.restoreToConfirmedState();

            // 触发取消事件
            this.triggerEvent('onCancel');
            this.triggerEvent('onClose');
        },

        /**
         * 组件关闭事件
         */
        onClose() {
            this.triggerEvent('onClose');
        },

        /**
         * 重置内部选择状态
         * 允许外部组件重置series-picker的内部状态
         */
        resetSelection() {
            console.log('series-picker: 重置内部选择状态');

            // 重置临时选择状态
            const firstBrand = this.data.brandList && this.data.brandList.length > 0 
                ? this.data.brandList[0] 
                : null;

            this.setData({
                // 重置已确认状态
                confirmedBrandId: firstBrand ? firstBrand.brandId : '',
                confirmedBrand: firstBrand,
                confirmedSeriesIds: [],
                // 重置临时选择状态
                selectedBrandId: firstBrand ? firstBrand.brandId : '',
                selectedBrand: firstBrand,
                selectedSeriesIds: []
            });

            console.log('series-picker: 重置后状态', {
                confirmedBrandId: this.data.confirmedBrandId,
                confirmedBrandName: this.data.confirmedBrand?.brandName,
                confirmedSeriesIds: this.data.confirmedSeriesIds,
                selectedBrandId: this.data.selectedBrandId,
                selectedBrandName: this.data.selectedBrand?.brandName,
                selectedSeriesIds: this.data.selectedSeriesIds
            });
        }
    }
});
