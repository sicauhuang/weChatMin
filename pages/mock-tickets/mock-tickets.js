// pages/mock-tickets/mock-tickets.js
const request = require('../../utils/request.js');
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
        isLoggedIn: false, // 登录状态
        mockExamPhone: '' // 模拟考试电话
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('模拟票页面加载');
        this.loadSystemInfo();
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

        // 检查登录状态
        if (!this.data.isLoggedIn) {
            console.log('用户未登录，停止下拉刷新');
            wx.stopPullDownRefresh();
            return;
        }

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

        // 检查登录状态
        if (!this.data.isLoggedIn) {
            console.log('用户未登录，停止下拉刷新');
            this.setData({
                refreshing: false
            });
            return;
        }

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

            // 调用真实接口
            const response = await request.get(
                '/api/mp/ticket/query-my-ticket-list',
                {},
                {
                    needAuth: true, // 需要认证
                    showLoading: false // 使用自定义加载状态
                }
            );

            console.log('模拟票列表加载成功:', response);

            // request.js已经预处理成功响应，直接使用数据
            if (response) {
                // 数据映射转换
                const transformedData = this.transformTicketData(response);

                this.setData({
                    ticketList: transformedData,
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
                throw new Error('获取模拟票列表失败');
            }
        } catch (error) {
            this.handleLoadError(error, isRefresh);
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
    onTicketTap(event) {},

    /**
     * 点击使用按钮 - 显示二维码
     * @param {Object} event 事件对象
     */
    onUseTicket(event) {
        const { item } = event.currentTarget.dataset;
        console.log('点击使用模拟票，生成二维码:', item);

        // 构造票据二维码数据（适配新数据结构）
        const ticketQRData = {
            type: 'mock-ticket',
            ticketId: item.id,
            packageName: item.packageName,
            orderNumber: item.orderNumber,
            studentName: item.studentName,
            studentPhone: item.studentPhone,
            appointmentDate: item.appointmentDate,
            simulationArea: item.simulationArea,
            idCard: item.studentCardNumber
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
     * 数据转换映射函数
     * 将API响应数据转换为前端数据结构
     * @param {Array} apiData API返回的数据数组
     * @returns {Array} 转换后的数据数组
     */
    transformTicketData(apiData) {
        if (!Array.isArray(apiData)) {
            console.warn('数据转换失败：输入不是数组:', apiData);
            return [];
        }

        return apiData.map((item) => {
            try {
                return {
                    id: item.id ? item.id.toString() : '',
                    packageName: item.suiteName || '未知套餐',
                    orderNumber: `MT${item.id ? item.id.toString().padStart(8, '0') : '00000000'}`,
                    studentName: item.studentName || '',
                    studentPhone: item.studentPhone || '',
                    appointmentDate: item.bookDate || '',
                    simulationArea: item.mockArea || '未分配',
                    status: item.statusName || '',
                    coachName: item.coachName || '待分配',
                    coachPhone: item.coachPhone || '-',
                    studentCardNumber: item.studentCardNumber || '',
                    // 保留原始数据以备后续使用
                    _original: item
                };
            } catch (error) {
                console.error('单条数据转换失败:', error, item);
                return {
                    id: '',
                    packageName: '数据异常',
                    orderNumber: 'ERROR',
                    studentName: '',
                    studentPhone: '',
                    appointmentDate: '',
                    simulationArea: '未知',
                    status: '异常',
                    coachName: '',
                    coachPhone: '',
                    _original: item
                };
            }
        });
    },

    /**
     * 处理加载错误
     * @param {Object} error 错误对象
     * @param {boolean} isRefresh 是否为刷新操作
     */
    handleLoadError(error, isRefresh = false) {
        console.error('加载模拟票列表失败:', error);

        this.setData({
            loading: false,
            refreshing: false,
            ticketList: []
        });

        // 停止下拉刷新
        if (isRefresh) {
            wx.stopPullDownRefresh();
        }

        // 根据错误类型显示不同的提示
        let errorMessage = '加载失败';
        let showRetry = false;

        if (error.code === 'NETWORK_ERROR') {
            errorMessage = '网络连接失败，请检查网络后重试';
            showRetry = true;
        } else if (error.code === 'NO_REFRESH_TOKEN' || error.code === 'REFRESH_TOKEN_FAILED') {
            errorMessage = '登录已过期，请重新登录';
        } else if (error.code === 'LOGOUT_AUTH_FAILED' || error.code === 'UNBIND_AUTH_FAILED') {
            errorMessage = '认证失败';
        } else if (error.message) {
            errorMessage = error.message;
        }

        if (showRetry) {
            // 显示重试对话框
            wx.showModal({
                title: '网络错误',
                content: errorMessage,
                showCancel: true,
                cancelText: '取消',
                confirmText: '重试',
                success: (res) => {
                    if (res.confirm) {
                        this.loadTicketList();
                    }
                }
            });
        } else {
            // 显示错误提示
            wx.showToast({
                title: errorMessage,
                icon: 'none',
                duration: 2000
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
    },

    /**
     * 加载系统信息（获取模拟考试电话）
     */
    loadSystemInfo() {
        console.log('开始加载系统信息...');

        // 使用统一的请求工具调用真实接口
        request.get('/api/mp/setting/query-main-page-info', {}, {
            showLoading: false,
            showErrorToast: false
        })
        .then((data) => {
            console.log('系统信息请求成功:', data);

            // 提取模拟考试电话
            const mockExamPhone = data.mockExamPhone || '';

            this.setData({
                mockExamPhone: mockExamPhone
            });

            console.log('模拟考试电话已设置:', mockExamPhone);
        })
        .catch((err) => {
            console.error('系统信息请求失败:', err);
            // 静默失败，不影响页面其他功能
        });
    },

    /**
     * 拨打模拟考试电话
     */
    callMockExamPhone() {
        const phoneNumber = this.data.mockExamPhone;
        if (!phoneNumber) {
            wx.showToast({
                title: '模拟考试电话不可用',
                icon: 'none'
            });
            return;
        }

        wx.makePhoneCall({
          phoneNumber: phoneNumber,
          success: () => {
              console.log('拨打模拟考试电话成功');
          },
          fail: (err) => {
              console.error('拨打模拟考试电话失败:', err);
              wx.showToast({
                  title: '拨打电话失败',
                  icon: 'none'
              });
          }
      });
    }
});
