export type StatKey = 'intellect' | 'physique' | 'charm' | 'wealth' | 'joy';

export type Stats = Record<StatKey, number>;

export type StatsDelta = Partial<Record<StatKey, number>>;

export type Rarity = '常见' | '稀有' | '传说';

export interface Talent {
  id: string;
  name: string;
  desc: string;
  rarity: Rarity;
  init: StatsDelta;
  flags?: string[];
}

export interface Origin {
  id: string;
  name: string;
  desc: string;
  init: StatsDelta;
}

/** 一个选项。带 risk 时按百分比掷骰，失败走 fail 分支。 */
export interface Option {
  label: string;
  /** 鼠标悬停时的补充说明 */
  hint?: string;
  fx?: StatsDelta;
  /** 追加的人生标签 */
  flags?: string[];
  /** 结算后展示的旁白 */
  text?: string;
  /** 0-100，成功率。缺省表示必定成功 */
  risk?: number;
  fail?: {
    text?: string;
    fx?: StatsDelta;
    flags?: string[];
  };
  /** 'die' 表示这一选择直接终结人生 */
  then?: 'die';
}

export interface GameEvent {
  id: string;
  /** 卡头的小标签，例如「十八岁」 */
  kicker?: string;
  text: string;
  minAge?: number;
  maxAge?: number;
  weight?: number;
  /** 满足条件才会进入抽选池 */
  cond?: (state: LifeSnapshot) => boolean;
  /** 纯叙述事件，玩家只需点「继续」 */
  auto?: boolean;
  /** 标记为人生节点，会出现在结局的高光里 */
  milestone?: boolean;
  /** 当某个选项 then === 'die' 时，用它来归类死因 */
  deathCause?: string;
  options: readonly Option[];
}

/** 事件条件函数能看到的只读快照，避免事件直接改状态。 */
export interface LifeSnapshot {
  age: number;
  stats: Stats;
  flags: readonly string[];
  hasFlag(flag: string): boolean;
}

export type LogKind = 'birth' | 'event' | 'choice' | 'milestone' | 'aging' | 'death';

export interface LogEntry {
  id: number;
  age: number;
  kind: LogKind;
  text: string;
  delta?: StatsDelta;
}

export interface Ending {
  cause: string;
  age: number;
  score: number;
  grade: string;
  title: string;
  epitaph: string;
  highlights: LogEntry[];
  stats: Stats;
}

export type Phase = 'start' | 'playing' | 'ended';

export interface PendingEvent {
  event: GameEvent;
  /** 关键帧 id，用于触发入场动画 */
  frame: number;
}

export interface GameState {
  phase: Phase;
  seed: number;
  rngState: number;
  age: number;
  stats: Stats;
  talent: Talent | null;
  origin: Origin | null;
  flags: string[];
  usedEventIds: string[];
  log: LogEntry[];
  /** 隐藏的寿命上限，玩家看不到 */
  lifespan: number;
  pending: PendingEvent | null;
  deathCause: string | null;
  ending: Ending | null;
  candidates: Talent[];
  /** 最近一次属性变化，用来做飘字 */
  lastDelta: StatsDelta | null;
  frame: number;
  turns: number;
}
