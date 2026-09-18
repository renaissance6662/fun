import { STAT_KEYS, STAT_META, flagLabel, stageOf, toChineseNumeral } from '../engine/constants';
import type { GameState } from '../engine/types';

interface Props {
  state: GameState;
}

export function StatusPanel({ state }: Props) {
  const stage = stageOf(state.age);

  return (
    <aside className="panel">
      <div className="age-block">
        <span className="age-label">年龄</span>
        <div className="age-row">
          <span className="age-value">{state.age}</span>
          <span className="age-cn">{toChineseNumeral(state.age)} 岁</span>
        </div>
        <div className="stage-row">
          <span className="stage-chip">{stage.name}</span>
          <span className="stage-quote">{stage.line}</span>
        </div>
      </div>

      <div className="stat-list">
        {STAT_KEYS.map((key) => {
          const meta = STAT_META[key];
          const value = state.stats[key];
          const delta = state.lastDelta?.[key] ?? 0;
          return (
            <div className="stat" key={key}>
              <div className="stat-head">
                <span className="stat-name">{meta.name}</span>
                <span className="stat-value">
                  {delta !== 0 && (
                    <em key={`${state.frame}-${key}`} className={delta > 0 ? 'delta up' : 'delta down'}>
                      {delta > 0 ? `+${delta}` : delta}
                    </em>
                  )}
                  {value}
                </span>
              </div>
              <div className="stat-track">
                <div className="stat-fill" style={{ width: `${value}%`, background: meta.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="tag-block">
        <div className="tag-row">
          <span className="tag-label">天赋</span>
          <span className="tag tag-accent">{state.talent?.name ?? '尚未确定'}</span>
        </div>
        <div className="tag-row">
          <span className="tag-label">出身</span>
          <span className="tag">{state.origin?.name ?? '尚未确定'}</span>
        </div>
      </div>

      {state.flags.length > 0 && (
        <div className="flag-block">
          <span className="tag-label">人生标签</span>
          <div className="flag-list">
            {state.flags.slice(-9).reverse().map((flag) => (
              <span className="flag" key={flag}>
                {flagLabel(flag)}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
