import { describe, expect, it, vi, afterEach } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStoryPdf, personalInsights } from '../src/services/storyPdfService';
import { storyFiles } from '../src/services/storyReportData';
import { analyze } from '../src/domain/story/storyAnalysis';
import { createSession, openVisit, markReady, commitChoice } from '../src/domain/story/sceneEngine';
import type { Session } from '../src/domain/story/types';
import { probeSets, ratingQuestions } from '../src/data/story/probes';
const low=['one','all','bike','own','refill','digital','own','one','message','plate','one','loose','own','cook','save','repair','keep'];
const high=['extra','none','car','takeaway','buy','single','disposable','large','flyers','bagged','three','tray','plastic','order','discard','discard','mixed'];
function route(choices:string[]) {
  let s=createSession('research','P01');
  for(const choice of choices){const v=openVisit(s);markReady(s,v);s=commitChoice(s,v.visitId,choice,{decisionActiveMs:1200,decisionWallMs:1500,pausedMs:300});}
  return s;
}
describe('one-file PDF results and raw evidence',()=>{
 afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
 it('round-trips exact raw sessions and re-runs analysis for complete, partial and empty records',()=>{
  const dir=mkdtempSync(join(tmpdir(),'second-nature-pdf-'));
  const samples:{name:string;session:Session}[]=[{name:'low',session:route(low)},{name:'high',session:route(high)},{name:'partial',session:route(['extra'])},{name:'empty',session:createSession()}];
  // Synthetic fixture only: exercise long questionnaire content and pagination.
  samples[1].session.ratings=Object.fromEntries(ratingQuestions.map((q,i)=>[q.key,1+i%5]));
  samples[1].session.probes=[...probeSets.A.map(q=>({phase:'pre',set:'A',questionId:q.id,choiceId:String(q.correct),correct:true})),...probeSets.B.map(q=>({phase:'post',set:'B',questionId:q.id,choiceId:String(q.correct),correct:true}))];
  for(const {name,session}of samples){
   const bytes=buildStoryPdf(session),path=join(dir,`${name}.pdf`),output=join(dir,name);
   writeFileSync(path,bytes);
   const text=new TextDecoder().decode(bytes);
   expect(text).toMatch(/^%PDF-1\.7/);expect(text).toContain('What your choices reflect');expect(text).toContain('Every recorded choice');
   expect(text).not.toContain('long-term behaviour improvement');
   execFileSync('python',['materials/extract_report.py',path,'--output',output]);
   expect(JSON.parse(readFileSync(join(output,'session.json'),'utf8'))).toEqual(session);
   const replay=execFileSync('python',[join(output,'analyze_story.py'),join(output,'session.json')],{encoding:'utf8'});
   expect(JSON.parse(replay)).toEqual(analyze(session));
   // Idempotent extraction is allowed, but a changed research record is protected.
   execFileSync('python',['materials/extract_report.py',path,'--output',output]);
   writeFileSync(join(output,'session.json'),'Do not replace this record');
   expect(()=>execFileSync('python',['materials/extract_report.py',path,'--output',output],{stdio:'pipe'})).toThrow();
   const qa=process.env.SECOND_NATURE_PDF_QA_DIR;
   if(qa){mkdirSync(qa,{recursive:true});writeFileSync(join(qa,`${name}.pdf`),bytes);}
  }
 });
 it('bases personal feedback on the actual path and keeps zero separate from missing',()=>{
  expect(personalInsights(createSession()).observations.join(' ')).toContain('No story choices');
  const a=personalInsights(route(low)),b=personalInsights(route(high));
  expect(a.observations.join(' ')).toContain('No new single-use');
  expect(a.observations.join(' ')).toContain('morning packing');
  expect(b.observations.join(' ')).toContain('3 food serving(s)');
  expect(b.actions[0]).toContain('smaller serving');
  const partial=personalInsights(route(['extra']));
  expect(partial.observations.join(' ')).toContain('partial day');
 });
 it('exports every ordinal response and reproduces per-item statistics without counting replays as participants',()=>{
  const first=route(low),second=route(high),replay=route(low),free=route(low);
  first.ratings=Object.fromEntries(ratingQuestions.map(q=>[q.key,5]));
  second.participantCode='P02';second.ratings={ease:1};
  replay.parentSessionId=first.sessionId;free.kind='play';free.participantCode=null;
  const dir=mkdtempSync(join(tmpdir(),'second-nature-ratings-'));
  const files=storyFiles(first);
  expect(JSON.parse(files['rating-questionnaire.json'])).toEqual(JSON.parse(readFileSync('materials/rating-questionnaire.json','utf8')));
  for(const name of ['rating-questionnaire.json','analyze_story.py'])writeFileSync(join(dir,name),files[name]);
  const paths=[first,second,replay,free].map((s,i)=>{const path=join(dir,`${i}.json`);writeFileSync(path,JSON.stringify(s));return path;});
  const result=spawnSync('python',[join(dir,'analyze_story.py'),...paths],{encoding:'utf8'});
  expect(result.status).toBe(0);expect(result.stdout.split('\n')[0]).toContain('foodPlanningIntention');
  const rows=result.stderr.split(/\r?\n/).filter(line=>line.startsWith('{')).map(line=>JSON.parse(line));
  expect(rows).toHaveLength(16);
  expect(rows.find(r=>r.key==='ease')).toMatchObject({n:2,missing:0,median:3,minimum:1,maximum:5,distribution:{'1':1,'2':0,'3':0,'4':0,'5':1}});
  expect(rows.find(r=>r.key==='fatigue')).toMatchObject({n:1,missing:1,median:5});
  const partial=storyFiles(second)['ratings.csv'];
  expect(partial).toContain('More arm fatigue');expect(partial).toContain('missing');
  const bytes=buildStoryPdf(first),pdfPath=join(dir,'ratings.pdf'),out=join(dir,'extracted');writeFileSync(pdfPath,bytes);
  execFileSync('python',['materials/extract_report.py',pdfPath,'--output',out]);
  expect(readFileSync(join(out,'ratings.csv'),'utf8')).toBe(files['ratings.csv']);
  const text=new TextDecoder().decode(bytes);
  for(const q of ratingQuestions)expect(text).toContain(q.labels[4]);
 });
 it('downloads exactly one PDF and releases the temporary anchor',async()=>{
  const clicks:{download:string;href:string}[]=[],anchors:any[]=[];
  vi.stubGlobal('document',{body:{append:vi.fn()},createElement:()=>{const a={style:{},download:'',href:'',remove:vi.fn(),click(){clicks.push({download:this.download,href:this.href});}};anchors.push(a);return a;}});
  const create=vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:report');
  const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
  vi.useFakeTimers();
  try{
   const {exportStory}=await import('../src/services/storyExportService');
   await exportStory(route(low));
   expect(clicks).toHaveLength(1);expect(clicks[0].download).toMatch(/\.pdf$/);
   expect((create.mock.calls[0][0] as Blob).type).toBe('application/pdf');expect(anchors[0].remove).toHaveBeenCalledOnce();
   vi.advanceTimersByTime(30000);expect(revoke).toHaveBeenCalledWith('blob:report');
  }finally{vi.useRealTimers();}
 });
});
