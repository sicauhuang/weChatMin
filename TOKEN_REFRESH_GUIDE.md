# Token刷新功能实现指南

## 功能概述

根据需求文档中的"token刷新说明"章节，已完成了简化的token自动刷新机制。当用户登录后关闭小程序但未退出，再次进入小程序时，系统会自动检测refreshToken的存在并执行刷新流程，确保用户登录状态的连续性。

## 实现的功能

### 1. 简化的token刷新机制
- **启动时检查**：小程序启动时在`app.js`中自动检查登录状态
- **存在性检测**：只检查refreshToken是否存在，不进行复杂的时效判断
- **透明刷新**：刷新过程对用户完全透明，无需用户干预

### 2. 统一刷新策略
- **存在即刷新**：检测到refreshToken存在就执行刷新流程
- **服务端验证**：将token有效性判断完全交给服务端处理
- **简化逻辑**：避免客户端复杂的时效计算和判断

### 3. 双重保障机制
- **被动刷新**：当API请求返回401时自动刷新token并重试
- **启动刷新**：小程序启动时检测到refreshToken则自动刷新

## 核心文件修改

### 1. utils/auth.js
- 新增 `refreshToken()` 方法：调用后端刷新接口
- 优化 `checkAndHandleLoginStatus()` 方法：集成智能刷新逻辑
- 支持多种刷新场景的处理

### 2. utils/storage.js
- 保留了token时效检测方法（备用，主流程中不使用）
- 主要提供基础的存储管理功能
- 支持refreshToken的存在性检查

### 3. utils/request.js
- 优化token刷新处理逻辑
- 增强错误处理和日志记录
- 确保刷新失败时的正确处理

### 4. app.js
- 启动时自动调用登录状态检查
- 集成token刷新机制

## 刷新流程

### 启动时刷新流程
```
小程序启动
    ↓
检查本地登录状态
    ↓
是否有refreshToken？
    ↓ 是
直接执行刷新流程
    ↓
刷新成功？ → 更新token并刷新用户信息
刷新失败？ → 清除登录状态
    ↓
更新全局状态
```

### API请求时刷新流程
```
发起API请求
    ↓
返回401认证失败？
    ↓ 是
检查refreshToken
    ↓
调用刷新接口
    ↓
刷新成功？
    ↓ 是
重新发起原请求
    ↓ 否
跳转登录页面
```

## 使用方法

### 1. 自动刷新（推荐）
系统会在以下时机自动刷新token：
- 小程序启动时（检测到refreshToken存在）
- API请求返回401时

无需手动调用，完全自动化处理。

### 2. 手动刷新
如果需要手动刷新token：

```javascript
const auth = require('./utils/auth.js');

// 手动刷新token
try {
    const result = await auth.refreshToken();
    console.log('刷新成功:', result);
} catch (error) {
    console.error('刷新失败:', error);
}
```

### 3. 检查登录状态
```javascript
const storage = require('./utils/storage.js');

// 检查是否已登录
const isLoggedIn = storage.isLoggedIn();

// 检查是否有refreshToken
const refreshToken = storage.getRefreshToken();

// 获取完整登录数据
const loginData = storage.getLoginData();
```

## 配置说明

### Token有效期设置
- **AccessToken有效期**：24小时（由服务端控制）
- **RefreshToken有效期**：30天（由服务端控制）
- **刷新策略**：检测到refreshToken存在即刷新

### 简化配置
由于采用了简化的刷新策略，不再需要复杂的时效配置，所有token有效性判断都由服务端处理。

## 错误处理

### 1. 刷新失败处理
- 清除本地认证信息
- 跳转到登录页面
- 显示友好的错误提示

### 2. 网络错误处理
- 自动重试机制
- 降级处理策略
- 用户友好的错误提示

### 3. 无限循环防护
- 避免刷新失败后的无限重试
- 合理的错误边界处理

## 日志记录

系统会记录详细的刷新日志：
- Token状态检查日志
- 刷新过程日志
- 错误处理日志
- 性能监控日志

## 测试验证

### 1. 功能测试
运行测试文件验证功能：
```bash
node test-token-refresh.js
```

### 2. 场景测试
- 正常登录后关闭重开小程序
- Token过期后的自动刷新
- 网络异常时的处理
- RefreshToken过期的处理

## 注意事项

### 1. 安全考虑
- RefreshToken安全存储
- Token传输加密
- 防止Token泄露

### 2. 性能优化
- 避免频繁刷新
- 合理的缓存策略
- 异步处理机制

### 3. 用户体验
- 刷新过程透明化
- 错误提示友好化
- 登录状态连续性

## 后续优化建议

1. **Token预刷新**：在Token过期前更早地进行刷新
2. **离线处理**：支持离线状态下的Token管理
3. **多设备同步**：支持多设备间的Token同步
4. **安全增强**：增加Token指纹验证等安全机制

## 总结

Token刷新功能已完全按照需求文档实现，提供了：
- ✅ 自动检测refreshToken并刷新accessToken
- ✅ 小程序启动时的智能刷新策略
- ✅ API请求失败时的自动重试机制
- ✅ 完善的错误处理和用户体验
- ✅ 详细的日志记录和调试支持

该实现确保了用户登录状态的连续性，提供了良好的用户体验，同时保证了系统的安全性和稳定性。
