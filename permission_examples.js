/**
 * 权限功能示例和使用指南
 * 演示不同用户角色的权限配置和使用方法
 */

const permission = require('./utils/permission.js');

/**
 * 模拟用户权限数据
 */
const MOCK_USER_PERMISSIONS = {
  // 管理员 - 拥有所有权限
  admin: [
    'miniprogram:page.teach',
    'miniprogram:page.check', 
    'miniprogram:page.sell',
    'miniprogram:page.approve',
    'miniprogram:page.sell:action.add',
    'miniprogram:page.sell:action.delete',
    'miniprogram:page.sell:action.edit',
    'miniprogram:page.approve:action.approve',
    'miniprogram:page.approve:action.edit',
    'miniprogram:page.approve:action.delete',
    'miniprogram:action.view-floor-price'
  ],
  
  // 销售员 - 卖车相关权限
  salesperson: [
    'miniprogram:page.sell',
    'miniprogram:page.sell:action.add',
    'miniprogram:page.sell:action.delete',
    'miniprogram:page.sell:action.edit'
  ],
  
  // 助考员 - 助考相关权限
  assistant: [
    'miniprogram:page.teach'
  ],
  
  // 核销员 - 核销相关权限
  verifier: [
    'miniprogram:page.check'
  ],
  
  // 审批员 - 审批相关权限
  approver: [
    'miniprogram:page.approve',
    'miniprogram:page.approve:action.approve',
    'miniprogram:page.approve:action.edit'
  ],
  
  // 高级销售员 - 销售+部分审批权限
  seniorSalesperson: [
    'miniprogram:page.sell',
    'miniprogram:page.sell:action.add',
    'miniprogram:page.sell:action.delete',
    'miniprogram:page.sell:action.edit',
    'miniprogram:page.approve',
    'miniprogram:page.approve:action.approve'
  ],
  
  // 游客 - 无特殊权限
  guest: []
};

/**
 * 用户角色信息
 */
const MOCK_USER_ROLES = {
  admin: { roleId: 1, roleName: '管理员', userId: 10001 },
  salesperson: { roleId: 2, roleName: '销售员', userId: 10002 },
  assistant: { roleId: 3, roleName: '助考员', userId: 10003 },
  verifier: { roleId: 4, roleName: '核销员', userId: 10004 },
  approver: { roleId: 5, roleName: '审批员', userId: 10005 },
  seniorSalesperson: { roleId: 6, roleName: '高级销售员', userId: 10006 },
  guest: { roleId: null, roleName: '游客', userId: null }
};

/**
 * 模拟用户登录并初始化权限
 * @param {string} userType 用户类型
 */
function simulateUserLogin(userType) {
  if (!MOCK_USER_PERMISSIONS[userType] || !MOCK_USER_ROLES[userType]) {
    console.error('不支持的用户类型:', userType);
    return false;
  }
  
  const permissions = MOCK_USER_PERMISSIONS[userType];
  const role = MOCK_USER_ROLES[userType];
  
  console.log(`🎭 模拟用户登录: ${role.roleName} (${userType})`);
  console.log(`📋 权限列表: [${permissions.join(', ')}]`);
  
  // 初始化权限系统
  permission.initPermissions(permissions, role);
  
  console.log('✅ 权限系统初始化完成\n');
  return true;
}

/**
 * 检查Profile页面功能模块权限
 */
function checkProfilePagePermissions() {
  console.log('📱 Profile页面功能模块权限检查:');
  
  const modules = [
    { name: '模拟票助考', permission: 'miniprogram:page.teach' },
    { name: '模拟票核销', permission: 'miniprogram:page.check' },
    { name: '我要卖车', permission: 'miniprogram:page.sell' },
    { name: '审批车辆', permission: 'miniprogram:page.approve' }
  ];
  
  modules.forEach(module => {
    const hasPermission = permission.hasPermission(module.permission);
    const status = hasPermission ? '✅ 显示' : '❌ 隐藏';
    console.log(`  ${module.name}: ${status}`);
  });
  
  console.log('');
}

/**
 * 检查卖车页面操作权限
 */
function checkCarSellingPagePermissions() {
  console.log('🚗 卖车页面操作权限检查:');
  
  const pageVisible = permission.hasPermission('miniprogram:page.sell');
  console.log(`  页面访问: ${pageVisible ? '✅ 允许' : '❌ 拒绝'}`);
  
  if (pageVisible) {
    const operations = [
      { name: '新建车辆', permission: 'miniprogram:page.sell:action.add' },
      { name: '删除车辆', permission: 'miniprogram:page.sell:action.delete' },
      { name: '编辑车辆', permission: 'miniprogram:page.sell:action.edit' }
    ];
    
    operations.forEach(operation => {
      const hasPermission = permission.hasPermission(operation.permission);
      const status = hasPermission ? '✅ 显示' : '❌ 隐藏';
      console.log(`  ${operation.name}: ${status}`);
    });
  }
  
  console.log('');
}

/**
 * 权限摘要信息
 */
function showPermissionSummary() {
  const summary = permission.getPermissionSummary();
  
  console.log('📊 权限摘要信息:');
  console.log(`  用户ID: ${summary.userInfo?.userId || '未知'}`);
  console.log(`  角色: ${summary.userInfo?.roleName || '未知'}`);
  console.log(`  权限级别: ${summary.level}`);
  console.log(`  权限数量: ${summary.permissionCount}`);
  console.log(`  最后更新: ${summary.lastUpdate || '未知'}`);
  console.log('');
}

/**
 * 演示所有用户类型的权限场景
 */
function demonstrateAllUserTypes() {
  console.log('🎪 权限功能演示 - 所有用户类型\n');
  
  Object.keys(MOCK_USER_PERMISSIONS).forEach(userType => {
    console.log('═'.repeat(60));
    
    // 模拟登录
    simulateUserLogin(userType);
    
    // 显示权限摘要
    showPermissionSummary();
    
    // 检查Profile页面权限
    checkProfilePagePermissions();
    
    // 检查卖车页面权限
    checkCarSellingPagePermissions();
  });
  
  console.log('═'.repeat(60));
  console.log('🎉 权限功能演示完成！');
}

/**
 * 权限组件使用示例
 */
function showComponentUsageExamples() {
  console.log('📖 权限组件使用示例:\n');
  
  console.log('1. 单一权限控制:');
  console.log('```xml');
  console.log('<permission-wrapper permission="miniprogram:page.sell">');
  console.log('  <button>我要卖车</button>');
  console.log('</permission-wrapper>');
  console.log('```\n');
  
  console.log('2. 多权限或关系:');
  console.log('```xml');
  console.log('<permission-wrapper');
  console.log('  permissions="{{[\'miniprogram:page.sell\', \'miniprogram:page.approve\']}}"');
  console.log('  requireAll="{{false}}">');
  console.log('  <view>车辆管理区域</view>');
  console.log('</permission-wrapper>');
  console.log('```\n');
  
  console.log('3. 多权限与关系:');
  console.log('```xml');
  console.log('<permission-wrapper');
  console.log('  permissions="{{[\'miniprogram:page.sell\', \'miniprogram:page.sell:action.add\']}}"');
  console.log('  requireAll="{{true}}">');
  console.log('  <button>新建车辆</button>');
  console.log('</permission-wrapper>');
  console.log('```\n');
  
  console.log('4. 降级处理:');
  console.log('```xml');
  console.log('<permission-wrapper');
  console.log('  permission="miniprogram:advanced.feature"');
  console.log('  fallbackBehavior="show"');
  console.log('  fallbackContent="该功能需要更高权限">');
  console.log('  <button>高级功能</button>');
  console.log('</permission-wrapper>');
  console.log('```\n');
}

/**
 * 测试特定用户类型权限
 * @param {string} userType 用户类型
 */
function testUserTypePermissions(userType) {
  console.log(`🧪 测试 ${userType} 用户权限:\n`);
  
  if (!simulateUserLogin(userType)) {
    return;
  }
  
  showPermissionSummary();
  checkProfilePagePermissions();
  checkCarSellingPagePermissions();
}

module.exports = {
  // 模拟数据
  MOCK_USER_PERMISSIONS,
  MOCK_USER_ROLES,
  
  // 演示函数
  simulateUserLogin,
  checkProfilePagePermissions,
  checkCarSellingPagePermissions,
  showPermissionSummary,
  demonstrateAllUserTypes,
  showComponentUsageExamples,
  testUserTypePermissions
};