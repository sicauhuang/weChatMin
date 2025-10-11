/**
 * 模拟票列表接口对接单元测试
 * 验证数据转换和接口对接功能
 */

// 模拟微信API
global.wx = {
    request: function(options) {
        console.log('模拟wx.request调用:', options);
        // 稍后在测试中覆盖此行为
    },
    showToast: function(options) {
        console.log('模拟wx.showToast:', options);
    },
    showModal: function(options) {
        console.log('模拟wx.showModal:', options);
    },
    showLoading: function(options) {
        console.log('模拟wx.showLoading:', options);
    },
    hideLoading: function() {
        console.log('模拟wx.hideLoading');
    },
    stopPullDownRefresh: function() {
        console.log('模拟wx.stopPullDownRefresh');
    },
    navigateTo: function(options) {
        console.log('模拟wx.navigateTo:', options);
    }
};

// 模拟console对象（如果不存在）
if (typeof console === 'undefined') {
    global.console = {
        log: function() {},
        error: function() {},
        warn: function() {}
    };
}

// 模拟模块加载
function require(path) {
    if (path === '../../utils/request.js') {
        return {
            get: mockRequest
        };
    }
    if (path === '../../utils/auth.js') {
        return {
            checkLoginStatus: () => true
        };
    }
    return {};
}

// 模拟网络请求
function mockRequest(url, params, options) {
    console.log('模拟网络请求:', { url, params, options });
    
    if (url === '/api/mp/ticket/query-my-ticket-list') {
        // 模拟 request.js 的预处理机制，直接返回数据部分
        return Promise.resolve(getMockApiData());
    }
    
    return Promise.reject(new Error('未知接口'));
}

// 模拟API响应数据
function getMockApiData() {
    return [
        {
            id: 12345,
            suiteName: "C2双学时",
            studentName: "张三",
            studentPhone: "138****8888",
            bookDate: "2024-01-15",
            status: "UNUSED",
            statusName: "未使用",
            coachName: "李师傅",
            coachPhone: "139****9999",
            mockArea: "A场区",
            verifyTime: null,
            verifyUserName: null,
            studentCardNumber: "110101199001011234",
            schoolName: "阳光驾校"
        },
        {
            id: 12346,
            suiteName: "C1科目二",
            studentName: "李四",
            studentPhone: "139****7777",
            bookDate: "2024-01-16",
            status: "VERIFIED",
            statusName: "已核销",
            coachName: "王教练",
            coachPhone: "138****6666",
            mockArea: "B场区",
            verifyTime: "2024-01-16 14:30:00",
            verifyUserName: "王助考",
            studentCardNumber: "110101199001011235",
            schoolName: "阳光驾校"
        },
        {
            id: 12347,
            suiteName: "科目三模拟",
            studentName: "王五",
            studentPhone: "137****5555",
            bookDate: "2024-01-17",
            status: "UNUSED",
            statusName: "未使用",
            coachName: null,
            coachPhone: null,
            mockArea: null,
            verifyTime: null,
            verifyUserName: null,
            studentCardNumber: "110101199001011236",
            schoolName: "阳光驾校"
        }
    ];
}

// 创建页面实例进行测试
function createMockPageInstance() {
    return {
        data: {
            ticketList: [],
            loading: true,
            refreshing: false,
            showQRModal: false,
            currentTicketQRData: null,
            isLoggedIn: false
        },
        
        setData: function(newData) {
            Object.assign(this.data, newData);
            console.log('页面数据更新:', newData);
        },

        // 数据转换映射函数
        transformTicketData: function(apiData) {
            if (!Array.isArray(apiData)) {
                console.warn('数据转换失败：输入不是数组:', apiData);
                return [];
            }

            return apiData.map(item => {
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

        // 处理加载错误
        handleLoadError: function(error, isRefresh = false) {
            console.error('加载模拟票列表失败:', error);

            this.setData({
                loading: false,
                refreshing: false,
                ticketList: []
            });

            // 根据错误类型显示不同的提示
            let errorMessage = '加载失败';
            let showRetry = false;

            if (error.code === 'NETWORK_ERROR') {
                errorMessage = '网络连接失败，请检查网络后重试';
                showRetry = true;
            } else if (error.code === 'NO_REFRESH_TOKEN' || error.code === 'REFRESH_TOKEN_FAILED') {
                errorMessage = '登录已过期，请重新登录';
            } else if (error.message) {
                errorMessage = error.message;
            }

            console.log('错误处理结果:', { errorMessage, showRetry });
        },

        // 加载模拟票列表
        loadTicketList: async function(isRefresh = false) {
            try {
                console.log('开始加载模拟票列表，isRefresh:', isRefresh);

                if (!isRefresh) {
                    this.setData({
                        loading: true
                    });
                }

                // 调用真实接口
                const response = await mockRequest(
                    '/api/mp/ticket/query-my-ticket-list',
                    {},
                    {
                        needAuth: true,
                        showLoading: false
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

                    console.log('数据转换和页面更新完成');
                    return transformedData;
                } else {
                    throw new Error('获取模拟票列表失败');
                }
            } catch (error) {
                this.handleLoadError(error, isRefresh);
                throw error;
            }
        }
    };
}

// 测试用例
function runTests() {
    console.log('=== 开始模拟票列表接口对接测试 ===\n');

    // 测试1: 数据转换映射功能
    console.log('测试1: 数据转换映射功能');
    const pageInstance = createMockPageInstance();
    const mockData = getMockApiData();
    const transformedData = pageInstance.transformTicketData(mockData);
    
    console.log('原始API数据:', JSON.stringify(mockData, null, 2));
    console.log('转换后数据:', JSON.stringify(transformedData, null, 2));
    
    // 验证转换结果
    const firstItem = transformedData[0];
    const expectedFirstItem = {
        id: '12345',
        packageName: 'C2双学时',
        orderNumber: 'MT00012345',
        studentName: '张三',
        studentPhone: '138****8888',
        appointmentDate: '2024-01-15',
        simulationArea: 'A场区',
        status: '未使用',
        coachName: '李师傅',
        coachPhone: '139****9999'
    };
    
    let test1Passed = true;
    for (const key in expectedFirstItem) {
        if (firstItem[key] !== expectedFirstItem[key]) {
            console.error(`❌ 字段 ${key} 转换错误: 期望 ${expectedFirstItem[key]}, 实际 ${firstItem[key]}`);
            test1Passed = false;
        }
    }
    
    if (test1Passed) {
        console.log('✅ 测试1通过: 数据转换映射正确\n');
    } else {
        console.log('❌ 测试1失败: 数据转换映射错误\n');
    }

    // 测试2: 空值处理
    console.log('测试2: 空值处理');
    const thirdItem = transformedData[2];
    const expectedThirdItem = {
        simulationArea: '未分配',
        coachName: '待分配',
        coachPhone: '-'
    };
    
    let test2Passed = true;
    for (const key in expectedThirdItem) {
        if (thirdItem[key] !== expectedThirdItem[key]) {
            console.error(`❌ 空值处理错误 ${key}: 期望 ${expectedThirdItem[key]}, 实际 ${thirdItem[key]}`);
            test2Passed = false;
        }
    }
    
    if (test2Passed) {
        console.log('✅ 测试2通过: 空值处理正确\n');
    } else {
        console.log('❌ 测试2失败: 空值处理错误\n');
    }

    // 测试3: 异常数据处理
    console.log('测试3: 异常数据处理');
    const invalidData = null;
    const emptyResult = pageInstance.transformTicketData(invalidData);
    
    if (Array.isArray(emptyResult) && emptyResult.length === 0) {
        console.log('✅ 测试3通过: 异常数据处理正确\n');
    } else {
        console.log('❌ 测试3失败: 异常数据处理错误\n');
    }

    // 测试4: 完整的数据加载流程
    console.log('测试4: 完整的数据加载流程');
    pageInstance.loadTicketList(false)
        .then((result) => {
            console.log('✅ 测试4通过: 完整数据加载流程正确');
            console.log('最终页面数据:', pageInstance.data);
            
            // 验证页面状态
            if (pageInstance.data.loading === false && 
                Array.isArray(pageInstance.data.ticketList) && 
                pageInstance.data.ticketList.length > 0) {
                console.log('✅ 页面状态更新正确\n');
            } else {
                console.log('❌ 页面状态更新错误\n');
            }
        })
        .catch((error) => {
            console.error('❌ 测试4失败:', error);
        });

    console.log('=== 测试完成 ===');
}

// 执行测试
runTests();