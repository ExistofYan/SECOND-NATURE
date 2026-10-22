import {build} from 'esbuild';
import {writeFileSync} from 'node:fs';
const result=await build({entryPoints:['src/services/handTracking.worker.ts'],bundle:true,format:'iife',platform:'browser',target:'es2020',minify:true,write:false,legalComments:'inline'});
writeFileSync('public/mediapipe/hand-tracking-worker.js',result.outputFiles[0].contents);
console.log('Built classic background hand tracker.');
