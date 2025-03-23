import type { LyricLine, LyricsProcessorSettings, SongLyric } from '@/types/amll';

/**
 * 将普通歌词转换为AMLL格式的歌词行
 * @param lrcLines 普通歌词行数组
 * @param settings 设置选项
 * @returns AMLL格式的歌词行数组
 */
export function convertLrcToAMLL(lrcLines: Array<{time: number, content: string, tran?: string, roma?: string}>, 
                                settings: LyricsProcessorSettings): LyricLine[] {
  if (!lrcLines || !lrcLines.length) return [];
  
  return lrcLines.map((line, index) => {
    // 计算结束时间（使用下一行的开始时间，或者当前时间+5秒）
    const endTime = lrcLines[index + 1] ? lrcLines[index + 1].time : line.time + 5;
    
    // 确保时间值为非负数
    const startTimeMs = Math.max(0, line.time) * 1000; // 转换为毫秒
    const endTimeMs = Math.max(0, endTime) * 1000; // 转换为毫秒
    
    // 创建单个词的数组（普通歌词将整行作为一个词）
    const word = {
      word: line.content,
      startTime: startTimeMs,
      endTime: endTimeMs
    };
    
    return {
      startTime: startTimeMs,
      endTime: endTimeMs,
      words: [word],
      translatedLyric: settings.showTransl ? line.tran || '' : '',
      romanLyric: settings.showRoma ? line.roma || '' : '',
      isBG: false,
      isDuet: false
    };
  });
}

/**
 * 将逐字歌词转换为AMLL格式的歌词行
 * @param yrcLines 逐字歌词行数组
 * @param settings 设置选项
 * @returns AMLL格式的歌词行数组
 */
export function convertYrcToAMLL(yrcLines: Array<{time: number, endTime?: number, content: Array<{content: string, time: number, duration: number}> | string, tran?: string, roma?: string}>, 
                                settings: LyricsProcessorSettings): LyricLine[] {
  if (!yrcLines || !yrcLines.length) return [];
  
  return yrcLines.map((line, index) => {
    // 计算结束时间
    const endTime = line.endTime || (yrcLines[index + 1] ? yrcLines[index + 1].time : line.time + 5);
    
    // 确保时间值为非负数
    const startTimeMs = Math.max(0, line.time) * 1000; // 转换为毫秒
    const endTimeMs = Math.max(0, endTime) * 1000; // 转换为毫秒
    
    // 处理逐字歌词的词组
    const words = Array.isArray(line.content) 
      ? line.content.map((word) => {
          const wordStart = Math.max(0, line.time + word.time);
          const wordEnd = Math.max(wordStart + 0.1, line.time + word.time + word.duration); // 确保最小间隔100ms
          return {
            word: word.content,
            startTime: wordStart * 1000,
            endTime: wordEnd * 1000
          };
        })
      : [{
          word: typeof line.content === 'string' ? line.content : '',
          startTime: startTimeMs,
          endTime: endTimeMs
        }];
    
    return {
      startTime: startTimeMs,
      endTime: endTimeMs,
      words,
      translatedLyric: settings.showTransl ? line.tran || '' : '',
      romanLyric: settings.showRoma ? line.roma || '' : '',
      isBG: false,
      isDuet: false
    };
  });
}

/**
 * 创建歌词处理器，根据设置选择合适的歌词类型并转换为AMLL格式
 * @param songLyric 歌词数据
 * @param settings 设置选项
 * @returns AMLL格式的歌词行数组
 */
export function createLyricsProcessor(songLyric: SongLyric, settings: LyricsProcessorSettings): LyricLine[] {
  // 优先使用逐字歌词
  if (settings.showYrc && songLyric.hasYrc && songLyric.yrc?.length) {
    return convertYrcToAMLL(songLyric.yrc, settings);
  }
  
  // 回退到普通歌词
  if (songLyric.lrc?.length) {
    return convertLrcToAMLL(songLyric.lrc, settings);
  }
  
  return [];
}