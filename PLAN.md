# AI Coach V1 — Implementation Plan

## Scope
Conversational AI coach (OpenAI) that designs workout programs through chat. On user approval, it creates exercises and templates directly in the database. Ephemeral conversations (no DB persistence), confirmation before writes, non-streaming responses, scoped to exercise/template creation.

---

## 1. Install openai SDK

Add `openai` package to dependencies. The API key will be read from `OPENAI_API_KEY` env var (server-side only).

**File:** `package.json`

---

## 2. Add coach types

Add chat message types to the existing types file.

**File:** `src/types/index.ts`
```ts
// Coach chat
export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  /** Non-null when the assistant wants to create resources and is awaiting confirmation. */
  pendingActions?: CoachPendingAction[];
}

export interface CoachPendingAction {
  type: "create_exercises" | "create_template";
  data: Record<string, unknown>;
  label: string;           // human-readable summary, e.g. "Create template: Upper Push"
}
```

---

## 3. Add chat request validator

Add a Zod schema for the `/api/coach/chat` request body.

**File:** `src/lib/validators/index.ts`
```ts
export const coachChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).min(1),
});
```

---

## 4. Implement coachService

Replace the stub with a real implementation that calls OpenAI.

**File:** `src/lib/services/coachService.ts`

Key responsibilities:
- `chat(messages)` — the main method. Takes the conversation history, builds the OpenAI request with a system prompt and tool definitions, returns the assistant response.
- **System prompt** — Built dynamically. Calls `workoutService.listExercises()` and `workoutService.listTemplates()` to inject the user's current library as context. Instructs the model to act as a strength & conditioning coach and to use the provided tools when the user approves a plan.
- **OpenAI tools defined:**
  - `create_exercises` — params: `{ exercises: [{ name, tags, equipment, formCues }] }`. Backend handler calls `workoutService.createExercise()` for each.
  - `create_template` — params: `{ name, description, blocks: [{ exerciseName, mode, sets, repMin, repMax, seconds, workSeconds, restSeconds, rounds, targetRpe }] }`. Backend handler resolves exercise names to IDs (creating any missing exercises first), then calls `workoutService.createTemplate()`.
- **Tool execution loop** — When OpenAI returns a `tool_calls` response, execute each tool call against the existing service layer, feed the results back as `tool` messages, and call OpenAI again to get the final assistant text.
- Keep the existing `CoachSuggestion` interface and stub methods for now (they serve different future use-cases like in-session coaching). Add the new `chat()` method alongside them.

The tool definitions use `exerciseName` (not `exerciseId`) in `create_template` blocks so the model doesn't need to know database IDs — the service resolves names to IDs by matching against existing exercises or creating new ones.

---

## 5. Create API route

**File:** `src/app/api/coach/chat/route.ts`

```
POST /api/coach/chat
Body: { messages: [{ role, content }] }
Response: { message: { role: "assistant", content: string, pendingActions?: [...] } }
```

Steps:
1. Validate body with `coachChatSchema`
2. Call `coachService.chat(messages)`
3. Return the response message

Error handling:
- If `OPENAI_API_KEY` is not set, return 501 with a clear error
- If OpenAI returns an error, return 502

No streaming for v1 — the full response is returned in one JSON payload.

---

## 6. Build the Coach chat page

**File:** `src/app/coach/page.tsx`

Client component with:
- `messages` state array (`CoachMessage[]`)
- Text input + send button at the bottom (sticky)
- Messages rendered as a scrollable list (user messages right-aligned, coach left-aligned)
- On send: POST to `/api/coach/chat` with full message history, append response
- Loading state while waiting for response (show a typing indicator)
- When the response contains `pendingActions`, show an inline confirmation card:
  - Lists what will be created (e.g. "3 new exercises, 1 template: Push Day")
  - "Approve" and "Dismiss" buttons
  - On approve: send a follow-up message ("Yes, create them") which triggers the tool calls server-side
  - On dismiss: send "No, let's adjust" to continue the conversation

The confirmation flow works naturally through the conversation — no separate API needed. The model is instructed in its system prompt to ask for confirmation before calling create tools, and only call them after the user says yes.

---

## 7. Add Coach to bottom nav

**File:** `src/components/layout/bottom-nav.tsx`

Replace the Settings nav item with a Coach item (Sparkles icon from lucide-react, href `/coach`). Settings can be accessed from the coach page or dashboard later. This keeps the nav at 6 items and puts the new feature in a prominent position.

---

## Summary of files changed/created

| File | Action |
|---|---|
| `package.json` | Add `openai` dependency |
| `src/types/index.ts` | Add `CoachMessage`, `CoachPendingAction` types |
| `src/lib/validators/index.ts` | Add `coachChatSchema` |
| `src/lib/services/coachService.ts` | Replace stub with OpenAI chat + tool calling implementation |
| `src/app/api/coach/chat/route.ts` | New API route |
| `src/app/coach/page.tsx` | New chat UI page |
| `src/components/layout/bottom-nav.tsx` | Add Coach nav item |

No schema/migration changes. No changes to existing services — the coach calls them as-is.
