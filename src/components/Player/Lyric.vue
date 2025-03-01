<!-- 播放器 - 歌词 -->
<template>
  <div
    :class="[
      'lyric',
      `lyric-${lyricsPosition}`,
      playCoverType,
      { pure: pureLyricMode, 'custom-lrc': justLyricArea },
    ]"
    @mouseenter="lrcMouseStatus = lrcMousePause ? true : false"
    @mouseleave="lrcAllLeave"
  >
    <Transition name="fade" mode="out-in">
      <div
        v-if="playSongLyric.lrc?.[0] && playSongLyric.lrc?.length > 4"
        :key="playSongLyric.lrc?.[0]"
        class="lyric-all"
        @after-enter="lyricsScroll(playSongLyricIndex)"
        @after-leave="lyricsScroll(playSongLyricIndex)"
      >
        <div v-if="lyricsStyle === 'default'">
          <!-- 默认样式的歌词 -->
          <div v-for="(line, index) in playSongLyric.lrc" :key="index" :id="'lrc' + index">
            <n-text :depth="index === playSongLyricIndex ? 3 : 1">{{ line.content }}</n-text>
          </div>
        </div>
        <div v-else-if="lyricsStyle === 'applemusic'">
          <!-- Apple Music 样式的歌词 -->
          <LyricPlayer 
            ref="lyricPlayerRef" 
            :lyricLines="currentLyrics" 
            :currentTime="currentTime"
            @line-click="handleLineClick" 
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { musicData, siteSettings, siteStatus } from "@/stores";
import { setSeek, fadePlayOrPause } from "@/utils/Player";
import { LyricPlayer } from 'applemusic-like-lyrics';

const music = musicData();
const settings = siteSettings();
const status = siteStatus();
const { playSeek, pureLyricMode, playSongLyricIndex } = storeToRefs(status);
const { playSongLyric } = storeToRefs(music);
const {
  showYrc,
  showYrcAnimation,
  countDownShow,
  lyricsFontSize,
  lrcMousePause,
  lyricsBlock,
  lyricsPosition,
  lyricsBlur,
  showTransl,
  showRoma,
  playCoverType,
  justLyricArea,
  lyricsBold,
  lyricsStyle,
} = storeToRefs(settings);

// 歌词滚动数据
const lyricScroll = ref(null);
const lrcMouseStatus = ref(false);

// 鼠标移出歌词区域
const lrcAllLeave = () => {
  lrcMouseStatus.value = false;
  lyricsScroll(playSongLyricIndex.value);
};

// 歌词滚动
const lyricsScroll = (index) => {
  const el = document.getElementById("lrc" + index);
  if (el && !lrcMouseStatus.value) {
    const container = el.parentElement;
    // 调整滚动的距离
    const scrollDistance = el.offsetTop - container.offsetTop - 80;
    // 开始滚动
    if (lyricsBlock.value === "center") {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      lyricScroll.value?.scrollTo({ top: scrollDistance, behavior: "smooth" });
    }
  }
};

// 逐字歌词样式计算
const getYrcStyle = (wordData, lyricIndex) => {
  if (showYrcAnimation.value) {
    // 如果当前歌词索引与播放歌曲的歌词索引不匹配
    if (playSongLyricIndex.value !== lyricIndex) {
      return {
        transitionDuration: `0ms, 0ms, 0.35s`,
        transitionDelay: `0ms`,
      };
    }
    // 如果播放状态不是加载中，且当前单词的时间加上持续时间减去播放进度大于 0
    if (status.playLoading === false && wordData.time + wordData.duration - playSeek.value > 0) {
      return {
        transitionDuration: `0s, 0s, 0.35s`,
        transitionDelay: `0ms`,
        WebkitMaskPositionX: `${
          100 - Math.max(((playSeek.value - wordData.time) / wordData.duration) * 100, 0)
        }%`,
      };
    }
    // 如果以上条件都不满足
    return {
      transitionDuration: `${wordData.duration}ms, ${wordData.duration * 0.8}ms, 0.35s`,
      transitionDelay: `${wordData.time - playSeek.value}ms, ${
        wordData.time - playSeek.value + wordData.duration * 0.5
      }ms, 0ms`,
    };
  } else {
    // 如果当前歌词索引与播放歌曲的歌词索引不匹配，或者播放状态不是加载中且当前单词的时间大于等于播放进度
    if (
      playSongLyricIndex.value !== lyricIndex ||
      (status.playLoading === false && wordData.time >= playSeek.value)
    ) {
      return { opacity: 0 };
    }
    // 如果以上条件都不满足
    return { opacity: 1 };
  }
};

// 进度跳转
const jumpSeek = (time) => {
  if (!time) return false;
  setSeek(time);
  fadePlayOrPause();
};

// 主进程调用歌词滚动
if (typeof electron !== "undefined") {
  electron.ipcRenderer.on("lyricsScroll", () => {
    lyricsScroll(playSongLyricIndex.value);
  });
}

// 监听歌词滚动
watch(
  () => playSongLyricIndex.value,
  (val) => lyricsScroll(val),
);
watch(
  () => pureLyricMode.value,
  () => lyricsScroll(playSongLyricIndex.value),
);

onMounted(() => {
  nextTick().then(() => {
    lyricsScroll(playSongLyricIndex.value);
  });
});

// 处理歌词点击
const handleLineClick = (e) => {
  const time = e.line.getLine().startTime;
  if (time != null) {
    setSeek(time);
    fadePlayOrPause();
  }
};

// 获取当前歌词
const currentLyrics = computed(() => {
  const songLyric = music.playSongLyric || { lrcAMData: [], yrcAMData: [] };
  return createLyricsProcessor(songLyric, {
    showYrc: showYrc.value,
    showRoma: showRoma.value,
    showTransl: showTransl.value,
  });
});

// 计算当前播放时间
const currentTime = computed(() => status.playSeek * 1000);

</script>

<style lang="scss" scoped>
.lyric {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  font-size: 14px;
  box-sizing: border-box;
  height: calc(100vh - 200px);
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
  -webkit-mask: linear-gradient(
    180deg,
    hsla(0, 0%, 100%, 0) 0,
    hsla(0, 0%, 100%, 0.6) 5%,
    #fff 10%,
    #fff 75%,
    hsla(0, 0%, 100%, 0.6) 85%,
    hsla(0, 0%, 100%, 0)
  );
  :deep(.n-scrollbar-rail) {
    display: none;
  }
  :deep(.n-scrollbar-content) {
    padding-left: 10px;
    padding-right: 80px;
  }
  .fade-enter-active {
    transition-delay: 0.3s;
  }
  .lyric-all {
    width: 100%;
    height: 100%;
  }
  .placeholder {
    width: 100%;
    &:first-child {
      height: 260px;
      display: flex;
      align-items: flex-end;
    }
    &:last-child {
      height: 0;
      padding-top: 100%;
    }
  }
  .lrc-line {
    position: relative;
    display: flex;
    flex-direction: column;
    margin: 6px 0;
    padding: 10px 16px;
    transform: scale(0.86);
    transform-origin: left center;
    transition:
      filter 0.35s,
      opacity 0.35s,
      transform 0.35s ease-in-out;
    .lrc-content {
      font-size: 46px;
      word-wrap: break-word;
      // 逐字歌词部分样式
      .lrc-text {
        position: relative;
        display: inline-block;
        .word {
          opacity: 0.3;
        }
        .filler {
          opacity: 0;
          position: absolute;
          left: 0;
          top: 0;
          transform: none;
          will-change: -webkit-mask-position-x;
          mask-image: linear-gradient(
            to right,
            rgb(0, 0, 0) 45.4545454545%,
            rgba(0, 0, 0, 0) 54.5454545455%
          );
          mask-size: 220% 100%;
          mask-repeat: no-repeat;
          -webkit-mask-image: linear-gradient(
            to right,
            rgb(0, 0, 0) 45.4545454545%,
            rgba(0, 0, 0, 0) 54.5454545455%
          );
          -webkit-mask-size: 220% 100%;
          -webkit-mask-repeat: no-repeat;
          transition: all 0.35s;
        }
        &.end-with-space {
          margin-right: 12px;
          &:last-child {
            margin-right: 0;
          }
        }
      }
    }
    .lrc-fy {
      margin-top: 8px;
      font-size: 30px;
      opacity: 0.6;
      transition: opacity 0.35s;
    }
    .lrc-roma {
      margin-top: 4px;
      font-size: 20px;
      opacity: 0.6;
      transition: opacity 0.35s;
    }
    &.islrc {
      opacity: 0.3;
    }
    &.isyrc {
      .lrc-content {
        display: flex;
        flex-wrap: wrap;
      }
      .lrc-fy,
      .lrc-roma {
        opacity: 0.3;
      }
    }
    &.on {
      opacity: 1;
      transform: scale(1);
      // 逐字歌词
      .lrc-text {
        .filler {
          opacity: 1;
          -webkit-mask-position-x: 0%;
          transition-property: -webkit-mask-position-x, transform, opacity;
          transition-timing-function: linear, ease, ease;
        }
        &.end-with-space {
          margin-right: 12px;
        }
        // &.lrc-long {
        //   .filler {
        //     filter: drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.6));
        //   }
        // }
      }
      .lrc-fy,
      .lrc-roma {
        opacity: 0.6;
      }
    }
    @media (min-width: 768px) {
      &::before {
        content: "";
        display: block;
        position: absolute;
        left: 0px;
        top: 0;
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background-color: var(--cover-second-color);
        opacity: 0;
        z-index: 0;
        transform: scale(1.05);
        transition:
          transform 0.35s ease,
          opacity 0.35s ease;
        pointer-events: none;
      }
      &:hover {
        opacity: 1;
        filter: blur(0) !important;
        &::before {
          transform: scale(1);
          opacity: 1;
        }
      }
      &:active {
        &::before {
          transform: scale(0.95);
        }
      }
    }
  }
  &.lyric-center,
  &.pure {
    span {
      text-align: center !important;
    }
    .placeholder {
      justify-content: center !important;
    }
    .lrc-line {
      transform-origin: center !important;
      align-items: center !important;
      .lrc-content {
        justify-content: center !important;
      }
    }
  }
  &.lyric-right {
    span {
      text-align: right;
    }
    .placeholder {
      justify-content: flex-end;
    }
    .lrc-line {
      transform-origin: right;
      align-items: flex-end;
      .lrc-content {
        justify-content: flex-end;
      }
    }
  }
  &.pure {
    :deep(.n-scrollbar-content) {
      padding: 0 80px;
    }
  }
  &.record,
  &.pure {
    height: calc(100vh - 300px);
    margin-bottom: 40px;
    .lrc-line {
      margin-bottom: -12px;
      transform: scale(0.76);
      &.on {
        transform: scale(0.9);
      }
    }
  }
  &.custom-lrc {
    font-family: var(--main-font-family-lyric) !important;
  }
  @media (max-width: 700px) {
    :deep(.n-scrollbar-content) {
      padding: 0 20px !important;
    }
    .lrc-line {
      .lrc-content {
        font-size: 6.5vw !important;
      }
      .lrc-fy {
        font-size: 4.5vw !important;
      }
      .lrc-roma {
        font-size: 4vw !important;
      }
    }
  }
}
</style>
