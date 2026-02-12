import { NextRequest, NextResponse } from "next/server";
import { workoutService } from "@/lib/services";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  try {
    const { exerciseId } = await params;
    const lastPerformance = await workoutService.getLastPerformance(exerciseId);
    return NextResponse.json(lastPerformance);
  } catch (error) {
    console.error("Failed to get exercise history:", error);
    return NextResponse.json({ error: "Failed to get exercise history" }, { status: 500 });
  }
}
