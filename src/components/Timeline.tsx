import { useEffect, useRef } from 'react';

import { formatDelta } from '../engine/constants';
import type { LogEntry } from '../engine/types';

interface Props {
  log: readonly LogEntry[];
}

const KIND_LABEL: Record<LogEntry['kind'], string> = {
  birth: '出生',
  event: '经历',
  choice: '选择',
  milestone: '节点',
  aging: '年轮',
  death: '终',
};

export function Timeline({ log }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [log.length]);

  return (
    <section className="timeline">
      <div className="timeline-head">
        <span className="timeline-title">人生时间线</span>
        <span className="timeline-count">{log.length} 条</span>
      </div>
      <div className="timeline-body" ref={ref}>
        {log.length === 0 && <p className="timeline-empty">还没有开始。你的人生会一年一条地记在这里。</p>}
        {log.map((entry) => (
          <article className={`log log-${entry.kind}`} key={entry.id}>
            <span className="log-age">{entry.age}</span>
            <div className="log-main">
              <div className="log-meta">
                <span className="log-kind">{KIND_LABEL[entry.kind]}</span>
                {formatDelta(entry.delta) && <span className="log-delta">{formatDelta(entry.delta)}</span>}
              </div>
              <p className="log-text">{entry.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
