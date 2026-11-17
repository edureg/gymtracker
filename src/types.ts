export type SupersetGroup = {
  id: string;
  name: string;
  rounds: number;
  notes?: string;
};

export type Exercise = {
  id: string;
  name: string;
  notes: string;
  sets: number;
  rephs?: string;
  hasTime?: boolean;
  isActive?: boolean;
  supersetId?: string;
  targetWeight?: string;
  targetReps?: string;
};

export type Routine = {
  id: string;
  title: string;
  exercises: Exercise[];
  supersets?: Record<string, SupersetGroup>;
};

export type RoutineConfig = Record<string, Routine>;

export type SetData = {
  reps?: number | string;
  weight?: number | string;
  time?: number | string;
  done?: boolean;
};

export type ExerciseLog = {
  note?: string;
  [setIdx: number]: SetData | string | undefined;
};

export type DayLog = {
  _day_note_?: string;
  calories?: string;
  duration?: string;
  avgHeartRate?: string;
  maxHeartRate?: string;
  routineId?: string;
  [exId: string]: any;
};
