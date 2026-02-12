/**
 * coachService — AI Coaching Integration (NOT IMPLEMENTED IN V1)
 *
 * This service will provide AI-powered coaching features in future versions.
 * All methods are stubbed with TODO markers for future implementation.
 *
 * Planned capabilities:
 * - Workout programming suggestions based on history
 * - Form cue reminders during sessions
 * - Progressive overload recommendations
 * - Recovery and scheduling advice
 * - Session analysis and feedback
 * - Cycling training zone recommendations
 */

export interface CoachSuggestion {
  type: "weight" | "reps" | "rest" | "form" | "schedule" | "general";
  message: string;
  confidence: number; // 0-1
  data?: Record<string, unknown>;
}

export interface CoachService {
  // TODO: Implement with AI provider (OpenAI, Anthropic, etc.)
  suggestNextWeight(exerciseId: string, recentSets: unknown[]): Promise<CoachSuggestion | null>;
  suggestWarmup(templateId: string): Promise<CoachSuggestion[]>;
  analyzeSession(sessionId: string): Promise<CoachSuggestion[]>;
  generateInsights(userId: string): Promise<CoachSuggestion[]>;
  suggestSchedule(userId: string, weekStart: Date): Promise<CoachSuggestion[]>;
  analyzeCyclingRide(activityId: string): Promise<CoachSuggestion[]>;
}

// Stub implementation for v1
export const coachService: CoachService = {
  async suggestNextWeight() {
    // TODO: Implement AI-based weight progression
    return null;
  },
  async suggestWarmup() {
    // TODO: Implement AI warm-up suggestions
    return [];
  },
  async analyzeSession() {
    // TODO: Implement AI post-workout analysis
    return [];
  },
  async generateInsights() {
    // TODO: Implement AI-powered insights
    return [];
  },
  async suggestSchedule() {
    // TODO: Implement AI schedule optimization
    return [];
  },
  async analyzeCyclingRide() {
    // TODO: Implement AI cycling analysis
    return [];
  },
};
