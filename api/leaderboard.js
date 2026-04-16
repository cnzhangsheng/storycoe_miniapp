/**
 * 排行榜相关 API
 */

const { get } = require('./request')

/**
 * 获取热门绘本榜
 * @param {number} limit 数量限制
 */
function getHotBooks(limit = 12) {
  return get('/leaderboard/books/hot', { limit })
}

/**
 * 获取新星绘本榜
 * @param {number} limit 数量限制
 * @param {number} days 天数范围
 */
function getNewBooks(limit = 10, days = 7) {
  return get('/leaderboard/books/new', { limit, days })
}

/**
 * 获取活跃作者榜
 * @param {number} limit 数量限制
 */
function getAuthors(limit = 5) {
  return get('/leaderboard/authors', { limit })
}

/**
 * 获取排行榜摘要（首页展示）
 */
function getSummary() {
  return get('/leaderboard/summary')
}

module.exports = {
  getHotBooks,
  getNewBooks,
  getAuthors,
  getSummary
}