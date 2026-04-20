/**
 * API 请求模块
 * 统一处理请求、响应、错误
 */

const app = getApp()

/**
 * 通用请求方法
 * @param {Object} options 请求配置
 * @returns {Promise} 请求结果
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    timeout = 30000,
    showError = true
  } = options

  // 获取 token
  const token = app.globalData.token || wx.getStorageSync('token')
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  // 添加内容类型
  if (method !== 'GET' && !header['Content-Type']) {
    header['Content-Type'] = 'application/json'
  }

  // 构建完整 URL
  const baseUrl = app.globalData.baseUrl
  const fullUrl = url.startsWith('http') ? url : baseUrl + url

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header,
      timeout,
      success(res) {
        console.log(`[API] ${method} ${url}`, res.data)

        if (res.statusCode === 200) {
          // 业务成功 - 支持两种格式
          // 格式1: {code: 0, message: "...", data: {...}}
          // 格式2: {books: [...], total: 10, ...} (无 code 字段的直接返回)
          if (res.data.code === 0) {
            resolve(res.data)
          } else if (res.data.code === undefined) {
            // 无 code 字段，包装成标准格式
            resolve({ code: 0, message: 'success', data: res.data })
          } else {
            // 业务失败
            const error = res.data.message || '请求失败'
            if (showError) {
              wx.showToast({
                title: error,
                icon: 'none',
                duration: 2000
              })
            }
            reject(new Error(error))
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除登录状态
          app.clearLogin()
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          })
          // 跳转到我的页面（登录入口）
          wx.switchTab({
            url: '/pages/profile/profile'
          })
          reject(new Error('未授权'))
        } else if (res.statusCode === 404) {
          reject(new Error('资源不存在'))
        } else if (res.statusCode >= 500) {
          reject(new Error('服务器错误'))
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail(error) {
        console.error(`[API] ${method} ${url} 失败:`, error)
        if (showError) {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
            duration: 2000
          })
        }
        reject(new Error('网络请求失败'))
      }
    })
  })
}

/**
 * GET 请求
 */
function get(url, data = {}, options = {}) {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST 请求
 */
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

/**
 * 上传文件
 */
function upload(url, filePath, formData = {}) {
  const token = app.globalData.token || wx.getStorageSync('token')
  const baseUrl = app.globalData.baseUrl
  const fullUrl = url.startsWith('http') ? url : baseUrl + url

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: fullUrl,
      filePath,
      name: 'image',  // 后端期望的字段名
      formData,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        const data = JSON.parse(res.data)
        // 支持两种格式：{code: 0, data: {...}} 或 {url: "...", ...}
        if (data.code === 0) {
          resolve(data.data || data)
        } else if (data.url) {
          // 直接返回数据（无 code 字段）
          resolve(data)
        } else {
          reject(new Error(data.message || data.detail || '上传失败'))
        }
      },
      fail(error) {
        console.error('[API] 上传失败:', error)
        reject(new Error('上传失败'))
      }
    })
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  upload
}