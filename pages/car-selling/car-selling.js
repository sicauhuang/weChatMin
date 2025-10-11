// pages/car-selling/car-selling.js
const auth = require('../../utils/auth.js');
const storage = require('../../utils/storage.js');
const { post } = require('../../utils/request.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        loading: false,
        vehicleList: [],
        hasMore: true,
        pageSize: 7,
        currentPage: 1,
        totalCount: 0, // 新增：总记录数

        // 过滤相关状态
        filterStatus: '', // 当前选中的过滤状态（空字符串表示全部）
        filterOptions: [
            // 过滤选项列表
            { text: '全部', value: '' },
            { text: '待审批', value: 'WAIT_APPROVE' },
            { text: '待整改', value: 'WAIT_RECTIFY' },
            { text: '在售', value: 'ON_SALE' },
            { text: '已出售', value: 'SOLD' }
        ]
    },

    /**
     * 车辆相关API调用方法
     */

    /**
     * 查询我发布的车辆列表（分页）
     * @param {Object} params 请求参数
     * @param {number} params.pageNum 页码，从1开始
     * @param {number} params.pageSize 每页数量，默认50
     * @param {string} params.keyword 关键词搜索（可选）
     * @param {string[]} params.statusIn 状态筛选数组（可选）
     * @returns {Promise} 车辆列表数据
     */
    async queryMyPublishCarPage(params = {}) {
        const requestData = {
            pageNum: params.pageNum || 1,
            pageSize: params.pageSize || 50,
            ...params
        };

        // 过滤掉空值和undefined
        Object.keys(requestData).forEach((key) => {
            if (
                requestData[key] === null ||
                requestData[key] === undefined ||
                requestData[key] === ''
            ) {
                delete requestData[key];
            }
        });

        console.log('调用车辆列表API:', requestData);

        return post('/api/mp/car/query-my-publish-car-page', requestData, {
            showLoading: false,
            showErrorToast: true
        });
    },

    /**
     * 转换后端车辆数据为前端格式 - 增强版本
     * @param {Object} backendCarData 后端车辆数据
     * @returns {Object} 前端车辆数据格式
     */
    transformCarData(backendCarData) {
        if (!backendCarData || typeof backendCarData !== 'object') {
            console.warn('无效的车辆数据:', backendCarData);
            return null;
        }

        try {
            // 处理图片URL - 取第一个图片或使用默认图片
            let previewImage = '/assets/imgs/logo.png';
            if (Array.isArray(backendCarData.imageUrlList) && backendCarData.imageUrlList.length > 0) {
                const firstImage = backendCarData.imageUrlList[0];
                if (firstImage && typeof firstImage === 'object' && firstImage.fileUrl) {
                    previewImage = firstImage.fileUrl;
                } else if (typeof firstImage === 'string') {
                    previewImage = firstImage;
                }
            }

            // 转换收藏状态
            const isFavorited = backendCarData.favorStatus === 'FAVORITE';

            // 数据验证和默认值处理
            const transformedData = {
                carId: String(backendCarData.id || ''), // 转换为字符串
                previewImage: previewImage,
                brand: this._safeString(backendCarData.brand),
                series: this._safeString(backendCarData.series),
                model: this._safeString(backendCarData.variant), // 款式映射到model
                name: this._safeString(backendCarData.name), // 后端拼接好的完整名称
                registrationDate: this._safeString(backendCarData.licenseDate), // 上牌日期
                mileage: this._safeNumber(backendCarData.mileage), // 里程（万公里）
                color: this._safeString(backendCarData.color),
                transferCount: this._safeNumber(backendCarData.transferCount),
                retailPrice: this._safeNumber(backendCarData.sellPrice), // 售价（万元）
                floorPrice: this._safeNumber(backendCarData.floorPrice), // 底价
                isFavorited: isFavorited,
                status: this._safeString(backendCarData.status),
                statusName: this._safeString(backendCarData.statusName),
                contactPhone: this._safeString(backendCarData.contactPhone),
                remark: this._safeString(backendCarData.remark),
                // 保留原始数据用于调试（只在开发环境）
                ...(console.debug ? { _originalData: backendCarData } : {})
            };

            // 验证必要字段
            if (!transformedData.carId) {
                console.error('车辆ID缺失:', backendCarData);
                return null;
            }

            return transformedData;
        } catch (error) {
            console.error('车辆数据转换失败:', error, backendCarData);
            return null;
        }
    },

    /**
     * 安全字符串处理
     */
    _safeString(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    },

    /**
     * 安全数字处理
     */
    _safeNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    },

    /**
     * 转换车辆列表分页响应 - 增强版本
     * @param {Object} response 后端分页响应
     * @returns {Object} 转换后的分页数据
     */
    transformCarPageResponse(response) {
        // 数据验证
        if (!response || typeof response !== 'object') {
            console.warn('无效的响应数据，使用默认值:', response);
            return this._getDefaultPageResponse();
        }

        try {
            // 安全获取响应字段
            const list = Array.isArray(response.list) ? response.list : [];
            const pageNum = this._safeNumber(response.pageNum) || 1;
            const pageSize = this._safeNumber(response.pageSize) || this.data.pageSize || 7;
            const total = this._safeNumber(response.total) || 0;

            console.log('转换前数据统计:', {
                原始列表数量: list.length,
                页码: pageNum,
                每页数量: pageSize,
                总数: total
            });

            // 批量转换车辆数据，过滤无效数据
            const transformedList = list
                .map((item, index) => {
                    try {
                        return this.transformCarData(item);
                    } catch (error) {
                        console.error(`转换第${index}个车辆数据失败:`, error, item);
                        return null;
                    }
                })
                .filter(item => item !== null); // 过滤转换失败的数据

            console.log('转换后数据统计:', {
                转换成功数量: transformedList.length,
                转换失败数量: list.length - transformedList.length
            });

            return {
                list: transformedList,
                pageNum: pageNum,
                pageSize: pageSize,
                total: total
            };
        } catch (error) {
            console.error('转换分页响应失败:', error, response);
            return this._getDefaultPageResponse();
        }
    },

    /**
     * 获取默认分页响应
     */
    _getDefaultPageResponse() {
        return {
            list: [],
            pageNum: 1,
            pageSize: this.data.pageSize || 7,
            total: 0
        };
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('卖车管理页面加载');

        // 初始化定时器
        this._reachBottomTimer = null;

        this.checkLoginStatus();
        this.loadVehicleList();
    },

    /**
     * 生命周期函数--监听页面销毁
     */
    onUnload() {
        console.log('卖车管理页面销毁');

        // 清除定时器
        if (this._reachBottomTimer) {
            clearTimeout(this._reachBottomTimer);
            this._reachBottomTimer = null;
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('卖车管理页面显示');
        // 刷新车辆列表
        this.loadVehicleList();
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        const isLoggedIn = auth.checkLoginStatus();
        if (!isLoggedIn) {
            wx.showModal({
                title: '提示',
                content: '请先登录后再使用卖车功能',
                confirmText: '去登录',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        wx.redirectTo({
                            url: '/pages/login/login'
                        });
                    } else {
                        wx.navigateBack();
                    }
                }
            });
            return false;
        }
        return true;
    },

    /**
     * 加载车辆列表 - 增强版本
     */
    async loadVehicleList(refresh = true) {
        if (this.data.loading) {
            console.log('正在加载中，跳过重复请求');
            return Promise.reject(new Error('重复请求'));
        }

        console.log('开始加载车辆列表:', { refresh, currentPage: this.data.currentPage });

        // 设置加载状态
        this.setData({ loading: true });

        try {
            // 准备请求参数
            const requestParams = {
                pageNum: refresh ? 1 : this.data.currentPage,
                pageSize: this.data.pageSize
            };

            // 添加状态过滤
            if (this.data.filterStatus && this.data.filterStatus !== '') {
                requestParams.statusIn = [this.data.filterStatus];
            }

            console.log('请求参数:', requestParams);

            // 调用API
            const response = await this.queryMyPublishCarPage(requestParams);
            console.log('API响应:', response);

            // 转换数据格式
            const transformedData = this.transformCarPageResponse(response);
            console.log('转换后数据:', transformedData);

            // 数据去重处理
            const existingIds = refresh ? [] : this.data.vehicleList.map(v => v.carId);
            const filteredNewVehicles = transformedData.list.filter(
                vehicle => !existingIds.includes(vehicle.carId)
            );

            console.log('数据去重:', {
                原始数量: transformedData.list.length,
                去重后数量: filteredNewVehicles.length,
                已存在ID数量: existingIds.length
            });

            // 格式化车辆数据
            const formattedVehicles = filteredNewVehicles.map((vehicle) => ({
                ...vehicle,
                formattedPrice: this.formatPrice(vehicle.retailPrice),
                formattedMileage: this.formatMileage(vehicle.mileage),
                formattedDate: this.formatDate(vehicle.registrationDate),
                formattedTransfer: this.formatTransferCount(vehicle.transferCount),
                isSelected: false // 在删除模式下的选中状态
            }));

            // 计算分页信息
            const { pageNum, pageSize, total } = transformedData;
            const maxPage = Math.ceil(total / pageSize);
            const hasMore = pageNum < maxPage;

            if (refresh) {
                // 刷新数据
                this.setData({
                    vehicleList: formattedVehicles,
                    currentPage: pageNum,
                    totalCount: total,
                    hasMore: hasMore
                });
                console.log('刷新车辆列表成功:', {
                    count: formattedVehicles.length,
                    total: total,
                    hasMore: hasMore
                });
            } else {
                // 加载更多数据 - 数据去重后追加
                const newVehicleList = [...this.data.vehicleList, ...formattedVehicles];
                this.setData({
                    vehicleList: newVehicleList,
                    currentPage: pageNum,
                    totalCount: total,
                    hasMore: hasMore
                });
                console.log('加载更多车辆成功:', {
                    newCount: formattedVehicles.length,
                    totalCount: newVehicleList.length,
                    hasMore: hasMore
                });
            }

            console.log('车辆列表加载成功，当前过滤状态:', this.data.filterStatus);
            return Promise.resolve({
                count: formattedVehicles.length,
                total: transformedData.total,
                hasMore
            });
        } catch (error) {
            console.error('加载车辆列表失败:', error);

            // 增强的错误处理
            let errorMessage = '加载失败';
            let shouldRetry = false;

            switch (error.code) {
                case 'NETWORK_ERROR':
                    errorMessage = '网络连接失败，请检查网络后重试';
                    shouldRetry = true;
                    break;
                case 'TIMEOUT':
                    errorMessage = '请求超时，请稍后重试';
                    shouldRetry = true;
                    break;
                case '500':
                case '502':
                case '503':
                case '504':
                    errorMessage = '服务器繁忙，请稍后重试';
                    shouldRetry = true;
                    break;
                case '401':
                    errorMessage = '登录已过期，请重新登录';
                    break;
                case '403':
                    errorMessage = '没有权限访问';
                    break;
                default:
                    if (error.userMessage) {
                        errorMessage = error.userMessage;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    shouldRetry = true;
                    break;
            }

            // 只在首次加载或刷新时显示Toast
            if (refresh) {
                wx.showToast({
                    title: errorMessage,
                    icon: 'none',
                    duration: 2000
                });
            } else {
                // 分页加载失败时显示更温和的提示
                console.log('分页加载失败，不显示Toast，错误信息:', errorMessage);
            }

            // 错误边界处理
            if (refresh && this.data.vehicleList.length === 0) {
                this.setData({
                    vehicleList: [],
                    hasMore: false,
                    totalCount: 0
                });
            }

            // 返回拒绝的Promise，供调用方处理
            return Promise.reject({
                ...error,
                userMessage: errorMessage,
                shouldRetry
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    /**
     * 格式化价格 - 增强版本
     */
    formatPrice(price) {
        if (!price || price <= 0) return '面议';

        // 处理大数字显示
        if (price >= 10000) {
            return `${(price / 10000).toFixed(1)}亿`;
        } else if (price >= 1000) {
            return `${(price / 1000).toFixed(0)}千万`;
        } else if (price >= 100) {
            return `${(price / 100).toFixed(0)}百万`;
        } else {
            return `${price.toFixed(1)}万`;
        }
    },

    /**
     * 格式化里程 - 增强版本
     */
    formatMileage(mileage) {
        if (!mileage || mileage <= 0) return '准新车';

        // 处理大里程数显示
        if (mileage >= 100) {
            return `${(mileage / 10).toFixed(0)}十万公里`;
        } else if (mileage >= 10) {
            return `${mileage.toFixed(0)}万公里`;
        } else {
            return `${mileage.toFixed(1)}万公里`;
        }
    },

    /**
     * 格式化日期 - 增强版本
     */
    formatDate(dateString) {
        if (!dateString) return '--';

        try {
            // 尝试解析日期
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString; // 如果无法解析，返回原始字符串
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.warn('日期格式化失败:', dateString, error);
            return dateString;
        }
    },

    /**
     * 格式化过户次数 - 增强版本
     */
    formatTransferCount(count) {
        if (!count || count === 0) return '未过户';

        if (count === 1) return '过户一次';
        if (count >= 5) return '多次过户'; // 过多次过户的简化显示

        return `过户${count}次`;
    },

    /**
     * 新建车辆
     */
    onCreateVehicle() {
        if (!this.checkLoginStatus()) return;

        wx.navigateTo({
            url: '/pages/car-form/car-form?mode=create',
            success: () => {
                console.log('跳转到新建车辆页面成功');
            },
            fail: (error) => {
                console.error('跳转到新建车辆页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 车辆卡片组件事件处理方法
     */

    /**
     * 处理车辆卡片点击事件
     */
    handleCardTap(e) {
        const { vehicleData } = e.detail;
        if (!vehicleData || !vehicleData.carId) return;

        wx.navigateTo({
            url: `/pages/car-detail/car-detail?carId=${vehicleData.carId}`,
            success: () => {
                console.log('跳转到车辆详情页面成功:', vehicleData.carId);
            },
            fail: (error) => {
                console.error('跳转到车辆详情页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 处理收藏状态切换事件
     */
    handleFavoriteToggle(e) {
        const { vehicleData, isFavorited } = e.detail;

        if (!vehicleData || !vehicleData.carId) {
            console.error('收藏操作缺少必要参数:', { vehicleData });
            return;
        }

        console.log('收藏状态切换:', { carId: vehicleData.carId, isFavorited });

        // 获取当前车辆列表
        const vehicleList = [...this.data.vehicleList];
        const vehicleIndex = vehicleList.findIndex(
            (vehicle) => vehicle.carId === vehicleData.carId
        );

        if (vehicleIndex === -1) {
            console.error('未找到对应车辆信息:', { carId: vehicleData.carId });
            wx.showToast({
                title: '操作失败',
                icon: 'none',
                duration: 1500
            });
            return;
        }

        // 更新收藏状态
        vehicleList[vehicleIndex].isFavorited = isFavorited;

        // 更新数据
        this.setData({
            vehicleList: vehicleList
        });

        // 显示反馈消息
        const action = isFavorited ? '收藏' : '取消收藏';
        console.log(`${action}成功:`, vehicleData.brand, vehicleData.series);

        wx.showToast({
            title: `${action}成功`,
            icon: 'success',
            duration: 1000
        });

        // TODO: 调用后端 API 更新收藏状态
        // this.updateFavoriteStatus(vehicleData.carId, isFavorited);
    },


    /**
     * 处理车辆删除事件
     */
    handleDelete(e) {
        const { vehicleData } = e.detail;
        if (!vehicleData || !vehicleData.carId) {
            console.error('删除车辆缺少必要参数:', { vehicleData });
            return;
        }

        // 执行单个车辆删除
        this.performSingleDelete(vehicleData.carId);
    },

    /**
     * 执行单个车辆删除
     * @param {string} carId 车辆ID
     */
    async performSingleDelete(carId) {
        try {
            console.log('开始删除车辆:', carId);

            // 显示加载提示
            wx.showLoading({
                title: '删除中...',
                mask: true
            });

            // TODO: 调用实际的删除API
            // const result = await this.callDeleteAPI([carId]);

            // 模拟删除成功
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const result = {
                success: true,
                data: {
                    deletedCount: 1,
                    failedIds: []
                }
            };

            if (result.success) {
                // 从列表中移除已删除的车辆
                const remainingVehicles = this.data.vehicleList.filter(
                    (vehicle) => vehicle.carId !== carId
                );

                // 更新列表和总数
                this.setData({
                    vehicleList: remainingVehicles,
                    totalCount: Math.max(0, this.data.totalCount - 1) // 总数减1，确保不小于0
                });

                // 更新hasMore状态
                const hasMore = this.data.totalCount > remainingVehicles.length;
                this.setData({ hasMore });

                wx.hideLoading();
                wx.showToast({
                    title: '删除成功',
                    icon: 'success',
                    duration: 2000
                });

                console.log('删除成功:', {
                    remainingCount: remainingVehicles.length,
                    totalCount: this.data.totalCount,
                    hasMore
                });
            } else {
                throw new Error(result.message || '删除失败');
            }
        } catch (error) {
            console.error('删除车辆失败:', error);
            wx.hideLoading();
            wx.showModal({
                title: '删除失败',
                content: error.message || '网络异常，请稍后重试',
                showCancel: false,
                confirmText: '知道了'
            });
        }
    },

    /**
     * 车辆卡片点击事件（弃用，保留兼容）
     */
    onVehicleCardTap(e) {
        const { carId } = e.currentTarget.dataset;
        if (!carId) return;

        wx.navigateTo({
            url: `/pages/car-detail/car-detail?carId=${carId}`,
            success: () => {
                console.log('跳转到车辆详情页面成功:', carId);
            },
            fail: (error) => {
                console.error('跳转到车辆详情页面失败:', error);
                wx.showToast({
                    title: '页面跳转失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    /**
     * 收藏按钮点击事件（弃用，保留兼容）
     */
    onFavoriteToggle(e) {
        // 立即阻止事件冒泡，防止触发卡片点击事件
        // 注意：使用catchtap时这行代码是冗余的，但保留以确保兼容性
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }

        const { carId, index } = e.currentTarget.dataset;

        // 验证必要参数
        if (!carId || index === undefined || index === null) {
            console.error('收藏操作缺少必要参数:', { carId, index });
            return;
        }

        console.log('收藏状态切换:', { carId, index });

        // 获取当前车辆列表
        const vehicleList = [...this.data.vehicleList];
        const vehicleIndex = parseInt(index);
        const vehicle = vehicleList[vehicleIndex];

        // 验证车辆数据
        if (!vehicle) {
            console.error('未找到对应车辆信息:', { carId, index: vehicleIndex });
            wx.showToast({
                title: '操作失败',
                icon: 'none',
                duration: 1500
            });
            return;
        }

        // 验证车辆ID匹配
        if (vehicle.carId !== carId) {
            console.error('车辆ID不匹配:', {
                expectedCarId: carId,
                actualCarId: vehicle.carId,
                index: vehicleIndex
            });
            wx.showToast({
                title: '数据异常',
                icon: 'none',
                duration: 1500
            });
            return;
        }

        // 切换收藏状态
        const previousState = vehicle.isFavorited;
        vehicle.isFavorited = !vehicle.isFavorited;

        // 更新数据
        this.setData({
            vehicleList: vehicleList
        });

        // 显示反馈消息
        const action = vehicle.isFavorited ? '收藏' : '取消收藏';
        console.log(`${action}成功:`, vehicle.brand, vehicle.series);

        // 可选：显示用户反馈
        wx.showToast({
            title: `${action}成功`,
            icon: 'success',
            duration: 1000
        });

        // 这里可以添加调用后端API的逻辑
        // TODO: 调用收藏/取消收藏的API接口
        // this.updateFavoriteStatus(carId, vehicle.isFavorited);
    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        console.log('下拉刷新车辆列表');
        this.loadVehicleList(true).finally(() => {
            wx.stopPullDownRefresh();
        });
    },

    /**
     * scroll-view 滚动到底部事件
     */
    onScrollToLower() {
        console.log('scroll-view 触发上拉加载');
        // 复用现有的上拉加载逻辑
        this.onReachBottom();
    },

    /**
     * 上拉加载更多 - 增强版本
     */
    onReachBottom() {
        console.log('触发上拉加载事件');
        // 防抖处理：避免用户快速滑动触发多次请求
        if (this._reachBottomTimer) {
            clearTimeout(this._reachBottomTimer);
        }

        this._reachBottomTimer = setTimeout(() => {
            this._handleLoadMore();
        }, 300); // 300ms防抖延迟
    },

    /**
     * 处理加载更多逻辑
     */
    _handleLoadMore() {
        const { hasMore, loading, vehicleList, pageSize, totalCount } = this.data;

        console.log('上拉加载更多检查:', {
            hasMore,
            loading,
            listLength: vehicleList.length,
            pageSize,
            totalCount
        });

        // 检查是否可以加载更多
        if (!hasMore) {
            if (vehicleList.length > 0) {
                console.log('已加载全部数据');
                // 显示"没有更多数据"提示，但不显示Toast，避免过度提示
                // wx.showToast({
                //     title: '没有更多数据',
                //     icon: 'none',
                //     duration: 1500
                // });
            }
            return;
        }

        // 防止重复加载
        if (loading) {
            console.log('正在加载中，跳过重复请求');
            return;
        }

        console.log('开始加载下一页数据');

        // 智能计算需要加载的页码
        // 已加载的项目数量除以每页大小，向上取整，再加1
        const loadedPages = Math.ceil(vehicleList.length / pageSize);
        const nextPage = loadedPages + 1;

        console.log('智能计算页码:', {
            loadedItems: vehicleList.length,
            pageSize,
            loadedPages,
            nextPage
        });

        // 设置下一页的页码
        this.setData({
            currentPage: nextPage
        });

        // 加载数据，如果失败则回退页码
        this.loadVehicleList(false).catch((error) => {
            console.error('加载更多失败，回退页码:', error);
            // 回退页码
            this.setData({
                currentPage: this.data.currentPage - 1
            });
        });
    },

    /**
     * 页面分享
     */
    onShareAppMessage() {
        return {
            title: '卖车管理',
            path: '/pages/car-selling/car-selling'
        };
    },

    /**
     * =============================
     * 过滤功能相关方法
     * =============================
     */

    /**
     * 下拉菜单选择事件 - 增强版本
     */
    onFilterChange(e) {
        const selectedValue = e.detail;
        console.log('过滤状态改变:', selectedValue);

        // 如果没有改变，不需要重新加载
        if (selectedValue === this.data.filterStatus) {
            console.log('过滤状态未变化，跳过加载');
            return;
        }

        // 更新过滤状态并重置分页
        this.setData({
            filterStatus: selectedValue,
            currentPage: 1,
            hasMore: true
        });

        // 重新加载车辆列表
        this.loadVehicleList(true).catch((error) => {
            console.error('过滤改变后加载失败:', error);
            // 如果加载失败，可以选择重置过滤条件
            // this.setData({ filterStatus: '' });
        });
    },

    /**
     * 重置过滤条件 - 增强版本
     */
    resetFilter() {
        console.log('重置过滤条件');

        // 重置过滤状态和分页状态
        this.setData({
            filterStatus: '',
            currentPage: 1,
            hasMore: true
        });

        // 重新加载数据
        this.loadVehicleList(true).catch((error) => {
            console.error('重置过滤后加载失败:', error);
        });
    },

});
