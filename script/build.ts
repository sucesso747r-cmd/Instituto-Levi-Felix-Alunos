import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 1. Build client with Vite
console.log('Building client...');
execSync('npx vite build', { stdio: 'inherit', cwd: root });

// 2. Build server with esbuild
console.log('Building server...');
await build({
  entryPoints: [path.join(root, 'server/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: path.join(root, 'dist/index.mjs'),
  packages: 'external',
  alias: {
    '@shared': path.join(root, 'shared'),
  },
});

console.log('Build complete!');
