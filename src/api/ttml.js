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
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            mode: "cors",
            credentials: "include"
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error fetching TTML:", error);
        throw error;
    }
}