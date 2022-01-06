



import filters from './filters.js';
import alteration from './alteration.js'
import dorsyMath from './dorsyMath.js'
const alloyImage = function (imageData) {
  this.originalData = imageData;
  this.filters = filters;
  this.alteration = alteration;
}

alloyImage.prototype = {
  layerAdd: function () {
    var numberArr = [], psLibObj, method, alpha, dx, dy, isFast, channel;
    //做重载
    for (var i = 0; i < arguments.length; i++) {
      if (!i) continue;

      switch (typeof (arguments[i])) {
        case "string":
          if (/\d+%/.test(arguments[i])) {//alpha
            alpha = arguments[i].replace("%", "");
          } else if (/[RGB]+/.test(arguments[i])) {//channel
            channel = arguments[i];
          } else {//method
            method = arguments[i];
          }
          break;

        case "number":
          numberArr.push(arguments[i]);
          break;

        case "boolean":
          isFast = arguments[i];
          break;
      }
    }

    //赋值
    dx = numberArr[0] || 0;
    dy = numberArr[1] || 0;
    method = method || "正常";
    alpha = alpha / 100 || 1;
    isFast = isFast || false;
    channel = channel || "RGB";

    psLibObj = arguments[0];
    // console.log("this.originalData, arguments[0]", this.originalData, arguments[0])
    return this.add(this.originalData, arguments[0], method, alpha, dx, dy, isFast, channel);
  },

  /**
   * method add
   * params {ImageData} lowerData
   */
  add: function (lowerData, upperData, method, alpha, dx, dy, isFast, channel) {
    var l = lowerData.data,
      u = upperData.data,

      dx = dx || 0,
      dy = dy || 0,
      alpha = alpha || 1,//alpha 范围为0 - 100
      isFast = isFast || false,
      channel = channel || "RGB";

    if (!(/[RGB]+/.test(channel))) {
      channel = "RGB";
    }

    var channelString = channel.replace("R", "0").replace("G", "1").replace("B", "2"),
      jump = 1,
      result,
      width = lowerData.width,
      height = lowerData.height,
      upperLength = u.length,
      upperWidth = upperData.width,
      upperHeight = upperData.height,

      indexOfArr = [
        channelString.indexOf("0") > -1,
        channelString.indexOf("1") > -1,
        channelString.indexOf("2") > -1
      ],
      everyJump = 4 * jump;

    /*
    if(isFast){
      jump = 1; 
    }
    */

    var ii, row, col, uRow, uCol, uIi, uI;

    //计算重叠部分x ,y范围
    var xMin, yMin, xMax, yMax;

    var uXMin = dx;
    var uXMax = dx + upperWidth;
    var uYMin = dy;
    var uYMax = dy + upperHeight;

    if (uXMin > width) {
      return;
    } else if (uXMin < 0) {
      uXMin = 0;
    }

    if (uXMax < 0) {
      return;
    } else if (uXMax > width) {
      uXMax = width;
    }

    if (uYMin > height) {
      return;
    } else if (uYMin < 0) {
      uYMin = 0;
    }

    if (uYMax < 0) {
      return;
    } else if (uYMax > height) {
      uYMax = height;
    }


    var currRow, upperY, upperRow;
    for (var y = uYMin; y < uYMax; y++) {
      currRow = y * width;
      upperY = y - dy;
      upperRow = upperY * upperWidth;

      for (var x = uXMin; x < uXMax; x++) {
        //计算此时对应的upperX,Y
        var upperX = x - dx;

        //计算此时的i
        var i = (currRow + x) * 4;

        //计算此时的upperI
        var uI = (upperRow + upperX) * 4;

        //for(var i = 0, n = l.length; i < n; i += everyJump){

        //ii = i / 4;

        //得到当前点的坐标 y分量
        //row = ~~(ii / width); 
        //col = ii % width;

        //uRow = row - dy;
        //uCol = col - dx;

        //uIi = uRow * upperWidth + uCol;
        //uI = uIi * 4;

        //if(uI >= 0 && uI < (upperLength - 4) && uCol < upperWidth && uCol >= 0){

        //l[i + 3] = u[uI + 3];//透明度
        for (var j = 0; j < 3; j++) {

          //若此点透明则不计算
          if (u[uI + 3] == 0) break;
          else l[i + 3] = u[uI + 3];

          switch (method) {
            case "颜色减淡":
              if (indexOfArr[j]) {
                result = l[i + j] + (l[i + j] * u[uI + j]) / (255 - u[uI + j]);
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "变暗":
              if (indexOfArr[j]) {
                result = l[i + j] < u[uI + j] ? l[i + j] : u[uI + j];
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "变亮":
              if (indexOfArr[j]) {
                result = l[i + j] > u[uI + j] ? l[i + j] : u[uI + j];
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "正片叠底":
              if (indexOfArr[j]) {
                result = ~~((l[i + j] * u[uI + j]) / 255);
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "滤色":
              if (indexOfArr[j]) {
                result = ~~(255 - (255 - l[i + j]) * (255 - u[uI + j]) / 255);
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "叠加":
              if (indexOfArr[j]) {
                if (l[i + j] <= 127.5) {
                  result = l[i + j] * u[uI + j] / 127.5;
                } else {
                  result = 255 - (255 - l[i + j]) * (255 - u[uI + j]) / 127.5;
                }
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "强光":
              if (indexOfArr[j]) {
                if (u[uI + j] <= 127.5) {
                  result = l[i + j] * u[uI + j] / 127.5;
                } else {
                  result = l[i + j] + (255 - l[i + j]) * (u[uI + j] - 127.5) / 127.5;
                }
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "差值":
              if (indexOfArr[j]) {
                result = l[i + j] > u[uI + j] ? l[i + j] - u[uI + j] : u[uI + j] - l[i + j];
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "排除":
              if (indexOfArr[j]) {
                result = l[i + j] + u[uI + j] - (l[i + j] * u[uI + j]) / 127.5;
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "点光":
              if (indexOfArr[j]) {
                if (l[i + j] < (2 * u[uI + j] - 255)) {
                  result = 2 * u[uI + j] - 255;
                } else if (l[i + j] < 2 * u[uI + j]) {
                  result = l[i + j];
                } else {
                  result = 2 * u[uI + j];
                }
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "颜色加深":
              if (indexOfArr[j]) {
                result = 255 - 255 * (255 - l[i + j]) / u[uI + j];
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "线性加深":
              if (indexOfArr[j]) {
                var tempR = l[i + j] + u[uI + j];
                result = tempR > 255 ? tempR - 255 : 0;
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "线性减淡":
              if (indexOfArr[j]) {
                var tempR = l[i + j] + u[uI + j];
                result = tempR > 255 ? 255 : tempR;
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "柔光":
              if (indexOfArr[j]) {
                if (u[uI + j] < 127.5) {
                  result = ((2 * u[uI + j] - 255) * (255 - l[i + j]) / (255 * 255) + 1) * l[i + j];
                } else {
                  result = (2 * u[uI + j] - 255) * (Math.sqrt(l[i + j] / 255) - l[i + j] / 255) + l[i + j];
                }
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "亮光":
              if (indexOfArr[j]) {
                if (u[uI + j] < 127.5) {
                  result = (1 - (255 - l[i + j]) / (2 * u[uI + j])) * 255;
                } else {
                  result = l[i + j] / (2 * (1 - u[uI + j] / 255));
                }
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            case "线性光":
              if (indexOfArr[j]) {
                var tempR = l[i + j] + 2 * u[uI + j] - 255;
                result = tempR > 255 ? 255 : tempR;
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;
            case "实色混合":
              if (indexOfArr[j]) {
                if (u[uI + j] < (255 - l[i + j])) {
                  result = 0;
                } else {
                  result = 255;
                }
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
              break;

            default:
              if (indexOfArr[j]) {
                result = u[uI + j];
                l[i + j] = (1 - alpha) * l[i + j] + (alpha) * result;
              }
          }//end switch
        }//end for
      }//end y

    }//end x

    lowerData.data.set(l)
    return lowerData;
  },

  // 中文方法名
  reflect: function (method, imgData, args) {

    // 组合
    var ComEffect = {
      "美肤": "softenFace",
      "素描": "sketch",
      "自然增强": "softEnhancement",
      "紫调": "purpleStyle",
      "柔焦": "soften",
      "复古": "vintage",
      "黑白": "gray",
      "仿lomo": "lomo",
      "亮白增强": "strongEnhancement",
      "灰白": "strongGray",
      "灰色": "lightGray",
      "暖秋": "warmAutumn",
      "木雕": "carveStyle",
      "粗糙": "rough"
    }


    switch (method) {
      case "美肤":
        return this.softenFace();
        break;
      case "素描":
        return this.sketch()
        break;
      case "自然增强": return this.softEnhancement()
        break;
      case "紫调": return this.purpleStyle()
        break;
      case "柔焦": return this.soften()
        break;
      case "复古": return this.vintage()
        break;
      case "黑白": return this.gray()
        break;
      case "仿lomo": return this.lomo()
        break;
      case "亮白增强": return this.strongEnhancement()
        break;
      case "灰白": return this.strongGray()
        break;
      case "灰色": return this.lightGray()
        break;
      case "暖秋": return this.warmAutumn()
        break;
      case "木雕": return this.carveStyle()
        break;
      case "粗糙": return this.rough()
        break;
    }
  },
  // 美肤
  softenFace: function () {
    let _this = this.clone();
    return this.alteration.reflect('亮度', this.layerAdd(
      _this.filters.reflect('高斯模糊', _this.originalData, [10]), "滤色"
    ), [-10, 5])
  },
  // 素描
  sketch: function () {
    var _this = this.clone();

    return this.filters.sharp(
      this.filters.toGray(
        this.layerAdd(
          _this.filters.reflect(
            '高斯模糊',
            _this.filters.reflect('反色', _this.originalData),
            [8]),
          "颜色减淡"
        )), [1]
    )
  },
  // 自然
  softEnhancement: function () {
    return this.alteration.reflect('曲线', this.originalData, [[0, 190, 255], [0, 229, 255]])
  },
  // 紫调
  purpleStyle: function () {
    var _this = this.clone();
    return this.layerAdd(_this.filters.reflect('高斯模糊', _this.originalData, [3]), "正片叠底", "RG")
  },
  // 自然
  soften: function () {
    var _this = this.clone();
    return this.layerAdd(
      _this.filters.reflect('高斯模糊', _this.originalData, [6]), "变暗"
    );
  },
  // 复古
  vintage: function () {
    return
  },
  gray: function () {
    return this.filters.reflect('灰度处理', this.originalData)
  },

  lomo: function () {
    let _this = this;
    let m = _this.layerAdd(this.clone().originalData, "滤色")
    m = _this.layerAdd(m, "柔光")
    let a = _this.layerAdd(_this.filters.reflect('反色', this.clone().originalData), "正常", "20%", "B")
    let b = _this.filters.reflect('暗角', a, [6, 200])
    return this.add(m, b)
  },
  // 亮白
  strongEnhancement: function () {
    let _this = this.clone();
    return _this.layerAdd((this.alteration.reflect('曲线', this.clone().originalData, [[0, 50, 255], [0, 234, 255]])), '柔光')
  },

  // 灰白
  strongGray: function () {
    // this.act("灰度处理").act("曲线", [0, 61, 69, 212, 255], [0, 111, 176, 237, 255]);
    console.log(this.originalData);
    return this.alteration.reflect('曲线', this.filters.reflect('灰度处理', this.originalData), [[0, 61, 69, 212, 255], [0, 111, 176, 237, 255]])
  },

  // 灰色
  lightGray: function () {
    return this.alteration.reflect('曲线', this.filters.reflect('灰度处理', this.originalData), [[0, 60, 142, 194, 255], [0, 194, 240, 247, 255]])
  },
  // 暖秋
  warmAutumn: function () {
    let _this = this.clone();
    return this.layerAdd(_this.filters.reflect('暗角', _this.alteration.reflect('调整RGB', _this.originalData, [36, 47, 8, true]), [6, 150]), '叠加')

  },

  // 木雕
  carveStyle: function () {
    let _this = this.clone();
    return this.layerAdd(
      _this.filters.reflect('浮雕效果', _this.filters.reflect('查找边缘', _this.filters.reflect('马赛克', _this.originalData, []))),
      "线性光"
    )
  },

  // 粗超
  rough: function () {
    return ;
  },

  // // 动作
  // act: function (method, arg) {
  //   // this.

  // },

  // 复制图层
  clone() {
    let newData = {};
    newData.width = this.originalData.width;
    newData.height = this.originalData.height;
    newData.data = new Uint8ClampedArray(this.originalData.data);
    newData.dataUnion = new Uint8ClampedArray(this.originalData.dataUnion);
    let tempPsLib = new alloyImage(newData)
    return tempPsLib;
  },
}

export default alloyImage