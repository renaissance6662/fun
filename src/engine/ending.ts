import { STAT_KEYS, STAT_META, totalOf } from './constants';
import type { Rng } from './rng';
import type { Ending, GameState, LogEntry, StatKey, Stats } from './types';

const GRADE_LADDER: readonly { min: number; grade: string }[] = [
  { min: 80, grade: 'S' },
  { min: 68, grade: 'A' },
  { min: 55, grade: 'B' },
  { min: 40, grade: 'C' },
  { min: -Infinity, grade: 'D' },
];

export function topStat(stats: Stats): StatKey {
  return STAT_KEYS.reduce((best, key) => (stats[key] > stats[best] ? key : best), STAT_KEYS[0]);
}

/** 称号：先看人生标签（你做过什么），再看属性（你最后成了什么样的人）。 */
const TITLE_RULES: readonly { when: (s: GameState, top: StatKey) => boolean; title: string }[] = [
  { when: (s) => s.flags.includes('founder') && s.stats.wealth > 60, title: '时代的弄潮儿' },
  { when: (s) => s.flags.includes('lucky_win'), title: '被命运砸中的人' },
  { when: (s, top) => s.flags.includes('wanderer') && top === 'joy', title: '人间游客' },
  { when: (s) => s.flags.includes('reconciled') || s.flags.includes('content'), title: '与自己和解的人' },
  { when: (s) => s.flags.includes('mentor'), title: '别人的那盏灯' },
  { when: (s) => s.flags.includes('good_parent') && s.flags.includes('has_child'), title: '撑起了一整个家的人' },
  { when: (s, top) => s.flags.includes('repeater') && top === 'intellect', title: '不肯认输的人' },
  { when: (s, top) => s.flags.includes('solo_minded') && top === 'joy', title: '自己把一生过完的人' },
  { when: (s) => s.flags.includes('caretaker'), title: '总把别人放在前面的人' },
  { when: (s) => s.flags.includes('office_politician'), title: '场面上的那一个' },
  { when: (s) => s.flags.includes('early_worker'), title: '很早就自己养活自己的人' },
  { when: (_s, top) => top === 'intellect', title: '想明白了很多事的人' },
  { when: (_s, top) => top === 'physique', title: '身体比命还硬的人' },
  { when: (_s, top) => top === 'charm', title: '走到哪都有人记得的人' },
  { when: (_s, top) => top === 'wealth', title: '把日子过成了一本账的人' },
  { when: (_s, top) => top === 'joy', title: '很少为难自己的一辈子' },
];

const EPITAPHS: Record<StatKey, readonly string[]> = {
  intellect: [
    '他这辈子最得意的事，是想通了一些没什么用的道理。',
    '他读了一辈子的书，最后真正明白的那件事，其实书里早就写过。',
  ],
  physique: [
    '这一身骨头替他扛下了所有他以为扛不住的事。',
    '他很少生病，所以他一直以为时间还有很多。',
  ],
  charm: [
    '认识他的人都说他好，只有他自己知道那有多费力。',
    '他这一生收过很多好感，留下来陪到最后的没有几个。',
  ],
  wealth: [
    '他算了一辈子的账，最后那一笔没人替他算完。',
    '他攒下了很多东西，走的时候一样也带不走。',
  ],
  joy: [
    '他过得不算好，但他自己觉得还行。',
    '别人说他不够努力，他笑了笑没接话。',
  ],
};

const CAUSE_LINES: Record<string, string> = {
  age: '没有病痛，也没有预兆，睡着之后就再没醒过来。',
  body: '身体先一步走到了尽头，没有留下太多可以商量的余地。',
  accident: '一件很平常的意外，把后面的几十年一起带走了。',
  choice: '这是他自己选的那条路，走到头的时候他没有后悔。',
};

function scoreOf(stats: Stats, age: number): number {
  const average = totalOf(stats) / STAT_KEYS.length;
  const longevity = Math.max(0, Math.min(100, ((age - 30) / 60) * 100));
  return Math.round(average * 0.78 + longevity * 0.22);
}

function gradeOf(score: number): string {
  return GRADE_LADDER.find((step) => score >= step.min)?.grade ?? 'D';
}

function magnitude(delta: LogEntry['delta']): number {
  if (!delta) return 0;
  return STAT_KEYS.reduce((sum, key) => sum + Math.abs(delta[key] ?? 0), 0);
}

function pickHighlights(log: readonly LogEntry[], limit: number): LogEntry[] {
  const milestones = log.filter((entry) => entry.kind === 'milestone');
  if (milestones.length >= limit) return milestones.slice(0, limit);

  const fallback = log
    .filter((entry) => entry.kind === 'choice')
    .sort((a, b) => magnitude(b.delta) - magnitude(a.delta));

  const merged = [...milestones];
  for (const entry of fallback) {
    if (merged.length >= limit) break;
    if (!merged.includes(entry)) merged.push(entry);
  }
  return merged;
}

export function buildEnding(state: GameState, cause: string, rng: Rng): Ending {
  const top = topStat(state.stats);
  const score = scoreOf(state.stats, state.age);
  const title = TITLE_RULES.find((rule) => rule.when(state, top))?.title ?? '普普通通的一个人';
  const flavour = rng.pick(EPITAPHS[top]);
  const epitaph = `享年 ${state.age} 岁。${CAUSE_LINES[cause] ?? '一生就这样过去了。'}${flavour}${STAT_META[top].name}，是他身上最明显的那一处。`;

  return {
    cause,
    age: state.age,
    score,
    grade: gradeOf(score),
    title,
    epitaph,
    highlights: pickHighlights(state.log, 5),
    stats: state.stats,
  };
}
