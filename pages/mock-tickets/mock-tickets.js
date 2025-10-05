// pages/mock-tickets/mock-tickets.js
const request = require('../../utils/request.js');
const qrcode = require('../../utils/qrcode.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        ticketList: [], // 模拟票列表
        loading: true, // 加载状态
        refreshing: false, // 下拉刷新状态
        showQRModal: false, // 是否显示二维码弹窗
        currentTicket: null, // 当前选中的票据
        qrLoading: false // 二维码生成加载状态
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('模拟票页面加载');
        this.loadTicketList();
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
        // 设置tabBar选中状态
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 2
            });
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        console.log('模拟票页面隐藏');
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
                    needAuth: false, // 暂时不需要认证
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

        // 设置当前票据并显示二维码弹窗
        this.setData({
            currentTicket: item,
            showQRModal: true,
            qrLoading: true
        });

        // 生成二维码
        this.generateQRCode(item);
    },

    /**
     * 生成二维码
     * @param {Object} ticket 票据信息
     */
    async generateQRCode(ticket) {
        try {
            console.log('开始生成二维码:', ticket);

            // 格式化票据数据为二维码内容
            const qrData = qrcode.formatTicketQRData(ticket);
            console.log('二维码数据:', qrData);

            // 等待一下确保DOM渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 生成二维码
            await qrcode.generateSimpleQRCode({
                text: qrData,
                canvasId: 'qrCanvas',
                size: 400,
                context: this
            });

            console.log('二维码生成成功');

            // 隐藏加载状态
            this.setData({
                qrLoading: false
            });
        } catch (error) {
            console.error('生成二维码失败:', error);

            this.setData({
                qrLoading: false
            });

            wx.showToast({
                title: '二维码生成失败',
                icon: 'none',
                duration: 2000
            });
        }
    },

    /**
     * 关闭二维码弹窗
     */
    onCloseQRModal() {
        console.log('关闭二维码弹窗');
        this.setData({
            showQRModal: false,
            currentTicket: null,
            qrLoading: false
        });
    },

    /**
     * 点击二维码内容区域（阻止冒泡）
     */
    onQRContentTap() {
        // 阻止事件冒泡，防止关闭弹窗
    },

    /**
     * 保存二维码到相册
     */
    async onSaveQRCode() {
        try {
            console.log('保存二维码到相册');

            wx.showLoading({
                title: '保存中...',
                mask: true
            });

            await qrcode.saveQRCodeToAlbum('qrCanvas', this);

            wx.hideLoading();

            console.log('二维码保存成功');
        } catch (error) {
            console.error('保存二维码失败:', error);

            wx.hideLoading();

            wx.showToast({
                title: '保存失败',
                icon: 'none',
                duration: 2000
            });
        }
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
    }
});
