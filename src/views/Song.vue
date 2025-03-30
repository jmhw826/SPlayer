<!-- 单曲页面 -->
<template>
  <div class="song" v-if="songDetail">
    <div class="detail">
      <div class="pic">
        <n-image
          class="coverImg"
          :previewed-img-props="{ style: { borderRadius: '8px' } }"
          :src="songDetail?.coverSize?.l || songDetail?.cover"
          fallback-src="/imgs/pic/album.jpg?assest"
        >
          <template #placeholder>
            <div class="cover-loading">
              <n-spin />
            </div>
          </template>
        </n-image>
        <n-image
          class="shadow"
          preview-disabled
          :src="songDetail?.coverSize?.l || songDetail?.cover"
          fallback-src="/imgs/pic/album.jpg?assest"
        />
      </div>
      <div class="right">
        <div class="intr">
          <n-text class="name text-hidden">{{ songDetail.name }}</n-text>
          <n-text depth="3" class="alia" v-if="songDetail.alia">{{ songDetail.alia }}</n-text>
          <n-space class="tag">
            <n-tag v-if="songDetail.fee == 1 || songDetail.fee == 4" class="vip" round :bordered="false">
              {{ songDetail.fee == 1 ? "VIP" : "EP" }}
            </n-tag>
            <n-tag v-if="songDetail.pc" class="cloud" round type="info" :bordered="false">
              云盘歌曲
            </n-tag>
          </n-space>
          <div class="item">
            <n-icon :depth="3">
              <SvgIcon icon="user" />
            </n-icon>
            <div v-if="songDetail.artists && Array.isArray(songDetail.artists)" class="all-ar">
              <n-text v-for="ar in songDetail.artists" :key="ar.id" class="ar" depth="3">
                {{ ar.name }}
              </n-text>
            </div>
            <n-text v-else class="ar" depth="3">
              {{ songDetail.artists || "未知艺术家" }}
            </n-text>
          </div>
          <div class="item" v-if="songDetail.album">
            <n-icon :depth="3">
              <SvgIcon icon="disc" />
            </n-icon>
            <n-text class="text" @click="router.push(`/album?id=${songDetail.album.id}`)">
              {{ songDetail.album.name }}
            </n-text>
          </div>
          <!--div class="item" v-if="songDetail.publishTime">
            <n-icon :depth="3">
              <SvgIcon icon="time" />
            </n-icon>
            <n-text class="text">
              {{ getLongTime(songDetail.publishTime) }}
            </n-text>
          </div-->
        </div>
        <n-space class="button">
          <n-button type="primary" strong secondary @click="playSong(songDetail)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="play" />
              </n-icon>
            </template>
            立即播放
          </n-button>
          <n-button strong secondary @click="addPlaylistRef?.openAddToPlaylist(songId)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="playlist-add" />
              </n-icon>
            </template>
            添加到歌单
          </n-button>
          <n-button strong secondary @click="router.push(`/comment?id=${songDetail.id}`)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="comment-text" />
              </n-icon>
            </template>
            查看评论
          </n-button>
          <n-button strong secondary v-if="songDetail.mv" @click="router.push(`/videos-player?id=${songDetail.mv}`)">
            <template #icon>
              <n-icon>
                <SvgIcon icon="video" />
              </n-icon>
            </template>
            观看 MV
          </n-button>
        </n-space>
      </div>
    </div>
  </div>
  <!-- 添加到歌单 -->
  <AddPlaylist ref="addPlaylistRef" />
</template>

<script setup>
import { useRouter } from "vue-router";
import { getSongDetail } from "@/api/song";
import { addSongToNext } from "@/utils/Player";
import { musicData, siteStatus } from "@/stores";
// import { getLongTime } from "@/utils/timeTools";
import formatData from "@/utils/formatData";
import AddPlaylist from "@/components/Modal/AddPlaylist.vue";

const router = useRouter();
const music = musicData();
const status = siteStatus();

// 子组件
const addPlaylistRef = ref(null);

// 歌曲信息
const songId = ref(router.currentRoute.value.query.id);
const songDetail = ref(null);

// 检查是否具有歌曲 id
const isHasSongId = (id) => {
  if (!id) {
    $message.error("参数不完整");
    return router.go(-1);
  }
};

// 获取歌曲详情
const getSongDetailData = async (id) => {
  try {
    const detail = await getSongDetail(id);
    const data = formatData(detail?.songs?.[0], "song");
    songDetail.value = data?.[0] ?? null;
    // 设置页面标题
    if (songDetail.value) {
      document.title = `${songDetail.value.name} - ${songDetail.value.artists?.[0]?.name || "未知艺术家"} - 歌曲详情`;
    }
  } catch (error) {
    console.error("获取歌曲详情失败：", error);
    $message.error("获取歌曲详情失败");
  }
};

// 播放歌曲
const playSong = (data) => {
  if (!data) return;
  // 更改播放模式为普通模式
  status.playMode = "normal";
  // 添加到播放列表并播放
  addSongToNext(data, true);
};

onMounted(() => {
  // 若无 id
  isHasSongId(songId.value);
  // 获取歌曲详情
  getSongDetailData(songId.value);
});

// 路由参数变化已在router/routes.js中通过beforeEnter钩子函数处理
</script>

<style lang="scss" scoped>
.song {
  .detail {
    width: 80vw;
    display: flex;
    flex-direction: row;

    .pic {
      height: auto;
      display: flex;
      min-width: 180px;
      align-items: center;
      justify-content: center;
      max-width: 280px;
      border-radius: 8px;
      margin-right: 40px;
      position: relative;
      transition: transform 0.3s;

      &:active {
        transform: scale(0.95);
      }

      .coverImg {
        border-radius: 8px;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 1;

        :deep(img) {
          width: 100%;
        }

        .cover-loading {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 0;
          padding-bottom: 100%;
          background-color: #0001;

          .n-spin-body {
            position: absolute;
            top: 0;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }

      .shadow {
        position: absolute;
        top: 12px;
        height: 100%;
        width: 100%;
        filter: blur(16px) opacity(0.6);
        transform: scale(0.92, 0.96);
        z-index: 0;
        background-size: cover;
        aspect-ratio: 1/1;

        :deep(img) {
          width: 100%;
        }
      }
    }

    .right {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .intr {
        display: flex;
        flex-direction: column;

        .name {
          -webkit-line-clamp: 2;
          font-size: 40px;
          font-weight: bold;
        }

        .alia {
          font-size: 20px;
        }

        .tag {
          margin: 12px 0;
        }

        .item {
          font-size: 16px;
          display: flex;
          align-items: center;
          margin-bottom: 4px;

          .n-icon {
            margin-right: 6px;
          }

          .text {
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
              color: var(--main-color);
            }
          }

          .all-ar {
            margin-top: 4px;
            font-size: 13px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            word-break: break-all;

            .ar {
              display: inline-flex;

              &::after {
                content: "/";
                margin: 0 4px;
              }

              &:last-child {
                &::after {
                  display: none;
                }
              }
            }
          }
        }
      }

      .button {
        margin-top: 16px;
        gap: 12px !important;
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      width: 100%;

      .pic {
        margin-bottom: 20px;
      }

      .right {
        .intr {
          .name {
            font-size: 24px;
          }

          .alia {
            font-size: 16px;
          }
        }
      }
    }
  }
}
</style>
