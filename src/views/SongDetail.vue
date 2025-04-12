<template>
  <div></div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import SongDetail from '@/components/Modal/SongDetail.vue';

const router = useRouter();
const songDetailRef = ref(null);

onMounted(() => {
  const songId = router.currentRoute.value.query.id;
  if (songId) {
    // 打开歌曲详情弹窗
    songDetailRef.value?.openDetail(songId);
    // 检查历史记录
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }
});
</script>