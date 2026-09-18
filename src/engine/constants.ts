import type { StatKey, Stats } from './types';

export const STAT_KEYS: readonly StatKey[] = ['intellect', 'physique', 'charm', 'wealth', 'joy'];

export const STAT_META: Record<StatKey, { name: string; short: string; color: string; blurb: string }> = {
  intellect: { name: '智力', short: '智', color: '#2F5D8A', blurb: '决定你能看懂多少东西，也决定高考那天的天气' },
  physique: { name: '体质', short: '体', color: '#3F7D5A', blurb: '归零就是生命的尽头' },
  charm: { name: '魅力', short: '魅', color: '#9B4D86', blurb: '别人愿不愿意为你多花一分钟' },
  wealth: { name: '财富', short: '财', color: '#B0813A', blurb: '买得到选择权，买不到快乐' },
  joy: { name: '快乐', short: '乐', color: '#C2402A', blurb: '唯一一个不会被人看见的指标' },
};

export interface Stage {
  key: string;
  name: string;
  from: number;
  to: number;
  line: string;
}

export const STAGES: readonly Stage[] = [
  { key: 'child', name: '幼年', from: 0, to: 6, line: '世界很大，你很小' },
  { key: 'teen', name: '少年', from: 7, to: 17, line: '被安排，也偷偷反抗' },
  { key: 'youth', name: '青年', from: 18, to: 29, line: '第一次自己决定方向' },
  { key: 'prime', name: '壮年', from: 30, to: 49, line: '所有人都在同时向你要东西' },
  { key: 'middle', name: '中年', from: 50, to: 64, line: '开始送别，也开始被送别' },
  { key: 'elder', name: '老年', from: 65, to: 200, line: '把一生慢慢收进抽屉' },
];

export function stageOf(age: number): Stage {
  return STAGES.find((stage) => age >= stage.from && age <= stage.to) ?? STAGES[STAGES.length - 1];
}

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export function clampStat(value: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, value));
}

export function emptyStats(): Stats {
  return { intellect: 20, physique: 20, charm: 20, wealth: 20, joy: 20 };
}

export function applyDelta(stats: Stats, delta: Readonly<Stats> | Partial<Stats> | undefined): Stats {
  if (!delta) return stats;
  const next = { ...stats };
  for (const key of STAT_KEYS) {
    const change = delta[key];
    if (typeof change === 'number' && change !== 0) {
      next[key] = clampStat(next[key] + change);
    }
  }
  return next;
}

export function totalOf(stats: Stats): number {
  return STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
}

export function isZeroDelta(delta: Partial<Stats> | undefined): boolean {
  if (!delta) return true;
  return STAT_KEYS.every((key) => !delta[key]);
}

const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

/** 把年龄写成汉字，比阿拉伯数字更像在过人生。 */
export function toChineseNumeral(value: number): string {
  if (value < 0) return String(value);
  if (value < 10) return DIGITS[value];
  if (value === 10) return '十';
  if (value < 20) return `十${DIGITS[value % 10]}`;
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${DIGITS[tens]}十${ones ? DIGITS[ones] : ''}`;
  }
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (rest === 0) return `${DIGITS[hundreds]}百`;
  return `${DIGITS[hundreds]}百${toChineseNumeral(rest)}`;
}

/** 属性变化的紧凑写法，用于日志与飘字。 */
export function formatDelta(delta: Partial<Stats> | undefined): string {
  if (!delta) return '';
  const parts: string[] = [];
  for (const key of STAT_KEYS) {
    const change = delta[key];
    if (!change) continue;
    parts.push(`${STAT_META[key].short}${change > 0 ? '+' : ''}${change}`);
  }
  return parts.join(' ');
}

/**
 * 人生标签的中文名。
 * flags 是引擎里的机器标识，这里是给人看的那一层。
 */
export const FLAG_LABELS: Record<string, string> = {
  bookish: '书香门第',
  rich_kid: '从小不缺钱',
  beauty: '长得好看',
  tough: '硬骨头',
  carefree: '没心没肺',
  genius: '记性好',
  rebel: '天生反骨',
  diligent: '肯下功夫',
  blessed: '运气好',
  ordinary: '普普通通',
  bookish_kid: '爱看书',
  money_kid: '很早就认得钱',
  clingy: '粘人',
  bully: '抢过别人的东西',
  observer: '习惯先看再说',
  loves_animals: '喜欢小动物',
  assertive: '会为自己争取',
  'people-pleaser': '被说过懂事',
  grinder: '刷题型选手',
  playful: '爱玩',
  sensitive: '敏感',
  thrifty: '会攒钱',
  loyal: '讲义气',
  principled: '有原则',
  hustler: '会做买卖',
  dreamer: '爱做梦',
  thorny: '记仇',
  just: '见不得不公',
  coward: '后悔过一次',
  brave_heart: '敢开口',
  quiet_heart: '放在心里',
  independent: '很早就独立',
  elite: '名校出身',
  scholar: '做学问的',
  abroad: '在国外待过',
  normal_college: '普通本科',
  repeater: '复读过',
  early_worker: '很早就工作',
  craftsman: '有一门手艺',
  socialite: '很会来事',
  debater: '能说',
  loner: '独来独往',
  bigtech: '进过大厂',
  civil_servant: '端过铁饭碗',
  smallco: '待过小公司',
  wanderer: '走过很多地方',
  direct: '直来直去',
  founder: '创过业',
  steady: '求稳',
  warned: '被吓到过',
  met_partner: '相过亲',
  solo_minded: '一个人过',
  generous: '大方',
  married: '结过婚',
  has_child: '有孩子',
  mortgage: '背着房贷',
  renter: '一直租房',
  promoted: '升过职',
  office_politician: '会做场面',
  health_aware: '重视体检',
  ignored_health: '拖过病',
  sabbatical: '停过一段时间',
  resilient: '抗造',
  caretaker: '照顾过父母',
  hobbyist: '有自己的爱好',
  good_parent: '当过好父母',
  strict_parent: '对孩子很严',
  orphan: '送别过父母',
  chronic: '带着慢性病',
  survivor: '留下来的人',
  mentor: '带过新人',
  mortal: '开始数日子',
  social_elder: '老了以后很热闹',
  retired: '退休了',
  grandparent: '带过孙辈',
  stubborn: '倔',
  reconciled: '和过去和解了',
  content: '知足',
  nostalgic: '念旧',
  lifelong_learner: '一直在学新东西',
  prepared: '把后事安排好了',
  lucky_win: '中过奖',
};

export function flagLabel(flag: string): string {
  return FLAG_LABELS[flag] ?? flag;
}

