// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {gestureTargetAt,resetGestureHitTest} from '../src/services/gestureHitTest';
afterEach(()=>{resetGestureHitTest();document.body.innerHTML='';vi.restoreAllMocks();});
describe('shared gesture target lookup',()=>{
 it('performs one hit test for all buttons in a frame and respects an overlay',()=>{
  const button=document.createElement('button');button.setAttribute('data-pinch-target','');const child=document.createElement('span');button.append(child);document.body.append(button);
  const lookup=vi.fn(()=>child as Element);
  Object.defineProperty(document,'elementFromPoint',{configurable:true,value:lookup});
  expect(gestureTargetAt(20,30,1)).toBe(button);expect(gestureTargetAt(20,30,1)).toBe(button);expect(lookup).toHaveBeenCalledTimes(1);
  const overlay=document.createElement('div');document.body.append(overlay);lookup.mockReturnValue(overlay);
  expect(gestureTargetAt(20,30,2)).toBeNull();expect(lookup).toHaveBeenCalledTimes(2);
 });
});
