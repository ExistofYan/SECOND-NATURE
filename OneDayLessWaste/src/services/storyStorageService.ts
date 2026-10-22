import type { Session } from '../domain/story/types';
export const STORY_KEY='ecosort:comic-day:v1';
export function loadSessions():Session[]{const raw=localStorage.getItem(STORY_KEY); if(!raw)return [];const parsed=JSON.parse(raw);if(!Array.isArray(parsed)||parsed.some((s:Session)=>s.schemaVersion!==1||!Array.isArray(s.events)))throw new Error('The saved data has an unsupported format. Export or back it up before replacing it.');return parsed;}
export function saveSessions(sessions:Session[]) {localStorage.setItem(STORY_KEY,JSON.stringify(sessions));}
