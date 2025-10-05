Component({
    data: {
        selected: 0,
        color: '#7A7E83',
        selectedColor: '#ff6600',
        list: [
            {
                pagePath: '/pages/index/index',
                iconClass: 'icon-shouye',
                text: '首页'
            },
            {
                pagePath: '/pages/vehicles/vehicles',
                iconClass: 'icon-cheyuan',
                text: '车源'
            },
            {
                pagePath: '/pages/mock-tickets/mock-tickets',
                iconClass: 'icon-piao',
                text: '模拟票'
            },
            {
                pagePath: '/pages/profile/profile',
                iconClass: 'icon-wode',
                text: '我的'
            }
        ]
    },
    ready() {
        // 组件准备完毕时设置当前页面
        this.setSelected();
    },
    methods: {
        switchTab(e) {
            const data = e.currentTarget.dataset;
            const url = data.path;
            const index = data.index;
            wx.switchTab({
                url,
                success: () => {
                    this.setData({
                        selected: index
                    });
                }
            });
        },
        setSelected() {
            // 获取当前页面路径
            const pages = getCurrentPages();

            // 安全检查：确保页面栈不为空
            if (pages.length === 0) {
                return;
            }

            const currentPage = pages[pages.length - 1];

            // 安全检查：确保当前页面存在且有 route 属性
            if (!currentPage || !currentPage.route) {
                return;
            }

            const currentRoute = currentPage.route;

            // 根据当前路径设置选中状态
            const selected = this.data.list.findIndex(item =>
                item.pagePath === `/${currentRoute}`
            );

            if (selected !== -1) {
                this.setData({
                    selected: selected
                });
            }
        }
    }
});
