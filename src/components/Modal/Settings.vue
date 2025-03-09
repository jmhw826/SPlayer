<template>
  <n-modal v-model:show="showModal" title="设置" size="large"
    style="width:800px; max-width: 90vw; background-color: var(--divider-color)">
    <div class="settings-modal">
      <div class="tabs-container">
        <n-tabs ref="setTabsRef" v-model:value="setTabsValue" type="line" @update:value="settingTabChange">
          <n-tab name="setTab1">常规</n-tab>
          <n-tab name="setTab2">系统</n-tab>
          <n-tab name="setTab3">播放</n-tab>
          <n-tab name="setTab4">歌词</n-tab>
          <n-tab name="setTab5">下载</n-tab>
          <n-tab name="setTab6">其他</n-tab>
          <n-tab name="setTab7">TestOptions</n-tab>
        </n-tabs>
      </div>
      <div class="settings-content">
        <n-scrollbar ref="setScrollRef" :style="{
    height: `calc(100vh - ${music.getPlaySongData?.id && showPlayBar ? 368 : 288}px)`,
  }" class="all-set" @scroll="allSetScroll">
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
    <!-- 添加底部操作按钮 -->
    <template #action>
      <div class="modal-actions">
        <n-button type="primary" ghost @click="openWebSettings">
          打开完整设置页
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, nextTick } from 'vue';
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
import Other from "@/components/Modal/Settings/other.vue";
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

// 新增打开网页端设置方法
const openWebSettings = () => {
  window.open(`${window.location.origin}/#/setting`);
};

defineExpose({ showModal: openModal });
import { watch } from 'vue';

// 监听主题变化
watch(() => settings.themeType, (newTheme) => {
  const isDark = newTheme === 'dark';
  document.documentElement.style.setProperty('--main-second-color', isDark ? '#1f1f1f' : '#f5f5f5');
  // 更新其他相关样式变量
}, { immediate: true });
</script>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: column;
  height: 70vh;
  background-color: var(--main-second-color);

  .tabs-container {
    flex-shrink: 0;
    border-bottom: 1px solid var(--divider-color);
    background-color: var(--main-second-color);

    :deep(.n-tabs-nav) {
      padding: 0 20px;
    }
  }

  .settings-content {
    flex: 1;
    overflow: hidden;
    padding: 16px 24px;
    background-color: var(--main-second-color);

    .n-scrollbar {
      padding-right: 12px;
      background-color: var(--main-second-color);
    }
  }
}

.modal-actions {
  padding: 12px 24px;
  border-top: 1px solid var(--divider-color);
  text-align: center;
  background-color: var(--main-second-color);
}
</style>