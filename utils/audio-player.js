/**
 * 音频播放器封装 - 播放后端生成的 TTS 音频文件
 * 用于绘本朗读功能
 */

class AudioPlayer {
  constructor() {
    this.innerAudio = null
    this.isPlaying = false
    this.isPaused = false
    this.currentUrl = ''
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
      this.currentUrl = ''
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
   * 播放音频文件
   * @param {string} url 音频 URL
   */
  async playAudio(url) {
    if (!this.innerAudio) {
      this.init()
    }

    this.currentUrl = url
    this.innerAudio.src = url
    this.innerAudio.play()

    // 返回 Promise，等待播放完成
    return new Promise((resolve, reject) => {
      const originalOnEnd = this.onPlayEnd
      const originalOnError = this.onError

      this.onPlayEnd = () => {
        this.onPlayEnd = originalOnEnd
        this.onError = originalOnError
        resolve()
      }

      this.onError = (error) => {
        this.onPlayEnd = originalOnEnd
        this.onError = originalOnError
        reject(error)
      }
    })
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
      this.currentUrl = ''
      console.log('[AudioPlayer] 已停止')
    }
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
    this.currentUrl = ''
    console.log('[AudioPlayer] 已销毁')
  }
}

module.exports = AudioPlayer