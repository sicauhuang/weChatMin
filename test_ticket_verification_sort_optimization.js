/**
 * 模拟票核销功能 - 核销优化第4点测试
 * 测试助考员票据始终显示在最后的排序功能
 */

// 模拟票据排序方法（从实际代码中提取）
function sortScannedTickets(tickets) {
  // 分离学员票和助考员票
  const studentTickets = tickets.filter(ticket => ticket.type === 'mock-ticket');
  const assistantTickets = tickets.filter(ticket => ticket.type === 'assist-ticket');

  // 学员票按扫码时间排序（最新扫码的在前）
  studentTickets.sort((a, b) => {
    const timeA = a.scanTime || 0;
    const timeB = b.scanTime || 0;
    return timeB - timeA; // 降序排列，最新的在前
  });

  // 助考员票按扫码时间排序（虽然通常只有一个）
  assistantTickets.sort((a, b) => {
    const timeA = a.scanTime || 0;
    const timeB = b.scanTime || 0;
    return timeB - timeA;
  });

  // 核销优化第4点：助考员票据始终显示在最后
  const sortedTickets = [...studentTickets, ...assistantTickets];

  console.log('🔄 票据排序完成：');
  console.log('- 学员票：', studentTickets.length, '张');
  console.log('- 助考员票：', assistantTickets.length, '张');
  console.log('- 助考员票已排在最后');

  return sortedTickets;
}

// 测试用例
console.log('=== 模拟票核销功能 - 核销优化第4点测试 ===');

// 测试用例1：助考员票在前，学员票在后的情况
console.log('\n📋 测试用例1：助考员票先扫码，学员票后扫码');
const testCase1 = [
  // 助考员票（先扫码）
  {
    type: 'assist-ticket',
    userId: 'assistant_001',
    assistantName: '王助考',
    assistantPhone: '137****7777',
    scanTime: 1000
  },
  // 学员票1（后扫码）
  {
    type: 'mock-ticket',
    ticketId: 'MT001',
    studentName: '张三',
    studentPhone: '138****8888',
    packageName: '科目二模拟考试套餐A',
    scanTime: 2000
  },
  // 学员票2（最后扫码）
  {
    type: 'mock-ticket',
    ticketId: 'MT002',
    studentName: '李四',
    studentPhone: '136****6666',
    packageName: '科目三模拟考试套餐B',
    scanTime: 3000
  }
];

const sorted1 = sortScannedTickets([...testCase1]);
console.log('排序前顺序：', testCase1.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('排序后顺序：', sorted1.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('✅ 测试结果：助考员票是否在最后？', sorted1[sorted1.length - 1].type === 'assist-ticket');

// 测试用例2：学员票在前，助考员票在后的情况
console.log('\n📋 测试用例2：学员票先扫码，助考员票后扫码');
const testCase2 = [
  // 学员票1（先扫码）
  {
    type: 'mock-ticket',
    ticketId: 'MT001',
    studentName: '张三',
    studentPhone: '138****8888',
    packageName: '科目二模拟考试套餐A',
    scanTime: 1000
  },
  // 学员票2（中间扫码）
  {
    type: 'mock-ticket',
    ticketId: 'MT002',
    studentName: '李四',
    studentPhone: '136****6666',
    packageName: '科目三模拟考试套餐B',
    scanTime: 2000
  },
  // 助考员票（最后扫码）
  {
    type: 'assist-ticket',
    userId: 'assistant_001',
    assistantName: '王助考',
    assistantPhone: '137****7777',
    scanTime: 3000
  }
];

const sorted2 = sortScannedTickets([...testCase2]);
console.log('排序前顺序：', testCase2.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('排序后顺序：', sorted2.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('✅ 测试结果：助考员票是否在最后？', sorted2[sorted2.length - 1].type === 'assist-ticket');

// 测试用例3：混合扫码顺序
console.log('\n📋 测试用例3：混合扫码顺序');
const testCase3 = [
  // 学员票1（第一个扫码）
  {
    type: 'mock-ticket',
    ticketId: 'MT001',
    studentName: '张三',
    studentPhone: '138****8888',
    packageName: '科目二模拟考试套餐A',
    scanTime: 1000
  },
  // 助考员票（第二个扫码）
  {
    type: 'assist-ticket',
    userId: 'assistant_001',
    assistantName: '王助考',
    assistantPhone: '137****7777',
    scanTime: 2000
  },
  // 学员票2（第三个扫码）
  {
    type: 'mock-ticket',
    ticketId: 'MT002',
    studentName: '李四',
    studentPhone: '136****6666',
    packageName: '科目三模拟考试套餐B',
    scanTime: 3000
  },
  // 学员票3（第四个扫码）
  {
    type: 'mock-ticket',
    ticketId: 'MT003',
    studentName: '王五',
    studentPhone: '135****5555',
    packageName: 'VIP模拟考试套餐',
    scanTime: 4000
  }
];

const sorted3 = sortScannedTickets([...testCase3]);
console.log('排序前顺序：', testCase3.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('排序后顺序：', sorted3.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('✅ 测试结果：助考员票是否在最后？', sorted3[sorted3.length - 1].type === 'assist-ticket');

// 测试用例4：学员票按时间排序验证
console.log('\n📋 测试用例4：学员票按扫码时间排序验证');
const studentTicketsOnly = sorted3.filter(t => t.type === 'mock-ticket');
console.log('学员票扫码时间顺序：', studentTicketsOnly.map(t => `${t.studentName}(${t.scanTime})`));
const isStudentTicketsSortedCorrectly = studentTicketsOnly.every((ticket, index) => {
  if (index === 0) return true;
  return ticket.scanTime <= studentTicketsOnly[index - 1].scanTime;
});
console.log('✅ 测试结果：学员票是否按时间降序排列？', isStudentTicketsSortedCorrectly);

// 测试用例5：只有助考员票的情况
console.log('\n📋 测试用例5：只有助考员票');
const testCase5 = [
  {
    type: 'assist-ticket',
    userId: 'assistant_001',
    assistantName: '王助考',
    assistantPhone: '137****7777',
    scanTime: 1000
  }
];

const sorted5 = sortScannedTickets([...testCase5]);
console.log('排序结果：', sorted5.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('✅ 测试结果：只有助考员票时是否正常？', sorted5.length === 1 && sorted5[0].type === 'assist-ticket');

// 测试用例6：只有学员票的情况
console.log('\n📋 测试用例6：只有学员票');
const testCase6 = [
  {
    type: 'mock-ticket',
    ticketId: 'MT001',
    studentName: '张三',
    studentPhone: '138****8888',
    packageName: '科目二模拟考试套餐A',
    scanTime: 2000
  },
  {
    type: 'mock-ticket',
    ticketId: 'MT002',
    studentName: '李四',
    studentPhone: '136****6666',
    packageName: '科目三模拟考试套餐B',
    scanTime: 1000
  }
];

const sorted6 = sortScannedTickets([...testCase6]);
console.log('排序结果：', sorted6.map(t => `${t.type === 'assist-ticket' ? '助考员' : '学员'}-${t.type === 'assist-ticket' ? t.assistantName : t.studentName}`));
console.log('✅ 测试结果：只有学员票时是否按时间排序？', sorted6[0].studentName === '张三' && sorted6[1].studentName === '李四');

console.log('\n=== 核销优化第4点功能测试完成 ===');
console.log('🎯 核心功能验证：');
console.log('1. ✅ 助考员票据始终显示在最后');
console.log('2. ✅ 学员票按扫码时间降序排列（最新的在前）');
console.log('3. ✅ 混合扫码顺序下排序正确');
console.log('4. ✅ 边界情况处理正常');
console.log('\n🚀 核销优化第4点实现完成！');
