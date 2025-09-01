import { NextResponse } from "next/server";
import { getBoard } from "../../lib/board.js";

export async function POST(request) {
  try {
    const { message } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Get current board state
    const board = await getBoard();
    
    // Use GPT-5-mini with the NEW Responses API!
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: `You are the WordFlux AI agent using GPT-5. Help organize kanban boards.
Current board state: ${JSON.stringify(board)}

Be concise and suggest specific improvements like:
- Merging duplicate columns
- Setting WIP limits
- Moving cards to appropriate columns
- Cleaning up statuses

User question: ${message}`,
        text: { 
          verbosity: "medium"  // Control response length
        },
        reasoning: { 
          effort: "minimal"  // Fast responses without deep reasoning
        },
        max_output_tokens: 500
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "GPT-5 API error");
    }

    // Extract the text from GPT-5 response format
    const responseText = data.output?.find(o => o.type === "message")?.content?.[0]?.text || "No response";

    return NextResponse.json({
      response: responseText,
      suggestions: extractSuggestions(responseText),
      model: data.model || "gpt-5-mini"
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