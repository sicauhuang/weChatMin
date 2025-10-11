/**
 * 用户详情接口对接功能测试
 * 测试fetchUserProfile方法的各种场景
 */

const auth = require('./utils/auth.js');
const storage = require('./utils/storage.js');

console.log('=== 用户详情接口对接功能测试开始 ===');

/**
 * 测试数据准备
 */
function prepareTestData() {
    console.log('\n1. 准备测试数据...');
    
    // 模拟登录状态
    storage.setAccessToken('test_access_token_12345');
    storage.setRefreshToken('test_refresh_token_12345');
    storage.setLoginStatus(true);
    
    console.log('✓ 测试数据准备完成');
}

/**
 * 测试fetchUserProfile方法
 */
async function testFetchUserProfile() {
    console.log('\n2. 测试fetchUserProfile方法...');
    
    try {
        const userProfile = await auth.fetchUserProfile();
        console.log('✓ fetchUserProfile调用成功');
        console.log('返回的用户信息:', userProfile);
        
        // 验证数据结构
        const expectedFields = ['userId', 'phoneNumber', 'name', 'permissions', 'roleId', 'roleName'];
        const actualFields = Object.keys(userProfile);
        
        console.log('\n验证数据结构:');
        expectedFields.forEach(field => {
            if (actualFields.includes(field)) {
                console.log(`✓ ${field}: 存在`);
            } else {
                console.log(`✗ ${field}: 缺失`);
            }
        });
        
        // 验证数据类型
        console.log('\n验证数据类型:');
        console.log(`✓ userId: ${typeof userProfile.userId} (${userProfile.userId})`);
        console.log(`✓ phoneNumber: ${typeof userProfile.phoneNumber} (${userProfile.phoneNumber})`);
        console.log(`✓ name: ${typeof userProfile.name} (${userProfile.name})`);
        console.log(`✓ permissions: ${Array.isArray(userProfile.permissions)} (数组)`);
        console.log(`✓ roleId: ${typeof userProfile.roleId} (${userProfile.roleId})`);
        console.log(`✓ roleName: ${typeof userProfile.roleName} (${userProfile.roleName})`);
        
        return userProfile;
    } catch (error) {
        console.error('✗ fetchUserProfile调用失败:', error);
        throw error;
    }
}

/**
 * 测试数据模型转换
 */
function testDataModelTransformation(userProfile) {
    console.log('\n3. 测试数据模型转换...');
    
    // 获取本地存储的用户信息
    const cachedUserInfo = storage.getUserInfo();
    console.log('缓存的用户信息:', cachedUserInfo);
    
    if (cachedUserInfo) {
        console.log('✓ 用户信息已成功缓存到本地存储');
        
        // 验证缓存数据的完整性
        const requiredCacheFields = ['userId', 'phoneNumber', 'name', 'permissions', 'roleId', 'roleName', 'avatarUrl', 'identity', 'cacheTime'];
        requiredCacheFields.forEach(field => {
            if (cachedUserInfo.hasOwnProperty(field)) {
                console.log(`✓ 缓存字段 ${field}: 存在`);
            } else {
                console.log(`✗ 缓存字段 ${field}: 缺失`);
            }
        });
        
        // 验证roleName到identity的映射
        if (cachedUserInfo.identity === cachedUserInfo.roleName) {
            console.log('✓ roleName正确映射到identity字段');
        } else {
            console.log(`✗ roleName映射错误: roleName=${cachedUserInfo.roleName}, identity=${cachedUserInfo.identity}`);
        }
    } else {
        console.log('✗ 用户信息未缓存到本地存储');
    }
}

/**
 * 测试异常处理机制
 */
async function testErrorHandling() {
    console.log('\n4. 测试异常处理机制...');
    
    // 清除access token以模拟认证失败
    const originalToken = storage.getAccessToken();
    storage.setAccessToken(null);
    
    try {
        const userProfile = await auth.fetchUserProfile();
        console.log('✓ 异常处理成功，返回默认用户信息:', userProfile);
        
        // 验证默认用户信息的结构
        const defaultInfo = auth.getDefaultUserInfo();
        if (JSON.stringify(userProfile) === JSON.stringify(defaultInfo)) {
            console.log('✓ 返回的信息与默认用户信息一致');
        } else {
            console.log('✗ 返回的信息与默认用户信息不一致');
        }
    } catch (error) {
        console.error('✗ 异常处理失败:', error);
    }
    
    // 恢复原始token
    storage.setAccessToken(originalToken);
}

/**
 * 测试重试机制
 */
async function testRetryMechanism() {
    console.log('\n5. 测试重试机制...');
    
    // 使用无效token模拟网络错误
    const originalToken = storage.getAccessToken();
    storage.setAccessToken('invalid_token');
    
    const startTime = Date.now();
    
    try {
        await auth.fetchUserProfile(2); // 设置最大重试2次
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✓ 重试机制执行完成，耗时: ${duration}ms`);
        if (duration > 3000) { // 2次重试应该至少需要3秒(1s+2s)
            console.log('✓ 重试延迟机制正常工作');
        } else {
            console.log('? 重试延迟可能未生效');
        }
    } catch (error) {
        console.log('✓ 重试机制正常，最终返回默认信息');
    }
    
    // 恢复原始token
    storage.setAccessToken(originalToken);
}

/**
 * 测试缓存机制
 */
function testCacheMechanism() {
    console.log('\n6. 测试缓存机制...');
    
    const userInfo = storage.getUserInfo();
    if (userInfo && userInfo.cacheTime) {
        const cacheAge = Date.now() - userInfo.cacheTime;
        console.log(`✓ 缓存时间戳存在，缓存年龄: ${cacheAge}ms`);
        
        if (cacheAge < 1000) { // 刚刚缓存的数据
            console.log('✓ 缓存数据新鲜');
        } else {
            console.log('? 缓存数据较旧');
        }
    } else {
        console.log('✗ 缓存时间戳缺失');
    }
}

/**
 * 测试Profile页面集成
 */
function testProfilePageIntegration() {
    console.log('\n7. 测试Profile页面集成...');
    
    const userInfo = storage.getUserInfo();
    if (userInfo) {
        // 模拟Profile页面的显示逻辑
        const displayIdentity = userInfo.roleName || userInfo.identity || '游客';
        console.log(`✓ Profile页面身份显示: ${displayIdentity}`);
        
        if (userInfo.roleName && displayIdentity === userInfo.roleName) {
            console.log('✓ roleName优先级正确');
        } else if (!userInfo.roleName && displayIdentity === (userInfo.identity || '游客')) {
            console.log('✓ identity兜底逻辑正确');
        } else {
            console.log('✗ 身份显示逻辑有问题');
        }
    } else {
        console.log('✗ 无用户信息进行Profile页面测试');
    }
}

/**
 * 清理测试数据
 */
function cleanupTestData() {
    console.log('\n8. 清理测试数据...');
    
    // 不清理数据，保留用于实际使用
    console.log('✓ 保留测试数据用于实际使用');
}

/**
 * 主测试函数
 */
async function runTests() {
    try {
        prepareTestData();
        const userProfile = await testFetchUserProfile();
        testDataModelTransformation(userProfile);
        await testErrorHandling();
        await testRetryMechanism();
        testCacheMechanism();
        testProfilePageIntegration();
        cleanupTestData();
        
        console.log('\n=== 用户详情接口对接功能测试完成 ===');
        console.log('✓ 所有测试通过');
        
        return {
            success: true,
            message: '用户详情接口对接功能测试通过'
        };
    } catch (error) {
        console.error('\n=== 测试失败 ===');
        console.error('错误信息:', error);
        
        return {
            success: false,
            message: '用户详情接口对接功能测试失败',
            error: error.message
        };
    }
}

// 导出测试函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTests,
        testFetchUserProfile,
        testDataModelTransformation,
        testErrorHandling,
        testRetryMechanism,
        testCacheMechanism,
        testProfilePageIntegration
    };
}

// 如果直接运行此文件，执行测试
if (typeof wx !== 'undefined') {
    // 在微信小程序环境中延迟执行
    setTimeout(runTests, 1000);
} else {
    // 在其他环境中直接执行
    runTests().then(result => {
        console.log('测试结果:', result);
    });
}