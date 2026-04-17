/**
 * 我的页面
 */

const authApi = require('../../api/auth')
const gamificationApi = require('../../api/gamification')

Page({
  data: {
    userInfo: null,
    stats: null,
    dailyTask: null,
    isLoading: false,
    isLoggedIn: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 每次显示时检查登录状态
    this.checkLogin()
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const isLoggedIn = !!token && !!userInfo

    this.setData({ isLoggedIn })

    if (isLoggedIn) {
      this.loadData()
    } else {
      this.setData({
        userInfo: null,
        stats: null,
        dailyTask: null,
        isLoading: false
      })
    }
  },

  /**
   * 点击登录按钮 - 使用微信登录
   */
  async onLoginTap() {
    try {
      wx.showLoading({ title: '登录中...' })

      // 微信登录
      const app = getApp()
      const result = await app.wxLogin()

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })

      console.log('[Profile] 登录成功:', result)

      this.setData({ isLoggedIn: true })
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      console.error('[Profile] 登录失败:', error)

      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  async loadData() {
    if (!this.data.isLoggedIn) return

    this.setData({ isLoading: true })

    try {
      const [userRes, statsRes, taskRes] = await Promise.all([
        authApi.getCurrentUser(),
        gamificationApi.getStats(),
        gamificationApi.getDailyTask()
      ])

      // 兼容两种响应格式
      const userInfo = userRes.data || userRes
      const stats = statsRes.data || statsRes
      const dailyTask = taskRes.data || taskRes

      console.log('[Profile] 用户信息:', userInfo)

      this.setData({
        userInfo,
        stats,
        dailyTask,
        isLoading: false
      })
    } catch (error) {
      console.error('[Profile] 加载失败:', error)
      this.setData({ isLoading: false })

      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  onAvatarTap() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        try {
          await authApi.uploadAvatar(filePath)
          wx.showToast({ title: '头像已更新', icon: 'success' })
          this.loadData()
        } catch (error) {
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      }
    })
  },

  onNameTap() {
    wx.showModal({
      title: '修改名字',
      editable: true,
      placeholderText: this.data.userInfo?.name || '',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await authApi.updateProfile({ name: res.content })
            wx.showToast({ title: '名字已更新', icon: 'success' })
            this.loadData()
          } catch (error) {
            wx.showToast({ title: '更新失败', icon: 'none' })
          }
        }
      }
    })
  },

  onClaimReward() {
    gamificationApi.claimDailyTaskReward().then(() => {
      wx.showToast({ title: '恭喜获得奖励！', icon: 'success' })
      this.loadData()
    }).catch(() => {
      wx.showToast({ title: '领取失败', icon: 'none' })
    })
  },

  onAchievementTap() {
    wx.navigateTo({ url: '/pages/achievement/achievement' })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          const app = getApp()
          app.clearLogin()
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            stats: null,
            dailyTask: null
          })
          wx.reLaunch({ url: '/pages/explore/explore' })
        }
      }
    })
  }
})