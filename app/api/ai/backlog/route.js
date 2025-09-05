// app/api/ai/backlog/route.js
import { NextResponse } from 'next/server';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';

export async function POST(req) {
  try {
    // Validate API key early
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        items: []
      }, { status: 500 });
    }
    
    // Derive origin from request URL
    const origin = new URL(req.url).origin;
    
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // GPT-5 JSON schema - simpler structure for compatibility
    const responseFormat = {
      type: "json_object"
    };

    const systemPrompt = `You are a product backlog generator. Generate 6-10 actionable backlog items.

Return a JSON object with this exact structure:
{
  "items": [
    {
      "title": "Short title (max 50 chars)",
      "description": "Clear description (max 200 chars)",
      "priority": "h|m|l"
    }
  ]
}

Each item should be specific, actionable, and deliver value.
Priority: h=high, m=medium, l=low based on business value.`;

    // Call OpenAI with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 2000,  // Increased to allow for reasoning + output
        response_format: responseFormat,
        reasoning_effort: 'low',  // GPT-5: minimize reasoning tokens
        // Note: verbosity conflicts with response_format in GPT-5
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate backlog' }, 
        { status: 500 }
      );
    }

    const aiData = await openaiResponse.json();
    console.log('Full AI response:', JSON.stringify(aiData));
    
    let backlogItems;
    
    try {
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) {
        console.error('No content in AI response. Full response:', JSON.stringify(aiData));
        return NextResponse.json(
          { error: 'Empty response from AI', details: aiData }, 
          { status: 500 }
        );
      }
      backlogItems = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Content was:', aiData.choices?.[0]?.message?.content);
      return NextResponse.json(
        { error: 'Invalid JSON from AI', content: aiData.choices?.[0]?.message?.content }, 
        { status: 500 }
      );
    }

    if (!backlogItems.items || !Array.isArray(backlogItems.items)) {
      return NextResponse.json(
        { error: 'No items generated' }, 
        { status: 500 }
      );
    }

    // Create cards in Backlog column
    const createdCards = [];
    const errors = [];

    for (const item of backlogItems.items) {
      try {
        const apiUrl = `${origin}/api/board/apply`;
        
        // Add timeout for internal API call
        const createController = new AbortController();
        const createTimeout = setTimeout(() => createController.abort(), 10000); // 10s timeout
        
        const createResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              op: 'create_card',
              args: {
                columnId: 'Backlog',
                title: item.title.substring(0, 50),
                description: item.description.substring(0, 200),
                priority: item.priority || 'm'
              }
            }),
            signal: createController.signal
          }
        );
        
        clearTimeout(createTimeout);

        if (createResponse.ok) {
          const result = await createResponse.json();
          createdCards.push({
            id: result.created,
            title: item.title,
            priority: item.priority
          });
        } else {
          const error = await createResponse.json();
          errors.push({
            title: item.title,
            error: error.error || 'Failed to create'
          });
        }
      } catch (err) {
        console.error(`Failed to create card: ${item.title}`, err);
        errors.push({
          title: item.title,
          error: err.message || 'Network error'
        });
      }
    }

    return NextResponse.json({
      generated: backlogItems.items.length,
      created: createdCards.length,
      cards: createdCards,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Backlog generation error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' }, 
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}