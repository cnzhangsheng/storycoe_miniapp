/**
 * 绘本相关 API
 */

const { get, post, put, del, upload } = require('./request')

/**
 * 通用图片上传
 * @param {string} filePath 图片路径
 */
function uploadImage(filePath) {
  return upload('/generate/upload/image', filePath)
}

/**
 * 获取公开绘本列表
 * @param {Object} params 查询参数
 */
function getPublicBooks(params = {}) {
  const { page = 1, pageSize = 20, level } = params
  // 不传 null 值
  const queryParams = { page, page_size: pageSize }
  if (level) queryParams.level = level
  return get('/books/public', queryParams)
}

/**
 * 获取绘本架列表（我的绘本 + 收藏的绘本）
 * @param {Object} params 查询参数
 */
function getMyBooks(params = {}) {
  const { page = 1, pageSize = 20, status } = params
  return get('/books', { page, page_size: pageSize, status })
}

/**
 * 获取绘本详情
 * @param {string} bookId 绘本ID
 */
function getBookDetail(bookId) {
  return get(`/books/${bookId}`)
}

/**
 * 获取绘本页面详情（含句子）
 * @param {string} bookId 绘本ID
 * @param {number} pageNumber 页码
 */
function getBookPageDetail(bookId, pageNumber) {
  return get(`/books/${bookId}/pages/${pageNumber}`)
}

/**
 * 生成绘本（创作）
 * @param {Object} data 生成参数
 */
function generateBook(data) {
  return post('/books/generate', data)
}

/**
 * 同步生成绘本（创作）
 * @param {Object} data 生成参数
 */
function generateBookSync(data) {
  return post('/generate/book/sync', data)
}

/**
 * 将绘本加入书架/收藏
 * @param {string} bookId 绘本ID
 */
function addToShelf(bookId) {
  return post(`/books/${bookId}/shelf`)
}

/**
 * 从书架移除绘本
 * @param {string} bookId 绘本ID
 */
function removeFromShelf(bookId) {
  return del(`/books/${bookId}/shelf`)
}

/**
 * 检查绘本是否在书架中
 * @param {string} bookId 绘本ID
 */
function checkShelfStatus(bookId) {
  return get(`/books/${bookId}/shelf-status`)
}

/**
 * 上传绘本封面
 * @param {string} filePath 图片路径
 * @param {string} bookId 绘本ID
 */
function uploadCover(filePath, bookId) {
  return upload(`/books/${bookId}/cover`, filePath)
}

/**
 * 上传页面图片
 * @param {string} bookId 绘本ID
 * @param {string} filePath 图片路径
 * @param {number} pageNumber 页码
 */
function uploadPageImage(bookId, filePath, pageNumber) {
  return upload(`/books/${bookId}/pages`, filePath, { page_number: pageNumber })
}

/**
 * 创建句子
 * @param {string} bookId 绘本ID
 * @param {number} pageNumber 页码
 * @param {Object} data 句子数据
 */
function createSentence(bookId, pageNumber, data) {
  return post(`/books/${bookId}/pages/${pageNumber}/sentences`, data)
}

/**
 * 更新句子
 * @param {string} bookId 绘本ID
 * @param {string} sentenceId 句子ID
 * @param {Object} data 句子内容
 */
function updateSentence(bookId, sentenceId, data) {
  return put(`/books/${bookId}/sentences/${sentenceId}`, data)
}

/**
 * 删除句子
 * @param {string} bookId 绘本ID
 * @param {string} sentenceId 句子ID
 */
function deleteSentence(bookId, sentenceId) {
  return del(`/books/${bookId}/sentences/${sentenceId}`)
}

/**
 * 创建新页面
 * @param {string} bookId 绘本ID
 * @param {string} imageUrl 图片URL
 * @param {number} pageNumber 页码（可选）
 */
function createPage(bookId, imageUrl, pageNumber) {
  const data = { image_url: imageUrl }
  if (pageNumber) data.page_number = pageNumber
  return post(`/books/${bookId}/pages`, data)
}

/**
 * 删除页面
 * @param {string} bookId 绘本ID
 * @param {number} pageNumber 页码
 */
function deletePage(bookId, pageNumber) {
  return del(`/books/${bookId}/pages/${pageNumber}`)
}

/**
 * 更新绘本信息（包括分享类型）
 * @param {string} bookId 绘本ID
 * @param {Object} data 更新数据
 */
function updateBook(bookId, data) {
  return put(`/books/${bookId}`, data)
}

/**
 * 完成阅读
 * @param {string} bookId 绘本ID
 */
function completeReading(bookId) {
  return post(`/reading/${bookId}/complete`)
}

/**
 * 获取阅读进度
 * @param {string} bookId 绘本ID
 */
function getReadingProgress(bookId) {
  return get(`/reading/${bookId}`)
}

module.exports = {
  uploadImage,
  getPublicBooks,
  getMyBooks,
  getBookDetail,
  getBookPageDetail,
  generateBook,
  generateBookSync,
  addToShelf,
  removeFromShelf,
  checkShelfStatus,
  uploadCover,
  uploadPageImage,
  createPage,
  deletePage,
  updateBook,
  createSentence,
  updateSentence,
  deleteSentence,
  completeReading,
  getReadingProgress
}