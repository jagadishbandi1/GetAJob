import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isDemo, DEMO_PARSED_RESUME } from '@/lib/demo';
import { rateLimit } from '@/lib/rate-limit';

// reuse the same client construction as lib/autofiller.ts (no args — reads
// ANTHROPIC_API_KEY from the environment) and the same haiku model id.
const client = new Anthropic();
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

interface ParsedResume {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  skills: string;
  experience_summary: string;
}

const EMPTY: ParsedResume = {
  full_name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  skills: '',
  experience_summary: '',
};

async function readFileContent(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8');
  }

  if (ext === 'pdf') {
    try {
      // pdf-parse v2 api: new PDFParse({ data }).getText() — the v1
      // callable-default export does not exist in this version.
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result.text?.trim() ?? '';
      if (text) return text;
    } catch {
      /* fall through to best-effort text decode below */
    }
  }

  // best-effort: decode as utf-8 and strip non-printable bytes. for unknown
  // formats (.doc/.docx) or pdfs that fail to parse this is imperfect but
  // still gives Claude something to work with.
  return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
}

export async function POST(req: NextRequest) {
  // Cap Anthropic spend from abuse; return sample data (no API call) on the demo.
  const limited = rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  if (isDemo()) return NextResponse.json(DEMO_PARSED_RESUME);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'expected a multipart form upload' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'no file provided' }, { status: 400 });
  }

  let content = '';
  try {
    content = await readFileContent(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `could not read file: ${msg}` }, { status: 500 });
  }

  if (!content) {
    return NextResponse.json({ error: 'file appears to be empty' }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract structured data from this resume. Return ONLY a JSON object with these exact keys:
- full_name: string
- email: string
- phone: string
- location: string
- linkedin: string (full url if present)
- website: string (personal site / portfolio url if present)
- skills: string (comma-separated list of key skills)
- experience_summary: string (a 1-2 sentence summary of work experience)

Use an empty string "" for anything not found. Return only the JSON, no explanation.

Resume:
${content.slice(0, 8000)}`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json(EMPTY);
    }

    let parsed: Partial<Record<keyof ParsedResume, unknown>>;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return NextResponse.json(EMPTY);
    }

    const out: ParsedResume = { ...EMPTY };
    (Object.keys(EMPTY) as (keyof ParsedResume)[]).forEach((key) => {
      const value = parsed[key];
      if (typeof value === 'string') out[key] = value;
    });

    return NextResponse.json(out);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `extraction failed: ${msg}` }, { status: 500 });
  }
}
