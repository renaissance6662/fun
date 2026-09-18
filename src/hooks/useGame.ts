import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { gameReducer, renderText } from '../engine/game';
import { clearState, initialState, saveState, writeSeedToUrl } from '../engine/storage';
import type { GameEvent } from '../engine/types';

const AUTO_TICK_MS = 780;
const RESOLVE_COOLDOWN_MS = 220;

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => initialState());
  const [running, setRunning] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    writeSeedToUrl(state.seed);
  }, [state.seed]);

  const currentEvent: GameEvent | null = state.pending?.event ?? null;
  const waitingForChoice = Boolean(currentEvent && !currentEvent.auto);

  const begin = useCallback((talentId: string) => {
    dispatch({ type: 'begin', talentId });
  }, []);

  /**
   * 两次结算之间的最小间隔。
   *
   * 没有这道闸门的话，一次双击会连着结算两个回合：
   * 第二次点击落在重新渲染后的新事件上，多数时候正好压在第 1 个选项的位置，
   * 于是玩家会「在选择还没看清的时候已经被替自己做了一次决定」。
   */
  const lastResolveAt = useRef(0);
  const resolve = useCallback((optionIndex: number) => {
    const now = Date.now();
    if (now - lastResolveAt.current < RESOLVE_COOLDOWN_MS) return;
    lastResolveAt.current = now;
    dispatch({ type: 'resolve', optionIndex });
  }, []);

  const restart = useCallback((seed?: number) => {
    clearState();
    lastResolveAt.current = 0;
    setRunning(false);
    dispatch({ type: 'restart', seed });
  }, []);

  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;

  /** 自动播放：只在纯叙述的年份推进，遇到需要选择的年份自动停下。 */
  useEffect(() => {
    if (!running || state.phase !== 'playing' || !currentEvent) return;
    if (!currentEvent.auto) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => resolveRef.current(0), AUTO_TICK_MS);
    return () => window.clearTimeout(timer);
  }, [running, state.phase, state.frame, currentEvent]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (state.phase === 'start') return;

      const key = event.key.toLowerCase();
      if (key === 'r') {
        restart();
        return;
      }
      if (key === ' ' || key === 'enter') {
        // 自动播放时按钮是禁用的，键盘也要一致，否则会和定时器抢同一个回合
        if (currentEvent?.auto && !running) {
          event.preventDefault();
          resolveRef.current(0);
        }
        return;
      }
      const index = Number.parseInt(key, 10);
      if (Number.isFinite(index) && currentEvent && !currentEvent.auto && index >= 1 && index <= currentEvent.options.length) {
        event.preventDefault();
        resolveRef.current(index - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentEvent, restart, running, state.phase]);

  const context = {
    age: state.age,
    originName: state.origin?.name,
    originDesc: state.origin?.desc,
    talentName: state.talent?.name,
  };

  return {
    state,
    currentEvent,
    waitingForChoice,
    running,
    setRunning,
    begin,
    resolve,
    restart,
    render: (text: string) => renderText(text, context),
  };
}

export type Game = ReturnType<typeof useGame>;
