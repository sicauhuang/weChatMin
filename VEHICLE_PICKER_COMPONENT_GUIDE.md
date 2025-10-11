# 车型选择器组件使用示例

## 组件介绍

车型选择器（`vehicle-picker`）是一个全屏遮罩式的公共组件，提供品牌、车系、车型的三级联动选择功能。采用外卖平台点单式的UI风格，左侧显示品牌菜单，右侧显示当前品牌下的车系与车型分组列表。

## 主要特性

- ✅ 支持品牌、车系、车型三级联动选择
- ✅ 默认选中第一个品牌，提升初始体验
- ✅ 仅支持单选模式，手动确认选择
- ✅ 车型选中状态可视化，支持回显上次选择
- ✅ 全屏遮罩显示，类似于van-picker的使用方式  
- ✅ 基于Vant Weapp组件库开发
- ✅ 支持Mock数据和后端API数据
- ✅ 响应式布局，适配不同屏幕尺寸
- ✅ 提供完整的事件回调机制
- ✅ 简化显示信息，只显示车型不显示价格

## 快速开始

### 1. 引入组件

在页面的JSON配置文件中引入组件：

```json
{
  "usingComponents": {
    "vehicle-picker": "/components/vehicle-picker/vehicle-picker"
  }
}
```

### 2. 在WXML中使用

```xml
<!-- 触发按钮 -->
<van-cell
  title="品牌车型"
  value="{{selectedVehicleText || '请选择车型'}}"
  is-link
  bind:click="showVehiclePicker" />

<!-- 车型选择器组件 -->
<vehicle-picker
  show="{{showVehiclePicker}}"
  title="选择车型"
  bind:onConfirm="onVehicleConfirm"
  bind:onCancel="onVehicleCancel"
  bind:onClose="hideVehiclePicker" />
```

### 3. 在JS中处理事件

```javascript
Page({
  data: {
    showVehiclePicker: false,
    selectedVehicleText: '',
    selectedModelId: ''
  },

  /**
   * 显示车型选择器
   */
  showVehiclePicker() {
    this.setData({ showVehiclePicker: true });
  },

  /**
   * 隐藏车型选择器
   */
  hideVehiclePicker() {
    this.setData({ showVehiclePicker: false });
  },

  /**
   * 车型选择确认
   */
  onVehicleConfirm(e) {
    const { displayText, modelId, brandInfo, seriesInfo, modelInfo } = e.detail;
    
    console.log('车型选择结果:', {
      displayText,      // "C级 C200L 2023款"
      modelId,          // "model_001"
      brandInfo,        // { brandId: "brand_001", brandName: "奔驰" }
      seriesInfo,       // { seriesId: "series_001", seriesName: "C级" }
      modelInfo         // { modelId: "model_001", modelName: "C200L", modelYear: "2023款", price: 329800 }
    });
    
    // 更新表单数据
    this.setData({
      selectedVehicleText: displayText,
      selectedModelId: modelId,
      showVehiclePicker: false
    });
  },

  /**
   * 车型选择取消
   */
  onVehicleCancel() {
    this.setData({ showVehiclePicker: false });
  }
});
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| show | Boolean | false | 控制组件显示隐藏 |
| title | String | "选择车型" | 弹窗标题 |
| defaultValue | Object | {} | 默认选中值 |
| placeholder | String | "请选择车型" | 占位提示文本 |

## 组件事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| onConfirm | event.detail | 选择车型完成事件 |
| onCancel | - | 取消选择事件 |
| onClose | - | 组件关闭事件 |

### onConfirm事件参数结构

```javascript
{
  brandInfo: {
    brandId: "brand_001",
    brandName: "奔驰"
  },
  seriesInfo: {
    seriesId: "series_001", 
    seriesName: "C级"
  },
  modelInfo: {
    modelId: "model_001",
    modelName: "C200L",
    modelYear: "2023款",
    price: 329800
  },
  displayText: "C级 C200L 2023款",
  modelId: "model_001"
}
```

## 高级用法

### 设置默认选中值

```xml
<vehicle-picker
  show="{{showVehiclePicker}}"
  default-value="{{defaultVehicle}}"
  bind:onConfirm="onVehicleConfirm" />
```

```javascript
Page({
  data: {
    defaultVehicle: {
      brandId: "brand_001",
      seriesId: "series_001", 
      modelId: "model_001"
    }
  }
});
```

## Mock数据结构

组件内置了完整的Mock数据，包含奔驰、宝马、奥迪三个品牌的车型信息：

```javascript
const mockVehicleData = [
  {
    brandId: "brand_001",
    brandName: "奔驰",
    seriesList: [
      {
        seriesId: "series_001",
        seriesName: "C级",
        modelList: [
          {
            modelId: "model_001",
            modelName: "C200L",
            modelYear: "2023款",
            price: 329800
          }
        ]
      }
    ]
  }
];
```

## 样式定制

组件采用Vant Weapp的设计规范，支持通过CSS变量进行样式定制：

```css
/* 自定义主题色 */
page {
  --van-primary-color: #1989fa;
}

/* 自定义品牌菜单背景色 */
.brand-menu {
  background: #f7f8fa;
}
```

## 兼容性

- ✅ 微信小程序基础库 2.6.5+
- ✅ 支持所有主流机型
- ✅ 响应式布局适配各种屏幕尺寸

## 注意事项

1. **手动确认**：点击车型后会更新选中状态，需点击右上角“确认”按钮才会触发`onConfirm`事件
2. **默认选中**：组件加载后会自动选中第一个品牌
3. **状态回显**：选中的车型会显示选中效果，支持再次打开时回显上次选择
4. **数据缓存**：已加载的品牌数据会缓存至组件销毁
5. **事件处理**：建议同时监听`onConfirm`和`onCancel`事件
6. **布局约束**：组件使用全屏遮罩，会覆盖整个页面

## 完整示例

参考 `pages/car-form/car-form` 页面的集成使用方式，该页面完整展示了车型选择器在车辆信息录入表单中的应用。

## 更新日志

### v1.1.0 (2024-10-08)
- ✨ 新增默认选中第一个品牌功能
- ✨ 移除车型价格显示，简化界面信息
- ✨ 添加确认按钮，支持手动确认选择
- ✨ 优化车型选中效果，支持状态回显
- 🎨 使用主题色浅色背景突出选中状态

### v1.0.0 (2024-10-08)
- 🎉 初始版本发布
- ✅ 实现品牌、车系、车型三级联动选择
- ✅ 支持选择即确认的交互方式
- ✅ 提供完整的Mock数据
- ✅ 在car-form页面中集成使用
- ✅ 通过所有单元测试