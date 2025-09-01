import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const model = process.env.OPENAI_REALTIME_MODEL || "gpt-5-mini-realtime";

  // Create a session with GPT-5
  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      model: model,
      instructions: "You are the WordFlux agent using GPT-5. Be concise, proactive, minimalist. Propose board improvements (merge columns, set WIP limits, move cards) and explain briefly when asked.",
      tools: [{
        type: "function",
        name: "apply_board_change",
        description: "Apply a structural change to the kanban board",
        parameters: {
          type: "object",
          properties: {
            op: { type: "string", enum: ["merge_columns","set_wip_limit","move_card"] },
            args: { type: "object" }
          },
          required: ["op","args"]
        }
      }]
    })
  });

  const data = await r.json();
  return NextResponse.json(data);
}
