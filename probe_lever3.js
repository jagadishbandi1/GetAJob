const { chromium } = require('playwright');

const FORBIDDEN_CLICK = /submit|apply now|finish|send application|continue to|next step/i;
function norm(s){return (s||'').replace(/\s+/g,' ').trim().toLowerCase();}
function escapeRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

// EXACT copy of current checkWithFallback
async function checkWithFallback(frame, selector, value) {
  try { await frame.check(selector, { timeout: 1500 }); return 'native check'; } catch {}
  try {
    const group = frame.locator(selector).first();
    const name = await group.getAttribute('name');
    if (name) {
      const byValue = frame.locator(`input[name="${name}"][value="${value}"]`).first();
      try { await byValue.check({ timeout: 1200 }); return 'native check (by value)'; } catch {}
    }
  } catch {}
  const target = norm(value);
  for (const re of [new RegExp(`^\\s*${escapeRe(value)}\\s*$`, 'i'), new RegExp(escapeRe(value), 'i')]) {
    for (const role of ['radio', 'checkbox', 'option']) {
      try {
        const opt = frame.getByRole(role, { name: re }).first();
        const txt = norm(await opt.innerText({ timeout: 700 }));
        if (!FORBIDDEN_CLICK.test(txt)) { await opt.click({ timeout: 1200 }); return `styled ${role}`; }
      } catch {}
    }
  }
  try {
    const lbl = frame.getByText(new RegExp(`^\\s*${escapeRe(value)}\\s*$`, 'i')).first();
    const txt = norm(await lbl.innerText({ timeout: 700 }));
    if (txt === target && !FORBIDDEN_CLICK.test(txt)) { await lbl.click({ timeout: 1200 }); return 'label text'; }
  } catch {}
  return null;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const frame = page.mainFrame();
  try {
    await page.goto('https://jobs.lever.co/hive/36eaf4d5-fa38-43fa-9a03-d66e5518121b/apply', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Selectors an LLM might realistically produce given name has [] chars & no id:
    const selectors = [
      `[name='cards[26f9bb01-3d3a-4479-bef8-9f5e08f02c2b][field0]']`,
      `[name="cards[26f9bb01-3d3a-4479-bef8-9f5e08f02c2b][field0]"]`,
      `input[name="cards[26f9bb01-3d3a-4479-bef8-9f5e08f02c2b][field0]"]`,
    ];
    for (const sel of selectors) {
      // reset
      await page.evaluate(() => document.querySelectorAll('input[type=checkbox]').forEach(b=>b.checked=false));
      let res, err=null;
      try { res = await checkWithFallback(frame, sel, 'LinkedIn'); }
      catch(e){ err = e.message.split('\n')[0]; res='THREW'; }
      const checked = await page.evaluate(() => { const b=[...document.querySelectorAll('input[type=checkbox]')].find(x=>x.value==='LinkedIn'); return b&&b.checked; });
      console.log('selector:', sel);
      console.log('  result:', res, err?('err='+err):'', '| checked=', checked);
    }
  } catch (e) { console.log('FATAL', e.message); }
  finally { await browser.close(); }
})();
