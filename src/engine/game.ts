import { STAT_KEYS, applyDelta, emptyStats } from './constants';
import { buildEnding } from './ending';
import { ALL_EVENTS, FILLER_EVENTS } from './events';
import { createRng, randomSeed, type Rng } from './rng';
import { ORIGINS, RARITY_WEIGHT, TALENTS } from './talents';
import type {
  GameEvent,
  GameState,
  LifeSnapshot,
  LogEntry,
  Origin,
  Phase,
  StatKey,
  StatsDelta,
  Talent,
} from './types';

export type GameAction =
  | { type: 'begin'; talentId: string }
  | { type: 'resolve'; optionIndex: number }
  | { type: 'restart'; seed?: number };

export interface TextContext {
  age: number;
  originName?: string;
  originDesc?: string;
  talentName?: string;
}

export function renderText(text: string, ctx: TextContext): string {
  return text
    .replaceAll('{origin}', ctx.originName ?? '一个普通的家庭')
    .replaceAll('{originDesc}', ctx.originDesc ?? '')
    .replaceAll('{talent}', ctx.talentName ?? '')
    .replaceAll('{age}', String(ctx.age));
}

function contextOf(state: Pick<GameState, 'age' | 'origin' | 'talent'>): TextContext {
  return {
    age: state.age,
    originName: state.origin?.name,
    originDesc: state.origin?.desc,
    talentName: state.talent?.name,
  };
}

function mergeDelta(...deltas: readonly (StatsDelta | undefined)[]): StatsDelta {
  const merged: StatsDelta = {};
  for (const delta of deltas) {
    if (!delta) continue;
    for (const key of STAT_KEYS) {
      const value = delta[key];
      if (value) merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

function makeSnapshot(state: GameState): LifeSnapshot {
  return {
    age: state.age,
    stats: state.stats,
    flags: state.flags,
    hasFlag: (flag) => state.flags.includes(flag),
  };
}

/**
 * 衰老与自愈。
 *
 * 这里有两股方向相反的力：
 *   - 年轻时身体会自己恢复，所以偶尔熬夜不至于要命；
 *   - 四十岁之后恢复停了，衰老开始按年计息。
 * 事件负责「你做了多少伤身体的事」，这里负责「时间本身的账」。
 * 两者叠加才决定你是寿终，还是提前垮掉。
 */
function agingDelta(age: number, rng: Rng): StatsDelta {
  const delta: StatsDelta = {};
  const add = (key: StatKey, value: number) => {
    if (value === 0) return;
    delta[key] = (delta[key] ?? 0) + value;
  };

  if (age >= 1 && age <= 16) add('physique', 2);
  if (age >= 6 && age <= 18) add('intellect', 1);
  if (age >= 15 && age <= 24) add('charm', 1);

  if (age >= 17 && age <= 44 && rng.chance(55)) add('physique', 1);

  if (age >= 45 && age <= 59 && rng.chance(40)) add('physique', -1);
  if (age >= 60 && age <= 74 && rng.chance(70)) add('physique', -1);
  if (age >= 75) add('physique', -2);

  return delta;
}

const ACCIDENTS: readonly GameEvent[] = [
  {
    id: 'acc-traffic',
    auto: true,
    deathCause: 'accident',
    text: '路口右转的货车，司机正在看导航。',
    options: [
      { label: '继续', text: '很多年前有人跟你说过，明天和意外，不知道哪个先来。你当时觉得这话很俗。', then: 'die' },
    ],
  },
  {
    id: 'acc-sudden',
    auto: true,
    deathCause: 'body',
    text: '那天你起得很早，还顺手把垃圾带下了楼。',
    options: [
      { label: '继续', text: '救护车来的时候，邻居们在楼下小声说话。没有人相信是你。', then: 'die' },
    ],
  },
  {
    id: 'acc-water',
    auto: true,
    deathCause: 'accident',
    text: '水比你以为的凉，也比你以为的深。',
    options: [
      { label: '继续', text: '你想喊，但先呛了一口。剩下的部分很快就安静了。', then: 'die' },
    ],
  },
];

const FINAL_EVENTS: readonly GameEvent[] = [
  {
    id: 'final-age',
    auto: true,
    deathCause: 'age',
    text: '你活到了这一天。',
    options: [
      { label: '继续', text: '没有病痛，也没有预兆。你在一个很普通的下午睡了一会儿，"醒来"这件事没有发生。', then: 'die' },
    ],
  },
  {
    id: 'final-age-b',
    auto: true,
    deathCause: 'age',
    text: '这一年，你不太出门了。',
    options: [
      { label: '继续', text: '你把相册翻了两遍，第二遍的时候认出了几张很久没想起的脸。', then: 'die' },
    ],
  },
];

/** 抽一个事件：按年龄窗口和 cond 过滤，成功用过的就不再出现。 */
function drawEvent(state: GameState, rng: Rng): GameEvent {
  const snapshot = makeSnapshot(state);
  const pool = ALL_EVENTS.filter((event) => {
    if (state.usedEventIds.includes(event.id)) return false;
    if (event.minAge !== undefined && state.age < event.minAge) return false;
    if (event.maxAge !== undefined && state.age > event.maxAge) return false;
    if (event.cond && !event.cond(snapshot)) return false;
    return true;
  });

  if (pool.length === 0) return rng.pick(FILLER_EVENTS);
  return rng.weighted(pool.map((event) => ({ item: event, weight: event.weight ?? 10 })));
}

function advance(state: GameState, rng: Rng): GameState {
  const age = state.age + 1;

  if (age > state.lifespan) {
    const event = rng.pick(FINAL_EVENTS);
    const frame = state.frame + 1;
    return { ...state, age, pending: { event, frame }, frame, rngState: rng.state };
  }

  if (age >= 22 && rng.chance(0.18)) {
    const event = rng.pick(ACCIDENTS);
    const frame = state.frame + 1;
    return { ...state, age, pending: { event, frame }, frame, rngState: rng.state };
  }

  const moved: GameState = { ...state, age };
  const event = drawEvent(moved, rng);
  const frame = state.frame + 1;
  // rngState 必须在这里写回：抽事件也消耗了随机数。
  // 忘了这一句的话，下一回合会从同一个位置重新取数 ——
  // 幼年（1-16 岁）和老年（75 岁后）的衰老结算不掷骰，
  // 一旦选项也没有 risk，整个回合的游标就原地不动，
  // 于是那几年会反复用同一个随机数抽事件，随机性直接退化成固定顺序。
  return { ...moved, pending: { event, frame }, frame, rngState: rng.state };
}

function markUsed(state: GameState, event: GameEvent): string[] {
  if (FILLER_EVENTS.includes(event)) return state.usedEventIds;
  return [...state.usedEventIds, event.id];
}

const DEATH_LINES: Record<string, string> = {
  age: '你的一生到这里结束。',
  body: '身体先走了一步，其他的都跟着停了。',
  accident: '一件很小概率的事，正好落到了你身上。',
  choice: '这条路是你自己选的，你走完了它。',
};

function deathLine(cause: string): string {
  return DEATH_LINES[cause] ?? '一切在这里停下。';
}

function die(state: GameState, cause: string, rng: Rng): GameState {
  const ended: GameState = {
    ...state,
    phase: 'ended',
    pending: null,
    deathCause: cause,
    log: [...state.log, { id: state.turns, age: state.age, kind: 'death', text: deathLine(cause) }],
    turns: state.turns + 1,
    rngState: rng.state,
  };
  return { ...ended, ending: buildEnding(ended, cause, rng) };
}

function resolveOption(state: GameState, optionIndex: number): GameState {
  const pending = state.pending;
  if (!pending) return state;

  const { event } = pending;
  const option = event.options[Math.min(Math.max(optionIndex, 0), event.options.length - 1)];
  if (!option) return state;

  const rng = createRng(state.rngState);

  const aging = agingDelta(state.age, rng);
  const succeeded = typeof option.risk !== 'number' ? true : rng.chance(option.risk);
  const branch = succeeded ? option : (option.fail ?? {});
  const eventDelta = succeeded ? (option.fx ?? {}) : (branch.fx ?? {});
  const merged = mergeDelta(aging, eventDelta);

  const stats = applyDelta(state.stats, merged);
  const flags = [...new Set([...state.flags, ...(succeeded ? (option.flags ?? []) : (branch.flags ?? []))])];

  const outcome = branch.text ?? option.text ?? '这一年过去了。';
  // 时间线只记结果会读不懂，所以把当时的选择也带上，让它像一本流水账。
  const chronicle = event.auto ? outcome : `${option.label}。${outcome}`;

  const entry: LogEntry = {
    id: state.turns,
    age: state.age,
    kind: state.age === 0 ? 'birth' : event.milestone ? 'milestone' : event.auto ? 'event' : 'choice',
    text: renderText(chronicle, contextOf(state)),
    delta: merged,
  };

  const stepped: GameState = {
    ...state,
    stats,
    flags,
    log: [...state.log, entry],
    usedEventIds: markUsed(state, event),
    lastDelta: merged,
    turns: state.turns + 1,
    pending: null,
  };

  if (option.then === 'die') {
    return die(stepped, event.deathCause ?? 'choice', rng);
  }
  if (stats.physique <= 0) {
    return die({ ...stepped, rngState: rng.state }, 'body', rng);
  }

  return advance({ ...stepped, rngState: rng.state }, rng);
}

function rollCandidates(rng: Rng): Talent[] {
  const picked: Talent[] = [];
  const seen = new Set<string>();
  let guard = 0;

  while (picked.length < 3 && guard < 500) {
    guard += 1;
    const talent = rng.weighted(TALENTS.map((item) => ({ item, weight: RARITY_WEIGHT[item.rarity] })));
    if (seen.has(talent.id)) continue;
    seen.add(talent.id);
    picked.push(talent);
  }
  return picked;
}

export function createInitialState(seedInput?: number, phase: Phase = 'start'): GameState {
  const seed = seedInput ?? randomSeed();
  const rng = createRng(seed);
  const origin = rng.pick(ORIGINS);
  const candidates = rollCandidates(rng);

  return {
    phase,
    seed,
    rngState: rng.state,
    age: 0,
    stats: emptyStats(),
    talent: null,
    origin,
    flags: [],
    usedEventIds: [],
    log: [],
    lifespan: 0,
    pending: null,
    deathCause: null,
    ending: null,
    candidates,
    lastDelta: null,
    frame: 0,
    turns: 0,
  };
}

function beginLife(state: GameState, talentId: string): GameState {
  const talent = state.candidates.find((item) => item.id === talentId) ?? state.candidates[0];
  if (!talent) return state;

  const rng = createRng(state.rngState);
  const origin: Origin = state.origin ?? rng.pick(ORIGINS);

  let stats = emptyStats();
  stats = applyDelta(stats, origin.init);
  stats = applyDelta(stats, talent.init);

  const lifespan = Math.max(46, 68 + rng.int(0, 22) + Math.round((stats.physique - 20) / 8));

  const born: GameState = {
    ...state,
    phase: 'playing',
    talent,
    origin,
    stats,
    flags: [...(talent.flags ?? [])],
    lifespan,
    age: 0,
    log: [],
    usedEventIds: [],
    turns: 0,
    frame: 0,
    lastDelta: null,
    rngState: rng.state,
  };

  // 出生那一年不经过 advance()，否则会直接跳到一岁，错过出生这条记录。
  const event = drawEvent(born, rng);
  const frame = born.frame + 1;
  return { ...born, pending: { event, frame }, frame, rngState: rng.state };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'begin':
      return beginLife(state, action.talentId);

    case 'resolve':
      if (state.phase !== 'playing' || !state.pending) return state;
      return resolveOption(state, action.optionIndex);

    case 'restart':
      return createInitialState(action.seed ?? randomSeed());

    default:
      return state;
  }
}

/** 开发期自检：跑一整局，确认引擎不会卡住。 */
export function autoPlay(seed: number, policy: (event: GameEvent) => number = () => 0): GameState {
  let state = createInitialState(seed);
  state = gameReducer(state, { type: 'begin', talentId: state.candidates[0].id });

  let guard = 0;
  while (state.phase === 'playing' && state.pending && guard < 400) {
    guard += 1;
    state = gameReducer(state, { type: 'resolve', optionIndex: policy(state.pending.event) });
  }
  return state;
}
