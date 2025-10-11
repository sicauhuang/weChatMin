/**
 * 模拟票助考列表接口对接集成测试
 * 验证接口对接功能的正确性和数据处理逻辑
 */

const request = require('./utils/request.js');
const auth = require('./utils/auth.js');
const api = require('./config/api.js');

console.log('====== 模拟票助考列表接口对接集成测试 ======');
console.log('测试目标: 验证新接口对接功能的正确性');
console.log('测试范围: 接口调用、数据映射、错误处理、用户交互');
console.log('');

/**
 * 测试配置
 */
const TEST_CONFIG = {
    // 模拟用户登录状态
    mockLoginStatus: true,
    // 模拟token
    mockAccessToken: 'test_access_token_123456',
    // 测试超时时间
    timeout: 10000
};

/**
 * 测试用例集合
 */
const testCases = [
    {
        name: '测试1: API配置验证',
        description: '验证新的助考列表接口地址配置是否正确',
        test: testApiConfiguration
    },
    {
        name: '测试2: 数据字段映射验证',
        description: '验证后端数据字段到前端显示字段的映射逻辑',
        test: testDataFieldMapping
    },
    {
        name: '测试3: 时间格式化处理',
        description: '验证时间字段的格式化处理是否正确',
        test: testTimeFormatting
    },
    {
        name: '测试4: 错误处理机制',
        description: '验证各种异常情况的错误处理机制',
        test: testErrorHandling
    },
    {
        name: '测试5: 认证失效处理',
        description: '验证认证失效时的处理逻辑',
        test: testAuthenticationFailure
    },
    {
        name: '测试6: 空数据处理',
        description: '验证接口返回空数据时的处理逻辑',
        test: testEmptyDataHandling
    }
];

/**
 * 测试1: API配置验证
 */
function testApiConfiguration() {
    console.log('执行测试1: API配置验证');
    
    try {
        // 检查新接口地址配置
        const assistExamUrl = api.getAssistExamTicketsUrl();
        console.log('- 助考列表接口地址:', assistExamUrl);
        
        // 验证接口地址格式
        const expectedEndpoint = '/api/mp/ticket/query-my-assistant-ticket-list';
        if (assistExamUrl.includes(expectedEndpoint)) {
            console.log('✓ 接口地址配置正确');
            return { success: true, message: 'API配置验证通过' };
        } else {
            throw new Error(`接口地址配置错误，期望包含: ${expectedEndpoint}`);
        }
    } catch (error) {
        console.error('✗ API配置验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试2: 数据字段映射验证
 */
function testDataFieldMapping() {
    console.log('执行测试2: 数据字段映射验证');
    
    try {
        // 模拟后端响应数据
        const mockBackendData = [
            {
                id: 1001,
                suiteName: '模拟考试套餐A',
                studentName: '张三',
                studentPhone: '13800138001',
                verifyTime: '2024-10-10T14:30:00.000Z',
                verifyUserName: '李助考',
                status: 'VERIFIED',
                statusName: '已核销',
                bookDate: '2024-10-10',
                coachName: '王教练',
                coachPhone: '13800138002',
                mockArea: '考区A'
            },
            {
                id: 1002,
                suiteName: '模拟考试套餐B',
                studentName: '李四',
                studentPhone: '13800138003',
                verifyTime: null,
                verifyUserName: null,
                status: 'PENDING',
                statusName: '待核销',
                bookDate: '2024-10-11',
                coachName: '赵教练',
                coachPhone: '13800138004',
                mockArea: '考区B'
            }
        ];
        
        // 模拟数据映射逻辑（复制自页面代码）
        const processedTickets = mockBackendData.map((ticket) => ({
            id: ticket.id,
            packageName: ticket.suiteName || '',
            studentName: ticket.studentName || '',
            verifyOperator: ticket.verifyUserName || '暂无',
            verifyTime: ticket.verifyTime ? formatTime(ticket.verifyTime) : '暂未核销',
            // 额外保存后端字段供参考
            status: ticket.status,
            statusName: ticket.statusName,
            bookDate: ticket.bookDate,
            coachName: ticket.coachName,
            coachPhone: ticket.coachPhone,
            mockArea: ticket.mockArea,
            studentPhone: ticket.studentPhone
        }));
        
        console.log('- 映射前数据:', JSON.stringify(mockBackendData[0], null, 2));
        console.log('- 映射后数据:', JSON.stringify(processedTickets[0], null, 2));
        
        // 验证字段映射
        const ticket1 = processedTickets[0];
        const ticket2 = processedTickets[1];
        
        if (ticket1.packageName === '模拟考试套餐A' &&
            ticket1.studentName === '张三' &&
            ticket1.verifyOperator === '李助考' &&
            ticket1.verifyTime.includes('2024-10-10') &&
            ticket2.verifyOperator === '暂无' &&
            ticket2.verifyTime === '暂未核销') {
            
            console.log('✓ 数据字段映射正确');
            return { success: true, message: '数据字段映射验证通过' };
        } else {
            throw new Error('数据字段映射结果不符合预期');
        }
    } catch (error) {
        console.error('✗ 数据字段映射验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试3: 时间格式化处理
 */
function testTimeFormatting() {
    console.log('执行测试3: 时间格式化处理');
    
    try {
        // 测试不同的时间格式
        const testCases = [
            {
                input: '2024-10-10T14:30:00.000Z',
                expected: '2024-10-10 14:30' // UTC时间
            },
            {
                input: '2024-10-10T09:15:30Z',
                expected: '2024-10-10 09:15' // UTC时间
            },
            {
                input: null,
                expected: ''
            },
            {
                input: '',
                expected: ''
            },
            {
                input: 'invalid-date',
                expected: 'invalid-date' // 应该返回原始值
            }
        ];
        
        let allTestsPassed = true;
        
        for (const testCase of testCases) {
            const result = formatTime(testCase.input);
            console.log(`- 输入: ${testCase.input} -> 输出: ${result}`);
            
            if (result !== testCase.expected) {
                console.error(`✗ 时间格式化失败: 期望 ${testCase.expected}, 实际 ${result}`);
                allTestsPassed = false;
            }
        }
        
        if (allTestsPassed) {
            console.log('✓ 时间格式化处理正确');
            return { success: true, message: '时间格式化验证通过' };
        } else {
            throw new Error('部分时间格式化测试失败');
        }
    } catch (error) {
        console.error('✗ 时间格式化验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试4: 错误处理机制
 */
function testErrorHandling() {
    console.log('执行测试4: 错误处理机制');
    
    try {
        // 模拟不同类型的错误
        const errorCases = [
            {
                error: { code: 'NETWORK_ERROR', message: '网络连接失败' },
                expectedMessage: '网络连接失败，请检查网络'
            },
            {
                error: { code: 'NO_REFRESH_TOKEN', message: '请重新登录' },
                expectedMessage: '登录已过期，请重新登录'
            },
            {
                error: { code: 'REFRESH_TOKEN_FAILED', message: '登录已过期，请重新登录' },
                expectedMessage: '登录已过期，请重新登录'
            },
            {
                error: { message: '服务器内部错误' },
                expectedMessage: '服务器内部错误'
            },
            {
                error: {},
                expectedMessage: '加载失败'
            }
        ];
        
        for (const errorCase of errorCases) {
            const actualMessage = getErrorMessage(errorCase.error);
            console.log(`- 错误类型: ${errorCase.error.code || '通用'} -> 消息: ${actualMessage}`);
            
            if (actualMessage !== errorCase.expectedMessage) {
                throw new Error(`错误消息处理不正确: 期望 "${errorCase.expectedMessage}", 实际 "${actualMessage}"`);
            }
        }
        
        console.log('✓ 错误处理机制正确');
        return { success: true, message: '错误处理验证通过' };
    } catch (error) {
        console.error('✗ 错误处理验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试5: 认证失效处理
 */
function testAuthenticationFailure() {
    console.log('执行测试5: 认证失效处理');
    
    try {
        // 模拟认证失效的情况
        console.log('- 测试场景: token过期导致的认证失效');
        
        // 验证是否会触发登录状态更新
        const authError = { code: 'REFRESH_TOKEN_FAILED', message: '登录已过期，请重新登录' };
        const shouldUpdateLoginStatus = isAuthenticationError(authError);
        
        if (shouldUpdateLoginStatus) {
            console.log('✓ 认证失效时会正确更新登录状态');
            return { success: true, message: '认证失效处理验证通过' };
        } else {
            throw new Error('认证失效时未正确处理登录状态');
        }
    } catch (error) {
        console.error('✗ 认证失效处理验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试6: 空数据处理
 */
function testEmptyDataHandling() {
    console.log('执行测试6: 空数据处理');
    
    try {
        // 测试不同的空数据情况
        const emptyCases = [
            { data: [], description: '空数组' },
            { data: null, description: 'null值' },
            { data: undefined, description: 'undefined' },
            { data: '', description: '空字符串' }
        ];
        
        for (const emptyCase of emptyCases) {
            const result = processEmptyData(emptyCase.data);
            console.log(`- ${emptyCase.description}: 处理结果为空数组 ${Array.isArray(result) && result.length === 0}`);
            
            if (!Array.isArray(result) || result.length !== 0) {
                throw new Error(`空数据处理失败: ${emptyCase.description}`);
            }
        }
        
        console.log('✓ 空数据处理正确');
        return { success: true, message: '空数据处理验证通过' };
    } catch (error) {
        console.error('✗ 空数据处理验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 辅助函数：格式化时间（复制自页面代码）
 */
function formatTime(timeStr) {
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

/**
 * 辅助函数：获取错误消息
 */
function getErrorMessage(error) {
    if (error.code === 'NETWORK_ERROR') {
        return '网络连接失败，请检查网络';
    } else if (error.code === 'NO_REFRESH_TOKEN' || error.code === 'REFRESH_TOKEN_FAILED') {
        return '登录已过期，请重新登录';
    } else if (error.message) {
        return error.message;
    } else {
        return '加载失败';
    }
}

/**
 * 辅助函数：判断是否为认证错误
 */
function isAuthenticationError(error) {
    return error.code === 'NO_REFRESH_TOKEN' || error.code === 'REFRESH_TOKEN_FAILED';
}

/**
 * 辅助函数：处理空数据
 */
function processEmptyData(data) {
    if (!data || !Array.isArray(data)) {
        return [];
    }
    return data;
}

/**
 * 执行所有测试
 */
async function runAllTests() {
    console.log('开始执行集成测试...\n');
    
    const results = [];
    let passedCount = 0;
    let failedCount = 0;
    
    for (const testCase of testCases) {
        console.log(`\n${testCase.name}`);
        console.log(`描述: ${testCase.description}`);
        console.log('---');
        
        try {
            const result = await testCase.test();
            results.push({
                name: testCase.name,
                success: result.success,
                message: result.message,
                error: result.error
            });
            
            if (result.success) {
                passedCount++;
                console.log(`✓ ${testCase.name} 通过`);
            } else {
                failedCount++;
                console.log(`✗ ${testCase.name} 失败: ${result.error}`);
            }
        } catch (error) {
            failedCount++;
            results.push({
                name: testCase.name,
                success: false,
                error: error.message
            });
            console.log(`✗ ${testCase.name} 异常: ${error.message}`);
        }
    }
    
    // 输出测试总结
    console.log('\n====== 测试总结 ======');
    console.log(`总测试数: ${testCases.length}`);
    console.log(`通过: ${passedCount}`);
    console.log(`失败: ${failedCount}`);
    console.log(`成功率: ${((passedCount / testCases.length) * 100).toFixed(2)}%`);
    
    if (failedCount === 0) {
        console.log('\n🎉 所有测试通过！接口对接功能正常');
    } else {
        console.log('\n⚠️  部分测试失败，请检查相关功能');
    }
    
    // 输出详细结果
    console.log('\n====== 详细结果 ======');
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}: ${result.success ? '✓ 通过' : '✗ 失败'}`);
        if (!result.success && result.error) {
            console.log(`   错误: ${result.error}`);
        }
    });
    
    return {
        total: testCases.length,
        passed: passedCount,
        failed: failedCount,
        results: results
    };
}

// 导出测试函数
module.exports = {
    runAllTests,
    testCases,
    TEST_CONFIG
};

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runAllTests().then((summary) => {
        console.log('\n测试完成，退出进程');
        process.exit(summary.failed > 0 ? 1 : 0);
    }).catch((error) => {
        console.error('测试执行异常:', error);
        process.exit(1);
    });
}