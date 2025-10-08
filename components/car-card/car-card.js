// components/car-card/car-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 车辆数据对象
    vehicleData: {
      type: Object,
      value: {}
    },
    // 是否处于删除模式
    deleteMode: {
      type: Boolean,
      value: false
    },
    // 删除模式下的选中状态
    isSelected: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 格式化后的车辆数据
    formattedVehicleData: {}
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 格式化价格 (从 car-selling.js 抽离)
     */
    formatPrice(price) {
      if (!price) return '面议';
      return `${price.toFixed(1)}万`;
    },

    /**
     * 格式化里程 (从 car-selling.js 抽离)
     */
    formatMileage(mileage) {
      if (!mileage || mileage === 0) return '准新车';
      return `${mileage.toFixed(1)}万公里`;
    },

    /**
     * 格式化日期 (从 car-selling.js 抽离)
     */
    formatDate(dateString) {
      if (!dateString) return '--';
      return dateString;
    },

    /**
     * 格式化过户次数 (从 car-selling.js 抽离)
     */
    formatTransferCount(count) {
      if (count === 0) return '未过户';
      return `过户${count}次`;
    },

    /**
     * 格式化车辆数据
     */
    formatVehicleData(vehicleData) {
      if (!vehicleData || Object.keys(vehicleData).length === 0) {
        return {};
      }

      return {
        ...vehicleData,
        formattedPrice: this.formatPrice(vehicleData.retailPrice),
        formattedMileage: this.formatMileage(vehicleData.mileage),
        formattedDate: this.formatDate(vehicleData.registrationDate),
        formattedTransfer: this.formatTransferCount(vehicleData.transferCount)
      };
    },

    /**
     * 卡片点击事件
     */
    onCardTap() {
      // 在删除模式下，点击卡片切换选中状态
      if (this.properties.deleteMode) {
        this.triggerEvent('onSelectionChange', {
          vehicleData: this.properties.vehicleData,
          isSelected: !this.properties.isSelected
        });
        return;
      }

      // 正常模式下的卡片点击事件
      this.triggerEvent('onCardTap', {
        vehicleData: this.properties.vehicleData
      });
    },

    /**
     * 收藏按钮点击事件
     */
    onFavoriteToggle() {
      const newFavoritedStatus = !this.properties.vehicleData.isFavorited;

      this.triggerEvent('onFavoriteToggle', {
        vehicleData: this.properties.vehicleData,
        isFavorited: newFavoritedStatus
      });
    }
  },

  /**
   * 数据监听器
   */
  observers: {
    'vehicleData': function(newVal) {
      if (newVal && Object.keys(newVal).length > 0) {
        // 格式化数据
        const formattedData = this.formatVehicleData(newVal);

        this.setData({
          formattedVehicleData: formattedData
        });
      }
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件被创建时，初始化格式化数据
      if (this.properties.vehicleData && Object.keys(this.properties.vehicleData).length > 0) {
        const formattedData = this.formatVehicleData(this.properties.vehicleData);
        this.setData({
          formattedVehicleData: formattedData
        });
      }
    }
  }
});