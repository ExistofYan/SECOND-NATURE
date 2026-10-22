export type Destination = 'in_use' | 'pending' | 'retained' | 'repaired' | 'transferred' | 'recycling' | 'general' | 'food_discard' | 'eaten' | 'saved' | 'inventory' | 'prepared';
export interface Item {
  itemId: string; label: string; type: string; sourceScene: string; origin: 'existing' | 'new';
  unit: 'item' | 'sheet' | 'serving'; condition: 'clean' | 'used' | 'damaged' | 'edible';
  destination: Destination; holder: 'player' | 'recipient' | 'collection'; singleUse: boolean; reusable: boolean;
  retainable: boolean; carried: boolean; material: 'paper' | 'plastic' | 'textile' | 'food' | 'durable';
}
export type Effect = { type: 'acquire'; item: Item } | { type: 'update'; ids: string[]; patch: Partial<Item> } | { type: 'pack'; ids: string[] } | { type: 'tidy'; mode: 'keep' | 'separate' | 'mixed' };
export interface Choice { id: string; label: string; description: string; aftermath: string; requires?: string; effects: Effect[] }
export interface Scene { id: string; artId?: string; chapter: number; timeLabel: string; location: string; title: string; storyText: string; alt: string; choices: Choice[] }
export interface StoryEvent { eventId: string; seq: number; wallTimeISO: string; elapsedMonotonicMs: number; timingSegmentId: string; sceneVisitId: string | null; sceneId: string | null; type: string; payload: Record<string, unknown>; schemaVersion: number }
export interface Timing { decisionWallMs: number | null; decisionActiveMs: number | null; pausedMs: number | null }
export interface SceneVisit extends Timing { storyText?: string; visitId: string; sceneId: string; variantId: string; availableChoiceIds: string[]; choicePositions: string[]; readyAt: string | null; submittedAt: string | null; selectedChoiceId: string | null; animationMs: number; assetStatus: 'ready' | 'degraded'; timingInterrupted: boolean; timingMissing?: boolean }
export interface Session {
  sessionId: string; schemaVersion: number; modelVersion: string; appVersion: string; kind: 'play' | 'research'; participantCode: string | null;
  consentAt: string | null; startedAt: string; endedAt: string | null; status: 'active' | 'interrupted' | 'completed' | 'aborted';
  parentSessionId: string | null; modelSnapshot: Scene[]; initialInventory: Item[]; items: Item[]; events: StoryEvent[];
  visits: SceneVisit[]; nextSceneIndex: number; reducedMotion: boolean; ratings: Record<string, number>; probes: Array<{phase: string; set: string; questionId: string; choiceId: string; correct: boolean}>;
  studyPhase: string; probeSet: 'A' | 'B'; collectProbes: boolean;
  pendingTransition?: { visitId: string; sceneId: string; feedback: string };
}
