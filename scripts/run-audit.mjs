/**
 * 审计运行器。把 scripts/audit.ts 编成 CommonJS 丢到临时目录再跑，
 * 理由同 run-check.mjs：不受项目 "type": "module" 影响，也不留编译产物。
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const outDir = mkdtempSync(join(tmpdir(), 'life-sim-audit-'));

try {
  execFileSync(
    'tsc',
    [
      '--ignoreConfig',
      'scripts/audit.ts',
      '--outDir',
      outDir,
      '--module',
      'commonjs',
      '--target',
      'es2022',
      '--skipLibCheck',
      '--types',
      'node',
    ],
    { stdio: 'inherit' },
  );

  execFileSync(process.execPath, [join(outDir, 'scripts', 'audit.js')], { stdio: 'inherit' });
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
