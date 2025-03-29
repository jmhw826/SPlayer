<template>
  <Transition>
    <div
      :key="currentLyrics?.[0]?.startTime"
      :class="['amll-lyric', { pure: isPureLyricMode }]"
    >
      <LyricPlayer
        ref="lyricPlayerRef"
        :lyricLines="currentLyrics"
        :currentTime="Math.max(0, currentTime) * 1000"
        :playing="isPlaying"
        :enableSpring="useAMSpring"
        :enableScale="useAMSpring"
        :alignPosition="alignPosition"
        :enableBlur="lyricBlur"
        :enableInterludeDots="true"
        :wordFadeWidth="0.5"
        :style="{
          '--amll-lyric-view-color': mainColor,
          '--amll-lyric-player-font-size': lyricsFontSize.value + 'px',
          'font-weight': lyricFontBold ? 'bold' : 'normal',
          'font-family': lyricFont !== 'follow' ? lyricFont : '',
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
import { musicData, siteSettings, siteStatus } from '@/stores';
import { parseTTMLToAMLL } from '@/utils/processTTML.ts';
import { setSeek } from '@/utils/Player';
import { storeToRefs } from 'pinia';
import { LyricPlayerRef, LyricLine, LyricClickEvent } from '@/types/amll.ts';
// 导入新的歌词处理工具
import { parseLyricsData, parseLocalLyric } from '@/utils/modernLyricProcessor.ts';

const lyricPlayerRef = ref<LyricPlayerRef | null>(null);
const music = musicData();
const settings = siteSettings();
const status = siteStatus();

// 修改 store 引用方式
const { playTimeData } = storeToRefs(status); // 从 siteStatus 获取时间数据
const { playState } = storeToRefs(status);
const { isPureLyricMode } = storeToRefs(status);
const { useAMSpring, lyricBlur, lyricsFontSize, lyricsBlock, showYrc, lyricFontBold, lyricFont } = storeToRefs(settings);
const { playSongLyric } = storeToRefs(music);

// 实时播放进度
const currentTime = computed(() => Math.max(0, playTimeData.value?.currentTime || 0));
const isPlaying = computed(() => playState.value);

// 歌词对齐位置
const alignPosition = computed(() => {
  // 根据歌词块位置设置位置
  return lyricsBlock.value === 'center' ? 0.5 : 0.2;
});

// 歌词主色
const mainColor = computed(() => {
  // 这里可以根据需要从状态中获取主色
  return 'rgb(239, 239, 239)';
});

// 处理歌词点击
const handleLineClick = (e: LyricClickEvent) => {
  if (!e?.line?.lyricLine?.startTime) return;
  const time = e.line.lyricLine.startTime / 1000;
  setSeek(time);
  playState.value = true;
};

// 获取当前歌词 - 使用新的处理逻辑
const currentLyrics = computed<LyricLine[]>(() => {
  if (!playSongLyric.value) return [];
  
  // 检查是否有TTML格式的歌词
  if (playSongLyric.value?.ttml) {
    return parseTTMLToAMLL(playSongLyric.value.ttml);
  }
  
  // 使用新的歌词处理逻辑
  const isYrc = showYrc.value && playSongLyric.value.hasYrc && playSongLyric.value.yrc?.length > 0;
  return isYrc ? playSongLyric.value.yrcAMData : playSongLyric.value.lrcAMData;
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

// 监听当前时间变化
watch(() => currentTime.value, (newTime: number) => {
  const safeTime = Math.max(0, newTime);
  if (lyricPlayerRef.value) {
    lyricPlayerRef.value.setCurrentTime?.(safeTime * 1000);
  }
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
        transform-origin: center;
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