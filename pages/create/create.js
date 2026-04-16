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
    shareType: 'private', // private 或 public
    generating: false,
    progress: 0,
    maxImages: 20
  },

  onLoad() {
    // 检查登录状态
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

  // 设置分享类型
  onSetShareType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ shareType: type })
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
        if (newImages.length < res.tempFiles.length) {
          wx.showToast({ title: `已达到最大数量，仅添加了${newImages.length}张`, icon: 'none' })
        }

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

  // 生成绘本
  async onGenerate() {
    const { title, coverImage, hasCover, images, shareType } = this.data

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
        share_type: shareType
      })

      console.log('[Create] 生成成功:', generateRes)

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

      // 设置刷新标记，通知书架页面需要刷新
      wx.setStorageSync('needRefreshBookshelf', true)

      wx.showModal({
        title: '上传成功',
        content: '绘本已创建成功！',
        showCancel: false,
        success: () => {
          // 跳转到书架
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