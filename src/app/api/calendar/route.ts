import { NextRequest, NextResponse } from "next/server";
import { calendarService } from "@/lib/services";
import { scheduleWorkoutSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    if (!startDate) {
      return NextResponse.json({ error: "startDate is required" }, { status: 400 });
    }
    const workouts = await calendarService.getWeek(new Date(startDate));
    return NextResponse.json(workouts);
  } catch (error) {
    console.error("Failed to get calendar:", error);
    return NextResponse.json({ error: "Failed to get calendar" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = scheduleWorkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const workout = await calendarService.scheduleWorkout(parsed.data.templateId, parsed.data.date);
    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error("Failed to schedule workout:", error);
    return NextResponse.json({ error: "Failed to schedule workout" }, { status: 500 });
  }
}
