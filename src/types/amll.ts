/**
 * AMLL (Apple Music-like Lyrics) 相关类型定义
 */

/**
 * 歌词播放器引用类型
 */
export interface LyricPlayerRef {
  setCurrentTime?: (time: number) => void;
  setPlaying?: (playing: boolean) => void;
  lyricPlayer?: { value?: any };
}

/**
 * 歌词单词类型
 */
export interface LyricWord {
  word: string;
  startTime: number;
  endTime: number;
}

/**
 * 歌词行类型
 */
export interface LyricLine {
  startTime: number;
  endTime: number;
  words: LyricWord[];
  translatedLyric?: string;
  romanLyric?: string;
  isBG?: boolean;
  isDuet?: boolean;
}

/**
 * 歌词点击事件类型
 */
export interface LyricClickEvent {
  line: {
    getLine: () => LyricLine;
  };
}

/**
 * 弹簧参数类型
 */
// 在SpringParams接口增加验证

// 使用示例
const springParams = {
  posX: { 
    mass: 1.0, 
    damping: Math.max(0, 10.0), // 确保非负
    stiffness: 100.0,
    soft: false
  }
  // 其他参数...
}

/**
 * 歌词处理器设置类型
 */
export interface LyricsProcessorSettings {
  showYrc: boolean;
  showRoma: boolean;
  showTransl: boolean;
}

/**
 * 歌曲歌词类型
 */
export interface SongLyric {
  lrc?: Array<{time: number, content: string, tran?: string, roma?: string}>;
  yrc?: Array<{time: number, endTime?: number, content: any[], tran?: string, roma?: string}>;
  ttml?: string;
  hasYrc?: boolean;
}