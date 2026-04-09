import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const db = getDb();
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
    // Store raw for now — PDF text extraction requires native deps
    content = `[PDF: ${fileName}] — PDF text extraction not yet available. Upload a .txt version for best results.`;
  } else {
    content = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
  }

  if (type === 'resume') {
    db.prepare(`UPDATE profile SET resume_text=?, resume_file_name=? WHERE id=1`).run(content, fileName);

    // Use Claude to extract profile fields from resume text
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Extract contact info from this resume. Return ONLY a JSON object with these keys: full_name, email, phone, location, linkedin, website. Use empty string "" for any field not found.\n\nResume:\n${content.slice(0, 3000)}`,
        }],
      });
      const raw = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: Record<string, string> = JSON.parse(jsonMatch[0]);
        const allowed = ['full_name', 'email', 'phone', 'location', 'linkedin', 'website'];
        const updates: string[] = [];
        const values: string[] = [];
        for (const key of allowed) {
          if (parsed[key]) { updates.push(`${key}=?`); values.push(parsed[key]); }
        }
        if (updates.length > 0) {
          db.prepare(`UPDATE profile SET ${updates.join(', ')} WHERE id=1`).run(...values);
        }
      }
    } catch {
      // Parsing failed — profile fields stay as-is, upload still succeeds
    }

    return NextResponse.json({ ok: true, fileName, preview: content.slice(0, 200) });
  }

  if (type === 'document') {
    db.prepare('INSERT INTO documents (name, file_type, content) VALUES (?, ?, ?)').run(fileName, fileExt, content);
    return NextResponse.json({ ok: true, fileName });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
