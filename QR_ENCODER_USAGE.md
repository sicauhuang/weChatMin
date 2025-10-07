# 二维码编解码工具使用指南

## 概述

本项目实现了模拟票二维码功能的优化，将敏感数据进行编码处理后存储到二维码中，提高了数据安全性。编解码功能已分离到独立的工具文件中，方便后续扫码应用使用。

## 文件结构

```
utils/
├── encoder.js      # 编解码核心工具
├── qrcode.js       # 二维码生成工具（已集成编码功能）
└── weapp.qrcode.common.js  # 第三方二维码库
```

## 核心功能

### 1. 数据编码

将原始数据进行Base64编码、添加时间戳、盐值和校验哈希，确保数据安全性和完整性。

### 2. 数据解码

验证数据完整性、检查过期时间，并还原原始数据。

### 3. 数据验证

不完全解码的情况下验证数据格式和完整性。

## 使用方法

### 在小程序中生成编码二维码

```javascript
// 引入二维码工具
const qrcode = require('../../utils/qrcode.js');

// 票据数据
const ticket = {
  id: 'T123456',
  orderNumber: 'ORD789',
  studentName: '张三',
  studentPhone: '13800138000',
  appointmentDate: '2024-01-15 10:00',
  simulationArea: 'A区'
};

// 生成编码后的二维码数据
const qrData = qrcode.formatTicketQRData(ticket, true); // true表示使用编码

// 生成二维码
await qrcode.generateQRCode({
  text: qrData,
  canvasId: 'qrcode-canvas',
  size: 200,
  context: this,
  callback: () => {
    console.log('二维码生成完成');
  }
});
```

### 在扫码应用中解码数据

```javascript
// 引入编解码工具
const encoder = require('./utils/encoder.js');
// 或者使用二维码工具中的封装函数
const qrcode = require('./utils/qrcode.js');

// 扫码获得的数据
const scannedData = '{"v":"1.0","d":"eyJ0eXBlIjoi...","h":"abc123"}';

try {
  // 方法1: 直接使用编解码工具
  const decodedData = encoder.decodeQRData(scannedData);

  // 方法2: 使用二维码工具的封装函数
  const decodedData = qrcode.decodeQRData(scannedData);

  console.log('解码成功:', decodedData);
  // 输出: { type: 'mock-ticket', ticketId: 'T123456', ... }

} catch (error) {
  console.error('解码失败:', error.message);
  // 可能的错误: 数据格式不正确、数据校验失败、数据已过期
}
```

### 验证数据有效性

```javascript
// 快速验证数据格式和完整性（不解码）
const isValid = qrcode.validateQRData(scannedData);
if (isValid) {
  console.log('数据格式有效');
} else {
  console.log('数据格式无效');
}

// 获取数据元信息
try {
  const meta = qrcode.getQRDataMeta(scannedData);
  console.log('数据元信息:', meta);
  // 输出: { version: '1.0', timestamp: 1640995200000, maxAge: 86400000, isExpired: false, dataSize: 256 }
} catch (error) {
  console.error('获取元信息失败:', error.message);
}
```

## 编码数据结构

### 原始数据格式
```javascript
{
  type: 'mock-ticket',
  ticketId: 'T123456',
  orderNumber: 'ORD789',
  studentName: '张三',
  studentPhone: '13800138000',
  appointmentDate: '2024-01-15 10:00',
  simulationArea: 'A区'
}
```

### 编码后数据格式
```javascript
{
  v: '1.0',                    // 版本号
  d: 'eyJ0eXBlIjoi...',        // Base64编码的数据
  h: 'abc123'                  // 数据校验哈希
}
```

### 增强数据格式（编码前）
```javascript
{
  // 原始数据
  type: 'mock-ticket',
  ticketId: 'T123456',
  // ... 其他原始字段

  // 自动添加的字段
  timestamp: 1640995200000,    // 生成时间戳
  salt: 'Xy9mK2',             // 随机盐值
  version: '1.0',             // 版本号
  maxAge: 86400000            // 有效期（毫秒）
}
```

## 安全特性

### 1. 数据混淆
- 使用Base64编码对敏感信息进行基础混淆
- 添加随机盐值增强数据唯一性

### 2. 完整性校验
- 使用哈希函数验证数据完整性
- 防止数据被篡改

### 3. 时效性控制
- 自动添加时间戳和有效期
- 默认24小时有效期，防止二维码被长期滥用

### 4. 版本控制
- 支持版本标识，便于后续功能升级
- 保持向后兼容性

## 配置选项

### 编码选项
```javascript
const options = {
  maxAge: 24 * 60 * 60 * 1000,  // 有效期，默认24小时
  version: '1.0',               // 版本号
  saltLength: 6                 // 盐值长度
};

const encodedData = encoder.encodeData(data, options);
```

### 解码选项
```javascript
const options = {
  validateTime: true  // 是否验证时间戳，默认true
};

const decodedData = encoder.decodeData(encodedStr, options);
```

## 错误处理

### 常见错误类型
1. **数据格式不正确**: 二维码数据结构不符合预期
2. **数据校验失败**: 数据被篡改或损坏
3. **数据已过期**: 超过设定的有效期
4. **数据编码失败**: 编码过程中出现异常

### 错误处理示例
```javascript
try {
  const decodedData = qrcode.decodeQRData(scannedData);
  // 处理成功解码的数据
} catch (error) {
  switch (error.message) {
    case '数据格式不正确':
      // 处理格式错误
      break;
    case '数据校验失败':
      // 处理数据被篡改的情况
      break;
    case '数据已过期':
      // 处理过期数据
      break;
    default:
      // 处理其他错误
      console.error('未知错误:', error.message);
  }
}
```

## 最佳实践

### 1. 数据最小化
- 只在二维码中存储必要的标识信息
- 敏感详细信息通过后端接口查询

### 2. 错误处理
- 始终使用try-catch包装解码操作
- 提供友好的错误提示给用户

### 3. 性能优化
- 使用验证函数快速检查数据有效性
- 避免不必要的完整解码操作

### 4. 兼容性
- 保留不编码的选项，支持旧版本
- 使用版本号管理功能升级

## 扩展功能

### 自定义编码算法
如需更强的安全性，可以在 `encoder.js` 中添加AES等加密算法：

```javascript
// 示例：添加AES加密（需要引入加密库）
function encodeWithAES(data, key) {
  // 实现AES加密逻辑
}
```

### 批量处理
```javascript
// 批量编码多个票据
const tickets = [ticket1, ticket2, ticket3];
const encodedTickets = tickets.map(ticket =>
  qrcode.formatTicketQRData(ticket, true)
);
```

## 注意事项

1. **数据大小**: 编码后的数据会比原始数据大，注意二维码容量限制
2. **时区处理**: 时间戳使用UTC时间，注意时区转换
3. **版本兼容**: 升级编码算法时保持向后兼容
4. **密钥管理**: 如使用加密算法，注意密钥的安全管理

## 测试建议

### 单元测试
```javascript
// 测试编解码功能
const testData = { type: 'test', id: '123' };
const encoded = encoder.encodeQRData(testData);
const decoded = encoder.decodeQRData(encoded);
console.assert(decoded.id === testData.id, '编解码测试失败');
```

### 集成测试
- 测试完整的二维码生成和扫码流程
- 验证不同设备间的兼容性
- 测试边界条件（过期数据、损坏数据等）
