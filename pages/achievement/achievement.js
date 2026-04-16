/**
 * 成就详情页
 */

const gamificationApi = require('../../api/gamification')

Page({
  data: {
    achievements: [],
    stats: null,
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  async loadData() {
    try {
      const [achievementsRes, statsRes] = await Promise.all([
        gamificationApi.getAchievements(),
        gamificationApi.getStats()
      ])

      // 兼容两种响应格式
      const achievements = achievementsRes.data || achievementsRes.achievements || []
      const stats = statsRes.data || statsRes

      this.setData({
        achievements,
        stats,
        loading: false
      })
    } catch (error) {
      console.error('[Achievement] 加载失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})