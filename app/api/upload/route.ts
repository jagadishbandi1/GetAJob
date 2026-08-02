import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isDemo } from '@/lib/demo';
import { rateLimit } from '@/lib/rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  // Prod demo: don't accept or store uploaded files.
  if (isDemo()) {
    return NextResponse.json({ ok: true, demo: true, preview: 'this is a demo — run locally to upload your real resume.' });
  }
  const sql = getDb();
  await initDb();
  const formData = await req.formData();
  const type = formData.get('type') as string;
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase();

  let content = '';

  if (fileExt === 'pdf') {
    try {
      // pdf-parse v2 api: new PDFParse({ data }).getText() — the v1 callable
      // default export does not exist in this version and throws at runtime.
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      content = result.text?.trim() || '';
      if (!content) throw new Error('Empty PDF');
    } catch {
      content = `[PDF: ${fileName}] — Could not extract text. Try saving as .txt for best results.`;
    }
  } else if (fileExt === 'txt' || fileExt === 'md') {
    content = buffer.toString('utf-8');
  } else {
    content = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
  }

  if (type === 'resume') {
    // Persist the raw file (base64) + mime so the autofiller can attach it.
    const fileData = buffer.toString('base64');
    const fileType = file.type || (fileExt === 'pdf' ? 'application/pdf' : 'application/octet-stream');
    await sql`
      UPDATE profile
      SET resume_text=${content}, resume_file_name=${fileName},
          resume_file_data=${fileData}, resume_file_type=${fileType}
      WHERE id=1
    `;

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Extract contact info from this resume. Return ONLY a JSON object with keys: full_name, email, phone, location, linkedin, website. Use empty string "" if not found.\n\nResume:\n${content.slice(0, 3000)}`,
        }],
      });
      const raw = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: Record<string, string> = JSON.parse(jsonMatch[0]);
        const allowed = ['full_name', 'email', 'phone', 'location', 'linkedin', 'website'] as const;
        for (const key of allowed) {
          if (parsed[key]) {
            if (key === 'full_name') await sql`UPDATE profile SET full_name=${parsed[key]} WHERE id=1`;
            if (key === 'email') await sql`UPDATE profile SET email=${parsed[key]} WHERE id=1`;
            if (key === 'phone') await sql`UPDATE profile SET phone=${parsed[key]} WHERE id=1`;
            if (key === 'location') await sql`UPDATE profile SET location=${parsed[key]} WHERE id=1`;
            if (key === 'linkedin') await sql`UPDATE profile SET linkedin=${parsed[key]} WHERE id=1`;
            if (key === 'website') await sql`UPDATE profile SET website=${parsed[key]} WHERE id=1`;
          }
        }
      }
    } catch { /* profile extraction failed — upload still succeeds */ }

    return NextResponse.json({ ok: true, fileName, preview: content.slice(0, 200) });
  }

  if (type === 'document') {
    await sql`INSERT INTO documents (name, file_type, content) VALUES (${fileName}, ${fileExt ?? ''}, ${content})`;
    return NextResponse.json({ ok: true, fileName });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
