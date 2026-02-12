import { NextRequest, NextResponse } from "next/server";
import { insightService } from "@/lib/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "exercise") {
      const exerciseId = searchParams.get("exerciseId");
      if (!exerciseId) {
        return NextResponse.json({ error: "exerciseId is required" }, { status: 400 });
      }
      const trends = await insightService.getExerciseTrends(exerciseId);
      return NextResponse.json(trends);
    }

    if (type === "consistency") {
      const consistency = await insightService.getWeeklyConsistency();
      return NextResponse.json(consistency);
    }

    if (type === "rides") {
      const rides = await insightService.getRideSummaries();
      return NextResponse.json(rides);
    }

    // Return all insights
    const [consistency, rides] = await Promise.all([
      insightService.getWeeklyConsistency(),
      insightService.getRideSummaries(),
    ]);

    return NextResponse.json({ consistency, rides });
  } catch (error) {
    console.error("Failed to get insights:", error);
    return NextResponse.json({ error: "Failed to get insights" }, { status: 500 });
  }
}
