/**
 * 内容与运行时审计。
 *
 * simulate.ts 只看「一局能不能跑完、分数合不合理」。
 * 这个脚本看的是另一类问题 —— 那些不会崩溃、只会让游戏悄悄变味的 bug：
 *
 *   1. 事件 id 重复、年龄窗口写反、选项为空、risk 越界
 *   2. cond 里引用了永远不存在的 flag（写了等于没写）
 *   3. 事件给出的 flag 没有中文名（界面上会露出英文）
 *   4. 跑几千局，看哪些事件/标签从来没出现过、哪些几乎不出现
 *   5. 时间线的 LogEntry id 有没有重复（React key 会撞）
 *   6. rngState 有没有在原地停住（停住就意味着下一回合会复用同一个随机数）
 *   7. 同一颗种子是否稳定复现同一段人生（分享链接成立的前提）
 *
 * 运行：node scripts/run-audit.mjs
 */
import { FLAG_LABELS, STAT_KEYS } from '../src/engine/constants';
import { ALL_EVENTS, FILLER_EVENTS } from '../src/engine/events';
import { createInitialState, gameReducer } from '../src/engine/game';
import { TALENTS } from '../src/engine/talents';
import type { GameEvent, GameState } from '../src/engine/types';

const findings: { level: '错误' | '警告'; area: string; text: string }[] = [];
const fail = (area: string, text: string) => findings.push({ level: '错误', area, text });
const warn = (area: string, text: string) => findings.push({ level: '警告', area, text });

const EVENTS: readonly GameEvent[] = [...ALL_EVENTS, ...FILLER_EVENTS];
const FILLER_IDS = new Set(FILLER_EVENTS.map((event) => event.id));
const ALL_FLAGS = new Set<string>([
  ...TALENTS.flatMap((talent) => talent.flags ?? []),
  ...EVENTS.flatMap((event) =>
    event.options.flatMap((option) => [...(option.flags ?? []), ...(option.fail?.flags ?? [])]),
  ),
]);

/* ---------- 1. 结构性检查 ---------- */

const seenIds = new Map<string, number>();
for (const event of EVENTS) seenIds.set(event.id, (seenIds.get(event.id) ?? 0) + 1);
for (const [id, count] of seenIds) {
  if (count > 1) fail('事件', `id「${id}」重复了 ${count} 次，抽选时会互相顶掉`);
}

for (const event of EVENTS) {
  if (event.options.length === 0) fail('事件', `「${event.id}」没有任何选项，玩家会卡死`);
  if (event.minAge !== undefined && event.maxAge !== undefined && event.minAge > event.maxAge) {
    fail('事件', `「${event.id}」的年龄窗口写反了：${event.minAge} > ${event.maxAge}`);
  }
  if (event.weight === undefined) warn('事件', `「${event.id}」没有写 weight，等于用默认权重 10`);
  for (const option of event.options) {
    if (!option.label) fail('选项', `「${event.id}」有一个选项没有 label`);
    if (typeof option.risk === 'number' && (option.risk < 0 || option.risk > 100)) {
      fail('选项', `「${event.id}」的 risk 越界：${option.risk}`);
    }
    if (typeof option.risk === 'number' && !option.fail) {
      warn('选项', `「${event.id}」的「${option.label}」有失败概率却没有失败分支`);
    }
    if (option.then === 'die' && !event.deathCause) {
      warn('事件', `「${event.id}」会致死但没写 deathCause，死因会显示成「自己的选择」`);
    }
  }
  if (event.auto && event.options.length > 1) {
    warn('事件', `「${event.id}」标了 auto（界面上只有一个「继续」按钮）却写了多个选项`);
  }
}

/* ---------- 2. cond 引用的 flag 是否真的存在 ---------- */

for (const event of ALL_EVENTS) {
  if (!event.cond) continue;
  for (const [, flag] of event.cond.toString().matchAll(/['"]([a-z_][a-z_0-9]*)['"]/g)) {
    if (!ALL_FLAGS.has(flag)) {
      fail('条件', `「${event.id}」的 cond 引用了不存在的标签「${flag}」，这个条件永远为假`);
    }
  }
}

/* ---------- 3. flag 有没有中文名 ---------- */

for (const flag of ALL_FLAGS) {
  if (!(flag in FLAG_LABELS)) fail('标签', `标签「${flag}」没有中文名，界面上会直接显示英文`);
}
for (const flag of Object.keys(FLAG_LABELS)) {
  if (!ALL_FLAGS.has(flag)) warn('标签', `FLAG_LABELS 里的「${flag}」没有任何事件会给出，是一行死配置`);
}

/* ---------- 4. 跑几千局 ---------- */

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROUNDS = 3000;

interface Stats {
  hits: Map<string, number>;
  flags: Map<string, number>;
  /** rngState 原地不动的回合，按年龄分桶 */
  stalls: Map<number, number>;
  turns: number;
  /** 连续两年抽到同一个事件（不含兜底事件）的次数 */
  repeats: number;
  maxRepeat: number;
  dupLogIds: number;
  intellectAt18: number[];
}

const stats: Stats = {
  hits: new Map(),
  flags: new Map(),
  stalls: new Map(),
  turns: 0,
  repeats: 0,
  maxRepeat: 0,
  dupLogIds: 0,
  intellectAt18: [],
};

function play(seed: number, record: boolean): GameState {
  const rand = mulberry(seed * 2246822519);
  let state = createInitialState(seed);
  state = gameReducer(state, { type: 'begin', talentId: state.candidates[0].id });

  let lastEventId = '';
  let repeatRun = 1;

  let guard = 0;
  while (state.phase === 'playing' && state.pending && guard < 400) {
    guard += 1;
    const event = state.pending.event;
    const before = state.rngState;
    const index = Math.floor(rand() * event.options.length);
    state = gameReducer(state, { type: 'resolve', optionIndex: index });

    if (!record) continue;

    // 连续抽到同一个事件：兜底事件本来就可以重复，所以只统计主线事件
    if (!FILLER_IDS.has(event.id) && event.id === lastEventId) {
      repeatRun += 1;
      if (repeatRun === 2) stats.repeats += 1;
      stats.maxRepeat = Math.max(stats.maxRepeat, repeatRun);
    } else {
      repeatRun = 1;
    }
    lastEventId = event.id;

    if (!FILLER_IDS.has(event.id)) stats.hits.set(event.id, (stats.hits.get(event.id) ?? 0) + 1);
    if (state.phase === 'playing' && state.pending && state.rngState === before) {
      stats.stalls.set(state.age, (stats.stalls.get(state.age) ?? 0) + 1);
    }
    if (state.age === 18) stats.intellectAt18.push(state.stats.intellect);
    stats.turns += 1;
  }

  if (!record) return state;

  const ids = new Set<number>();
  for (const entry of state.log) {
    if (ids.has(entry.id)) stats.dupLogIds += 1;
    ids.add(entry.id);
  }
  for (const flag of state.flags) stats.flags.set(flag, (stats.flags.get(flag) ?? 0) + 1);
  return state;
}

for (let i = 0; i < ROUNDS; i += 1) play(i * 7919 + 11, true);

// 同一颗种子必须得到同一段人生，否则「把种子发给朋友」这个玩法是假的
let deterministic = true;
for (let i = 0; i < 200; i += 1) {
  const seed = i * 104729 + 7;
  const a = play(seed, false);
  const b = play(seed, false);
  if (JSON.stringify(a.log) !== JSON.stringify(b.log)) deterministic = false;
}

/* ---------- 5. 结论 ---------- */

if (stats.dupLogIds > 0) fail('时间线', `有 ${stats.dupLogIds} 处 LogEntry id 重复，React 列表会串行`);
if (!deterministic) fail('随机数', '同一颗种子跑出了不同的人生，分享链接失效');

const stallTotal = [...stats.stalls.values()].reduce((a, b) => a + b, 0);
if (stallTotal > 0) {
  const ages = [...stats.stalls.keys()].sort((a, b) => a - b);
  const buckets = [
    ['幼年 1-16', ages.filter((age) => age <= 16)],
    ['17-74', ages.filter((age) => age >= 17 && age <= 74)],
    ['老年 75+', ages.filter((age) => age >= 75)],
  ] as const;
  fail(
    '随机数',
    `有 ${stallTotal} 个回合结束时 rngState 原地不动（占 ${((stallTotal / stats.turns) * 100).toFixed(1)}%）。` +
      `这些回合的下一回合会复用同一个随机数。分布：` +
      buckets.map(([name, list]) => `${name} ${list.reduce((sum, age) => sum + (stats.stalls.get(age) ?? 0), 0)}`).join('，'),
  );
}

if (stats.repeats > 0) {
  warn('随机性', `有 ${stats.repeats} 次连续两年抽到同一个主线事件，最长连续 ${stats.maxRepeat} 年`);
}

for (const event of ALL_EVENTS) {
  if (!stats.hits.has(event.id)) warn('事件', `「${event.id}」在 ${ROUNDS} 局里一次都没出现过`);
}

const cold = ALL_EVENTS.map((event) => ({ id: event.id, n: stats.hits.get(event.id) ?? 0 })).sort((a, b) => a.n - b.n);
const intellect = stats.intellectAt18.slice().sort((a, b) => a - b);

console.log(`\n审计范围：${ALL_EVENTS.length} 个主线事件 + ${FILLER_EVENTS.length} 个兜底事件，${ROUNDS} 局`);
console.log(`平均每局 ${(stats.turns / ROUNDS).toFixed(1)} 个回合`);
console.log(`18 岁智力分布：最低 ${intellect[0]}  中位 ${intellect[Math.floor(intellect.length / 2)]}  最高 ${intellect[intellect.length - 1]}`);

console.log('\n每局出现次数最少的事件：');
for (const { id, n } of cold.slice(0, 8)) console.log(`  · ${id}  ${(n / ROUNDS).toFixed(3)} 次/局`);

const rare = [...stats.flags.entries()].filter(([, n]) => n / ROUNDS < 0.03).sort((a, b) => a[1] - b[1]);
console.log(`\n出现率低于 3% 的标签：${rare.length}`);
for (const [flag, n] of rare) console.log(`  · ${FLAG_LABELS[flag] ?? flag}  ${((n / ROUNDS) * 100).toFixed(1)}%`);

if (findings.length === 0) {
  console.log('\n审计通过，没发现问题');
} else {
  console.log(`\n共 ${findings.length} 条：`);
  for (const finding of findings) console.log(`  [${finding.level}] ${finding.area}  ${finding.text}`);
}

void STAT_KEYS;
if (findings.some((finding) => finding.level === '错误')) process.exit(1);
