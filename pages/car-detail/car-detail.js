// pages/car-detail/car-detail.js
const request = require('../../utils/request.js');
const carApi = require('../../utils/car-api.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        loading: false,
        carId: null,
        carDetail: null,

        // 图片轮播
        currentImageIndex: 0,

        // Tab切换
        activeTab: 'basic',

        // 底价弹窗
        showFloorPriceModal: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('车辆详情页面加载:', options);

        const { carId } = options;
        if (!carId) {
            wx.showToast({
                title: '参数错误',
                icon: 'none',
                duration: 2000
            });
            wx.navigateBack();
            return;
        }

        this.setData({ carId });
        this.loadCarDetail(carId);
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 页面显示时重新加载数据，确保数据最新
        if (this.data.carId) {
            this.loadCarDetail(this.data.carId);
        }
    },

    /**
     * 加载车辆详情
     */
    async loadCarDetail(carId) {
        try {
            this.setData({ loading: true });

            // 调用车辆详情API
            const result = await carApi.getCarDetail(carId);

            if (result) {
                this.setData({
                    carDetail: result.data,
                    currentImageIndex: 0
                });
                console.log('车辆详情加载成功:', result.data);
            } else {
                throw new Error('获取车辆详情失败');
            }
        } catch (error) {
            console.error('加载车辆详情失败:', error);
            wx.showToast({
                title: error.message || '加载失败',
                icon: 'none',
                duration: 2000
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    /**
     * 图片轮播改变
     */
    onImageSwiperChange(e) {
        const { current } = e.detail;
        this.setData({
            currentImageIndex: current
        });
    },

    /**
     * 图片预览
     */
    onImagePreview() {
        const { carDetail } = this.data;
        if (
            !carDetail ||
            !carDetail.basicInfo.imageUrlList ||
            carDetail.basicInfo.imageUrlList.length === 0
        )
            return;

        const imageUrls = carDetail.basicInfo.imageUrlList.map((item) => item.fileUrl);
        wx.previewImage({
            urls: imageUrls,
            current: imageUrls[this.data.currentImageIndex]
        });
    },

    /**
     * Tab切换
     */
    onTabChange(e) {
        const { tab } = e.currentTarget.dataset;
        this.setData({
            activeTab: tab
        });
    },

    /**
     * 实拍图片点击
     */
    onPhotoTap(e) {
        const { index } = e.currentTarget.dataset;
        const { carDetail } = this.data;
        if (!carDetail || !carDetail.basicInfo.imageUrlList) return;

        const imageUrls = carDetail.basicInfo.imageUrlList.map((item) => item.fileUrl);
        wx.previewImage({
            urls: imageUrls,
            current: imageUrls[index]
        });
    },

    /**
     * 拨打电话
     */
    onCallPhone() {
        const { carDetail } = this.data;
        if (!carDetail || !carDetail.basicInfo.contactPhone) return;

        wx.makePhoneCall({
            phoneNumber: carDetail.basicInfo.contactPhone,
            success: () => {
                console.log('拨打电话成功');
            },
            fail: (error) => {
                console.error('拨打电话失败:', error);
                wx.showToast({
                    title: '拨打失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 切换收藏状态
     */
    async onToggleFavorite() {
        const { carDetail } = this.data;
        if (!carDetail) return;

        try {
            const isFavorited = carDetail.basicInfo.favorStatus === 'FAVORITE';
            const result = await carApi.updateFavoriteStatus(this.data.carId, !isFavorited);

            if (result.success) {
                // 更新本地状态
                const updatedCarDetail = {
                    ...carDetail,
                    basicInfo: {
                        ...carDetail.basicInfo,
                        favorStatus: isFavorited ? 'UNFAVORITE' : 'FAVORITE'
                    }
                };

                this.setData({
                    carDetail: updatedCarDetail
                });

                wx.showToast({
                    title: isFavorited ? '已取消收藏' : '收藏成功',
                    icon: 'success',
                    duration: 1500
                });
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            wx.showToast({
                title: error.message || '操作失败',
                icon: 'none',
                duration: 2000
            });
        }
    },

    /**
     * 显示底价弹窗
     */
    onShowFloorPrice() {
        this.setData({
            showFloorPriceModal: true
        });
    },

    /**
     * 隐藏底价弹窗
     */
    onHideFloorPriceModal() {
        this.setData({
            showFloorPriceModal: false
        });
    },

    /**
     * 页面分享
     */
    onShareAppMessage() {
        const { carDetail } = this.data;
        if (!carDetail) {
            return {
                title: '车辆详情',
                path: '/pages/car-detail/car-detail'
            };
        }

        const imageUrl =
            carDetail.basicInfo.imageUrlList && carDetail.basicInfo.imageUrlList[0]
                ? carDetail.basicInfo.imageUrlList[0].fileUrl
                : '';

        return {
            title: `${carDetail.name} - ${carDetail.basicInfo.sellPrice}万元`,
            path: `/pages/car-detail/car-detail?carId=${carDetail.carId}`,
            imageUrl: imageUrl
        };
    }
});
