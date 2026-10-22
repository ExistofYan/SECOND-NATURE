import {JSDOM,VirtualConsole} from 'jsdom';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('dist/index.html','utf8');
const inline=html.match(/<script type="module" data-game-bundle>([\s\S]*?)<\/script>/);
const file=inline?null:html.match(/src="\.\/(assets\/[^\"]+\.js)"/)[1];
const errors=[];
const vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push(String(e.stack||e)));
vc.on('error',(...args)=>errors.push(args.map(String).join(' ')));
const dom=new JSDOM(html,{url:'https://example.com/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
dom.window.matchMedia=()=>({matches:false});
dom.window.addEventListener('error',e=>errors.push(e.error?.stack||e.message));
try{
 const diagnostics=html.match(/<script data-startup-diagnostics>([\s\S]*?)<\/script>/);
 if(diagnostics)new vm.Script(diagnostics[1]).runInContext(dom.getInternalVMContext());
 const m=new vm.SourceTextModule(inline?inline[1]:readFileSync('dist/'+file,'utf8'),{context:dom.getInternalVMContext(),identifier:'https://example.com/'+(file||'index.html'),initializeImportMeta(meta){meta.url='https://example.com/'+(file||'index.html');}});
 await m.link(()=>{throw new Error('Unexpected external dependency');});
 await m.evaluate();
 await new Promise(r=>setTimeout(r,500));
}catch(e){errors.push(String(e.stack||e));}
console.log(JSON.stringify({errors,appLength:dom.window.document.getElementById('app')?.innerHTML.length,text:dom.window.document.body.textContent?.slice(0,450)},null,2));
dom.window.close();
if(errors.length)process.exitCode=1;
