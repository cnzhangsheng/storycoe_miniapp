/**
 * StoryCoe 微信小程序入口文件
 */

App({
  // 全局数据
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://47.85.201.118:8000', // 外网服务器地址
    isLoggedIn: false
  },

  /**
   * 小程序初始化
   */
  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo

    console.log('[App] 小程序启动完成')
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
      console.log('[App] 已登录，token:', token)
    } else {
      console.log('[App] 未登录')
    }
  },

  /**
   * 微信登录
   */
  async wxLogin() {
    try {
      // 获取登录凭证
      const loginRes = await wx.login()
      const code = loginRes.code

      if (!code) {
        throw new Error('获取登录凭证失败')
      }

      // 发送 code 到后端换取 token
      const res = await this.request({
        url: '/auth/wechat-login',
        method: 'POST',
        data: { code }
      })

      // 处理响应（兼容两种格式）
      let token, user
      if (res.code === 0 && res.data) {
        // 标准格式 {code: 0, data: {token, user}}
        token = res.data.token
        user = res.data.user
      } else if (res.token) {
        // 直接格式 {token, user}
        token = res.token
        user = res.user
      } else {
        throw new Error(res.message || '登录失败')
      }

      // 保存 token
      this.globalData.token = token
      this.globalData.userInfo = user
      this.globalData.isLoggedIn = true

      wx.setStorageSync('token', token)
      wx.setStorageSync('userInfo', user)

      console.log('[App] 登录成功:', user)
      return { token, user }
    } catch (error) {
      console.error('[App] 登录错误:', error)
      throw error
    }
  },

  /**
   * 统一请求方法
   */
  request(options) {
    const { url, method = 'GET', data = {}, header = {} } = options

    // 添加 token
    const token = this.globalData.token
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    // 添加基础 URL
    const fullUrl = this.globalData.baseUrl + url

    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        method,
        data,
        header,
        timeout: 30000,
        success(res) {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // token 过期，清除登录状态
            wx.removeStorageSync('token')
            wx.removeStorageSync('userInfo')
            reject(new Error('登录已过期，请重新登录'))
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail(error) {
          console.error('[App] 请求错误:', error)
          reject(new Error('网络请求失败'))
        }
      })
    })
  },

  /**
   * 更新用户信息
   */
  updateUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  /**
   * 清除登录状态
   */
  clearLogin() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    console.log('[App] 登录状态已清除')
  }
})