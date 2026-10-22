const cache=new Map<string,Promise<boolean>>();
export function artPath(sceneId:string){return `${import.meta.env.BASE_URL}art/${sceneId}.svg`;}
export function prepareArt(sceneId:string):Promise<boolean>{
  if(!cache.has(sceneId))cache.set(sceneId,new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve(false),5000);img.onload=()=>{clearTimeout(timer);resolve(true)};img.onerror=()=>{clearTimeout(timer);resolve(false)};img.src=artPath(sceneId);}));
  return cache.get(sceneId)!;
}
export function retryArt(sceneId:string){cache.delete(sceneId);return prepareArt(sceneId);}
