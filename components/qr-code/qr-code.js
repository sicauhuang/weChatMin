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

        // 二维码大小
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
        canvasId: `qr-canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
                    size: this.data.size,
                    context: this,
                    callback: () => {
                        console.log('二维码生成完成');
                        this.setData({
                            loading: false,
                            error: false
                        });

                        // 触发生成完成事件
                        this.triggerEvent('qr-generated', {
                            canvasId: this.data.canvasId,
                            size: this.data.size,
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
