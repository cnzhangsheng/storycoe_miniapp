/**
 * 句子项组件
 */

Component({
  properties: {
    sentence: {
      type: Object,
      value: {}
    },
    index: {
      type: Number,
      value: 0
    },
    isPlaying: {
      type: Boolean,
      value: false
    },
    canEdit: {
      type: Boolean,
      value: false
    },
    audioSpeed: {
      type: String,
      value: 'normal'
    }
  },

  methods: {
    onPlayTap() {
      this.triggerEvent('play', {
        index: this.data.index,
        sentence: this.data.sentence
      })
    },

    onEditTap() {
      this.triggerEvent('edit', {
        index: this.data.index,
        sentence: this.data.sentence
      })
    },

    onDeleteTap() {
      this.triggerEvent('delete', {
        index: this.data.index,
        sentence: this.data.sentence
      })
    }
  }
})