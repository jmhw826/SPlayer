/**
 * 现代化歌词处理工具
 * 参考src-modern/src/utils/lyric.ts实现
 */
import { LyricLine, parseLrc, parseYrc } from "@applemusic-like-lyrics/lyric";
import type { LyricLine as AMLLLyricLine, LyricWord, SongLyric } from '@/types/amll.ts';
import { msToS } from "./time.ts";
import { alignLyrics as alignLyricsUtil } from "./lyricAlignment.ts";

// 歌词排除内容 - 从设置中获取
const getExcludeKeywords = (): string[] => {
  // 这里可以从设置中获取排除关键词
  // 暂时返回一个默认值
  return ['纯音乐', 'instrumental', '作词', '作曲', 'op', 'ed', 'www', 'http'];
};

/**
 * 重置歌词数据
 * @returns 空的歌词数据结构
 */
export const createEmptySongLyric = () => {
  return {
    lrcData: [],
    lrcAMData: [],
    yrcData: [],
    yrcAMData: [],
  };
};

/**
 * 解析普通歌词数据
 * @param lrcData 原始LRC歌词行数组
 * @returns 处理后的歌词数据
 */
export const parseLrcData = (lrcData: LyricLine[]): any[] => {
  if (!lrcData || !lrcData.length) return [];
  
  // 数据处理
  const lrcList = lrcData
    .map((line) => {
      const words = line.words;
      if (!words || !words.length) return null;
      
      const time = msToS(words[0].startTime);
      const content = words[0].word.trim();
      
      // 排除内容
      if (!content || getExcludeKeywords().some((keyword) => content.includes(keyword))) {
        return null;
      }
      
      return {
        time,
        content,
      };
    })
    .filter((line) => line !== null);
  
  return lrcList;
};

/**
 * 解析逐字歌词数据
 * @param yrcData 原始YRC歌词行数组
 * @returns 处理后的歌词数据
 */
export const parseYrcData = (yrcData: LyricLine[]): any[] => {
  if (!yrcData || !yrcData.length) return [];
  
  // 数据处理
  const yrcList = yrcData
    .map((line) => {
      const words = line.words;
      if (!words || !words.length) return null;
      
      const time = msToS(words[0].startTime);
      const endTime = msToS(words[words.length - 1].endTime);
      
      const contents = words.map((word) => {
        return {
          time: msToS(word.startTime),
          endTime: msToS(word.endTime),
          duration: msToS(word.endTime - word.startTime),
          content: word.word.trim(),
          endsWithSpace: word.word.endsWith(" "),
        };
      });
      
      // 完整歌词
      const contentStr = contents
        .map((word) => word.content + (word.endsWithSpace ? " " : ""))
        .join("");
      
      // 排除内容
      if (!contentStr || getExcludeKeywords().some((keyword) => contentStr.includes(keyword))) {
        return null;
      }
      
      return {
        time,
        endTime,
        content: contentStr,
        contents,
      };
    })
    .filter((line) => line !== null);
  
  return yrcList;
};

/**
 * 歌词内容对齐
 * @param lyrics 主歌词数组
 * @param otherLyrics 翻译或音译歌词数组
 * @param key 对齐类型
 * @returns 对齐后的歌词数组
 */
export const alignLyrics = (lyrics: any[], otherLyrics: any[], key: "tran" | "roma"): any[] => {
  return alignLyricsUtil(lyrics, otherLyrics, key);
};

/**
 * 处理本地歌词
 * @param lyric 本地歌词文本
 * @returns 处理后的歌词数据
 */
export const parseLocalLyric = (lyric: string): any => {
  if (!lyric) {
    return createEmptySongLyric();
  }
  
  // 解析
  const lrc: LyricLine[] = parseLrc(lyric);
  const lrcData: any[] = parseLrcData(lrc);
  
  // 处理结果
  const lrcDataParsed: any[] = [];
  
  // 翻译提取
  for (let i = 0; i < lrcData.length; i++) {
    // 当前歌词
    const lrcItem = lrcData[i];
    // 是否具有翻译
    const existingObj = lrcDataParsed.find((v) => v.time === lrcItem.time);
    if (existingObj) {
      existingObj.tran = lrcItem.content;
    } else {
      lrcDataParsed.push(lrcItem);
    }
  }
  
  // 转换为AMLL格式
  const lrcAMData = lrcDataParsed.map((line, index, lines) => ({
    words: [{ startTime: line.time * 1000, endTime: (lines[index + 1]?.time || line.time + 5) * 1000, word: line.content }],
    startTime: line.time * 1000,
    endTime: (lines[index + 1]?.time || line.time + 5) * 1000,
    translatedLyric: line.tran || "",
    romanLyric: line.roma || "",
    isBG: false,
    isDuet: false,
  }));
  
  return {
    lrcData: lrcDataParsed,
    lrcAMData,
    yrcData: [],
    yrcAMData: [],
  };
};

/**
 * 解析歌词数据
 * @param lyricData API返回的歌词数据
 * @returns 处理后的歌词数据
 */
export const parseLyricsData = (lyricData: any): any => {
  if (!lyricData || lyricData.code !== 200) {
    return createEmptySongLyric();
  }
  
  let lrcData: any[] = [];
  let yrcData: any[] = [];
  
  // 处理后歌词
  let lrcParseData: LyricLine[] = [];
  let tlyricParseData: LyricLine[] = [];
  let romalrcParseData: LyricLine[] = [];
  let yrcParseData: LyricLine[] = [];
  let ytlrcParseData: LyricLine[] = [];
  let yromalrcParseData: LyricLine[] = [];
  
  // 普通歌词
  if (lyricData?.lrc?.lyric) {
    lrcParseData = parseLrc(lyricData.lrc.lyric);
    lrcData = parseLrcData(lrcParseData);
    
    // 其他翻译
    if (lyricData?.tlyric?.lyric) {
      tlyricParseData = parseLrc(lyricData.tlyric.lyric);
      lrcData = alignLyrics(lrcData, parseLrcData(tlyricParseData), "tran");
    }
    
    if (lyricData?.romalrc?.lyric) {
      romalrcParseData = parseLrc(lyricData.romalrc.lyric);
      lrcData = alignLyrics(lrcData, parseLrcData(romalrcParseData), "roma");
    }
  }
  
  // 逐字歌词
  if (lyricData?.yrc?.lyric) {
    yrcParseData = parseYrc(lyricData.yrc.lyric);
    yrcData = parseYrcData(yrcParseData);
    
    // 其他翻译
    if (lyricData?.ytlrc?.lyric) {
      ytlrcParseData = parseLrc(lyricData.ytlrc.lyric);
      yrcData = alignLyrics(yrcData, parseLrcData(ytlrcParseData), "tran");
    }
    
    if (lyricData?.yromalrc?.lyric) {
      yromalrcParseData = parseLrc(lyricData.yromalrc.lyric);
      yrcData = alignLyrics(yrcData, parseLrcData(yromalrcParseData), "roma");
    }
  }
  
  return {
    lrcData,
    yrcData,
    lrcAMData: parseAMData(lrcParseData, tlyricParseData, romalrcParseData),
    yrcAMData: parseAMData(yrcParseData, ytlrcParseData, yromalrcParseData),
  };
};

/**
 * 处理 AM 歌词
 * @param lrcData 主歌词数据
 * @param tranData 翻译歌词数据
 * @param romaData 音译歌词数据
 * @returns AMLL格式的歌词数据
 */
const parseAMData = (lrcData: LyricLine[], tranData?: LyricLine[], romaData?: LyricLine[]): AMLLLyricLine[] => {
  if (!lrcData || !lrcData.length) return [];
  
  return lrcData.map((line, index, lines) => ({
    words: line.words || [],
    startTime: line.words?.[0]?.startTime ?? 0,
    endTime:
      lines[index + 1]?.words?.[0]?.startTime ??
      line.words?.[line.words.length - 1]?.endTime ??
      Infinity,
    translatedLyric: tranData?.[index]?.words?.[0]?.word ?? "",
    romanLyric: romaData?.[index]?.words?.[0]?.word ?? "",
    isBG: line.isBG ?? false,
    isDuet: line.isDuet ?? false,
  }));
};