<template>
  <div class="amll-lyric">
    <LyricPlayer 
      ref="lyricPlayerRef"
      :lyricLines="currentLyrics" 
      :currentTime="Math.max(0, currentTime) * 1000"
      :playing="isPlaying"
      :alignAnchor="alignAnchor"
      :alignPosition="alignPosition" 
      :enableSpring="useAMSpring"
      :enableScale="useAMSpring" 
      :enableBlur="lyricBlur"
      :enableInterludeDots="true"
      :wordFadeWidth="0.5" 
      :linePosXSpringParams="springParams.posX"
      :linePosYSpringParams="springParams.posY" 
      :lineScaleSpringParams="springParams.scale" 
      @line-click="handleLineClick" 
      :style="lyricStyles"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { LyricPlayer } from '@applemusic-like-lyrics/vue';
import { musicData, siteSettings, siteStatus } from '@/stores';
import { createLyricsProcessor } from '@/utils/processLyrics.ts';
import { parseTTMLToAMLL } from '@/utils/processTTML.ts';
import { setSeek, fadePlayOrPause } from '@/utils/Player';
import { storeToRefs } from 'pinia';
import { LyricPlayerRef, LyricLine, LyricClickEvent, SpringParams } from '@/types/amll.ts';

const lyricPlayerRef = ref<LyricPlayerRef | null>(null);
const music = musicData();
const settings = siteSettings();
const status = siteStatus();

// 修改 store 引用方式
const { playTimeData } = storeToRefs(status); // 从 siteStatus 获取时间数据
const { playState } = storeToRefs(status);
const { useAMSpring, lyricBlur, countDownShow, lyricsFontSize, lyricsBlock, showYrc, showTransl, showRoma } = storeToRefs(settings);
const { playSongLyric } = storeToRefs(music);

// 新增计算属性获取当前时间（单位：秒）
const currentTime = computed(() => Math.max(0, playTimeData.value?.currentTime || 0));
const isPlaying = computed(() => playState.value);

// 计算对齐方式 - 根据歌词块位置设置锚点
const alignAnchor = computed(() => {
  // 根据歌词块位置设置锚点
  return lyricsBlock.value === 'center' ? 'center' : 'top';
});

const alignPosition = computed(() => {
  // 根据歌词块位置设置位置
  // center: 0.5 表示在视图中央
  // top: 0.2 表示在视图顶部偏下位置
  // bottom: 0.8 表示在视图底部偏上位置
  if (lyricsBlock.value === 'center') return 0.5;
  if (lyricsBlock.value === 'bottom') return 0.8;
  return 0.2; // 默认为top位置
});

// 弹簧参数配置
const springParams: Record<string, SpringParams> = {
  posX: { mass: 1.0, damping: 10.0, stiffness: 100.0, soft: false },
  posY: { mass: 1.0, damping: 10.0, stiffness: 100.0, soft: false },
  scale: { mass: 1.0, damping: 10.0, stiffness: 100.0, soft: false }
};

// 计算歌词样式 - 根据用户设置动态调整
const lyricStyles = computed(() => ({
  '--amll-lyric-view-color': 'rgb(239, 239, 239)',
  // 根据用户设置的字体大小动态调整，确保比例合适
  '--amll-lyric-player-font-size': `${lyricsFontSize.value * 0.1}px`,
  '--amll-lyric-player-line-height': 1.8,
  // 根据设置应用粗体
  'font-weight': 'bold',
  'font-family': 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
  'letter-spacing': 'normal',
  'cursor': 'pointer',
  'user-select': 'none',
  '-webkit-tap-highlight-color': 'transparent'
}));

// 处理歌词点击
const handleLineClick = (e: LyricClickEvent) => {
  const time = e.line.getLine().startTime;
  if (time != null) {
    // 确保时间值为非负数
    const seekTime = Math.max(0, time) / 1000;
    console.log("点击歌词跳转到:", seekTime);
    setSeek(seekTime);
    playState.value = true;
  }
};

// 获取当前歌词 - 优化处理逻辑
const currentLyrics = computed<LyricLine[]>(() => {
  if (!playSongLyric.value) return [];
  
  // 检查是否有TTML格式的歌词
  if (playSongLyric.value?.ttml) {
    return parseTTMLToAMLL(playSongLyric.value.ttml);
  }
  
  // 回退到原有的歌词处理方式
  return createLyricsProcessor(playSongLyric.value, {
    showYrc: showYrc.value,
    showRoma: showRoma.value,
    showTransl: showTransl.value
  });
});

// 获取第一行歌词的时间用于倒计时
const firstLineTime = computed(() => {
  if (currentLyrics.value && currentLyrics.value.length > 0) {
    return currentLyrics.value[0].startTime;
  }
  return 0;
});

// 监听播放状态变化 - 优化同步逻辑
watch(() => playState.value, (newState: boolean) => {
  if (lyricPlayerRef.value) {
    // 无论播放状态如何变化，都确保时间同步
    // 确保时间值为非负数
    const timeMs = Math.max(0, currentTime.value) * 1000;
    lyricPlayerRef.value.setCurrentTime?.(timeMs);
    // 同步播放状态
    lyricPlayerRef.value.setPlaying?.(newState);
  }
});

// 监听当前时间变化，确保歌词同步 - 使用节流避免过多更新
let lastUpdateTime = 0;
// 修改时间监听器
watch(() => currentTime.value, (newTime: number) => {
  const safeTime = Math.max(0, newTime);
  if (lyricPlayerRef.value) {
    lyricPlayerRef.value.setCurrentTime?.(safeTime * 1000);
  }
});
</script>
<style lang="scss" scoped>
/* Apple Music Like Lyrics 样式 */

.amll-lyric {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  /* 歌词容器样式 */
  .amll-lyric-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    overflow: hidden;
  }

  /* 歌词行样式 */
  .amll-lyric-line {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 8px 0;
    transition: opacity 0.3s ease;

    &.active {
      opacity: 1;
    }

    &:not(.active) {
      opacity: 0.5;
    }
  }

  /* 翻译和音译样式 */
  .translation,
  .romaji {
    font-size: 0.8em;
    opacity: 0.8;
    margin-top: 4px;
  }

  /* 倒计时样式 */
  .countdown {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    font-weight: bold;
    color: var(--amll-lyric-view-color, #efefef);
  }
}

/* 背景渲染样式 */
.amll-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

/* 全屏播放器中的AMLL样式调整 */
.full-player {
  .right.pure {
    .amll-lyric {
      width: 100%;
      height: 100%;
      padding: 0 20px;
    }
  }
}
</style>