/**
 * 二维码生成工具
 * 基于 weapp-qrcode 库实现前端二维码绘制
 */

// 引入 weapp-qrcode 库
const drawQrcode = require('./weapp.qrcode.common.js');
// 引入编解码工具
const encoder = require('./encoder.js');

/**
 * 生成二维码
 * @param {Object} options 配置选项
 * @param {string} options.text 二维码内容
 * @param {string} options.canvasId canvas元素ID
 * @param {number} options.size 二维码大小，默认200
 * @param {Object} options.context 页面上下文
 * @param {Function} options.callback 绘制完成回调
 * @returns {Promise} 返回生成结果
 */
function generateQRCode(options) {
  return new Promise((resolve, reject) => {
    const {
      text,
      canvasId,
      size = 200,
      context,
      callback
    } = options;

    if (!text || !canvasId || !context) {
      reject(new Error('缺少必要参数：text, canvasId, context'));
      return;
    }

    try {
      console.log('使用 weapp-qrcode 生成二维码:', { text, canvasId, size });

      // 延迟执行，确保 Canvas 元素已经渲染
      setTimeout(() => {
        // 使用 weapp-qrcode 的 drawQrcode 方法
        drawQrcode({
          canvasId: canvasId,
          _this: context,
          text: text,
          width: size,
          height: size,
          x: 0,
          y: 0,
          typeNumber: -1, // 自动选择类型
          correctLevel: 1, // 错误纠正级别 L
          background: '#ffffff',
          foreground: '#000000',
          callback: function(res) {
            // weapp-qrcode 调用 callback 就表示绘制完成
            console.log('二维码绘制完成:', res);

            // 执行外部回调
            if (callback && typeof callback === 'function') {
              callback();
            }

            resolve({
              canvasId,
              size,
              text
            });
          }
        });
      }, 100);
    } catch (error) {
      console.error('二维码生成过程出错:', error);
      reject(error);
    }
  });
}

/**
 * 保存二维码到相册
 * @param {string} canvasId canvas元素ID
 * @param {Object} context 页面上下文
 * @returns {Promise} 保存结果
 */
function saveQRCodeToAlbum(canvasId, context) {
  return new Promise((resolve, reject) => {
    console.log('保存二维码到相册:', canvasId);

    wx.canvasToTempFilePath({
      canvasId: canvasId,
      success: (res) => {
        console.log('Canvas 转换临时文件成功:', res.tempFilePath);

        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            console.log('保存到相册成功');
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            });
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            console.error('保存到相册失败:', error);

            if (error.errMsg && error.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '提示',
                content: '需要授权访问相册才能保存图片，请在设置中开启相册权限',
                showCancel: false,
                confirmText: '知道了'
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none',
                duration: 2000
              });
            }
            reject(error);
          }
        });
      },
      fail: (error) => {
        console.error('Canvas 转换临时文件失败:', error);
        wx.showToast({
          title: '生成图片失败',
          icon: 'none',
          duration: 2000
        });
        reject(error);
      }
    }, context);
  });
}


/**
 * 格式化票据数据为二维码内容（优化版本）
 * @param {Object} ticket 票据信息
 * @param {boolean} useEncoding 是否使用编码，默认true
 * @returns {string} 格式化后的二维码内容
 */
function formatTicketQRData(ticket, useEncoding = true) {
  const qrData = {
    type: 'mock-ticket',
    ticketId: ticket.id,
    orderNumber: ticket.orderNumber,
    studentName: ticket.studentName,
    studentPhone: ticket.studentPhone,
    appointmentDate: ticket.appointmentDate,
    simulationArea: ticket.simulationArea
  };

  if (useEncoding) {
    // 使用新的编码工具
    return encoder.encodeQRData(qrData);
  } else {
    // 兼容旧版本，不编码
    return JSON.stringify({
      ...qrData,
      timestamp: Date.now()
    });
  }
}

/**
 * 通用二维码数据格式化方法
 * @param {Object} data 原始数据
 * @param {Object} options 配置选项
 * @param {string} options.type 二维码类型，默认'general'
 * @param {number} options.maxAge 有效期（毫秒），默认3分钟
 * @returns {string} 格式化后的二维码内容
 */
function formatQRData(data, options = {}) {
  const {
    type = 'general',
    maxAge = 3 * 60 * 1000 // 默认3分钟
  } = options;

  const qrData = {
    type: type,
    ...data
  };

  // 统一使用短时效编码
  return encoder.encodeShortTermQRData(qrData, maxAge);
}

/**
 * 格式化票据数据为短时效二维码内容（专用于模拟票场景）
 * @param {Object} ticket 票据信息
 * @param {number} maxAge 有效期（毫秒），默认3分钟
 * @returns {string} 格式化后的二维码内容
 */
function formatShortTermTicketQRData(ticket, maxAge = 3 * 60 * 1000) {
  return formatQRData({
    ticketId: ticket.id,
    studentName: ticket.studentName,
    studentPhone: ticket.studentPhone,
    appointmentDate: ticket.appointmentDate,
    simulationArea: ticket.simulationArea
  }, {
    type: 'mock-ticket',
    maxAge: maxAge
  });
}

/**
 * 格式化用户个人信息二维码数据（3分钟有效期）
 * @param {Object} userInfo 用户信息
 * @param {number} maxAge 有效期（毫秒），默认3分钟
 * @returns {string} 格式化后的二维码内容
 */
function formatUserProfileQRData(userInfo, maxAge = 3 * 60 * 1000) {
  return formatQRData(userInfo, {
    type: 'user-profile',
    maxAge: maxAge
  });
}

/**
 * 格式化用户模拟票二维码数据（3分钟有效期）
 * @param {Object} userInfo 用户信息
 * @param {number} maxAge 有效期（毫秒），默认3分钟
 * @returns {string} 格式化后的二维码内容
 */
function formatUserTicketQRData(userInfo, maxAge = 3 * 60 * 1000) {
  return formatQRData(userInfo, {
    type: 'mock-ticket-user',
    maxAge: maxAge
  });
}

/**
 * 解码二维码数据（供扫码使用）
 * @param {string} encodedStr 编码后的数据字符串
 * @returns {Object} 解码后的原始数据
 */
function decodeQRData(encodedStr) {
  return encoder.decodeQRData(encodedStr);
}

/**
 * 验证二维码数据有效性
 * @param {string} encodedStr 编码后的数据字符串
 * @returns {boolean} 是否有效
 */
function validateQRData(encodedStr) {
  return encoder.validateEncodedData(encodedStr);
}

/**
 * 获取二维码数据元信息
 * @param {string} encodedStr 编码后的数据字符串
 * @returns {Object} 元信息
 */
function getQRDataMeta(encodedStr) {
  return encoder.getEncodedDataMeta(encodedStr);
}

module.exports = {
  generateQRCode,
  saveQRCodeToAlbum,

  // 通用方法（默认3分钟短时效）
  formatQRData,

  // 具体场景方法（都是3分钟短时效）
  formatTicketQRData,
  formatShortTermTicketQRData,
  formatUserProfileQRData,
  formatUserTicketQRData,

  // 解码相关
  decodeQRData,
  validateQRData,
  getQRDataMeta
};
