/**
 * AI ORCHESTRATOR - The "Developer Brain"
 * 
 * This module manages AI conversations for project generation.
 * It acts as an intelligent developer consultant that:
 * - Understands user ideas
 * - Asks clarifying questions
 * - Suggests MVP scope
 * - Generates projects with memory optimization
 */

import { prisma } from "@/lib/db";
import { calculateCreditCost } from "@/lib/pricing-config";
import { deductCredits } from "@/lib/credits";

// ============================================
// SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPTS = {
  // Phase 1: Discovery - Understanding the user's idea
  DISCOVERY: `You are an expert software developer consultant helping users build their dream applications.

Your role in this DISCOVERY phase:
1. Understand the user's project idea deeply
2. Ask clarifying questions about:
   - Target audience and use case
   - Key features they envision
   - Platform preference (web app, mobile app, or both)
   - Design preferences
   - Any specific technical requirements
3. Be friendly, encouraging, and professional
4. Ask 2-3 focused questions at a time (don't overwhelm)
5. Once you have enough information, acknowledge that you're ready to suggest an MVP

Available platforms:
- Next.js (for web apps - recommended for most cases)
- React (for single-page web apps)
- React Native (for mobile apps - iOS & Android)

Keep responses concise and conversational. You're having a friendly chat, not writing documentation.`,

  // Phase 2: Planning - Suggesting MVP scope
  PLANNING: `You are an expert software architect planning an MVP (Minimum Viable Product).

Your role in this PLANNING phase:
1. Based on the user's requirements, suggest a focused MVP scope
2. Recommend the best technology stack (Next.js, React, or React Native)
3. List 4-6 core features that deliver the most value
4. Suggest a clean, modern design approach
5. Estimate complexity and development time
6. Get user approval before proceeding

MVP Principles:
- Focus on core features that solve the main problem
- Suggest modern, clean UI/UX
- Recommend proven tech stacks
- Keep it achievable and deployable

Format your MVP proposal clearly:
**Project Name:** [Name]
**Platform:** [Next.js/React/React Native]
**Core Features:**
1. [Feature 1]
2. [Feature 2]
...

**Tech Stack:** [List key technologies]
**Timeline:** [Estimated time]

Ask: "Does this MVP sound good? Any changes you'd like?"`,

  // Phase 3: Generation - Building the project
  GENERATION: `You are an expert full-stack developer executing a project build.

Your role in this GENERATION phase:
1. Confirm the final requirements with the user
2. Explain the build steps you'll take
3. Keep the user informed of progress
4. Generate clean, production-ready code
5. Follow best practices for the chosen stack

Key principles:
- Write clean, well-structured code
- Use modern best practices
- Include proper error handling
- Make it responsive and user-friendly
- Add helpful comments

You will work with build automation tools to scaffold and generate the project.
Focus on explaining what you're doing in simple terms.`,
};

// ============================================
// CONTEXT SUMMARIZATION FOR MEMORY OPTIMIZATION
// ============================================

/**
 * Intelligently summarize conversation history to reduce token usage
 * This keeps costs low while maintaining context
 */
export async function summarizeConversation(
  messages: { role: string; content: string }[],
  userId: string
): Promise<string> {
  // Only summarize if we have more than 10 messages
  if (messages.length <= 10) {
    return JSON.stringify(messages);
  }

  // Use AI to create a concise summary of the conversation
  const summaryPrompt = `Summarize this conversation between a user and an AI consultant planning a software project.

Focus on:
1. Project idea and goals
2. Key requirements and features
3. Technology choices
4. Any important decisions made

Keep it concise (under 500 words).

Conversation:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n\n")}`;

  const response = await callLLM(
    [
      { role: "system", content: "You are a helpful assistant that creates concise summaries." },
      { role: "user", content: summaryPrompt },
    ],
    userId,
    { maxTokens: 1000, temperature: 0.3 }
  );

  return response.content;
}

// ============================================
// LLM API INTERFACE
// ============================================

interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface LLMResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  creditCost: number;
}

/**
 * Call the LLM API with automatic cost tracking
 */
export async function callLLM(
  messages: { role: string; content: string }[],
  userId: string,
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const { maxTokens = 3000, temperature = 0.7, stream = false } = options;

  // Call OpenAI-compatible API (can use OpenAI or Anthropic)
  const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // Use GPT-4o for better code generation
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false, // For now, we'll use non-streaming for orchestration
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const inputTokens = data.usage.prompt_tokens;
  const outputTokens = data.usage.completion_tokens;
  const totalTokens = inputTokens + outputTokens;

  // Calculate cost
  const creditCost = calculateCreditCost(inputTokens, outputTokens);

  // Deduct credits
  await deductCredits(
    userId,
    creditCost,
    `AI orchestration (${totalTokens} tokens)`,
    {
      inputTokens,
      outputTokens,
      totalTokens,
      model: "gpt-4o",
    }
  );

  return {
    content,
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    },
    creditCost,
  };
}

// ============================================
// PROJECT PHASE MANAGEMENT
// ============================================

export type ProjectPhase = "discovery" | "planning" | "generation" | "ready";

/**
 * Get the appropriate system prompt for the current phase
 */
export function getSystemPrompt(phase: ProjectPhase): string {
  switch (phase) {
    case "discovery":
      return SYSTEM_PROMPTS.DISCOVERY;
    case "planning":
      return SYSTEM_PROMPTS.PLANNING;
    case "generation":
      return SYSTEM_PROMPTS.GENERATION;
    default:
      return SYSTEM_PROMPTS.DISCOVERY;
  }
}

/**
 * Determine if we should move to the next phase based on conversation
 */
export function shouldAdvancePhase(
  currentPhase: ProjectPhase,
  conversationHistory: { role: string; content: string }[]
): { shouldAdvance: boolean; nextPhase?: ProjectPhase; reason?: string } {
  const lastMessages = conversationHistory.slice(-5).map((m) => m.content.toLowerCase());
  const lastMessage = lastMessages[lastMessages.length - 1] || "";

  switch (currentPhase) {
    case "discovery":
      // Move to planning if user seems ready or AI has enough info
      if (
        lastMessage.includes("ready") ||
        lastMessage.includes("sounds good") ||
        lastMessage.includes("let's go") ||
        lastMessage.includes("that's all") ||
        conversationHistory.length > 8
      ) {
        return {
          shouldAdvance: true,
          nextPhase: "planning",
          reason: "Sufficient information gathered",
        };
      }
      break;

    case "planning":
      // Move to generation if MVP is approved
      if (
        lastMessage.includes("approved") ||
        lastMessage.includes("yes") ||
        lastMessage.includes("sounds good") ||
        lastMessage.includes("let's do it") ||
        lastMessage.includes("proceed") ||
        lastMessage.includes("go ahead")
      ) {
        return {
          shouldAdvance: true,
          nextPhase: "generation",
          reason: "MVP approved by user",
        };
      }
      break;

    case "generation":
      // This phase is handled by build automation
      return { shouldAdvance: false };

    default:
      return { shouldAdvance: false };
  }

  return { shouldAdvance: false };
}

// ============================================
// INTELLIGENT CONTEXT MANAGEMENT
// ============================================

/**
 * Build an optimized message history for the LLM
 * This reduces token usage while maintaining quality
 */
export function buildOptimizedContext(
  phase: ProjectPhase,
  conversationHistory: { role: string; content: string }[],
  conversationSummary?: string | null
): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [];

  // Always start with the system prompt for current phase
  messages.push({
    role: "system",
    content: getSystemPrompt(phase),
  });

  // If we have a summary, use it instead of old messages
  if (conversationSummary && conversationHistory.length > 10) {
    messages.push({
      role: "system",
      content: `Previous conversation summary: ${conversationSummary}`,
    });

    // Include only the last 5 messages for immediate context
    messages.push(...conversationHistory.slice(-5));
  } else {
    // Include all messages if conversation is still short
    messages.push(...conversationHistory);
  }

  return messages;
}
