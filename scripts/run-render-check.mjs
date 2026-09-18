/**
 * 渲染冒烟测试运行器，做法和 run-check.mjs 一样：
 * 编译到系统临时目录再跑，不在仓库里留下产物。
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const outDir = mkdtempSync(join(tmpdir(), 'life-sim-render-'));

try {
  execFileSync(
    'tsc',
    [
      '--ignoreConfig',
      'scripts/render-check.tsx',
      '--outDir',
      outDir,
      '--module',
      'commonjs',
      '--target',
      'es2022',
      '--jsx',
      'react-jsx',
      '--esModuleInterop',
      '--skipLibCheck',
      '--types',
      'node',
    ],
    { stdio: 'inherit' },
  );

  execFileSync(process.execPath, [join(outDir, 'scripts', 'render-check.js')], {
    stdio: 'inherit',
    // 产物在系统临时目录里，靠 NODE_PATH 才找得到项目里的 react。
    env: { ...process.env, NODE_PATH: join(process.cwd(), 'node_modules') },
  });
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
