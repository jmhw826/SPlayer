<template>
  <Transition>
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
        :enableInterludeDots="true"
        :style="{
          '--amll-lyric-view-color': mainColor,
          '--amll-lyric-player-font-size': 46 + 'px',
          '--amll-lyric-player-height': 597.8 + 'px',
          'font-weight': lyricFontBold ? 'bold' : 'normal',
          'font-family': lyricFont !== 'PingFang SC',
          'visibility': 'visible',
          'opacity': '1'
        }"
        class="am-lyric"
        @line-click="handleLineClick"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { LyricPlayer } from '@applemusic-like-lyrics/vue';
import { LyricLine } from '@applemusic-like-lyrics/core';
import { musicData, siteSettings, siteStatus } from '@/stores';
import { parseTTMLToAMLL, parseLyricsData, parseLocalLyric } from '@/utils/lyric.ts';
import { setSeek } from '@/utils/Player';
import { storeToRefs } from 'pinia';
import type { LyricClickEvent } from '@/types/amll';
import { useRafFn } from '@vueuse/core';

const lyricPlayerRef = ref<any | null>(null);
const music = musicData();
const settings = siteSettings();
const status = siteStatus();

// 从store获取状态
const { playState, isPureLyricMode } = storeToRefs(status);
const { useAMSpring, lyricBlur,lyricsPosition, showYrc, lyricFontBold, lyricFont } = storeToRefs(settings);
const { playSongLyric } = storeToRefs(music);

// 实时播放进度
const playSeek = ref<number>(status.playSeek);
const isPlaying = computed(() => playState.value);

// 实时更新播放进度
// 导入 useRafFn


const { pause: pauseSeek, resume: resumeSeek } = useRafFn(() => {
  const seekInSeconds = status.playSeek;
  playSeek.value = Math.floor(seekInSeconds * 1000);
});
// 歌词对齐位置
const alignPosition = computed(() => {
  return lyricsPosition.value === 'left' ? 0.2 : 0.5;
});

// 歌词主色
const mainColor = computed(() => {
  return status.coverTheme?.light?.shadeTwo 
    ? `rgb(${status.coverTheme.light.shadeTwo})` 
    : 'rgb(239, 239, 239)';
});

// 处理歌词点击
const handleLineClick = (e: LyricClickEvent) => {
  if (!e?.line?.lyricLine?.startTime) return;
  const time = e.line.lyricLine.startTime / 1000;
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
    const timeMs = Math.max(0, playSeek.value) * 1000;
    lyricPlayerRef.value.setCurrentTime?.(timeMs);
    lyricPlayerRef.value.setPlaying?.(newState);
  }
});

// 监听当前时间变化
watch(() => status.playSeek, (newTime: number) => {
  playSeek.value = newTime;
  const safeTime = Math.max(0, newTime);
  if (lyricPlayerRef.value) {
    lyricPlayerRef.value.setCurrentTime?.(safeTime * 1000);
  }
});

onMounted(() => {
  // 恢复进度
  resumeSeek();
});

onBeforeUnmount(() => {
  pauseSeek();
});
// 导出歌词处理函数，供外部使用
defineExpose({
  parseLyricsData,
  parseLocalLyric
});
</script>

<style lang="scss" scoped>
.amll-lyric {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
  :deep(.am-lyric) {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    padding-left: 10px;
    padding-right: 80px;
    margin-left: -2rem;
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
</style>
