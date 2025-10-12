// index.js
const apiConfig = require('../../config/api.js');
const request = require('../../utils/request.js');

Page({
    data: {
        homeData: {
            imgList: [],
            companyName: '',
            companyDesc: '',
            companyAddress: '',
            companyContact: '',
            mockExamPhone: '',
            companyLat: null,
            companyLng: null
        },
        loading: true,
        error: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        this.loadHomeData();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 设置tabBar选中状态
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 0
            });
        }
    },

    /**
     * 加载首页数据
     */
    loadHomeData() {
        this.setData({
            loading: true,
            error: ''
        });

        console.log('开始加载主页数据...');

        // 使用统一的请求工具调用真实接口
        request.get('/api/mp/setting/query-main-page-info', {}, {
            showLoading: false,
            showErrorToast: false
        })
        .then((data) => {
            console.log('主页数据请求成功:', data);

            // 转换数据结构以适配现有UI
            const homeData = {
                imgList: data.miniProgramImageUrlList?.map(item => item.fileUrl) || [],
                companyName: data.companyName || '',
                companyDesc: data.companyDesc || '',
                companyAddress: data.companyAddress || '',
                companyContact: data.contactPhone || '',
                mockExamPhone: data.mockExamPhone || '',
                companyLat: data.companyLat,
                companyLng: data.companyLng
            };

            this.setData({
                homeData: homeData,
                loading: false,
                error: ''
            });
        })
        .catch((err) => {
            console.error('主页数据请求失败:', err);
            this.setData({
                loading: false,
                error: err.userMessage || err.message || '获取数据失败'
            });
        });
    },

    /**
     * 拨打电话
     */
    callPhone() {
        const phoneNumber = this.data.homeData.companyContact;
        if (!phoneNumber) {
            wx.showToast({
                title: '电话号码不可用',
                icon: 'none'
            });
            return;
        }

        wx.showModal({
            title: '拨打电话',
            content: `确定要拨打 ${phoneNumber} 吗？`,
            success: (res) => {
                if (res.confirm) {
                    wx.makePhoneCall({
                        phoneNumber: phoneNumber,
                        success: () => {
                            console.log('拨打电话成功');
                        },
                        fail: (err) => {
                            console.error('拨打电话失败:', err);
                            wx.showToast({
                                title: '拨打电话失败',
                                icon: 'none'
                            });
                        }
                    });
                }
            }
        });
    },

    /**
     * 拨打模拟考试电话
     */
    callMockExamPhone() {
        const phoneNumber = this.data.homeData.mockExamPhone;
        if (!phoneNumber) {
            wx.showToast({
                title: '模拟考试电话不可用',
                icon: 'none'
            });
            return;
        }

        wx.showModal({
            title: '拨打模拟考试电话',
            content: `确定要拨打 ${phoneNumber} 吗？`,
            success: (res) => {
                if (res.confirm) {
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
            }
        });
    },

    /**
     * 打开地图位置
     */
    openLocation() {
        const { companyAddress, companyName, companyLat, companyLng } = this.data.homeData;

        if (!companyAddress) {
            wx.showToast({
                title: '地址信息不可用',
                icon: 'none'
            });
            return;
        }

        // 使用接口返回的真实经纬度，如果没有则使用默认坐标
        const latitude = companyLat || 39.9042; // 默认北京市朝阳区建国路附近纬度
        const longitude = companyLng || 116.4074; // 默认北京市朝阳区建国路附近经度

        wx.openLocation({
            latitude: latitude,
            longitude: longitude,
            name: companyName || '公司位置',
            address: companyAddress,
            scale: 18,
            success: () => {
                console.log('打开地图成功');
            },
            fail: (err) => {
                console.error('打开地图失败:', err);
                wx.showToast({
                    title: '打开地图失败',
                    icon: 'none'
                });
            }
        });
    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        console.log('下拉刷新');
        this.loadHomeData();
        // 停止下拉刷新
        setTimeout(() => {
            wx.stopPullDownRefresh();
        }, 1000);
    },

    /**
     * 页面分享
     */
    onShareAppMessage() {
        return {
            title: this.data.homeData.companyName || '汽车服务小程序',
            path: '/pages/index/index',
            imageUrl: this.data.homeData.imgList?.[0] || ''
        };
    },

    /**
     * 分享到朋友圈
     */
    onShareTimeline() {
        return {
            title: this.data.homeData.companyName || '汽车服务小程序',
            imageUrl: this.data.homeData.imgList?.[0] || ''
        };
    }
});
