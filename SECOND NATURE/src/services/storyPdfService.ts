import { analyze, reflections } from '../domain/story/storyAnalysis';
import { selectedChoice, travelSummary } from '../domain/story/storyNarrative';
import type { Session } from '../domain/story/types';
import { ratingQuestions, probeSets } from '../data/story/probes';
import { ReportPdf } from './reportPdf';
import { storyFiles } from './storyReportData';

const seconds = (n: number | null | undefined) => n == null ? 'Not recorded' : `${(n / 1000).toFixed(1)} s`;
const safe = (value: unknown) => value == null || value === '' ? 'Not recorded' : String(value);

/** Data-driven feedback about this playthrough, never a diagnosis or study finding. */
export function personalInsights(s: Session) {
  const a = analyze(s), review = reflections(s);
  const observations: string[] = [], actions: string[] = [];
  if (!a.completedScenes) return { observations: ['No story choices have been submitted. There is not enough recorded activity to analyse a choice pattern.'], actions: ['Complete some scenes, then review the updated report.'] };
  if (a.completedScenes < a.totalScenes) observations.push(`This is a partial day (${a.completedScenes}/${a.totalScenes} scenes). Outcomes from unvisited scenes are unknown, and the totals cannot be compared with a complete day as if exposure were equal.`);
  observations.push(`Across ${a.completedScenes} recorded scenes, you acquired ${a.newSingleUse} new single-use items and discarded ${a.nonFoodWaste} non-food items (including paper sheets). These are different measures: discards can include things you already owned, and a newly acquired item may still be kept.`);
  if (a.foodWaste) {
    observations.push(`${a.foodWaste} food serving(s) ended in disposal. The food-related choices in this playthrough show an opportunity to prevent waste before sorting it.`);
    actions.push('Start with a smaller serving. If a safe spare meal remains, save it or arrange an agreed handover rather than discarding it.');
  } else observations.push(`No food disposal has been recorded${a.completedScenes < a.totalScenes ? ' so far in this partial day' : ' in this day'}. ${a.foodSaved} serving(s) were saved and ${a.foodTransferred} handed over. Food still in inventory is not counted as eaten or wasted.`);
  const disposables = Object.entries(a.byType).filter(([, r]) => r.acquired > 0).sort((x, y) => y[1].acquired - x[1].acquired);
  if (disposables.length) {
    const [type, r] = disposables[0];
    observations.push(`The largest count of new single-use material was ${type}: ${r.acquired} ${r.unit}(s). This describes counts within the game; it does not rank environmental impact across materials.`);
  } else observations.push('No new single-use items have been acquired in the recorded choices. This describes this playthrough, rather than an established real-life habit.');
  if (a.recycling) observations.push(`${a.recycling} non-food item(s) went to recycling collection. Sorting changes the destination, but does not undo acquisition or make the discarded count zero.`);
  if (a.continued.length) observations.push(`${a.continued.length} non-food item(s) remain in use through keeping, repair or confirmed handover. Keeping them tonight does not establish that they will actually be reused.`);
  const packing = selectedChoice(s, 'S02');
  const downstream = review.filter(r => ['S03', 'S04', 'S06', 'S12'].includes(r.sceneId) && ['own', 'refill'].includes(r.choiceId));
  if (packing && downstream.length) observations.push(`Your morning packing choice supported ${downstream.length} later selected option(s): ${downstream.map(r => r.title).join(', ')}. This is a concrete connection between preparation and later choices in the story.`);
  const priority = ['S03', 'S04', 'S06', 'S05', 'S11', 'S12', 'S08', 'S09', 'S15', 'S16', 'S01', 'S07', 'S13', 'S10'];
  for (const id of priority) {
    const r = review.find(r => r.sceneId === id && r.improvement);
    if (r && actions.length < 3) actions.push(`${r.title}: ${r.nextTime}`);
  }
  if (!actions.length) actions.push('Keep the preparation and reuse choices that worked in this story. Pick one you could realistically repeat with the facilities, time and resources available to you.');
  return { observations, actions };
}

export function buildStoryPdf(s: Session, previous: Session | null = null): Uint8Array {
  const pdf = new ReportPdf(), a = analyze(s), review = reflections(s), insights = personalInsights(s);
  pdf.page('Personal results');
  pdf.heading('Your day, understood.', 29);
  pdf.paragraph('A collected record of your choices, their simulated outcomes and practical next steps.', 11);
  pdf.table(['Session detail', 'Recorded value'], [
    ['Participant / mode', `${s.participantCode ?? 'Free play'} / ${s.kind}${s.parentSessionId ? ' / replay' : ''}`],
    ['Progress / status', `${a.completedScenes} of ${a.totalScenes} scenes / ${s.status}`],
    ['Started / ended (ISO time)', `${s.startedAt} / ${s.endedAt ?? 'Not ended'}`],
    ['Story / app / schema', `${s.modelVersion} / ${s.appVersion} / ${s.schemaVersion}`],
    ['Session ID', s.sessionId],
  ], [160, pdf.contentWidth - 160], 'Session details', true);
  const top = pdf.y, gap = 10, cardWidth = (pdf.contentWidth - 2 * gap) / 3;
  [[a.newSingleUse, 'New single-use', 'items incl. sheets'], [a.nonFoodWaste, 'Non-food discarded', 'items incl. sheets'], [a.foodWaste, 'Food discarded', 'game servings']].forEach(([n, label, unit], i) => {
    const x = pdf.margin + i * (cardWidth + gap);
    pdf.rect(x, top, cardWidth, 91, '0.93 0.96 0.94');
    pdf.text(n, x + 12, top + 9, 28, true, '0.17 0.36 0.29');
    pdf.text(label, x + 12, top + 49, 9, true);
    pdf.text(unit, x + 12, top + 66, 8);
  });
  pdf.y += 111;
  pdf.heading('Where the material went');
  pdf.table(['Material / unit', 'New', 'Recycling', 'General', 'Kept in use'], Object.entries(a.byType).map(([type, r]) =>
    [`${type} / ${r.unit}`, String(r.acquired), String(r.recycling), String(r.general), String(r.continued)]), [187, 55, 78, 65, pdf.contentWidth - 385], 'Material destinations', true);
  pdf.paragraph(`Food, in servings: ${a.foodSaved} saved; ${a.foodTransferred} confirmed handover; ${a.foodInventory} edible inventory. Food is separate from the non-food counts.`, 10);
  pdf.paragraph('These are simulated game quantities, not measured waste mass, emissions or a sustainability score. Recycling is still collection of discarded material. Pending items in an unfinished day are not assumed to be discarded.', 9, '0.4 0.44 0.42');

  pdf.page('Personal interpretation');
  pdf.heading('What your choices reflect');
  pdf.paragraph('The following interpretation is generated from the recorded actions and item ledger. It describes this session, not your character, intentions or everyday behaviour.', 10);
  insights.observations.forEach((text, i) => { pdf.heading(`${i + 1}. Recorded pattern`, 12); pdf.paragraph(text); });
  pdf.heading('Practical next steps');
  insights.actions.forEach((text, i) => pdf.paragraph(`${i + 1}. ${text}`));
  const travel = travelSummary(s);
  if (travel) { pdf.heading('Your journey, separately'); pdf.paragraph(`${travel.label}. ${travel.text} ${travel.note}`); }
  if (previous) {
    const b = analyze(previous);
    pdf.heading('A previous day');
    if (previous.modelVersion !== s.modelVersion || b.completedScenes !== b.totalScenes || a.completedScenes !== a.totalScenes || previous.participantCode !== s.participantCode || s.parentSessionId !== previous.sessionId) {
      pdf.paragraph('These records differ in version, completion, participant code or replay linkage. They are shown descriptively and are not a matched before/after comparison.');
    }
    pdf.table(['Measure / same unit', 'Previous', 'This day'], [
      ['New single-use / incl. sheets', String(b.newSingleUse), String(a.newSingleUse)],
      ['Non-food discarded / incl. sheets', String(b.nonFoodWaste), String(a.nonFoodWaste)],
      ['Food discarded / servings', String(b.foodWaste), String(a.foodWaste)],
    ], [pdf.contentWidth - 160, 80, 80], 'Two recorded days');
    pdf.paragraph('A changed total across two playthroughs cannot establish learning or lasting behaviour change.', 9);
  }

  pdf.page('Choice record and analysis');
  pdf.heading('Every recorded choice');
  pdf.paragraph('Alternatives below were available during that visit. Recommendations refer to the story circumstances; real-life facilities and needs may differ.');
  for (const r of review) {
    const v = s.visits.find(v => v.sceneId === r.sceneId)!;
    const blocks = [`You chose: ${r.label}`, `Outcome: ${r.text}`, `Meaning: ${r.lesson}`, r.improvement ? `Try next time: ${r.nextTime}` : 'Next step: Consider whether this choice is feasible in your everyday setting.'];
    const height = 40 + blocks.reduce((sum, text) => sum + pdf.lines(text).length * 14.8 + 8, 0) + 25;
    pdf.ensure(height, 'Choice record / continued');
    pdf.heading(`${r.sceneId} / ${r.title}`, 13);
    blocks.forEach(text => pdf.paragraph(text));
    pdf.paragraph(`Active decision: ${seconds(v.decisionActiveMs)}. Paused: ${seconds(v.pausedMs)}.${v.timingInterrupted ? ' Resumed visit; timing may span separate segments.' : ''}${v.timingMissing ? ' Timing incomplete after interruption; do not treat as a complete duration.' : ''}`, 8, '0.4 0.44 0.42');
    pdf.y += 7;
  }
  if (!review.length) pdf.paragraph('No choices submitted. Unreached scenes remain unobserved.');

  pdf.page('Research responses');
  pdf.heading('What you actually reported');
  pdf.paragraph('Only submitted responses appear as data. Missing values stay missing; no interview statements or researcher observations are inferred.');
  pdf.table(['Experience rating', 'Response', 'Scale: 1 to 5'], ratingQuestions.map(r => [r.title, safe(s.ratings[r.key]), `${r.low} to ${r.high}`]), [248, 65, pdf.contentWidth - 313], 'Experience responses');
  pdf.paragraph('These four custom single-item ratings are not a SUS questionnaire or a validated combined score.', 9);
  if (s.probes.length) {
    pdf.heading('Knowledge-check responses');
    const all = [...probeSets.A, ...probeSets.B];
    s.probes.forEach(p => {
      const question = all.find(q => q.id === p.questionId);
      pdf.ensure(95, 'Knowledge responses / continued');
      pdf.heading(`${p.phase.toUpperCase()} / ${p.questionId}`, 11);
      pdf.paragraph(question?.text ?? 'Question wording unavailable in this report version.');
      pdf.paragraph(`Selected: ${question?.answers[Number(p.choiceId)] ?? safe(p.choiceId)} Recorded correctness: ${p.correct ? 'correct' : 'incorrect'}.`, 9);
    });
    pdf.paragraph('Before/after forms use different items and have not been established as equivalent. These responses alone cannot prove a learning effect.', 9);
  } else pdf.paragraph('No knowledge-check answers were collected in this session.');
  const measured = s.visits.filter(v => v.selectedChoiceId && !v.timingMissing && v.decisionActiveMs != null).map(v => v.decisionActiveMs!).sort((a, b) => a - b);
  if (measured.length) {
    const median = measured.length % 2 ? measured[Math.floor(measured.length / 2)] : (measured[measured.length / 2 - 1] + measured[measured.length / 2]) / 2;
    pdf.heading('Interaction context');
    pdf.paragraph(`${measured.length} submitted scene(s) have usable active-decision durations. Median: ${seconds(median)}; range: ${seconds(measured[0])} to ${seconds(measured[measured.length - 1])}. Recorded researcher-help events: ${a.help}.`);
    pdf.paragraph('Decision duration includes reading and thinking and is not a direct measure of gesture latency, confusion or failed attempts. Missing-timing visits are excluded. Help is the number of explicitly logged help events, not all help that might have occurred.', 9);
  }

  pdf.page('Collected item ledger');
  pdf.heading('The items behind your results');
  pdf.table(['Item / source', 'Origin / unit', 'Destination'], a.items.map(i => [`${i.label} (${i.itemId}) / ${i.sourceScene}`, `${i.origin} / ${i.unit}`, i.destination.replace(/_/g, ' ')]), [277, 100, pdf.contentWidth - 377], 'Item ledger / continued');

  pdf.page('Original data and interpretation limits');
  pdf.heading('Your collected record');
  pdf.paragraph(`This PDF includes ${s.events.length} original timestamped events, ${s.visits.length} scene visit(s), ${s.probes.length} knowledge response(s) and the original session/model snapshot as embedded file attachments. The attachment contents preserve UTF-8 data without rewriting it.`);
  pdf.paragraph('Read this report in any PDF viewer. For the raw files, use a viewer that exposes PDF attachments, or run the supplied project script:');
  pdf.paragraph('python materials/extract_report.py report.pdf --output materials/P01', 9);
  pdf.paragraph('Place the extracted raw data and analysis script in your coursework materials folder. The extracted HOW_TO_ANALYSE.txt explains replaying the data. The PDF is an individual result report, rather than the final research submission.');
  pdf.heading('What this report supports');
  pdf.paragraph('It supports checking what was selected, what item outcomes the prototype produced, and what responses were actually submitted. It does not establish real-world waste reduction, long-term behaviour change, causal learning, gesture superiority over another input method, or the reasons behind a participant choice.');
  pdf.paragraph('Research findings require your interpretation of genuine participant evidence. Any separately collected observation notes, interview recordings, transcripts and consent records must be preserved separately. Free play and replay sessions must not be presented as additional independent participants.');
  const files = storyFiles(s, previous);
  const attachments = Object.fromEntries(Object.entries(files).filter(([name]) => /\.(json|csv|py)$/.test(name)));
  attachments['HOW_TO_ANALYSE.txt'] = 'SECOND NATURE - ORIGINAL SESSION DATA\n\nRun: python analyze_story.py session.json\nSeveral JSON paths produce a participant table. Preserve original files and timestamps.\nKeep free play and replays separate from primary study sessions.\nRatings are custom single items, not SUS. Missing data is not zero.\nNo interviews, researcher observations, quotations or findings were invented.\n';
  pdf.heading('Embedded files');
  Object.keys(attachments).sort().forEach(name => pdf.paragraph(name, 9));
  return pdf.save(attachments, `SECOND NATURE - ${s.participantCode ?? 'Free play'} - session analysis`);
}
