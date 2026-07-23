import { chromium, type Page, type Frame, type BrowserContext } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from './db';

const client = new Anthropic();

export interface Profile {
  full_name: string; email: string; phone: string;
  location: string; linkedin: string; website: string;
  resume_text: string; free_context: string;
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
}

type Log = (msg: string) => Promise<void> | void;

interface ScannedInput {
  tag: string; type: string; name: string; id: string;
  placeholder: string; label: string; required: boolean;
}
interface FrameScan { title: string; url: string; inputs: ScannedInput[]; bodyText: string }

// Runs inside the browser context of a frame. Must be fully self-contained.
function extractInputs(): FrameScan {
  function getLabelText(el: Element): string {
    const id = (el as HTMLInputElement).id;
    if (id) { const label = document.querySelector(`label[for="${id}"]`); if (label) return label.textContent?.trim() || ''; }
    const parent = el.closest('label');
    if (parent) return parent.textContent?.trim() || '';
    const aria = el.getAttribute('aria-label');
    if (aria) return aria.trim();
    return '';
  }
  const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => {
    const input = el as HTMLInputElement;
    return {
      tag: el.tagName, type: input.type || '', name: input.name || '',
      id: input.id || '', placeholder: input.placeholder || '',
      label: getLabelText(el), required: input.required,
    };
  });
  return {
    title: document.title,
    url: window.location.href,
    inputs,
    bodyText: (document.body?.innerText || '').slice(0, 3000),
  };
}

// A field is "meaningful" if it looks like a real application input and not a
// cookie/consent/search/newsletter widget.
function isMeaningful(inp: ScannedInput): boolean {
  const type = (inp.type || '').toLowerCase();
  if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) return false;
  const blob = `${inp.name} ${inp.id} ${inp.placeholder} ${inp.label}`.toLowerCase();
  if (/onetrust|ot-|cookie|consent|vendor|gdpr|newsletter|subscribe|(^|\W)search(\W|$)/.test(blob)) return false;
  return Boolean(inp.name || inp.label || inp.placeholder || inp.id);
}

// Scan the main frame and every child frame; return the frame with the most
// meaningful fields (application forms are often embedded in an iframe).
async function findBestForm(page: Page): Promise<{ frame: Frame; scan: FrameScan; count: number }> {
  let best = { frame: page.mainFrame(), scan: { title: '', url: '', inputs: [] as ScannedInput[], bodyText: '' }, count: -1 };
  for (const frame of page.frames()) {
    try {
      const scan = await frame.evaluate(extractInputs);
      const count = scan.inputs.filter(isMeaningful).length;
      if (count > best.count) best = { frame, scan, count };
    } catch { /* cross-origin or detached frame — skip */ }
  }
  return best;
}

// Try to dismiss a cookie/consent banner in any frame. Best-effort, bounded.
async function dismissBanners(page: Page, onLog: Log): Promise<void> {
  const names = [/^accept all$/i, /accept all cookies/i, /^accept$/i, /^i accept$/i, /^agree$/i, /allow all/i, /^got it$/i];
  for (const frame of page.frames()) {
    try {
      const ot = frame.locator('#onetrust-accept-btn-handler').first();
      if (await ot.isVisible({ timeout: 300 })) { await ot.click({ timeout: 1000 }); await onLog('Dismissed a cookie banner.'); await page.waitForTimeout(400); return; }
    } catch { /* ignore */ }
    for (const re of names) {
      try {
        const btn = frame.getByRole('button', { name: re }).first();
        if (await btn.isVisible({ timeout: 250 })) { await btn.click({ timeout: 1000 }); await onLog('Dismissed a cookie/consent banner.'); await page.waitForTimeout(400); return; }
      } catch { /* ignore */ }
    }
  }
}

// Poll for a real form to appear (client-rendered ATSs render async). Returns
// the best form frame found once it has >= 2 meaningful fields or time runs out.
async function waitForForm(page: Page, maxSeconds: number): Promise<{ frame: Frame; scan: FrameScan; count: number }> {
  const start = Date.now();
  let best = await findBestForm(page);
  while (best.count < 2 && Date.now() - start < maxSeconds * 1000) {
    await page.waitForTimeout(700);
    best = await findBestForm(page);
  }
  return best;
}

// If the current page has no real form, click an "Apply" control to reach it.
// Waits for the control to render (SPAs), handles a popup tab, and never clicks
// a control whose text looks like a final submit / auth action.
async function tryClickApply(page: Page, context: BrowserContext, onLog: Log): Promise<Page> {
  const locators = [
    page.getByRole('button', { name: /apply/i }),
    page.getByRole('link', { name: /apply/i }),
  ];
  let target = null;
  for (const loc of locators) {
    try {
      const el = loc.first();
      await el.waitFor({ state: 'visible', timeout: 4000 });
      target = el;
      break;
    } catch { /* not this role — try next */ }
  }
  if (!target) return page;

  const txt = ((await target.innerText().catch(() => '')) || '').trim().toLowerCase();
  if (/submit|sign ?in|log ?in|create account|register|continue with/.test(txt)) return page;

  await onLog(`Clicking "${txt || 'apply'}" to reach the application form...`);
  const popupPromise = context.waitForEvent('page', { timeout: 4000 }).catch(() => null);
  await Promise.allSettled([
    page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {}),
    target.click({ timeout: 3000 }),
  ]);
  const popup = await popupPromise;
  const active = popup || page;
  await active.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
  return active;
}

export async function runAutofiller(job: AutofillJob, onLog: Log) {
  const sql = getDb();
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await onLog(`Navigating to ${job.jobUrl}`);
    await page.goto(job.jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    await dismissBanners(page, onLog);

    // Capture the main page content (for job metadata) before we possibly move.
    let mainContent = await page.mainFrame().evaluate(extractInputs);

    // Wait briefly for an inline form (SPAs render async); if none appears,
    // click "Apply" to reach the form, then wait for it to render.
    let activePage = page;
    let best = await waitForForm(activePage, 3);
    if (best.count < 2) {
      await onLog('No application form on this page yet — looking for an "apply" step...');
      activePage = await tryClickApply(page, context, onLog);
      await dismissBanners(activePage, onLog);
      best = await waitForForm(activePage, 6);
      try { mainContent = await activePage.mainFrame().evaluate(extractInputs); } catch { /* keep prior */ }
    }

    const targetFrame = best.frame;
    const fillable = best.scan.inputs.filter(isMeaningful);

    // Extract + save job metadata from the main page content.
    try {
      const metaRes = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: `Extract from this job posting. Return ONLY a JSON object with keys: job_title, company, location, compensation. Use "" if not found.\n\nTitle: ${mainContent.title}\n\n${mainContent.bodyText}` }],
      });
      const metaRaw = metaRes.content[0].type === 'text' ? metaRes.content[0].text : '';
      const metaMatch = metaRaw.match(/\{[\s\S]*\}/);
      if (metaMatch) {
        const meta = JSON.parse(metaMatch[0]);
        await sql`
          UPDATE applications
          SET job_title=${meta.job_title || ''}, company=${meta.company || ''},
              location=${meta.location || ''}, compensation=${meta.compensation || ''}
          WHERE id=${job.appId}
        `;
      }
    } catch { /* metadata extraction failed — continue */ }

    if (fillable.length === 0) {
      await onLog('Could not find a fillable application form (it may need a login, a captcha, or a multi-step flow this tool cannot navigate yet). The browser will stay open so you can continue manually.');
      await sql`UPDATE applications SET status='failed' WHERE id=${job.appId}`;
      await new Promise<void>((resolve) => {
        if (!browser.isConnected()) return resolve();
        browser.on('disconnected', () => resolve());
      });
      return { success: false, log: 'No fillable form found' };
    }

    await onLog(`Found ${fillable.length} application field(s)${targetFrame !== activePage.mainFrame() ? ' (inside an embedded form)' : ''}. Asking Claude how to fill them...`);

    const documents = await sql`SELECT name, content FROM documents` as { name: string; content: string }[];
    const trainingExamples = await sql`
      SELECT question_text, answer_given FROM training_examples ORDER BY created_at DESC LIMIT 30
    ` as { question_text: string; answer_given: string }[];

    const documentsText = documents.length > 0
      ? `Reference documents:\n${documents.map(d => `--- ${d.name} ---\n${d.content}`).join('\n\n')}`
      : '';
    const trainingText = trainingExamples.length > 0
      ? `Past answers:\n${trainingExamples.map(e => `Q: ${e.question_text}\nA: ${e.answer_given}`).join('\n\n')}`
      : '';
    const contextRulesText = job.contextRules.length > 0
      ? `Custom rules:\n${job.contextRules.map(r => `- If question is about "${r.trigger_keyword}", respond with: ${r.response}`).join('\n')}`
      : '';
    const freeContextText = job.profile.free_context ? `Additional context:\n${job.profile.free_context}` : '';

    const prompt = `You are helping fill out a job application. Be consistent with past answers.

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

Page title: ${mainContent.title}
Page URL: ${mainContent.url}

Form fields:
${JSON.stringify(fillable, null, 2)}

Return a JSON array of fill instructions. Each item:
- selector: CSS selector ("#field-id" or "[name='fieldname']")
- value: what to type or select
- action: "fill" | "select" | "check"
- question_label: human-readable label of the field

Only include fields you have real data for. If you are unsure of a value, skip the field rather than guessing — e.g. do NOT put a school as the "current company/employer", and do not invent employers, dates, or salaries. Skip file upload inputs. Never include submit buttons.
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
      if (jsonMatch) instructions = JSON.parse(jsonMatch[0]);
    } catch { await onLog('Warning: Could not parse Claude response as JSON'); }

    await onLog(`Claude generated ${instructions.length} fill instructions. Filling form...`);

    let fillCount = 0;
    for (const instruction of instructions) {
      try {
        if (instruction.action === 'fill') {
          await targetFrame.fill(instruction.selector, instruction.value);
          await onLog(`Filled "${instruction.question_label || instruction.selector}" → "${instruction.value}"`);
        } else if (instruction.action === 'select') {
          await targetFrame.selectOption(instruction.selector, instruction.value);
          await onLog(`Selected "${instruction.value}" for "${instruction.question_label || instruction.selector}"`);
        } else if (instruction.action === 'check') {
          await targetFrame.check(instruction.selector);
          await onLog(`Checked "${instruction.question_label || instruction.selector}"`);
        }
        fillCount++;

        // Only remember answers to genuine custom questions. Standard identity/
        // contact fields come straight from the profile and must NOT be saved as
        // "training" — otherwise a wrong inference (e.g. school as employer) gets
        // fed back as a past answer and reinforces itself on every future run.
        const isStandardField = /full ?name|first ?name|last ?name|e-?mail|phone|mobile|location|city|state|country|zip|postal|address|linkedin|website|portfolio|current company|employer|resume|résumé|cv/i;
        if (instruction.question_label && instruction.value && !isStandardField.test(instruction.question_label)) {
          await sql`
            INSERT INTO training_examples (question_text, answer_given, job_url)
            VALUES (${instruction.question_label}, ${instruction.value}, ${job.jobUrl})
          `;
        }

        await targetFrame.waitForTimeout(300);
      } catch {
        await onLog(`Skipped "${instruction.question_label || instruction.selector}": not found or not interactable`);
      }
    }

    // Honest completion — the tool never submits.
    if (fillCount === 0) {
      await onLog('Matched the form but could not fill any fields (selectors may not have matched). The browser will stay open so you can continue manually.');
    } else {
      await onLog(`Filled ${fillCount} field(s). Review everything in the browser window and submit yourself — this tool never submits for you. The window will stay open until you close it.`);
    }

    await sql`UPDATE applications SET status=${fillCount > 0 ? 'review' : 'failed'} WHERE id=${job.appId}`;

    // Never auto-close an unsubmitted form: wait until the user closes the window.
    await new Promise<void>((resolve) => {
      if (!browser.isConnected()) return resolve();
      browser.on('disconnected', () => resolve());
    });

    return { success: fillCount > 0, log: `Filled ${fillCount} field(s)` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await onLog(`Error: ${msg}`);
    return { success: false, log: msg };
  } finally {
    if (browser.isConnected()) await browser.close();
  }
}
