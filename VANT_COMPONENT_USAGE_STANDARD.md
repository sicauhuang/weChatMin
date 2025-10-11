# 车小禾项目 Vant Weapp 组件使用标准规范

## 📋 规范目的

为确保车小禾微信小程序项目的稳定性、一致性和可维护性，特制定本Vant Weapp组件使用标准规范。所有开发人员必须严格遵循此规范。

## 🚫 核心约束

### ❌ 严格禁止的使用方式

```javascript
// ❌ 禁止：JavaScript中引入Vant组件
const Toast = require('/@vant/weapp/toast/toast');
import Dialog from '@vant/weapp/dialog/dialog';

// ❌ 禁止：调用Vant组件API
Toast.success('成功');
Dialog.alert({title: '提示'});

// ❌ 禁止：组件实例化和方法调用
this.selectComponent('#van-toast').showToast();
```

### ✅ 标准的使用方式

```json
// ✅ 正确：仅在页面JSON中配置组件
{
  "usingComponents": {
    "van-button": "/@vant/weapp/button/index",
    "van-cell": "/@vant/weapp/cell/index"
  }
}
```

```xml
<!-- ✅ 正确：仅在WXML中声明使用 -->
<van-button type="primary" bind:click="handleClick">
  按钮文字
</van-button>
```

```javascript
// ✅ 正确：仅处理组件事件，使用原生API
handleClick() {
  // 使用微信原生API
  wx.showToast({
    title: '操作成功',
    icon: 'success'
  });
}
```

## 📐 标准使用流程

### 步骤1：组件配置
```json
// pages/xxx/xxx.json
{
  "navigationBarTitleText": "页面标题",
  "usingComponents": {
    "van-button": "/@vant/weapp/button/index",
    "van-cell-group": "/@vant/weapp/cell-group/index",
    "van-cell": "/@vant/weapp/cell/index"
  }
}
```

### 步骤2：页面模板
```xml
<!-- pages/xxx/xxx.wxml -->
<view class="page">
  <van-cell-group>
    <van-cell title="列表项" bind:click="onCellClick" />
  </van-cell-group>
  
  <van-button 
    type="primary" 
    bind:click="onButtonClick"
    custom-style="margin: 20rpx;"
  >
    确认
  </van-button>
</view>
```

### 步骤3：事件处理
```javascript
// pages/xxx/xxx.js
Page({
  onCellClick() {
    // 使用原生API处理交互
    wx.navigateTo({
      url: '/pages/detail/detail'
    });
  },
  
  onButtonClick() {
    // 使用原生API显示提示
    wx.showToast({
      title: '操作成功',
      icon: 'success'
    });
  }
});
```

## 🎯 组件使用范围

### ✅ 推荐使用的Vant组件

| 组件类型 | 组件名称 | 使用场景 | 备注 |
|---------|----------|----------|------|
| **展示组件** | van-cell, van-cell-group | 列表展示 | 替代原生view列表 |
| | van-card | 卡片展示 | 商品信息展示 |
| | van-tag | 标签显示 | 状态标记 |
| | van-image | 图片展示 | 统一图片样式 |
| **表单组件** | van-button | 按钮 | 统一按钮样式 |
| | van-checkbox | 复选框 | 表单选择 |
| | van-radio | 单选框 | 表单选择 |
| | van-field | 输入框 | 表单输入 |
| **状态组件** | van-loading | 加载状态 | 数据加载提示 |
| | van-empty | 空状态 | 无数据展示 |
| **容器组件** | van-popup | 弹窗容器 | 自定义弹窗内容 |
| | van-dialog | 对话框容器 | 仅作为展示容器 |

### ❌ 禁用的组件功能

| 禁用功能 | 原因 | 替代方案 |
|---------|------|----------|
| Toast JavaScript API | API不稳定，路径问题 | `wx.showToast` |
| Dialog JavaScript API | 版本兼容性问题 | `wx.showModal` |
| Notify JavaScript API | 事件绑定复杂 | `wx.showToast` |
| ActionSheet JavaScript API | 原生体验更好 | `wx.showActionSheet` |

## 🔧 交互功能标准实现

### 消息提示
```javascript
// ✅ 正确方式
wx.showToast({
  title: '操作成功',
  icon: 'success',
  duration: 2000
});

wx.showToast({
  title: '操作失败',
  icon: 'error',
  duration: 2000
});
```

### 确认对话框
```javascript
// ✅ 正确方式
wx.showModal({
  title: '确认删除',
  content: '删除后无法恢复，确定要删除吗？',
  confirmText: '删除',
  confirmColor: '#ff4757',
  success: (res) => {
    if (res.confirm) {
      // 确认删除
    }
  }
});
```

### 操作菜单
```javascript
// ✅ 正确方式
wx.showActionSheet({
  itemList: ['拍照', '从相册选择'],
  success: (res) => {
    if (res.tapIndex === 0) {
      // 拍照
    } else if (res.tapIndex === 1) {
      // 从相册选择
    }
  }
});
```

## 🎨 样式定制

### 主题适配
```css
/* ✅ 正确：通过CSS变量定制Vant组件主题 */
.van-button--primary {
  background-color: var(--theme-color-primary) !important;
  border-color: var(--theme-color-primary) !important;
}

.van-cell {
  font-size: var(--theme-font-size-md) !important;
}
```

### 自定义样式
```xml
<!-- ✅ 正确：使用custom-style属性 -->
<van-button 
  custom-style="
    background-color: var(--theme-color-primary);
    border-radius: 50rpx;
    height: 88rpx;
  "
>
  自定义按钮
</van-button>
```

## 🚨 错误示例与修正

### 错误示例1：JavaScript API调用
```javascript
// ❌ 错误
const Toast = require('/@vant/weapp/toast/toast');
Toast.success('成功');

// ✅ 修正
wx.showToast({
  title: '成功',
  icon: 'success'
});
```

### 错误示例2：复杂组件操作
```javascript
// ❌ 错误
import Dialog from '@vant/weapp/dialog/dialog';
Dialog.confirm({
  title: '确认',
  message: '确定要删除吗？'
});

// ✅ 修正
wx.showModal({
  title: '确认',
  content: '确定要删除吗？',
  success: (res) => {
    if (res.confirm) {
      // 处理确认
    }
  }
});
```

## 📊 规范检查清单

开发完成后，请使用以下清单检查代码是否符合规范：

- [ ] 所有Vant组件仅在JSON和WXML中配置使用
- [ ] JavaScript文件中无任何Vant组件的require/import语句
- [ ] JavaScript文件中无任何Vant组件API调用
- [ ] 所有交互功能使用微信原生API实现
- [ ] 组件样式通过CSS变量和custom-style定制
- [ ] 页面功能测试通过，无JavaScript错误

## 🎯 执行要求

1. **强制执行**：此规范为强制性技术标准，所有开发人员必须严格遵循
2. **代码审查**：所有涉及Vant组件的代码提交必须通过规范审查
3. **测试验证**：确保组件使用符合规范且功能正常
4. **文档更新**：新增页面或组件使用必须更新相关文档

## 📈 规范优势

1. **稳定性**：避免Vant组件API兼容性和版本问题
2. **一致性**：确保整个项目UI风格统一
3. **可维护性**：简化组件使用方式，降低维护成本
4. **性能优化**：减少不必要的JavaScript引入和事件绑定
5. **团队协作**：统一开发标准，提高团队协作效率

## 🔄 版本更新

- **v1.0** (2024年): 初始版本，基于登录页面实施经验制定
- 后续版本将根据项目发展和团队反馈持续优化

---

**重要提醒**：本规范基于项目实际开发经验制定，旨在确保项目长期稳定发展。如有疑问或建议，请及时与技术团队沟通。