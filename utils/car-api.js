/**
 * 车辆相关API接口封装
 * 包含收藏、取消收藏等车辆管理相关接口
 */

const request = require('./request.js');
const { currentEnv } = require('../config/api.js');

/**
 * 收藏车辆
 * @param {number} carId 车辆ID
 * @returns {Promise} 返回操作结果
 */
function favorCar(carId) {
    console.log('收藏车辆请求:', { carId });

    return request
        .post(
            '/api/mp/car/favor-car',
            {
                carId: carId
            },
            {
                showLoading: false,
                loadingTitle: '收藏中...',
                showErrorToast: true
            }
        )
        .then((response) => {
            console.log('收藏车辆成功:', response);
            return {
                success: true,
                data: response
            };
        })
        .catch((error) => {
            console.error('收藏车辆失败:', error);
            throw {
                success: false,
                error: error,
                message: error.userMessage || error.message || '收藏失败'
            };
        });
}

/**
 * 取消收藏车辆
 * @param {number} carId 车辆ID
 * @returns {Promise} 返回操作结果
 */
function cancelFavorCar(carId) {
    console.log('取消收藏车辆请求:', { carId });

    return request
        .post(
            '/api/mp/car/cancel-favor-car',
            {
                carId: carId
            },
            {
                showLoading: false,
                loadingTitle: '取消收藏中...',
                showErrorToast: true
            }
        )
        .then((response) => {
            console.log('取消收藏车辆成功:', response);
            return {
                success: true,
                data: response
            };
        })
        .catch((error) => {
            console.error('取消收藏车辆失败:', error);
            throw {
                success: false,
                error: error,
                message: error.userMessage || error.message || '取消收藏失败'
            };
        });
}

/**
 * 获取车辆详情
 * @param {number} carId 车辆ID
 * @returns {Promise} 返回车辆详情数据
 */
function getCarDetail(carId) {
    console.log('获取车辆详情请求:', { carId });

    return request
        .get(
            '/api/mp/car/query-car-detail',
            {
                carId: carId
            },
            {
                showLoading: true,
                loadingTitle: '加载中...',
                showErrorToast: true
            }
        )
        .then((response) => {
            console.log('获取车辆详情成功:', response);
            return {
                success: true,
                data: response
            };
        })
        .catch((error) => {
            console.error('获取车辆详情失败:', error);
            throw {
                success: false,
                error: error,
                message: error.userMessage || error.message || '获取详情失败'
            };
        });
}

/**
 * 更新车辆收藏状态
 * @param {number} carId 车辆ID
 * @param {boolean} isFavorited 是否收藏（true-收藏，false-取消收藏）
 * @returns {Promise} 返回操作结果
 */
function updateFavoriteStatus(carId, isFavorited) {
    console.log('更新车辆收藏状态:', { carId, isFavorited });

    if (isFavorited) {
        return favorCar(carId);
    } else {
        return cancelFavorCar(carId);
    }
}

module.exports = {
    getCarDetail,
    favorCar,
    cancelFavorCar,
    updateFavoriteStatus
};
