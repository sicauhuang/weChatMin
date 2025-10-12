const auth = require('../../utils/auth.js');
const request = require('../../utils/request.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        // 登录状态
        isLoggedIn: false,

        // 加载状态
        isLoading: false,

        // 错误状态
        hasError: false,
        errorMessage: '',

        // 收藏列表数据
        favoriteList: [],

        // scroll-view相关状态
        refresherTriggered: false,
        scrollTop: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('我的收藏页面加载');
        // 设置导航栏标题
        wx.setNavigationBarTitle({
            title: '我的收藏'
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        // 页面渲染完成后检查登录状态并加载数据
        this.checkLoginAndLoadData();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 每次显示页面时都检查登录状态并刷新数据
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
        console.log('下拉刷新收藏列表');
        this.loadFavoriteList(true).finally(() => {
            // 停止下拉刷新
            wx.stopPullDownRefresh();
        });
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        // 收藏列表暂不支持分页加载
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的收藏',
            path: '/pages/my-favorites/my-favorites'
        };
    },

    /**
     * 检查登录状态并加载数据
     */
    checkLoginAndLoadData() {
        console.log('检查登录状态并加载数据');

        const isLoggedIn = auth.checkLoginStatus();
        console.log('当前登录状态:', isLoggedIn);

        this.setData({
            isLoggedIn: isLoggedIn,
            hasError: false,
            errorMessage: ''
        });

        if (isLoggedIn) {
            // 已登录，加载收藏列表
            this.loadFavoriteList();
        } else {
            // 未登录，清空数据
            this.setData({
                favoriteList: [],
                isLoading: false
            });
        }
    },

    /**
     * 加载收藏列表
     * @param {boolean} isRefresh 是否为刷新操作
     */
    async loadFavoriteList(isRefresh = false) {
        if (!this.data.isLoggedIn) {
            console.log('用户未登录，无法加载收藏列表');
            return;
        }

        try {
            // 设置加载状态
            if (!isRefresh) {
                this.setData({
                    isLoading: true,
                    hasError: false,
                    errorMessage: ''
                });
            }

            console.log('开始加载收藏列表...');

            // 调用收藏列表接口
            const result = await request.get(
                '/api/mp/car/query-my-favor-car-list',
                {},
                {
                    showLoading: isRefresh ? false : true,
                    loadingTitle: '加载中...'
                }
            );

            console.log('收藏列表接口返回:', result);

            if (result && Array.isArray(result)) {
                // 处理数据并格式化
                const favoriteList = this.processFavoriteData(result);

                this.setData({
                    favoriteList: favoriteList,
                    isLoading: false,
                    hasError: false
                });

                console.log('收藏列表加载成功，共', favoriteList.length, '条数据');
            } else {
                throw new Error('接口返回数据格式错误');
            }
        } catch (error) {
            console.error('加载收藏列表失败:', error);

            this.setData({
                isLoading: false,
                hasError: true,
                errorMessage: error.message || '加载失败，请重试'
            });

            if (isRefresh) {
                wx.showToast({
                    title: '刷新失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        }
    },

    /**
     * 处理收藏数据，转换为页面所需格式
     * @param {Array} apiData 接口返回的原始数据
     * @returns {Array} 处理后的数据
     */
    processFavoriteData(apiData) {
        return apiData.map((item) => {
            // 格式化收藏时间
            const formattedFavorTime = this.formatFavorTime(item.favorTime);

            // 转换为car-card组件所需的数据格式
            const vehicleData = this.mapApiDataToCardData(item);

            return {
                id: item.id,
                formattedFavorTime: formattedFavorTime,
                vehicleData: vehicleData,
                originalData: item // 保留原始数据用于其他操作
            };
        });
    },

    /**
     * 格式化收藏时间
     * @param {string} favorTime 收藏时间字符串
     * @returns {string} 格式化后的时间字符串
     */
    formatFavorTime(favorTime) {
        if (!favorTime) return '--';

        return favorTime;
    },

    /**
     * 将API数据映射为car-card组件数据格式
     * @param {Object} apiData API返回的单条车辆数据
     * @returns {Object} car-card组件所需的数据格式
     */
    mapApiDataToCardData(apiData) {
        return {
            id: apiData.id,
            carId: apiData.id, // car-card组件需要carId字段
            name: apiData.name,
            brand: apiData.brand,
            series: apiData.series,
            model: apiData.variant, // API中是variant字段
            previewImage:
                apiData.imageUrlList && apiData.imageUrlList.length > 0
                    ? apiData.imageUrlList[0].fileUrl
                    : '/assets/imgs/logo.png',
            licenseDate: apiData.licenseDate,
            registrationDate: apiData.licenseDate, // car-card组件使用registrationDate字段
            mileage: apiData.mileage,
            color: apiData.color,
            transferCount: apiData.transferCount,
            sellPrice: apiData.sellPrice,
            retailPrice: apiData.sellPrice, // car-card组件使用retailPrice字段
            status: apiData.status,
            statusName: apiData.statusName,
            isFavorited: apiData.favorStatus === 'FAVORITE',
            contactPhone: apiData.contactPhone
        };
    },

    /**
     * 处理收藏状态变化事件（新版本）
     */
    onFavoriteStatusChange(event) {
        const { vehicleData, isFavorited, success } = event.detail;

        console.log('收藏页面：收藏状态变化', {
            carId: vehicleData.carId,
            isFavorited,
            success
        });

        // 只在操作成功且取消收藏时从列表中移除
        if (success && !isFavorited) {
            const updatedList = this.data.favoriteList.filter(
                (item) => item.vehicleData.carId !== vehicleData.carId
            );

            this.setData({
                favoriteList: updatedList
            });

            console.log('收藏页面：车辆已从列表中移除', vehicleData.carId);
        } else if (!success) {
            console.log('收藏页面：收藏操作失败，不更新列表');
        }
    },

    /**
     * 点击登录按钮
     */
    onLoginTap() {
        console.log('点击登录按钮');
        wx.navigateTo({
            url: '/pages/login/login',
            fail: (error) => {
                console.error('跳转登录页面失败:', error);
                wx.showToast({
                    title: '跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 点击去看看车源按钮
     */
    onGoToVehicles() {
        console.log('点击去看看车源按钮');
        wx.switchTab({
            url: '/pages/vehicles/vehicles',
            fail: (error) => {
                console.error('跳转车源页面失败:', error);
                wx.showToast({
                    title: '跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 点击重新加载按钮
     */
    onRetry() {
        console.log('点击重新加载按钮');
        this.checkLoginAndLoadData();
    },

    /**
     * 车辆卡片点击事件
     * @param {Object} event 事件对象
     */
    onCardTap(event) {
        const { vehicleData } = event.detail;
        console.log('点击车辆卡片:', vehicleData);

        if (vehicleData && vehicleData.id) {
            // 跳转到车辆详情页面
            wx.navigateTo({
                url: `/pages/car-detail/car-detail?id=${vehicleData.id}`,
                fail: (error) => {
                    console.error('跳转车辆详情页面失败:', error);
                    wx.showToast({
                        title: '跳转失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            });
        }
    },

    /**
     * scroll-view下拉刷新事件
     * @param {Object} event 事件对象
     */
    async onScrollRefresh(event) {
        console.log('scroll-view下拉刷新');

        this.setData({
            refresherTriggered: true
        });

        try {
            await this.loadFavoriteList(true);
        } catch (error) {
            console.error('下拉刷新失败:', error);
        } finally {
            // 延迟一点时间再关闭刷新状态，提供更好的用户体验
            setTimeout(() => {
                this.setData({
                    refresherTriggered: false
                });
            }, 500);
        }
    },

    /**
     * scroll-view刷新恢复事件
     * @param {Object} event 事件对象
     */
    onScrollRestore(event) {
        console.log('scroll-view刷新恢复');
        this.setData({
            refresherTriggered: false
        });
    },

    /**
     * scroll-view滚动事件
     * @param {Object} event 事件对象
     */
    onScroll(event) {
        const { scrollTop } = event.detail;

        // 更新滚动位置，用于记忆滚动状态
        this.setData({
            scrollTop: scrollTop
        });

        // 可以在这里添加其他滚动相关的逻辑
        // 比如滚动到一定位置显示回到顶部按钮等
    }
});
