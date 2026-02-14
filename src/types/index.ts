import type { BlockMode, ScheduledWorkoutStatus } from "@prisma/client";

// Re-export prisma enums for convenience
export type { BlockMode, ScheduledWorkoutStatus };

// Exercise
export interface ExerciseFormData {
  name: string;
  tags: string[];
  equipment?: string;
  formCues?: string;
  userNote?: string;
}

// Template block
export interface TemplateBlockFormData {
  exerciseId: string;
  order: number;
  mode: BlockMode;
  sets: number;
  repMin?: number;
  repMax?: number;
  seconds?: number;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  targetRpe?: number;
  notes?: string;
}

// Workout template
export interface WorkoutTemplateFormData {
  name: string;
  description?: string;
  blocks: TemplateBlockFormData[];
}

// Scheduled workout
export interface ScheduleWorkoutFormData {
  templateId: string;
  date: string; // ISO date string
}

// Set log during a session
export interface SetLogEntry {
  exerciseId: string;
  blockId?: string;
  setIndex: number;
  weight?: number;
  reps?: number;
  seconds?: number;
  failure?: boolean;
  rpe?: number;
}

// Start session payload
export interface StartSessionPayload {
  templateId?: string;
  scheduledWorkoutId?: string;
}

// Finish session payload
export interface FinishSessionPayload {
  sessionId: string;
  notes?: string;
  setLogs: SetLogEntry[];
  exerciseNotes?: { exerciseId: string; note: string }[];
}

// Ride import summary
export interface RideSummary {
  startTime: Date;
  duration: number; // seconds
  distance?: number; // meters
  avgHr?: number;
  avgPower?: number;
  maxPower?: number;
  avgCadence?: number;
}

// Insight data types
export interface ExerciseTrend {
  date: string;
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
}

export interface WeeklyConsistency {
  week: string;
  count: number;
}

// Last time data for an exercise
export interface LastTimeData {
  sessionDate: Date;
  sets: {
    setIndex: number;
    weight: number | null;
    reps: number | null;
    seconds: number | null;
    failure: boolean;
    rpe: number | null;
  }[];
  note?: string;
}

// Coach chat
export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  images?: string[]; // base64 data URLs for user-attached images
  createdItems?: CoachCreatedItem[];
}

export interface CoachCreatedItem {
  type: "exercise" | "template";
  name: string;
  id: string;
}
