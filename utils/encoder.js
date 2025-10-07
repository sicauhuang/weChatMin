/**
 * 数据编解码工具
 * 用于二维码数据的编码和解码处理
 */

/**
 * 生成随机字符串
 * @param {number} length 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * UTF-8字符串转字节数组
 * @param {string} str UTF-8字符串
 * @returns {Array} 字节数组
 */
function utf8ToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      // 代理对处理
      i++;
      const hi = code;
      const lo = str.charCodeAt(i);
      const codePoint = 0x10000 + (((hi & 0x3ff) << 10) | (lo & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }
  return bytes;
}

/**
 * 字节数组转UTF-8字符串
 * @param {Array} bytes 字节数组
 * @returns {string} UTF-8字符串
 */
function bytesToUtf8(bytes) {
  let result = '';
  let i = 0;

  while (i < bytes.length) {
    const byte1 = bytes[i++];

    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else if ((byte1 >> 5) === 0x06) {
      const byte2 = bytes[i++];
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else if ((byte1 >> 4) === 0x0e) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      result += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
    } else if ((byte1 >> 3) === 0x1e) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      const byte4 = bytes[i++];
      const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
      const hi = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
      const lo = ((codePoint - 0x10000) % 0x400) + 0xdc00;
      result += String.fromCharCode(hi, lo);
    }
  }

  return result;
}

/**
 * Base64编码（支持UTF-8）
 * @param {string} str 要编码的字符串
 * @returns {string} Base64编码后的字符串
 */
function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = utf8ToBytes(str);
  let result = '';
  let i = 0;

  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
  }

  return result;
}

/**
 * Base64解码（支持UTF-8）
 * @param {string} str Base64编码的字符串
 * @returns {string} 解码后的字符串
 */
function base64Decode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  let i = 0;

  str = str.replace(/[^A-Za-z0-9+/]/g, '');

  while (i < str.length) {
    const encoded1 = chars.indexOf(str.charAt(i++));
    const encoded2 = chars.indexOf(str.charAt(i++));
    const encoded3 = chars.indexOf(str.charAt(i++));
    const encoded4 = chars.indexOf(str.charAt(i++));

    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

    bytes.push((bitmap >> 16) & 255);
    if (encoded3 !== 64) bytes.push((bitmap >> 8) & 255);
    if (encoded4 !== 64) bytes.push(bitmap & 255);
  }

  // 移除末尾的空字节
  while (bytes.length > 0 && bytes[bytes.length - 1] === 0) {
    bytes.pop();
  }

  return bytesToUtf8(bytes);
}

/**
 * 简单哈希函数（用于数据校验）
 * @param {string} str 要哈希的字符串
 * @returns {string} 哈希值
 */
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString(36);

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }

  return Math.abs(hash).toString(36);
}

/**
 * 编码数据
 * @param {Object} data 原始数据
 * @param {Object} options 编码选项
 * @param {number} options.maxAge 数据有效期（毫秒），默认24小时
 * @param {string} options.version 版本号，默认'1.0'
 * @param {number} options.saltLength 盐值长度，默认6
 * @returns {string} 编码后的数据
 */
function encodeData(data, options = {}) {
  try {
    const {
      maxAge = 24 * 60 * 60 * 1000, // 24小时
      version = '1.0',
      saltLength = 6
    } = options;

    // 添加时间戳和随机盐值
    const enhancedData = {
      ...data,
      timestamp: Date.now(),
      salt: generateRandomString(saltLength),
      version: version,
      maxAge: maxAge
    };

    // JSON序列化
    const jsonStr = JSON.stringify(enhancedData);

    // Base64编码
    const encodedData = base64Encode(jsonStr);

    // 生成校验哈希
    const hash = simpleHash(jsonStr);

    // 构建最终数据结构
    const finalData = {
      v: enhancedData.version, // 使用增强数据中的版本号，确保一致性
      d: encodedData,
      h: hash
    };

    return JSON.stringify(finalData);
  } catch (error) {
    console.error('编码数据失败:', error);
    throw new Error('数据编码失败');
  }
}

/**
 * 解码数据
 * @param {string} encodedStr 编码后的数据字符串
 * @param {Object} options 解码选项
 * @param {boolean} options.validateTime 是否验证时间戳，默认true
 * @returns {Object} 解码后的原始数据
 */
function decodeData(encodedStr, options = {}) {
  try {
    const { validateTime = true } = options;

    // 解析数据结构
    const dataStructure = JSON.parse(encodedStr);

    if (!dataStructure.v || !dataStructure.d || !dataStructure.h) {
      throw new Error('数据格式不正确');
    }

    // Base64解码
    const decodedStr = base64Decode(dataStructure.d);

    // 验证哈希
    const calculatedHash = simpleHash(decodedStr);
    if (calculatedHash !== dataStructure.h) {
      throw new Error('数据校验失败');
    }

    // JSON反序列化
    const originalData = JSON.parse(decodedStr);

    // 验证时间戳有效性
    if (validateTime && originalData.timestamp && originalData.maxAge) {
      const now = Date.now();
      const dataTime = originalData.timestamp;
      const maxAge = originalData.maxAge;

      if (now - dataTime > maxAge) {
        throw new Error('数据已过期');
      }
    }

    return originalData;
  } catch (error) {
    console.error('解码数据失败:', error);
    throw error;
  }
}

/**
 * 编码二维码数据（专用于二维码场景）
 * @param {Object} data 原始数据
 * @returns {string} 编码后的数据
 */
function encodeQRData(data) {
  return encodeData(data, {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    version: '1.0',
    saltLength: 6
  });
}

/**
 * 编码短时效二维码数据（专用于模拟票场景）
 * @param {Object} data 原始数据
 * @param {number} maxAge 有效期（毫秒），默认3分钟
 * @returns {string} 编码后的数据
 */
function encodeShortTermQRData(data, maxAge = 3 * 60 * 1000) {
  // 添加精确的生成时间和过期时间
  const generateTime = Date.now();
  const expireTime = generateTime + maxAge;

  const enhancedData = {
    ...data,
    generateTime: generateTime,
    expireTime: expireTime
  };

  return encodeData(enhancedData, {
    maxAge: maxAge,
    version: '1.0',
    saltLength: 6
  });
}

/**
 * 解码二维码数据（专用于二维码场景）
 * @param {string} encodedStr 编码后的数据字符串
 * @returns {Object} 解码后的原始数据
 */
function decodeQRData(encodedStr) {
  return decodeData(encodedStr, {
    validateTime: true
  });
}

/**
 * 验证编码数据的有效性（不解码，仅验证格式和完整性）
 * @param {string} encodedStr 编码后的数据字符串
 * @returns {boolean} 是否有效
 */
function validateEncodedData(encodedStr) {
  try {
    const dataStructure = JSON.parse(encodedStr);

    // 检查基本结构
    if (!dataStructure.v || !dataStructure.d || !dataStructure.h) {
      return false;
    }

    // 尝试解码并验证哈希
    const decodedStr = base64Decode(dataStructure.d);
    const calculatedHash = simpleHash(decodedStr);

    return calculatedHash === dataStructure.h;
  } catch (error) {
    return false;
  }
}

/**
 * 获取编码数据的元信息（不完全解码）
 * @param {string} encodedStr 编码后的数据字符串
 * @returns {Object} 元信息
 */
function getEncodedDataMeta(encodedStr) {
  try {
    const dataStructure = JSON.parse(encodedStr);

    if (!validateEncodedData(encodedStr)) {
      throw new Error('数据格式无效');
    }

    const decodedStr = base64Decode(dataStructure.d);
    const data = JSON.parse(decodedStr);

    return {
      version: dataStructure.v,
      timestamp: data.timestamp,
      maxAge: data.maxAge,
      isExpired: data.timestamp && data.maxAge ?
        (Date.now() - data.timestamp > data.maxAge) : false,
      dataSize: encodedStr.length
    };
  } catch (error) {
    throw new Error('获取元信息失败: ' + error.message);
  }
}

module.exports = {
  // 基础编解码函数
  base64Encode,
  base64Decode,
  simpleHash,
  generateRandomString,

  // 通用编解码函数
  encodeData,
  decodeData,

  // 二维码专用函数
  encodeQRData,
  encodeShortTermQRData,
  decodeQRData,

  // 工具函数
  validateEncodedData,
  getEncodedDataMeta
};
