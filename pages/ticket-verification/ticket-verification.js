/**
 * 模拟票核销页面
 * 展示已核销的模拟票列表，提供核销功能入口
 */

const { decodeQRData } = require('../../utils/encoder.js');
const request = require('../../utils/request.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 核销优化：简化数据结构，只保留扫码后的票据
    scannedTickets: [], // 扫描的所有票据（包含助考员票和学员票）
    studentTicketCount: 0, // 学员票数量统计

    // 核销状态
    canVerify: false, // 是否可以核销
    verifyLoading: false, // 核销中状态

    // 开发模式：mock数据开关
    isDevelopMode: true, // 设置为false可关闭mock数据
    mockScannedTickets: [
      // 助考员票
      {
        type: 'assist-ticket',
        userId: 'assistant_001',
        assistantName: '王助考',
        assistantPhone: '137****7777',
        workNumber: 'ZK001',
        department: '考试管理部',
        expireTime: Date.now() + 3 * 60 * 1000
      },
      // 学员票1
      {
        type: 'mock-ticket',
        ticketId: 'MT202410060001',
        studentName: '张三',
        studentPhone: '138****8888',
        packageName: '科目二模拟考试套餐A',
        idCard: '110101199001011234',
        simulationArea: 'A区3号场地',
        appointmentDate: '2024-10-06 14:00',
        drivingSchool: '阳光驾校',
        coachName: '李师傅',
        coachPhone: '139****9999',
        expireTime: Date.now() + 3 * 60 * 1000
      },
      // 学员票2
      {
        type: 'mock-ticket',
        ticketId: 'MT202410060002',
        studentName: '李四',
        studentPhone: '136****6666',
        packageName: '科目三模拟考试套餐B',
        idCard: '110101199002022345',
        simulationArea: 'B区1号场地',
        appointmentDate: '2024-10-06 15:30',
        drivingSchool: '蓝天驾校',
        coachName: '张教练',
        coachPhone: '138****7777',
        expireTime: Date.now() + 3 * 60 * 1000
      },
      // 学员票3
      {
        type: 'mock-ticket',
        ticketId: 'MT202410060003',
        studentName: '王五',
        studentPhone: '135****5555',
        packageName: 'VIP模拟考试套餐',
        idCard: '110101199003033456',
        simulationArea: 'C区2号场地',
        appointmentDate: '2024-10-06 16:00',
        drivingSchool: '阳光驾校',
        coachName: '刘师傅',
        coachPhone: '137****8888',
        expireTime: Date.now() + 3 * 60 * 1000
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('模拟票核销页面加载');
    this.initPage();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('模拟票核销页面渲染完成');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('模拟票核销页面显示');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('模拟票核销页面隐藏');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('模拟票核销页面卸载');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.refreshData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('上拉加载更多');
    this.loadMoreData();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '模拟票核销',
      path: '/pages/ticket-verification/ticket-verification'
    };
  },

  /**
   * 初始化页面
   */
  initPage() {
    console.log('初始化模拟票核销页面');
    // 这里可以添加页面初始化逻辑
    // 比如检查权限、获取用户信息等

    // 开发模式：加载mock数据
    if (this.data.isDevelopMode) {
      this.loadMockData();
    }
  },

  /**
   * 加载Mock数据（仅开发模式）
   */
  loadMockData() {
    console.log('🔧 开发模式：加载Mock数据');

    const mockData = [...this.data.mockScannedTickets];

    // 为Mock数据添加扫码时间戳（模拟不同的扫码时间）
    mockData.forEach((ticket, index) => {
      ticket.scanTime = Date.now() - (mockData.length - index) * 1000; // 模拟不同时间扫码
    });

    // 核销优化：对Mock数据进行排序，确保助考员票据在最后
    const sortedMockData = this.sortScannedTickets(mockData);

    this.setData({
      scannedTickets: sortedMockData
    });

    // 更新核销状态
    this.updateVerifyStatus();

    console.log('✅ Mock数据加载完成，包含：');
    console.log('- 助考员票：', sortedMockData.filter(t => t.type === 'assist-ticket').length, '张');
    console.log('- 学员票：', sortedMockData.filter(t => t.type === 'mock-ticket').length, '张');
    console.log('- 助考员票已排在最后');

    wx.showToast({
      title: '已加载Mock数据',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 切换开发模式
   */
  toggleDevelopMode() {
    const newMode = !this.data.isDevelopMode;

    // 先更新开发模式状态
    this.setData({
      isDevelopMode: newMode
    });

    if (newMode) {
      // 开启开发模式：加载并排序Mock数据
      this.loadMockData();
    } else {
      // 关闭开发模式：清空数据
      this.setData({
        scannedTickets: [],
        canVerify: false,
        studentTicketCount: 0
      });

      wx.showToast({
        title: '已关闭开发模式',
        icon: 'success',
        duration: 1500
      });
    }

    console.log('🔧 开发模式已', newMode ? '开启' : '关闭');
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      this.setData({
        loading: true
      });

      console.log('刷新核销票据数据');

      // 模拟刷新数据
      await this.simulateDataRefresh();

      // 停止下拉刷新
      wx.stopPullDownRefresh();

      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });

    } catch (error) {
      console.error('刷新数据失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  /**
   * 加载更多数据
   */
  async loadMoreData() {
    if (!this.data.hasMore || this.data.loading) {
      return;
    }

    try {
      this.setData({
        loading: true
      });

      console.log('加载更多核销票据数据');

      // 模拟加载更多数据
      await this.simulateLoadMore();

    } catch (error) {
      console.error('加载更多数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  /**
   * 模拟数据刷新
   */
  simulateDataRefresh() {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('模拟数据刷新完成');
        resolve();
      }, 1000);
    });
  },

  /**
   * 模拟加载更多数据
   */
  simulateLoadMore() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟没有更多数据
        this.setData({
          hasMore: false
        });

        wx.showToast({
          title: '没有更多数据',
          icon: 'none',
          duration: 1500
        });

        console.log('模拟加载更多完成');
        resolve();
      }, 1000);
    });
  },

  /**
   * 核销按钮点击事件
   * 实现扫码功能，解码二维码数据并打印结果
   */
  onVerifyTap() {
    console.log('点击核销按钮，开始扫码流程');

    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });

    // 调起扫码功能
    wx.scanCode({
      onlyFromCamera: true, // 只允许从相机扫码
      scanType: ['qrCode'], // 只扫描二维码
      success: (res) => {
        console.log('扫码成功，获取到数据:', res.result);
        this.handleScanResult(res.result);
      },
      fail: (error) => {
        console.error('扫码失败:', error);
        wx.showToast({
          title: '扫码失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 处理扫码结果
   * @param {string} scanResult 扫码获取的原始数据
   */
  handleScanResult(scanResult) {
    console.log('开始处理扫码结果:', scanResult);

    try {
      // 使用解码函数解析二维码数据
      const decodedData = decodeQRData(scanResult);

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
      console.error('原始扫码数据:', scanResult);
      console.error('========================');

      // 根据错误类型显示不同的提示信息
      let errorMessage = '二维码解码失败';
      if (error.message.includes('数据已过期')) {
        errorMessage = '二维码已过期，请重新生成';
      } else if (error.message.includes('数据格式不正确')) {
        errorMessage = '二维码格式不正确';
      } else if (error.message.includes('数据校验失败')) {
        errorMessage = '二维码数据校验失败';
      } else if (error.message.includes('不支持的票据类型')) {
        errorMessage = '不支持的票据类型';
      }

      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 处理学员票
   * @param {Object} ticketData 学员票数据
   */
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
      wx.showToast({
        title: '已更新该学员票据',
        icon: 'success',
        duration: 1500
      });
    } else {
      // 检查学员票数量限制（最多4张）
      const studentTicketCount = scannedTickets.filter(ticket => ticket.type === 'mock-ticket').length;
      if (studentTicketCount >= 4) {
        wx.showToast({
          title: '学员票数量已达上限(4张)',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 添加扫码时间戳
      ticketData.scanTime = Date.now();

      // 添加新票据
      scannedTickets.push(ticketData);
      wx.showToast({
        title: '学员票添加成功',
        icon: 'success',
        duration: 1500
      });
    }

    // 核销优化：重新排序票据，确保助考员票据始终在最后
    const sortedTickets = this.sortScannedTickets(scannedTickets);

    this.setData({
      scannedTickets: sortedTickets
    });
  },

  /**
   * 处理助考员票
   * @param {Object} ticketData 助考员票数据
   */
  handleAssistantTicket(ticketData) {
    let scannedTickets = [...this.data.scannedTickets];

    // 移除已存在的助考员票（只能有一个）
    scannedTickets = scannedTickets.filter(ticket => ticket.type !== 'assist-ticket');

    // 添加扫码时间戳
    ticketData.scanTime = Date.now();

    // 添加新的助考员票
    scannedTickets.push(ticketData);

    // 核销优化：重新排序票据，确保助考员票据始终在最后
    const sortedTickets = this.sortScannedTickets(scannedTickets);

    this.setData({
      scannedTickets: sortedTickets
    });

    wx.showToast({
      title: '助考员信息已更新',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 核销优化：票据排序方法
   * 确保助考员票据始终显示在最后，学员票按扫码时间排序
   * @param {Array} tickets 票据数组
   * @returns {Array} 排序后的票据数组
   */
  sortScannedTickets(tickets) {
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
  },

  /**
   * 更新学员票数量统计
   */
  updateStudentTicketCount() {
    const { scannedTickets } = this.data;
    const studentTicketCount = scannedTickets.filter(ticket => ticket.type === 'mock-ticket').length;

    this.setData({
      studentTicketCount
    });
  },

  /**
   * 更新核销状态
   */
  updateVerifyStatus() {
    const { scannedTickets } = this.data;

    // 统计助考员票和学员票数量
    const assistantTickets = scannedTickets.filter(ticket => ticket.type === 'assist-ticket');
    const studentTickets = scannedTickets.filter(ticket => ticket.type === 'mock-ticket');

    const canVerify = assistantTickets.length === 1 &&
                     studentTickets.length >= 1 &&
                     studentTickets.length <= 4;

    this.setData({ canVerify });

    // 同时更新学员票数量统计
    this.updateStudentTicketCount();
  },

  /**
   * 确认核销按钮点击事件
   * 显示确认对话框，用户确认后执行核销逻辑
   */
  onConfirmVerifyTap() {
    console.log('点击确认核销按钮');

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

      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });

    // 构建确认信息
    const studentNames = studentTickets.map(t => t.studentName).join('、');
    const assistantName = assistantTickets[0].assistantName;

    const content = `确认核销以下票据？\n\n助考员：${assistantName}\n学员：${studentNames}`;

    wx.showModal({
      content,
      confirmText: '确认核销',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认执行核销操作');
          this.executeVerify();
        } else {
          console.log('用户取消核销操作');
        }
      },
      fail: (error) => {
        console.error('显示确认对话框失败:', error);
      }
    });
  },

  /**
   * 执行核销操作
   */
  async executeVerify() {
    try {
      this.setData({ verifyLoading: true });

      wx.showLoading({
        title: '核销中...',
        mask: true
      });

      const { scannedTickets } = this.data;
      const assistantTickets = scannedTickets.filter(ticket => ticket.type === 'assist-ticket');
      const studentTickets = scannedTickets.filter(ticket => ticket.type === 'mock-ticket');

      const response = await request.post('/api/ticket/verify', {
        assistantUserId: assistantTickets[0].userId,
        ticketIdList: studentTickets.map(t => t.ticketId)
      }, {
        needAuth: true,
        showLoading: false
      });

      wx.hideLoading();

      if (response.success) {
        wx.showToast({
          title: '核销成功',
          icon: 'success',
          duration: 2000
        });

        // 核销优化：清空扫码数据
        this.setData({
          scannedTickets: [],
          canVerify: false,
          studentTicketCount: 0
        });

        console.log('核销成功，已清空扫码数据');
      } else {
        throw new Error(response.message || '核销失败');
      }

    } catch (error) {
      wx.hideLoading();
      console.error('核销失败:', error);

      wx.showModal({
        title: '核销失败',
        content: error.message || '网络错误，请稍后重试',
        showCancel: false,
        confirmText: '确定'
      });
    } finally {
      this.setData({ verifyLoading: false });
    }
  },

  /**
   * 删除单个票据
   * @param {Object} event 事件对象
   */
  onDeleteTicket(event) {
    const index = event.currentTarget.dataset.index;
    const ticket = this.data.scannedTickets[index];

    if (!ticket) {
      console.error('票据不存在，索引:', index);
      return;
    }

    const ticketType = ticket.type === 'assist-ticket' ? '助考员' : '学员';
    const ticketName = ticket.type === 'assist-ticket'
      ? ticket.assistantName
      : ticket.studentName;

    wx.showModal({
      content: `确认取消录入${ticketType}票据"${ticketName}"？`,
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.deleteTicketByIndex(index);
        }
      }
    });
  },

  /**
   * 根据索引删除票据
   * @param {number} index 票据索引
   */
  deleteTicketByIndex(index) {
    let scannedTickets = [...this.data.scannedTickets];
    const deletedTicket = scannedTickets[index];

    // 删除指定索引的票据
    scannedTickets.splice(index, 1);

    this.setData({
      scannedTickets
    });

    // 更新核销状态
    this.updateVerifyStatus();

    const ticketType = deletedTicket.type === 'assist-ticket' ? '助考员' : '学员';

    wx.showToast({
      title: `${ticketType}票据已删除`,
      icon: 'success',
      duration: 1500
    });

    console.log(`已删除${ticketType}票据:`, deletedTicket);
  },

  /**
   * 清空待核销票据
   */
  onClearScannedTickets() {
    wx.showModal({
      content: '确认清空所有待核销票据？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            scannedTickets: [],
            canVerify: false,
            studentTicketCount: 0
          });

          wx.showToast({
            title: '已清空',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

});
