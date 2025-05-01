/**
 * 获取TTML格式歌词(AMLL歌词专属)
 * @param {number} id - 要获取歌词的音乐ID
 */
export const getSongTTML = async (id) => {
    if (import.meta.env["RENDERER_VITE_SITE_ROOT"] === "true") {
        var lyricurl = "/api/ttml";
    } else {
        var lyricurl = `${import.meta.env.VITE_TTML_API}`;
    }
    const url = `${lyricurl}/api/search?id=${id}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        return Promise.reject(new Error());
    }
    return await response.json();
}