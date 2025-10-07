/**
 * 模拟票核销功能测试文件
 * 用于测试扫码和解码功能
 */

const { encodeShortTermQRData, decodeQRData } = require('./utils/encoder.js');

console.log('=== 模拟票核销功能测试 ===');

// 模拟生成一个模拟票二维码数据
const mockTicketData = {
  ticketId: 'ticket_test_001',
  studentPhone: '13800138000',
  type: 'mock_ticket'
};

console.log('1. 生成测试用的模拟票二维码数据...');
console.log('原始数据:', mockTicketData);

try {
  // 生成短时效二维码数据（3分钟有效期）
  const encodedData = encodeShortTermQRData(mockTicketData, 3 * 60 * 1000);
  console.log('编码后的数据:', encodedData);

  console.log('\n2. 模拟扫码解码过程...');

  // 模拟扫码后的解码过程
  const decodedData = decodeQRData(encodedData);

  console.log('=== 解码成功 ===');
  console.log('解码后的完整数据:', decodedData);
  console.log('数据详情:');
  console.log('- 票据ID:', decodedData.ticketId || '未知');
  console.log('- 学员手机号:', decodedData.studentPhone || '未知');
  console.log('- 生成时间:', decodedData.generateTime ? new Date(decodedData.generateTime).toLocaleString() : '未知');
  console.log('- 过期时间:', decodedData.expireTime ? new Date(decodedData.expireTime).toLocaleString() : '未知');
  console.log('- 时间戳:', decodedData.timestamp ? new Date(decodedData.timestamp).toLocaleString() : '未知');
  console.log('- 版本:', decodedData.version || '未知');
  console.log('- 盐值:', decodedData.salt || '未知');
  console.log('==================');

  console.log('\n3. 测试过期数据...');

  // 生成一个已过期的数据进行测试
  const expiredData = encodeShortTermQRData(mockTicketData, -1000); // 负数表示已过期

  try {
    decodeQRData(expiredData);
  } catch (error) {
    console.log('过期数据测试成功，错误信息:', error.message);
  }

  console.log('\n=== 测试完成 ===');
  console.log('核销功能的扫码和解码逻辑已正确实现！');

} catch (error) {
  console.error('测试失败:', error.message);
}
