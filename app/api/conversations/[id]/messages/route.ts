import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCreditBalance, deductCredits } from "@/lib/credits";
import { calculateCreditCost } from "@/lib/pricing-config";
import { getOrCreatePrismaUser } from "@/lib/supabaseAuth";
import { summarizeConversation } from "@/lib/ai-orchestrator";
import { extractMemoriesFromMessage, getUserMemories, saveUserMemory } from "@/lib/memory";
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
        "You are a friendly technical assistant who specializes in technology topics including programming, AI, servers, VPS, cloud computing, gaming, blockchain, automation, and digital projects. Your goal is to help users understand these topics and solve their problems, guiding them from beginner to advanced levels.\n\nCore rules:\n- Always respond in the same language as the user.\n- Be natural and conversational, not corporate.\n- Keep answers clear and practical.\n- Do NOT include analysis, tags, or meta-explanations. Output only the final message body.",
      concept:
        "You are Turion, a helpful AI assistant. Be clear, friendly, and concise.",
      deep:
        "You are Turion Deep Agent. Convert the provided plan into concrete technical steps and code-ready structure. Be precise, avoid fluff, and follow best practices for scalable systems.",
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.chat;

    const memoryCandidates = extractMemoriesFromMessage(content);
    if (memoryCandidates.length > 0) {
      for (const candidate of memoryCandidates) {
        await saveUserMemory(user.id, candidate);
      }
    }

    const history = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Update memory summary periodically when history grows
    if (history.length >= 10 && history.length % 10 === 0) {
      try {
        const summary = await summarizeConversation(
          [...history, { role: "user", content }],
          user.id
        );
        await prisma.conversation.update({
          where: { id },
          data: { conversationSummary: summary },
        });
        conversation.conversationSummary = summary;
      } catch (summaryError) {
        console.error("Summary update failed:", summaryError);
      }
    }

    // Prepare messages for LLM with memory summary
    const memories = await getUserMemories(user.id, 6);
    const memoryBlock =
      memories.length > 0
        ? `Saved user memory:\n${memories
            .map((m) => `- (${m.kind}) ${m.content}`)
            .join("\n")}`
        : null;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...(memoryBlock
        ? [
            {
              role: "system",
              content: memoryBlock,
            },
          ]
        : []),
      ...(conversation.conversationSummary && history.length > 10
        ? [
            {
              role: "system",
              content: `Previous conversation summary: ${conversation.conversationSummary}`,
            },
            ...history.slice(-6),
          ]
        : history),
      {
        role: "user",
        content,
      },
    ];

    const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
    const maxTokens = mode === "chat" ? 20000 : 3000;
    const userLabel =
      (user?.name || user?.email || "User").split(" ")[0].trim();

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
        let sentPrefix = false;
        let inAnalysis = false;

        const sendError = (message: string) => {
          const payload = JSON.stringify({ error: message });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        };
        const emitText = (text: string) => {
          if (!text) return;
          if (!sentPrefix && mode === "chat") {
            const prefix = `${userLabel}, `;
            const data = JSON.stringify({
              choices: [{ delta: { content: prefix } }],
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            assistantContent += prefix;
            sentPrefix = true;
          }
          const data = JSON.stringify({
            choices: [{ delta: { content: text } }],
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          assistantContent += text;
        };
        const sanitizeChunk = (chunk: string) => {
          if (!chunk) return "";
          let text = chunk;
          if (mode === "chat") {
            if (text.includes("<analysis>")) {
              inAnalysis = true;
              text = text.split("<analysis>").pop() || "";
            }
            if (inAnalysis) {
              if (text.includes("</analysis>")) {
                inAnalysis = false;
                text = text.split("</analysis>").pop() || "";
              } else {
                return "";
              }
            }
            text = text.replace(/<response>/g, "").replace(/<\/response>/g, "");
          }
          return text;
        };

        try {
          const useOpenAI = provider === "openai";
          const useGrok = provider === "grok";

          if (useOpenAI && !process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key is missing");
          }

          if (useGrok && !process.env.GROK_API_KEY) {
            throw new Error("Grok API key is missing");
          }

          if (!useOpenAI && !useGrok && !process.env.ANTHROPIC_API_KEY) {
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
                const cleaned = sanitizeChunk(deltaText);
                emitText(cleaned);

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
                    const cleaned = sanitizeChunk(deltaText);
                    emitText(cleaned);
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
          } else if (useGrok) {
            // TODO: add Grok streaming when enabled
            throw new Error("Grok provider is configured but not enabled yet.");
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
                const cleaned = sanitizeChunk(deltaText);
                emitText(cleaned);
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

          if (!sentPrefix && mode === "chat") {
            const prefix = `${userLabel}, `;
            assistantContent = prefix + assistantContent;
            sentPrefix = true;
          }

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
