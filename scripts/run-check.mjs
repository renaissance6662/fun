/**
 * 自检运行器。
 *
 * 把 scripts/simulate.ts 用 tsc 编成 CommonJS 丢到系统临时目录再跑，
 * 这样既不受项目 "type": "module" 的影响，也不会在仓库里留下编译产物。
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const outDir = mkdtempSync(join(tmpdir(), 'life-sim-check-'));

try {
  execFileSync(
    'tsc',
    [
      '--ignoreConfig',
      'scripts/simulate.ts',
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

  execFileSync(process.execPath, [join(outDir, 'scripts', 'simulate.js')], { stdio: 'inherit' });
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
