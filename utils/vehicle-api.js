/**
 * 车源相关API接口
 */

const { get, post } = require('./request.js');

/**
 * 查询在售车辆列表
 * @param {Object} params 查询参数
 * @param {string} params.keyword 关键词搜索（名称、品牌、车系、款式）
 * @param {number} params.pageNum 页码，从1开始
 * @param {number} params.pageSize 每页数量，默认50条
 * @param {string} params.sortType 排序方式：LATEST_PUBLISHED-最新上架，LOWEST_PRICE-价格最低，HIGHEST_PRICE-价格最高，SHORTEST_AGE-车龄最短，SMART-智能排序
 * @param {string} params.brand 品牌筛选
 * @param {string} params.series 车系筛选
 * @param {string} params.variant 款式筛选
 * @param {number} params.startAge 车龄范围筛选-开始年龄，单位：年
 * @param {number} params.endAge 车龄范围筛选-结束年龄，单位：年
 * @param {number} params.startPrice 价格范围筛选-开始价格，单位：万元
 * @param {number} params.endPrice 价格范围筛选-结束价格，单位：万元
 * @param {number|null} params.baseId 基准ID，防止分页重复数据。第一页传null，后续页传第一页返回的baseId
 * @returns {Promise} 车辆列表数据
 */
function queryOnSaleCarPage(params = {}) {
    return post('/api/mp/car/query-on-sale-car-page', params, {
        showLoading: false,
        showErrorToast: true
    });
}

/**
 * 收藏车辆
 * @param {number} carId 车辆ID
 * @returns {Promise} 操作结果
 */
function favorCar(carId) {
    return post(
        '/api/mp/car/favor-car',
        { carId },
        {
            showLoading: false,
            showErrorToast: true
        }
    );
}

/**
 * 取消收藏车辆
 * @param {number} carId 车辆ID
 * @returns {Promise} 操作结果
 */
function cancelFavorCar(carId) {
    return post(
        '/api/mp/car/cancel-favor-car',
        { carId },
        {
            showLoading: false,
            showErrorToast: true
        }
    );
}

/**
 * 查询品牌下拉列表
 * 获取品牌、车系、车型的树形结构数据
 * @returns {Promise} 品牌树形数据列表
 */
function queryBrandDropdownList() {
    return get('/api/mp/car/query-brand-dropdown-list', {}, {
        showLoading: false,
        showErrorToast: true
    });
}

module.exports = {
    queryOnSaleCarPage,
    favorCar,
    cancelFavorCar,
    queryBrandDropdownList
};
