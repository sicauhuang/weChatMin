/**
 * 权限功能测试模块
 * 验证权限系统的各种场景和功能
 */

const permission = require('./utils/permission.js');
const auth = require('./utils/auth.js');
const storage = require('./utils/storage.js');

// 测试权限常量
const TEST_PERMISSIONS = {
  TEACH: 'miniprogram:page.teach',
  CHECK: 'miniprogram:page.check', 
  SELL: 'miniprogram:page.sell',
  APPROVE: 'miniprogram:page.approve',
  SELL_ADD: 'miniprogram:page.sell:action.add',
  SELL_DELETE: 'miniprogram:page.sell:action.delete',
  SELL_EDIT: 'miniprogram:page.sell:action.edit'
};

/**
 * 测试结果记录器
 */
class TestReporter {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    try {
      const result = fn();
      if (result === true || result === undefined) {
        this.passed++;
        this.tests.push({ name, status: 'PASS', message: '测试通过' });
        console.log(`✅ ${name}: 通过`);
      } else {
        this.failed++;
        this.tests.push({ name, status: 'FAIL', message: result || '测试失败' });
        console.log(`❌ ${name}: ${result || '测试失败'}`);
      }
    } catch (error) {
      this.failed++;
      this.tests.push({ name, status: 'ERROR', message: error.message });
      console.error(`💥 ${name}: ${error.message}`);
    }
  }

  async testAsync(name, fn) {
    try {
      const result = await fn();
      if (result === true || result === undefined) {
        this.passed++;
        this.tests.push({ name, status: 'PASS', message: '测试通过' });
        console.log(`✅ ${name}: 通过`);
      } else {
        this.failed++;
        this.tests.push({ name, status: 'FAIL', message: result || '测试失败' });
        console.log(`❌ ${name}: ${result || '测试失败'}`);
      }
    } catch (error) {
      this.failed++;
      this.tests.push({ name, status: 'ERROR', message: error.message });
      console.error(`💥 ${name}: ${error.message}`);
    }
  }

  report() {
    console.log('\n========== 权限功能测试报告 ==========');
    console.log(`总测试数: ${this.tests.length}`);
    console.log(`通过: ${this.passed}`);
    console.log(`失败: ${this.failed}`);
    console.log(`通过率: ${(this.passed / this.tests.length * 100).toFixed(2)}%`);
    
    if (this.failed > 0) {
      console.log('\n失败的测试:');
      this.tests.filter(t => t.status !== 'PASS').forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
    }
    
    console.log('=====================================\n');
    return {
      total: this.tests.length,
      passed: this.passed,
      failed: this.failed,
      rate: this.passed / this.tests.length,
      details: this.tests
    };
  }
}

/**
 * 权限管理器基础功能测试
 */
function testPermissionManager() {
  const reporter = new TestReporter();
  
  console.log('🧪 开始权限管理器基础功能测试...\n');

  // 测试权限管理器初始化
  reporter.test('权限管理器初始化', () => {
    const testPermissions = [TEST_PERMISSIONS.TEACH, TEST_PERMISSIONS.SELL];
    const metadata = {
      userId: 12345,
      roleId: 2,
      roleName: '销售员'
    };
    
    permission.initPermissions(testPermissions, metadata);
    const summary = permission.getPermissionSummary();
    
    if (summary.hasPermissions && summary.permissionCount === 2) {
      return true;
    }
    return `权限初始化失败，期望权限数2，实际${summary.permissionCount}`;
  });

  // 测试单一权限验证
  reporter.test('单一权限验证 - 有权限', () => {
    const hasTeachPermission = permission.hasPermission(TEST_PERMISSIONS.TEACH);
    return hasTeachPermission ? true : '应该有助考权限但验证失败';
  });

  reporter.test('单一权限验证 - 无权限', () => {
    const hasApprovePermission = permission.hasPermission(TEST_PERMISSIONS.APPROVE);
    return !hasApprovePermission ? true : '不应该有审批权限但验证通过';
  });

  // 测试多权限验证 - 或关系
  reporter.test('多权限验证 - 或关系(有权限)', () => {
    const hasAnyPermission = permission.hasAnyPermission([
      TEST_PERMISSIONS.TEACH,     // 有权限
      TEST_PERMISSIONS.APPROVE    // 无权限
    ]);
    return hasAnyPermission ? true : '或关系验证应该通过';
  });

  reporter.test('多权限验证 - 或关系(无权限)', () => {
    const hasAnyPermission = permission.hasAnyPermission([
      TEST_PERMISSIONS.APPROVE,   // 无权限
      TEST_PERMISSIONS.CHECK      // 无权限
    ]);
    return !hasAnyPermission ? true : '或关系验证应该失败';
  });

  // 测试多权限验证 - 与关系
  reporter.test('多权限验证 - 与关系(部分权限)', () => {
    const hasAllPermissions = permission.hasAllPermissions([
      TEST_PERMISSIONS.TEACH,     // 有权限
      TEST_PERMISSIONS.APPROVE    // 无权限
    ]);
    return !hasAllPermissions ? true : '与关系验证应该失败';
  });

  reporter.test('多权限验证 - 与关系(全部权限)', () => {
    const hasAllPermissions = permission.hasAllPermissions([
      TEST_PERMISSIONS.TEACH,     // 有权限
      TEST_PERMISSIONS.SELL       // 有权限
    ]);
    return hasAllPermissions ? true : '与关系验证应该通过';
  });

  // 测试权限清除
  reporter.test('权限清除功能', () => {
    permission.clearPermissions();
    const summary = permission.getPermissionSummary();
    return !summary.hasPermissions ? true : '权限清除后仍有权限数据';
  });

  return reporter.report();
}

/**
 * 权限组件功能测试
 */
function testPermissionComponent() {
  const reporter = new TestReporter();
  
  console.log('🧪 开始权限组件功能测试...\n');

  // 重新初始化权限数据
  const testPermissions = [
    TEST_PERMISSIONS.TEACH,
    TEST_PERMISSIONS.SELL,
    TEST_PERMISSIONS.SELL_ADD
  ];
  permission.initPermissions(testPermissions);

  // 模拟组件参数测试
  reporter.test('组件单一权限验证 - 有权限', () => {
    // 模拟组件属性
    const props = {
      permission: TEST_PERMISSIONS.TEACH,
      permissions: [],
      requireAll: false
    };
    
    const hasPermission = props.permission ? 
      permission.hasPermission(props.permission) : 
      permission.hasPermissions(props.permissions, props.requireAll);
    
    return hasPermission ? true : '组件权限验证失败';
  });

  reporter.test('组件单一权限验证 - 无权限', () => {
    const props = {
      permission: TEST_PERMISSIONS.APPROVE,
      permissions: [],
      requireAll: false
    };
    
    const hasPermission = props.permission ? 
      permission.hasPermission(props.permission) : 
      permission.hasPermissions(props.permissions, props.requireAll);
    
    return !hasPermission ? true : '组件权限验证应该失败';
  });

  reporter.test('组件多权限验证 - 或关系', () => {
    const props = {
      permission: '',
      permissions: [TEST_PERMISSIONS.TEACH, TEST_PERMISSIONS.APPROVE],
      requireAll: false
    };
    
    const hasPermission = props.permission ? 
      permission.hasPermission(props.permission) : 
      permission.hasPermissions(props.permissions, props.requireAll);
    
    return hasPermission ? true : '组件多权限或关系验证失败';
  });

  reporter.test('组件多权限验证 - 与关系', () => {
    const props = {
      permission: '',
      permissions: [TEST_PERMISSIONS.TEACH, TEST_PERMISSIONS.SELL],
      requireAll: true
    };
    
    const hasPermission = props.permission ? 
      permission.hasPermission(props.permission) : 
      permission.hasPermissions(props.permissions, props.requireAll);
    
    return hasPermission ? true : '组件多权限与关系验证失败';
  });

  return reporter.report();
}

/**
 * 权限场景测试
 */
function testPermissionScenarios() {
  const reporter = new TestReporter();
  
  console.log('🧪 开始权限场景测试...\n');

  // 场景1：销售员权限
  reporter.test('场景测试 - 销售员权限', () => {
    const salesPermissions = [
      TEST_PERMISSIONS.SELL,
      TEST_PERMISSIONS.SELL_ADD,
      TEST_PERMISSIONS.SELL_DELETE
    ];
    
    permission.initPermissions(salesPermissions, {
      userId: 12345,
      roleId: 2,
      roleName: '销售员'
    });
    
    // 销售员应该能访问卖车功能
    const canSell = permission.hasPermission(TEST_PERMISSIONS.SELL);
    const canAdd = permission.hasPermission(TEST_PERMISSIONS.SELL_ADD);
    const canDelete = permission.hasPermission(TEST_PERMISSIONS.SELL_DELETE);
    
    // 销售员不应该能访问审批功能
    const canApprove = permission.hasPermission(TEST_PERMISSIONS.APPROVE);
    
    if (canSell && canAdd && canDelete && !canApprove) {
      return true;
    }
    return `销售员权限错误: 卖车${canSell} 新增${canAdd} 删除${canDelete} 审批${canApprove}`;
  });

  // 场景2：管理员权限
  reporter.test('场景测试 - 管理员权限', () => {
    const adminPermissions = Object.values(TEST_PERMISSIONS);
    
    permission.initPermissions(adminPermissions, {
      userId: 67890,
      roleId: 1,
      roleName: '管理员'
    });
    
    // 管理员应该有所有权限
    const hasAllPermissions = Object.values(TEST_PERMISSIONS).every(perm => 
      permission.hasPermission(perm)
    );
    
    return hasAllPermissions ? true : '管理员应该有所有权限';
  });

  // 场景3：游客权限
  reporter.test('场景测试 - 游客权限', () => {
    permission.initPermissions([], {
      userId: null,
      roleId: null,
      roleName: '游客'
    });
    
    // 游客不应该有任何权限
    const hasNoPermissions = Object.values(TEST_PERMISSIONS).every(perm => 
      !permission.hasPermission(perm)
    );
    
    return hasNoPermissions ? true : '游客不应该有任何权限';
  });

  // 场景4：Profile页面权限控制
  reporter.test('场景测试 - Profile页面功能模块', () => {
    const userPermissions = [
      TEST_PERMISSIONS.TEACH,
      TEST_PERMISSIONS.SELL
    ];
    
    permission.initPermissions(userPermissions);
    
    // 检查各功能模块权限
    const teachVisible = permission.hasPermission(TEST_PERMISSIONS.TEACH);
    const checkVisible = permission.hasPermission(TEST_PERMISSIONS.CHECK);
    const sellVisible = permission.hasPermission(TEST_PERMISSIONS.SELL);
    const approveVisible = permission.hasPermission(TEST_PERMISSIONS.APPROVE);
    
    if (teachVisible && !checkVisible && sellVisible && !approveVisible) {
      return true;
    }
    return `Profile功能模块权限错误: 助考${teachVisible} 核销${checkVisible} 卖车${sellVisible} 审批${approveVisible}`;
  });

  // 场景5：卖车页面操作权限
  reporter.test('场景测试 - 卖车页面操作按钮', () => {
    const userPermissions = [
      TEST_PERMISSIONS.SELL,
      TEST_PERMISSIONS.SELL_ADD
      // 故意不包含 SELL_DELETE
    ];
    
    permission.initPermissions(userPermissions);
    
    // 检查操作按钮权限
    const pageVisible = permission.hasPermission(TEST_PERMISSIONS.SELL);
    const addVisible = permission.hasPermission(TEST_PERMISSIONS.SELL_ADD);
    const deleteVisible = permission.hasPermission(TEST_PERMISSIONS.SELL_DELETE);
    
    if (pageVisible && addVisible && !deleteVisible) {
      return true;
    }
    return `卖车页面操作权限错误: 页面${pageVisible} 新增${addVisible} 删除${deleteVisible}`;
  });

  return reporter.report();
}

/**
 * 权限缓存和性能测试
 */
function testPermissionCache() {
  const reporter = new TestReporter();
  
  console.log('🧪 开始权限缓存和性能测试...\n');

  // 测试缓存功能
  reporter.test('权限缓存功能', () => {
    const testPermissions = [TEST_PERMISSIONS.TEACH, TEST_PERMISSIONS.SELL];
    const metadata = {
      userId: 12345,
      roleId: 2,
      roleName: '销售员'
    };
    
    // 初始化权限
    permission.initPermissions(testPermissions, metadata);
    
    // 获取权限摘要检查缓存
    const summary1 = permission.getPermissionSummary();
    const summary2 = permission.getPermissionSummary();
    
    if (summary1.hasPermissions && summary2.hasPermissions && 
        summary1.permissionCount === summary2.permissionCount) {
      return true;
    }
    return '权限缓存功能异常';
  });

  // 测试性能（大量权限验证）
  reporter.test('权限验证性能测试', () => {
    const testPermissions = Object.values(TEST_PERMISSIONS);
    permission.initPermissions(testPermissions);
    
    const startTime = Date.now();
    
    // 执行1000次权限验证
    for (let i = 0; i < 1000; i++) {
      permission.hasPermission(TEST_PERMISSIONS.TEACH);
      permission.hasPermission(TEST_PERMISSIONS.SELL);
      permission.hasAnyPermission([TEST_PERMISSIONS.TEACH, TEST_PERMISSIONS.APPROVE]);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 1000次验证应该在100ms内完成
    if (duration < 100) {
      console.log(`性能测试通过: 1000次验证耗时${duration}ms`);
      return true;
    }
    return `性能测试失败: 1000次验证耗时${duration}ms，超过预期`;
  });

  return reporter.report();
}

/**
 * 异常情况测试
 */
function testEdgeCases() {
  const reporter = new TestReporter();
  
  console.log('🧪 开始异常情况测试...\n');

  // 测试空权限
  reporter.test('空权限参数测试', () => {
    const result1 = permission.hasPermission('');
    const result2 = permission.hasPermission(null);
    const result3 = permission.hasPermission(undefined);
    
    return (!result1 && !result2 && !result3) ? true : '空权限参数应该返回false';
  });

  // 测试空权限数组
  reporter.test('空权限数组测试', () => {
    const result1 = permission.hasPermissions([]);
    const result2 = permission.hasPermissions(null);
    const result3 = permission.hasPermissions(undefined);
    
    return (!result1 && !result2 && !result3) ? true : '空权限数组应该返回false';
  });

  // 测试无效权限标识符
  reporter.test('无效权限标识符测试', () => {
    permission.initPermissions([TEST_PERMISSIONS.TEACH]);
    
    const result = permission.hasPermission('invalid:permission');
    return !result ? true : '无效权限标识符应该返回false';
  });

  // 测试未初始化状态
  reporter.test('未初始化状态测试', () => {
    permission.clearPermissions();
    
    const result = permission.hasPermission(TEST_PERMISSIONS.TEACH);
    return !result ? true : '未初始化状态应该返回false';
  });

  return reporter.report();
}

/**
 * 集成测试
 */
async function testIntegration() {
  const reporter = new TestReporter();
  
  console.log('🧪 开始集成测试...\n');

  // 测试与存储模块的集成
  reporter.test('存储模块集成测试', () => {
    // 模拟用户信息
    const userInfo = {
      userId: 12345,
      phoneNumber: '13800138000',
      permissions: [TEST_PERMISSIONS.TEACH, TEST_PERMISSIONS.SELL],
      roleId: 2,
      roleName: '销售员'
    };
    
    // 保存到存储
    storage.setUserInfo(userInfo);
    
    // 初始化权限系统
    permission.initPermissions(userInfo.permissions, {
      userId: userInfo.userId,
      roleId: userInfo.roleId,
      roleName: userInfo.roleName
    });
    
    // 验证权限
    const hasTeachPermission = permission.hasPermission(TEST_PERMISSIONS.TEACH);
    const hasApprovePermission = permission.hasPermission(TEST_PERMISSIONS.APPROVE);
    
    if (hasTeachPermission && !hasApprovePermission) {
      return true;
    }
    return '存储模块集成测试失败';
  });

  return reporter.report();
}

/**
 * 运行完整的权限功能测试套件
 */
async function runFullTestSuite() {
  console.log('🚀 开始运行权限功能完整测试套件...\n');
  
  const results = {
    basic: testPermissionManager(),
    component: testPermissionComponent(),
    scenarios: testPermissionScenarios(),
    cache: testPermissionCache(),
    edgeCases: testEdgeCases(),
    integration: await testIntegration()
  };
  
  // 汇总结果
  const totalTests = Object.values(results).reduce((sum, result) => sum + result.total, 0);
  const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);
  
  console.log('🎯 权限功能测试套件完成！');
  console.log('==========================================');
  console.log(`总测试数: ${totalTests}`);
  console.log(`总通过数: ${totalPassed}`);
  console.log(`总失败数: ${totalFailed}`);
  console.log(`总通过率: ${(totalPassed / totalTests * 100).toFixed(2)}%`);
  console.log('==========================================');
  
  // 分类统计
  Object.entries(results).forEach(([category, result]) => {
    const status = result.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${category}: ${result.passed}/${result.total} (${(result.rate * 100).toFixed(1)}%)`);
  });
  
  console.log('\n🏁 测试套件执行完毕！');
  
  return {
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      rate: totalPassed / totalTests
    },
    details: results
  };
}

/**
 * 快速权限验证测试（用于页面集成验证）
 */
function quickPermissionTest() {
  console.log('⚡ 快速权限验证测试');
  
  try {
    // 测试基本权限功能
    permission.initPermissions([
      'miniprogram:page.teach',
      'miniprogram:page.sell',
      'miniprogram:page.sell:action.add'
    ]);
    
    const tests = [
      permission.hasPermission('miniprogram:page.teach'),
      permission.hasPermission('miniprogram:page.sell'),
      permission.hasPermission('miniprogram:page.sell:action.add'),
      !permission.hasPermission('miniprogram:page.approve'),
      permission.hasAnyPermission(['miniprogram:page.teach', 'miniprogram:page.approve']),
      !permission.hasAllPermissions(['miniprogram:page.teach', 'miniprogram:page.approve'])
    ];
    
    const allPassed = tests.every(test => test === true);
    
    if (allPassed) {
      console.log('✅ 快速权限验证测试通过！');
      return true;
    } else {
      console.log('❌ 快速权限验证测试失败！');
      return false;
    }
  } catch (error) {
    console.error('💥 快速权限验证测试异常:', error);
    return false;
  }
}

module.exports = {
  // 完整测试套件
  runFullTestSuite,
  
  // 单项测试
  testPermissionManager,
  testPermissionComponent,
  testPermissionScenarios,
  testPermissionCache,
  testEdgeCases,
  testIntegration,
  
  // 快速测试
  quickPermissionTest,
  
  // 工具类
  TestReporter,
  TEST_PERMISSIONS
};