/**
 * 探索页面 - 首页
 */

const booksApi = require('../../api/books')
const leaderboardApi = require('../../api/leaderboard')
const { Book } = require('../../models/book')

Page({
  data: {
    // 搜索
    searchTerm: '',
    searchHistory: [],

    // 级别筛选
    levels: [
      { value: null, label: '全部', active: true },
      { value: 1, label: 'Lv.1', active: false },
      { value: 2, label: 'Lv.2', active: false },
      { value: 3, label: 'Lv.3', active: false }
    ],
    selectedLevel: null,

    // 热门榜
    hotBooks: [],
    hotBooksColumns: [], // 分列数据

    // 绘本列表
    books: [],
    displayedBooks: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isEmpty: false,

    // 状态
    isLoading: false,
    isRefreshing: false
  },

  onLoad() {
    this.loadSearchHistory()
    this.loadData()
  },

  onShow() {
    // 初始化自定义 tabBar
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().init()
    }
  },

  async onPullDownRefresh() {
    this.setData({ isRefreshing: true })
    await this.loadData()
    wx.stopPullDownRefresh()
    this.setData({ isRefreshing: false })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadMoreBooks()
    }
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({ searchHistory: history.slice(0, 5) })
  },

  /**
   * 加载所有数据
   */
  async loadData() {
    this.setData({ isLoading: true })

    try {
      // 加载排行榜和绘本列表
      await Promise.all([
        this.loadHotBooks(),
        this.loadPublicBooks()
      ])
    } catch (error) {
      console.error('[Explore] 加载失败:', error)
      // API 不可用时使用模拟数据
      this.loadMockData()
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 加载模拟数据（测试用）
   */
  loadMockData() {
    const mockBooksData = [
      { id: 1, title: '小红帽', cover_image: '', level: 1, read_count: 100, shelf_count: 50 },
      { id: 2, title: '三只小猪', cover_image: '', level: 2, read_count: 80, shelf_count: 40 },
      { id: 3, title: '白雪公主', cover_image: '', level: 1, read_count: 120, shelf_count: 60 },
      { id: 4, title: '龟兔赛跑', cover_image: '', level: 1, read_count: 90, shelf_count: 45 },
      { id: 5, title: '狼和七只小羊', cover_image: '', level: 2, read_count: 70, shelf_count: 35 },
      { id: 6, title: '丑小鸭', cover_image: '', level: 3, read_count: 150, shelf_count: 75 }
    ]

    const mockBooks = Book.fromJsonList(mockBooksData)
    const mockHotBooks = mockBooks.map((b, i) => ({ ...b, rank: i + 1 }))

    // 按列分配
    const columns = []
    for (let i = 0; i < 4; i++) {
      const start = i * 3
      if (start < mockHotBooks.length) {
        columns.push(mockHotBooks.slice(start, start + 3))
      }
    }

    this.setData({
      hotBooks: mockHotBooks,
      hotBooksColumns: columns,
      books: mockBooks,
      displayedBooks: mockBooks,
      isEmpty: false,
      hasMore: false
    })

    console.log('[Explore] 使用模拟数据')
  },

  /**
   * 加载热门绘本榜
   */
  async loadHotBooks() {
    try {
      const res = await leaderboardApi.getHotBooks(12)
      if (res.code === 0) {
        const hotBooks = res.data.books.map(item => new Book(item))

        // 按列分配：每列3本，共4列
        const columns = []
        for (let i = 0; i < 4; i++) {
          const start = i * 3
          const end = start + 3
          if (start < hotBooks.length) {
            columns.push(hotBooks.slice(start, Math.min(end, hotBooks.length)))
          }
        }

        this.setData({ hotBooks, hotBooksColumns: columns })
      }
    } catch (error) {
      console.error('[Explore] 热门榜加载失败:', error)
    }
  },

  /**
   * 加载公开绘本列表
   */
  async loadPublicBooks() {
    try {
      const res = await booksApi.getPublicBooks({
        page: 1,
        pageSize: 10,
        level: this.data.selectedLevel
      })

      // 兼容两种响应格式
      let books, total
      if (res.code === 0 && res.data) {
        books = res.data.books || []
        total = res.data.total || 0
      } else {
        books = res.books || []
        total = res.total || 0
      }

      books = books.map(item => new Book(item))

      this.setData({
        books,
        displayedBooks: books,
        page: 1,
        hasMore: books.length < total,
        isEmpty: books.length === 0
      })
    } catch (error) {
      console.error('[Explore] 绘本列表加载失败:', error)
    }
  },

  /**
   * 加载更多绘本
   */
  async loadMoreBooks() {
    if (!this.data.hasMore) return

    this.setData({ isLoading: true })

    try {
      const nextPage = this.data.page + 1
      const res = await booksApi.getPublicBooks({
        page: nextPage,
        pageSize: this.data.pageSize,
        level: this.data.selectedLevel
      })

      // 兼容两种响应格式
      let newBooks, total
      if (res.code === 0 && res.data) {
        newBooks = res.data.books || []
        total = res.data.total || 0
      } else {
        newBooks = res.books || []
        total = res.total || 0
      }

      newBooks = newBooks.map(item => new Book(item))
      const allBooks = [...this.data.books, ...newBooks]
      const displayedBooks = allBooks.slice(0, nextPage * this.data.pageSize)

      this.setData({
        books: allBooks,
        displayedBooks,
        page: nextPage,
        hasMore: displayedBooks.length < total
      })
    } catch (error) {
      console.error('[Explore] 加载更多失败:', error)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ searchTerm: e.detail.value })
  },

  /**
   * 执行搜索
   */
  onSearch() {
    const term = this.data.searchTerm.trim().toLowerCase()
    if (!term) {
      // 清空搜索时恢复全部绘本
      this.setData({ displayedBooks: this.data.books })
      return
    }

    // 保存搜索历史
    this.saveSearchHistory(term)

    // 本地过滤绘本（标题匹配）
    const filteredBooks = this.data.books.filter(book =>
      book.title.toLowerCase().includes(term)
    )

    this.setData({
      displayedBooks: filteredBooks,
      isEmpty: filteredBooks.length === 0
    })

    console.log('[Explore] 搜索结果:', filteredBooks.length, '本')
  },

  /**
   * 保存搜索历史
   */
  saveSearchHistory(term) {
    let history = this.data.searchHistory.filter(h => h !== term)
    history.unshift(term)
    history = history.slice(0, 10)

    wx.setStorageSync('searchHistory', history)
    this.setData({ searchHistory: history.slice(0, 5) })
  },

  /**
   * 点击历史搜索词
   */
  onHistoryTap(e) {
    const term = e.currentTarget.dataset.term
    this.setData({ searchTerm: term })
    this.onSearch()
  },

  /**
   * 清除搜索历史
   */
  onClearHistory() {
    wx.removeStorageSync('searchHistory')
    this.setData({ searchHistory: [] })
  },

  /**
   * 选择级别
   */
  onLevelSelect(e) {
    const level = e.currentTarget.dataset.level

    // 更新级别按钮状态
    const levels = this.data.levels.map(l => ({
      ...l,
      active: l.value === level
    }))

    this.setData({ levels, selectedLevel: level, page: 1 })

    // 重新加载绘本
    this.loadPublicBooks()
  },

  /**
   * 点击绘本
   */
  onBookTap(e) {
    const bookId = e.currentTarget.dataset.bookId
    wx.navigateTo({
      url: `/pages/reading/reading?id=${bookId}`
    })
  },

  /**
   * 点击排行榜绘本
   */
  onHotBookTap(e) {
    const bookId = e.currentTarget.dataset.bookId
    wx.navigateTo({
      url: `/pages/reading/reading?id=${bookId}`
    })
  },

  /**
   * 查看完整排行榜
   */
  onViewAllLeaderboard() {
    wx.navigateTo({
      url: '/pages/leaderboard/leaderboard'
    })
  },

  /**
   * 图片加载失败处理
   */
  onImageError(e) {
    console.log('[Explore] 图片加载失败:', e)
    // 可以在这里设置占位图，但由于小程序限制，无法直接修改 image src
    // 建议使用 CSS 设置默认背景图或使用 binderror 显示占位元素
  },

  /**
   * 清除搜索并恢复列表
   */
  onClearSearch() {
    this.setData({
      searchTerm: '',
      displayedBooks: this.data.books,
      isEmpty: this.data.books.length === 0
    })
  }
})