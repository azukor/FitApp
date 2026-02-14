/**
 * coachService — AI Coaching via OpenAI
 *
 * Provides a chat interface backed by OpenAI function calling.
 * The model can create exercises and templates in the user's library
 * when the user approves a proposed workout plan.
 */

import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { workoutService } from "./workoutService";
import type { CoachCreatedItem, BlockMode } from "@/types";

// Lazy-init so missing key doesn't crash at import time
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

const MODEL = "gpt-4o";

// ---------- OpenAI tool definitions ----------

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_exercises",
      description:
        "Create one or more new exercises in the user's exercise library. Only call this after the user has explicitly approved the plan.",
      parameters: {
        type: "object",
        properties: {
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Exercise name" },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Muscle group / movement tags, e.g. ['push', 'chest']",
                },
                equipment: {
                  type: "string",
                  description: "Equipment needed, e.g. 'Barbell', 'Dumbbell', 'Bodyweight'",
                },
                formCues: {
                  type: "string",
                  description: "Brief form cues for the exercise",
                },
              },
              required: ["name", "tags"],
            },
          },
        },
        required: ["exercises"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_template",
      description:
        "Create a workout template with exercise blocks. Only call this after the user has explicitly approved the plan. Uses exercise names — new exercises should be created first with create_exercises.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Template name, e.g. 'Upper Push'" },
          description: { type: "string", description: "Brief description of the template" },
          blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exerciseName: {
                  type: "string",
                  description: "Exact name of an existing exercise",
                },
                mode: {
                  type: "string",
                  enum: ["REPS", "TIMED", "INTERVAL"],
                  description: "Block mode",
                },
                sets: { type: "number", description: "Number of sets" },
                repMin: { type: "number", description: "Minimum reps (REPS mode)" },
                repMax: { type: "number", description: "Maximum reps (REPS mode)" },
                seconds: { type: "number", description: "Duration in seconds (TIMED mode)" },
                workSeconds: { type: "number", description: "Work interval (INTERVAL mode)" },
                restSeconds: { type: "number", description: "Rest interval (INTERVAL mode)" },
                rounds: { type: "number", description: "Number of rounds (INTERVAL mode)" },
                targetRpe: { type: "number", description: "Target RPE 1-10" },
                notes: { type: "string", description: "Optional notes for this block" },
              },
              required: ["exerciseName", "mode", "sets"],
            },
          },
        },
        required: ["name", "blocks"],
      },
    },
  },
];

// ---------- Tool execution ----------

interface ToolResult {
  output: string;
  createdItems: CoachCreatedItem[];
}

async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  if (name === "create_exercises") {
    return executeCreateExercises(args);
  }
  if (name === "create_template") {
    return executeCreateTemplate(args);
  }
  return { output: `Unknown tool: ${name}`, createdItems: [] };
}

async function executeCreateExercises(
  args: Record<string, unknown>
): Promise<ToolResult> {
  const exercises = args.exercises as {
    name: string;
    tags: string[];
    equipment?: string;
    formCues?: string;
  }[];

  const created: CoachCreatedItem[] = [];
  for (const ex of exercises) {
    const result = await workoutService.createExercise({
      name: ex.name,
      tags: ex.tags,
      equipment: ex.equipment,
      formCues: ex.formCues,
    });
    created.push({ type: "exercise", name: result.name, id: result.id });
  }

  return {
    output: `Created ${created.length} exercise(s): ${created.map((c) => c.name).join(", ")}`,
    createdItems: created,
  };
}

async function executeCreateTemplate(
  args: Record<string, unknown>
): Promise<ToolResult> {
  const templateName = args.name as string;
  const description = (args.description as string) || undefined;
  const blocks = args.blocks as {
    exerciseName: string;
    mode: string;
    sets: number;
    repMin?: number;
    repMax?: number;
    seconds?: number;
    workSeconds?: number;
    restSeconds?: number;
    rounds?: number;
    targetRpe?: number;
    notes?: string;
  }[];

  // Resolve exercise names to IDs
  const allExercises = await workoutService.listExercises();
  const nameToId = new Map(allExercises.map((e) => [e.name.toLowerCase(), e.id]));

  const resolvedBlocks = blocks.map((b, i) => {
    const exerciseId = nameToId.get(b.exerciseName.toLowerCase());
    if (!exerciseId) {
      throw new Error(`Exercise not found: "${b.exerciseName}". Create it first.`);
    }
    return {
      exerciseId,
      order: i,
      mode: b.mode as BlockMode,
      sets: b.sets,
      repMin: b.repMin,
      repMax: b.repMax,
      seconds: b.seconds,
      workSeconds: b.workSeconds,
      restSeconds: b.restSeconds,
      rounds: b.rounds,
      targetRpe: b.targetRpe,
      notes: b.notes,
    };
  });

  const template = await workoutService.createTemplate({
    name: templateName,
    description,
    blocks: resolvedBlocks,
  });

  return {
    output: `Created template "${template.name}" with ${resolvedBlocks.length} exercise(s)`,
    createdItems: [{ type: "template", name: template.name, id: template.id }],
  };
}

// ---------- System prompt ----------

async function buildSystemPrompt(): Promise<string> {
  const [exercises, templates] = await Promise.all([
    workoutService.listExercises(),
    workoutService.listTemplates(),
  ]);

  const exerciseList = exercises.length > 0
    ? exercises.map((e) => `- ${e.name} [${e.tags.join(", ")}] (${e.equipment || "no equipment"})`).join("\n")
    : "(none yet)";

  const templateList = templates.length > 0
    ? templates
        .map((t) => {
          const blockNames = t.blocks.map((b: { exercise: { name: string } }) => b.exercise.name).join(", ");
          return `- ${t.name}: ${blockNames}`;
        })
        .join("\n")
    : "(none yet)";

  return `You are an experienced strength & conditioning coach helping a user design workout programs.

## User's Current Exercise Library
${exerciseList}

## User's Current Templates
${templateList}

## Guidelines
- Be conversational and helpful. Ask clarifying questions about goals, experience level, available equipment, and schedule.
- When proposing a workout plan, describe it clearly with exercise names, sets, rep ranges, and RPE targets.
- IMPORTANT: Always ask the user for explicit confirmation before creating anything. Say something like "Would you like me to save this to your templates?"
- When the user approves, use the provided tools to create exercises and templates. Create any new exercises FIRST using create_exercises, then create templates using create_template.
- Use exercise names that match existing exercises when possible. Only create new exercises for movements not already in the library.
- Stick to standard exercise names (e.g. "Barbell Back Squat" not "BB Squat").
- For rep-based exercises use mode REPS. For timed holds (planks, carries) use TIMED. For intervals (tabata, EMOM) use INTERVAL.
- Keep responses concise and focused on practical programming.`;
}

// ---------- Main chat method ----------

export interface CoachChatResponse {
  role: "assistant";
  content: string;
  createdItems?: CoachCreatedItem[];
}

export async function coachChat(
  messages: { role: "user" | "assistant"; content: string; images?: string[] }[]
): Promise<CoachChatResponse> {
  const openai = getOpenAI();
  const systemPrompt = await buildSystemPrompt();

  const openaiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m): ChatCompletionMessageParam => {
      if (m.role === "user" && m.images && m.images.length > 0) {
        return {
          role: "user",
          content: [
            ...m.images.map((url) => ({
              type: "image_url" as const,
              image_url: { url, detail: "auto" as const },
            })),
            { type: "text" as const, text: m.content },
          ],
        };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  let allCreatedItems: CoachCreatedItem[] = [];

  // Loop to handle tool calls (may need multiple round-trips)
  const MAX_ITERATIONS = 5;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: openaiMessages,
      tools,
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    if (!choice) throw new Error("No response from OpenAI");

    const message = choice.message;

    // If no tool calls, we're done — return the text
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        role: "assistant",
        content: message.content || "",
        createdItems: allCreatedItems.length > 0 ? allCreatedItems : undefined,
      };
    }

    // Execute tool calls
    openaiMessages.push(message);

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;
      let result: ToolResult;
      try {
        const args = JSON.parse(toolCall.function.arguments);
        result = await executeToolCall(toolCall.function.name, args);
        allCreatedItems.push(...result.createdItems);
      } catch (err) {
        result = {
          output: `Error: ${err instanceof Error ? err.message : String(err)}`,
          createdItems: [],
        };
      }

      openaiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.output,
      });
    }
    // Continue loop to get the model's follow-up after tool results
  }

  // Fallback if we hit max iterations
  return {
    role: "assistant",
    content: "I've finished creating your workout program! Check your Templates and Exercises pages to see everything.",
    createdItems: allCreatedItems.length > 0 ? allCreatedItems : undefined,
  };
}

// ---------- Legacy stubs (for future in-session coaching) ----------

export interface CoachSuggestion {
  type: "weight" | "reps" | "rest" | "form" | "schedule" | "general";
  message: string;
  confidence: number;
  data?: Record<string, unknown>;
}

export interface CoachService {
  suggestNextWeight(exerciseId: string, recentSets: unknown[]): Promise<CoachSuggestion | null>;
  suggestWarmup(templateId: string): Promise<CoachSuggestion[]>;
  analyzeSession(sessionId: string): Promise<CoachSuggestion[]>;
  generateInsights(userId: string): Promise<CoachSuggestion[]>;
  suggestSchedule(userId: string, weekStart: Date): Promise<CoachSuggestion[]>;
  analyzeCyclingRide(activityId: string): Promise<CoachSuggestion[]>;
}

export const coachService: CoachService = {
  async suggestNextWeight() { return null; },
  async suggestWarmup() { return []; },
  async analyzeSession() { return []; },
  async generateInsights() { return []; },
  async suggestSchedule() { return []; },
  async analyzeCyclingRide() { return []; },
};
