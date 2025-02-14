import { checkPlatform } from "@/utils/helper";
import { getCookie, isLogin } from "@/utils/auth";
import { siteSettings } from "@/stores";
import axios from "axios";

// 全局地址
if (checkPlatform.electron()) {
    axios.defaults.baseURL = "/api";
} else {
    axios.defaults.baseURL = import.meta.env["RENDERER_VITE_SERVER_URL"];
}

// 基础配置
axios.defaults.timeout = 15000;
axios.defaults.withCredentials = true;

// 请求拦截
axios.interceptors.request.use(
    (request) => {
        const settings = siteSettings();
        if (!request.params) request.params = {};
        // 附加 cookie
        if (!request.noCookie && (isLogin() || getCookie("MUSIC_U") !== null)) {
            request.params.cookie = `MUSIC_U=00EA6EE911FEB2DD0D9D47E97B177AFFB359EC6DAB1AEAEF85030577B5BFDA58D9E7E455BEAD58FD4A51E2658C356D6773A44F9D8D8D1DBF60316A0B01662B88A2CE7797B92AF0FBF69A15D0603DF59CB83FC76E96499C391AFDDCF040BDB6F6AEBFD5532EBD592B99746BA85E24981104A3964B9A69F56737883FA1544D4630F25CB5FEA769D2834FAB4DEC131B06D1B5D52610AFE1001E0A6C4A02ED3AFC75AEEB0CAF75E3EE85FAAF69CB080D2FB41B461B71C6458859431D7AEDD2740DBF4CA9F219C18BB63CE55A7C0E11199572849D934AC9D3AC07A272C1008404C3DF3BE52A4FE392E75E08836C0D5AA51C2ADB993F7533B291494013B6C661CA4571B3BB052026B9C4195608FC48BD1160EBBFDB0687C260ADFE78DC6646FE0FEF5B6E506AC1DA4C35D1D22F327CACD1A56210BFC8F40D12B285C9A7328CC4BE7F71BCFA978B25F924B4B0A83E65CDD43B08B7FD01C5F850C30782E6642DDD95DFDD36AADF796D0A181CD71CCEA56A199606D49950C8ACCBD5B8237632705804228967;`;
        }
        // 去除 cookie
        if (request.noCookie) {
            request.params.noCookie = true;
        }
        // 附加 realIP
        if (settings.useRealIP) {
            request.params.realIP = settings.realIP || "116.25.146.177";
        }
        // 附加代理
        const proxy = JSON.parse(localStorage.getItem("siteSettings")).proxyProtocol;
        if (proxy !== "off") {
            const server = JSON.parse(localStorage.getItem("siteSettings")).proxyServe;
            const port = parseInt(localStorage.getItem("siteSettings").proxyPort);
            if (server && port) {
                request.params.proxy = `${proxy}://${server}:${port}`;
            }
        }
        // 发送请求
        return request;
    },
    (error) => {
        console.error("请求失败，请稍后重试");
        return Promise.reject(error);
    },
);

// 响应拦截
axios.interceptors.response.use(
    (response) => {
        return response?.data;
    },
    (error) => {
        // 从错误对象中获取响应信息
        const response = error.response;
        // 断网处理
        if (!response) $canNotConnect(error);
        // 状态码处理
        switch (response?.status) {
            case 400:
                console.error("客户端错误：", response.status, response.statusText);
                // 执行客户端错误的处理逻辑
                break;
            case 401:
                console.error("未授权：", response.status, response.statusText);
                // 执行未授权的处理逻辑
                break;
            case 403:
                console.error("禁止访问：", response.status, response.statusText);
                // 执行禁止访问的处理逻辑
                break;
            case 404:
                console.error("未找到资源：", response.status, response.statusText);
                // 执行未找到资源的处理逻辑
                break;
            case 500:
                console.error("服务器错误：", response.status, response.statusText);
                // 执行服务器错误的处理逻辑
                break;
            default:
                // 处理其他状态码或错误条件
                console.error("未处理的错误：", error.message);
        }
        // 继续传递错误
        return Promise.reject(error);
    },
);

export default axios;
