import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tags: z.array(z.string()).default([]),
  equipment: z.string().optional(),
  formCues: z.string().optional(),
  userNote: z.string().optional(),
});

export const templateBlockSchema = z.object({
  exerciseId: z.string().min(1, "Exercise is required"),
  order: z.number().int().min(0),
  mode: z.enum(["REPS", "TIMED", "INTERVAL"]),
  sets: z.number().int().min(1).default(3),
  repMin: z.number().int().min(0).optional(),
  repMax: z.number().int().min(0).optional(),
  seconds: z.number().int().min(0).optional(),
  workSeconds: z.number().int().min(0).optional(),
  restSeconds: z.number().int().min(0).optional(),
  rounds: z.number().int().min(0).optional(),
  targetRpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export const workoutTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  blocks: z.array(templateBlockSchema).min(1, "At least one exercise block is required"),
});

export const scheduleWorkoutSchema = z.object({
  templateId: z.string().min(1),
  date: z.string().min(1, "Date is required"),
});

export const moveWorkoutSchema = z.object({
  date: z.string().min(1, "Date is required"),
});

export const setLogSchema = z.object({
  exerciseId: z.string().min(1),
  blockId: z.string().optional(),
  setIndex: z.number().int().min(0),
  weight: z.number().min(0).optional(),
  reps: z.number().int().min(0).optional(),
  seconds: z.number().min(0).optional(),
  failure: z.boolean().default(false),
  rpe: z.number().min(1).max(10).optional(),
});

export const startSessionSchema = z.object({
  templateId: z.string().optional(),
  scheduledWorkoutId: z.string().optional(),
});

export const finishSessionSchema = z.object({
  sessionId: z.string().min(1),
  notes: z.string().optional(),
  setLogs: z.array(setLogSchema),
  exerciseNotes: z.array(z.object({
    exerciseId: z.string().min(1),
    note: z.string().min(1),
  })).optional(),
});

export const coachChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1),
    image: z.string().optional(),
  })).min(1),
});
