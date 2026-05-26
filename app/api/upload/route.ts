import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
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
  if (fileExt === 'txt' || fileExt === 'md') {
    content = buffer.toString('utf-8');
  } else if (fileExt === 'pdf') {
    content = `[PDF: ${fileName}] — PDF text extraction not yet available. Upload a .txt version for best results.`;
  } else {
    content = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
  }

  if (type === 'resume') {
    await sql`UPDATE profile SET resume_text=${content}, resume_file_name=${fileName} WHERE id=1`;

    // Use Claude to extract profile fields
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
    } catch {
      // Parsing failed — upload still succeeds
    }

    return NextResponse.json({ ok: true, fileName, preview: content.slice(0, 200) });
  }

  if (type === 'document') {
    await sql`INSERT INTO documents (name, file_type, content) VALUES (${fileName}, ${fileExt ?? ''}, ${content})`;
    return NextResponse.json({ ok: true, fileName });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
