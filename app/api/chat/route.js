import { NextResponse } from "next/server";
import { getBoard } from "../../lib/board.js";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Support both message format and messages array
    let message;
    if (body.message) {
      message = body.message;
    } else if (body.messages && Array.isArray(body.messages)) {
      // Extract user message from messages array
      const userMessage = body.messages.find(m => m.role === 'user');
      message = userMessage ? userMessage.content : JSON.stringify(body.messages);
    } else {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }
    
    const providedBoard = body.board;
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || process.env.OPENAI_CHAT_MODEL || "gpt-5"; // GPT-5 is real!
    
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Prefer provided board context; otherwise fetch
    const board = providedBoard || await getBoard();
    
    // Call OpenAI Chat Completions with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are WordFlux AI. You help teams organize work and suggest workflow improvements. Be direct and actionable." },
          { role: "user", content: `Board state: ${JSON.stringify(board)}\nUser: ${message}` }
        ],
        max_completion_tokens: 2000,
        reasoning_effort: "minimal"
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    // Extract assistant text
    const responseText = data.choices?.[0]?.message?.content || "No response";

    return NextResponse.json({
      response: responseText,
      suggestions: extractSuggestions(responseText),
      model: data.model || model
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Chat failed" },
      { status: 500 }
    );
  }
}

function extractSuggestions(text) {
  const suggestions = [];
  
  // Extract action suggestions from the response
  if (text.includes("merge") || text.includes("Merge")) {
    suggestions.push({ type: "merge", text: "Consider merging similar columns" });
  }
  if (text.includes("WIP") || text.includes("limit")) {
    suggestions.push({ type: "wip", text: "Set WIP limits to improve flow" });
  }
  if (text.includes("move") || text.includes("Move")) {
    suggestions.push({ type: "move", text: "Move cards to appropriate columns" });
  }
  
  return suggestions;
}
