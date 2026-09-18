import { createInitialState } from './game';
import type { GameState } from './types';

const STORAGE_KEY = 'life-sim/state/v1';
const SEED_KEY = 'seed';

/**
 * 存档只存一份完整状态，包括 rng 游标。
 * 因为整个游戏是确定性的，存下游标就等于存下了「剩下的一生」。
 */
export function saveState(state: GameState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 隐私模式下写不进去，游戏照样能玩
  }
}

export function loadState(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.seed !== 'number' || typeof parsed.rngState !== 'number') return null;
    if (typeof parsed.age !== 'number' || typeof parsed.lifespan !== 'number') return null;
    if (parsed.phase !== 'start' && parsed.phase !== 'playing' && parsed.phase !== 'ended') return null;
    // 界面会直接遍历这几个字段，缺一个就会白屏。
    // 存档格式以后要是变了，宁可当作没有存档重新开一局。
    if (!Array.isArray(parsed.log) || !Array.isArray(parsed.flags)) return null;
    if (!Array.isArray(parsed.usedEventIds) || !Array.isArray(parsed.candidates)) return null;
    if (!parsed.stats || typeof parsed.stats.physique !== 'number') return null;
    // 正在进行的存档必须带一个完整的事件，否则界面会读 undefined.text
    if (parsed.phase === 'playing' && !parsed.pending?.event?.text) return null;
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}

/** 支持 /?seed=12345 复现同一段人生。 */
export function seedFromUrl(): number | null {
  try {
    const raw = new URLSearchParams(window.location.search).get(SEED_KEY);
    if (!raw) return null;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value >>> 0 : null;
  } catch {
    return null;
  }
}

export function writeSeedToUrl(seed: number): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(SEED_KEY, String(seed));
    window.history.replaceState(null, '', url.toString());
  } catch {
    // 忽略
  }
}

/**
 * 恢复正常用存档；但如果地址栏里的种子和存档不是同一颗，就听地址栏的。
 *
 * 这一条是分享能成立的前提：别人点开你的 ?seed= 链接时，
 * 他浏览器里多半还留着上一局 —— 如果先读存档，链接里的种子会被静默丢掉，
 * 紧接着 writeSeedToUrl 还会把地址栏也改成他自己的种子，链接就彻底失效了。
 */
export function initialState(): GameState {
  const restored = loadState();
  const urlSeed = seedFromUrl();

  if (urlSeed !== null && urlSeed !== restored?.seed) return createInitialState(urlSeed);
  if (restored) return restored;
  return createInitialState(urlSeed ?? undefined);
}
