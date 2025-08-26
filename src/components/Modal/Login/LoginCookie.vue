<template>
  <div class="login-cookie">
    <n-alert type="info" :bordered="bordered" style="margin-bottom: 16px;">
      可在官方的
      <n-a href="https://music.163.com/" target="_blank">网页端</n-a>
      或者点击下方使用官方网页端登录获取cookie
    </n-alert>
    <n-input v-model:value="cookie" :autosize="{ minRows: 3, maxRows: 6 }" type="textarea" placeholder="请输入 Cookie" />
    <n-flex class="menu">
      <n-button type="primary" @click="openWeb">官网登陆</n-button>
      <n-button type="primary" @click="login">登录</n-button>
    </n-flex>
  </div>
</template>

<script setup>

const cookie = ref("");
const emit = defineEmits(["setLoginData"]);

// Cookie 登录
const login = async () => {
  if (!cookie.value) {
    $message.warning("请输入 Cookie");
    return;
  }
  cookie.value = cookie.value.trim();
  console.log(cookie.value.endsWith(";"));

  // 是否为有效 Cookie
  if (!cookie.value.includes("MUSIC_U") || !cookie.value.endsWith(";")) {
    $message.warning("请输入有效的 Cookie");
    return;
  }
  // 写入 Cookie
  try {
    $message.success("登录成功");
    const res = { code: 200, cookie: cookie.value };
    emit("setLoginData", res);
  } catch (error) {
    $message.error("登录失败，请重试");
    console.error("Cookie 登录出错：", error);
  }
};

const openWeb = () => {
  $message.warning("功能开发中!");
  /*
  window.open("https://music.163.com/", "_blank");
  */
};

</script>

<style lang="scss" scoped>
.login-cookie {

  .n-input,
  .n-button {
    width: 100%;
  }

  code {
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--n-border-color);
    padding: 4px 6px;
    border-radius: 8px;
    margin: 4px 0;
    font-family: auto;
  }

  .menu {
    margin-top: 20px;

    .n-button {
      width: auto;
      flex: 1;
      margin: 0;
    }
  }
}
</style>