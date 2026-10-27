import type { ParticipantIdentity, Session } from './types';
import { ratingQuestions, isRatingValue } from '../../data/story/probes';

export const CONSENT_VERSION = 'identified-course-study-1';
export function participantError(p: ParticipantIdentity): string {
  // The offline PDF uses English fonts. Preserve an English/pinyin enrolment name.
  if (!/^[\x20-\x7e]{2,100}$/.test(p.fullName.trim()) || !/[A-Za-z]/.test(p.fullName))
    return 'Enter your full name in English or pinyin (2–100 characters).';
  if (!/^u\d{7}$/i.test(p.studentId.trim())) return 'Enter your ANU student ID as u followed by 7 digits.';
  if (!['COMP3900', 'COMP6390'].includes(p.course)) return 'Confirm your current COMP3900 or COMP6390 enrolment.';
  return '';
}
export function localSessionDate(s: Session): string {
  if (!s.timeZone) return 'Not recorded (legacy session); see UTC timestamps';
  try { return new Intl.DateTimeFormat('en-AU', { dateStyle: 'full', timeStyle: 'long', timeZone: s.timeZone }).format(new Date(s.startedAt)); }
  catch { return s.startedAt; }
}
export function evaluationCompletedAt(s: Session): string | null {
  if (!ratingQuestions.every(q => isRatingValue(s.ratings[q.key]))) return null;
  return s.events.filter(e => e.type === 'rating_submitted').slice(-1)[0]?.wallTimeISO ?? null;
}
