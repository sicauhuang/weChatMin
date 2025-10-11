/**
 * Vant Weapp组件JavaScript API封装模块
 * 统一处理.default语法导入，简化使用方式
 *
 * 使用方式：
 * const { Toast, Dialog, Notify } = require('./vant-helper');
 *
 * 功能：
 * - 统一Vant组件JavaScript API的导入方式
 * - 简化.default语法的使用
 * - 提供简洁易用的导入接口
 * - 保持与原生Vant API的完全兼容性
 */

// 组件路径配置
const COMPONENT_PATHS = {
    toast: '../@vant/weapp/toast/toast',
    dialog: '../@vant/weapp/dialog/dialog',
    notify: '../@vant/weapp/notify/notify'
};

/**
 * 统一的组件导入处理函数
 * 处理.default语法兼容性
 * @param {string} path - 组件路径
 * @returns {Object} 组件实例
 */
function importComponent(path) {
    try {
        const module = require(path);
        return module.default || module;
    } catch (error) {
        console.error(`Failed to import component from ${path}:`, error);
        return null;
    }
}

// 导入各组件实例
const Toast = require('../@vant/weapp/toast/toast').default;
const Dialog = require('../@vant/weapp/dialog/dialog').default;
const Notify = require('../@vant/weapp/notify/notify').default;

// 导出验证
if (!Toast) {
    console.warn('Toast component failed to load');
}
if (!Dialog) {
    console.warn('Dialog component failed to load');
}
if (!Notify) {
    console.warn('Notify component failed to load');
}

/**
 * 统一导出接口
 * 提供简化的组件使用方式
 */
module.exports = {
    /**
     * Toast 消息提示组件
     * 用法：
     * Toast.success('成功提示');
     * Toast.fail('失败提示');
     * Toast.loading('加载中...');
     * Toast('自定义消息');
     */
    Toast,

    /**
     * Dialog 对话框组件
     * 用法：
     * Dialog.alert({ title: '提示', message: '内容' });
     * Dialog.confirm({ title: '确认', message: '确定删除？' });
     */
    Dialog,

    /**
     * Notify 通知栏组件
     * 用法：
     * Notify({ type: 'success', message: '操作成功' });
     * Notify.clear();
     */
    Notify
};
