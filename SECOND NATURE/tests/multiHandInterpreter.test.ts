import {describe,it,expect} from 'vitest';
import {MultiHandInterpreter,type DetectedHand} from '../src/domain/multiHandInterpreter';
import {GestureInterpreter} from '../src/domain/gestureInterpreter';
import {interactionConfig} from '../src/config/interaction';
const size={width:640,height:480};
function hand(x:number,closed=false,label='Left',aim=x):DetectedHand{
 const l=Array.from({length:21},()=>({x,y:.5}));l[0]={x,y:.7};l[5]={x:x-.09,y:.5};l[17]={x:x+.09,y:.5};
 l[8]={x:aim,y:.3};l[4]={x:aim+(closed?.01:.18),y:.3};
 return {landmarks:l,handedness:label};
}
describe('two hands, one reliable click',()=>{
 it('keeps the same controlling hand when detection order changes',()=>{
  const g=new MultiHandInterpreter(interactionConfig);
  g.update([hand(.25),hand(.75,false,'Right')],0,size);
  const before=g.update([hand(.25),hand(.75,false,'Right')],100,size);
  const after=g.update([hand(.75,false,'Right'),hand(.25)],140,size);
  expect(after.x).toBeCloseTo(before.x);expect(after.events).not.toContain('grab');
 });
 it('emits one grab when both hands pinch together, without repeating while held',()=>{
  const g=new MultiHandInterpreter(interactionConfig);
  g.update([hand(.25),hand(.75,false,'Right')],0,size);g.update([hand(.25),hand(.75,false,'Right')],100,size);
  g.update([hand(.25,true),hand(.75,true,'Right')],160,size);
  expect(g.update([hand(.75,true,'Right'),hand(.25,true)],260,size).events.filter(e=>e==='grab')).toHaveLength(1);
  expect(g.update([hand(.25,true),hand(.75,true,'Right')],400,size).events).not.toContain('grab');
 });
 it('lets the other visible hand make the click when the controlling hand is open',()=>{
  const g=new MultiHandInterpreter(interactionConfig);
  g.update([hand(.25),hand(.75,false,'Right')],0,size);g.update([hand(.25),hand(.75,false,'Right')],100,size);
  g.update([hand(.25),hand(.75,true,'Right')],160,size);
  const result=g.update([hand(.75,true,'Right'),hand(.25)],260,size);
  expect(result.events).toContain('grab');expect(result.x).toBeCloseTo(.25);
 });
 it('does not create a click by switching to a hand that was already pinched during loss',()=>{
  const g=new MultiHandInterpreter(interactionConfig);
  g.update([hand(.25),hand(.75,true,'Right')],0,size);g.update([hand(.25),hand(.75,true,'Right')],100,size);
  g.update([hand(.75,true,'Right')],180,size);
  expect(g.update([hand(.75,true,'Right')],500,size).events).not.toContain('grab');
  expect(g.update([hand(.75,true,'Right')],600,size).events).not.toContain('grab');
  g.update([hand(.75,false,'Right')],700,size);g.update([hand(.75,false,'Right')],800,size);
  g.update([hand(.75,true,'Right')],900,size);expect(g.update([hand(.75,true,'Right')],1000,size).events).toContain('grab');
 });
 it('holds the last open-hand aim while the fingertips move to pinch',()=>{
  const g=new GestureInterpreter(interactionConfig);
  g.update(hand(.5).landmarks,0,size);const open=g.update(hand(.5).landmarks,100,size);
  g.update(hand(.5,true,'Left',.58).landmarks,160,size);
  const click=g.update(hand(.5,true,'Left',.6).landmarks,260,size);
  expect(click.events).toContain('grab');expect(click.x).toBe(open.x);
 });
 it('requires a stable open hand before a first pinch or after a long frame gap',()=>{
  const g=new GestureInterpreter(interactionConfig);
  g.update(hand(.5,true).landmarks,0,size);expect(g.update(hand(.5,true).landmarks,100,size).events).not.toContain('grab');
  g.update(hand(.5).landmarks,200,size);expect(g.update(hand(.5).landmarks,300,size).openConfirmed).toBe(true);
  expect(g.update(hand(.5,true).landmarks,1000,size).events).not.toContain('grab');
  expect(g.update(hand(.5,true).landmarks,1100,size).events).not.toContain('grab');
 });
 it('forwards one loss event when a pinched controlling hand disappears',()=>{
  const g=new MultiHandInterpreter(interactionConfig);
  g.update([hand(.25)],0,size);g.update([hand(.25)],100,size);
  g.update([hand(.25,true)],160,size);expect(g.update([hand(.25,true)],260,size).events).toContain('grab');
  expect(g.update([],300,size).events).not.toContain('lost');
  const lost=g.update([],600,size);
  expect(lost.available).toBe(false);expect(lost.pinching).toBe(false);expect(lost.events).toEqual(['lost']);
  expect(g.update([],700,size).events).toEqual([]);
 });
 it('allows the usable hand to take over when the first hand becomes too small',()=>{
  const g=new MultiHandInterpreter(interactionConfig);
  g.update([hand(.25),hand(.75,false,'Right')],0,size);g.update([hand(.25),hand(.75,false,'Right')],100,size);
  const tiny=hand(.25);tiny.landmarks[5]={x:.249,y:.5};tiny.landmarks[17]={x:.251,y:.5};
  expect(g.update([tiny,hand(.75,false,'Right')],200,size).available).toBe(false);
  const switched=g.update([tiny,hand(.75,false,'Right')],500,size);
  expect(switched.available).toBe(true);expect(switched.events).not.toContain('grab');expect(switched.x).toBeCloseTo(.25);
  expect(g.update([tiny,hand(.75,false,'Right')],600,size).openConfirmed).toBe(true);
  g.update([tiny,hand(.75,true,'Right')],700,size);
  expect(g.update([tiny,hand(.75,true,'Right')],800,size).events).toContain('grab');
 });
});
