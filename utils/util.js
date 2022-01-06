module.exports = {
  createImage() {
    // 创建离屏canvas
    const canvas = wx.createOffscreenCanvas({
      type: '2d',
    })
    // 创建一个图片
    const image = canvas.createImage()
    return image
  },
  createCanvasContext(width, height) {
    const canvas = wx.createOffscreenCanvas({
      type: '2d',
      width,
      height,
    })
    const context = canvas.getContext("2d")
    return [canvas, context]
  }
}