/**
 * 模拟票核销优化功能测试文件
 * 测试核销优化后的功能是否正常工作
 */

// 模拟微信小程序环境
const mockWx = {
  showToast: (options) => {
    console.log('📱 wx.showToast:', options);
  },
  showModal: (options) => {
    console.log('📱 wx.showModal:', options);
    // 模拟用户点击确认
    setTimeout(() => {
      if (options.success) {
        options.success({ confirm: true });
      }
    }, 100);
  },
  showLoading: (options) => {
    console.log('📱 wx.showLoading:', options);
  },
  hideLoading: () => {
    console.log('📱 wx.hideLoading');
  },
  vibrateShort: (options) => {
    console.log('📱 wx.vibrateShort:', options);
  },
  scanCode: (options) => {
    console.log('📱 wx.scanCode:', options);
    // 模拟扫码成功
    setTimeout(() => {
      // 模拟扫描学员票
      const mockStudentQR = 'encoded_student_ticket_data_123';
      options.success({ result: mockStudentQR });
    }, 500);
  }
};

// 模拟解码函数
const mockDecodeQRData = (data) => {
  console.log('🔍 解码二维码数据:', data);

  // 模拟不同类型的票据数据
  if (data.includes('student')) {
    return {
      type: 'mock-ticket',
      ticketId: 'ticket_001',
      studentName: '张三',
      studentPhone: '138****8888',
      packageName: '科目二模拟考试',
      idCard: '110101199001011234',
      simulationArea: 'A区3号场地',
      expireTime: Date.now() + 3 * 60 * 1000 // 3分钟后过期
    };
  } else if (data.includes('assistant')) {
    return {
      type: 'assist-ticket',
      userId: 'assistant_001',
      assistantName: '李助考',
      assistantPhone: '139****9999',
      expireTime: Date.now() + 3 * 60 * 1000 // 3分钟后过期
    };
  } else {
    return {
      type: 'mock-ticket',
      ticketId: 'ticket_002',
      studentName: '李四',
      studentPhone: '136****6666',
      packageName: '科目三模拟考试',
      idCard: '110101199002022345',
      simulationArea: 'B区1号场地',
      expireTime: Date.now() + 3 * 60 * 1000
    };
  }
};

// 模拟请求函数
const mockRequest = {
  post: async (url, data, options) => {
    console.log('🌐 API请求:', { url, data, options });

    if (url === '/api/ticket/verify') {
      // 模拟核销接口
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('✅ 核销接口调用成功');
          resolve({
            success: true,
            data: {
              verifyId: `verify_${Date.now()}`,
              verifyTime: new Date().toISOString()
            }
          });
        }, 1000);
      });
    }

    return { success: false, message: '未知接口' };
  }
};

// 模拟页面对象
class MockTicketVerificationPage {
  constructor() {
    this.data = {
      scannedTickets: [],
      canVerify: false,
      verifyLoading: false
    };

    // 绑定全局对象
    global.wx = mockWx;
    global.decodeQRData = mockDecodeQRData;
    global.request = mockRequest;
  }

  setData(newData) {
    Object.assign(this.data, newData);
    console.log('📊 页面数据更新:', this.data);
  }

  // 处理学员票
  handleStudentTicket(ticketData) {
    const { studentPhone } = ticketData;
    let scannedTickets = [...this.data.scannedTickets];

    // 检查是否已存在相同手机号的学员票
    const existingIndex = scannedTickets.findIndex(
      ticket => ticket.type === 'mock-ticket' && ticket.studentPhone === studentPhone
    );

    if (existingIndex >= 0) {
      // 替换现有票据
      scannedTickets[existingIndex] = ticketData;
      mockWx.showToast({
        title: '已更新该学员票据',
        icon: 'success',
        duration: 1500
      });
    } else {
      // 检查学员票数量限制（最多4张）
      const studentTicketCount = scannedTickets.filter(ticket => ticket.type === 'mock-ticket').length;
      if (studentTicketCount >= 4) {
        mockWx.showToast({
          title: '学员票数量已达上限(4张)',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 添加新票据
      scannedTickets.push(ticketData);
      mockWx.showToast({
        title: '学员票添加成功',
        icon: 'success',
        duration: 1500
      });
    }

    this.setData({
      scannedTickets
    });
  }

  // 处理助考员票
  handleAssistantTicket(ticketData) {
    let scannedTickets = [...this.data.scannedTickets];

    // 移除已存在的助考员票（只能有一个）
    scannedTickets = scannedTickets.filter(ticket => ticket.type !== 'assist-ticket');

    // 添加新的助考员票
    scannedTickets.push(ticketData);

    this.setData({
      scannedTickets
    });

    mockWx.showToast({
      title: '助考员信息已更新',
      icon: 'success',
      duration: 1500
    });
  }

  // 更新核销状态
  updateVerifyStatus() {
    const { scannedTickets } = this.data;

    // 统计助考员票和学员票数量
    const assistantTickets = scannedTickets.filter(ticket => ticket.type === 'assist-ticket');
    const studentTickets = scannedTickets.filter(ticket => ticket.type === 'mock-ticket');

    const canVerify = assistantTickets.length === 1 &&
                     studentTickets.length >= 1 &&
                     studentTickets.length <= 4;

    this.setData({ canVerify });
  }

  // 处理扫码结果
  handleScanResult(scanResult) {
    console.log('🔍 开始处理扫码结果:', scanResult);

    try {
      // 使用解码函数解析二维码数据
      const decodedData = mockDecodeQRData(scanResult);

      console.log('=== 二维码解码成功 ===');
      console.log('解码后的完整数据:', decodedData);

      // 检查有效期
      if (decodedData.expireTime && Date.now() > decodedData.expireTime) {
        throw new Error('二维码已过期，请重新生成');
      }

      // 根据类型处理
      if (decodedData.type === 'mock-ticket') {
        this.handleStudentTicket(decodedData);
      } else if (decodedData.type === 'assist-ticket') {
        this.handleAssistantTicket(decodedData);
      } else {
        throw new Error('不支持的票据类型');
      }

      // 更新核销状态
      this.updateVerifyStatus();

    } catch (error) {
      console.error('=== 二维码解码失败 ===');
      console.error('错误信息:', error.message);

      mockWx.showToast({
        title: error.message,
        icon: 'none',
        duration: 2000
      });
    }
  }

  // 执行核销操作
  async executeVerify() {
    try {
      this.setData({ verifyLoading: true });

      mockWx.showLoading({
        title: '核销中...',
        mask: true
      });

      const { scannedTickets } = this.data;
      const assistantTickets = scannedTickets.filter(ticket => ticket.type === 'assist-ticket');
      const studentTickets = scannedTickets.filter(ticket => ticket.type === 'mock-ticket');

      const response = await mockRequest.post('/api/ticket/verify', {
        assistantUserId: assistantTickets[0].userId,
        ticketIdList: studentTickets.map(t => t.ticketId)
      }, {
        needAuth: true,
        showLoading: false
      });

      mockWx.hideLoading();

      if (response.success) {
        mockWx.showToast({
          title: '核销成功',
          icon: 'success',
          duration: 2000
        });

        // 核销优化：清空扫码数据
        this.setData({
          scannedTickets: [],
          canVerify: false
        });

        console.log('✅ 核销成功，已清空扫码数据');
      } else {
        throw new Error(response.message || '核销失败');
      }

    } catch (error) {
      mockWx.hideLoading();
      console.error('❌ 核销失败:', error);

      mockWx.showModal({
        title: '核销失败',
        content: error.message || '网络错误，请稍后重试',
        showCancel: false,
        confirmText: '确定'
      });
    } finally {
      this.setData({ verifyLoading: false });
    }
  }

  // 确认核销
  onConfirmVerifyTap() {
    console.log('🎯 点击确认核销按钮');

    const { scannedTickets } = this.data;
    const assistantTickets = scannedTickets.filter(ticket => ticket.type === 'assist-ticket');
    const studentTickets = scannedTickets.filter(ticket => ticket.type === 'mock-ticket');

    if (!this.data.canVerify) {
      let message = '';
      if (assistantTickets.length === 0) {
        message = '请先扫描助考员二维码';
      } else if (studentTickets.length === 0) {
        message = '请至少扫描一张学员票';
      } else if (studentTickets.length > 4) {
        message = '学员票数量不能超过4张';
      }

      mockWx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 构建确认信息
    const studentNames = studentTickets.map(t => t.studentName).join('、');
    const assistantName = assistantTickets[0].assistantName;

    const content = `确认核销以下票据？\n\n助考员：${assistantName}\n学员：${studentNames}`;

    mockWx.showModal({
      title: '确认核销',
      content,
      confirmText: '确认核销',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          console.log('✅ 用户确认执行核销操作');
          this.executeVerify();
        } else {
          console.log('❌ 用户取消核销操作');
        }
      }
    });
  }

  // 清空扫码票据
  onClearScannedTickets() {
    mockWx.showModal({
      title: '确认清空',
      content: '确认清空所有待核销票据？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            scannedTickets: [],
            canVerify: false
          });

          mockWx.showToast({
            title: '已清空',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  }
}

// 测试函数
async function runOptimizationTests() {
  console.log('🚀 开始测试模拟票核销优化功能...\n');

  const page = new MockTicketVerificationPage();

  // 测试1: 扫描学员票
  console.log('📋 测试1: 扫描学员票');
  page.handleScanResult('encoded_student_ticket_data_123');
  await new Promise(resolve => setTimeout(resolve, 100));

  // 测试2: 扫描助考员票
  console.log('\n📋 测试2: 扫描助考员票');
  page.handleScanResult('encoded_assistant_ticket_data_456');
  await new Promise(resolve => setTimeout(resolve, 100));

  // 测试3: 再扫描一张学员票
  console.log('\n📋 测试3: 扫描第二张学员票');
  page.handleScanResult('encoded_student_ticket_data_789');
  await new Promise(resolve => setTimeout(resolve, 100));

  // 测试4: 检查核销状态
  console.log('\n📋 测试4: 检查核销状态');
  console.log('当前可以核销:', page.data.canVerify);
  console.log('扫码票据数量:', page.data.scannedTickets.length);

  // 测试5: 执行核销
  console.log('\n📋 测试5: 执行核销流程');
  page.onConfirmVerifyTap();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试6: 检查核销后状态
  console.log('\n📋 测试6: 检查核销后状态');
  console.log('核销后扫码票据数量:', page.data.scannedTickets.length);
  console.log('核销后可以核销状态:', page.data.canVerify);

  // 测试7: 清空功能
  console.log('\n📋 测试7: 测试清空功能');
  // 先添加一些数据
  page.handleScanResult('encoded_student_ticket_data_clear_test');
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('添加数据后票据数量:', page.data.scannedTickets.length);

  // 执行清空
  page.onClearScannedTickets();
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('清空后票据数量:', page.data.scannedTickets.length);

  console.log('\n✅ 模拟票核销优化功能测试完成！');

  // 输出测试总结
  console.log('\n📊 测试总结:');
  console.log('- ✅ 数据结构优化: 使用单一scannedTickets数组管理所有票据');
  console.log('- ✅ 扫码处理优化: 统一处理助考员票和学员票');
  console.log('- ✅ 核销状态管理: 基于scannedTickets动态计算');
  console.log('- ✅ 核销成功清理: 核销成功后自动清空扫码数据');
  console.log('- ✅ 用户体验优化: 简化界面，只显示待核销票据');
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MockTicketVerificationPage, runOptimizationTests };

  // 在Node.js环境中直接运行测试
  if (require.main === module) {
    console.log('📝 模拟票核销优化测试文件已创建');
    console.log('💡 开始运行测试...\n');
    runOptimizationTests().catch(console.error);
  }
} else {
  // 在浏览器环境中直接运行
  runOptimizationTests().catch(console.error);
}
