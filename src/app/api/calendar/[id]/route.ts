import { NextRequest, NextResponse } from "next/server";
import { calendarService } from "@/lib/services";
import { moveWorkoutSchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "skip") {
      const workout = await calendarService.skipWorkout(id);
      return NextResponse.json(workout);
    }

    const parsed = moveWorkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const workout = await calendarService.moveWorkout(id, parsed.data.date);
    return NextResponse.json(workout);
  } catch (error) {
    console.error("Failed to update scheduled workout:", error);
    return NextResponse.json({ error: "Failed to update scheduled workout" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await calendarService.deleteScheduledWorkout(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete scheduled workout:", error);
    return NextResponse.json({ error: "Failed to delete scheduled workout" }, { status: 500 });
  }
}
