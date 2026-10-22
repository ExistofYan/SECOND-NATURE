import { describe, expect, it } from 'vitest';
import { availableChoices, commitChoice, createSession, openVisit } from '../src/domain/story/sceneEngine';
import { analyze } from '../src/domain/story/storyAnalysis';
import { arrivalText, choiceReview, storyTextFor, travelSummary } from '../src/domain/story/storyNarrative';
import { storyFiles, timingChart } from '../src/services/storyExportService';
import type { Session } from '../src/domain/story/types';

const timing = { decisionActiveMs: 1000, decisionWallMs: 1000, pausedMs: 0 };
function step(s: Session, choice: string) { return commitChoice(s, openVisit(s).visitId, choice, timing); }
function route(choices: string[]) { return choices.reduce(step, createSession()); }
const low = ['one', 'all', 'bike', 'own', 'refill', 'digital', 'own', 'one', 'message', 'plate', 'one', 'loose', 'own', 'cook', 'save', 'repair', 'keep'];
const high = ['extra', 'none', 'car', 'takeaway', 'buy', 'single', 'disposable', 'large', 'flyers', 'bagged', 'three', 'tray', 'plastic', 'order', 'discard', 'discard', 'mixed'];

describe('connected story and useful review', () => {
  it('links all three journeys to arrival without turning exhaust into rubbish', () => {
    for (const mode of ['bike', 'bus', 'car']) {
      const s = route(['one', 'none', mode]);
      expect(arrivalText(s, s.modelSnapshot[s.nextSceneIndex])).toContain({bike: 'bicycle', bus: 'bus', car: 'parent'}[mode]);
      expect(travelSummary(s)?.mode).toBe(mode);
      const later = route([...low.slice(0,2), mode, ...low.slice(3,10)]);
      expect(storyTextFor(later,later.modelSnapshot[later.nextSceneIndex])).toContain(mode==='bike'?'collect your bicycle':'take the bus home');
      const dinner = route([...low.slice(0,2),mode,...low.slice(3,13)]);
      expect(storyTextFor(dinner,dinner.modelSnapshot[dinner.nextSceneIndex])).toContain(mode==='bike'?'ride your bicycle home':'bus stop');
      expect(analyze(s).newSingleUse).toBe(0);
      expect(analyze(s).nonFoodWaste).toBe(0);
      expect(storyFiles(s)['summary.csv']).toContain('travelMode');
      expect(storyFiles(s)['report.md']).toContain('No amount of gas is measured here');
    }
  });

  it('uses actual fruit quantity and dinner source in later scenes', () => {
    for (const choices of [low, high]) {
      let s = route(choices.slice(0, 11));
      expect(storyTextFor(s, s.modelSnapshot[s.nextSceneIndex])).toContain(choices === low ? 'one serving' : 'three servings');
      s = route(choices.slice(0, 14));
      expect(storyTextFor(s, s.modelSnapshot[s.nextSceneIndex])).toContain(choices === low ? 'cooked for two' : 'two takeaway meals');
    }
  });

  it('keeps the exact words seen before tidying, even after items change destination', () => {
    let s = route(high.slice(0, -1));
    const v = openVisit(s);
    expect(v.storyText).toContain('8 paper sheets and 2 new bags');
    const seen = v.storyText!;
    s = commitChoice(s, v.visitId, 'mixed', timing);
    expect(s.visits[s.visits.length-1]?.storyText).toBe(seen);
    expect(storyFiles(s)['choices.csv']).toContain(seen);
  });

  it('reviews every choice and suggests only an option available at that visit', () => {
    const s = route(high);
    const review = choiceReview(s);
    expect(review).toHaveLength(17);
    expect(review.find(r => r.sceneId === 'S03')?.alternativeChoiceId).toBe('inside');
    expect(review.find(r => r.sceneId === 'S06')?.alternativeChoiceId).toBe('tray');
    expect(review.find(r => r.sceneId === 'S12')?.alternativeChoiceId).toBe('hands');
    for (const row of review) {
      if (row.alternativeChoiceId) expect(s.visits.find(v => v.sceneId === row.sceneId)?.availableChoiceIds).toContain(row.alternativeChoiceId);
    }
    const files = storyFiles(s);
    expect(files['report.md']).toContain('A small hole in your shirt');
    expect(files['report.md']).toContain('Tidy up before bed');
    expect(files['choice-review.csv']).toContain('alternativeChoiceId');
    expect(files['choice-review.csv']).toContain('Extra good fruit is food for later, not waste yet.');
    expect(timingChart(s)).toContain('height="654"');
  });

  it('does not invent a choice, suggestion or travel result in a partial day', () => {
    const s = step(createSession(), 'one');
    expect(choiceReview(s)).toHaveLength(1);
    expect(travelSummary(s)).toBeNull();
    expect(choiceReview(s)[0].improvement).toBe(false);
    expect(storyFiles(s)['report.md']).not.toContain('## My journey');
  });

  it('keeps a saved sixteen-scene model playable and reports its own count', () => {
    let s = createSession();
    s.modelVersion = 'comic-day-1.0.0';
    s.modelSnapshot = s.modelSnapshot.filter(scene => scene.id !== 'S02T');
    s.modelSnapshot[0].storyText = 'The saved original story.';
    expect(storyTextFor(s, s.modelSnapshot[0])).toBe('The saved original story.');
    for (const choice of low.filter(c => c !== 'bike')) {
      expect(availableChoices(s).some(c => c.id === choice)).toBe(true);
      s = step(s, choice);
    }
    expect(s.status).toBe('completed');
    expect(analyze(s).totalScenes).toBe(16);
    expect(storyFiles(s)['report.md']).toContain('16/16');
    expect(travelSummary(s)).toBeNull();
  });
});
