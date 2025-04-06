<template>
  <Transition name="fade">
    <div
      :key="currentLyrics?.[0]?.startTime"
      :class="['amll-lyric', { pure: isPureLyricMode }]"
    >
      <LyricPlayer
        ref="lyricPlayerRef"
        :lyricLines="currentLyrics"
        :currentTime="playSeek"
        :playing="isPlaying"
        :enableSpring="useAMSpring"
        :enableScale="useAMSpring"
        :alignPosition="alignPosition"
        :enableBlur="lyricBlur"
        :alignAnchor="'top'"
        :enableInterludeDots="true"
        :style="{
          '--amll-lyric-view-color': mainColor,
          '--amll-lyric-player-font-size': lyricFontSize + 'px',
          'font-weight': lyricFontBold ? 'bold' : 'normal',
          'font-family': lyricFont !== 'PingFang SC' ? lyricFont : '',
          'visibility': 'visible',
          // 设置歌词组件的不透明度为1，确保歌词完全可见
          'opacity': '1',
          '--amll-lyric-player-height': '100%',
          '--amll-lyric-player-width': '100%',
          'height': '100%',
          'width': '100%',
        }"
        class="am-lyric"
        @line-click="handleLineClick"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { LyricPlayer } from '@applemusic-like-lyrics/vue';
import { LyricLine } from '@applemusic-like-lyrics/core';
import { musicData, siteSettings, siteStatus } from '@/stores';
import { parseTTMLToAMLL } from '@/utils/processTTML.ts';
import { setSeek } from '@/utils/Player';
import { storeToRefs } from 'pinia';
import type { LyricClickEvent, LyricPlayerRef } from '@/types/amll.ts';
import { useRafFn } from '@vueuse/core';

// 接收cursorShow属性
defineProps({
  cursorShow: {
    type: Boolean,
    default: true
  }
});

// 组件引用
const lyricPlayerRef = ref<LyricPlayerRef | null>(null);

// 获取store
const music = musicData();
const settings = siteSettings();
const status = siteStatus();

// 从store获取状态
const { playState, isPureLyricMode, coverTheme } = storeToRefs(status);
const { 
  useAMSpring, 
  lyricBlur, 
  lyricsPosition, 
  showYrc, 
  lyricFontBold, 
  lyricFont,
  lyricFontSize = 46 // 默认字体大小
} = storeToRefs(settings);
const { playSongLyric } = storeToRefs(music);

// 实时播放进度 - 确保是毫秒单位
const playSeek = ref<number>(status.currentTime * 1000);
const isPlaying = computed(() => playState.value);

// 实时更新播放进度
const { pause: pauseSeek, resume: resumeSeek } = useRafFn(() => {
  const seekInSeconds = status.playSeek;
  playSeek.value = Math.floor(seekInSeconds * 1000);
}, { immediate: true });

// 歌词对齐位置
const alignPosition = computed(() => {
  return lyricsPosition.value === 'left' ? 0.2 : 0.5;
});

// 歌词主色
const mainColor = computed(() => {
  return coverTheme.value?.light?.shadeTwo 
    ? `rgb(${coverTheme.value.light.shadeTwo})` 
    : 'rgb(239, 239, 239)';
});

// 处理歌词点击
const handleLineClick = (e: LyricClickEvent) => {
  if (!e?.line?.getLine) return;
  const lyricLine = e.line.getLine();
  if (!lyricLine?.startTime) return;
  
  const time = lyricLine.startTime / 1000;
  setSeek(time);
  playState.value = true;
};

// 获取当前歌词
const currentLyrics = computed<LyricLine[]>(() => {
  if (!playSongLyric.value) return [];
  
  // 检查是否有TTML格式的歌词
  if (playSongLyric.value?.ttml) {
    return parseTTMLToAMLL(playSongLyric.value.ttml);
  }
  
  // 使用歌词处理逻辑
  const isYrc = showYrc.value && playSongLyric.value.hasYrc && playSongLyric.value.yrc?.length > 0;
  return isYrc ? playSongLyric.value.yrcAMData : playSongLyric.value.lrcAMData;
});

// 监听播放状态变化
watch(() => playState.value, (newState: boolean) => {
  if (lyricPlayerRef.value) {
    lyricPlayerRef.value.setPlaying?.(newState);
  }
});

// 监听当前时间变化
watch(() => status.playSeek, (newTime: number) => {
  const timeMs = Math.max(0, newTime * 1000);
  playSeek.value = timeMs;
  
  if (lyricPlayerRef.value) {
    lyricPlayerRef.value.setCurrentTime?.(timeMs);
  }
});

onMounted(() => {
  // 恢复进度
  resumeSeek();
  
  // 初始化播放器状态
  if (lyricPlayerRef.value) {
    lyricPlayerRef.value.setCurrentTime?.(playSeek.value);
    lyricPlayerRef.value.setPlaying?.(isPlaying.value);
  }
});

onBeforeUnmount(() => {
  pauseSeek();
});
</script>

<style lang="scss" scoped>
.amll-lyric {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  padding: 0 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.2));
  mask: linear-gradient(
    180deg,
    hsla(0, 0%, 100%, 0) 0,
    hsla(0, 0%, 100%, 0.6) 5%,
    #fff 10%,
    #fff 75%,
    hsla(0, 0%, 100%, 0.6) 85%,
    hsla(0, 0%, 100%, 0)
  );
  z-index: 1;
  :deep(.am-lyric) {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    padding-left: 10px;
    padding-right: 80px;
    margin-left: 0; /* 修复margin-left问题 */
    z-index: 2;
    display: block;
    /* 确保LyricPlayer组件有一个有效的高度计算 */
    min-height: 300px;
    /* 防止高度计算为负值 */
    box-sizing: border-box;
    /* 确保内容可见 */
    overflow: visible;
  }
  &.pure {
    text-align: center;
    :deep(.am-lyric) {
      margin: 0;
      padding: 0 80px;
      div {
        transform-origin: center !important;
      }
    }
  }
}

/* 过渡动画 */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
/* AMLL歌词样式 */
.amll-lyric-container {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  margin-bottom: 20px;
  
  .am-lyric {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 0 20px;
    box-sizing: border-box;
    overflow: visible;
    /* 确保内容在容器内正确显示 */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
</style>
