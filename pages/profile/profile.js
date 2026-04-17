/**
 * 我的页面
 */

const authApi = require('../../api/auth')

Page({
  data: {
    userInfo: null,
    stats: null,
    isLoading: false,
    isLoggedIn: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 初始化自定义 tabBar
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().init()
    }
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

      const app = getApp()
      const result = await app.wxLogin()

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })

      this.setData({ isLoggedIn: true })
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '登录失败', icon: 'none' })
    }
  },

  async loadData() {
    if (!this.data.isLoggedIn) return

    this.setData({ isLoading: true })

    try {
      const userRes = await authApi.getCurrentUser()
      const userInfo = userRes.data || userRes

      // 统计数据（从本地存储获取，或使用默认值）
      const stats = {
        books_read: userInfo.books_read || 0,
        stars: userInfo.stars || 0,
        streak: userInfo.streak || 0
      }

      this.setData({
        userInfo,
        stats,
        isLoading: false
      })
    } catch (error) {
      console.error('[Profile] 加载失败:', error)
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
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
            stats: null
          })
          wx.reLaunch({ url: '/pages/explore/explore' })
        }
      }
    })
  }
})