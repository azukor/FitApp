import { NextRequest, NextResponse } from "next/server";
import { workoutService } from "@/lib/services";
import { workoutTemplateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const templates = await workoutService.listTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to list templates:", error);
    return NextResponse.json({ error: "Failed to list templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = workoutTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const template = await workoutService.createTemplate(parsed.data);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
