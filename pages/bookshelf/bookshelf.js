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
    isLoggedIn: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 检查是否需要强制刷新（从创作页创建绘本后）
    const needRefresh = wx.getStorageSync('needRefreshBookshelf')
    if (needRefresh) {
      console.log('[Bookshelf] 检测到刷新标志，清除并强制刷新')
      wx.removeStorageSync('needRefreshBookshelf')
    }

    // 每次显示页面时检查登录状态并刷新数据
    this.checkLogin(needRefresh)
  },

  /**
   * 检查登录状态
   * @param {boolean} forceRefresh 是否强制刷新数据
   */
  checkLogin(forceRefresh = false) {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const isLoggedIn = !!token && !!userInfo

    console.log('[Bookshelf] 登录状态检查: token=', !!token, 'userInfo=', !!userInfo, 'forceRefresh=', forceRefresh)

    this.setData({ isLoggedIn })

    if (isLoggedIn) {
      this.loadBooks(forceRefresh)
    } else {
      this.setData({
        myBooks: [],
        likedBooks: [],
        isLoading: false
      })
    }
  },

  onPullDownRefresh() {
    if (this.data.isLoggedIn) {
      this.loadBooks()
    }
    wx.stopPullDownRefresh()
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
   */
  async loadBooks(forceRefresh = false) {
    if (!this.data.isLoggedIn) {
      console.log('[Bookshelf] 未登录，跳过加载')
      return
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
        isLoading: false
      })
    } catch (error) {
      console.error('[Bookshelf] 加载失败:', error.message || error)
      this.setData({ isLoading: false })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
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
    console.log('[Bookshelf] 点击绘本:', bookId)
    wx.navigateTo({
      url: `/pages/reading/reading?id=${bookId}`
    })
  }
})