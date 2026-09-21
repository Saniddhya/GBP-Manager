import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PostSchema } from '@/lib/validations';
import { isZodError, zodErrorMessage } from '@/lib/api-errors';
import { rateLimit } from '@/lib/rate-limit';
import { invalidJsonResponse, isInvalidJsonBodyError, readJsonBody } from '@/lib/http';

/** Guards the OpenRouter quota against a single abusive account. */
const AI_RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = rateLimit(`ai:${session.userId}`, AI_RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonBody(req);
    const validated = PostSchema.parse(body);

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

    // No key material is logged: the previous debug block printed a prefix of the
    // API key on every single request.
    if (!OPENROUTER_API_KEY) {
      console.error('AI Generation Error: OPENROUTER_API_KEY is not configured.');
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
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
        const errData = await response.json().catch(() => null);
        // The provider payload is logged, never echoed back: it can contain
        // account, quota and billing details.
        console.error('OpenRouter API Error Response:', JSON.stringify(errData));
        return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
      }

      return NextResponse.json({ content }, { status: 200 });
    } catch (fetchError) {
      console.error('Fetch Error during AI Generation:', fetchError);
      return NextResponse.json({ error: 'AI service unreachable' }, { status: 502 });
    }
  } catch (error) {
    console.error('AI Generation Error:', error);

    if (isInvalidJsonBodyError(error)) {
      return invalidJsonResponse();
    }

    if (isZodError(error)) {
      return NextResponse.json(
        { error: zodErrorMessage(error) },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
