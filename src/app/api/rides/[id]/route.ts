import { NextRequest, NextResponse } from "next/server";
import { rideImportService } from "@/lib/services";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await rideImportService.deleteRide(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ride:", error);
    return NextResponse.json({ error: "Failed to delete ride" }, { status: 500 });
  }
}
