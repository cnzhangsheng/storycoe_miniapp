/**
 * 书架页面
 */

const booksApi = require('../../api/books')
const { Book } = require('../../models/book')

Page({
  data: {
    selectedTab: 0, // 0: 我的绘本架, 1: 喜欢的绘本
    myBooks: [],
    likedBooks: [],
    isLoading: false,
    isRefreshing: false,
    isLoggedIn: false,
    showDeleteIndex: -1 // 显示删除按钮的绘本索引
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 初始化自定义 tabBar
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().init()
    }

    // 检查是否需要强制刷新（从创作页创建绘本后）
    const needRefresh = wx.getStorageSync('needRefreshBookshelf')

    console.log('[Bookshelf] onShow 执行, needRefresh=', needRefresh)

    // 每次显示页面时检查登录状态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const isLoggedIn = !!token && !!userInfo

    console.log('[Bookshelf] 登录状态: token=', !!token, 'userInfo=', !!userInfo, 'isLoggedIn=', isLoggedIn)

    this.setData({ isLoggedIn })

    if (isLoggedIn) {
      // 如果需要刷新，先加载数据再清除标志
      if (needRefresh) {
        console.log('[Bookshelf] 检测到刷新标志，强制刷新数据')
        this.loadBooks(true).then(() => {
          // 数据加载完成后清除标志
          wx.removeStorageSync('needRefreshBookshelf')
          console.log('[Bookshelf] 刷新标志已清除')
        })
      } else {
        // 正常刷新
        this.loadBooks(false)
      }
    } else {
      // 未登录时清除标志并清空数据
      if (needRefresh) {
        wx.removeStorageSync('needRefreshBookshelf')
      }
      this.setData({
        myBooks: [],
        likedBooks: [],
        isLoading: false,
        isRefreshing: false
      })
    }
  },

  /**
   * 检查登录状态（onLoad 时调用）
   */
  checkLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const isLoggedIn = !!token && !!userInfo

    console.log('[Bookshelf] checkLogin 登录状态检查: token=', !!token, 'userInfo=', !!userInfo)

    this.setData({ isLoggedIn })

    if (isLoggedIn) {
      this.loadBooks(false)
    } else {
      this.setData({
        myBooks: [],
        likedBooks: [],
        isLoading: false,
        isRefreshing: false
      })
    }
  },

  /**
   * 下拉刷新（根据当前tab刷新对应数据）
   */
  async onRefresh() {
    if (!this.data.isLoggedIn) {
      this.setData({ isRefreshing: false })
      return
    }

    console.log('[Bookshelf] 下拉刷新, 当前tab=', this.data.selectedTab)
    this.setData({ isRefreshing: true })

    try {
      const res = await booksApi.getMyBooks()
      const rawData = res.data || res

      if (this.data.selectedTab === 0) {
        // 刷新我的绘本架
        const myBooks = Book.fromJsonList(rawData.my_books || [])
        console.log('[Bookshelf] 刷新我的绘本架: ', myBooks.length, '本')
        this.setData({ myBooks, isRefreshing: false })
      } else {
        // 刷新喜欢的绘本
        const likedBooks = Book.fromJsonList(rawData.liked_books || [])
        console.log('[Bookshelf] 刷新喜欢的绘本: ', likedBooks.length, '本')
        this.setData({ likedBooks, isRefreshing: false })
      }
    } catch (error) {
      console.error('[Bookshelf] 刷新失败:', error.message || error)
      this.setData({ isRefreshing: false })
      wx.showToast({
        title: error.message || '刷新失败',
        icon: 'none'
      })
    }
  },

  /**
   * 点击登录按钮
   */
  onLoginTap() {
    wx.switchTab({ url: '/pages/profile/profile' })
  },

  /**
   * 加载书架数据
   * @param {boolean} forceRefresh 是否强制刷新（用于日志）
   * @returns {Promise} 加载完成后的 Promise
   */
  async loadBooks(forceRefresh = false) {
    if (!this.data.isLoggedIn) {
      console.log('[Bookshelf] 未登录，跳过加载')
      return Promise.resolve()
    }

    console.log('[Bookshelf] 开始加载...', forceRefresh ? '(强制刷新)' : '')
    this.setData({ isLoading: true })

    try {
      const res = await booksApi.getMyBooks()
      console.log('[Bookshelf] API返回:', JSON.stringify(res))

      // 后端返回 ShelfListResponse: {my_books, liked_books, total_my, total_liked}
      // 兼容两种格式: res.data.xxx 或 res.xxx
      const rawData = res.data || res
      console.log('[Bookshelf] rawData:', JSON.stringify(rawData))

      const myBooks = Book.fromJsonList(rawData.my_books || [])
      const likedBooks = Book.fromJsonList(rawData.liked_books || [])

      console.log('[Bookshelf] 解析结果: myBooks=', myBooks.length, 'likedBooks=', likedBooks.length)

      this.setData({
        myBooks,
        likedBooks,
        isLoading: false,
        isRefreshing: false
      })

      return Promise.resolve()
    } catch (error) {
      console.error('[Bookshelf] 加载失败:', error.message || error)
      this.setData({ isLoading: false, isRefreshing: false })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      return Promise.reject(error)
    }
  },

  onTabChange(e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    console.log('[Bookshelf] Tab切换:', tab, '当前:', this.data.selectedTab)
    if (tab !== this.data.selectedTab) {
      this.setData({ selectedTab: tab })
    }
  },

  onBookTap(e) {
    const bookId = e.currentTarget.dataset.bookId
    const status = e.currentTarget.dataset.status
    const index = e.currentTarget.dataset.index

    // 如果有显示删除按钮，先关闭
    if (this.data.showDeleteIndex !== -1) {
      if (this.data.showDeleteIndex === index) {
        // 点击的是同一个卡片，关闭删除按钮
        this.setData({ showDeleteIndex: -1 })
        return
      } else {
        // 点击其他卡片，关闭当前删除按钮
        this.setData({ showDeleteIndex: -1 })
      }
    }

    console.log('[Bookshelf] 点击绘本:', bookId, '状态:', status)

    // 只有已完成的绘本才能进入详情
    if (status && status !== 'completed') {
      if (status === 'generating' || status === 'processing') {
        wx.showToast({ title: '绘本正在生成中', icon: 'none' })
      } else if (status === 'error') {
        wx.showToast({ title: '绘本生成失败', icon: 'none' })
      } else {
        wx.showToast({ title: '绘本尚未完成', icon: 'none' })
      }
      return
    }

    wx.navigateTo({
      url: `/pages/reading/reading?id=${bookId}`
    })
  },

  /**
   * 长按绘本显示删除按钮
   */
  onBookLongPress(e) {
    const index = e.currentTarget.dataset.index

    // 震动反馈
    wx.vibrateShort({ type: 'light' })

    console.log('[Bookshelf] 长按绘本，显示删除按钮，索引:', index)
    this.setData({ showDeleteIndex: index })
  },

  /**
   * 点击删除按钮
   */
  onDeleteBook(e) {
    const bookId = e.currentTarget.dataset.bookId
    const index = e.currentTarget.dataset.index

    console.log('[Bookshelf] 点击删除按钮，bookId:', bookId)

    wx.showModal({
      title: '删除绘本',
      content: '确定要删除这本绘本吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#F44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...', mask: true })

            // 调用删除 API
            await booksApi.deleteBook(bookId)

            wx.hideLoading()

            // 更新本地列表
            const myBooks = this.data.myBooks.slice()
            myBooks.splice(index, 1)

            this.setData({
              myBooks,
              showDeleteIndex: -1
            })

            wx.showToast({ title: '已删除', icon: 'success' })
          } catch (error) {
            wx.hideLoading()
            console.error('[Bookshelf] 删除失败:', error)
            wx.showToast({ title: error.message || '删除失败', icon: 'none' })
            this.setData({ showDeleteIndex: -1 })
          }
        } else {
          // 取消删除，隐藏删除按钮
          this.setData({ showDeleteIndex: -1 })
        }
      }
    })
  },

  /**
   * 页面隐藏时关闭删除按钮
   */
  onHide() {
    this.setData({ showDeleteIndex: -1 })
  }
})