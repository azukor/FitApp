import { NextRequest, NextResponse } from "next/server";
import { workoutService } from "@/lib/services";
import { exerciseSchema } from "@/lib/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exercise = await workoutService.getExercise(id);
    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }
    return NextResponse.json(exercise);
  } catch (error) {
    console.error("Failed to get exercise:", error);
    return NextResponse.json({ error: "Failed to get exercise" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = exerciseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const exercise = await workoutService.updateExercise(id, parsed.data);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error("Failed to update exercise:", error);
    return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await workoutService.deleteExercise(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete exercise:", error);
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
  }
}
