/**
 * Vant Helper 使用示例
 * 展示如何在微信小程序中使用封装的Vant组件
 */

// 1. 导入封装的Vant组件（简化写法）
const { Toast, Dialog, Notify } = require('../../utils/vant-helper');

Page({
  data: {
    title: 'Vant Helper 使用示例'
  },

  onLoad() {
    console.log('Vant Helper 使用示例页面加载');
  },

  // Toast 使用示例
  showToastSuccess() {
    Toast.success('操作成功');
  },

  showToastFail() {
    Toast.fail('操作失败');
  },

  showToastLoading() {
    Toast.loading({
      message: '加载中...',
      duration: 2000
    });
  },

  showToastCustom() {
    Toast('这是自定义消息');
  },

  clearToast() {
    Toast.clear();
  },

  // Dialog 使用示例
  showDialogAlert() {
    Dialog.alert({
      title: '提示',
      message: '这是一个提示对话框'
    }).then(() => {
      console.log('alert对话框已关闭');
    });
  },

  showDialogConfirm() {
    Dialog.confirm({
      title: '确认删除',
      message: '删除后无法恢复，确定要删除吗？'
    }).then(() => {
      Toast.success('确认删除');
      console.log('用户确认删除');
    }).catch(() => {
      Toast.fail('取消删除');
      console.log('用户取消删除');
    });
  },

  showDialogCustom() {
    Dialog.confirm({
      title: '自定义对话框',
      message: '这是一个自定义样式的对话框',
      confirmButtonText: '同意',
      cancelButtonText: '拒绝',
      confirmButtonColor: '#07c160'
    }).then(() => {
      Toast.success('用户同意');
    }).catch(() => {
      Toast.fail('用户拒绝');
    });
  },

  closeDialog() {
    Dialog.close();
  },

  // Notify 使用示例
  showNotifySuccess() {
    Notify({
      type: 'success',
      message: '成功通知'
    });
  },

  showNotifyWarning() {
    Notify({
      type: 'warning',
      message: '警告通知'
    });
  },

  showNotifyDanger() {
    Notify({
      type: 'danger',
      message: '危险通知'
    });
  },

  showNotifyCustom() {
    Notify({
      message: '自定义通知',
      duration: 3000,
      backgroundColor: '#1989fa'
    });
  },

  clearNotify() {
    Notify.clear();
  },

  // 综合使用示例
  simulateLogin() {
    // 显示加载状态
    Toast.loading({
      message: '登录中...',
      forbidClick: true,
      duration: 0
    });

    // 模拟网络请求
    setTimeout(() => {
      Toast.clear();
      
      // 模拟登录成功
      const loginSuccess = Math.random() > 0.3;
      
      if (loginSuccess) {
        Toast.success('登录成功');
        setTimeout(() => {
          Notify({
            type: 'success',
            message: '欢迎回来！'
          });
        }, 1000);
      } else {
        Dialog.alert({
          title: '登录失败',
          message: '用户名或密码错误，请重试'
        });
      }
    }, 2000);
  },

  simulateDelete() {
    Dialog.confirm({
      title: '确认删除',
      message: '此操作将永久删除该文件，确定继续？'
    }).then(() => {
      // 用户确认删除
      Toast.loading({
        message: '删除中...',
        duration: 0
      });

      setTimeout(() => {
        Toast.clear();
        Toast.success('删除成功');
        
        setTimeout(() => {
          Notify({
            type: 'success',
            message: '文件已删除'
          });
        }, 1000);
      }, 1500);
    }).catch(() => {
      // 用户取消删除
      Toast('已取消删除');
    });
  },

  // 错误处理示例
  handleError(error) {
    console.error('操作出错:', error);
    
    Dialog.alert({
      title: '操作失败',
      message: error.message || '未知错误，请稍后重试'
    });
  },

  // 批量操作示例
  batchOperations() {
    const operations = [
      () => Toast.loading('准备中...'),
      () => setTimeout(() => Toast.loading('处理中...'), 1000),
      () => setTimeout(() => Toast.loading('即将完成...'), 2000),
      () => setTimeout(() => {
        Toast.clear();
        Toast.success('批量操作完成');
        Notify({
          type: 'success',
          message: '所有任务已处理完毕'
        });
      }, 3000)
    ];

    operations.forEach(op => op());
  }
});