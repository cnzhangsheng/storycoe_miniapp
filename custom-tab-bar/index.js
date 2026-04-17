/**
 * 自定义底部导航栏组件
 */

Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/explore/explore',
        text: '探索',
        icon: '🔍'
      },
      {
        pagePath: '/pages/create/create',
        text: '创作',
        icon: '✏️'
      },
      {
        pagePath: '/pages/bookshelf/bookshelf',
        text: '书架',
        icon: '📚'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        icon: '👤'
      }
    ]
  },

  methods: {
    /**
     * 初始化选中状态（由页面调用）
     */
    init() {
      const page = getCurrentPages().pop()
      const route = page ? page.route : ''
      const selected = this.data.list.findIndex(item => item.pagePath === `/${route}`)
      this.setData({ selected: selected === -1 ? 0 : selected })
    },

    /**
     * 点击 tab 切换页面
     */
    onTabTap(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]

      if (this.data.selected === index) {
        // 已选中，不做跳转
        return
      }

      // 切换页面
      wx.switchTab({
        url: item.pagePath,
        fail: (err) => {
          console.error('[TabBar] 切换失败:', err)
        }
      })
    }
  }
})