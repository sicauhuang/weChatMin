// components/car-card/car-card.js
const { post } = require('../../utils/request.js');

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        // 车辆数据对象
        vehicleData: {
            type: Object,
            value: {}
        },
        // 是否处于删除模式
        deleteMode: {
            type: Boolean,
            value: false
        },
        // 删除模式下的选中状态
        isSelected: {
            type: Boolean,
            value: false
        },
        // 是否显示收藏按钮
        showFavoriteButton: {
            type: Boolean,
            value: true
        },
        // 是否显示状态标签
        showStatusTag: {
            type: Boolean,
            value: true
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        // 格式化后的车辆数据
        formattedVehicleData: {}
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 格式化价格 (从 car-selling.js 抽离)
         */
        formatPrice(price) {
            if (!price) return '面议';
            return `${price.toFixed(2)}万`;
        },

        /**
         * 格式化里程 (从 car-selling.js 抽离)
         */
        formatMileage(mileage) {
            if (!mileage || mileage === 0) return '准新车';
            return `${mileage.toFixed(1)}万公里`;
        },

        /**
         * 格式化日期 (从 car-selling.js 抽离)
         */
        formatDate(dateString) {
            if (!dateString) return '--';
            return dateString;
        },

        /**
         * 格式化过户次数 (从 car-selling.js 抽离)
         */
        formatTransferCount(count) {
            if (count === 0) return '未过户';
            return `过户${count}次`;
        },

        /**
         * 格式化车辆数据
         */
        formatVehicleData(vehicleData) {
            if (!vehicleData || Object.keys(vehicleData).length === 0) {
                return {};
            }

            return {
                ...vehicleData,
                formattedPrice: this.formatPrice(vehicleData.retailPrice),
                formattedMileage: this.formatMileage(vehicleData.mileage),
                formattedDate: vehicleData.registrationDate
                    ? `${vehicleData.registrationDate}上牌`
                    : '--',
                formattedTransfer: this.formatTransferCount(vehicleData.transferCount)
            };
        },

        /**
         * 卡片点击事件
         */
        onCardTap() {
            // 在删除模式下，点击卡片切换选中状态
            if (this.properties.deleteMode) {
                this.triggerEvent('onSelectionChange', {
                    vehicleData: this.properties.vehicleData,
                    isSelected: !this.properties.isSelected
                });
                return;
            }

            // 正常模式下的卡片点击事件：跳转到编辑页面
            this.triggerEvent('onCardTap', {
                vehicleData: this.properties.vehicleData
            });
        },

        /**
         * 编辑按钮点击事件（如果需要单独的编辑按钮）
         */
        onEditTap() {
            console.log('编辑按钮点击:', this.properties.vehicleData.carId);

            this.triggerEvent('onEdit', {
                vehicleData: this.properties.vehicleData
            });
        },

        /**
         * 收藏按钮点击事件
         */
        async onFavoriteToggle() {
            const vehicleData = this.properties.vehicleData;
            const newFavoritedStatus = !vehicleData.isFavorited;

            // 检查车辆ID
            if (!vehicleData || !vehicleData.carId) {
                console.error('car-card: 收藏操作缺少必要参数:', { vehicleData });
                wx.showToast({
                    title: '操作失败',
                    icon: 'none',
                    duration: 1500
                });
                return;
            }

            console.log('car-card: 收藏状态切换:', {
                carId: vehicleData.carId,
                currentStatus: vehicleData.isFavorited,
                newStatus: newFavoritedStatus
            });

            try {
                // 处理不同格式的carId
                let carId;

                carId = String(vehicleData.carId);

                // 直接调用收藏/取消收藏API
                const apiUrl = newFavoritedStatus
                    ? '/api/mp/car/favor-car'
                    : '/api/mp/car/cancel-favor-car';
                const loadingTitle = newFavoritedStatus ? '收藏中...' : '取消收藏中...';

                await post(
                    apiUrl,
                    {
                        carId: carId
                    },
                    {
                        showLoading: false,
                        loadingTitle: loadingTitle,
                        showErrorToast: true
                    }
                );

                // 更新组件内部数据状态
                const updatedVehicleData = {
                    ...vehicleData,
                    isFavorited: newFavoritedStatus
                };
              
                // 触发新的状态变化事件（推荐使用）
                this.triggerEvent('onFavoriteStatusChange', {
                    vehicleData: updatedVehicleData,
                    isFavorited: newFavoritedStatus,
                    success: true
                });

                // 显示成功反馈
                const action = newFavoritedStatus ? '收藏' : '取消收藏';
                console.log(`car-card: ${action}成功:`, vehicleData.brand, vehicleData.series);
             
                wx.showToast({
                    title: `${action}成功`,
                    icon: 'success',
                    duration: 1000
                });
            } catch (error) {
                console.error('car-card: 收藏操作失败:', error);

                // 触发新的状态变化事件（推荐使用）
                this.triggerEvent('onFavoriteStatusChange', {
                    vehicleData: vehicleData,
                    isFavorited: vehicleData.isFavorited, // 保持原状态
                    success: false,
                    error: error
                });

                // 保持向后兼容的原有事件
                this.triggerEvent('onFavoriteToggle', {
                    vehicleData: vehicleData,
                    isFavorited: vehicleData.isFavorited, // 保持原状态
                    success: false,
                    error: error
                });

                // 显示错误提示（由于post方法已经包含了showErrorToast，这里不再重复显示）
                console.log('car-card: 错误提示已由request模块处理');
            }
        },

        /**
         * SwipeCell关闭事件处理
         * @param {Object} e 事件对象
         */
        onSwipeClose(e) {
            const { position, instance } = e.detail;
            if (position === 'right') {
                // 显示删除确认对话框
                wx.showModal({
                    title: '确认删除',
                    content: '删除后无法恢复，是否继续？',
                    confirmText: '确认删除',
                    confirmColor: '#ff4757',
                    success: (res) => {
                        if (res.confirm) {
                            // 触发删除事件
                            this.triggerEvent('onDelete', {
                                vehicleData: this.properties.vehicleData
                            });
                        }
                        // 无论确认还是取消，都关闭SwipeCell
                        instance.close();
                    }
                });
            }
        }
    },

    /**
     * 数据监听器
     */
    observers: {
        vehicleData: function (newVal) {
            if (newVal && Object.keys(newVal).length > 0) {
                // 格式化数据
                const formattedData = this.formatVehicleData(newVal);

                this.setData({
                    formattedVehicleData: formattedData
                });
            }
        }
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            // 组件被创建时，初始化格式化数据
            if (
                this.properties.vehicleData &&
                Object.keys(this.properties.vehicleData).length > 0
            ) {
                const formattedData = this.formatVehicleData(this.properties.vehicleData);
                this.setData({
                    formattedVehicleData: formattedData
                });
            }
        }
    }
});
