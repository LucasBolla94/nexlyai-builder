import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCreditBalance, deductCredits } from "@/lib/credits";
import { calculateCreditCost } from "@/lib/pricing-config";
import { getOrCreatePrismaUser } from "@/lib/supabaseAuth";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// GET /api/conversations/[id]/messages - Get all messages for a conversation
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreatePrismaUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "chat";

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message and get AI response
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreatePrismaUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "chat";
    const { content } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 }
      );
    }

    // Verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: id,
        role: "user",
        content,
      },
    });

    const normalizedTitle = content.trim().replace(/\s+/g, " ").slice(0, 80);
    if (normalizedTitle && conversation.title === "New Chat") {
      await prisma.conversation.update({
        where: { id },
        data: { title: normalizedTitle },
      });
    }

    const systemPrompts: Record<string, string> = {
      chat:
        "You are Turion, a helpful AI assistant. Be clear, friendly, and concise.",
      concept:
        "You are Turion, a highly helpful full-stack architect and engineer who specializes in helping beginners turn vague ideas into well-structured, scalable projects. Your core strengths are patience, clear communication, and the ability to make technical concepts accessible through concrete examples and analogies.\n\nYour Core Responsibilities:\n- Help beginners who may have little to no technical background\n- Transform vague concepts into concrete, actionable project plans\n- Explain all technical decisions in simple, jargon-free language\n- Propose clean, scalable folder structures\n- Provide practical, specific advice with real-world examples (never generic platitudes)\n- Ask clarifying questions to understand the project better when information is missing\n- Be patient, encouraging, and action-oriented\n- Use analogies and concrete examples to make concepts easy to understand\n\nCritical Language Requirement:\nYou MUST respond in the same language the user uses in their project idea.\n\nYour response must follow EXACTLY 5 sections:\n1) Understanding of the Idea (2-4 lines)\n2) Essential Questions (3-5 short, direct questions with context)\n3) Proposed Project Structure (tree + brief explanations)\n4) Implementation Checklist (6-10 numbered steps)\n5) Clean Code & Scalability Observations (3-5 practical tips with examples)",
      deep:
        "You are Turion Deep Agent. Convert the provided plan into concrete technical steps and code-ready structure. Be precise, avoid fluff, and follow best practices for scalable systems.",
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.chat;

    // Prepare messages for LLM
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content,
      },
    ];

    const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
    const maxTokens = 3000;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const anthropicModel = process.env.ANTHROPIC_MODEL || "sonnet-4.5";
    const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Buffer to accumulate the complete assistant response
    let assistantContent = "";
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let streamResponse;
        let hasErrored = false;

        const sendError = (message: string) => {
          const payload = JSON.stringify({ error: message });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        };

        try {
          const useOpenAI = provider === "openai";

          if (useOpenAI && !process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key is missing");
          }

          if (!useOpenAI && !process.env.ANTHROPIC_API_KEY) {
            throw new Error("Anthropic API key is missing");
          }

          if (useOpenAI) {
            try {
              const openaiStream = await openai.chat.completions.create({
                model: openaiModel,
                messages: messages.map((msg) => ({
                  role: msg.role as "system" | "user" | "assistant",
                  content: msg.content,
                })),
                stream: true,
                stream_options: { include_usage: true },
                max_tokens: maxTokens,
              });

              for await (const chunk of openaiStream) {
                const deltaText = chunk.choices?.[0]?.delta?.content || "";
                if (deltaText) {
                  assistantContent += deltaText;
                  const data = JSON.stringify({
                    choices: [{ delta: { content: deltaText } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }

                if (chunk.usage) {
                  totalInputTokens =
                    chunk.usage.prompt_tokens || totalInputTokens;
                  totalOutputTokens =
                    chunk.usage.completion_tokens || totalOutputTokens;
                }
              }
            } catch (openaiError) {
              if (process.env.ANTHROPIC_API_KEY) {
                streamResponse = await anthropic.messages.stream({
                  model: anthropicModel,
                  max_tokens: maxTokens,
                  messages: messages.map((msg) => ({
                    role: msg.role === "assistant" ? "assistant" : "user",
                    content: msg.content,
                  })),
                });

                for await (const event of streamResponse) {
                  if (event.type === "content_block_delta") {
                    const deltaText = event.delta?.text || "";
                    if (deltaText) {
                      assistantContent += deltaText;
                      const data = JSON.stringify({
                        choices: [{ delta: { content: deltaText } }],
                      });
                      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }
                  }

                  if (event.type === "message_delta" && event.usage) {
                    totalInputTokens =
                      event.usage.input_tokens || totalInputTokens;
                    totalOutputTokens =
                      event.usage.output_tokens || totalOutputTokens;
                  }
                }
              } else {
                throw openaiError;
              }
            }
          } else {
            streamResponse = await anthropic.messages.stream({
              model: anthropicModel,
              max_tokens: maxTokens,
              messages: messages.map((msg) => ({
                role: msg.role === "assistant" ? "assistant" : "user",
                content: msg.content,
              })),
            });

            for await (const event of streamResponse) {
              if (event.type === "content_block_delta") {
                const deltaText = event.delta?.text || "";
                if (deltaText) {
                  assistantContent += deltaText;
                  const data = JSON.stringify({
                    choices: [{ delta: { content: deltaText } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              }

              if (event.type === "message_delta" && event.usage) {
                totalInputTokens = event.usage.input_tokens || totalInputTokens;
                totalOutputTokens = event.usage.output_tokens || totalOutputTokens;
              }
            }
          }

          const creditCost = calculateCreditCost(
            totalInputTokens,
            totalOutputTokens
          );

          const assistantMessage = await prisma.message.create({
            data: {
              conversationId: id,
              role: "assistant",
              content: assistantContent,
              tokensUsed: totalInputTokens + totalOutputTokens,
              creditCost: creditCost,
            },
          });

          try {
            await deductCredits(
              user.id,
              creditCost,
              `AI message (${totalInputTokens + totalOutputTokens} tokens)`,
              {
                messageId: assistantMessage.id,
                conversationId: id,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                totalTokens: totalInputTokens + totalOutputTokens,
              }
            );
          } catch (creditError) {
            console.error("Error deducting credits:", creditError);
          }

          await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
          });

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (error) {
          console.error("Stream error:", error);
          hasErrored = true;
          sendError("LLM stream failed");
        } finally {
          if (!hasErrored) {
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
