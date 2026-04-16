/**
 * 音频播放器封装 - 参考 Flutter TTS 服务设计
 * 用于 TTS 朗读功能
 */

class AudioPlayer {
  constructor() {
    this.innerAudio = null
    this.isPlaying = false
    this.isPaused = false
    this.speed = 'normal'
    this.currentText = ''
    this.onPlayEnd = null
    this.onError = null
  }

  /**
   * 初始化音频播放器
   */
  init() {
    if (this.innerAudio) {
      this.destroy()
    }

    this.innerAudio = wx.createInnerAudioContext()

    this.innerAudio.onEnded(() => {
      this.isPlaying = false
      this.isPaused = false
      this.currentText = ''
      if (this.onPlayEnd) {
        this.onPlayEnd()
      }
    })

    this.innerAudio.onPause(() => {
      this.isPlaying = false
      this.isPaused = true
    })

    this.innerAudio.onPlay(() => {
      this.isPlaying = true
      this.isPaused = false
    })

    this.innerAudio.onError((error) => {
      console.error('[AudioPlayer] 播放错误:', error)
      this.isPlaying = false
      this.isPaused = false
      if (this.onError) {
        this.onError(error)
      }
    })

    console.log('[AudioPlayer] 初始化完成')
  }

  /**
   * 播放句子
   * @param {string} text 句子文本
   * @param {string} speed 语速 (slow, normal, fast)
   */
  async playSentence(text, speed = 'normal') {
    if (!this.innerAudio) {
      this.init()
    }

    this.speed = speed
    this.currentText = text

    try {
      // 目前后端暂无 TTS 接口，使用提示
      wx.showToast({
        title: 'TTS功能开发中',
        icon: 'none',
        duration: 1500
      })

      console.log('[AudioPlayer] TTS 待播放:', text, 'speed:', speed)

      // 模拟播放状态
      this.isPlaying = true
      this.isPaused = false

      // 返回 Promise 模拟播放完成
      return new Promise((resolve) => {
        setTimeout(() => {
          this.isPlaying = false
          this.isPaused = false
          resolve()
        }, 1000)
      })

    } catch (error) {
      console.error('[AudioPlayer] 播放失败:', error)
      this.isPlaying = false
      this.isPaused = false
      throw error
    }
  }

  /**
   * 暂停播放
   */
  pause() {
    if (this.innerAudio && this.isPlaying) {
      this.innerAudio.pause()
      this.isPlaying = false
      this.isPaused = true
      console.log('[AudioPlayer] 已暂停')
    }
  }

  /**
   * 继续播放
   */
  resume() {
    if (this.innerAudio && this.isPaused) {
      this.innerAudio.play()
      this.isPlaying = true
      this.isPaused = false
      console.log('[AudioPlayer] 已继续')
    }
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.innerAudio) {
      this.innerAudio.stop()
      this.isPlaying = false
      this.isPaused = false
      this.currentText = ''
      console.log('[AudioPlayer] 已停止')
    }
  }

  /**
   * 设置语速
   * @param {string} speed 语速 (slow, normal, fast)
   */
  setSpeed(speed) {
    this.speed = speed
    console.log('[AudioPlayer] 语速设置为:', speed)
  }

  /**
   * 设置播放结束回调
   */
  setOnPlayEnd(callback) {
    this.onPlayEnd = callback
  }

  /**
   * 设置播放错误回调
   */
  setOnError(callback) {
    this.onError = callback
  }

  /**
   * 销毁播放器
   */
  destroy() {
    if (this.innerAudio) {
      this.innerAudio.destroy()
      this.innerAudio = null
    }
    this.isPlaying = false
    this.isPaused = false
    this.currentText = ''
    console.log('[AudioPlayer] 已销毁')
  }
}

module.exports = AudioPlayer