/**
 * 登出功能单元测试
 * 测试各种登出场景和错误处理
 */

const auth = require('./utils/auth.js');
const storage = require('./utils/storage.js');
const request = require('./utils/request.js');

// 模拟微信API
const mockStorage = {};

global.wx = {
    showLoading: (options) => {
        console.log('显示加载提示:', options.title);
    },
    hideLoading: () => {
        console.log('隐藏加载提示');
    },
    showToast: (options) => {
        console.log('显示Toast:', options.title, options.icon);
    },
    navigateTo: (options) => {
        console.log('页面跳转:', options.url);
        if (options.success) options.success();
    },
    redirectTo: (options) => {
        console.log('页面重定向:', options.url);
        if (options.success) options.success();
    },
    setStorageSync: (key, value) => {
        mockStorage[key] = value;
        console.log(`存储数据: ${key} = ${JSON.stringify(value)}`);
    },
    getStorageSync: (key) => {
        const value = mockStorage[key];
        return value !== undefined ? value : '';
    },
    removeStorageSync: (key) => {
        delete mockStorage[key];
        console.log(`删除存储数据: ${key}`);
    },
    clearStorageSync: () => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        console.log('清空所有存储数据');
    }
};

/**
 * 模拟请求成功的场景
 */
function mockRequestSuccess() {
    const originalPost = request.post;
    request.post = async (url, data, options) => {
        console.log('模拟请求成功:', url);
        return {
            code: '200',
            data: null,
            message: '登出成功'
        };
    };
    return () => { request.post = originalPost; };
}

/**
 * 模拟请求失败的场景
 */
function mockRequestError(errorType = 'network') {
    const originalPost = request.post;
    request.post = async (url, data, options) => {
        console.log('模拟请求失败:', url, errorType);
        if (errorType === 'network') {
            throw new Error('网络请求失败');
        } else if (errorType === 'business') {
            return {
                code: '500',
                message: '服务器内部错误'
            };
        } else if (errorType === 'auth') {
            const error = new Error('认证失败');
            error.code = 401;
            throw error;
        }
    };
    return () => { request.post = originalPost; };
}

/**
 * 设置测试环境 - 已登录状态
 */
function setupLoggedInState() {
    storage.setAccessToken('test_access_token_123456789');
    storage.setRefreshToken('test_refresh_token_123456789');
    storage.setLoginStatus(true);
    storage.setUserInfo({
        userId: 'test_user_123',
        phoneNumber: '13800138000',
        name: '测试用户'
    });
    console.log('设置为已登录状态');
}

/**
 * 设置测试环境 - 未登录状态
 */
function setupLoggedOutState() {
    storage.logout();
    console.log('设置为未登录状态');
}

/**
 * 验证登出后的状态
 */
function verifyLoggedOutState() {
    const isLoggedIn = storage.isLoggedIn();
    const accessToken = storage.getAccessToken();
    const refreshToken = storage.getRefreshToken();
    const userInfo = storage.getUserInfo();
    
    console.log('验证登出状态:');
    console.log('- isLoggedIn:', isLoggedIn);
    console.log('- accessToken:', accessToken);
    console.log('- refreshToken:', refreshToken);
    console.log('- userInfo:', userInfo);
    
    return !isLoggedIn && !accessToken && !refreshToken && !userInfo;
}

/**
 * 测试用例：正常登出流程
 */
async function testNormalLogout() {
    console.log('\n=== 测试用例：正常登出流程 ===');
    
    // 设置已登录状态
    setupLoggedInState();
    
    // 模拟请求成功
    const restoreRequest = mockRequestSuccess();
    
    try {
        // 执行登出
        const result = await auth.logout();
        
        console.log('登出结果:', result);
        
        // 验证结果
        if (result.success && verifyLoggedOutState()) {
            console.log('✅ 正常登出流程测试通过');
            return true;
        } else {
            console.log('❌ 正常登出流程测试失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 正常登出流程测试异常:', error);
        return false;
    } finally {
        restoreRequest();
    }
}

/**
 * 测试用例：服务端登出失败但本地清理成功
 */
async function testServerLogoutFailure() {
    console.log('\n=== 测试用例：服务端登出失败但本地清理成功 ===');
    
    // 设置已登录状态
    setupLoggedInState();
    
    // 模拟网络请求失败
    const restoreRequest = mockRequestError('network');
    
    try {
        // 执行登出
        const result = await auth.logout();
        
        console.log('登出结果:', result);
        
        // 验证结果 - 即使服务端失败，本地应该清理成功
        if (result.success && verifyLoggedOutState()) {
            console.log('✅ 服务端登出失败但本地清理成功测试通过');
            return true;
        } else {
            console.log('❌ 服务端登出失败但本地清理成功测试失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 服务端登出失败测试异常:', error);
        return false;
    } finally {
        restoreRequest();
    }
}

/**
 * 测试用例：未登录状态下的登出
 */
async function testLogoutWhenNotLoggedIn() {
    console.log('\n=== 测试用例：未登录状态下的登出 ===');
    
    // 设置未登录状态
    setupLoggedOutState();
    
    try {
        // 执行登出
        const result = await auth.logout();
        
        console.log('登出结果:', result);
        
        // 验证结果 - 应该成功但不调用服务端接口
        if (result.success) {
            console.log('✅ 未登录状态下的登出测试通过');
            return true;
        } else {
            console.log('❌ 未登录状态下的登出测试失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 未登录状态下的登出测试异常:', error);
        return false;
    }
}

/**
 * 测试用例：跳过服务端登出的本地登出
 */
async function testLocalOnlyLogout() {
    console.log('\n=== 测试用例：跳过服务端登出的本地登出 ===');
    
    // 设置已登录状态
    setupLoggedInState();
    
    try {
        // 执行仅本地登出
        const result = await auth.logout({ serverLogout: false });
        
        console.log('登出结果:', result);
        
        // 验证结果
        if (result.success && verifyLoggedOutState()) {
            console.log('✅ 跳过服务端登出的本地登出测试通过');
            return true;
        } else {
            console.log('❌ 跳过服务端登出的本地登出测试失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 跳过服务端登出的本地登出测试异常:', error);
        return false;
    }
}

/**
 * 测试用例：带页面跳转的登出
 */
async function testLogoutWithRedirect() {
    console.log('\n=== 测试用例：带页面跳转的登出 ===');
    
    // 设置已登录状态
    setupLoggedInState();
    
    // 模拟请求成功
    const restoreRequest = mockRequestSuccess();
    
    try {
        // 执行带跳转的登出
        const result = await auth.logout({ 
            redirectTo: '/pages/login/login' 
        });
        
        console.log('登出结果:', result);
        
        // 验证结果
        if (result.success && verifyLoggedOutState()) {
            console.log('✅ 带页面跳转的登出测试通过');
            return true;
        } else {
            console.log('❌ 带页面跳转的登出测试失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 带页面跳转的登出测试异常:', error);
        return false;
    } finally {
        restoreRequest();
    }
}

/**
 * 测试用例：服务端认证失败的登出
 */
async function testLogoutWithAuthError() {
    console.log('\n=== 测试用例：服务端认证失败的登出 ===');
    
    // 设置已登录状态
    setupLoggedInState();
    
    // 模拟认证失败
    const restoreRequest = mockRequestError('auth');
    
    try {
        // 执行登出
        const result = await auth.logout();
        
        console.log('登出结果:', result);
        
        // 验证结果 - 即使认证失败，本地应该清理成功
        if (result.success && verifyLoggedOutState()) {
            console.log('✅ 服务端认证失败的登出测试通过');
            return true;
        } else {
            console.log('❌ 服务端认证失败的登出测试失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 服务端认证失败的登出测试异常:', error);
        return false;
    } finally {
        restoreRequest();
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('开始运行登出功能测试...\n');
    
    const tests = [
        { name: '正常登出流程', fn: testNormalLogout },
        { name: '服务端登出失败', fn: testServerLogoutFailure },
        { name: '未登录状态下的登出', fn: testLogoutWhenNotLoggedIn },
        { name: '跳过服务端登出', fn: testLocalOnlyLogout },
        { name: '带页面跳转的登出', fn: testLogoutWithRedirect },
        { name: '服务端认证失败的登出', fn: testLogoutWithAuthError }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passedTests++;
            }
        } catch (error) {
            console.error(`测试 "${test.name}" 执行异常:`, error);
        }
    }
    
    console.log(`\n=== 测试总结 ===`);
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${totalTests - passedTests}`);
    console.log(`通过率: ${(passedTests / totalTests * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！');
        return true;
    } else {
        console.log('❌ 部分测试失败，请检查实现');
        return false;
    }
}

// 导出测试函数
module.exports = {
    runAllTests,
    testNormalLogout,
    testServerLogoutFailure,
    testLogoutWhenNotLoggedIn,
    testLocalOnlyLogout,
    testLogoutWithRedirect,
    testLogoutWithAuthError
};

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
    runAllTests().then(() => {
        console.log('测试完成');
    }).catch((error) => {
        console.error('测试执行出错:', error);
    });
}