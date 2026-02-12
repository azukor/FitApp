import { NextResponse } from "next/server";
import { calendarService } from "@/lib/services";

export async function GET() {
  try {
    const next = await calendarService.getNextScheduled();
    return NextResponse.json(next);
  } catch (error) {
    console.error("Failed to get next scheduled:", error);
    return NextResponse.json({ error: "Failed to get next scheduled" }, { status: 500 });
  }
}
