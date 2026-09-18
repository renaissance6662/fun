import { useState } from 'react';

import { STAT_KEYS, STAT_META } from '../engine/constants';
import type { Origin, Talent } from '../engine/types';

interface Props {
  origin: Origin | null;
  candidates: readonly Talent[];
  seed: number;
  onBegin: (talentId: string) => void;
  onReroll: () => void;
}

function previewInit(talent: Talent): string {
  return STAT_KEYS.flatMap((key) => {
    const value = talent.init[key];
    if (!value) return [];
    return [`${STAT_META[key].short}${value > 0 ? '+' : ''}${value}`];
  }).join(' ');
}

/** 稀有度用来做 CSS 钩子，所以映射成英文，避免中文选择器踩坑。 */
const RARITY_CLASS: Record<Talent['rarity'], string> = {
  常见: 'common',
  稀有: 'rare',
  传说: 'legend',
};

export function StartScreen({ origin, candidates, seed, onBegin, onReroll }: Props) {
  const [selected, setSelected] = useState<string>(candidates[0]?.id ?? '');

  return (
    <section className="start">
      <header className="start-head">
        <h1 className="start-title">你要出生了</h1>
        <p className="start-sub">出身不由你选，天赋可以挑一个。</p>
      </header>

      <div className="origin-card">
        <span className="start-label">你被生在这样的家里</span>
        <p className="origin-name">{origin?.name ?? '某个普通人家'}</p>
        <p className="origin-desc">{origin?.desc ?? ''}</p>
        <div className="origin-init">
          {origin &&
            STAT_KEYS.flatMap((key) => {
              const value = origin.init[key];
              if (!value) return [];
              return [
                <span className="chip" key={key}>
                  {STAT_META[key].name} {value > 0 ? `+${value}` : value}
                </span>,
              ];
            })}
        </div>
      </div>

      <div className="start-label-row">
        <span className="start-label">选一个天赋</span>
        <span className="start-note">种子 {seed}</span>
      </div>

      <div className="talent-grid">
        {candidates.map((talent) => (
          <button
            type="button"
            key={talent.id}
            className={`talent is-${RARITY_CLASS[talent.rarity]} ${selected === talent.id ? 'is-selected' : ''}`}
            onClick={() => setSelected(talent.id)}
          >
            <div className="talent-top">
              <span className="talent-name">{talent.name}</span>
              <span className="talent-rarity">{talent.rarity}</span>
            </div>
            <p className="talent-desc">{talent.desc}</p>
            <span className="talent-init">{previewInit(talent)}</span>
          </button>
        ))}
      </div>

      <div className="start-actions">
        <button className="btn btn-primary btn-lg" type="button" onClick={() => onBegin(selected)} disabled={!selected}>
          出生
        </button>
        <button className="btn btn-ghost" type="button" onClick={onReroll}>
          换一段人生
        </button>
      </div>
    </section>
  );
}
