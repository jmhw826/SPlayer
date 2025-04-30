<!-- 播放器 - 音乐频谱 -->
<template>
  <div :style="{ opacity: show ? '0.6' : '0.1' }" class="spectrum">
    <canvas ref="canvasRef" :style="{ height: height + 'px' }" class="spectrum-line" />
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { siteStatus } from "@/stores";

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  height: {
    type: Number,
    default: 80,
  },
  barWidth: {
    type: Number,
    default: 4,
  },
  radius: {
    type: Number,
    default: 2.5,
  },
});
const status = siteStatus();
const { spectrumsData } = storeToRefs(status);

// canvas
const canvasRef = ref(null);
const isKeepDrawing = ref(true);

/**
 * 绘制音乐频谱图
 * @param {Array} data - 包含音频频谱数据的数组
 */
// 用于存储上一帧的频谱数据
const prevData = ref(new Array(1024).fill(0));

// 平滑处理频谱数据
const smoothData = (data, prevData, smoothingFactor = 0.3) => {
  if (!data) return prevData;
  return data.map((value, i) => {
    const smoothedValue = value * smoothingFactor + prevData[i] * (1 - smoothingFactor);
    prevData[i] = smoothedValue;
    return smoothedValue;
  });
};

const drawSpectrum = (data) => {
  if (!data) return;
  if (!isKeepDrawing.value) return;

  // 去除频谱前10项并进行平滑处理
  data = smoothData(data.slice(10), prevData.value);

  // 设置画布宽度，最大为 1600
  canvasRef.value.width = document.body.clientWidth >= 1600 ? 1600 : document.body.clientWidth;
  canvasRef.value.height = props.height;

  const ctx = canvasRef.value.getContext("2d");
  const canvasWidth = canvasRef.value.width;
  const canvasHeight = canvasRef.value.height;

  // 优化频谱数量计算
  const numBars = Math.min(Math.floor(canvasWidth / 12), Math.floor(data.length / 2));
  const cornerRadius = props.radius;
  const gap = 2; // 柱体间距
  const barWidth = Math.max((canvasWidth / numBars / 2) - gap, 2); // 确保最小宽度

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 获取主题颜色
  const themeColor = status.coverTheme?.light?.shadeTwo || "239, 239, 239";

  for (let i = 0; i < numBars; i++) {
    // 使用对数计算提升低频显示效果
    const dataIndex = Math.floor(i * (data.length / numBars));
    const value = data[dataIndex];
    const barHeight = Math.min((Math.log(value + 1) / Math.log(256)) * canvasHeight, canvasHeight);

    const x1 = i * (barWidth + gap) + canvasWidth / 2;
    const x2 = canvasWidth / 2 - ((i + 1) * (barWidth + gap));
    const y = canvasHeight - barHeight;

    // 创建渐变色
    const gradient1 = ctx.createLinearGradient(x1, y, x1, canvasHeight);
    const gradient2 = ctx.createLinearGradient(x2, y, x2, canvasHeight);

    gradient1.addColorStop(0, `rgba(${themeColor}, 0.8)`);
    gradient1.addColorStop(1, `rgba(${themeColor}, 0.2)`);
    gradient2.addColorStop(0, `rgba(${themeColor}, 0.8)`);
    gradient2.addColorStop(1, `rgba(${themeColor}, 0.2)`);

    if (barHeight > 0) {
      ctx.fillStyle = gradient1;
      roundRect(ctx, x1, y, barWidth, barHeight, cornerRadius);
      ctx.fillStyle = gradient2;
      roundRect(ctx, x2, y, barWidth, barHeight, cornerRadius);
    }
  }

  requestAnimationFrame(() => {
    drawSpectrum(spectrumsData.value);
  });
};

/**
 * 绘制圆角矩形
 * @param {CanvasRenderingContext2D} ctx - 2D上下文
 * @param {number} x - 矩形左上角 x 坐标
 * @param {number} y - 矩形左上角 y 坐标
 * @param {number} width - 矩形宽度
 * @param {number} height - 矩形高度
 * @param {number} radius - 圆角半径
 */
const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};

onMounted(() => {
  drawSpectrum(spectrumsData.value);
});

onBeforeUnmount(() => {
  isKeepDrawing.value = false;
});
</script>

<style lang="scss" scoped>
.spectrum {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  opacity: 0.6;
  z-index: -1;
  pointer-events: none;
  transition: opacity 0.3s;
  mask: linear-gradient(
    90deg,
    hsla(0, 0%, 100%, 0) 0,
    hsla(0, 0%, 100%, 0.6) 10%,
    #fff 15%,
    #fff 85%,
    hsla(0, 0%, 100%, 0.6) 90%,
    hsla(0, 0%, 100%, 0)
  );
  -webkit-mask: linear-gradient(
    90deg,
    hsla(0, 0%, 100%, 0) 0,
    hsla(0, 0%, 100%, 0.6) 10%,
    #fff 15%,
    #fff 85%,
    hsla(0, 0%, 100%, 0.6) 90%,
    hsla(0, 0%, 100%, 0)
  );
  .spectrum-line {
    mask: linear-gradient(
      90deg,
      hsla(0, 0%, 100%, 0) 0,
      hsla(0, 0%, 100%, 0.6) 5%,
      #fff 10%,
      #fff 90%,
      hsla(0, 0%, 100%, 0.6) 95%,
      hsla(0, 0%, 100%, 0)
    );
    -webkit-mask: linear-gradient(
      90deg,
      hsla(0, 0%, 100%, 0) 0,
      hsla(0, 0%, 100%, 0.6) 5%,
      #fff 10%,
      #fff 90%,
      hsla(0, 0%, 100%, 0.6) 95%,
      hsla(0, 0%, 100%, 0)
    );
  }
}
</style>
