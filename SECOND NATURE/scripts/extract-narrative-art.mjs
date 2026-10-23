// Extract generated storyboard panels into deployable assets; no style filter or recolouring.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const groups=[['cover','S01','S02','S02T-bike'],['S02T-bus','S02T-car','S03','S04'],['S05','S06','S07','S08'],['S09','S10','S11','S12'],['S13','S14','S15','S16']];
const out='public/art/narrative';mkdirSync(out,{recursive:true});
for(let n=1;n<=5;n++)if(!existsSync(`.cache/flat-sheet-${n}.png`))throw Error(`Missing generated artwork sheet ${n}. Use the checked-in public/art/narrative images, or restore the original generated sheet before extracting.`);
const panels=new Map();
groups.forEach((ids,n)=>{
 const sheet=PNG.sync.read(readFileSync(`.cache/flat-sheet-${n+1}.png`));
 const w=Math.floor(sheet.width/2),h=Math.floor(sheet.height/2),inset=8;
 ids.forEach((id,i)=>{
  const panel=new PNG({width:w-inset*2,height:h-inset*2});
  PNG.bitblt(sheet,panel,(i%2)*w+inset,Math.floor(i/2)*h+inset,panel.width,panel.height,0,0);
  writeFileSync(`${out}/${id}.png`,PNG.sync.write(panel));panels.set(id,panel);
 });
});
// The departure question presents all three routes before any has been chosen.
const preview=new PNG({width:1440,height:810});
function pasteScaled(source,x,width){
 const scale=Math.max(width/source.width,810/source.height),sw=width/scale,sh=810/scale;
 const sx=(source.width-sw)/2,sy=(source.height-sh)/2;
 for(let y=0;y<810;y++)for(let dx=0;dx<width;dx++){
  const src=(Math.min(source.height-1,Math.floor(sy+y/scale))*source.width+Math.min(source.width-1,Math.floor(sx+dx/scale)))*4;
  const dst=(y*1440+x+dx)*4;source.data.copy(preview.data,dst,src,src+4);
 }
}
['bike','bus','car'].forEach((mode,i)=>pasteScaled(panels.get(`S02T-${mode}`),i*480,480));
for(const x of [478,479,480,481,958,959,960,961])for(let y=0;y<810;y++){const p=(y*1440+x)*4;preview.data[p]=41;preview.data[p+1]=49;preview.data[p+2]=61;preview.data[p+3]=255;}
writeFileSync(`${out}/S02T.png`,PNG.sync.write(preview));
const manifest=[...groups.flat(),'S02T'].map(id=>({sceneId:id,path:`art/narrative/${id}.png`,version:'1.2.0',style:'Flat 2D hand-drawn narrative-game illustration; muted slate, cream and mustard',source:'Generated with imagegen using the user-supplied visual reference; panel extraction only',weather:id.startsWith('S02T')?'Dry morning, pale sunshine and clouds':undefined}));
writeFileSync('public/art/narrative-manifest.json',JSON.stringify(manifest,null,2));
console.log(`Prepared ${manifest.length} distinct narrative artwork assets.`);
