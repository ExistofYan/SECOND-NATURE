// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {expect,it,vi,afterEach} from 'vitest';
import {createApp} from 'vue';
import {artPath,prepareArt} from '../src/services/storyAssetService';
import {scenes} from '../src/data/story/scenes';
import {createSession,commitChoice,openVisit} from '../src/domain/story/sceneEngine';
import ComicScene from '../src/components/story/ComicScene.vue';
afterEach(()=>vi.unstubAllGlobals());
it('ships distinct, full-size images for every scene, the cover and each travel mode',()=>{
 const manifest=JSON.parse(readFileSync('public/art/narrative-manifest.json','utf8')) as Array<{sceneId:string;path:string}>;
 expect(manifest).toHaveLength(21);const hashes=new Set();
 for(const entry of manifest){
  const bytes=readFileSync('public/'+entry.path);
  expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBeGreaterThan(600);expect(bytes.readUInt32BE(20)).toBeGreaterThan(350);
  hashes.add(createHash('sha256').update(bytes).digest('hex'));
 }
 expect(hashes.size).toBe(21);
 for(const scene of scenes)expect(manifest.some(e=>e.sceneId===scene.id)).toBe(true);
 expect(artPath('cover')).toContain('art/narrative/cover.png');
});
it('preloads the departure overview and all three choice-specific journeys',async()=>{
 const paths:string[]=[];
 vi.stubGlobal('Image',class{onload:(()=>void)|null=null;set src(path:string){paths.push(path);queueMicrotask(()=>this.onload?.());}});
 expect(await prepareArt('S02T')).toBe(true);
 expect(paths).toHaveLength(4);for(const mode of ['bike','bus','car'])expect(paths.some(p=>p.endsWith(`S02T-${mode}.png`))).toBe(true);
});
it('renders the actual bus journey instead of the reused front-door picture',()=>{
 let session=createSession();for(const choice of ['one','all','bus'])session=commitChoice(session,openVisit(session).visitId,choice,{decisionActiveMs:1,decisionWallMs:1,pausedMs:0});
 const root=document.createElement('div');document.body.append(root);
 const app=createApp(ComicScene,{scene:session.modelSnapshot[2],session});app.mount(root);
 expect(root.querySelector('.scene-art')?.getAttribute('src')).toContain('S02T-bus.png');
 app.unmount();root.remove();
});
