// index.js
const apiConfig = require('../../config/api.js');

Page({
    data: {
        homeData: {
            imgList: [],
            companyName: '',
            companyDesc: '',
            companyAddress: '',
            companyContact: ''
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

        console.warn('-----apiconfi', apiConfig.currentEnv.getApiUrl('/api/home-info'));

        wx.request({
            url: 'http://192.168.124.8:3000/api/home-info',
            method: 'GET',
            success: (res) => {
                console.log('首页数据请求成功:', res.data);
                if (res.data && res.data.success) {
                    this.setData({
                        homeData: res.data.data,
                        loading: false,
                        error: ''
                    });
                } else {
                    this.setData({
                        loading: false,
                        error: res.data?.message || '获取数据失败'
                    });
                }
            },
            fail: (err) => {
                console.error('首页数据请求失败:', err);
                this.setData({
                    loading: false,
                    error: '网络请求失败，请检查网络连接'
                });
            }
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
     * 打开地图位置
     */
    openLocation() {
        const address = this.data.homeData.companyAddress;
        if (!address) {
            wx.showToast({
                title: '地址信息不可用',
                icon: 'none'
            });
            return;
        }

        // 使用地理编码获取经纬度（这里使用模拟数据）
        // 实际项目中应该调用地图API获取真实经纬度
        const latitude = 39.9042; // 北京市朝阳区建国路附近纬度
        const longitude = 116.4074; // 北京市朝阳区建国路附近经度

        wx.openLocation({
            latitude: latitude,
            longitude: longitude,
            name: this.data.homeData.companyName,
            address: address,
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
