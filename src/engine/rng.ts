/**
 * 可复现的伪随机数。
 *
 * 整个游戏只依赖一个 rng 状态（32 位整数），所以同一颗种子 + 同一串选择，
 * 永远得到同一段人生 —— 这是「分享人生」这个玩法能成立的前提。
 */

export interface Rng {
  /** [0, 1) */
  next(): number;
  /** 闭区间整数 */
  int(min: number, max: number): number;
  /** percent 为 0-100 的百分比 */
  chance(percent: number): boolean;
  pick<T>(list: readonly T[]): T;
  /** 按权重抽取，weight 越小越罕见 */
  weighted<T>(list: readonly { item: T; weight: number }[]): T;
  /** 打乱副本，不改原数组 */
  shuffle<T>(list: readonly T[]): T[];
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = (seed >>> 0) || 0x9e3779b9;

  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (percent) => next() * 100 < percent,
    pick: (list) => list[Math.floor(next() * list.length)],
    weighted: (list) => {
      const total = list.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
      if (list.length === 0 || total <= 0) {
        throw new Error('weighted() 需要一个非空且权重为正的候选列表');
      }
      let roll = next() * total;
      for (const entry of list) {
        roll -= Math.max(0, entry.weight);
        if (roll <= 0) return entry.item;
      }
      return list[list.length - 1].item;
    },
    shuffle: (list) => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    get state() {
      return s;
    },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xfffffff) >>> 0;
}
