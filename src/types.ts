export type Exercise = {
  id: string;
  name: string;
  notes: string;
  sets: number;
  rephs?: string;
  hasTime?: boolean;
  isActive?: boolean;
};

export type DayRoutine = {
  title: string;
  exercises: Exercise[];
};

export type RoutineConfig = Record<number, DayRoutine>;

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
  [exId: string]: any;
};
