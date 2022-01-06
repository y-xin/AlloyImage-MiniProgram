import dorsyMath from './dorsyMath.js'


// 调节
var alteration = {
  reflect: function (method, imgData, arg) {
    switch (method) {
      case "亮度": return this.brightness(imgData, arg); break;
      case "曲线": return this.curve(imgData, arg); break;
      case "gamma调节":return  this.gamma(imgData, arg); break;
      case "可选颜色": return this.selectiveColor(imgData, arg); break;
      case "调整RGB": return this.setHSI(imgData, arg); break;
    }
  },
  // 调整亮度对比度
  brightness: function (imgData, args) {
    var data = imgData.data;
    var brightness = args[0] / 50; // -1,1
    var arg2 = args[1] || 0;
    var c = arg2 / 50;// -1,1
    var k = Math.tan((45 + 44 * c) * Math.PI / 180);
    for (var i = 0, n = data.length; i < n; i += 4) {
      for (var j = 0; j < 3; j++) {
        data[i + j] = (data[i + j] - 127.5 * (1 - brightness)) * k + 127.5 * (1 + brightness);
      }
    }
    return imgData;
  },
  // 曲线

  curve: function (imgData, arg) {
    /*
     * arg   arg[0] = [3,3] ,arg[1]  = [2,2]
     * */

    //获得插值函数
    var f = dorsyMath.lagrange(arg[0], arg[1]);
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;

    //调节通道
    var channel = arg[2];
    if (!(/[RGB]+/.test(channel))) {
      channel = "RGB";
    }

    var channelString = channel.replace("R", "0").replace("G", "1").replace("B", "2");

    var indexOfArr = [
      channelString.indexOf("0") > -1,
      channelString.indexOf("1") > -1,
      channelString.indexOf("2") > -1
    ];

    //区块
    for (var x = 0; x < width; x++) {

      for (var y = 0; y < height; y++) {

        var realI = y * width + x;

        for (var j = 0; j < 3; j++) {
          if (!indexOfArr[j]) continue;
          data[realI * 4 + j] = f(data[realI * 4 + j]);
        }

      }

    }

    return imgData;
  },

  // gamma调节

  gamma: function (imgData, args) {
    var dM = dorsyMath;
    var data = imgData.data;
    var width = imgData.width;
    var height = imgData.height;

    //gamma阶-100， 100
    var gamma;

    if (args[0] == undefined) gamma = 10;
    else gamma = args[0];

    var normalizedArg = ((gamma + 100) / 200) * 2;

    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        dM.xyCal(imgData, x, y, function (r, g, b) {
          return [
            Math.pow(r, normalizedArg),
            Math.pow(g, normalizedArg),
            Math.pow(b, normalizedArg)
          ];
        });
      }
    }
    return imgData;
  },

  // 可选颜色
  selectiveColor: function (imgData, arg) {//调节亮度对比度
    //选择的颜色
    var color = arg[0];

    //百分数
    var C = arg[1];
    var M = arg[2];
    var Y = arg[3];
    var K = arg[4];

    //是否相对
    var isRelative = arg[5] || 0;

    var maxColorMap = {
      red: "R",
      green: "G",
      blue: "B",
      "红色": "R",
      "绿色": "G",
      "蓝色": "B"
    };

    var minColorMap = {
      cyan: "R",
      magenta: "G",
      yellow: "B",
      "青色": "R",
      "洋红": "G",
      "黄色": "B"
    };

    //检查是否是被选中的颜色
    var checkSelectedColor = function (colorObj) {
      if (maxColorMap[color]) {
        return Math.max(colorObj.R, colorObj.G, colorObj.B) == colorObj[maxColorMap[color]];
      } else if (minColorMap[color]) {
        return Math.min(colorObj.R, colorObj.G, colorObj.B) == colorObj[minColorMap[color]];
      } else if (color == "black" || color == "黑色") {
        return Math.min(colorObj.R, colorObj.G, colorObj.B) < 128;
      } else if (color == "white" || color == "白色") {
        return Math.max(colorObj.R, colorObj.G, colorObj.B) > 128;
      } else if (color == "中性色") {
        return !((Math.max(colorObj.R, colorObj.G, colorObj.B) < 1) || (Math.min(colorObj.R, colorObj.G, colorObj.B) > 224));
      }
    };

    var upLimit = 0;
    var lowLimit = 0;
    var limit = 0;

    var alterNum = [C, M, Y, K];
    for (var x = 0, w = imgData.width; x < w; x++) {
      for (var y = 0, h = imgData.height; y < h; y++) {
        dorsyMath.xyCal(imgData, x, y, function (R, G, B) {
          var colorObj = {
            R: R,
            G: G,
            B: B
          };

          var colorArr = [R, G, B];
          var resultArr = [];

          if (checkSelectedColor(colorObj)) {
            if (maxColorMap[color]) {
              var maxColor = maxColorMap[color];

              var middleValue = R + G + B - Math.max(R, G, B) - Math.min(R, G, B);
              limit = colorObj[maxColor] - middleValue;
            } else if (minColorMap[color]) {
              var minColor = minColorMap[color];

              var middleValue = R + G + B - Math.max(R, G, B) - Math.min(R, G, B);
              limit = middleValue - colorObj[minColor];
            } else if (color == "black" || color == "黑色") {
              limit = parseInt(127.5 - Math.max(R, G, B)) * 2;
            } else if (color == "white" || color == "白色") {
              limit = parseInt(Math.min(R, G, B) - 127.5) * 2;
            } else if (color == "中性色") {
              limit = 255 - (Math.abs(Math.max(R, G, B) - 127.5) + Math.abs(Math.min(R, G, B) - 127.5));
            } else {
              return;
            }

            for (var i = 0; i < 3; i++) {
              //可减少到的量
              var lowLimitDelta = parseInt(limit * (colorArr[i] / 255));
              var lowLimit = colorArr[i] - lowLimitDelta;

              //可增加到的量
              var upLimitDelta = parseInt(limit * (1 - colorArr[i] / 255));
              var upLimit = colorArr[i] + upLimitDelta;

              //将黑色算进去 得到影响百分比因子
              var factor = (alterNum[i] + K + alterNum[i] * K);

              //相对调节
              if (isRelative) {
                //如果分量大于128  减少量=增加量
                if (colorArr[i] > 128) {
                  lowLimitDelta = upLimitDelta;
                }

                //先算出黑色导致的原始增量
                if (K > 0) {
                  var realUpLimit = colorArr[i] - K * lowLimitDelta;
                } else {
                  var realUpLimit = colorArr[i] - K * upLimitDelta;
                }
                //标准化
                if (realUpLimit > upLimit) realUpLimit = upLimit;
                if (realUpLimit < lowLimit) realUpLimit = lowLimit;

                upLimitDelta = upLimit - realUpLimit;
                lowLimitDelta = realUpLimit - lowLimit;
                if (K < 0) {
                  lowLimitDelta = upLimitDelta;
                } else {
                }
                //> 0表明在减少
                if (alterNum[i] > 0) {
                  realUpLimit -= alterNum[i] * lowLimitDelta;
                } else {
                  realUpLimit -= alterNum[i] * upLimitDelta;
                }
              } else {
                //现在量
                var realUpLimit = limit * - factor + colorArr[i];
              }
              if (realUpLimit > upLimit) realUpLimit = upLimit;
              if (realUpLimit < lowLimit) realUpLimit = lowLimit;
              resultArr[i] = realUpLimit;
            }
            return resultArr;
          }
        });//end xyCal
      }//end forY
    }//end forX
    return imgData;
  },
  /**
   * @description: 调整RGB 饱和和度  
   * H (-2*Math.PI , 2 * Math.PI)  S (-100,100) I (-100,100)
   * 着色原理  勾选着色后，所有的像素不管之前是什么色相，都变成当前设置的色相，
   * 然后饱和度变成现在设置的饱和度，但保持明度为原来的基础上加上设置的明度
   */

  setHSI: function (imgData, arg) {//调节亮度对比度
    arg[0] = arg[0] / 180 * Math.PI;
    arg[1] = arg[1] / 100 || 0;
    arg[2] = arg[2] / 100 * 255 || 0;
    arg[3] = arg[3] || false;//着色

    //调节通道
    var channel = arg[4];
    if (!(/[RGBCMY]+/.test(channel))) {
      channel = "RGBCMY";
    }
    var letters = channel.split("");
    var indexOf = {};
    for (var i = 0; i < letters.length; i++) {
      indexOf[letters[i]] = 1;
    }
    dorsyMath.applyInHSI(imgData, function (i, color) {
      if (!indexOf[color]) return;

      if (arg[3]) {
        i.H = arg[0];
        i.S = arg[1];
        i.I += arg[2];
      } else {
        i.H += arg[0];
        i.S += arg[1];
        i.I += arg[2];
      }

    });

    return imgData;
  }
}
export default alteration
