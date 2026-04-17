/**
 * 用户数据模型
 */

class User {
  constructor(data = {}) {
    this.id = String(data.id || '')
    this.name = data.name || 'Lily 小象'
    this.avatar = data.avatar || ''
    this.level = data.level || 1
    this.stars = data.stars || 0
    this.streak = data.streak || 0
    this.booksRead = data.books_read || 0
    this.booksCreated = data.books_created || 0
    this.levelName = data.level_name || '小读者'
    this.phone = data.phone || ''
    this.createdAt = data.created_at || ''
  }

  /**
   * 格式化星星数
   */
  formatStars() {
    if (this.stars >= 1000) {
      return `${(this.stars / 1000).toFixed(1)}k`
    }
    return this.stars.toString()
  }

  /**
   * 是否有头像
   */
  hasAvatar() {
    return this.avatar && this.avatar.length > 0
  }

  /**
   * 获取默认头像
   */
  getDefaultAvatar() {
    return '/assets/images/default-avatar.png'
  }

  /**
   * 获取显示头像
   */
  getDisplayAvatar() {
    return this.hasAvatar() ? this.avatar : this.getDefaultAvatar()
  }

  /**
   * 从 API 数据创建
   */
  static fromJson(data) {
    return new User(data)
  }
}

/**
 * 游戏化统计模型
 */
class GamificationStats {
  constructor(data = {}) {
    this.level = data.level || 1
    this.levelName = data.level_name || '小读者'
    this.stars = data.stars || 0
    this.streak = data.streak || 0
    this.booksRead = data.books_read || 0
    this.totalStars = data.total_stars || 0
    this.nextLevelStars = data.next_level_stars || 100
    this.progressPercent = data.progress_percent || 0
  }

  static fromJson(data) {
    return new GamificationStats(data)
  }
}

/**
 * 每日任务模型
 */
class DailyTask {
  constructor(data = {}) {
    this.id = String(data.id || '')
    this.readBooks = data.read_books || 0
    this.targetBooks = data.target_books || 3
    this.rewardStars = data.reward_stars || 20
    this.completed = data.completed || false
    this.rewardClaimed = data.reward_claimed || false
    this.progressPercent = data.progress_percent || 0
  }

  /**
   * 是否可领取奖励
   */
  canClaim() {
    return this.completed && !this.rewardClaimed
  }

  static fromJson(data) {
    return new DailyTask(data)
  }
}

module.exports = {
  User,
  GamificationStats,
  DailyTask
}