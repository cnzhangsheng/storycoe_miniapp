/**
 * 游戏化激励系统 API
 */

const { get, post } = require('./request')

/**
 * 获取用户游戏化统计
 */
function getStats() {
  return get('/gamification/stats')
}

/**
 * 获取每日任务
 */
function getDailyTask() {
  return get('/gamification/daily-task')
}

/**
 * 领取每日任务奖励
 */
function claimDailyTaskReward() {
  return post('/gamification/daily-task/claim')
}

/**
 * 获取成就列表
 */
function getAchievements() {
  return get('/gamification/achievements')
}

/**
 * 获取星星记录
 * @param {Object} params 查询参数
 */
function getStarsHistory(params = {}) {
  const { page = 1, pageSize = 20 } = params
  return get('/gamification/stars/history', { page, page_size: pageSize })
}

module.exports = {
  getStats,
  getDailyTask,
  claimDailyTaskReward,
  getAchievements,
  getStarsHistory
}