<!-- 歌曲下载 -->
<template>
  <n-modal
    v-model:show="downloadSongShow"
    :bordered="false"
    :close-on-esc="false"
    :auto-focus="false"
    :mask-closable="!downloadStatus"
    :on-after-leave="closeDownloadModal"
    class="download-song"
    preset="card"
    title="歌曲下载"
  >
    <Transition name="fade" mode="out-in">
      <div v-if="songData">
        <div class="song-info">
          <n-text class="name">{{ songData.name }}</n-text>
          <n-text class="artist">{{ songData.artists.map(artist => artist.name).join(', ') }}</n-text>
        </div>
    <n-card class="set-item">
      <div class="name">
        同时下载歌曲元信息
        <n-text class="tip">为当前下载歌曲附加封面及歌词等元信息</n-text>
      </div>
      <n-switch v-model:value="downloadMeta" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">下载歌曲时同时下载封面</div>
      <n-switch v-model:value="downloadCover" :disabled="!downloadMeta" :round="false" />
    </n-card>
    <n-card class="set-item">
      <div class="name">下载歌曲时同时下载歌词</div>
      <n-switch v-model:value="downloadLyrics" :disabled="!downloadMeta" :round="false" />
    </n-card>
      </div>
      <n-text v-else>歌曲信息获取中</n-text>
    </Transition>
    <template #footer>
      <n-flex justify="end">
        <n-button @click="closeDownloadModal"> 关闭 </n-button>
        <n-button
          :disabled="!songData"
          :loading="downloadStatus"
          :focusable="false"
          type="primary"
          @click="toSongDownload(songData, lyricData)"
        >
          下载
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { isLogin } from "@/utils/auth";
import { useRouter } from "vue-router";
import { siteData, siteSettings } from "@/stores";
import { getSongDetail, getSongLyric, getMusicNumUrl } from "@/api/song";
import { downloadFile, checkPlatform } from "@/utils/helper";
import formatData from "@/utils/formatData";

const router = useRouter();
const data = siteData();
const settings = siteSettings();
const { userData } = storeToRefs(data);
const { downloadPath, downloadMeta, downloadCover, downloadLyrics } = storeToRefs(settings);

// 歌曲下载数据
const songId = ref(null);
const songData = ref(null);
const lyricData = ref(null);
const downloadStatus = ref(false);
const downloadSongShow = ref(false);

// 获取歌曲详情
const getMusicDetailData = async (id) => {
  try {
    const songResult = await getSongDetail(id);
    const lyricResult = await getSongLyric(id);
    // 获取歌曲详情
    songData.value = formatData(songResult?.songs?.[0], "song")[0];
    lyricData.value = lyricResult?.lrc?.lyric || null;
  } catch (error) {
    closeDownloadModal();
    console.error("歌曲信息获取失败：", error);
  }
};

// 歌曲下载
const toSongDownload = async (song, lyric) => {
  try {
    console.log(song, lyric);
    downloadStatus.value = true;
    // 获取下载数据
    const result = await getMusicNumUrl(song?.id);
    console.log("下载数据：", result);
    // 检查 result.data 和 result.data.url 是否存在
    if (!result.data || !result.data.url) {
      downloadStatus.value = false;
      console.error("下载数据无效：", result);
      return $message.error("下载失败，请重试");
    }
    // 开始下载
    if (!downloadPath.value && checkPlatform.electron()) {
      $notification["warning"]({
        content: "缺少配置",
        meta: "请前往设置页配置默认下载目录",
        duration: 3000,
      });
    }
    // 获取下载结果
    const isDownloaded = await downloadFile({
      type: 'mp3',
      url: result.data.url
    }, song, lyric, {
      path: downloadPath.value,
      downloadMeta: downloadMeta.value,
      downloadCover: downloadCover.value,
      downloadLyrics: downloadLyrics.value,
    });
    console.log(lyric);
    if (isDownloaded) {
      $message.success("下载完成");
      closeDownloadModal();
    } else {
      downloadStatus.value = false;
      $message.error("下载失败，请重试");
    }
  } catch (error) {
    console.error("歌曲下载出错：", error);
    $message.error("歌曲下载失败，请重试");
  }
};

// 开启歌曲下载
const openDownloadModal = (data) => {
  console.log(data);
  // 执行下载
  const toDownload = () => {
    songId.value = data.id.toString();
    downloadSongShow.value = true;
    getMusicDetailData(songId.value);
  };
  if (isLogin() || !isLogin()) {
    return toDownload();
  }
};

// 关闭歌曲下载
const closeDownloadModal = () => {
  songId.value = null;
  songData.value = null;
  downloadStatus.value = false;
  downloadSongShow.value = false;
};

// 暴露方法
defineExpose({
  openDownloadModal,
});
</script>

<style lang="scss" scoped>
.download-song {
  .song-info {
    .name {
      font-size: 18px;
      font-weight: bold;
    }
    .artist {
      font-size: 14px;
      color: #666;
    }
  }
}
</style>