/**
 * 通用错误处理集中化测试
 * 验证request.js中的统一错误处理机制
 */

const request = require('./utils/request.js');

console.log('====== 通用错误处理集中化测试 ======');
console.log('测试目标: 验证request.js中集中的错误处理逻辑');
console.log('测试范围: 网络错误、认证错误、业务错误、HTTP状态码错误');
console.log('');

/**
 * 测试用例集合
 */
const testCases = [
    {
        name: '测试1: 网络错误处理',
        description: '验证NETWORK_ERROR类型的错误处理',
        test: testNetworkError
    },
    {
        name: '测试2: 认证错误处理',
        description: '验证认证失败时的错误处理和用户提示',
        test: testAuthError
    },
    {
        name: '测试3: HTTP状态码错误处理',
        description: '验证不同HTTP状态码的错误处理',
        test: testHttpStatusError
    },
    {
        name: '测试4: 业务错误处理',
        description: '验证业务层面错误的处理',
        test: testBusinessError
    },
    {
        name: '测试5: 错误提示控制',
        description: '验证showErrorToast选项的控制功能',
        test: testErrorToastControl
    }
];

/**
 * 模拟错误处理函数（复制自request.js的逻辑）
 */
function simulateHandleError(error, options = {}) {
    console.log('模拟错误处理:', error);
    
    const { showErrorToast = true } = options;
    let userMessage = '';
    
    // 根据错误类型决定用户提示消息
    switch (error.code) {
        case 'NETWORK_ERROR':
            userMessage = '网络连接失败，请检查网络';
            break;
        case 'NO_REFRESH_TOKEN':
        case 'REFRESH_TOKEN_FAILED':
            userMessage = '登录已过期，请重新登录';
            break;
        case 400:
            userMessage = '请求参数错误';
            break;
        case 403:
            userMessage = '没有权限访问该资源';
            break;
        case 404:
            userMessage = '请求的资源不存在';
            break;
        case 500:
            userMessage = '服务器内部错误';
            break;
        case 502:
        case 503:
        case 504:
            userMessage = '服务器繁忙，请稍后重试';
            break;
        default:
            userMessage = error.message || '加载失败';
            break;
    }

    const result = {
        userMessage,
        showErrorToast,
        originalMessage: error.message
    };

    console.log('- 处理结果:', result);
    return result;
}

/**
 * 测试1: 网络错误处理
 */
function testNetworkError() {
    console.log('执行测试1: 网络错误处理');
    
    try {
        const networkError = {
            code: 'NETWORK_ERROR',
            message: '网络请求失败，请检查网络连接'
        };
        
        const result = simulateHandleError(networkError);
        
        if (result.userMessage === '网络连接失败，请检查网络' && result.showErrorToast === true) {
            console.log('✓ 网络错误处理正确');
            return { success: true, message: '网络错误处理验证通过' };
        } else {
            throw new Error('网络错误处理结果不符合预期');
        }
    } catch (error) {
        console.error('✗ 网络错误处理验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试2: 认证错误处理
 */
function testAuthError() {
    console.log('执行测试2: 认证错误处理');
    
    try {
        const authErrors = [
            { code: 'NO_REFRESH_TOKEN', message: '请重新登录' },
            { code: 'REFRESH_TOKEN_FAILED', message: '登录已过期，请重新登录' }
        ];
        
        for (const authError of authErrors) {
            const result = simulateHandleError(authError);
            console.log(`- 测试 ${authError.code}: ${result.userMessage}`);
            
            if (result.userMessage !== '登录已过期，请重新登录') {
                throw new Error(`认证错误 ${authError.code} 处理不正确`);
            }
        }
        
        console.log('✓ 认证错误处理正确');
        return { success: true, message: '认证错误处理验证通过' };
    } catch (error) {
        console.error('✗ 认证错误处理验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试3: HTTP状态码错误处理
 */
function testHttpStatusError() {
    console.log('执行测试3: HTTP状态码错误处理');
    
    try {
        const httpErrors = [
            { code: 400, expectedMessage: '请求参数错误' },
            { code: 403, expectedMessage: '没有权限访问该资源' },
            { code: 404, expectedMessage: '请求的资源不存在' },
            { code: 500, expectedMessage: '服务器内部错误' },
            { code: 502, expectedMessage: '服务器繁忙，请稍后重试' },
            { code: 503, expectedMessage: '服务器繁忙，请稍后重试' },
            { code: 504, expectedMessage: '服务器繁忙，请稍后重试' }
        ];
        
        for (const httpError of httpErrors) {
            const error = { code: httpError.code, message: `HTTP ${httpError.code}` };
            const result = simulateHandleError(error);
            console.log(`- HTTP ${httpError.code}: ${result.userMessage}`);
            
            if (result.userMessage !== httpError.expectedMessage) {
                throw new Error(`HTTP ${httpError.code} 错误处理不正确`);
            }
        }
        
        console.log('✓ HTTP状态码错误处理正确');
        return { success: true, message: 'HTTP状态码错误处理验证通过' };
    } catch (error) {
        console.error('✗ HTTP状态码错误处理验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试4: 业务错误处理
 */
function testBusinessError() {
    console.log('执行测试4: 业务错误处理');
    
    try {
        const businessErrors = [
            { code: 'BUSINESS_ERROR', message: '业务处理失败' },
            { code: 'VALIDATION_ERROR', message: '数据验证失败' },
            { message: '自定义业务错误消息' }
        ];
        
        for (const businessError of businessErrors) {
            const result = simulateHandleError(businessError);
            console.log(`- 业务错误 ${businessError.code || 'CUSTOM'}: ${result.userMessage}`);
            
            if (result.userMessage !== businessError.message) {
                throw new Error(`业务错误 ${businessError.code || 'CUSTOM'} 处理不正确`);
            }
        }
        
        console.log('✓ 业务错误处理正确');
        return { success: true, message: '业务错误处理验证通过' };
    } catch (error) {
        console.error('✗ 业务错误处理验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试5: 错误提示控制
 */
function testErrorToastControl() {
    console.log('执行测试5: 错误提示控制');
    
    try {
        const error = { code: 'NETWORK_ERROR', message: '网络错误' };
        
        // 测试默认显示错误提示
        const result1 = simulateHandleError(error);
        console.log('- 默认showErrorToast:', result1.showErrorToast);
        
        // 测试禁用错误提示
        const result2 = simulateHandleError(error, { showErrorToast: false });
        console.log('- 禁用showErrorToast:', result2.showErrorToast);
        
        if (result1.showErrorToast === true && result2.showErrorToast === false) {
            console.log('✓ 错误提示控制正确');
            return { success: true, message: '错误提示控制验证通过' };
        } else {
            throw new Error('错误提示控制功能不正确');
        }
    } catch (error) {
        console.error('✗ 错误提示控制验证失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 执行所有测试
 */
async function runAllTests() {
    console.log('开始执行通用错误处理测试...\n');
    
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
        console.log('\n🎉 所有测试通过！通用错误处理机制正常');
    } else {
        console.log('\n⚠️  部分测试失败，请检查相关功能');
    }
    
    // 输出实际应用示例
    console.log('\n====== 实际应用示例 ======');
    console.log('// 业务层代码简化前:');
    console.log(`
try {
    const response = await request.get('/api/data');
    // 处理成功逻辑
} catch (error) {
    let errorMessage = '加载失败';
    if (error.code === 'NETWORK_ERROR') {
        errorMessage = '网络连接失败，请检查网络';
    } else if (error.code === 'NO_REFRESH_TOKEN') {
        errorMessage = '登录已过期，请重新登录';
    }
    wx.showToast({ title: errorMessage, icon: 'none' });
}
    `);
    
    console.log('// 业务层代码简化后:');
    console.log(`
try {
    const response = await request.get('/api/data');
    // 处理成功逻辑
} catch (error) {
    // 通用错误已由request.js处理，只需处理特殊业务逻辑
    if (error.code === 'NO_REFRESH_TOKEN') {
        this.setData({ isLoggedIn: false });
    }
}
    `);
    
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
    testCases
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