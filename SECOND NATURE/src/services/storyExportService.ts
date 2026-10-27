import type { Session } from '../domain/story/types';
import { buildStoryPdf } from './storyPdfService';
export { storyFiles, destinationChart, foodChart, timingChart } from './storyReportData';

export async function exportStory(s: Session, previous: Session | null = null) {
  const data = buildStoryPdf(s, previous);
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  const code = (s.participantCode ?? 'play').replace(/[^a-z0-9_-]/gi, '_');
  anchor.download = `SecondNature-${s.startedAt.slice(0,10)}-${code}-${s.sessionId.slice(0, 8)}.pdf`;
  anchor.style.display = 'none';
  document.body.append(anchor);
  try { anchor.click(); }
  finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
}
