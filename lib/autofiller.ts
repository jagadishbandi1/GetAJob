import { chromium, type Page, type Frame, type BrowserContext } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from './db';

const client = new Anthropic();

export interface Profile {
  full_name: string; email: string; phone: string;
  location: string; linkedin: string; website: string;
  resume_text: string; free_context: string;
  resume_file_name?: string;
  resume_file_data?: string; // base64
  resume_file_type?: string;
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
  options?: string[]; // choices for <select> and radio/checkbox groups
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
  // The label for a single radio/checkbox option (what the user reads next to it).
  function getOptionLabel(el: Element): string {
    const own = getLabelText(el);
    if (own) return own;
    const val = (el as HTMLInputElement).value || '';
    return val && val.toLowerCase() !== 'on' ? val : '';
  }
  const inputs: ScannedInput[] = [];
  const seenGroups = new Set<string>(); // radio/checkbox groups already emitted (by name)
  for (const el of Array.from(document.querySelectorAll('input, textarea, select'))) {
    const input = el as HTMLInputElement;
    const type = (input.type || '').toLowerCase();

    // Collapse radio/checkbox groups that share a name into ONE field carrying
    // every option label, so Claude picks from the real choices.
    if ((type === 'radio' || type === 'checkbox') && input.name) {
      if (seenGroups.has(input.name)) continue;
      seenGroups.add(input.name);
      const members = Array.from(
        document.querySelectorAll(`input[name="${CSS.escape(input.name)}"]`),
      ) as HTMLInputElement[];
      const options = members.map(getOptionLabel).filter(Boolean);
      // Prefer a group-level label (fieldset legend / aria-labelledby) over one option's.
      const fieldset = input.closest('fieldset');
      const legend = fieldset?.querySelector('legend')?.textContent?.trim() || '';
      inputs.push({
        tag: input.tagName, type, name: input.name, id: input.id || '',
        placeholder: input.placeholder || '', label: legend || getLabelText(input),
        required: input.required, options: options.length ? options : undefined,
      });
      continue;
    }

    let options: string[] | undefined;
    if (input.tagName === 'SELECT') {
      const opts = Array.from((input as unknown as HTMLSelectElement).options)
        .map(o => (o.textContent || '').trim())
        .filter(t => t && !/^(select|choose|please select|--)/i.test(t));
      if (opts.length) options = opts;
    }
    inputs.push({
      tag: input.tagName, type: input.type || '', name: input.name || '',
      id: input.id || '', placeholder: input.placeholder || '',
      label: getLabelText(input), required: input.required, options,
    });
  }
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

// Text that must NEVER be clicked while opening a dropdown / choosing an option —
// clicking these could advance or submit the application. Fill-only invariant.
const FORBIDDEN_CLICK = /submit|apply now|finish|send application|continue to|next step/i;

function norm(s: string): string { return (s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

// Choose an option in a native <select> OR a custom JS dropdown.
// Returns a short description of how it succeeded, or null if nothing matched.
async function selectWithFallback(frame: Frame, selector: string, value: string): Promise<string | null> {
  // 1) Native <select>: try by label, then value, then visible text.
  for (const opt of [{ label: value }, { value }, { label: value, value }]) {
    try {
      await frame.selectOption(selector, opt, { timeout: 1500 });
      return 'native select';
    } catch { /* not a native select or no such option — try next */ }
  }

  // 2) Custom widget: click the trigger (or its nearest clickable ancestor) to open the popup.
  let opened = false;
  try {
    const trigger = frame.locator(selector).first();
    await trigger.click({ timeout: 1500 });
    opened = true;
  } catch {
    try {
      const clickable = frame.locator(selector).first().locator(
        'xpath=ancestor-or-self::*[self::button or @role="button" or @role="combobox" or @tabindex][1]',
      );
      await clickable.first().click({ timeout: 1500 });
      opened = true;
    } catch { /* could not open */ }
  }
  if (!opened) return null;
  await frame.waitForTimeout(400);

  // 3) Pick the matching option from the opened listbox. Never click forbidden text.
  const target = norm(value);
  // 3a) ARIA option by accessible name (exact, then substring).
  for (const re of [new RegExp(`^\\s*${escapeRe(value)}\\s*$`, 'i'), new RegExp(escapeRe(value), 'i')]) {
    try {
      const opt = frame.getByRole('option', { name: re }).first();
      const txt = norm(await opt.innerText({ timeout: 800 }));
      if (txt && !FORBIDDEN_CLICK.test(txt)) { await opt.click({ timeout: 1200 }); return 'custom dropdown (role=option)'; }
    } catch { /* try next strategy */ }
  }
  // 3b) Any visible element inside a listbox/menu/option container whose text matches.
  try {
    const containers = ['[role="listbox"]', '[class*="menu"]', '[class*="option"]', '[class*="dropdown"]', '[class*="select"]'];
    const matched: string | null = await frame.evaluate(
      ({ containers, target, forbidden }) => {
        const fb = new RegExp(forbidden, 'i');
        for (const sel of containers) {
          for (const box of Array.from(document.querySelectorAll(sel))) {
            const rect = (box as HTMLElement).getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const cands = box.querySelectorAll('[role="option"], li, div, span, a, button');
            for (const c of Array.from(cands)) {
              const t = (c.textContent || '').replace(/\s+/g, ' ').trim();
              const tl = t.toLowerCase();
              if (!t || fb.test(tl)) continue;
              if (tl === target || tl.includes(target)) {
                (c as HTMLElement).setAttribute('data-gajf-pick', '1');
                return t;
              }
            }
          }
        }
        return null;
      },
      { containers, target, forbidden: FORBIDDEN_CLICK.source },
    );
    if (matched) {
      const pick = frame.locator('[data-gajf-pick="1"]').first();
      await pick.click({ timeout: 1200 });
      await frame.evaluate(() => document.querySelectorAll('[data-gajf-pick]').forEach(e => e.removeAttribute('data-gajf-pick')));
      return 'custom dropdown (text match)';
    }
  } catch { /* nothing matched */ }
  return null;
}

// Check a radio/checkbox rendered natively OR as a styled button/div.
async function checkWithFallback(frame: Frame, selector: string, value: string): Promise<string | null> {
  // 1) Native check by selector.
  try { await frame.check(selector, { timeout: 1500 }); return 'native check'; } catch { /* custom widget */ }

  // 2) Native inputs sharing the group name, matched by value attribute or associated label.
  try {
    const group = frame.locator(selector).first();
    const name = await group.getAttribute('name');
    if (name) {
      const byValue = frame.locator(`input[name="${name}"][value="${value}"]`).first();
      try { await byValue.check({ timeout: 1200 }); return 'native check (by value)'; } catch { /* try label */ }
    }
  } catch { /* fall through */ }

  // 3) Click the label/option whose visible text matches `value` (styled radio/checkbox).
  const target = norm(value);
  for (const re of [new RegExp(`^\\s*${escapeRe(value)}\\s*$`, 'i'), new RegExp(escapeRe(value), 'i')]) {
    for (const role of ['radio', 'checkbox', 'option'] as const) {
      try {
        const opt = frame.getByRole(role, { name: re }).first();
        const txt = norm(await opt.innerText({ timeout: 700 }));
        if (!FORBIDDEN_CLICK.test(txt)) { await opt.click({ timeout: 1200 }); return `styled ${role}`; }
      } catch { /* try next */ }
    }
  }
  try {
    const lbl = frame.getByText(new RegExp(`^\\s*${escapeRe(value)}\\s*$`, 'i')).first();
    const txt = norm(await lbl.innerText({ timeout: 700 }));
    if (txt === target && !FORBIDDEN_CLICK.test(txt)) { await lbl.click({ timeout: 1200 }); return 'label text'; }
  } catch { /* nothing matched */ }
  return null;
}

function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

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

Some fields include an "options" array listing the available choices (this covers native <select> dropdowns, custom JS dropdowns, and radio/checkbox groups). For a "select" or "check" action you MUST set value to the EXACT text of one of that field's options — do not paraphrase, abbreviate, or invent a value that is not in the list. If none of the options fit, skip the field.

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
          const how = await selectWithFallback(targetFrame, instruction.selector, instruction.value);
          if (!how) { await onLog(`Skipped "${instruction.question_label || instruction.selector}": could not select "${instruction.value}"`); continue; }
          await onLog(`Selected "${instruction.value}" for "${instruction.question_label || instruction.selector}" (${how})`);
        } else if (instruction.action === 'check') {
          const how = await checkWithFallback(targetFrame, instruction.selector, instruction.value);
          if (!how) { await onLog(`Skipped "${instruction.question_label || instruction.selector}": could not check "${instruction.value}"`); continue; }
          await onLog(`Checked "${instruction.question_label || instruction.selector}" → "${instruction.value}" (${how})`);
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

    // Attach the resume file to the form's file input(s). Playwright's
    // setInputFiles works even on hidden native inputs behind styled buttons.
    if (job.profile.resume_file_data && job.profile.resume_file_name) {
      try {
        const os = await import('os');
        const fs = await import('fs');
        const path = await import('path');
        const safeName = job.profile.resume_file_name.replace(/[^\w.-]/g, '_');
        const tmpPath = path.join(os.tmpdir(), `gajf_${Date.now()}_${safeName}`);
        fs.writeFileSync(tmpPath, Buffer.from(job.profile.resume_file_data, 'base64'));

        // Pick which file inputs get the resume: prefer ones whose context
        // mentions resume/cv; otherwise the first, unless it's clearly for a
        // cover letter / portfolio / photo.
        const fileMeta: { idx: number; ctx: string }[] = await targetFrame.evaluate(() => {
          return Array.from(document.querySelectorAll('input[type="file"]')).map((el, idx) => {
            const input = el as HTMLInputElement;
            let ctx = `${input.name} ${input.id} ${input.getAttribute('aria-label') || ''}`;
            const label = input.id ? document.querySelector(`label[for="${input.id}"]`) : null;
            if (label) ctx += ' ' + (label.textContent || '');
            const wrap = input.closest('div, section, fieldset');
            if (wrap) ctx += ' ' + (wrap.textContent || '').slice(0, 140);
            return { idx, ctx: ctx.toLowerCase() };
          });
        });

        let targets = fileMeta.filter((m) => /resume|cv|résumé/.test(m.ctx)).map((m) => m.idx);
        if (targets.length === 0 && fileMeta.length > 0) {
          const first = fileMeta[0];
          if (!/cover letter|portfolio|photo|headshot|image/.test(first.ctx)) targets = [first.idx];
        }

        const fileInputs = targetFrame.locator('input[type="file"]');
        let attached = 0;
        for (const idx of targets) {
          try {
            await fileInputs.nth(idx).setInputFiles(tmpPath, { timeout: 5000 });
            attached++;
          } catch { /* decorative/custom uploader — skip */ }
        }
        if (attached > 0) {
          await onLog(`Attached resume (${job.profile.resume_file_name}) to ${attached} upload field(s).`);
          fillCount += attached;
        } else if (fileMeta.length > 0) {
          await onLog('Found a file upload but could not attach automatically (the site likely uses a custom uploader) — attach the resume manually.');
        }
        try { fs.unlinkSync(tmpPath); } catch { /* best-effort cleanup */ }
      } catch (e) {
        await onLog(`Could not attach resume: ${e instanceof Error ? e.message : String(e)}`);
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
