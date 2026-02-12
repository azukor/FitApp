import { PrismaClient } from "@prisma/client";
import { DEFAULT_USER_ID } from "@/lib/utils";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  defaultUserEnsured: boolean | undefined;
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
