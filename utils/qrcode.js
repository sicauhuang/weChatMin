/**
 * 二维码生成工具
 * 基于微信小程序canvas实现
 */

/**
 * 生成二维码
 * @param {Object} options 配置选项
 * @param {string} options.text 二维码内容
 * @param {string} options.canvasId canvas元素ID
 * @param {number} options.size 二维码大小，默认200
 * @param {Object} options.context 页面上下文
 * @returns {Promise} 返回生成结果
 */
function generateQRCode(options) {
  return new Promise((resolve, reject) => {
    const {
      text,
      canvasId,
      size = 200,
      context
    } = options;

    if (!text || !canvasId || !context) {
      reject(new Error('缺少必要参数'));
      return;
    }

    try {
      // 使用微信小程序的二维码生成API
      const query = wx.createSelectorQuery().in(context);
      query.select(`#${canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            reject(new Error('找不到canvas元素'));
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');

          // 设置canvas尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = size * dpr;
          canvas.height = size * dpr;
          ctx.scale(dpr, dpr);

          // 使用第三方二维码生成库
          const QRCode = require('./qrcode-lib.js');

          QRCode.toCanvas(canvas, text, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }, (error) => {
            if (error) {
              console.error('二维码生成失败:', error);
              reject(error);
            } else {
              console.log('二维码生成成功');
              resolve({
                canvas,
                canvasId,
                size
              });
            }
          });
        });
    } catch (error) {
      console.error('二维码生成过程出错:', error);
      reject(error);
    }
  });
}

/**
 * 简化版二维码生成（使用微信小程序原生能力）
 * @param {Object} options 配置选项
 * @returns {Promise} 返回生成结果
 */
function generateSimpleQRCode(options) {
  return new Promise((resolve, reject) => {
    const {
      text,
      canvasId,
      size = 200,
      context
    } = options;

    if (!text || !canvasId || !context) {
      reject(new Error('缺少必要参数'));
      return;
    }

    try {
      // 获取canvas实例
      const query = wx.createSelectorQuery().in(context);
      query.select(`#${canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            reject(new Error('找不到canvas元素'));
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');

          // 设置canvas尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = size * dpr;
          canvas.height = size * dpr;
          ctx.scale(dpr, dpr);

          // 简单的二维码模拟（实际项目中应使用专业的二维码库）
          drawSimpleQRCode(ctx, text, size);

          resolve({
            canvas,
            canvasId,
            size,
            text
          });
        });
    } catch (error) {
      console.error('简单二维码生成失败:', error);
      reject(error);
    }
  });
}

/**
 * 绘制简单的二维码模拟图案
 * @param {Object} ctx canvas上下文
 * @param {string} text 二维码内容
 * @param {number} size 尺寸
 */
function drawSimpleQRCode(ctx, text, size) {
  const gridSize = 8; // 网格大小
  const cellSize = size / gridSize;

  // 清空画布
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // 绘制边框
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  // 绘制模拟的二维码图案
  ctx.fillStyle = '#000000';

  // 根据文本内容生成伪随机图案
  const hash = simpleHash(text);
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const index = i * gridSize + j;
      if ((hash + index) % 3 === 0) {
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }

  // 绘制定位点
  drawPositionMarker(ctx, 0, 0, cellSize);
  drawPositionMarker(ctx, (gridSize - 3) * cellSize, 0, cellSize);
  drawPositionMarker(ctx, 0, (gridSize - 3) * cellSize, cellSize);
}

/**
 * 绘制定位标记
 * @param {Object} ctx canvas上下文
 * @param {number} x x坐标
 * @param {number} y y坐标
 * @param {number} cellSize 单元格大小
 */
function drawPositionMarker(ctx, x, y, cellSize) {
  const size = cellSize * 3;

  // 外框
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, size, size);

  // 内框
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + cellSize * 0.5, y + cellSize * 0.5, size - cellSize, size - cellSize);

  // 中心点
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + cellSize, y + cellSize, cellSize, cellSize);
}

/**
 * 简单哈希函数
 * @param {string} str 输入字符串
 * @returns {number} 哈希值
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
}

/**
 * 保存二维码到相册
 * @param {string} canvasId canvas元素ID
 * @param {Object} context 页面上下文
 * @returns {Promise} 保存结果
 */
function saveQRCodeToAlbum(canvasId, context) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvasId: canvasId,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            console.error('保存到相册失败:', error);
            if (error.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '提示',
                content: '需要授权访问相册才能保存图片',
                showCancel: false
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
            reject(error);
          }
        });
      },
      fail: (error) => {
        console.error('生成临时文件失败:', error);
        reject(error);
      }
    }, context);
  });
}

/**
 * 格式化票据数据为二维码内容
 * @param {Object} ticket 票据信息
 * @returns {string} 格式化后的二维码内容
 */
function formatTicketQRData(ticket) {
  const qrData = {
    type: 'mock-ticket',
    ticketId: ticket.id,
    orderNumber: ticket.orderNumber,
    studentName: ticket.studentName,
    studentPhone: ticket.studentPhone,
    appointmentDate: ticket.appointmentDate,
    simulationArea: ticket.simulationArea,
    timestamp: Date.now()
  };

  return JSON.stringify(qrData);
}

module.exports = {
  generateQRCode,
  generateSimpleQRCode,
  saveQRCodeToAlbum,
  formatTicketQRData
};
