/**
 * 本地存储工具
 */

/**
 * 获取存储数据
 * @param {string} key 存储键名
 */
function get(key) {
  try {
    return wx.getStorageSync(key)
  } catch (error) {
    console.error('[Storage] 获取失败:', key, error)
    return null
  }
}

/**
 * 设置存储数据
 * @param {string} key 存储键名
 * @param {*} value 存储值
 */
function set(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (error) {
    console.error('[Storage] 设置失败:', key, error)
    return false
  }
}

/**
 * 删除存储数据
 * @param {string} key 存储键名
 */
function remove(key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (error) {
    console.error('[Storage] 删除失败:', key, error)
    return false
  }
}

/**
 * 清除所有存储
 */
function clear() {
  try {
    wx.clearStorageSync()
    return true
  } catch (error) {
    console.error('[Storage] 清除失败:', error)
    return false
  }
}

/**
 * 获取所有存储信息
 */
function getInfo() {
  try {
    return wx.getStorageInfoSync()
  } catch (error) {
    console.error('[Storage] 获取信息失败:', error)
    return null
  }
}

// 常用存储键名
const KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  SEARCH_HISTORY: 'searchHistory',
  LAST_READ_BOOK: 'lastReadBook',
  READING_PROGRESS: 'readingProgress',
  DAILY_TASK: 'dailyTask',
  THEME: 'theme'
}

module.exports = {
  get,
  set,
  remove,
  clear,
  getInfo,
  KEYS
}