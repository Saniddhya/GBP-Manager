import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PostSchema } from '@/lib/validations';
import { isZodError, zodErrorMessage } from '@/lib/api-errors';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = PostSchema.parse(body);

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

    console.log('--- AI Route Debug ---');
    console.log('Model:', OPENROUTER_MODEL);
    console.log('API Key loaded:', OPENROUTER_API_KEY ? `Yes (Starts with ${OPENROUTER_API_KEY.substring(0, 5)}...)` : 'No');
    console.log('----------------------');

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'AI configuration missing' }, { status: 500 });
    }

    const prompt = `
You are a local business marketing copywriter.
Create one Google Business Profile post using the details below.

Business: ${validated.businessName || 'The Business'}
City: ${validated.locationCity || 'the city'}
Topic: ${validated.topic}
Post type: ${validated.postType}
Tone: ${validated.tone}
Language: ${validated.language}
CTA: ${validated.cta}

Requirements:
- Write clear, natural promotional copy.
- Mention the business and city naturally.
- Avoid unsupported claims.
- Do not invent prices, phone numbers, dates, or guarantees.
- Keep the post concise.
- Do not include markdown, headings, or quotation marks.
- Return only the post content.
    `;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'GBP Post Manager',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('OpenRouter API Error Response:', JSON.stringify(errData));
        return NextResponse.json({ error: `AI Error: ${errData.error?.message || 'Unknown error'}` }, { status: response.status });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
      }

      return NextResponse.json({ content }, { status: 200 });
    } catch (fetchError: any) {
      console.error('Fetch Error during AI Generation:', fetchError);
      return NextResponse.json({ error: 'AI service unreachable' }, { status: 500 });
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    if (isZodError(error)) {
      return NextResponse.json(
        { error: zodErrorMessage(error) },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
