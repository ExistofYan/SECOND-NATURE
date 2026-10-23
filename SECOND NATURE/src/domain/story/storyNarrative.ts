import type { Scene, Session } from './types';

export function selectedChoice(s: Session, sceneId: string) {
  return s.visits.find(v => v.sceneId === sceneId)?.selectedChoiceId ?? null;
}

/** Short arrival captions also stay visible in the next scene, so reading is not timed. */
export function arrivalText(s: Session, scene: Scene): string {
  switch (scene.id) {
    case 'S02': return selectedChoice(s, 'S01') === 'extra'
      ? 'Breakfast is over. The extra serving went in the bin.' : 'Breakfast is over. It is time to get ready for school.';
    case 'S02T': return 'You have finished packing. Your next step is the journey to school.';
    case 'S03': return ({bike: 'You cycle to school and park your bicycle.', bus: 'You get off the bus at school.', car: 'Your parent drops you off at school.'} as Record<string, string>)[selectedChoice(s, 'S02T') ?? ''] ?? '';
    case 'S06': return selectedChoice(s, 'S05') === 'digital' ? 'You close the notes on your laptop.'
      : `You put your ${selectedChoice(s, 'S05') === 'double' ? 'two' : 'four'} printed sheets in your bag.`;
    case 'S11': return `You put ${selectedChoice(s, 'S10') === 'three' ? 'three servings' : 'one serving'} of fruit in your basket.`;
    case 'S12': return selectedChoice(s, 'S11') === 'loose' ? 'Your fruit is loose in your basket.'
      : selectedChoice(s, 'S11') === 'paper' ? 'Your fruit is in its paper fruit bag.' : 'Your fruit is on a tray under plastic wrap.';
    case 'S14': return selectedChoice(s, 'S13') === 'order'
      ? 'You ordered two takeaway meals and ate yours. The other meal is still here.'
      : 'You cooked for two and ate your serving. The other serving is still here.';
    case 'S16': return 'The shirt has been dealt with. Now there is just one job left before bed.';
    default: return '';
  }
}

export function storyTextFor(s: Session, scene: Scene): string {
  let text = scene.storyText;
  // Snapshot text remains authoritative for saved sessions made before this rewrite.
  if (!['comic-day-1.1.0', 'comic-day-1.1.1', 'comic-day-1.2.0'].includes(s.modelVersion)) return text;
  if (scene.id === 'S03') text = 'Before class, you stop for a coffee. You can borrow a cafe cup and drink inside, or take a throwaway cup and lid. '
    + (s.items.some(i => i.itemId === 'cup' && i.carried) ? 'You also have the clean cup you packed at home.' : 'Your own cup is still at home.');
  if (scene.id === 'S10') text = 'After your snack, you study in the library until five. '
    + (selectedChoice(s, 'S02T') === 'bike'
      ? 'You collect your bicycle and ride to the supermarket before going home. '
      : 'You plan to take the bus home and stop at the supermarket near school first. ')
    + 'You want one serving of fruit to eat on the way. A sign offers three for a special price.';
  if (scene.id === 'S11') text = 'Before paying, decide whether to wrap this fruit. You can keep it loose, use one paper bag, or use a tray with plastic wrap. Each choice holds the same amount of fruit.';
  if (scene.id === 'S13') text = 'After paying, you eat one serving of fruit outside the shop. '
    + (selectedChoice(s, 'S02T') === 'bike' ? 'Then you ride your bicycle home. ' : 'Then you walk to the bus stop and take the bus home. ')
    + 'You and your housemate agreed to have dinner together. There is enough food in the fridge for two servings.';
  if (scene.id === 'S14') text = 'Your housemate sends a message: they cannot come home for dinner. The spare meal is still safe to eat. You have a clean food container. A friend nearby has said they would like it. What will you do?';
  if (scene.id === 'S16') {
    const papers = s.items.filter(i => i.type === 'paper' && i.destination === 'in_use').length;
    const bags = s.items.filter(i => i.type === 'bag' && i.origin === 'new' && i.destination === 'pending').length;
    text = `You empty your school bag and tidy your desk. There are ${papers} paper sheets and ${bags} new bags to check, along with any other packaging. Your old notebook still has blank pages. Wash your reusable things. What will you keep or throw away?`;
  }
  const questions: Record<string, string> = {
    S03: 'Which cup will you use?', S04: 'How will you get a drink?',
    S05: 'How will you read the notes?', S06: 'What will you put your lunch in?',
    S08: 'How will you tell your friends?', S09: 'How will you have your snack?',
    S10: 'How much fruit will you buy?', S11: 'How will you pack the fruit?',
    S12: 'How will you carry it home?', S13: 'How will you get dinner ready?',
    S15: 'What will you do with the shirt?',
  };
  if (['comic-day-1.1.1','comic-day-1.2.0'].includes(s.modelVersion) && questions[scene.id]) text += ' ' + questions[scene.id];
  return [arrivalText(s, scene), text].filter(Boolean).join(' ');
}

export function travelSummary(s: Session) {
  const mode = selectedChoice(s, 'S02T');
  if (!mode) return null;
  const choice = s.modelSnapshot.find(scene => scene.id === 'S02T')?.choices.find(c => c.id === mode);
  return choice ? { mode, label: choice.label, text: choice.aftermath,
    note: 'This records your morning trip to school. Exhaust is pollution in the air. It is shown separately from food and rubbish. No amount of gas is measured here.' } : null;
}

const lowerWasteChoices: Record<string, string[]> = {
  S01: ['one'], S02: ['all'], S02T: ['bike'], S03: ['own', 'inside'], S04: ['refill', 'fountain'],
  S05: ['digital'], S06: ['own', 'tray'], S07: ['one'], S08: ['message'], S09: ['plate'],
  S10: ['one'], S11: ['loose'], S12: ['own', 'hands'], S13: ['cook'], S14: ['save', 'share'],
  S15: ['repair', 'exchange'], S16: ['keep'],
};
const lessons: Record<string, string> = {
  S01: 'Start with the food you need. You can always take more.',
  S02: 'Packing helps later. If you forget, borrowing a cup or tray can still avoid throwaway things.',
  S02T: 'For this dry day and safe route, cycling avoids exhaust from the journey. A bus shares a vehicle already making the trip. Other days may need a different travel plan.',
  S03: 'Your own cup and a borrowed cafe cup both avoid a new throwaway cup and lid.',
  S04: 'A working fountain means you can have a drink without buying a plastic bottle.',
  S05: 'Read on screen when it works for you. If you need paper, printing on both sides uses fewer sheets.',
  S06: 'Your lunch box and a borrowed tray both avoid a new box and fork.',
  S07: 'Take a little first. Finishing it before getting more helps keep good food out of the bin.',
  S08: 'Give friends the information they need without printing more paper than needed.',
  S09: 'Eating here from a plate avoids a wrapper. An already wrapped snack does not need another bag.',
  S10: 'Buy extra only if you have a plan to eat it. Extra good fruit is food for later, not waste yet.',
  S11: 'Loose fruit needs no new packaging. Paper packaging is still an extra item.',
  S12: 'Use your own bag, or carry a small purchase by hand. Keep a new bag for another use if it is still suitable.',
  S13: 'Check the fridge before ordering. Food left in the fridge is still food, but it needs a plan to be eaten.',
  S14: 'Saving safe food or giving it to someone who wants it keeps it out of the bin.',
  S15: 'A small repair or an agreed handover can keep a shirt in use.',
  S16: 'Keep things that can be used again first. Sort the rest. Recycling still means an item has been discarded.',
};

/** Explain every committed choice, including the options actually available at that visit. */
export function choiceReview(s: Session) {
  return s.visits.flatMap(visit => {
    const scene = s.modelSnapshot.find(scene => scene.id === visit.sceneId);
    const choice = scene?.choices.find(c => c.id === visit.selectedChoiceId);
    if (!scene || !choice) return [];
    const candidates = lowerWasteChoices[scene.id] ?? [];
    const alternative = scene.choices.find(c => candidates.includes(c.id) && visit.availableChoiceIds.includes(c.id));
    const improvement = !candidates.includes(choice.id) && !!alternative;
    const itemIds = [...new Set(s.events.filter(e => e.sceneId === scene.id && e.type.startsWith('item_'))
      .map(e => (e.payload.item as {itemId?: string} | undefined)?.itemId).filter((id): id is string => !!id))];
    const nextTime = improvement ? `Another choice you could make: ${alternative!.label}. ${alternative!.description}`
      : 'You chose one of the ways to avoid waste in this scene.';
    return [{sceneId: scene.id, choiceId: choice.id, title: scene.title, label: choice.label, itemIds,
      text: choice.aftermath, lesson: lessons[scene.id] ?? '', nextTime, improvement,
      alternativeChoiceId: improvement ? alternative!.id : null}];
  });
}
