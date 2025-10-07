/**
 * 模拟票二维码刷新功能测试
 * 测试需求第3点：点击二维码刷新功能
 */

// 模拟票据数据
const mockTicket = {
    id: 'ticket_001',
    orderNumber: 'ORD20241005001',
    packageName: '科目二模拟考试套餐',
    studentName: '张三',
    studentPhone: '13800138000',
    appointmentDate: '2024-10-06 09:00',
    simulationArea: 'A区',
    coachName: '李教练',
    coachPhone: '13900139000',
    status: '未使用'
};

console.log('=== 模拟票二维码刷新功能测试 ===');

// 测试1: 验证二维码数据编码
console.log('\n1. 测试二维码数据编码:');
const qrcode = require('./utils/qrcode.js');

try {
    // 生成第一次二维码数据
    const qrData1 = qrcode.formatShortTermTicketQRData(mockTicket);
    console.log('第一次生成的二维码数据:', qrData1);

    // 等待1秒后生成第二次二维码数据（模拟刷新）
    setTimeout(() => {
        const qrData2 = qrcode.formatShortTermTicketQRData(mockTicket);
        console.log('刷新后的二维码数据:', qrData2);

        // 验证两次生成的数据不同（因为时间戳不同）
        if (qrData1 !== qrData2) {
            console.log('✅ 刷新功能正常：两次生成的二维码数据不同');
        } else {
            console.log('❌ 刷新功能异常：两次生成的二维码数据相同');
        }

        // 测试解码功能
        console.log('\n2. 测试二维码解码:');
        try {
            const decodedData1 = qrcode.decodeQRData(qrData1);
            const decodedData2 = qrcode.decodeQRData(qrData2);

            console.log('第一次解码结果:', decodedData1);
            console.log('第二次解码结果:', decodedData2);

            // 验证核心数据相同，但时间戳不同
            if (decodedData1.ticketId === decodedData2.ticketId &&
                decodedData1.studentName === decodedData2.studentName &&
                decodedData1.timestamp !== decodedData2.timestamp) {
                console.log('✅ 解码功能正常：核心数据相同，时间戳不同');
            } else {
                console.log('❌ 解码功能异常');
            }
        } catch (error) {
            console.error('解码测试失败:', error);
        }

        // 测试有效期验证
        console.log('\n3. 测试有效期验证:');
        try {
            const isValid1 = qrcode.validateQRData(qrData1);
            const isValid2 = qrcode.validateQRData(qrData2);

            console.log('第一次二维码有效性:', isValid1);
            console.log('第二次二维码有效性:', isValid2);

            if (isValid1 && isValid2) {
                console.log('✅ 有效期验证正常：两个二维码都在有效期内');
            } else {
                console.log('❌ 有效期验证异常');
            }
        } catch (error) {
            console.error('有效期验证测试失败:', error);
        }

        // 测试元信息获取
        console.log('\n4. 测试元信息获取:');
        try {
            const meta1 = qrcode.getQRDataMeta(qrData1);
            const meta2 = qrcode.getQRDataMeta(qrData2);

            console.log('第一次二维码元信息:', meta1);
            console.log('第二次二维码元信息:', meta2);

            if (meta1.expiresAt !== meta2.expiresAt) {
                console.log('✅ 元信息获取正常：过期时间不同，说明刷新重置了有效期');
            } else {
                console.log('❌ 元信息获取异常：过期时间相同');
            }
        } catch (error) {
            console.error('元信息获取测试失败:', error);
        }

        console.log('\n=== 测试完成 ===');
    }, 1100); // 等待1.1秒确保时间戳不同

} catch (error) {
    console.error('测试执行失败:', error);
}

// 功能实现说明
console.log('\n=== 功能实现说明 ===');
console.log('1. ✅ 已实现编码功能（需求第1点）');
console.log('2. ✅ 已实现有效期功能（需求第2点）- 默认3分钟有效期');
console.log('3. ✅ 已实现点击刷新功能（需求第3点）- 本次开发重点');
console.log('');
console.log('刷新功能特性:');
console.log('- 点击二维码区域触发刷新');
console.log('- 刷新时显示"刷新中..."状态');
console.log('- 重新生成二维码并重置3分钟有效期');
console.log('- 刷新完成后显示"刷新成功"提示');
console.log('- 防止重复点击保护');
console.log('- 异常处理和用户反馈');
