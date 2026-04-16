/**
 * 阅读页面 - 严格参考 Flutter 应用设计
 */

const booksApi = require('../../api/books')
const AudioPlayer = require('../../utils/audio-player')

Page({
  data: {
    // 绘本数据
    book: null,
    currentPage: null,
    currentPageIndex: 0,
    sentences: [],
    totalPages: 0,

    // 用户权限
    canEdit: false,
    isInShelf: false, // 是否已收藏

    // 播放状态
    isPlaying: false,
    isPaused: false,
    currentPlayingIndex: -1,
    isPlayingAll: false,

    // 显示设置
    showTranslation: true,
    showSwipeTip: true,

    // 语速设置
    speedIndex: 1, // 0=慢速, 1=正常, 2=快速
    speedLabels: ['慢速', '正常', '快速'],
    audioSpeed: 'normal',

    // 处理状态
    isProcessing: false
  },

  audioPlayer: null,
  bookId: null,

  onLoad(options) {
    const bookId = options.id || options.bookId
    if (!bookId) {
      wx.showToast({ title: '绘本ID不存在', icon: 'none' })
      return
    }
    this.bookId = bookId
    this.audioPlayer = new AudioPlayer()
    this.audioPlayer.init()

    // 3秒后隐藏滑动提示
    setTimeout(() => {
      this.setData({ showSwipeTip: false })
    }, 3000)

    this.loadBookDetail()
  },

  onUnload() {
    if (this.audioPlayer) {
      this.audioPlayer.stop()
      this.audioPlayer.destroy()
    }
  },

  /**
   * 获取基础 URL
   */
  getBaseUrl() {
    try {
      const app = getApp()
      return app.globalData.baseUrl
    } catch (e) {
      return 'http://47.85.201.118:8000'
    }
  },

  /**
   * 获取完整图片URL
   */
  getFullImageUrl(path) {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    return this.getBaseUrl() + path
  },

  /**
   * 处理绘本数据中的图片URL
   */
  processBookData(book) {
    if (book.cover_image) {
      book.cover_image = this.getFullImageUrl(book.cover_image)
    }
    if (book.pages && book.pages.length > 0) {
      book.pages = book.pages.map(page => ({
        ...page,
        image_url: this.getFullImageUrl(page.image_url)
      }))
    }
    return book
  },

  /**
   * 加载绘本详情
   */
  async loadBookDetail() {
    try {
      const res = await booksApi.getBookDetail(this.bookId)
      let book = res.data || res
      book = this.processBookData(book)

      // 检查是否是作者（使用 String 确保 UUID 类型一致性）
      const userInfo = wx.getStorageSync('userInfo')
      const canEdit = userInfo && (String(userInfo.id) === String(book.user_id) || String(userInfo.id) === String(book.author_id))

      // 检查处理状态
      const isProcessing = book.status === 'processing' || book.status === 'generating'

      // 检查是否在书架中（非作者需要检查）
      let isInShelf = false
      if (!canEdit && userInfo) {
        try {
          const shelfRes = await booksApi.checkShelfStatus(this.bookId)
          isInShelf = shelfRes.in_shelf || shelfRes.data?.in_shelf || false
        } catch (e) {
          console.log('[Reading] 检查书架状态失败:', e)
        }
      }

      this.setData({
        book,
        canEdit,
        isInShelf,
        totalPages: book.pages?.length || 0,
        currentPageIndex: 0,
        isProcessing
      })

      if (book.pages && book.pages.length > 0) {
        this.loadCurrentPage()
      }
    } catch (error) {
      console.error('[Reading] 加载绘本失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  /**
   * 加载当前页面
   */
  loadCurrentPage() {
    const { book, currentPageIndex } = this.data
    const page = book.pages[currentPageIndex]

    // 检查页面处理状态
    const isProcessing = page?.status === 'pending' || page?.status === 'processing'

    this.setData({
      currentPage: page,
      sentences: page?.sentences || [],
      isProcessing
    })
  },

  // ========================================
  // 导航栏操作
  // ========================================

  onGoBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/explore/explore' })
      }
    })
  },

  onShowMore() {
    const { canEdit, isInShelf } = this.data

    // 根据权限显示不同菜单
    let items = []
    if (canEdit) {
      // 作者菜单
      items = ['添加页面', '分享设置']
    } else {
      // 非作者菜单（收藏功能）
      items = [isInShelf ? '取消收藏' : '收藏绘本']
    }

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        if (canEdit) {
          switch (res.tapIndex) {
            case 0:
              this.addNewPage()
              break
            case 1:
              this.showShareSettings()
              break
          }
        } else {
          // 非作者：收藏/取消收藏
          this.toggleShelf()
        }
      }
    })
  },

  /**
   * 切换收藏状态
   */
  async toggleShelf() {
    const { isInShelf } = this.data

    try {
      if (isInShelf) {
        await booksApi.removeFromShelf(this.bookId)
        this.setData({ isInShelf: false })
        wx.showToast({ title: '已取消收藏', icon: 'success' })
      } else {
        await booksApi.addToShelf(this.bookId)
        this.setData({ isInShelf: true })
        wx.showToast({ title: '已收藏', icon: 'success' })
      }
    } catch (error) {
      console.error('[Reading] 收藏操作失败:', error)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // ========================================
  // 翻页操作
  // ========================================

  onPrevPage() {
    const { currentPageIndex } = this.data
    if (currentPageIndex <= 0) return

    this.stopAudio()
    this.setData({ currentPageIndex: currentPageIndex - 1 })
    this.loadCurrentPage()
  },

  onNextPage() {
    const { book, currentPageIndex } = this.data
    if (!book?.pages || currentPageIndex >= book.pages.length - 1) return

    this.stopAudio()
    this.setData({ currentPageIndex: currentPageIndex + 1 })
    this.loadCurrentPage()
  },

  // ========================================
  // 图片操作
  // ========================================

  onImageTap() {
    const { currentPage } = this.data
    if (!currentPage?.image_url) return

    wx.previewImage({
      current: currentPage.image_url,
      urls: [currentPage.image_url]
    })
  },

  // ========================================
  // 句子播放操作
  // ========================================

  onSentenceTap(e) {
    const index = e.currentTarget.dataset.index
    if (this.data.currentPlayingIndex === index) {
      // 点击当前激活的句子，切换播放/暂停
      if (this.data.isPlaying) {
        this.pauseAudio()
      } else if (this.data.isPaused) {
        this.resumeAudio()
      } else {
        this.playSentence(index)
      }
    } else {
      // 点击其他句子，播放该句子
      this.playSentence(index)
    }
  },

  async playSentence(index) {
    const sentence = this.data.sentences[index]
    const text = sentence?.en || sentence?.text
    if (!text) return

    this.stopAudio()

    this.setData({
      isPlaying: true,
      isPaused: false,
      currentPlayingIndex: index
    })

    try {
      await this.audioPlayer.playSentence(text, this.data.audioSpeed)
      this.setData({
        isPlaying: false,
        isPaused: false,
        currentPlayingIndex: -1
      })
    } catch (error) {
      console.error('[Reading] 播放失败:', error)
      wx.showToast({ title: '播放失败', icon: 'none' })
      this.setData({
        isPlaying: false,
        isPaused: false,
        currentPlayingIndex: -1
      })
    }
  },

  pauseAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.pause()
    }
    this.setData({
      isPlaying: false,
      isPaused: true,
      isPlayingAll: false
    })
  },

  resumeAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.resume()
    }
    this.setData({
      isPlaying: true,
      isPaused: false
    })
  },

  stopAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.stop()
    }
    this.setData({
      isPlaying: false,
      isPaused: false,
      currentPlayingIndex: -1,
      isPlayingAll: false
    })
  },

  // ========================================
  // 整页朗读
  // ========================================

  async onPlayAll() {
    const { sentences, audioSpeed, isPlayingAll } = this.data

    if (isPlayingAll) {
      this.stopAudio()
      return
    }

    if (!sentences.length) {
      wx.showToast({ title: '暂无句子', icon: 'none' })
      return
    }

    this.stopAudio()
    this.setData({ isPlayingAll: true })

    for (let i = 0; i < sentences.length; i++) {
      if (!this.data.isPlayingAll) break

      const text = sentences[i]?.en || sentences[i]?.text
      if (!text) continue

      this.setData({
        isPlaying: true,
        isPaused: false,
        currentPlayingIndex: i
      })

      try {
        await this.audioPlayer.playSentence(text, audioSpeed)
      } catch (error) {
        console.error('[Reading] 播放句子失败:', error)
        break
      }
    }

    this.setData({
      isPlaying: false,
      isPaused: false,
      currentPlayingIndex: -1,
      isPlayingAll: false
    })
  },

  // ========================================
  // 显示设置
  // ========================================

  onToggleTranslation() {
    this.setData({
      showTranslation: !this.data.showTranslation
    })
  },

  /**
   * 直接设置语速
   */
  onSetSpeed(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const speeds = ['slow', 'normal', 'fast']
    this.setData({
      speedIndex: index,
      audioSpeed: speeds[index]
    })
  },

  onSpeedChange(e) {
    const index = parseInt(e.detail.value)
    const speeds = ['slow', 'normal', 'fast']
    this.setData({
      speedIndex: index,
      audioSpeed: speeds[index]
    })
    wx.showToast({ title: `语速: ${this.data.speedLabels[index]}`, icon: 'none' })
  },

  // ========================================
  // 句子编辑操作
  // ========================================

  onEditSentence(e) {
    const index = e.currentTarget.dataset.index
    const sentence = this.data.sentences[index]
    const currentText = sentence?.en || sentence?.text || ''

    wx.showModal({
      title: '编辑句子',
      editable: true,
      placeholderText: currentText,
      success: async (res) => {
        if (res.confirm && res.content && res.content.trim() !== currentText) {
          try {
            await booksApi.updateSentence(this.bookId, sentence.id, { en: res.content.trim() })
            wx.showToast({ title: '已更新', icon: 'success' })
            this.loadBookDetail()
          } catch (error) {
            wx.showToast({ title: '更新失败', icon: 'none' })
          }
        }
      }
    })
  },

  onDeleteSentence(e) {
    const index = e.currentTarget.dataset.index
    const sentence = this.data.sentences[index]

    wx.showModal({
      title: '删除句子',
      content: '确定要删除这个句子吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await booksApi.deleteSentence(this.bookId, sentence.id)
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadBookDetail()
          } catch (error) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onAddSentence() {
    const { currentPage } = this.data
    if (!currentPage) return

    wx.showModal({
      title: '添加句子',
      editable: true,
      placeholderText: '请输入英文句子...',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await booksApi.createSentence(this.bookId, currentPage.page_number, { en: res.content.trim() })
            wx.showToast({ title: '已添加', icon: 'success' })
            this.loadBookDetail()
          } catch (error) {
            wx.showToast({ title: '添加失败', icon: 'none' })
          }
        }
      }
    })
  },

  // ========================================
  // 页面编辑操作（作者）
  // ========================================

  addNewPage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...' })

        try {
          // 上传图片
          const uploadRes = await booksApi.uploadImage(filePath)
          // 创建页面
          await booksApi.createPage(this.bookId, uploadRes.url)
          wx.hideLoading()
          wx.showToast({ title: '页面已添加', icon: 'success' })
          this.loadBookDetail()
        } catch (error) {
          wx.hideLoading()
          wx.showToast({ title: '添加失败', icon: 'none' })
        }
      }
    })
  },

  showShareSettings() {
    const currentType = this.data.book?.share_type || 'private'
    wx.showActionSheet({
      itemList: ['公开绘本', '私有绘本'],
      success: async (res) => {
        const newType = res.tapIndex === 0 ? 'public' : 'private'
        if (newType !== currentType) {
          try {
            await booksApi.updateBook(this.bookId, { share_type: newType })
            // 更新本地数据
            const book = this.data.book
            book.share_type = newType
            this.setData({ book })
            wx.showToast({ title: '设置已更新', icon: 'success' })
          } catch (error) {
            wx.showToast({ title: '设置失败', icon: 'none' })
          }
        }
      }
    })
  },

  // ========================================
  // 分享
  // ========================================

  onShareAppMessage() {
    const { book } = this.data
    return {
      title: book?.title || '绘本朗读',
      path: `/pages/reading/reading?id=${this.bookId}`,
      imageUrl: book?.cover_image || ''
    }
  }
})