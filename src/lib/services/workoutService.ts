import { prisma, ensureDefaultUser } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";
import type { ExerciseFormData, WorkoutTemplateFormData, SetLogEntry } from "@/types";

// TODO: Future coachService integration points marked throughout

export const workoutService = {
  // --- Exercises ---
  async listExercises() {
    return prisma.exercise.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { name: "asc" },
    });
  },

  async getExercise(id: string) {
    return prisma.exercise.findFirst({
      where: { id, userId: DEFAULT_USER_ID },
    });
  },

  async createExercise(data: ExerciseFormData) {
    await ensureDefaultUser();
    return prisma.exercise.create({
      data: { ...data, userId: DEFAULT_USER_ID },
    });
  },

  async updateExercise(id: string, data: Partial<ExerciseFormData>) {
    return prisma.exercise.update({
      where: { id },
      data,
    });
  },

  async deleteExercise(id: string) {
    return prisma.exercise.delete({ where: { id } });
  },

  // --- Templates ---
  async listTemplates() {
    return prisma.workoutTemplate.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        blocks: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getTemplate(id: string) {
    return prisma.workoutTemplate.findFirst({
      where: { id, userId: DEFAULT_USER_ID },
      include: {
        blocks: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  async createTemplate(data: WorkoutTemplateFormData) {
    await ensureDefaultUser();
    return prisma.workoutTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        userId: DEFAULT_USER_ID,
        blocks: {
          create: data.blocks.map((b, i) => ({
            exerciseId: b.exerciseId,
            order: i,
            mode: b.mode,
            sets: b.sets,
            repMin: b.repMin,
            repMax: b.repMax,
            seconds: b.seconds,
            workSeconds: b.workSeconds,
            restSeconds: b.restSeconds,
            rounds: b.rounds,
            targetRpe: b.targetRpe,
            notes: b.notes,
          })),
        },
      },
      include: {
        blocks: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  async updateTemplate(id: string, data: WorkoutTemplateFormData) {
    // Delete existing blocks and recreate
    await prisma.templateBlock.deleteMany({ where: { templateId: id } });
    return prisma.workoutTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        blocks: {
          create: data.blocks.map((b, i) => ({
            exerciseId: b.exerciseId,
            order: i,
            mode: b.mode,
            sets: b.sets,
            repMin: b.repMin,
            repMax: b.repMax,
            seconds: b.seconds,
            workSeconds: b.workSeconds,
            restSeconds: b.restSeconds,
            rounds: b.rounds,
            targetRpe: b.targetRpe,
            notes: b.notes,
          })),
        },
      },
      include: {
        blocks: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  async deleteTemplate(id: string) {
    return prisma.workoutTemplate.delete({ where: { id } });
  },

  // --- Sessions ---
  async startSession(templateId?: string, scheduledWorkoutId?: string) {
    // TODO: coachService.suggestWarmup(templateId) — AI warm-up suggestions
    await ensureDefaultUser();
    return prisma.workoutSession.create({
      data: {
        userId: DEFAULT_USER_ID,
        templateId,
        scheduledWorkoutId,
      },
      include: {
        template: {
          include: {
            blocks: {
              include: { exercise: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  },

  async getSession(id: string) {
    return prisma.workoutSession.findFirst({
      where: { id, userId: DEFAULT_USER_ID },
      include: {
        template: {
          include: {
            blocks: {
              include: { exercise: true },
              orderBy: { order: "asc" },
            },
          },
        },
        setLogs: { orderBy: [{ exerciseId: "asc" }, { setIndex: "asc" }] },
        exerciseNotes: true,
      },
    });
  },

  async finishSession(
    sessionId: string,
    notes: string | undefined,
    setLogs: SetLogEntry[],
    exerciseNotes?: { exerciseId: string; note: string }[]
  ) {
    // TODO: coachService.analyzeSession(sessionId) — AI post-workout analysis

    const session = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
        notes,
        setLogs: {
          createMany: {
            data: setLogs.map((s) => ({
              exerciseId: s.exerciseId,
              blockId: s.blockId,
              setIndex: s.setIndex,
              weight: s.weight,
              reps: s.reps,
              seconds: s.seconds,
              failure: s.failure ?? false,
              rpe: s.rpe,
            })),
          },
        },
      },
      include: { scheduledWorkout: true },
    });

    // Create exercise notes
    if (exerciseNotes && exerciseNotes.length > 0) {
      await prisma.exerciseNote.createMany({
        data: exerciseNotes.map((n) => ({
          exerciseId: n.exerciseId,
          sessionId,
          note: n.note,
        })),
      });
    }

    // Mark scheduled workout as completed
    if (session.scheduledWorkoutId) {
      await prisma.scheduledWorkout.update({
        where: { id: session.scheduledWorkoutId },
        data: { status: "COMPLETED" },
      });
    }

    return session;
  },

  async listSessions(limit = 10) {
    return prisma.workoutSession.findMany({
      where: { userId: DEFAULT_USER_ID, completedAt: { not: null } },
      include: {
        template: true,
        setLogs: true,
      },
      orderBy: { completedAt: "desc" },
      take: limit,
    });
  },

  // --- History for "Last time" feature ---
  async getLastPerformance(exerciseId: string) {
    const lastSession = await prisma.workoutSession.findFirst({
      where: {
        userId: DEFAULT_USER_ID,
        completedAt: { not: null },
        setLogs: { some: { exerciseId } },
      },
      orderBy: { completedAt: "desc" },
      include: {
        setLogs: {
          where: { exerciseId },
          orderBy: { setIndex: "asc" },
        },
        exerciseNotes: {
          where: { exerciseId },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!lastSession) return null;

    return {
      sessionDate: lastSession.completedAt ?? lastSession.startedAt,
      sets: lastSession.setLogs.map((s) => ({
        setIndex: s.setIndex,
        weight: s.weight,
        reps: s.reps,
        seconds: s.seconds,
        failure: s.failure,
        rpe: s.rpe,
      })),
      note: lastSession.exerciseNotes[0]?.note,
    };
  },
};
