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
        isLoading: false
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
        isLoading: false
      })

      return Promise.resolve()
    } catch (error) {
      console.error('[Bookshelf] 加载失败:', error.message || error)
      this.setData({ isLoading: false })
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
    console.log('[Bookshelf] 点击绘本:', bookId)
    wx.navigateTo({
      url: `/pages/reading/reading?id=${bookId}`
    })
  }
})