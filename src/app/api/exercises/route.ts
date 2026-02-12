import { NextRequest, NextResponse } from "next/server";
import { workoutService } from "@/lib/services";
import { exerciseSchema } from "@/lib/validators";

export async function GET() {
  try {
    const exercises = await workoutService.listExercises();
    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Failed to list exercises:", error);
    return NextResponse.json({ error: "Failed to list exercises" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = exerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const exercise = await workoutService.createExercise(parsed.data);
    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Failed to create exercise:", error);
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
  }
}
