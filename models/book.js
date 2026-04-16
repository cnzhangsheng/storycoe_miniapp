/**
 * 绘本数据模型
 */

// 硬编码 baseUrl 作为后备（避免 getApp() 初始化问题）
const BASE_URL = 'http://47.85.201.118:8000'

/**
 * 获取完整图片URL
 * @param {string} path 图片路径
 */
function getFullImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // 相对路径添加 baseUrl
  try {
    const app = getApp()
    const baseUrl = app?.globalData?.baseUrl || BASE_URL
    return baseUrl + path
  } catch (e) {
    // getApp() 未初始化时使用硬编码值
    return BASE_URL + path
  }
}

class Book {
  constructor(data = {}) {
    this.id = data.id || ''
    this.userId = data.user_id || ''
    this.title = data.title || '未命名绘本'
    this.level = data.level || 1
    this.progress = data.progress || 0
    this.image = getFullImageUrl(data.cover_image || data.image || '')
    this.isNew = data.is_new || false
    this.hasAudio = data.has_audio || false
    this.status = data.status || 'completed'
    this.shareType = data.share_type || 'private'
    this.readCount = data.read_count || 0
    this.shelfCount = data.shelf_count || 0
    this.authorName = data.author_name || '未知'
    this.authorAvatar = getFullImageUrl(data.author_avatar || '')
    this.createdAt = data.created_at || ''
    this.rank = data.rank || 0 // 排行榜排名
  }

  /**
   * 是否为公开绘本
   */
  isPublic() {
    return this.shareType === 'public'
  }

  /**
   * 是否已完成
   */
  isCompleted() {
    return this.status === 'completed'
  }

  /**
   * 格式化阅读数
   */
  formatReadCount() {
    if (this.readCount >= 1000) {
      return `${(this.readCount / 1000).toFixed(1)}k`
    }
    return this.readCount.toString()
  }

  /**
   * 格式化收藏数
   */
  formatShelfCount() {
    if (this.shelfCount >= 1000) {
      return `${(this.shelfCount / 1000).toFixed(1)}k`
    }
    return this.shelfCount.toString()
  }

  /**
   * 从 API 数据创建
   */
  static fromJson(data) {
    return new Book(data)
  }

  /**
   * 批量创建
   */
  static fromJsonList(list) {
    return list.map(item => Book.fromJson(item))
  }
}

/**
 * 绘本页面模型
 */
class BookPage {
  constructor(data = {}) {
    this.id = data.id || ''
    this.bookId = data.book_id || ''
    this.pageNumber = data.page_number || 1
    this.image = data.image || ''
    this.sentences = data.sentences || []
  }

  static fromJson(data) {
    return new BookPage(data)
  }

  static fromJsonList(list) {
    return list.map(item => BookPage.fromJson(item))
  }
}

module.exports = {
  Book,
  BookPage
}