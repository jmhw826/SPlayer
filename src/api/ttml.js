/**
 * 获取TTML格式歌词(AMLL歌词专属)
 * @param {number} id - 要获取歌词的音乐ID
 */
export const getSongTTML = async (id) => {
    if (1 === 2 && import.meta.env["RENDERER_VITE_SITE_ROOT"] === "true") {
        var lyricurl = "/api/ttml";
    } else {
        var lyricurl = `${import.meta.env.VITE_TTML_API}`;
    }
    const url = `${lyricurl}/api/search?id=${id}&fixedVersion=ttml`;
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorMessage = `TTML API请求失败: ${response.status} ${response.statusText}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching TTML:", error);
        throw error;
    }
}