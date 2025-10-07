# 模拟票核销Mock数据使用指南

## 📋 功能概述

为了方便样式调整和功能测试，我们在模拟票核销页面中添加了Mock数据功能。该功能可以快速加载包含助考员票和学员票的测试数据，无需实际扫码即可查看页面效果。

## 🎯 Mock数据内容

### 助考员票数据
```javascript
{
  type: 'assist-ticket',
  userId: 'assistant_001',
  assistantName: '王助考',
  assistantPhone: '137****7777',
  workNumber: 'ZK001',
  department: '考试管理部',
  expireTime: Date.now() + 3 * 60 * 1000
}
```

### 学员票数据（3张）
```javascript
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
}

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
}

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
```

## 🔧 使用方法

### 1. 开启Mock数据
- 进入模拟票核销页面
- 页面会自动加载Mock数据（默认开启开发模式）
- 右上角会显示"关闭Mock"按钮

### 2. 关闭Mock数据
- 点击右上角的"关闭Mock"按钮
- 页面会清空所有数据，显示空状态
- 按钮文字变为"开启Mock"

### 3. 重新开启Mock数据
- 在空状态下，点击右上角的"开启Mock"按钮
- 页面会重新加载Mock数据
- 按钮文字变为"关闭Mock"

## 🎨 样式验证要点

使用Mock数据可以验证以下样式效果：

### 1. 助考员票样式
- ✅ **金色渐变背景**：使用主题色的渐变效果
- ✅ **白色文字**：确保在金色背景上的可读性
- ✅ **特殊图标**：助考员专用的图标显示
- ✅ **突出效果**：阴影和光晕效果
- ✅ **信息布局**：姓名和电话的排版

### 2. 学员票样式
- ✅ **白色卡片背景**：与助考员票形成对比
- ✅ **常规文字颜色**：使用主题文字颜色
- ✅ **学员票图标**：票据专用图标
- ✅ **信息行布局**：标签和值的对齐
- ✅ **边框和阴影**：卡片的立体效果

### 3. 混合显示效果
- ✅ **视觉层次**：助考员票和学员票的区分度
- ✅ **卡片间距**：票据之间的间距是否合适
- ✅ **滚动体验**：长列表的滚动是否流畅
- ✅ **响应式布局**：不同屏幕尺寸的适配

### 4. 交互状态
- ✅ **核销按钮状态**：有数据时按钮应该可用
- ✅ **数量显示**：右上角显示"4张"
- ✅ **清空功能**：点击删除按钮的效果
- ✅ **确认核销**：点击确认核销的弹窗内容

## 🔍 开发模式控制

### 代码控制
在 `pages/ticket-verification/ticket-verification.js` 中：

```javascript
data: {
  isDevelopMode: true, // 设置为false可关闭mock数据
  // ...
}
```

### 功能说明
- `isDevelopMode: true` - 页面加载时自动加载Mock数据
- `isDevelopMode: false` - 页面加载时不加载Mock数据
- 可通过右上角按钮动态切换

## 📱 测试场景

### 1. 样式调整测试
1. 开启Mock数据
2. 查看助考员票的金色背景效果
3. 查看学员票的白色卡片效果
4. 验证票据间的视觉区分度
5. 测试不同屏幕尺寸的显示效果

### 2. 交互功能测试
1. 验证核销按钮状态（应该可用）
2. 点击确认核销，查看弹窗内容
3. 测试清空功能
4. 验证数量显示是否正确

### 3. 响应式测试
1. 在不同设备上查看显示效果
2. 测试横屏和竖屏的适配
3. 验证字体大小和间距

## 🚀 生产环境部署

在生产环境中，建议：

1. **关闭开发模式**
   ```javascript
   data: {
     isDevelopMode: false, // 生产环境关闭
   }
   ```

2. **移除Mock数据**
   - 可以保留Mock数据结构用于测试
   - 但确保 `isDevelopMode` 为 `false`

3. **隐藏开发按钮**
   - 开发按钮会根据 `isDevelopMode` 自动隐藏
   - 生产环境用户不会看到切换按钮

## 💡 使用建议

1. **样式调整时**：开启Mock数据，快速查看效果
2. **功能测试时**：使用Mock数据验证交互逻辑
3. **真机测试时**：关闭Mock数据，测试实际扫码功能
4. **演示展示时**：开启Mock数据，展示完整功能

## 🔧 自定义Mock数据

如需修改Mock数据，可以在 `pages/ticket-verification/ticket-verification.js` 中的 `mockScannedTickets` 数组中进行调整：

```javascript
mockScannedTickets: [
  // 在这里添加或修改Mock数据
  {
    type: 'assist-ticket', // 或 'mock-ticket'
    // ...其他字段
  }
]
```

---

**创建时间**：2025年10月6日
**适用版本**：核销优化版本
**维护状态**：✅ 活跃维护
