/**
 * 登录态管理工具
 */

const app = getApp()

/**
 * 检查是否已登录
 */
function isLoggedIn() {
  return app.globalData.isLoggedIn || !!wx.getStorageSync('token')
}

/**
 * 获取 token
 */
function getToken() {
  return app.globalData.token || wx.getStorageSync('token')
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return app.globalData.userInfo || wx.getStorageSync('userInfo')
}

/**
 * 保存登录状态
 */
function saveLoginState(token, userInfo) {
  app.globalData.token = token
  app.globalData.userInfo = userInfo
  app.globalData.isLoggedIn = true

  wx.setStorageSync('token', token)
  wx.setStorageSync('userInfo', userInfo)
}

/**
 * 清除登录状态
 */
function clearLoginState() {
  app.clearLogin()
}

/**
 * 需要登录的操作装饰器
 * @param {Function} callback 登录后执行的回调
 */
function requireLogin(callback) {
  if (isLoggedIn()) {
    callback()
  } else {
    wx.showModal({
      title: '提示',
      content: '请先登录后再进行此操作',
      confirmText: '去登录',
      success(res) {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        }
      }
    })
  }
}

module.exports = {
  isLoggedIn,
  getToken,
  getUserInfo,
  saveLoginState,
  clearLoginState,
  requireLogin
}