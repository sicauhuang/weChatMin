const auth = require('../../utils/auth.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        companyName: '车小禾', // 公司名称
        agreeProtocol: false, // 用户协议勾选状态
        showAgreementModal: false, // 协议确认弹窗显示状态
        isLogging: false // 是否正在登录中
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('登录页面加载');
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        console.log('登录页面渲染完成');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('登录页面显示');
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        console.log('登录页面隐藏');
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        console.log('登录页面卸载');
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        wx.stopPullDownRefresh();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        // 登录页面不需要处理上拉触底
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '车小禾 - 专业的车辆服务平台',
            path: '/pages/login/login'
        };
    },

    /**
     * 切换用户协议勾选状态
     */
    onToggleAgreement() {
        this.setData({
            agreeProtocol: !this.data.agreeProtocol
        });
        console.log('用户协议勾选状态:', this.data.agreeProtocol);
    },

    /**
     * 显示用户协议
     */
    onShowUserAgreement(e) {
        wx.showModal({
            title: '用户协议',
            content: '这里是用户协议的内容，实际项目中应该跳转到协议页面或显示完整的协议内容。',
            showCancel: false,
            confirmText: '我知道了'
        });
    },

    /**
     * 显示隐私政策
     */
    onShowPrivacyPolicy(e) {

        wx.showModal({
            title: '隐私政策',
            content: '这里是隐私政策的内容，实际项目中应该跳转到隐私政策页面或显示完整的政策内容。',
            showCancel: false,
            confirmText: '我知道了'
        });
    },

    /**
     * 手机号快捷登录
     */
    onQuickLogin(e) {
        if (!this.data.agreeProtocol) {
            // 显示自定义协议确认弹窗
            this.setData({
                showAgreementModal: true
            });
            return;
        }

        // 已勾选协议，直接执行登录
        this.performLogin(e);
    },

    /**
     * 关闭弹窗（点击遮罩）
     */
    onCloseModal() {
        this.setData({
            showAgreementModal: false
        });
    },

    /**
     * 阻止弹窗内容区域的点击事件冒泡
     */
    onModalContentTap() {
        // 阻止事件冒泡，避免点击弹窗内容时关闭弹窗
    },

    /**
     * 用户点击不同意
     */
    onDisagreeAgreement() {
        this.setData({
            showAgreementModal: false
        });
        console.log('用户选择不同意协议');
    },

    /**
     * 用户点击同意
     */
    onAgreeAgreement() {
        // 关闭弹窗
        this.setData({
            showAgreementModal: false,
            agreeProtocol: true
        });
        console.log('用户选择同意协议');

        // 继续执行登录逻辑
        this.performLogin();
    },

    /**
     * 执行登录逻辑
     */
    async performLogin(event) {
        if (this.data.isLogging) {
            console.log('正在登录中，请勿重复操作');
            return;
        }

        this.setData({
            isLogging: true
        });

        console.log('开始手机号快捷登录流程');

        try {
            // 如果有事件对象，说明是从按钮授权回调来的
            if (event && event.detail) {
                const { errMsg } = event.detail;

                if (errMsg !== 'getPhoneNumber:ok') {
                    throw new Error('手机号授权失败: ' + errMsg);
                }

                console.log('手机号授权成功，开始登录流程');

                // 获取手机号数据
                const phoneData = await auth.getPhoneNumber(event);

                // 执行完整登录流程
                const loginResult = await auth.performLogin(phoneData);

                console.log('登录成功:', loginResult);

                // 显示登录成功提示
                wx.showToast({
                    title: '登录成功',
                    icon: 'success',
                    duration: 2000
                });

                    // 更新全局登录状态
                    const app = getApp();
                    if (app && app.updateLoginStatus) {
                        app.updateLoginStatus(loginResult.data);
                    }

                    // 延迟跳转，让用户看到成功提示
                    setTimeout(() => {
                        // 返回上一页或跳转到首页
                        const pages = getCurrentPages();
                        if (pages.length > 1) {
                            // 有上一页，返回上一页
                            wx.navigateBack();
                        } else {
                            // 没有上一页，跳转到首页
                            wx.switchTab({
                                url: '/pages/index/index'
                            });
                        }
                    }, 1500);

            } else {
                // 没有事件对象，说明是从弹窗同意按钮来的，需要重新触发授权
                console.log('需要重新获取手机号授权');
                wx.showToast({
                    title: '请点击登录按钮进行授权',
                    icon: 'none',
                    duration: 2000
                });
            }

        } catch (error) {
            console.error('登录失败:', error);

            // 显示错误提示
            let errorMessage = '登录过程中发生错误，请重试';

            if (error.message) {
                if (error.message.includes('deny') || error.message.includes('cancel')) {
                    errorMessage = '需要手机号授权才能登录';
                } else {
                    errorMessage = error.message;
                }
            }

            if (errorMessage === '需要手机号授权才能登录') {
                wx.showToast({
                    title: errorMessage,
                    icon: 'none',
                    duration: 2000
                });
            } else {
                wx.showModal({
                    title: '登录失败',
                    content: errorMessage,
                    showCancel: false,
                    confirmText: '我知道了'
                });
            }
        } finally {
            this.setData({
                isLogging: false
            });
        }
    },

    /**
     * 页面分享到朋友圈
     */
    onShareTimeline() {
        return {
            title: '车小禾 - 专业的车辆服务平台'
        };
    }
});
