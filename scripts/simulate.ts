/**
 * 引擎自检。
 *
 * 用几百颗种子把整局跑完，检查：
 *   1. 每一局都能正常结束（不会卡在某个年龄）
 *   2. 属性永远落在 0-100 且不是 NaN
 *   3. 两种打法（瞎选 / 认真选）的结果分布是否合理
 *
 * 「瞎选」应该拿到难看的一生，「认真选」应该明显更好 ——
 * 如果两者结果差不多，说明选择没有意义，那这个游戏就失败了。
 *
 * 运行：node scripts/run-check.mjs
 */
import { STAT_KEYS } from '../src/engine/constants';
import { createInitialState, gameReducer } from '../src/engine/game';
import type { GameEvent, GameState } from '../src/engine/types';

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

function scoreOption(event: GameEvent, index: number): number {
  const option = event.options[index];
  if (!option) return -Infinity;
  const fx = option.fx ?? {};
  const sum = STAT_KEYS.reduce((total, key) => total + (fx[key] ?? 0), 0);
  // 有风险的选择按期望值打折，避免瞎赌
  const weight = typeof option.risk === 'number' ? option.risk / 100 : 1;
  return sum * weight;
}

type Policy = (event: GameEvent, rand: () => number) => number;

const randomPolicy: Policy = (event, rand) => Math.floor(rand() * event.options.length);
const greedyPolicy: Policy = (event) => {
  let best = 0;
  let bestScore = -Infinity;
  event.options.forEach((_option, index) => {
    const value = scoreOption(event, index);
    if (value > bestScore) {
      bestScore = value;
      best = index;
    }
  });
  return best;
};

function play(seed: number, policy: Policy): GameState {
  const rand = mulberry(seed * 2654435761);
  let state = createInitialState(seed);
  const talent = state.candidates[Math.floor(rand() * state.candidates.length)];
  state = gameReducer(state, { type: 'begin', talentId: talent.id });

  let guard = 0;
  while (state.phase === 'playing' && state.pending && guard < 300) {
    guard += 1;
    state = gameReducer(state, { type: 'resolve', optionIndex: policy(state.pending.event, rand) });
  }
  return state;
}

interface Report {
  stuck: number;
  bad: number;
  ages: number[];
  causes: Record<string, number>;
  grades: Record<string, number>;
  scores: number[];
}

function run(policy: Policy, total: number): Report {
  const report: Report = { stuck: 0, bad: 0, ages: [], causes: {}, grades: {}, scores: [] };

  for (let i = 0; i < total; i += 1) {
    const state = play(i * 7919 + 13, policy);
    if (state.phase !== 'ended' || !state.ending) {
      report.stuck += 1;
      continue;
    }
    if (state.log.length === 0) report.bad += 1;

    for (const key of STAT_KEYS) {
      const value = state.stats[key];
      if (!Number.isFinite(value) || value < 0 || value > 100) report.bad += 1;
    }

    report.ages.push(state.age);
    report.scores.push(state.ending.score);
    increment(report.causes, state.deathCause ?? 'unknown');
    increment(report.grades, state.ending.grade);
  }

  report.ages.sort((a, b) => a - b);
  return report;
}

function increment(bucket: Record<string, number>, key: string): void {
  bucket[key] = (bucket[key] ?? 0) + 1;
}

function pct(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(1)}%`;
}

function summarize(label: string, report: Report, total: number): void {
  const mid = report.ages[Math.floor(report.ages.length / 2)];
  const avgAge = report.ages.reduce((sum, value) => sum + value, 0) / (report.ages.length || 1);
  const avgScore = report.scores.reduce((sum, value) => sum + value, 0) / (report.scores.length || 1);

  console.log(`\n【${label}】`);
  console.log(`  卡住 ${report.stuck}  数据异常 ${report.bad}`);
  console.log(`  寿命   最短 ${report.ages[0]}  中位 ${mid}  最长 ${report.ages[report.ages.length - 1]}  平均 ${avgAge.toFixed(1)}`);
  console.log(`  评分   平均 ${avgScore.toFixed(1)}`);
  console.log(`  死因   ${Object.entries(report.causes).sort().map(([k, v]) => `${k} ${pct(v, total)}`).join('  ')}`);
  console.log(`  评级   ${['S', 'A', 'B', 'C', 'D'].map((g) => `${g} ${pct(report.grades[g] ?? 0, total)}`).join('  ')}`);
}

const TOTAL = 800;
const randomReport = run(randomPolicy, TOTAL);
const greedyReport = run(greedyPolicy, TOTAL);

summarize('瞎选', randomReport, TOTAL);
summarize('认真选', greedyReport, TOTAL);

const randomAvg = randomReport.scores.reduce((s, v) => s + v, 0) / TOTAL;
const greedyAvg = greedyReport.scores.reduce((s, v) => s + v, 0) / TOTAL;
console.log(`\n选择的价值：认真选比瞎选平均高 ${(greedyAvg - randomAvg).toFixed(1)} 分`);

const failures: string[] = [];
if (randomReport.stuck > 0 || greedyReport.stuck > 0) failures.push('有对局跑不完');
if (randomReport.bad > 0 || greedyReport.bad > 0) failures.push('出现非法属性值');
if (greedyAvg - randomAvg < 6) failures.push('认真选没什么优势，选择缺乏意义');
if ((greedyReport.grades.A ?? 0) + (greedyReport.grades.S ?? 0) === 0) failures.push('认真选也拿不到 A 或 S');

if (failures.length > 0) {
  console.error(`\n自检未通过：${failures.join('；')}`);
  process.exit(1);
}
console.log('\n自检通过');
