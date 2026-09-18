import { STAT_KEYS, STAT_META } from '../engine/constants';
import type { GameEvent, Option } from '../engine/types';

interface Props {
  event: GameEvent;
  frame: number;
  onResolve: (index: number) => void;
  render: (text: string) => string;
  autoRunning: boolean;
}

const CHENG = ['一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

function confidence(risk: number | undefined): string | null {
  if (typeof risk !== 'number') return null;
  const step = Math.max(1, Math.min(9, Math.round(risk / 10)));
  return `${CHENG[step - 1]}成把握`;
}

function effectPreview(option: Option): string {
  const fx = option.fx;
  if (!fx) return '';
  return STAT_KEYS.flatMap((key) => {
    const value = fx[key];
    if (!value) return [];
    return [`${STAT_META[key].short}${value > 0 ? '+' : ''}${value}`];
  }).join(' ');
}

export function EventStage({ event, frame, onResolve, render, autoRunning }: Props) {
  return (
    <section className="stage" key={frame}>
      <div className="stage-head">
        {event.kicker ? <span className="stage-kicker">{event.kicker}</span> : <span className="stage-kicker">这一年</span>}
        {event.milestone && <span className="stage-flag">人生节点</span>}
      </div>

      <p className="stage-text">{render(event.text)}</p>

      {event.auto ? (
        <button className="btn btn-primary" type="button" onClick={() => onResolve(0)} disabled={autoRunning}>
          <span>继续</span>
          <span className="key-hint">空格</span>
        </button>
      ) : (
        <div className="options">
          {event.options.map((option, index) => {
            const odds = confidence(option.risk);
            return (
              <button className="option" type="button" key={option.label} onClick={() => onResolve(index)}>
                <span className="option-key">{index + 1}</span>
                <span className="option-body">
                  <span className="option-label">
                    {render(option.label)}
                    {odds && <em className="option-odds">{odds}</em>}
                  </span>
                  {(option.hint || effectPreview(option)) && (
                    <span className="option-meta">
                      {option.hint}
                      {option.hint && effectPreview(option) ? ' · ' : ''}
                      {effectPreview(option)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
