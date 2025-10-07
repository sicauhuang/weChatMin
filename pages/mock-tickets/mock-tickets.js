// pages/mock-tickets/mock-tickets.js
const request = require('../../utils/request.js');
const qrcode = require('../../utils/qrcode.js');
const auth = require('../../utils/auth.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        ticketList: [], // 模拟票列表
        loading: true, // 加载状态
        refreshing: false, // 下拉刷新状态
        showQRModal: false, // 是否显示二维码弹窗
        currentTicketQRData: null, // 当前票据的二维码数据
        isLoggedIn: false // 登录状态
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('模拟票页面加载');
        this.checkLoginAndLoadData();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        console.log('模拟票页面渲染完成');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('模拟票页面显示');

        // 页面显示时检查并关闭弹窗（避免tabBar切换时的闪屏问题）
        if (this.data.showQRModal) {
            console.log('页面显示时关闭二维码弹窗');
            this.setData({
                showQRModal: false,
                currentTicketQRData: null
            });
        }

        // 设置tabBar选中状态
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 2
            });
        }

        // 重新检查登录状态（用户可能从登录页面返回）
        this.checkLoginAndLoadData();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        console.log('模拟票页面隐藏');
        // 移除弹窗关闭逻辑，避免tabBar切换时的闪屏问题
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        console.log('模拟票页面卸载');
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        console.log('模拟票页面下拉刷新');
        this.loadTicketList(true);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        console.log('模拟票页面上拉触底');
        // 暂时不实现分页加载
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '模拟票列表',
            path: '/pages/mock-tickets/mock-tickets'
        };
    },

    /**
     * 下拉刷新事件处理
     */
    onRefresh() {
        console.log('触发下拉刷新');
        this.setData({
            refreshing: true
        });
        this.loadTicketList(true);
    },

    /**
     * 加载模拟票列表
     * @param {boolean} isRefresh 是否为刷新操作
     */
    async loadTicketList(isRefresh = false) {
        try {
            console.log('开始加载模拟票列表，isRefresh:', isRefresh);

            if (!isRefresh) {
                this.setData({
                    loading: true
                });
            }

            const response = await request.get(
                '/api/mock-tickets',
                {},
                {
                    needAuth: true, // 需要认证
                    showLoading: false // 使用自定义加载状态
                }
            );

            console.log('模拟票列表加载成功:', response);

            if (response && response.success && response.data) {
                this.setData({
                    ticketList: response.data,
                    loading: false,
                    refreshing: false
                });

                // 如果是下拉刷新，显示成功提示
                if (isRefresh) {
                    wx.showToast({
                        title: '刷新成功',
                        icon: 'success',
                        duration: 1500
                    });
                }
            } else {
                throw new Error(response?.message || '获取模拟票列表失败');
            }
        } catch (error) {
            console.error('加载模拟票列表失败:', error);

            this.setData({
                loading: false,
                refreshing: false,
                ticketList: []
            });

            // 显示错误提示
            wx.showToast({
                title: error.message || '加载失败',
                icon: 'none',
                duration: 2000
            });
        } finally {
            // 停止下拉刷新
            if (isRefresh) {
                wx.stopPullDownRefresh();
            }
        }
    },

    /**
     * 点击模拟票卡片
     * @param {Object} event 事件对象
     */
    onTicketTap(event) {
        const { item } = event.currentTarget.dataset;
        console.log('点击模拟票:', item);

        // 暂时只显示详情，后续可以跳转到详情页
        wx.showModal({
            title: '模拟票详情',
            content: `订单号: ${item.orderNumber}\n状态: ${item.status}\n预约时间: ${item.appointmentDate}\n场地: ${item.simulationArea}\n教练: ${item.coachName}`,
            showCancel: false,
            confirmText: '知道了'
        });
    },

    /**
     * 点击使用按钮 - 显示二维码
     * @param {Object} event 事件对象
     */
    onUseTicket(event) {
        const { item } = event.currentTarget.dataset;
        console.log('点击使用模拟票，生成二维码:', item);

        // 构造票据二维码数据
        const ticketQRData = {
            type: 'mock-ticket',
            ticketId: item.id,
            packageName: item.packageName,
            orderNumber: item.orderNumber,
            studentName: item.studentName,
            studentPhone: item.studentPhone,
            appointmentDate: item.appointmentDate,
            simulationArea: item.simulationArea
        };

        // 设置二维码数据并显示弹窗
        this.setData({
            currentTicketQRData: ticketQRData,
            showQRModal: true
        });
    },

    /**
     * 关闭二维码弹窗
     */
    onCloseQRModal() {
        console.log('关闭二维码弹窗');

        this.setData({
            showQRModal: false,
            currentTicketQRData: null
        });
    },

    /**
     * 点击二维码内容区域（阻止冒泡）
     */
    onQRContentTap() {
        // 阻止事件冒泡，防止关闭弹窗
    },

    /**
     * 格式化时间显示
     * @param {string} timeStr 时间字符串
     * @returns {string} 格式化后的时间
     */
    formatTime(timeStr) {
        if (!timeStr) return '';

        try {
            const date = new Date(timeStr);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return `${month}-${day} ${hours}:${minutes}`;
        } catch (error) {
            console.error('时间格式化失败:', error);
            return timeStr;
        }
    },

    /**
     * 获取状态样式类名
     * @param {string} status 状态
     * @returns {string} 样式类名
     */
    getStatusClass(status) {
        return status === '已核销' ? 'used' : 'unused';
    },

    /**
     * 检查登录状态并加载数据
     */
    checkLoginAndLoadData() {
        console.log('检查登录状态并加载数据');

        // 检查登录状态
        const isLoggedIn = auth.checkLoginStatus();
        console.log('当前登录状态:', isLoggedIn);

        this.setData({
            isLoggedIn: isLoggedIn,
            loading: false
        });

        if (isLoggedIn) {
            // 已登录，加载模拟票数据
            console.log('用户已登录，开始加载模拟票数据');
            this.loadTicketList();
        } else {
            // 未登录，显示登录提示
            console.log('用户未登录，显示登录提示');
            this.setData({
                ticketList: [],
                loading: false
            });
        }
    },

    /**
     * 点击现在登录按钮
     */
    onGoLogin() {
        console.log('点击现在登录按钮，跳转到登录页面');

        wx.navigateTo({
            url: '/pages/login/login',
            success: () => {
                console.log('成功跳转到登录页面');
            },
            fail: (error) => {
                console.error('跳转到登录页面失败:', error);
                wx.showToast({
                    title: '跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    }
});
