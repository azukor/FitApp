import { NextRequest, NextResponse } from "next/server";
import { workoutService } from "@/lib/services";
import { startSessionSchema, finishSessionSchema } from "@/lib/validators";

export async function GET() {
  try {
    const sessions = await workoutService.listSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "start") {
      const parsed = startSessionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const session = await workoutService.startSession(
        parsed.data.templateId,
        parsed.data.scheduledWorkoutId
      );
      return NextResponse.json(session, { status: 201 });
    }

    if (action === "finish") {
      const parsed = finishSessionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const session = await workoutService.finishSession(
        parsed.data.sessionId,
        parsed.data.notes,
        parsed.data.setLogs,
        parsed.data.exerciseNotes
      );
      return NextResponse.json(session);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process workout action:", error);
    return NextResponse.json({ error: "Failed to process workout action" }, { status: 500 });
  }
}
