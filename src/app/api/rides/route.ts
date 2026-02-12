import { NextRequest, NextResponse } from "next/server";
import { rideImportService } from "@/lib/services";

export async function GET() {
  try {
    const rides = await rideImportService.listRides();
    return NextResponse.json(rides);
  } catch (error) {
    console.error("Failed to list rides:", error);
    return NextResponse.json({ error: "Failed to list rides" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const forceImport = formData.get("force") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".fit")) {
      return NextResponse.json({ error: "Only .fit files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (forceImport) {
      const result = await rideImportService.forceImport(file.name, buffer);
      return NextResponse.json(result, { status: 201 });
    }

    const result = await rideImportService.importFitFile(file.name, buffer);

    if (result.duplicate) {
      return NextResponse.json(
        { duplicate: true, existing: result.existing, summary: result.summary },
        { status: 409 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to import ride:", error);
    const message = error instanceof Error ? error.message : "Failed to import ride";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
