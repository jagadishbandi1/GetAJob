import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from './db';

const client = new Anthropic();

export interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  resume_text: string;
  free_context: string;
}

export interface ContextRule {
  trigger_keyword: string;
  response: string;
}

export interface AutofillJob {
  jobUrl: string;
  appId: number | bigint;
  profile: Profile;
  contextRules: ContextRule[];
  accounts: { platform: string; email: string; password: string }[];
}

export async function runAutofiller(job: AutofillJob, onLog: (msg: string) => void) {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    onLog(`Navigating to ${job.jobUrl}`);
    await page.goto(job.jobUrl, { waitUntil: 'networkidle' });

    const pageContent = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => {
        const input = el as HTMLInputElement;
        return {
          tag: el.tagName,
          type: input.type || '',
          name: input.name || '',
          id: input.id || '',
          placeholder: input.placeholder || '',
          label: getLabelText(el),
          required: input.required,
        };
      });

      function getLabelText(el: Element): string {
        const id = el.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return label.textContent?.trim() || '';
        }
        const parent = el.closest('label');
        if (parent) return parent.textContent?.trim() || '';
        return '';
      }

      return {
        title: document.title,
        url: window.location.href,
        inputs,
        bodyText: document.body.innerText.slice(0, 3000),
      };
    });

    // Load training examples and documents
    const db = getDb();

    // Extract job metadata
    try {
      const metaRes = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Extract from this job posting. Return ONLY a JSON object with keys: job_title, company, location, compensation. Use empty string "" if not found.\n\nTitle: ${pageContent.title}\n\n${pageContent.bodyText}`,
        }],
      });
      const metaRaw = metaRes.content[0].type === 'text' ? metaRes.content[0].text : '';
      const metaMatch = metaRaw.match(/\{[\s\S]*\}/);
      if (metaMatch) {
        const meta = JSON.parse(metaMatch[0]);
        db.prepare(`UPDATE applications SET job_title=?, company=?, location=?, compensation=? WHERE id=?`)
          .run(meta.job_title || '', meta.company || '', meta.location || '', meta.compensation || '', job.appId);
      }
    } catch {
      // Metadata extraction failed — continue with form fill
    }

    onLog(`Found ${pageContent.inputs.length} form fields. Asking Claude how to fill them...`);
    const documents = db.prepare('SELECT name, content FROM documents').all() as { name: string; content: string }[];
    const documentsText = documents.length > 0
      ? `Reference documents (use this info to answer application questions):\n${documents.map(d => `--- ${d.name} ---\n${d.content}`).join('\n\n')}`
      : '';

    const trainingExamples = db.prepare(
      'SELECT question_text, answer_given FROM training_examples ORDER BY created_at DESC LIMIT 30'
    ).all() as { question_text: string; answer_given: string }[];

    const trainingText = trainingExamples.length > 0
      ? `Past answers I've given (learn from these to stay consistent):\n${trainingExamples.map(e => `Q: ${e.question_text}\nA: ${e.answer_given}`).join('\n\n')}`
      : '';

    const contextRulesText = job.contextRules.length > 0
      ? `Custom rules:\n${job.contextRules.map(r => `- If question is about "${r.trigger_keyword}", respond with: ${r.response}`).join('\n')}`
      : '';

    const freeContextText = job.profile.free_context
      ? `Additional context from user:\n${job.profile.free_context}`
      : '';

    const prompt = `You are helping fill out a job application. Be consistent with past answers and use all available context.

${documentsText}


User profile:
- Name: ${job.profile.full_name}
- Email: ${job.profile.email}
- Phone: ${job.profile.phone}
- Location: ${job.profile.location}
- LinkedIn: ${job.profile.linkedin}
- Website: ${job.profile.website}
- Resume: ${job.profile.resume_text}

${freeContextText}

${contextRulesText}

${trainingText}

Page title: ${pageContent.title}
Page URL: ${pageContent.url}

Form fields:
${JSON.stringify(pageContent.inputs, null, 2)}

Return a JSON array of fill instructions. Each item:
- selector: CSS selector ("#field-id" or "[name='fieldname']")
- value: what to type or select
- action: "fill" | "select" | "check"
- question_label: the human-readable label of the field (for training)

Only include fields you have data for. Skip file upload inputs.
Return ONLY the JSON array, no explanation.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    let instructions: { selector: string; value: string; action: string; question_label?: string }[] = [];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        instructions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      onLog('Warning: Could not parse Claude response as JSON');
    }

    onLog(`Claude generated ${instructions.length} fill instructions. Filling form...`);

    for (const instruction of instructions) {
      try {
        if (instruction.action === 'fill') {
          await page.fill(instruction.selector, instruction.value);
          onLog(`Filled "${instruction.question_label || instruction.selector}" → "${instruction.value}"`);
        } else if (instruction.action === 'select') {
          await page.selectOption(instruction.selector, instruction.value);
          onLog(`Selected "${instruction.value}" for "${instruction.question_label || instruction.selector}"`);
        } else if (instruction.action === 'check') {
          await page.check(instruction.selector);
          onLog(`Checked "${instruction.question_label || instruction.selector}"`);
        }

        // Save to training examples
        if (instruction.question_label && instruction.value) {
          db.prepare(
            'INSERT INTO training_examples (question_text, answer_given, job_url) VALUES (?, ?, ?)'
          ).run(instruction.question_label, instruction.value, job.jobUrl);
        }

        await page.waitForTimeout(300);
      } catch {
        onLog(`Skipped "${instruction.question_label || instruction.selector}": not found or not interactable`);
      }
    }

    onLog('Form filled. Review the browser window and submit manually.');
    await page.waitForTimeout(30000);

    return { success: true, log: 'Completed' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    onLog(`Error: ${msg}`);
    return { success: false, log: msg };
  } finally {
    await browser.close();
  }
}
