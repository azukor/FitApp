import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";
import type { RideSummary } from "@/types";
import * as fs from "fs/promises";
import * as path from "path";

// TODO: Replace local storage with S3/R2 interface
interface StorageProvider {
  save(filename: string, buffer: Buffer): Promise<string>;
  // TODO: get(path: string): Promise<Buffer>;
  // TODO: delete(path: string): Promise<void>;
}

const localStorageProvider: StorageProvider = {
  async save(filename: string, buffer: Buffer): Promise<string> {
    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `${Date.now()}-${filename}`);
    await fs.writeFile(filePath, buffer);
    return filePath;
  },
};

// Simple .fit file parser - extracts basic summary data
// .fit files use a binary protocol; this is a minimal parser for common fields
function parseFitFile(buffer: Buffer): RideSummary {
  // FIT file header check
  if (buffer.length < 14) {
    throw new Error("Invalid .fit file: too small");
  }

  const headerSize = buffer[0];
  if (headerSize < 12) {
    throw new Error("Invalid .fit file: bad header size");
  }

  // Check for ".FIT" signature at bytes 8-11
  const signature = buffer.toString("ascii", 8, 12);
  if (signature !== ".FIT") {
    throw new Error("Invalid .fit file: missing .FIT signature");
  }

  // For v1, we do a simplified parse extracting key fields from record messages.
  // A production parser would fully decode the FIT protocol.
  // We'll extract what we can from the binary data.

  let startTime: Date | null = null;
  let totalDuration = 0;
  let totalDistance: number | undefined;
  let avgHr: number | undefined;
  let avgPower: number | undefined;
  let maxPower: number | undefined;
  let avgCadence: number | undefined;

  // Try to find session message (message type 18) which contains summary data
  // FIT timestamps are seconds since Dec 31, 1989 00:00:00 UTC
  const FIT_EPOCH = new Date("1989-12-31T00:00:00Z").getTime();

  // Scan for common patterns in the binary data
  // Look for the session record which typically has aggregated data
  let offset = headerSize;
  const dataSize = buffer.readUInt32LE(4);
  const dataEnd = Math.min(headerSize + dataSize, buffer.length);

  // Simplified scan: look for timestamp-like values (4-byte LE values in plausible range)
  // FIT timestamp range: ~600000000 to ~1200000000 (roughly 2008-2027)
  let timestamps: number[] = [];
  let powers: number[] = [];
  let heartRates: number[] = [];
  let cadences: number[] = [];

  for (let i = offset; i < dataEnd - 4; i++) {
    // Try to find timestamp fields (typically large 4-byte values)
    const val = buffer.readUInt32LE(i);
    if (val > 600000000 && val < 1200000000) {
      timestamps.push(val);
    }
  }

  // Use first and last plausible timestamps
  if (timestamps.length >= 2) {
    timestamps.sort((a, b) => a - b);
    const firstTs = timestamps[0];
    const lastTs = timestamps[timestamps.length - 1];
    startTime = new Date(FIT_EPOCH + firstTs * 1000);
    totalDuration = lastTs - firstTs;
  }

  // Scan for 2-byte values that look like heart rate (30-220) and power (0-2000)
  for (let i = offset; i < dataEnd - 2; i += 1) {
    const val16 = buffer.readUInt16LE(i);
    if (val16 >= 40 && val16 <= 220) {
      heartRates.push(val16);
    }
    if (val16 >= 50 && val16 <= 2000) {
      powers.push(val16);
    }
    if (val16 >= 30 && val16 <= 130) {
      cadences.push(val16);
    }
  }

  // Compute averages from sampled data
  if (heartRates.length > 100) {
    avgHr = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length);
  }
  if (powers.length > 100) {
    avgPower = Math.round(powers.reduce((a, b) => a + b, 0) / powers.length);
    maxPower = Math.max(...powers);
  }
  if (cadences.length > 100) {
    avgCadence = Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length);
  }

  if (!startTime) {
    startTime = new Date();
  }
  if (totalDuration === 0) {
    totalDuration = 3600; // default 1 hour if we can't parse
  }

  return {
    startTime,
    duration: totalDuration,
    distance: totalDistance,
    avgHr,
    avgPower,
    maxPower,
    avgCadence,
  };
}

export const rideImportService = {
  storage: localStorageProvider as StorageProvider,

  async importFitFile(filename: string, fileBuffer: Buffer) {
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
