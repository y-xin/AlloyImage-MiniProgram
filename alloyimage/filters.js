import dorsyMath from './dorsyMath.js'
// 滤镜
var filters = {
  reflect: function (method, imgData, arg) {
    switch (method) {
      case "马赛克": return this.mosaic(imgData, arg); break;
      case "腐蚀": return this.corrode(imgData, arg); break;
      case "暗角": return this.darkCorner(imgData, arg); break;
      case "浮雕效果": return this.embossment(imgData, arg); break;
      case "高斯模糊": return this.gaussBlur(imgData, arg); break;
      case "灰度扩展": return this.ImageEnhance(imgData, arg); break;
      case "查找边缘": return this.borderline(imgData, arg); break;
      case "添加杂色": return this.noise(imgData, arg); break;
      case "油画": return this.oilPainting(imgData, arg); break;
      case "色调分离": return this.posterize(imgData, arg); break;
      case "棕褐色": return this.sepia(imgData, arg); break;
      case "锐化": return this.sharp(imgData, arg); break;
      case "灰度处理": return this.toGray(imgData, arg); break;
      case "反色": return this.toReverse(imgData, arg); break;
      case "灰度阈值": return this.toThresh(imgData, arg); break;
    }
  },

  // 马赛克 
  mosaic: function (imgData, arg) {//调节亮度对比度
    var R = parseInt(arg[0]) || 3;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var xLength = R * 2 + 1;
    for (var x = 0, n = parseInt(width / xLength); x < n; x++) {
      for (var y = 0, m = parseInt(height / xLength); y < m; y++) {
        var average = [], sum = [0, 0, 0];
        for (var i = 0; i < xLength; i++) {
          for (var j = 0; j < xLength; j++) {
            var realI = (y * xLength + i) * width + x * xLength + j;
            sum[0] += data[realI * 4];
            sum[1] += data[realI * 4 + 1];
            sum[2] += data[realI * 4 + 2];
          }
        }
        average[0] = sum[0] / (xLength * xLength);
        average[1] = sum[1] / (xLength * xLength);
        average[2] = sum[2] / (xLength * xLength);
        for (var i = 0; i < xLength; i++) {
          for (var j = 0; j < xLength; j++) {
            var realI = (y * xLength + i) * width + x * xLength + j;
            data[realI * 4] = average[0];
            data[realI * 4 + 1] = average[1];
            data[realI * 4 + 2] = average[2];
          }
        }

      }
    }
    return imgData;
  },
  dotted: function (imgData, arg) {//调节亮度对比度
    //矩形半径
    var R = parseInt(arg[0]) || 1;

    //内小圆半径
    var r = parseInt(arg[1]) || 1;

    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var xLength = R * 2 + 1;

    //构造距离模板
    var disTmlMatrix = [
    ];

    var r2 = r * r;
    for (var x = -R; x < R; x++) {

      for (var y = -R; y < R; y++) {
        if ((x * x + y * y) > r2) {
          disTmlMatrix.push([x, y]);
        }
      }

    }

    var xyToIFun = dorsyMath.xyToIFun(width);

    //将大于距离外面的透明度置为0
    for (var x = 0, n = parseInt(width / xLength); x < n; x++) {

      for (var y = 0, m = parseInt(height / xLength); y < m; y++) {
        var middleX = parseInt((x + 0.5) * xLength);
        var middleY = parseInt((y + 0.5) * xLength);

        for (var i = 0; i < disTmlMatrix.length; i++) {
          var dotX = middleX + disTmlMatrix[i][0];
          var dotY = middleY + disTmlMatrix[i][1];

          //data[(dotY * width + dotX) * 4 + 3] = 0;
          data[xyToIFun(dotX, dotY, 3)] = 225;
          data[xyToIFun(dotX, dotY, 2)] = 225;
          data[xyToIFun(dotX, dotY, 0)] = 225;
          data[xyToIFun(dotX, dotY, 1)] = 225;
        }
      }

    }
    return imgData;
  },
  // 腐蚀
  corrode: function (imgData, arg) {
    var R = parseInt(arg[0]) || 3;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var xLength = R * 2 + 1;

    //区块
    for (var x = 0; x < width; x++) {

      for (var y = 0; y < height; y++) {

        var randomI = parseInt(Math.random() * R * 2) - R;//区块随机代表
        var randomJ = parseInt(Math.random() * R * 2) - R;//区块随机代表
        var realI = y * width + x;
        var realJ = (y + randomI) * width + x + randomJ;

        for (var j = 0; j < 3; j++) {
          data[realI * 4 + j] = data[realJ * 4 + j];
        }

      }

    }

    return imgData;
  },
  // 暗角
  darkCorner: function (imgData, arg) {
    //暗角级别 分1-10级吧
    var R = parseInt(arg[0]) || 3;

    //暗角的形状
    var type = arg[2] || "round";

    //暗角最终的级别 0 - 255
    var lastLevel = arg[1] || 30;

    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var xLength = R * 2 + 1;

    //计算中心点
    var middleX = width * 2 / 3;
    var middleY = height * 1 / 2;

    //计算距中心点最长距离
    var maxDistance = dorsyMath.distance([middleX, middleY]);
    //开始产生暗角的距离
    var startDistance = maxDistance * (1 - R / 10);

    var f = function (x, p0, p1, p2, p3) {

      //基于三次贝塞尔曲线 
      return p0 * Math.pow((1 - x), 3) + 3 * p1 * x * Math.pow((1 - x), 2) + 3 * p2 * x * x * (1 - x) + p3 * Math.pow(x, 3);
    }

    //计算当前点应增加的暗度
    function calDark(x, y, p) {
      //计算距中心点距离
      var distance = dorsyMath.distance([x, y], [middleX, middleY]);
      var currBilv = (distance - startDistance) / (maxDistance - startDistance);
      if (currBilv < 0) currBilv = 0;

      //应该增加暗度
      return f(currBilv, 0, 0.02, 0.3, 1) * p * lastLevel / 255;
    }

    //区块
    for (var x = 0; x < width; x++) {

      for (var y = 0; y < height; y++) {

        var realI = y * width + x;
        for (var j = 0; j < 3; j++) {
          var dDarkness = calDark(x, y, data[realI * 4 + j]);
          data[realI * 4 + j] -= dDarkness;
        }

      }

    }
    return imgData;
  },
  // 浮雕效果
  embossment: function (imgData, arg) {//调节亮度对比度
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;

    var outData = [];
    for (var i = 0, n = data.length; i < n; i += 4) {

      var ii = i / 4;
      var row = parseInt(ii / width);
      var col = ii % width;
      var A = ((row - 1) * width + (col - 1)) * 4;
      var G = (row + 1) * width * 4 + (col + 1) * 4;

      if (row == 0 || col == 0) continue;
      for (var j = 0; j < 3; j++) {
        outData[i + j] = data[A + j] - data[G + j] + 127.5;
      }
      outData[i + 4] = data[i + 4];
    }

    for (var i = 0, n = data.length; i < n; i++) {
      data[i] = outData[i] || data[i];
    }


    return imgData;
  },

  /**
   * 高斯模糊
   * @param  {Array} pixes  pix array
   * @param  {Number} width 图片的宽度
   * @param  {Number} height 图片的高度
   * @param  {Number} radius 取样区域半径, 正数, 可选, 默认为 3.0
   * @param  {Number} sigma 标准方差, 可选, 默认取值为 radius / 3
   * @return {Array}
   */
  gaussBlur: function (imgData, args) {
    // var imgData.data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var gaussMatrix = [],
      gaussSum = 0,
      x, y,
      r, g, b, a,
      i, j, k, len;
    var radius = args[0];
    var sigma = args[1];
    radius = Math.floor(radius) || 3;
    sigma = sigma || radius / 3;
    a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
    b = -1 / (2 * sigma * sigma);
    //生成高斯矩阵
    for (i = 0, x = -radius; x <= radius; x++ , i++) {
      g = a * Math.exp(b * x * x);
      gaussMatrix[i] = g;
      gaussSum += g;
    }
    //归一化, 保证高斯矩阵的值在[0,1]之间
    for (i = 0, len = gaussMatrix.length; i < len; i++) {
      gaussMatrix[i] /= gaussSum;
    }
    //x 方向一维高斯运算
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        r = g = b = a = 0;
        gaussSum = 0;
        for (j = -radius; j <= radius; j++) {
          k = x + j;
          if (k >= 0 && k < width) {//确保 k 没超出 x 的范围
            //r,g,b,a 四个一组
            i = (y * width + k) * 4;
            r += imgData.data[i] * gaussMatrix[j + radius];
            g += imgData.data[i + 1] * gaussMatrix[j + radius];
            b += imgData.data[i + 2] * gaussMatrix[j + radius];
            // a += imgData.data[i + 3] * gaussMatrix[j];
            gaussSum += gaussMatrix[j + radius];
          }
        }
        i = (y * width + x) * 4;
        // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
        // console.log(gaussSum)
        imgData.data[i] = r / gaussSum;
        imgData.data[i + 1] = g / gaussSum;
        imgData.data[i + 2] = b / gaussSum;
        // imgData.data[i + 3] = a ;
      }
    }
    //y 方向一维高斯运算
    for (x = 0; x < width; x++) {
      for (y = 0; y < height; y++) {
        r = g = b = a = 0;
        gaussSum = 0;
        for (j = -radius; j <= radius; j++) {
          k = y + j;
          if (k >= 0 && k < height) {//确保 k 没超出 y 的范围
            i = (k * width + x) * 4;
            r += imgData.data[i] * gaussMatrix[j + radius];
            g += imgData.data[i + 1] * gaussMatrix[j + radius];
            b += imgData.data[i + 2] * gaussMatrix[j + radius];
            // a += imgData.data[i + 3] * gaussMatrix[j];
            gaussSum += gaussMatrix[j + radius];
          }
        }
        i = (y * width + x) * 4;
        imgData.data[i] = r / gaussSum;
        imgData.data[i + 1] = g / gaussSum;
        imgData.data[i + 2] = b / gaussSum;
        // imgData.data[i] = r ;
        // imgData.data[i + 1] = g ;
        // imgData.data[i + 2] = b ;
        // imgData.data[i + 3] = a ;
      }
    }
    //end
    // imgData.data.set(imgData.data);
    return imgData;
  },


  // 灰度扩展
  ImageEnhance: function (imgData, arg1, arg2) {
    var lamta = arg || 0.5;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var p1 = arg1 || { x: 10, y: 10 };
    var p2 = arg2 || { x: 50, y: 40 };

    function transfer(d) {
    }

    for (var i = 0, n = data.length; i < n; i += 4) {
    }
    imgData.data = data;

    return imgData;
  },

  // 查找边缘
  borderline: function (imgData, arg) {
    var template1 = [
      -2, -4, -4, -4, -2,
      -4, 0, 8, 0, -4,
      -4, 8, 24, 8, -4,
      -4, 0, 8, 0, -4,
      -2, -4, -4, -4, -2
    ];
    var template2 = [
      0, 1, 0,
      1, -4, 1,
      0, 1, 0
    ];
    var template3 = [
    ];
    return dorsyMath.applyMatrix(imgData, template2, 250);
  },


  // 添加杂色
  noise: function (imgData, arg) {
    var R = parseInt(arg[0]) || 100;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var xLength = R * 2 + 1;
    //区块
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        var realI = y * width + x;
        for (var j = 0; j < 3; j++) {
          var rand = parseInt(Math.random() * R * 2) - R;
          data[realI * 4 + j] += rand;
        }
      }
    }
    return imgData;
  },

  // 油画
  oilPainting: function (imgData, arg) {
    var R = parseInt(arg[0]) || 16;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var xLength = R * 2 + 1;
    //区块
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        var realI = y * width + x;
        var gray = 0;
        for (var j = 0; j < 3; j++) {
          gray += data[realI * 4 + j];
        }
        gray = gray / 3;
        var every = parseInt(gray / R) * R;
        for (var j = 0; j < 3; j++) {
          data[realI * 4 + j] = every;
        }
      }
    }
    return imgData;
  },


  // 色调分离
  posterize: function (imgData, args) {
    var dM = dorsyMath;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;

    //灰度阶数
    //由原来的255阶映射为现在的阶数
    var step = args[0] || 20;
    step = step < 1 ? 1 : (step > 255 ? 255 : step);
    var level = Math.floor(255 / step);
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        dM.xyCal(imgData, x, y, function (r, g, b) {
          return [
            Math.floor(r / level) * level,
            Math.floor(g / level) * level,
            Math.floor(b / level) * level
          ];
        });
      }
    }
    return imgData;
  },

  // 棕褐色
  sepia: function (imgData) {
    var dM = dorsyMath;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;

    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        dM.xyCal(imgData, x, y, function (r, g, b) {
          return [
            r * 0.393 + g * 0.769 + b * 0.189,
            r * 0.349 + g * 0.686 + b * 0.168,
            r * 0.272 + g * 0.534 + b * 0.131
          ];
        });
      }
    }
    return imgData;
  },

  // 锐化
  sharp: function (imgData, arg) {
    var lamta = arg[0] || 0.6;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;

    for (var i = 0, n = data.length; i < n; i += 4) {
      var ii = i / 4;
      var row = parseInt(ii / width);
      var col = ii % width;
      if (row == 0 || col == 0) continue;

      var A = ((row - 1) * width + (col - 1)) * 4;
      var B = ((row - 1) * width + col) * 4;
      var E = (ii - 1) * 4;

      for (var j = 0; j < 3; j++) {
        var delta = data[i + j] - (data[B + j] + data[E + j] + data[A + j]) / 3;
        data[i + j] += delta * lamta;
      }
    }

    return imgData;
  },

  // 灰度处理

  toGray: function (imgData) {
    var data = imgData.data;

    for (var i = 0, n = data.length; i < n; i += 4) {
      var gray = parseInt((0.299 * data[i] + 0.578 * data[i + 1] + 0.114 * data[i + 2]));
      data[i + 2] = data[i + 1] = data[i] = gray;
    }

    imgData.data.set(data);

    return imgData;
  },

  // 反色

  toReverse: function (imgData) {
    var data = imgData.data;

    for (var i = 0, n = data.length; i < n; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    imgData.data.set(data);

    return imgData;
  },

  // 灰度阈值 做只有2级灰度图像处理 

  toThresh: function (imgData, arg) {
    imgData = filters.toGray(imgData);
    var data = imgData.data;
    var arg = arg[0] || 128;
    for (var i = 0, n = data.length; i < n; i++) {
      if ((i + 1) % 4) {
        data[i] = data[i] > arg ? 255 : 0;
      }
    }
    imgData.data.set(data);
    return imgData;
  }

}

export default filters