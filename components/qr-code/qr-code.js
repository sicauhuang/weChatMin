// 引入二维码工具
const qrcode = require('../../utils/qrcode.js');

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        // 二维码数据（必需）
        qrData: {
            type: Object,
            value: null
        },

        // 二维码类型（用于选择编码方式）
        qrType: {
            type: String,
            value: 'general' // 'user-profile', 'mock-ticket', 'general'
        },

        // 二维码大小（基础尺寸，会根据设备自动调整）
        size: {
            type: Number,
            value: 360
        },

        // 是否可点击刷新
        refreshable: {
            type: Boolean,
            value: true
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        loading: false,
        error: false,
        errorMessage: '',
        canvasId: `qr-canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        // 设备适配相关数据
        deviceInfo: null,
        actualSize: 360,
        canvasSize: 360,
        containerSize: 400
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            // 组件初始化时获取设备信息并计算尺寸
            this.initDeviceInfo();
        }
    },

    /**
     * 数据监听器
     */
    observers: {
        'qrData, qrType': function (qrData, qrType) {
            if (qrData) {
                // 延迟一下确保DOM渲染完成
                setTimeout(() => {
                    this.generateQRCode();
                }, 100);
            }
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 初始化设备信息并计算适配尺寸
         */
        initDeviceInfo() {
            try {
                const systemInfo = wx.getSystemInfoSync();
                const deviceInfo = {
                    screenWidth: systemInfo.screenWidth,
                    screenHeight: systemInfo.screenHeight,
                    windowWidth: systemInfo.windowWidth,
                    windowHeight: systemInfo.windowHeight,
                    pixelRatio: systemInfo.pixelRatio || 1,
                    platform: systemInfo.platform
                };

                console.log('设备信息:', deviceInfo);

                // 计算适配尺寸
                const sizes = this.calculateAdaptiveSizes(deviceInfo);

                this.setData({
                    deviceInfo: deviceInfo,
                    actualSize: sizes.actualSize,
                    canvasSize: sizes.canvasSize,
                    containerSize: sizes.containerSize
                });

                console.log('计算的尺寸:', sizes);
            } catch (error) {
                console.error('获取设备信息失败:', error);
                // 使用默认尺寸
                this.setData({
                    actualSize: this.properties.size,
                    canvasSize: this.properties.size,
                    containerSize: this.properties.size + 40
                });
            }
        },

        /**
         * 计算适配尺寸
         * @param {Object} deviceInfo 设备信息
         * @returns {Object} 计算后的尺寸信息
         */
        calculateAdaptiveSizes(deviceInfo) {
            const { windowWidth } = deviceInfo;
            const baseSize = this.properties.size;

            // 计算可用宽度（留出边距）
            const availableWidth = windowWidth * 0.7; // 使用80%的屏幕宽度
            const maxSize = Math.min(availableWidth, 500); // 最大不超过500rpx
            const minSize = 280; // 最小280rpx

            // 根据屏幕宽度调整尺寸
            let adaptiveSize = baseSize;

            if (windowWidth < 320) {
                // 小屏设备
                adaptiveSize = minSize;
            } else if (windowWidth > 414) {
                // 大屏设备，适当增大
                adaptiveSize = Math.min(maxSize, baseSize * 1.1);
            } else {
                // 中等屏幕，使用基础尺寸或根据屏幕比例调整
                adaptiveSize = Math.min(maxSize, Math.max(minSize, availableWidth * 0.7));
            }

            // 确保尺寸是偶数，避免渲染问题
            adaptiveSize = Math.floor(adaptiveSize / 2) * 2;

            // Canvas尺寸与显示尺寸保持一致，weapp-qrcode会自动处理像素比
            const canvasSize = adaptiveSize;

            // 容器尺寸稍大一些，留出内边距
            const containerSize = adaptiveSize + 40;

            return {
                actualSize: adaptiveSize,
                canvasSize: canvasSize,
                containerSize: containerSize
            };
        },

        /**
         * 生成二维码
         */
        async generateQRCode() {
            if (!this.data.qrData) {
                console.error('二维码数据为空');
                this.setData({
                    error: true,
                    errorMessage: '二维码数据为空'
                });
                this.triggerEvent('qr-error', {
                    message: '二维码数据为空'
                });
                return;
            }

            console.log(
                '开始生成二维码:',
                this.data.qrData,
                'type:',
                this.data.qrType,
                'canvas',
                this.data.canvasId
            );

            this.setData({
                loading: true,
                error: false,
                errorMessage: ''
            });

            try {
                // 根据类型选择合适的编码方法
                let encodedData;
                const maxAge = 3 * 60 * 1000; // 3分钟有效期

                encodedData = qrcode.formatQRData(this.data.qrData, {
                    type: this.data.qrType,
                    maxAge: maxAge
                });

                console.log('二维码编码数据:', encodedData);

                await qrcode.generateQRCode({
                    text: encodedData,
                    canvasId: this.data.canvasId,
                    size: this.data.canvasSize, // 使用计算出的Canvas尺寸
                    context: this,
                    callback: () => {
                        console.log('二维码生成完成，使用尺寸:', this.data.canvasSize);
                        this.setData({
                            loading: false,
                            error: false
                        });

                        // 触发生成完成事件
                        this.triggerEvent('qr-generated', {
                            canvasId: this.data.canvasId,
                            size: this.data.actualSize,
                            canvasSize: this.data.canvasSize,
                            data: this.data.qrData,
                            type: this.data.qrType
                        });
                    }
                });
            } catch (error) {
                console.error('生成二维码失败:', error);

                this.setData({
                    loading: false,
                    error: true,
                    errorMessage: error.message || '二维码生成失败'
                });

                // 触发错误事件
                this.triggerEvent('qr-error', {
                    message: error.message || '二维码生成失败',
                    error: error
                });
            }
        },

        /**
         * 点击二维码区域 - 刷新功能
         */
        onQRCodeTap() {
            if (!this.data.refreshable) {
                return;
            }

            // 防止重复点击
            if (this.data.loading) {
                console.log('二维码正在生成中，忽略点击');
                return;
            }

            console.log('点击二维码，开始刷新');

            // 触发刷新事件
            this.triggerEvent('qr-refresh', {
                data: this.data.qrData,
                type: this.data.qrType
            });

            // 重新生成二维码
            this.generateQRCode();
        },

        /**
         * 手动刷新二维码（供外部调用）
         */
        refresh() {
            this.generateQRCode();
        }
    }
});
