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
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed.seed !== 'number' || typeof parsed.rngState !== 'number') return null;
    if (parsed.phase !== 'start' && parsed.phase !== 'playing' && parsed.phase !== 'ended') return null;
    return parsed;
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

export function initialState(): GameState {
  const restored = loadState();
  if (restored) return restored;
  return createInitialState(seedFromUrl() ?? undefined);
}
