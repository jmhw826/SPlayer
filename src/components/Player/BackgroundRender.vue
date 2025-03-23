<template>
  <div ref="wrapperRef" v-bind="$attrs"></div>
</template>

<script setup>
// 基于Steven-xmh的`applemusic-like-lyrics`包实现背景渲染
import {
  BackgroundRender as CoreBackgroundRender,
  AbstractBaseRenderer,
  BaseRenderer,
  MeshGradientRenderer,
} from "@applemusic-like-lyrics/core";
import { ref, onMounted, onUnmounted, watch, defineExpose } from "vue";

const props = defineProps({
  // 专辑封面URL
  album: {
    type: String,
    default: ""
  },
  // 帧率
  fps: {
    type: Number,
    default: undefined
  },
  // 是否播放
  playing: {
    type: Boolean,
    default: true
  },
  // 流动速度
  flowSpeed: {
    type: Number,
    default: undefined
  },
  // 是否有歌词
  hasLyric: {
    type: Boolean,
    default: true
  },
  // 低频音量
  lowFreqVolume: {
    type: Number,
    default: 1.0
  },
  // 渲染比例
  renderScale: {
    type: Number,
    default: 0.5
  },
  // 静态模式
  staticMode: {
    type: Boolean,
    default: false
  },
  // 渲染器
  renderer: {
    type: Function,
    default: undefined
  }
});

const coreBGRenderRef = ref(null);
const wrapperRef = ref(null);

onMounted(() => {
  coreBGRenderRef.value = CoreBackgroundRender.new(props.renderer ?? MeshGradientRenderer);
  if (props.album) coreBGRenderRef.value?.setAlbum(props.album);
  if (props.fps) coreBGRenderRef.value?.setFPS(props.fps);
  if (props.playing) {
    coreBGRenderRef.value?.resume();
  } else {
    coreBGRenderRef.value?.pause();
  }
  if (props.flowSpeed) coreBGRenderRef.value?.setFlowSpeed(props.flowSpeed);
  coreBGRenderRef.value?.setStaticMode(props.staticMode);
  coreBGRenderRef.value?.setRenderScale(props.renderScale);
  coreBGRenderRef.value?.setLowFreqVolume(props.lowFreqVolume);
  coreBGRenderRef.value?.setHasLyric(props.hasLyric);

  if (coreBGRenderRef.value) {
    const el = coreBGRenderRef.value.getElement();
    el.style.width = "100%";
    el.style.height = "100%";
    wrapperRef.value?.appendChild(el);
  }
});

onUnmounted(() => {
  coreBGRenderRef.value?.dispose();
});

watch(() => props.album, (newValue) => {
  if (newValue) coreBGRenderRef.value?.setAlbum(newValue);
});

watch(() => props.fps, (newValue) => {
  if (typeof newValue !== 'undefined') coreBGRenderRef.value?.setFPS(newValue);
});

watch(() => props.playing, (newValue) => {
  if (newValue) {
    coreBGRenderRef.value?.resume();
  } else {
    coreBGRenderRef.value?.pause();
  }
});

watch(() => props.flowSpeed, (newValue) => {
  if (typeof newValue !== 'undefined') coreBGRenderRef.value?.setFlowSpeed(newValue);
});

watch(() => props.staticMode, (newValue) => {
  coreBGRenderRef.value?.setStaticMode(newValue);
});

watch(() => props.renderScale, (newValue) => {
  if (newValue) coreBGRenderRef.value?.setRenderScale(newValue);
});

watch(() => props.lowFreqVolume, (newValue) => {
  if (newValue) coreBGRenderRef.value?.setLowFreqVolume(newValue);
});

watch(() => props.hasLyric, (newValue) => {
  if (newValue !== undefined) coreBGRenderRef.value?.setHasLyric(newValue);
});

defineExpose({
  wrapperEl: wrapperRef,
  bgRender: coreBGRenderRef,
});
</script>

<style scoped>
/* 背景渲染器样式 */
</style>