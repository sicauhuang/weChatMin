// components/vehicle-picker/vehicle-picker.js
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
            value: '选择车型'
        },
        // 默认选中值
        defaultValue: {
            type: Object,
            value: {}
        },
        // 占位提示文本
        placeholder: {
            type: String,
            value: '请选择车型'
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

        // 选中状态
        selectedBrandId: '',
        selectedBrand: null,
        selectedSeriesId: '',
        selectedModelId: '',

        // Mock数据
        mockVehicleData: [
            {
                brandId: 'brand_001',
                brandName: '奔驰',
                brandLogo: '/images/logos/benz.png',
                seriesList: [
                    {
                        seriesId: 'series_001',
                        seriesName: 'C级',
                        modelList: [
                            {
                                modelId: 'model_001',
                                modelName: 'C200L',
                                modelYear: '2023款',
                                price: 329800
                            },
                            {
                                modelId: 'model_002',
                                modelName: 'C260L',
                                modelYear: '2023款',
                                price: 379800
                            },
                            {
                                modelId: 'model_003',
                                modelName: 'C300L',
                                modelYear: '2023款',
                                price: 429800
                            }
                        ]
                    },
                    {
                        seriesId: 'series_002',
                        seriesName: 'E级',
                        modelList: [
                            {
                                modelId: 'model_004',
                                modelName: 'E200L',
                                modelYear: '2023款',
                                price: 459800
                            },
                            {
                                modelId: 'model_005',
                                modelName: 'E300L',
                                modelYear: '2023款',
                                price: 529800
                            }
                        ]
                    }
                ]
            },
            {
                brandId: 'brand_002',
                brandName: '宝马',
                brandLogo: '/images/logos/bmw.png',
                seriesList: [
                    {
                        seriesId: 'series_003',
                        seriesName: '3系',
                        modelList: [
                            {
                                modelId: 'model_006',
                                modelName: '320Li',
                                modelYear: '2023款',
                                price: 319800
                            },
                            {
                                modelId: 'model_007',
                                modelName: '325Li',
                                modelYear: '2023款',
                                price: 369800
                            }
                        ]
                    },
                    {
                        seriesId: 'series_004',
                        seriesName: '5系',
                        modelList: [
                            {
                                modelId: 'model_008',
                                modelName: '525Li',
                                modelYear: '2023款',
                                price: 449800
                            },
                            {
                                modelId: 'model_009',
                                modelName: '530Li',
                                modelYear: '2023款',
                                price: 519800
                            }
                        ]
                    }
                ]
            },
            {
                brandId: 'brand_003',
                brandName: '奥迪',
                brandLogo: '/images/logos/audi.png',
                seriesList: [
                    {
                        seriesId: 'series_005',
                        seriesName: 'A4L',
                        modelList: [
                            {
                                modelId: 'model_010',
                                modelName: '40 TFSI',
                                modelYear: '2023款',
                                price: 329900
                            },
                            {
                                modelId: 'model_011',
                                modelName: '45 TFSI',
                                modelYear: '2023款',
                                price: 379900
                            }
                        ]
                    },
                    {
                        seriesId: 'series_006',
                        seriesName: 'A6L',
                        modelList: [
                            {
                                modelId: 'model_012',
                                modelName: '40 TFSI',
                                modelYear: '2023款',
                                price: 429900
                            },
                            {
                                modelId: 'model_013',
                                modelName: '45 TFSI',
                                modelYear: '2023款',
                                price: 499900
                            }
                        ]
                    }
                ]
            }
        ]
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
                this.setData({
                    selectedBrandId: firstBrand.brandId,
                    selectedBrand: firstBrand,
                    selectedSeriesId: '',
                    selectedModelId: ''
                });
            }
        },

        /**
         * 设置默认选中状态
         */
        setDefaultSelection() {
            const { brandId, seriesId, modelId } = this.data.defaultValue;
            const brand = this.data.brandList.find((item) => item.brandId === brandId);

            if (brand) {
                this.setData({
                    selectedBrandId: brandId,
                    selectedBrand: brand,
                    selectedSeriesId: seriesId || '',
                    selectedModelId: modelId || ''
                });
            }
        },

        /**
         * 品牌选择事件（直接切换，无loading）
         */
        onBrandSelect(e) {
            const brand = e.currentTarget.dataset.brand;

            // 直接切换品牌，清空选中的车系和车型
            this.setData({
                selectedBrandId: brand.brandId,
                selectedBrand: brand,
                selectedSeriesId: '',
                selectedModelId: ''
            });

            console.log('品牌切换:', {
                brandName: brand.brandName,
                seriesCount: brand.seriesList ? brand.seriesList.length : 0
            });
        },

        /**
         * 车型选择事件（仅更新选中状态，不立即确认）
         */
        onModelSelect(e) {
            const { brand, series, model } = e.currentTarget.dataset;

            // 更新选中状态
            this.setData({
                selectedSeriesId: series.seriesId,
                selectedModelId: model.modelId
            });

            console.log('车型选中:', {
                brandName: brand.brandName,
                seriesName: series.seriesName,
                modelName: model.modelName,
                variant: model.variant
            });

            // 构造回调数据，适配接口数据结构
            const result = {
                brandInfo: {
                    brandId: brand.brandId,
                    brandName: brand.brandName
                },
                seriesInfo: {
                    seriesId: series.seriesId,
                    seriesName: series.seriesName
                },
                modelInfo: {
                    modelId: model.modelId,
                    modelName: model.modelName,
                    brand: model.brand || brand.brandName,
                    series: model.series || series.seriesName,
                    variant: model.variant || model.modelName
                },
                displayText: `${brand.brandName} ${series.seriesName} ${model.modelName}`,
                modelId: model.modelId
            };

            // 触发确认事件
            this.triggerEvent('onConfirm', result);
            setTimeout(() => {
                this.triggerEvent('onClose');
            }, 200);
        },

        /**
         * 确认选择（新增方法）
         */
        onConfirm() {
            console.warn('---click confirm--');
            const { selectedBrand, selectedSeriesId, selectedModelId } = this.data;
            if (!selectedBrand || !selectedSeriesId || !selectedModelId) {
                wx.showToast({
                    title: '请选择车型',
                    icon: 'none'
                });
                return;
            }

            // 找到选中的车系和车型
            const selectedSeries = selectedBrand.seriesList.find(
                (s) => s.seriesId === selectedSeriesId
            );
            const selectedModel = selectedSeries.modelList.find(
                (m) => m.modelId === selectedModelId
            );

            // 构造回调数据，适配接口数据结构
            const result = {
                brandInfo: {
                    brandId: selectedBrand.brandId,
                    brandName: selectedBrand.brandName
                },
                seriesInfo: {
                    seriesId: selectedSeries.seriesId,
                    seriesName: selectedSeries.seriesName
                },
                modelInfo: {
                    modelId: selectedModel.modelId,
                    modelName: selectedModel.modelName,
                    brand: selectedModel.brand || selectedBrand.brandName,
                    series: selectedModel.series || selectedSeries.seriesName,
                    variant: selectedModel.variant || selectedModel.modelName
                },
                displayText: `${selectedBrand.brandName} ${selectedSeries.seriesName} ${selectedModel.modelName}`,
                modelId: selectedModel.modelId
            };

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
            this.triggerEvent('onCancel');
            this.triggerEvent('onClose');
        },

        /**
         * 组件关闭事件
         */
        onClose() {
            this.triggerEvent('onClose');
        }
    }
});
