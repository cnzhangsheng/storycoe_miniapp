/**
 * 认证相关 API
 */

const { post, get } = require('./request')

/**
 * 微信小程序登录
 * @param {string} code 微信登录凭证
 */
function wechatLogin(code) {
  return post('/auth/wechat-login', { code })
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  return get('/auth/me')
}

/**
 * 更新用户资料
 * @param {Object} data 用户数据
 */
function updateProfile(data) {
  return post('/users/me', data)
}

/**
 * 上传头像
 * @param {string} filePath 文件路径
 */
function uploadAvatar(filePath) {
  const { upload } = require('./request')
  return upload('/users/avatar', filePath)
}

/**
 * 退出登录
 */
function logout() {
  // 清除本地存储
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')

  const app = getApp()
  app.clearLogin()

  return Promise.resolve({ code: 0, message: '已退出登录' })
}

module.exports = {
  wechatLogin,
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  logout
}