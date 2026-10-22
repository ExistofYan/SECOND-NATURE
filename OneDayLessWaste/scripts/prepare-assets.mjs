import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';

const require = createRequire(import.meta.url);
const sdk = dirname(require.resolve('@mediapipe/tasks-vision'));
const version = JSON.parse(readFileSync(join(sdk, 'package.json'), 'utf8')).version;
if (version !== '0.10.35') throw new Error(`Expected MediaPipe 0.10.35, found ${version}. Run npm ci.`);
const output = 'public/mediapipe/wasm';
mkdirSync(output, { recursive: true });
for (const name of ['vision_wasm_internal', 'vision_wasm_module_internal', 'vision_wasm_nosimd_internal']) {
  for (const extension of ['js', 'wasm']) {
    copyFileSync(join(sdk, 'wasm', `${name}.${extension}`), `${output}/${name}.${extension}`);
  }
}
for (const asset of ['models/hand_landmarker.task', 'art/cover.svg', ...Array.from({length:16}, (_,i)=>`art/S${String(i+1).padStart(2,'0')}.svg`)]) {
  if (!statSync(`public/${asset}`).size) throw new Error(`Missing or empty public/${asset}`);
}
console.log(`Checked model and 17 illustrations; synchronized local MediaPipe ${version} WASM resources.`);
