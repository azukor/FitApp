import { NextRequest, NextResponse } from "next/server";
import { coachChat } from "@/lib/services/coachService";
import { coachChatSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI Coach is not configured. Set the OPENAI_API_KEY environment variable." },
      { status: 501 }
    );
  }

  try {
    const body = await request.json();
    const parsed = coachChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const response = await coachChat(parsed.data.messages);
    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Coach chat error:", error);
    const message = error instanceof Error ? error.message : "AI Coach request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
