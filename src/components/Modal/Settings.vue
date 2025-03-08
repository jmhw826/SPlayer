<template>
  <n-modal v-model:show="showModal" title="设置" size="large" style="width:800px; max-width: 90vw; background-color: var(--main-second-color)">
    <div class="settings-modal">
      <div class="tabs-container">
        <n-tabs
          ref="setTabsRef"
          v-model:value="setTabsValue"
          type="line"
          @update:value="settingTabChange"
          vertical
        >
          <n-tab name="setTab1"> 常规 </n-tab>
          <n-tab name="setTab2"> 系统 </n-tab>
          <n-tab name="setTab3"> 播放 </n-tab>
          <n-tab name="setTab4"> 歌词 </n-tab>
          <n-tab name="setTab5"> 下载 </n-tab>
          <n-tab name="setTab6"> 其他 </n-tab>
          <n-tab name="setTab7"> TestOptions </n-tab>
        </n-tabs>
      </div>
      <div class="settings-content">
        <n-scrollbar
          ref="setScrollRef"
          :style="{
            height: `calc(100vh - ${music.getPlaySongData?.id && showPlayBar ? 328 : 248}px)`,
          }"
          class="all-set"
          @scroll="allSetScroll"
        >
          <!-- 常规 -->
          <General />
          <!-- 系统 -->
          <System />
          <!-- 播放 -->
          <Player />
          <!-- 歌词 -->
          <Lyrics />
          <!-- 下载 -->
          <Download />
          <!-- 其他 -->
          <Other />
          <!--TestOptions-->
          <TestOptions />
        </n-scrollbar>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from "pinia";
import { siteSettings, siteStatus, musicData } from "@/stores";
import debounce from "@/utils/debounce";
import packageJson from "@/../package.json";
// 设置子项
import General from "@/views/Setting/general.vue";
import System from "@/views/Setting/system.vue";
import Player from "@/views/Setting/player.vue";
import Lyrics from "@/views/Setting/lyrics.vue";
import Download from "@/views/Setting/download.vue";
import Other from "@/views/Setting/other.vue";
import TestOptions from "@/views/Setting/testoptions.vue";

const music = musicData();
const status = siteStatus();
const settings = siteSettings();
const { showPlayBar } = storeToRefs(status);
const { themeAutoCover } = storeToRefs(settings);

// 标签页数据
const setTabsRef = ref(null);
const setScrollRef = ref(null);
const setTabsValue = ref("setTab1");
const showModal = ref(false);

// 标签页切换
const settingTabChange = (name) => {
  const index = Number(name.replace("setTab", ""));
  const setDom = document.querySelectorAll(".set-type")?.[index - 1];
  if (!setDom) return false;
  // 滚动至设置分类
  setDom.scrollIntoView({ behavior: "smooth" });
};

// 设置列表滚动
const allSetScroll = debounce((e) => {
  const distance = e.target.scrollTop + 30;
  const allSetDom = document.querySelectorAll(".set-type");
  allSetDom.forEach((v, i) => {
    if (distance >= v.offsetTop) setTabsValue.value = `setTab${i + 1}`;
  });
}, 100);

// 跳转
const jump = () => {
  window.open(packageJson.github);
};

// 方法：显示弹窗
const openModal = () => {
  showModal.value = true;
};

defineExpose({ showModal: openModal });
</script>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: warp;
  .tabs-container {
    width: 200px;
    border-right: 1px solid #e0e0e0;
  }
  .settings-content {
    flex: 1;
    padding: 20px;
  }
}
</style>