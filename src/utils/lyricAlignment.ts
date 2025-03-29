/**
 * 歌词对齐工具函数
 * 用于处理歌词与翻译、音译的对齐
 */
import type { LyricLine } from '@/types/amll';

/**
 * 将普通歌词与翻译或音译歌词对齐
 * @param lyrics 主歌词数组
 * @param otherLyrics 翻译或音译歌词数组
 * @param key 对齐类型，'tran'表示翻译，'roma'表示音译
 * @returns 对齐后的歌词数组
 */
export function alignLyrics<T extends { time: number, content: string, [key: string]: any }>(lyrics: T[], otherLyrics: T[], key: 'tran' | 'roma'): T[] {
  if (!lyrics.length || !otherLyrics.length) return lyrics;
  
  // 创建副本以避免修改原始数据
  const lyricsData = [...lyrics];
  
  // 遍历主歌词，为每行查找匹配的翻译/音译
  lyricsData.forEach((line) => {
    // 查找时间匹配或接近的翻译/音译行
    const matchedLine = otherLyrics.find(
      (otherLine) => line.time === otherLine.time || Math.abs(line.time - otherLine.time) < 0.6
    );
    
    // 如果找到匹配行，添加翻译/音译内容
    if (matchedLine) {
      line[key] = matchedLine.content;
    }
  });
  
  return lyricsData;
}

/**
 * 处理本地歌词中的翻译行
 * 本地歌词通常使用相同时间戳的两行表示原文和翻译
 * @param lyricLines 解析后的歌词行数组
 * @returns 处理后的歌词数组，包含翻译信息
 */
export function processLocalTranslation<T extends { time: number, content: string, [key: string]: any }>(lyricLines: T[]): T[] {
  if (!lyricLines.length) return [];
  
  const processedLines: T[] = [];
  
  // 遍历所有歌词行
  for (let i = 0; i < lyricLines.length; i++) {
    const currentLine = lyricLines[i];
    
    // 查找是否已存在相同时间的行（可能是翻译）
    const existingLine = processedLines.find(line => line.time === currentLine.time);
    
    if (existingLine) {
      // 如果存在相同时间的行，将当前行视为翻译
      existingLine.tran = currentLine.content;
    } else {
      // 否则添加为新行
      processedLines.push(currentLine);
    }
  }
  
  return processedLines;
}

/**
 * 将TTML格式歌词中的翻译和音译与主歌词对齐
 * @param mainLyrics 主歌词内容
 * @param translationLyrics 翻译歌词内容
 * @param romajiLyrics 音译歌词内容
 * @returns 对齐后的歌词数组
 */
export function alignTTMLLyrics(mainLyrics: LyricLine[], translationLyrics?: LyricLine[], romajiLyrics?: LyricLine[]): LyricLine[] {
  if (!mainLyrics.length) return [];
  
  // 创建副本以避免修改原始数据
  const alignedLyrics = [...mainLyrics];
  
  // 添加翻译
  if (translationLyrics?.length) {
    alignedLyrics.forEach(line => {
      const matchedTrans = translationLyrics.find(
        trans => Math.abs(line.startTime - trans.startTime) < 600 // 600ms容差
      );
      if (matchedTrans) {
        line.translatedLyric = matchedTrans.words[0]?.word || '';
      }
    });
  }
  
  // 添加音译
  if (romajiLyrics?.length) {
    alignedLyrics.forEach(line => {
      const matchedRoma = romajiLyrics.find(
        roma => Math.abs(line.startTime - roma.startTime) < 600 // 600ms容差
      );
      if (matchedRoma) {
        line.romanLyric = matchedRoma.words[0]?.word || '';
      }
    });
  }
  
  return alignedLyrics;
}