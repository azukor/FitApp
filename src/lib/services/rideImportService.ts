import { prisma, ensureDefaultUser } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";
import type { RideSummary } from "@/types";
import * as fs from "fs/promises";
import * as path from "path";
// @ts-expect-error -- @garmin/fitsdk is ESM-only with no type declarations
import { Decoder, Stream } from "@garmin/fitsdk";

// TODO: Replace local storage with S3/R2 interface
interface StorageProvider {
  save(filename: string, buffer: Buffer): Promise<string>;
  // TODO: get(path: string): Promise<Buffer>;
  // TODO: delete(path: string): Promise<void>;
}

const localStorageProvider: StorageProvider = {
  async save(filename: string, buffer: Buffer): Promise<string> {
    // Use /tmp on serverless (Vercel) since the app directory is read-only
    const uploadDir = path.join("/tmp", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `${Date.now()}-${filename}`);
    await fs.writeFile(filePath, buffer);
    return filePath;
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseFitFile(buffer: Buffer): RideSummary {
  const stream = Stream.fromBuffer(buffer);
  const decoder = new Decoder(stream);

  if (!decoder.isFIT()) {
    throw new Error("Invalid .fit file: not a FIT file");
  }

  if (!decoder.checkIntegrity()) {
    throw new Error("Invalid .fit file: integrity check failed");
  }

  const { messages, errors } = decoder.read({
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    mergeHeartRates: true,
  });

  if (errors && errors.length > 0) {
    throw new Error(`FIT decode errors: ${errors.join(", ")}`);
  }

  // Session messages contain the ride summary data
  const sessionMesgs: any[] = messages.sessionMesgs ?? [];
  const session: any | undefined = sessionMesgs[0];

  if (session) {
    return {
      startTime: session.startTime instanceof Date ? session.startTime : new Date(),
      duration: Math.round(session.totalTimerTime ?? session.totalElapsedTime ?? 0),
      distance: session.totalDistance != null ? Math.round(session.totalDistance) : undefined,
      avgHr: session.avgHeartRate != null ? Math.round(session.avgHeartRate) : undefined,
      avgPower: session.avgPower != null ? Math.round(session.avgPower) : undefined,
      maxPower: session.maxPower != null ? Math.round(session.maxPower) : undefined,
      avgCadence: session.avgCadence != null ? Math.round(session.avgCadence) : undefined,
    };
  }

  // Fallback: no session message, try to derive from record messages
  const recordMesgs: any[] = messages.recordMesgs ?? [];
  if (recordMesgs.length === 0) {
    throw new Error("Invalid .fit file: no session or record data found");
  }

  const first = recordMesgs[0];
  const last = recordMesgs[recordMesgs.length - 1];
  const startTime = first.timestamp instanceof Date ? first.timestamp : new Date();
  const duration =
    first.timestamp instanceof Date && last.timestamp instanceof Date
      ? Math.round((last.timestamp.getTime() - first.timestamp.getTime()) / 1000)
      : 0;

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : undefined;

  const hrs = recordMesgs.map((r: any) => r.heartRate).filter((v: any): v is number => v != null);
  const pows = recordMesgs.map((r: any) => r.power).filter((v: any): v is number => v != null);
  const cads = recordMesgs.map((r: any) => r.cadence).filter((v: any): v is number => v != null);
  const lastDist = last.distance;

  return {
    startTime,
    duration,
    distance: lastDist != null ? Math.round(lastDist) : undefined,
    avgHr: avg(hrs),
    avgPower: avg(pows),
    maxPower: pows.length > 0 ? Math.max(...pows) : undefined,
    avgCadence: avg(cads),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const rideImportService = {
  storage: localStorageProvider as StorageProvider,

  async importFitFile(filename: string, fileBuffer: Buffer) {
    await ensureDefaultUser();
    // Parse the .fit file
    const summary = parseFitFile(fileBuffer);

    // Check for duplicates
    const existing = await prisma.enduranceActivity.findFirst({
      where: {
        userId: DEFAULT_USER_ID,
        startTime: summary.startTime,
        duration: summary.duration,
      },
    });

    if (existing) {
      return { duplicate: true, existing, summary };
    }

    // Store the file
    const storagePath = await rideImportService.storage.save(filename, fileBuffer);

    // Create file object
    const fileObject = await prisma.fileObject.create({
      data: {
        filename,
        mimeType: "application/vnd.ant.fit",
        size: fileBuffer.length,
        storagePath,
      },
    });

    // Create activity record
    const activity = await prisma.enduranceActivity.create({
      data: {
        userId: DEFAULT_USER_ID,
        source: "fit_upload",
        startTime: summary.startTime,
        duration: summary.duration,
        distance: summary.distance,
        avgHr: summary.avgHr,
        avgPower: summary.avgPower,
        maxPower: summary.maxPower,
        avgCadence: summary.avgCadence,
        title: filename.replace(/\.fit$/i, ""),
        fileObjectId: fileObject.id,
      },
      include: { fileObject: true },
    });

    return { duplicate: false, activity, summary };
  },

  async forceImport(filename: string, fileBuffer: Buffer) {
    await ensureDefaultUser();
    const summary = parseFitFile(fileBuffer);
    const storagePath = await rideImportService.storage.save(filename, fileBuffer);

    const fileObject = await prisma.fileObject.create({
      data: {
        filename,
        mimeType: "application/vnd.ant.fit",
        size: fileBuffer.length,
        storagePath,
      },
    });

    const activity = await prisma.enduranceActivity.create({
      data: {
        userId: DEFAULT_USER_ID,
        source: "fit_upload",
        startTime: summary.startTime,
        duration: summary.duration,
        distance: summary.distance,
        avgHr: summary.avgHr,
        avgPower: summary.avgPower,
        maxPower: summary.maxPower,
        avgCadence: summary.avgCadence,
        title: filename.replace(/\.fit$/i, ""),
        fileObjectId: fileObject.id,
      },
      include: { fileObject: true },
    });

    return { activity, summary };
  },

  async listRides() {
    return prisma.enduranceActivity.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: { fileObject: true },
      orderBy: { startTime: "desc" },
    });
  },

  async deleteRide(id: string) {
    return prisma.enduranceActivity.delete({ where: { id } });
  },

  // TODO: stravaImportService — implement Strava OAuth and auto-import
};
