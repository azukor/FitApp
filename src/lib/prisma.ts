import { PrismaClient, BlockMode } from "@prisma/client";
import { DEFAULT_USER_ID } from "@/lib/utils";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  defaultUserEnsured: boolean | undefined;
  sampleDataEnsured: boolean | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Ensure the default user exists (runs once per cold start). */
export async function ensureDefaultUser() {
  if (globalForPrisma.defaultUserEnsured) return;
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: { id: DEFAULT_USER_ID, name: "Default User" },
  });
  globalForPrisma.defaultUserEnsured = true;
}

/** Seed sample exercises and templates if the database is empty (runs once per cold start). */
export async function ensureSampleData() {
  if (globalForPrisma.sampleDataEnsured) return;
  await ensureDefaultUser();

  const exerciseCount = await prisma.exercise.count({
    where: { userId: DEFAULT_USER_ID },
  });
  if (exerciseCount > 0) {
    globalForPrisma.sampleDataEnsured = true;
    return;
  }

  // Seed exercises
  await Promise.all([
    prisma.exercise.upsert({
      where: { id: "ex-squat" },
      update: {},
      create: {
        id: "ex-squat",
        userId: DEFAULT_USER_ID,
        name: "Barbell Back Squat",
        tags: ["legs"],
        equipment: "Barbell",
        formCues: "Brace core, break at hips and knees together, drive through midfoot",
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-rdl" },
      update: {},
      create: {
        id: "ex-rdl",
        userId: DEFAULT_USER_ID,
        name: "Romanian Deadlift",
        tags: ["legs", "pull"],
        equipment: "Barbell",
        formCues: "Soft knee bend, hinge at hips, bar close to legs, squeeze glutes at top",
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-leg-press" },
      update: {},
      create: {
        id: "ex-leg-press",
        userId: DEFAULT_USER_ID,
        name: "Leg Press",
        tags: ["legs"],
        equipment: "Machine",
        formCues: "Feet shoulder width, full range of motion, don't lock knees",
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-plank" },
      update: {},
      create: {
        id: "ex-plank",
        userId: DEFAULT_USER_ID,
        name: "Plank",
        tags: ["core"],
        equipment: "Bodyweight",
        formCues: "Straight line from head to heels, squeeze glutes, breathe steadily",
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-bench" },
      update: {},
      create: {
        id: "ex-bench",
        userId: DEFAULT_USER_ID,
        name: "Barbell Bench Press",
        tags: ["push", "chest"],
        equipment: "Barbell",
        formCues: "Retract scapula, arch upper back, bar path to mid-chest, drive feet into floor",
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-row" },
      update: {},
      create: {
        id: "ex-row",
        userId: DEFAULT_USER_ID,
        name: "Barbell Row",
        tags: ["pull", "back"],
        equipment: "Barbell",
        formCues: "Hinge forward ~45°, pull to lower chest, squeeze shoulder blades",
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-ohp" },
      update: {},
      create: {
        id: "ex-ohp",
        userId: DEFAULT_USER_ID,
        name: "Overhead Press",
        tags: ["push", "shoulders"],
        equipment: "Barbell",
        formCues: "Brace core, press straight up, move head through at top, lockout overhead",
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-pullup" },
      update: {},
      create: {
        id: "ex-pullup",
        userId: DEFAULT_USER_ID,
        name: "Pull-ups",
        tags: ["pull", "back"],
        equipment: "Bodyweight",
        formCues: "Full dead hang at bottom, chin over bar at top, control the descent",
      },
    }),
  ]);

  // Seed templates
  await prisma.templateBlock.deleteMany({
    where: { templateId: { in: ["tpl-legs-core", "tpl-upper"] } },
  });

  const legsCore = await prisma.workoutTemplate.upsert({
    where: { id: "tpl-legs-core" },
    update: { name: "Legs + Core" },
    create: {
      id: "tpl-legs-core",
      userId: DEFAULT_USER_ID,
      name: "Legs + Core",
      description: "Lower body strength with core finisher",
    },
  });

  await prisma.templateBlock.createMany({
    data: [
      { templateId: legsCore.id, exerciseId: "ex-squat", order: 0, mode: BlockMode.REPS, sets: 4, repMin: 6, repMax: 8, targetRpe: 8 },
      { templateId: legsCore.id, exerciseId: "ex-rdl", order: 1, mode: BlockMode.REPS, sets: 3, repMin: 8, repMax: 12, targetRpe: 7 },
      { templateId: legsCore.id, exerciseId: "ex-leg-press", order: 2, mode: BlockMode.REPS, sets: 3, repMin: 10, repMax: 15 },
      { templateId: legsCore.id, exerciseId: "ex-plank", order: 3, mode: BlockMode.TIMED, sets: 3, seconds: 60 },
    ],
  });

  const upper = await prisma.workoutTemplate.upsert({
    where: { id: "tpl-upper" },
    update: { name: "Upper Body" },
    create: {
      id: "tpl-upper",
      userId: DEFAULT_USER_ID,
      name: "Upper Body",
      description: "Push/pull upper body session",
    },
  });

  await prisma.templateBlock.createMany({
    data: [
      { templateId: upper.id, exerciseId: "ex-bench", order: 0, mode: BlockMode.REPS, sets: 4, repMin: 6, repMax: 8, targetRpe: 8 },
      { templateId: upper.id, exerciseId: "ex-row", order: 1, mode: BlockMode.REPS, sets: 4, repMin: 8, repMax: 10, targetRpe: 7 },
      { templateId: upper.id, exerciseId: "ex-ohp", order: 2, mode: BlockMode.REPS, sets: 3, repMin: 8, repMax: 12 },
      { templateId: upper.id, exerciseId: "ex-pullup", order: 3, mode: BlockMode.REPS, sets: 3, repMin: 5, repMax: 10 },
    ],
  });

  globalForPrisma.sampleDataEnsured = true;
}
