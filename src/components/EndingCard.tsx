import { useState } from 'react';

import { STAT_KEYS, STAT_META } from '../engine/constants';
import type { Ending, GameState } from '../engine/types';

interface Props {
  state: GameState;
  ending: Ending;
  onRestart: () => void;
  onReplay: () => void;
}

export function EndingCard({ state, ending, onRestart, onReplay }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?seed=${state.seed}`;
    const summary = `我活到了 ${ending.age} 岁，评价 ${ending.grade}，称号「${ending.title}」。同一颗种子，换你来一次：${url}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="ending">
      <div className="ending-head">
        <div className="seal">
          <span>{ending.grade}</span>
        </div>
        <div className="ending-head-text">
          <span className="ending-label">人生总结</span>
          <h2 className="ending-title">{ending.title}</h2>
          <p className="ending-sub">
            享年 {ending.age} 岁 · 评分 {ending.score} · 死因{ending.cause === 'age' ? '寿终' : ending.cause === 'body' ? '健康崩塌' : ending.cause === 'accident' ? '意外' : '自己的选择'}
          </p>
        </div>
      </div>

      <p className="ending-epitaph">{ending.epitaph}</p>

      <div className="ending-stats">
        {STAT_KEYS.map((key) => (
          <div className="ending-stat" key={key}>
            <span className="ending-stat-label">{STAT_META[key].name}</span>
            <span className="ending-stat-value" style={{ color: STAT_META[key].color }}>
              {ending.stats[key]}
            </span>
          </div>
        ))}
      </div>

      {ending.highlights.length > 0 && (
        <div className="ending-highlights">
          <span className="start-label">这一生里的几个定格</span>
          <ol className="highlight-list">
            {ending.highlights.map((entry) => (
              <li key={entry.id}>
                <span className="highlight-age">{entry.age} 岁</span>
                <span className="highlight-text">{entry.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="ending-actions">
        <button className="btn btn-primary" type="button" onClick={share}>
          {copied ? '已复制' : '复制分享文案'}
        </button>
        <button className="btn" type="button" onClick={onReplay}>
          用同一颗种子再来一次
        </button>
        <button className="btn btn-ghost" type="button" onClick={onRestart}>
          换一段人生
        </button>
      </div>
    </section>
  );
}
