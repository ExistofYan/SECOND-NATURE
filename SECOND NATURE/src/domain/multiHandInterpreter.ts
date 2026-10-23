import {GestureInterpreter,type FrameSize,type GestureInterpreterConfig,type Landmark} from './gestureInterpreter';
import type {GestureFrame} from '../types/interaction';

export interface DetectedHand {landmarks:Landmark[]; handedness?:string; score?:number}
interface Track {id:number; hand:DetectedHand; lastSeen:number; interpreter:GestureInterpreter; frame:GestureFrame}
const anchor=(hand:DetectedHand)=>hand.landmarks[0]??hand.landmarks[5];
const distance=(a:DetectedHand,b:DetectedHand)=>Math.hypot(anchor(a).x-anchor(b).x,anchor(a).y-anchor(b).y);

/** Separate pinch histories, stable identities and one active pointer for two hands. */
export class MultiHandInterpreter {
  private tracks:Track[]=[];
  private activeId:number|null=null;
  private sequence=0;
  constructor(private readonly config:GestureInterpreterConfig){}
  update(hands:DetectedHand[],timestamp:number,size:FrameSize):GestureFrame {
    const valid=hands.filter(h=>{
      if(h.landmarks.length<=17||!h.landmarks.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))return false;
      const palm=Math.hypot((h.landmarks[5].x-h.landmarks[17].x)*size.width,(h.landmarks[5].y-h.landmarks[17].y)*size.height);
      return Number.isFinite(palm)&&palm>=this.config.minPalmWidthPx;
    }).slice(0,2);
    this.tracks=this.tracks.filter(t=>timestamp-t.lastSeen<=this.config.trackingLossGraceMs||t.id===this.activeId);
    // Solve the tiny assignment globally: detector array order is not identity.
    let best:number[]=[];let bestCost=Infinity;
    const assign=(index:number,used:Set<number>,mapping:number[],cost:number)=>{
      if(index===valid.length){if(cost<bestCost){bestCost=cost;best=mapping;}return;}
      assign(index+1,used,[...mapping,-1],cost+.5);
      this.tracks.forEach((t,j)=>{
        if(used.has(j)||timestamp-t.lastSeen>this.config.trackingLossGraceMs)return;
        const d=distance(t.hand,valid[index]);if(d>.4)return;
        const mismatch=t.hand.handedness&&valid[index].handedness&&t.hand.handedness!==valid[index].handedness? .12:0;
        assign(index+1,new Set([...used,j]),[...mapping,j],cost+d+mismatch);
      });
    };
    assign(0,new Set(),[],0);
    const seen=new Set<number>();
    valid.forEach((hand,i)=>{
      let track=best[i]===-1?undefined:this.tracks[best[i]];
      if(!track){track={id:++this.sequence,hand,lastSeen:timestamp,interpreter:new GestureInterpreter(this.config),frame:{available:false,pinching:false,x:.5,y:.5,events:[]}};this.tracks.push(track);}
      track.hand=hand;track.lastSeen=timestamp;track.frame=track.interpreter.update(hand.landmarks,timestamp,size);seen.add(track.id);
    });
    for(const track of this.tracks)if(!seen.has(track.id))track.frame=track.interpreter.update(null,timestamp,size);
    let active=this.tracks.find(t=>t.id===this.activeId);
    const previousFrame=active?.frame;
    const missing=active&&!seen.has(active.id);
    // A brief dropout must not hand the pointer to an unrelated open/closed hand.
    if(missing&&timestamp-active!.lastSeen<=this.config.trackingLossGraceMs)return active!.frame;
    const grabs=this.tracks.filter(t=>seen.has(t.id)&&t.frame.events.includes('grab'));
    if(!active||missing){
      active=this.tracks.find(t=>seen.has(t.id)&&t.frame.openConfirmed)??this.tracks.find(t=>seen.has(t.id));
      this.activeId=active?.id??null;
      // Switching after a loss requires an open hand, never an already-held pinch.
      if(active){active.interpreter.reset();active.frame=active.interpreter.update(active.hand.landmarks,timestamp,size);}
    }else if(!active.frame.pinching&&grabs.length){
      active=grabs.find(t=>t.id===this.activeId)??grabs[0];this.activeId=active.id;
    }
    // Forward cancellation when the controlling hand disappears. Otherwise a
    // consumer waiting for "lost" can keep a stale pressed/dragging state.
    return active?.frame??{available:false,pinching:false,openConfirmed:false,x:previousFrame?.x??.5,y:previousFrame?.y??.5,events:previousFrame?.events.filter(e=>e==='lost')??[]};
  }
}
