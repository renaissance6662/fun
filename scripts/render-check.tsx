/**
 * 组件渲染冒烟测试。
 *
 * 把五个界面组件在 Node 里真实渲染成 HTML，用来抓住
 * 「类型没问题、但跑起来就炸」的那一类错误。
 *
 * 运行：node scripts/run-render-check.mjs
 */
import { renderToString } from 'react-dom/server';

import { EndingCard } from '../src/components/EndingCard';
import { EventStage } from '../src/components/EventStage';
import { StartScreen } from '../src/components/StartScreen';
import { StatusPanel } from '../src/components/StatusPanel';
import { Timeline } from '../src/components/Timeline';
import { STAT_KEYS } from '../src/engine/constants';
import { createInitialState, gameReducer, renderText } from '../src/engine/game';
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

function best(event: GameEvent): number {
  let index = 0;
  let score = -Infinity;
  event.options.forEach((option, i) => {
    const sum = STAT_KEYS.reduce((total, key) => total + (option.fx?.[key] ?? 0), 0);
    if (sum > score) {
      score = sum;
      index = i;
    }
  });
  return index;
}

function playToEnd(seed: number): GameState {
  const rand = mulberry(seed);
  let state = createInitialState(seed);
  state = gameReducer(state, { type: 'begin', talentId: state.candidates[0].id });
  let guard = 0;
  while (state.phase === 'playing' && state.pending && guard < 300) {
    guard += 1;
    state = gameReducer(state, { type: 'resolve', optionIndex: rand() > 0.5 ? best(state.pending.event) : 0 });
  }
  return state;
}

/** 活到中途停下，用来渲染「正在玩」的界面。 */
function playSome(seed: number, years: number): GameState {
  let state = createInitialState(seed);
  state = gameReducer(state, { type: 'begin', talentId: state.candidates[0].id });
  let guard = 0;
  while (state.phase === 'playing' && state.pending && state.age < years && guard < 300) {
    guard += 1;
    state = gameReducer(state, { type: 'resolve', optionIndex: 0 });
  }
  return state;
}

const checks: { label: string; html: string; expect: string }[] = [];
const noop = () => {};

const fresh = createInitialState(20260918);
const render = (text: string) =>
  renderText(text, { age: fresh.age, originName: fresh.origin?.name, originDesc: fresh.origin?.desc });

checks.push({
  label: 'StartScreen',
  html: renderToString(
    <StartScreen
      origin={fresh.origin}
      candidates={fresh.candidates}
      seed={fresh.seed}
      onBegin={noop}
      onReroll={noop}
    />,
  ),
  expect: '你要出生了',
});

const ended = playToEnd(4242);
const playing = playSome(777, 30);

checks.push({
  label: 'StatusPanel',
  html: renderToString(<StatusPanel state={playing} />),
  expect: '人生标签',
});

if (!playing.pending) throw new Error('中途状态没有待处理事件，测试用例本身有问题');

checks.push({
  label: 'EventStage',
  html: renderToString(
    <EventStage
      event={playing.pending.event}
      frame={playing.frame}
      onResolve={noop}
      render={render}
      autoRunning={false}
    />,
  ),
  expect: 'stage-text',
});

// 自动叙事的事件走另一条分支（只有一个「继续」按钮），单独验一遍
const autoEvent = playing.pending.event.auto
  ? playing.pending.event
  : { ...playing.pending.event, auto: true as const };
checks.push({
  label: 'EventStage（纯叙述）',
  html: renderToString(
    <EventStage event={autoEvent} frame={0} onResolve={noop} render={render} autoRunning={false} />,
  ),
  expect: 'key-hint',
});

checks.push({
  label: 'Timeline',
  html: renderToString(<Timeline log={ended.log} />),
  expect: 'log-text',
});

if (ended.ending) {
  checks.push({
    label: 'EndingCard',
    html: renderToString(
      <EndingCard state={ended} ending={ended.ending} onRestart={noop} onReplay={noop} />,
    ),
    expect: ended.ending.title,
  });
}

let failed = 0;
for (const check of checks) {
  const ok = check.html.length > 0 && check.html.includes(check.expect);
  if (!ok) failed += 1;
  console.log(`${ok ? '通过' : '失败'}  ${check.label}  ${check.html.length} 字符`);
}

console.log(`\n时间线长度 ${ended.log.length}，享年 ${ended.age}，评级 ${ended.ending?.grade}，称号「${ended.ending?.title}」`);
console.log(ended.log.slice(0, 3).map((entry) => `  ${entry.age} 岁 · ${entry.text}`).join('\n'));

if (failed > 0) {
  console.error(`\n${failed} 个组件渲染失败`);
  process.exit(1);
}
console.log('\n渲染冒烟测试通过');
