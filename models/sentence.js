/**
 * 句子数据模型
 */

class Sentence {
  constructor(data = {}) {
    this.id = data.id || ''
    this.pageId = data.page_id || ''
    this.content = data.content || ''
    this.translation = data.translation || ''
    this.order = data.order || 0
    this.audioUrl = data.audio_url || ''
  }

  /**
   * 是否有翻译
   */
  hasTranslation() {
    return this.translation && this.translation.length > 0
  }

  /**
   * 获取显示内容
   */
  getDisplayContent() {
    return this.content || ''
  }

  /**
   * 从 API 数据创建
   */
  static fromJson(data) {
    return new Sentence(data)
  }

  /**
   * 批量创建
   */
  static fromJsonList(list) {
    return list.map(item => Sentence.fromJson(item))
  }
}

module.exports = {
  Sentence
}