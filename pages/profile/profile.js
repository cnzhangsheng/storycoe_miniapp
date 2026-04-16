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
    const isLoggedIn = !!token

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
   * 点击登录按钮
   */
  async onLoginTap() {
    try {
      wx.showLoading({ title: '登录中...' })

      // 微信登录
      const app = getApp()
      const result = await app.wxLogin()

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })

      this.setData({ isLoggedIn: true })
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      console.error('[Profile] 登录失败:', error)

      // 登录失败时使用模拟数据（测试模式）
      wx.showModal({
        title: '登录提示',
        content: '后端微信登录接口尚未配置，是否使用测试模式？',
        success: (res) => {
          if (res.confirm) {
            this.useTestMode()
          }
        }
      })
    }
  },

  /**
   * 使用测试模式（模拟登录）
   */
  useTestMode() {
    const mockUserInfo = {
      avatar: '',
      name: 'Lily 小象',
      id: 1
    }

    wx.setStorageSync('token', 'test_token_123')
    wx.setStorageSync('userInfo', mockUserInfo)

    this.setData({
      isLoggedIn: true,
      userInfo: mockUserInfo
    })

    this.loadData()
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

      this.setData({
        userInfo,
        stats,
        dailyTask,
        isLoading: false
      })
    } catch (error) {
      console.error('[Profile] 加载失败:', error)
      // 使用模拟数据
      this.loadMockData()
    }
  },

  /**
   * 加载模拟数据（测试用）
   */
  loadMockData() {
    const mockUserInfo = {
      avatar: '',
      name: 'Lily 小象',
      id: 1
    }

    const mockStats = {
      level: 5,
      books_read: 20,
      stars: 150,
      streak: 7
    }

    const mockDailyTask = {
      read_books: 2,
      target_books: 3,
      progress_percent: 67,
      canClaim: false,
      reward_stars: 10
    }

    this.setData({
      userInfo: mockUserInfo,
      stats: mockStats,
      dailyTask: mockDailyTask,
      isLoading: false
    })

    console.log('[Profile] 使用模拟数据')
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
          await authApi.logout()
          wx.reLaunch({ url: '/pages/explore/explore' })
        }
      }
    })
  }
})