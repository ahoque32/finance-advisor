import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, ChatMessage } from "@/lib/gemini";
import { classifyQuestion } from "@/lib/classifier";
import { buildContext } from "@/lib/context-builder";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Classify the question to determine what data to fetch
    const questionType = classifyQuestion(message);

    // Build context from real transaction data
    const dataContext = buildContext(questionType, message);

    // Construct messages array
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n## Your Transaction Data\n${dataContext}`,
      },
    ];

    // Add conversation history (last 10 messages)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add the current user message
    messages.push({
      role: "user",
      content: message,
    });

    // Call Gemini
    const response = await chatCompletion(messages);

    return NextResponse.json({
      response,
      questionType,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
