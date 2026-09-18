import { EndingCard } from './components/EndingCard';
import { EventStage } from './components/EventStage';
import { StartScreen } from './components/StartScreen';
import { StatusPanel } from './components/StatusPanel';
import { Timeline } from './components/Timeline';
import { stageOf } from './engine/constants';
import { useGame } from './hooks/useGame';

export default function App() {
  const { state, currentEvent, running, setRunning, begin, resolve, restart, render } = useGame();
  const stage = stageOf(state.age);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">人生</span>
          <span className="brand-name">一局人生</span>
        </div>

        <div className="topbar-meta">
          {state.phase !== 'start' && <span className="meta-chip">{stage.name}</span>}
          <span className="meta-chip mono">种子 {state.seed}</span>
        </div>

        <div className="topbar-actions">
          {state.phase === 'playing' && (
            <button
              className={`btn btn-sm ${running ? 'is-on' : ''}`}
              type="button"
              onClick={() => setRunning((value) => !value)}
            >
              {running ? '暂停' : '自动播放'}
            </button>
          )}
          {state.phase !== 'start' && (
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => restart()}>
              重开
            </button>
          )}
        </div>
      </header>

      {state.phase === 'start' ? (
        <StartScreen
          // key 换一颗种子就重建一次：天赋卡片的选中态是组件内部 state，
          // 不重建的话「换一段人生」之后没有任何一张卡片是选中的，
          // 点「出生」却会用上第一张卡的天赋 —— 界面上看到的和实际生效的对不上。
          key={state.seed}
          origin={state.origin}
          candidates={state.candidates}
          seed={state.seed}
          onBegin={begin}
          onReroll={() => restart()}
        />
      ) : (
        <main className="board">
          <StatusPanel state={state} />
          <div className="board-main">
            {state.phase === 'ended' && state.ending ? (
              <EndingCard
                state={state}
                ending={state.ending}
                onRestart={() => restart()}
                onReplay={() => restart(state.seed)}
              />
            ) : currentEvent ? (
              <EventStage
                event={currentEvent}
                frame={state.frame}
                onResolve={resolve}
                render={render}
                autoRunning={running}
              />
            ) : null}
          </div>
        </main>
      )}

      {state.phase !== 'start' && <Timeline log={state.log} />}

      <footer className="footer">
        <span>键盘：1 / 2 / 3 做选择 · 空格继续 · R 重开</span>
      </footer>
    </div>
  );
}
