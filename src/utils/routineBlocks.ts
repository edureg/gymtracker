import { Exercise, SupersetGroup } from '../types';

export type RoutineBlock =
  | { type: 'single'; exercise: Exercise }
  | { type: 'superset'; superset: SupersetGroup; exercises: Exercise[] };

export function groupExercisesIntoBlocks(
  exercises: Exercise[],
  supersets?: Record<string, SupersetGroup>
): RoutineBlock[] {
  const blocks: RoutineBlock[] = [];
  const supersetBlockMap = new Map<string, { type: 'superset'; superset: SupersetGroup; exercises: Exercise[] }>();

  for (const ex of exercises) {
    if (ex.supersetId) {
      const existingBlock = supersetBlockMap.get(ex.supersetId);
      if (existingBlock) {
        existingBlock.exercises.push(ex);
      } else {
        const meta = supersets?.[ex.supersetId] || {
          id: ex.supersetId,
          name: 'Superserie',
          rounds: ex.sets || 3,
          notes: ''
        };
        const newBlock: { type: 'superset'; superset: SupersetGroup; exercises: Exercise[] } = {
          type: 'superset',
          superset: meta,
          exercises: [ex]
        };
        supersetBlockMap.set(ex.supersetId, newBlock);
        blocks.push(newBlock);
      }
    } else {
      blocks.push({ type: 'single', exercise: ex });
    }
  }

  return blocks;
}

export function formatTargetSummary(ex: Pick<Exercise, 'targetWeight' | 'targetReps'>): string | null {
  const w = ex.targetWeight?.trim();
  const r = ex.targetReps?.trim();
  if (w && r) return `${w} kg · ${r} reps`;
  if (w) return `${w} kg`;
  if (r) return `${r} reps`;
  return null;
}

export function formatDateDMY(isoDate: string): string {
  if (!isoDate || !isoDate.includes('-')) return isoDate;
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
