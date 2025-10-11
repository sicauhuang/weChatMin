/**
 * API配置文件
 * 用于管理不同环境下的API地址
 */

// 开发环境配置
const development = {
    // 本地开发（微信开发者工具）
    localhost: 'http://localhost:3000',
    // 真机调试（需要根据实际局域网IP修改）
    // 启动服务器后，在控制台查看实际的局域网IP地址
    // localNetwork: 'http://192.168.124.8:3000' // 实际的局域网IP
    localNetwork: 'http://139.155.137.226:20881' // 实际的局域网IP
};

// 生产环境配置（如果有的话）
const production = {
    server: 'https://mp.api.sccdhm.com' // 正式服务器地址
};

// 当前使用的环境配置
// 可以通过修改这个值来切换不同的调试模式
const currentEnv = {
    // 选择当前使用的API地址
    // 'localhost' - 本地开发（微信开发者工具）
    // 'localNetwork' - 真机调试
    // 'server' - 生产环境
    mode: 'localNetwork', // 默认使用本地开发模式

    // 获取当前API基础地址
    getBaseUrl() {
        switch (this.mode) {
            case 'localhost':
                return development.localhost;
            case 'localNetwork':
                return development.localNetwork;
            case 'server':
                return production.server;
            default:
                return development.localhost;
        }
    },

    // 获取完整的API地址
    getApiUrl(endpoint) {
        return `${this.getBaseUrl()}${endpoint}`;
    }
};

// 导出配置
module.exports = {
    development,
    production,
    currentEnv,

    // 快捷方法
    getLoginUrl() {
        return currentEnv.getApiUrl('/api/login');
    },

    getLogoutUrl() {
        return currentEnv.getApiUrl('/api/mp/auth/logout');
    },

    getUnbindUrl() {
        return currentEnv.getApiUrl('/api/mp/user/unbind-miniprogram');
    },

    getHealthUrl() {
        return currentEnv.getApiUrl('/api/health');
    },

    // 切换到真机调试模式
    switchToLocalNetwork(ip) {
        if (ip) {
            development.localNetwork = `http://${ip}:3000`;
        }
        currentEnv.mode = 'localNetwork';
        console.log('已切换到真机调试模式:', currentEnv.getBaseUrl());
    },

    // 切换到本地开发模式
    switchToLocalhost() {
        currentEnv.mode = 'localhost';
        console.log('已切换到本地开发模式:', currentEnv.getBaseUrl());
    }
};
