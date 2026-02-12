import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export const calendarService = {
  async getWeek(startDate: Date) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    return prisma.scheduledWorkout.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        date: { gte: startDate, lt: endDate },
      },
      include: {
        template: true,
        session: true,
      },
      orderBy: { date: "asc" },
    });
  },

  async getMonth(year: number, month: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    return prisma.scheduledWorkout.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        date: { gte: startDate, lt: endDate },
      },
      include: {
        template: true,
        session: true,
      },
      orderBy: { date: "asc" },
    });
  },

  async scheduleWorkout(templateId: string, date: string) {
    // TODO: coachService.suggestSchedule() — AI schedule optimization
    return prisma.scheduledWorkout.create({
      data: {
        userId: DEFAULT_USER_ID,
        templateId,
        date: new Date(date),
      },
      include: { template: true },
    });
  },

  async moveWorkout(id: string, newDate: string) {
    return prisma.scheduledWorkout.update({
      where: { id },
      data: { date: new Date(newDate) },
      include: { template: true },
    });
  },

  async skipWorkout(id: string) {
    return prisma.scheduledWorkout.update({
      where: { id },
      data: { status: "SKIPPED" },
    });
  },

  async deleteScheduledWorkout(id: string) {
    return prisma.scheduledWorkout.delete({ where: { id } });
  },

  async getNextScheduled() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.scheduledWorkout.findFirst({
      where: {
        userId: DEFAULT_USER_ID,
        date: { gte: today },
        status: "PLANNED",
      },
      include: { template: true },
      orderBy: { date: "asc" },
    });
  },
};
