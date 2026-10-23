const cache=new Map<string,Promise<boolean>>();
export function artPath(sceneId:string){return `${import.meta.env.BASE_URL}art/narrative/${sceneId}.png`;}
function prepareSingleArt(sceneId:string):Promise<boolean>{
  if(!cache.has(sceneId))cache.set(sceneId,new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve(false),5000);img.onload=()=>{clearTimeout(timer);resolve(true)};img.onerror=()=>{clearTimeout(timer);resolve(false)};img.src=artPath(sceneId);}));
  return cache.get(sceneId)!;
}
export function prepareArt(sceneId:string):Promise<boolean>{
  const ids=sceneId==='S02T'?['S02T','S02T-bike','S02T-bus','S02T-car']:[sceneId];
  return Promise.all(ids.map(prepareSingleArt)).then(results=>results.every(Boolean));
}
export function retryArt(sceneId:string){
  for(const id of sceneId==='S02T'?['S02T','S02T-bike','S02T-bus','S02T-car']:[sceneId])cache.delete(id);
  return prepareArt(sceneId);
}
