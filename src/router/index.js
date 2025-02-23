import { nextTick } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { checkPlatform } from "@/utils/helper";
import { isLogin } from "@/utils/auth";
import routes from "@/router/routes";

// 基础配置
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// 页面回顶
const scrollToTop = () => {
  nextTick().then(() => {
    const mainLayout = document.getElementById("main-layout");
    mainLayout?.scrollIntoView({ behavior: "smooth" });
  });
};

// 匹配
const Router = require("koa-router");
const match = require("@unblockneteasemusic/server");
const koaRouter = new Router(); // 创建新的 Koa Router 实例
koaRouter.get("/unblock", async (ctx) => {
  try {
    const id = ctx.request.query.id;
    const server = ctx.request.query.server
      ? ctx.request.query.server.split(",")
      : ["kugou", "kuwo", "migu", "bilibili", "pyncmd"];
    console.log("开始匹配：" + id + " - " + server);
    if (!id) {
      ctx.body = { code: 400, message: "参数不完整" };
      ctx.status = 400;
      return false;
    }
    const data = await match(id, server).then((res) => {
      return res;
    });
    // 反代
    const proxy = process.env.PROXY_URL;
    if (proxy && data.url.includes("kuwo")) {
      data.proxyUrl = proxy + data.url.replace(/^http:\/\//, "http/");
    }
    ctx.body = {
      code: 200,
      message: "匹配成功",
      data,
    };
  } catch (error) {
    console.log("匹配出现错误：" + error);
    ctx.body = {
      code: 500,
      message: "匹配失败",
    };
    ctx.status = 500;
  }
});
// 路由守卫
router.beforeEach((to, from, next) => {
  // 开始进度条
  if (to.path !== from.path) {
    if (typeof $loadingBar !== "undefined" && !checkPlatform.electron()) {
      $loadingBar.start();
    }
  }
  // 判断是否需要登录
  if (to.meta.needLogin) {
    if (isLogin()) {
      next();
    } else {
      $message.warning("请登录后使用");
      if (typeof $loadingBar !== "undefined" && !checkPlatform.electron()) {
        $loadingBar.error();
      }
      if (typeof $changeLogin !== "undefined") $changeLogin();
    }
  }
  // 是否为本地功能
  else if (to.meta.needLocal) {
    if (checkPlatform.electron()) {
      next();
    } else {
      $message.error("客户端独占功能");
      if (typeof $loadingBar !== "undefined" && !checkPlatform.electron()) {
        $loadingBar.error();
      }
      next("/403");
    }
  } else {
    next();
  }
});

router.afterEach(() => {
  // 结束进度条
  if (typeof $loadingBar !== "undefined" && !checkPlatform.electron()) $loadingBar.finish();
  // 页面回顶
  scrollToTop();
});

export default router;
export { koaRouter }; // 导出 koaRouter 实例
