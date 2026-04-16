/**
 * 成就详情页
 */

const gamificationApi = require('../../api/gamification')

Page({
  data: {
    achievements: [],
    unlockedIds: [], // 已解锁的成就ID列表
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
      const rawData = achievementsRes.data || achievementsRes
      const achievements = rawData.achievements || rawData || []
      const unlockedIds = (rawData.unlocked_ids || []).map(id => String(id))
      const stats = statsRes.data || statsRes

      // 标记每个成就的解锁状态
      const processedAchievements = achievements.map(achievement => ({
        ...achievement,
        isUnlocked: unlockedIds.includes(String(achievement.id)) || !!achievement.unlocked_at
      }))

      this.setData({
        achievements: processedAchievements,
        unlockedIds,
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
  async onPullDownRefresh() {
    await this.loadData()
    wx.stopPullDownRefresh()
  }
})