/**
 * 创作页面 - 参考 Flutter 应用设计
 */

const booksApi = require('../../api/books')

Page({
  data: {
    title: '',
    coverImage: '',
    hasCover: false,
    images: [],
    generating: false,
    progress: 0,
    maxImages: 20,

    // 拖拽排序状态
    isDragMode: false,
    dragIndex: -1,
    dragOverIndex: -1,
    dragFloatY: 0,
    dragFloatX: 0,
    dragFloatWidth: 0,
    dragImagePath: ''
  },

  // 拖拽相关变量
  itemWidth: 0,
  itemHeight: 0,
  gridLeft: 0,
  gridTop: 0,
  columns: 4,
  savedImages: [],
  touchStartX: 0,
  touchStartY: 0,
  longPressTimer: null,
  isWaitingLongPress: false,

  onLoad() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再创作绘本',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/profile/profile' })
        }
      })
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().init()
    }
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  // 选择封面
  onChooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          coverImage: res.tempFiles[0].tempFilePath,
          hasCover: true
        })
        wx.showToast({ title: '封面已设置', icon: 'none' })
      }
    })
  },

  // 删除封面
  onDeleteCover() {
    this.setData({
      coverImage: '',
      hasCover: false
    })
  },

  // 选择图片
  onChooseImages() {
    const { images, maxImages } = this.data
    const remaining = maxImages - images.length

    if (remaining <= 0) {
      wx.showToast({ title: `最多上传${maxImages}张图片`, icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remaining > 20 ? 20 : remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => ({
          id: Date.now() + Math.random(),
          path: file.tempFilePath,
          size: file.size
        }))

        const totalImages = [...images, ...newImages]
        this.setData({ images: totalImages })
      }
    })
  },

  // 预览图片
  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.images.map(img => img.path)

    wx.previewImage({
      current: this.data.images[index].path,
      urls: urls
    })
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.slice()
    images.splice(index, 1)
    this.setData({ images })
  },

  // 清空所有图片
  onClearImages() {
    wx.showModal({
      title: '清空图片',
      content: '确定要清空所有图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ images: [] })
        }
      }
    })
  },

  // ========================================
  // 图片拖拽排序（网格布局）
  // ========================================

  onImageTouchStart(e) {
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY

    if (this.data.images.length >= 2 && !this.data.isDragMode) {
      this.isWaitingLongPress = true
      this.longPressTimer = setTimeout(() => {
        this.startImageDragMode(e)
      }, 350)
    }
  },

  onImageTouchMove(e) {
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const deltaX = currentX - this.touchStartX
    const deltaY = currentY - this.touchStartY

    // 移动超过阈值，取消长按检测
    if (this.isWaitingLongPress && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      this.isWaitingLongPress = false
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
    }

    // 拖拽模式下更新浮层位置
    if (this.data.isDragMode && this.data.dragIndex !== -1) {
      // 更新浮层位置（居中显示）
      const floatWidth = this.data.dragFloatWidth
      this.setData({
        dragFloatX: currentX - floatWidth / 2,
        dragFloatY: currentY - 80
      })

      // 计算目标位置（网格）
      const relativeX = currentX - this.gridLeft
      const relativeY = currentY - this.gridTop
      const col = Math.floor(relativeX / this.itemWidth)
      const row = Math.floor(relativeY / this.itemHeight)

      // 边界限制
      const maxCol = Math.min(this.columns - 1, Math.max(0, col))
      const maxRow = Math.max(0, Math.min(row, Math.ceil(this.data.images.length / this.columns) - 1))

      let newIndex = maxRow * this.columns + maxCol
      newIndex = Math.max(0, Math.min(newIndex, this.data.images.length - 1))

      if (newIndex !== this.data.dragOverIndex) {
        this.setData({ dragOverIndex: newIndex })
      }
    }
  },

  onImageTouchEnd(e) {
    this.isWaitingLongPress = false
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    if (this.data.isDragMode) {
      this.finishImageDrag()
    }
  },

  startImageDragMode(e) {
    const index = e.currentTarget.dataset.index
    this.isWaitingLongPress = false

    // 震动反馈
    wx.vibrateShort({ type: 'medium' })

    // 获取网格位置和尺寸
    wx.createSelectorQuery()
      .select('.images-grid')
      .boundingClientRect((rect) => {
        if (!rect) return

        this.gridLeft = rect.left
        this.gridTop = rect.top
        this.itemWidth = rect.width / this.columns - 9 // 减去 gap
        this.itemHeight = this.itemWidth // 正方形

        this.savedImages = [...this.data.images]
        const image = this.data.images[index]

        this.setData({
          isDragMode: true,
          dragIndex: index,
          dragOverIndex: index,
          dragFloatX: this.touchStartX - 38,
          dragFloatY: this.touchStartY - 80,
          dragFloatWidth: 76,
          dragImagePath: image.path
        })
      })
      .exec()
  },

  finishImageDrag() {
    const { dragIndex, dragOverIndex, images } = this.data

    this.setData({
      isDragMode: false,
      dragIndex: -1,
      dragOverIndex: -1,
      dragFloatY: 0,
      dragFloatX: 0,
      dragImagePath: ''
    })

    if (dragIndex === dragOverIndex) {
      return
    }

    // 更新顺序
    const newImages = [...images]
    const [moved] = newImages.splice(dragIndex, 1)
    newImages.splice(dragOverIndex, 0, moved)

    this.setData({ images: newImages })
    wx.showToast({ title: '顺序已调整', icon: 'success' })
  },

  onImageDragStart(e) {
    this.onImageTouchStart(e)
  },

  // ========================================
  // 生成绘本
  // ========================================

  async onGenerate() {
    const { title, coverImage, hasCover, images } = this.data

    // 验证
    if (!title.trim()) {
      wx.showToast({ title: '请输入绘本名称', icon: 'none' })
      return
    }

    if (images.length < 1) {
      wx.showToast({ title: '请先上传照片', icon: 'none' })
      return
    }

    this.setData({ generating: true, progress: 0 })

    try {
      // 上传图片
      const uploadedUrls = []
      const totalImages = images.length + (hasCover ? 1 : 0)

      // 上传封面
      if (hasCover) {
        this.setData({ progress: 5 })
        const uploadRes = await booksApi.uploadImage(coverImage)
        uploadedUrls.push(uploadRes.url)
      }

      // 上传内容图片
      for (let i = 0; i < images.length; i++) {
        const progressPercent = Math.round(((hasCover ? 1 : 0) + i) / totalImages * 50)
        this.setData({ progress: progressPercent })

        const uploadRes = await booksApi.uploadImage(images[i].path)
        uploadedUrls.push(uploadRes.url)
      }

      this.setData({ progress: 60 })

      // 生成绘本
      const generateRes = await booksApi.generateBook({
        title: title.trim(),
        cover_image: hasCover ? uploadedUrls[0] : null,
        images: hasCover ? uploadedUrls.slice(1) : uploadedUrls,
        share_type: 'private'
      })

      this.setData({ progress: 100 })

      // 重置表单
      this.setData({
        title: '',
        coverImage: '',
        hasCover: false,
        images: [],
        generating: false,
        progress: 0
      })

      // 设置刷新标记
      wx.setStorageSync('needRefreshBookshelf', true)

      wx.showModal({
        title: '上传成功',
        content: '绘本已创建成功！',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/bookshelf/bookshelf' })
        }
      })

    } catch (error) {
      console.error('[Create] 生成失败:', error)
      wx.showModal({
        title: '上传失败',
        content: error.message || '请稍后重试',
        showCancel: false
      })
      this.setData({ generating: false, progress: 0 })
    }
  }
})