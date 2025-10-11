// pages/assist-exam/assist-exam.js
const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        ticketList: [], // 助考票据列表
        loading: true, // 加载状态
        refreshing: false, // 下拉刷新状态
        isLoggedIn: false // 登录状态
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('模拟票助考页面加载');
        this.checkLoginAndLoadData();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        console.log('模拟票助考页面渲染完成');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('模拟票助考页面显示');
        // 重新检查登录状态（用户可能从登录页面返回）
        this.checkLoginAndLoadData();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        console.log('模拟票助考页面隐藏');
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        console.log('模拟票助考页面卸载');
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        console.log('模拟票助考页面下拉刷新');
        this.loadAssistExamTickets(true);
    },

    /**
     * 下拉刷新事件处理
     */
    onRefresh() {
        console.log('触发下拉刷新');
        this.setData({
            refreshing: true
        });
        this.loadAssistExamTickets(true);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        console.log('模拟票助考页面上拉触底');
        // 暂时不实现分页加载
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '模拟票助考',
            path: '/pages/assist-exam/assist-exam'
        };
    },

    /**
     * 检查登录状态并加载数据
     */
    checkLoginAndLoadData() {
        console.log('检查登录状态并加载助考数据');

        // 检查登录状态
        const isLoggedIn = auth.checkLoginStatus();
        console.log('当前登录状态:', isLoggedIn);

        this.setData({
            isLoggedIn: isLoggedIn,
            loading: false
        });

        if (isLoggedIn) {
            // 已登录，加载助考票据数据
            console.log('用户已登录，开始加载助考票据数据');
            this.loadAssistExamTickets();
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
     * 加载助考票据列表
     * @param {boolean} isRefresh 是否为刷新操作
     */
    async loadAssistExamTickets(isRefresh = false) {
        try {
            console.log('开始加载助考票据列表，isRefresh:', isRefresh);

            if (!isRefresh) {
                this.setData({
                    loading: true
                });
            } else {
                this.setData({
                    refreshing: true
                });
            }

            // 使用新的接口地址
            const response = await request.get(
                '/api/mp/ticket/query-my-assistant-ticket-list',
                {},
                {
                    needAuth: true, // 需要认证
                    showLoading: false // 使用自定义加载状态
                }
            );

            console.log('助考票据列表加载成功:', response);

            // 适配新的响应数据结构
            if (response && Array.isArray(response)) {
                // 处理数据，实现字段映射
                const processedTickets = response.map((ticket) => ({
                    id: ticket.id,
                    packageName: ticket.suiteName || '', // 后端字段映射
                    studentName: ticket.studentName || '',
                    verifyOperator: ticket.verifyUserName || '暂无', // 后端字段映射
                    verifyTime: ticket.verifyTime ? this.formatTime(ticket.verifyTime) : '暂未核销',
                    // 额外保存后端字段供参考
                    status: ticket.status,
                    statusName: ticket.statusName,
                    bookDate: ticket.bookDate,
                    coachName: ticket.coachName,
                    coachPhone: ticket.coachPhone,
                    mockArea: ticket.mockArea,
                    studentPhone: ticket.studentPhone
                }));

                this.setData({
                    ticketList: processedTickets,
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
                // 处理空数据情况
                console.log('接口返回空数据或无效数据');
                this.setData({
                    ticketList: [],
                    loading: false,
                    refreshing: false
                });

                if (isRefresh) {
                    wx.showToast({
                        title: '暂无数据',
                        icon: 'none',
                        duration: 1500
                    });
                }
            }
        } catch (error) {
            console.error('加载助考票据列表失败:', error);

            this.setData({
                loading: false,
                refreshing: false,
                ticketList: []
            });

            // 如果是认证失败，更新登录状态
            if (error.code === 'NO_REFRESH_TOKEN' || error.code === 'REFRESH_TOKEN_FAILED') {
                this.setData({
                    isLoggedIn: false
                });
            }

            // 通用错误已由request.js处理，这里只处理特殊业务逻辑
            // 如需自定义错误处理，可传入 showErrorToast: false 在请求选项中
        } finally {
            // 停止下拉刷新
            if (isRefresh) {
                wx.stopPullDownRefresh();
            }
        }
    },

    /**
     * 点击助考票据卡片
     * @param {Object} event 事件对象
     */
    onTicketTap(event) {
        const { item } = event.currentTarget.dataset;
        console.log('点击助考票据:', item);

        // 显示票据详情
        const content = [
            `套餐名称: ${item.packageName}`,
            `学员姓名: ${item.studentName}`,
            `核销人: ${item.verifyOperator || '暂无'}`,
            `核销时间: ${item.verifyTime || '暂未核销'}`
        ].join('\n');

        wx.showModal({
            title: '助考票据详情',
            content: content,
            showCancel: false,
            confirmText: '知道了'
        });
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
     * 格式化时间显示
     * @param {string} timeStr 时间字符串
     * @returns {string} 格式化后的时间
     */
    formatTime(timeStr) {
        if (!timeStr) return '';

        try {
            const date = new Date(timeStr);
            
            // 检查日期是否有效
            if (isNaN(date.getTime())) {
                console.warn('无效的时间格式:', timeStr);
                return timeStr;
            }

            // 使用UTC时间来避免时区问题，如果是ISO格式且以Z结尾
            let year, month, day, hours, minutes;
            
            if (timeStr.includes('T') && (timeStr.endsWith('Z') || timeStr.includes('+'))) {
                // ISO格式时间，使用UTC时间
                year = date.getUTCFullYear();
                month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                day = date.getUTCDate().toString().padStart(2, '0');
                hours = date.getUTCHours().toString().padStart(2, '0');
                minutes = date.getUTCMinutes().toString().padStart(2, '0');
            } else {
                // 普通时间格式，使用本地时间
                year = date.getFullYear();
                month = (date.getMonth() + 1).toString().padStart(2, '0');
                day = date.getDate().toString().padStart(2, '0');
                hours = date.getHours().toString().padStart(2, '0');
                minutes = date.getMinutes().toString().padStart(2, '0');
            }

            // 返回YYYY-MM-DD HH:mm格式
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (error) {
            console.error('时间格式化失败:', error, '原始时间:', timeStr);
            return timeStr;
        }
    }
});
