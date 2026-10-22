import { replayItems } from './sceneEngine';
import type { Session } from './types';
export function analyze(s:Session) {
  const items=replayItems(s), nonFood=items.filter(i=>i.material!=='food'), waste=nonFood.filter(i=>['general','recycling'].includes(i.destination));
  const byType:Record<string,{unit:string; acquired:number; recycling:number; general:number; continued:number}>={};
  for(const i of nonFood){const r=byType[i.type]??={unit:i.unit,acquired:0,recycling:0,general:0,continued:0};if(i.origin==='new'&&i.singleUse)r.acquired++;if(i.destination==='recycling')r.recycling++;if(i.destination==='general')r.general++;if(['retained','repaired','transferred'].includes(i.destination))r.continued++;}
  const food=items.filter(i=>i.material==='food');
  return {completedScenes:s.visits.filter(v=>v.selectedChoiceId).length,totalScenes:s.modelSnapshot.length,newSingleUse:nonFood.filter(i=>i.origin==='new'&&i.singleUse).length,nonFoodWaste:waste.length,recycling:waste.filter(i=>i.destination==='recycling').length,general:waste.filter(i=>i.destination==='general').length,foodWaste:food.filter(i=>i.destination==='food_discard').length,foodSaved:food.filter(i=>i.destination==='saved').length,foodTransferred:food.filter(i=>i.destination==='transferred').length,foodInventory:food.filter(i=>i.destination==='inventory').length,continued:nonFood.filter(i=>['retained','repaired','transferred'].includes(i.destination)),byType,items,help:s.events.filter(e=>e.type==='researcher_help').length};
}
export { choiceReview as reflections } from './storyNarrative';
