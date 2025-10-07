const auth = require('../../utils/auth.js');
const storage = require('../../utils/storage.js');
const qrcode = require('../../utils/qrcode.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        avatarUrl: '/assets/imgs/touxiang.png', // 默认头像
        nickname: '微信用户', // 默认昵称
        identity: '未登录', // 身份信息
        isLogin: false, // 登录状态
        openid: '', // 用户openid
        phoneNumber: '', // 手机号
        showActionModal: false, // 自定义操作弹窗显示状态
        // 二维码弹窗相关
        showQRModal: false, // 二维码弹窗显示状态
        userQRData: null, // 用户二维码数据
        // 功能模块列表
        functionModules: [
            {
                id: 'qrcode',
                name: '我的二维码',
                icon: 'icon-erweima',
                path: ''
            },
            {
                id: 'buy-car',
                name: '我要卖车',
                icon: 'icon-maiche',
                path: ''
            },
            {
                id: 'approve-car',
                name: '审批车辆',
                icon: 'icon-shenpi',
                path: ''
            },
            {
                id: 'verify-ticket',
                name: '模拟票核销',
                icon: 'icon-saoma',
                path: ''
            },
            {
                id: 'assist-exam',
                name: '模拟票助考',
                icon: 'icon-zhukao',
                path: ''
            }
        ]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('我的页面加载');
        this.initUserInfo();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 页面显示时检查并关闭弹窗（避免tabBar切换时的闪屏问题）
        if (this.data.showQRModal) {
            console.log('页面显示时关闭二维码弹窗');
            this.setData({
                showQRModal: false,
                userQRData: null
            });
        }

        if (this.data.showActionModal) {
            console.log('页面显示时关闭操作弹窗');
            this.setData({
                showActionModal: false
            });
        }

        // 设置tabBar选中状态
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 3
            });
        }

        // 每次显示页面时刷新用户信息
        this.initUserInfo();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        console.log('我的页面隐藏');
        // 移除弹窗关闭逻辑，避免tabBar切换时的闪屏问题
    },

    /**
     * 初始化用户信息（方案1：只从本地存储读取）
     */
    initUserInfo() {
        try {
            console.log('初始化用户信息（本地存储优先）...');

            // 检查登录状态
            const isLoggedIn = auth.checkLoginStatus();
            console.log('登录状态:', isLoggedIn);

            if (isLoggedIn) {
                // 已登录状态，直接从本地存储获取用户信息
                const userInfo = storage.getUserInfo() || {};

                this.setData({
                    avatarUrl: userInfo.avatarUrl || '/assets/imgs/logo.png',
                    nickname: userInfo.phoneNumber || '微信用户',
                    identity: userInfo.identity || '游客',
                    isLogin: true,
                    openid: storage.getOpenId() || '',
                    phoneNumber: userInfo.phoneNumber || ''
                });

                console.log('用户已登录，显示本地用户信息:', userInfo);
                console.log('依赖app.js启动时的刷新来保证数据新鲜度');
            } else {
                // 未登录状态，设置默认用户信息
                this.setDefaultUserInfo();
            }
        } catch (error) {
            console.error('初始化用户信息失败:', error);
            this.setDefaultUserInfo();
        }
    },

    /**
     * 获取用户基本信息
     */
    async getUserProfile() {
        try {
            // 使用getUserProfile获取用户基本信息
            const userProfile = await this.wxGetUserProfile();
            if (userProfile) {
                this.setData({
                    avatarUrl: userProfile.avatarUrl || '/assets/default-avatar.png',
                    nickname: userProfile.nickName || '微信用户',
                    identity: '游客',
                    isLogin: false
                });
                console.log('获取用户基本信息成功:', userProfile);
            } else {
                this.setDefaultUserInfo();
            }
        } catch (error) {
            console.error('获取用户基本信息失败:', error);
            this.setDefaultUserInfo();
        }
    },

    /**
     * 调用微信getUserProfile接口
     */
    wxGetUserProfile() {
        return new Promise((resolve, reject) => {
            wx.getUserProfile({
                desc: '用于完善用户资料',
                success: (res) => {
                    console.log('getUserProfile成功:', res.userInfo);
                    resolve(res.userInfo);
                },
                fail: (error) => {
                    console.log('getUserProfile失败:', error);
                    // 用户拒绝授权或其他错误，返回null
                    resolve(null);
                }
            });
        });
    },

    /**
     * 设置默认用户信息
     */
    setDefaultUserInfo() {
        this.setData({
            avatarUrl: '/assets/imgs/touxiang.png',
            nickname: '微信用户',
            identity: '未登录',
            isLogin: false,
            openid: '',
            phoneNumber: ''
        });
        console.log('设置默认用户信息，设置按钮已隐藏');
    },

    /**
     * 用户点击头像或昵称区域
     */
    onUserCardTap() {
        if (!this.data.isLogin) {
            // 未登录状态，直接跳转到登录页面
            wx.navigateTo({
                url: '/pages/login/login'
            });
        } else {
            // 已登录状态，显示自定义操作弹窗
            this.setData({
                showActionModal: true
            });
        }
    },

    /**
     * 关闭自定义操作弹窗
     */
    onCloseActionModal() {
        this.setData({
            showActionModal: false
        });
    },

    /**
     * 阻止弹窗内容区域的点击事件冒泡
     */
    onActionModalContentTap() {
        // 阻止事件冒泡，避免点击弹窗内容时关闭弹窗
    },

    /**
     * 点击注销账号按钮
     */
    onCancelAccountTap() {
        this.setData({
            showActionModal: false
        });
        this.handleAccountCancellation();
    },

    /**
     * 点击退出登录按钮
     */
    onLogoutTap() {
        this.setData({
            showActionModal: false
        });
        this.handleLogout();
    },

    /**
     * 编辑资料
     */
    editProfile() {
        // 这里可以跳转到编辑资料页面或者弹出编辑弹窗
        wx.showToast({
            title: '编辑资料功能待开发',
            icon: 'none',
            duration: 2000
        });
    },

    /**
     * 退出登录
     */
    async logout() {
        wx.showModal({
            title: '确认退出',
            content: '确定要退出登录吗？',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        // 使用认证模块的登出方法
                        await auth.logout();

                        // 更新全局状态
                        const app = getApp();
                        if (app && app.updateLoginStatus) {
                            app.updateLoginStatus(null);
                        }

                        // 重置页面数据
                        this.setDefaultUserInfo();

                        console.log('退出登录成功');
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        wx.showToast({
                            title: '退出登录失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                }
            }
        });
    },

    /**
     * 页面分享
     */
    onShareAppMessage() {
        return {
            title: '我的个人中心',
            path: '/pages/profile/profile'
        };
    },

    /**
     * 我的足迹点击事件
     */
    onFootprintsTap() {
        wx.navigateTo({
            url: '/pages/my-footprints/my-footprints',
            fail: (error) => {
                console.error('跳转到我的足迹页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 我的收藏点击事件
     */
    onFavoritesTap() {
        wx.navigateTo({
            url: '/pages/my-favorites/my-favorites',
            fail: (error) => {
                console.error('跳转到我的收藏页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 设置按钮点击事件
     */
    onSettingsTap() {
        console.log('点击设置按钮');
        this.handleSettings();
    },

    /**
     * 页面分享到朋友圈
     */
    onShareTimeline() {
        return {
            title: '我的个人中心'
        };
    },

    /**
     * 功能模块点击事件
     */
    onFunctionModuleTap(e) {
        const { id, name } = e.currentTarget.dataset;
        console.log('点击功能模块:', id, name);

        // 根据不同的功能模块ID处理不同的逻辑
        switch (id) {
            case 'qrcode':
                this.handleQRCode();
                break;
            case 'buy-car':
                this.handleBuyCar();
                break;
            case 'approve-car':
                this.handleApproveCar();
                break;
            case 'verify-ticket':
                this.handleVerifyTicket();
                break;
            case 'assist-exam':
                this.handleAssistExam();
                break;
            case 'settings':
                this.handleSettings();
                break;
            default:
                wx.showToast({
                    title: '功能暂未开放',
                    icon: 'none',
                    duration: 2000
                });
        }
    },

    /**
     * 我的二维码
     */
    handleQRCode() {
        console.log('点击我的二维码按钮');

        // 获取用户信息
        const userInfo = storage.getUserInfo();
        if (!userInfo || !userInfo.phoneNumber) {
            wx.showToast({
                title: '用户信息不完整',
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 构造用户数据
        const userData = {
            type: 'assist-ticket',
            assistantName: userInfo.name || userInfo.nickName || '微信用户',
            assistantPhone: userInfo.phoneNumber || '',
            userId: userInfo.openid || 'anonymous'
        };

        // 设置二维码数据并显示弹窗
        this.setData({
            userQRData: userData,
            showQRModal: true
        });
    },

    /**
     * 我要卖车
     */
    handleBuyCar() {
        console.log('跳转到卖车管理页面');
        wx.navigateTo({
            url: '/pages/car-selling/car-selling',
            success: () => {
                console.log('成功跳转到卖车管理页面');
            },
            fail: (error) => {
                console.error('跳转到卖车管理页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 审批车辆
     */
    handleApproveCar() {
        wx.showToast({
            title: '审批车辆功能待开发',
            icon: 'none',
            duration: 2000
        });
    },

    /**
     * 模拟票核销
     */
    handleVerifyTicket() {
        console.log('跳转到模拟票核销页面');
        wx.navigateTo({
            url: '/pages/ticket-verification/ticket-verification',
            success: () => {
                console.log('成功跳转到模拟票核销页面');
            },
            fail: (error) => {
                console.error('跳转到模拟票核销页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 模拟票助考
     */
    handleAssistExam() {
        console.log('跳转到模拟票助考页面');
        wx.navigateTo({
            url: '/pages/assist-exam/assist-exam',
            success: () => {
                console.log('成功跳转到模拟票助考页面');
            },
            fail: (error) => {
                console.error('跳转到模拟票助考页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 设置
     */
    handleSettings() {},

    /**
     * 处理注销账号
     */
    handleAccountCancellation() {
        wx.showToast({
            title: '注销账号功能待开发',
            icon: 'none',
            duration: 2000
        });
        console.log('用户点击注销账号');
    },

    /**
     * 处理退出登录
     */
    async handleLogout() {
        wx.showModal({
            title: '确认退出',
            content: '请确认是否退出此次登录',
            showCancel: true,
            cancelText: '取消',
            confirmText: '确定',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        console.log('用户确认退出登录');

                        // 使用认证模块的登出方法
                        await auth.logout();

                        // 更新全局状态
                        const app = getApp();
                        if (app && app.updateLoginStatus) {
                            app.updateLoginStatus(null);
                        }

                        // 重置页面数据为未登录状态
                        this.setDefaultUserInfo();

                        console.log('退出登录成功，设置按钮已隐藏');
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        wx.showToast({
                            title: '退出登录失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                } else {
                    console.log('用户取消退出登录');
                }
            }
        });
    },

    /**
     * 关闭二维码弹窗
     */
    onCloseQRModal() {
        console.log('关闭用户二维码弹窗');

        this.setData({
            showQRModal: false,
            userQRData: null
        });
    },

    /**
     * 阻止二维码弹窗内容区域的点击事件冒泡
     */
    onQRContentTap() {
        // 阻止事件冒泡，防止关闭弹窗
    }
});
