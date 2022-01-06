import AlloyImage from "../../alloyimage/alloyImage.js"
import {
  createImage,
  createCanvasContext
} from '../../utils/util'

let canvasWidth = 1239;
let canvasHeight = 696;
// 原图画布

Page({
  canvas: null, // 画布
  ctx: null,
  originalCanvas: null,
  originalCtx: null,
  data: {
    canvasWidth,
    canvasHeight,
    priviewImageStyle: "width: 100%",
    originalImageUrl: '',
    originalImageInfo: null,
    handleResults: {},
  },

  onShow() {
    wx.createSelectorQuery().select('#canvas').node((res) => {
      this.canvas = res.node;
      this.canvas.width = canvasWidth
      this.canvas.height = canvasHeight
      this.ctx = this.canvas.getContext("2d")
    }).exec()
  },
  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: "original",
    }).then(res => {
      return wx.getImageInfo({
        src: res.tempFilePaths[0],
      })
    }).then(async res => {
      canvasWidth = parseInt(res.width / (res.width / canvasWidth))
      canvasHeight = parseInt(res.height / (res.width / canvasWidth))
      this.canvas.height = canvasHeight;
      this.canvas.width = canvasWidth;
      console.log("image path", res.path);
      console.log("image width", canvasWidth)
      console.log("image height", canvasHeight)
      const image = createImage()
      // 等待图片加载
      await new Promise(resolve => {
        image.onload = resolve
        image.src = res.path
      })
      if (!this.originalCanvas) {
         // 创建一个离屏canvas 缓存原图
        const [originalCanvas, originalCtx] = createCanvasContext(canvasWidth, canvasHeight)
        this.originalCanvas = originalCanvas;
        this.originalCtx = originalCtx;
      }

      this.originalCtx.fillRect(0, 0, canvasWidth, canvasHeight)
      this.originalCtx.drawImage(image, 0, 0, canvasWidth, canvasHeight)
      this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      this.ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight)
      return wx.canvasToTempFilePath({
        canvas: this.canvas,
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        destWidth: canvasWidth,
        destHeight: canvasHeight,
      }, this)
    }).then(res => {
      this.data.handleResults = {}
      this.setData({
        currentImageUrl: res.tempFilePath,
        originalImageUrl: res.tempFilePath
      })
    })
  },
  chooseFilter(e) {
    let originalImgLink = this.data.originalImageUrl;
    let filter = e.currentTarget.dataset.filter;
    console.log(filter)
    if (filter === '原图') {
      this.setData({
        currentImageUrl: originalImgLink
      })
      return;
    }
    // 判断是否有缓存
    if (this.data.handleResults.hasOwnProperty(filter)) {
      this.setData({
        currentImageUrl: this.data.handleResults[filter]
      })
      return;
    }

    const imageData = this.originalCtx.getImageData(0, 0, canvasWidth, canvasHeight)

    let alloyImage = new AlloyImage(imageData)
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    console.time("处理时间")
    let result = alloyImage.reflect(filter);
    console.timeEnd("处理时间")
    wx.hideLoading()
    this.ctx.putImageData(result, 0, 0)

    wx.canvasToTempFilePath({
      canvas: this.canvas,
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      destWidth: canvasWidth,
      destHeight: canvasHeight,
    }, this).then(res => {
      this.setData({
        currentImageUrl: res.tempFilePath,
      })
      // 缓存
      this.data.handleResults[filter] = res.tempFilePath;
    })

  }
})