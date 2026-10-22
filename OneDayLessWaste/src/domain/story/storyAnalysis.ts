import { replayItems } from './sceneEngine';
import type { Session } from './types';
export function analyze(s:Session) {
  const items=replayItems(s), nonFood=items.filter(i=>i.material!=='food'), waste=nonFood.filter(i=>['general','recycling'].includes(i.destination));
  const byType:Record<string,{unit:string; acquired:number; recycling:number; general:number; continued:number}>={};
  for(const i of nonFood){const r=byType[i.type]??={unit:i.unit,acquired:0,recycling:0,general:0,continued:0};if(i.origin==='new'&&i.singleUse)r.acquired++;if(i.destination==='recycling')r.recycling++;if(i.destination==='general')r.general++;if(['retained','repaired','transferred'].includes(i.destination))r.continued++;}
  const food=items.filter(i=>i.material==='food');
  return {completedScenes:s.visits.filter(v=>v.selectedChoiceId).length,totalScenes:s.modelSnapshot.length,newSingleUse:nonFood.filter(i=>i.origin==='new'&&i.singleUse).length,nonFoodWaste:waste.length,recycling:waste.filter(i=>i.destination==='recycling').length,general:waste.filter(i=>i.destination==='general').length,foodWaste:food.filter(i=>i.destination==='food_discard').length,foodSaved:food.filter(i=>i.destination==='saved').length,foodTransferred:food.filter(i=>i.destination==='transferred').length,foodInventory:food.filter(i=>i.destination==='inventory').length,continued:nonFood.filter(i=>['retained','repaired','transferred'].includes(i.destination)),byType,items,help:s.events.filter(e=>e.type==='researcher_help').length};
}
export function reflections(s:Session):Array<{sceneId:string;choiceId:string;itemIds:string[];text:string}> {
  const selected=(sceneId:string)=>s.visits.find(v=>v.sceneId===sceneId)?.selectedChoiceId;
  const out:Array<{sceneId:string;choiceId:string;itemIds:string[];text:string}>=[];
  if(selected('S12')==='own')out.push({sceneId:'S12',choiceId:'own',itemIds:['bag'],text:'Packed in the morning → used at checkout. The same folding bag avoided a new shopping bag.'});
  if(selected('S12')==='hands')out.push({sceneId:'S12',choiceId:'hands',itemIds:[],text:'A small purchase → carried by hand. You did not need a new shopping bag, even without packing one.'});
  if(s.items.find(i=>i.itemId==='shopping-bag')?.destination==='retained')out.push({sceneId:'S16',choiceId:'keep',itemIds:['shopping-bag'],text:'A new shopping bag → kept for another use. It still counts as an acquired item, but not as tonight’s discarded bag.'});
  if(selected('S14')) out.push({sceneId:'S14',choiceId:selected('S14')!,itemIds:['dinner-extra'],text:selected('S14')==='save'?'Changed dinner plans → one serving saved for later. Saved food is not counted as already eaten.':selected('S14')==='share'?'Changed dinner plans → a willing friend received the spare serving. This is a completed handover.':'Changed dinner plans → one edible serving discarded. Saving or an agreed handover were available in this scene.'});
  if(selected('S10')==='three')out.push({sceneId:'S10',choiceId:'three',itemIds:['fruit-2','fruit-3'],text:'Bought three → ate one, kept two edible servings. Check your later plans; these are inventory, not food waste.'});
  if(selected('S04')==='fountain')out.push({sceneId:'S04',choiceId:'fountain',itemIds:[],text:'A working fountain → a drink without a new bottle. This option depends on the facilities supplied in this story.'});
  if(selected('S15'))out.push({sceneId:'S15',choiceId:selected('S15')!,itemIds:['shirt'],text:selected('S15')==='repair'?'A small open seam → repaired with an existing sewing kit. Your existing shirt stays in use.':selected('S15')==='exchange'?'A confirmed exchange → the shirt is handed over. Continued use is recorded separately from collection.':'The existing shirt is discarded. Recycling other items does not remove this item from the waste count.'});
  return out.slice(0,3);
}
