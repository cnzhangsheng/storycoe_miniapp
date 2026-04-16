/**
 * 排行榜详情页 - 仅展示热门绘本榜
 */

const leaderboardApi = require('../../api/leaderboard')

Page({
  data: {
    books: [],
    loading: true
  },

  onLoad(options) {
    this.loadData()
  },

  async loadData() {
    try {
      const res = await leaderboardApi.getHotBooks()
      // 兼容两种响应格式，处理图片 URL
      const rawBooks = res.data?.books || res.books || []
      const books = rawBooks.map(item => ({
        ...item,
        cover_image: this.getFullImageUrl(item.cover_image)
      }))
      this.setData({
        books,
        loading: false
      })
    } catch (error) {
      console.error('[Leaderboard] 加载失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  /**
   * 获取基础 URL
   */
  getBaseUrl() {
    try {
      const app = getApp()
      return app.globalData.baseUrl
    } catch (e) {
      return 'http://47.85.201.118:8000'
    }
  },

  /**
   * 获取完整图片URL
   */
  getFullImageUrl(path) {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    return this.getBaseUrl() + path
  },

  // 点击绘本
  onBookTap(e) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/reading/reading?id=${bookId}`
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadData()
    wx.stopPullDownRefresh()
  }
})