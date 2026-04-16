/**
 * 绘本卡片组件
 */

Component({
  properties: {
    book: {
      type: Object,
      value: {}
    },
    mode: {
      type: String,
      value: 'grid' // grid 或 list
    },
    showAuthor: {
      type: Boolean,
      value: true
    },
    showStats: {
      type: Boolean,
      value: true
    }
  },

  data: {
    defaultCover: '/assets/images/default-cover.png'
  },

  methods: {
    onTap() {
      const book = this.data.book
      if (!book?.id) return

      this.triggerEvent('tap', { book })
      wx.navigateTo({
        url: `/pages/reading/reading?id=${book.id}`
      })
    },

    onLikeTap(e) {
      e.stopPropagation()
      const book = this.data.book
      this.triggerEvent('like', { book })
    }
  }
})