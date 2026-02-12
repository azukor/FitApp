import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";
import { startOfWeek, format, subWeeks } from "date-fns";

// TODO: coachService.generateInsights() — AI-powered insights and recommendations

export const insightService = {
  async getExerciseTrends(exerciseId: string, limit = 20) {
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        completedAt: { not: null },
        setLogs: { some: { exerciseId } },
      },
      include: {
        setLogs: {
          where: { exerciseId },
          orderBy: { setIndex: "asc" },
        },
      },
      orderBy: { completedAt: "asc" },
      take: limit,
    });

    return sessions.map((session) => {
      const sets = session.setLogs;
      let bestWeight = 0;
      let bestReps = 0;
      let totalVolume = 0;

      for (const set of sets) {
        const w = set.weight ?? 0;
        const r = set.reps ?? 0;
        if (w > bestWeight) {
          bestWeight = w;
          bestReps = r;
        }
        totalVolume += w * r;
      }

      return {
        date: format(session.completedAt ?? session.startedAt, "MMM d"),
        bestWeight,
        bestReps,
        totalVolume,
      };
    });
  },

  async getWeeklyConsistency(weeks = 12) {
    const now = new Date();
    const results: { week: string; count: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const count = await prisma.workoutSession.count({
        where: {
          userId: DEFAULT_USER_ID,
          completedAt: { gte: weekStart, lt: weekEnd },
        },
      });

      results.push({
        week: format(weekStart, "MMM d"),
        count,
      });
    }

    return results;
  },

  async getRideSummaries() {
    return prisma.enduranceActivity.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { startTime: "desc" },
      take: 50,
    });
  },
};
