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
        pageSize: 50, // 每页数据条数
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

            // 调用真实的审批车辆列表API
            const result = await this.queryWaitApproveCarPage({
                pageNum: this.data.currentPage,
                pageSize: this.data.pageSize,
                keyword: '' // 暂不支持搜索
            });

            // 将API返回的车辆数据映射为car-card组件所需格式
            const mappedVehicles = result.list.map((vehicle) =>
                this.mapApiDataToCardFormat(vehicle)
            );

            let newVehicleList;
            if (isRefresh || this.data.currentPage === 1) {
                newVehicleList = mappedVehicles;
            } else {
                newVehicleList = [...this.data.vehicleList, ...mappedVehicles];
            }

            // 计算是否还有更多数据
            const hasMore = result.pageNum < Math.ceil(result.total / result.pageSize);

            this.setData({
                vehicleList: newVehicleList,
                hasMore: hasMore,
                isEmpty: newVehicleList.length === 0,
                loading: false
            });

            console.log(`加载成功，当前共${newVehicleList.length}条数据，是否有更多：${hasMore}`);
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
     * 查询待审批车辆列表API
     * @param {Object} params 请求参数
     * @returns {Promise<Object>} API响应结果
     */
    async queryWaitApproveCarPage(params) {
        try {
            console.log('调用审批车辆列表API:', params);

            const response = await request.post('/api/mp/car/query-wait-approve-car-page', params, {
                showLoading: false, // 使用页面自己的loading状态
                showErrorToast: false // 使用页面自己的错误处理
            });

            console.log('审批车辆列表API响应:', response);

            // 验证响应数据结构
            if (!response || !response.list) {
                throw new Error('响应数据格式错误');
            }

            return response;
        } catch (error) {
            console.error('审批车辆列表API调用失败:', error);
            throw error;
        }
    },

    /**
     * 将API返回的车辆数据映射为car-card组件所需格式
     * @param {Object} apiVehicle API返回的车辆数据
     * @returns {Object} car-card组件所需的数据格式
     */
    mapApiDataToCardFormat(apiVehicle) {
        // 获取预览图片地址
        let previewImage = '/assets/imgs/logo.png'; // 默认图片
        if (apiVehicle.imageUrlList && apiVehicle.imageUrlList.length > 0) {
            previewImage = apiVehicle.imageUrlList[0].fileUrl || previewImage;
        }

        return {
            carId: apiVehicle.id, // 车辆ID
            previewImage: previewImage, // 预览图片
            name: apiVehicle.name, // 后端已拼接的车辆名称
            brand: apiVehicle.brand, // 品牌
            series: apiVehicle.series, // 车系
            model: apiVehicle.variant, // 款式
            registrationDate: apiVehicle.licenseDate, // 上牌日期（原为registrationDate）
            mileage: apiVehicle.mileage, // 里程
            color: apiVehicle.color, // 颜色
            transferCount: apiVehicle.transferCount || 0, // 过户次数
            retailPrice: apiVehicle.sellPrice, // 售价（原为retailPrice）
            status: apiVehicle.status, // 车辆状态
            statusName: apiVehicle.statusName, // 车辆状态名称
            submitTime: apiVehicle.publishTime, // 提交时间（使用发布时间）
            submitterId: apiVehicle.publishUserId, // 提交者ID
            submitterName: apiVehicle.publishUserName, // 提交者姓名
            isFavorited: false // 审批页面不需要收藏功能
        };
    },

    /**
     * 获取错误提示信息
     * @param {Object} error 错误对象
     * @returns {string} 用户友好的错误提示
     */
    getErrorMessage(error) {
        switch (error.code) {
            case 'NETWORK_ERROR':
                return '网络连接失败，请检查网络';
            case 'NO_REFRESH_TOKEN':
            case 'REFRESH_TOKEN_FAILED':
                return '登录已过期，请重新登录';
            case '403':
                return '没有权限访问审批列表';
            case '404':
                return '接口不存在';
            case '500':
            case '502':
            case '503':
            case '504':
                return '服务器繁忙，请稍后重试';
            default:
                return error.userMessage || error.message || '加载失败，请重试';
        }
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

        // 跳转到车辆审批页面（使用car-form页面的approval模式）
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
            selectedVehicles = selectedVehicles.filter((id) => id !== vehicleData.carId);
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
