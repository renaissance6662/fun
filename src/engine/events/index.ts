import type { GameEvent } from '../types';
import { CHILDHOOD_EVENTS } from './childhood';
import { COMMON_EVENTS, FILLER_EVENTS } from './common';
import { ELDER_EVENTS } from './elder';
import { MIDDLE_EVENTS } from './middle';
import { PRIME_EVENTS } from './prime';
import { TEEN_EVENTS } from './teen';
import { YOUTH_EVENTS } from './youth';

/** 全部主线事件。抽选时按年龄窗口和 cond 过滤。 */
export const ALL_EVENTS: readonly GameEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...TEEN_EVENTS,
  ...YOUTH_EVENTS,
  ...PRIME_EVENTS,
  ...MIDDLE_EVENTS,
  ...ELDER_EVENTS,
  ...COMMON_EVENTS,
];

export { FILLER_EVENTS };

export const EVENT_INDEX: ReadonlyMap<string, GameEvent> = new Map(
  ALL_EVENTS.map((event) => [event.id, event]),
);
