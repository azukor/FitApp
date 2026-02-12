import { NextRequest, NextResponse } from "next/server";
import { workoutService } from "@/lib/services";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await workoutService.getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}
