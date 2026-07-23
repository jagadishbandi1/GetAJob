const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://jobs.lever.co/hive/36eaf4d5-fa38-43fa-9a03-d66e5518121b/apply', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('URL:', page.url());

    const info = await page.evaluate(() => {
      const out = [];
      const boxes = Array.from(document.querySelectorAll('input[type=checkbox]')).filter(b => (b.name||'').includes('field0'));
      out.push('checkbox count: '+boxes.length);
      const b = boxes.find(x => x.value === 'LinkedIn');
      if (b) {
        const cs = getComputedStyle(b);
        const r = b.getBoundingClientRect();
        out.push('LinkedIn checkbox: display='+cs.display+' opacity='+cs.opacity+' visibility='+cs.visibility+' w='+r.width+' h='+r.height+' pos='+cs.position);
        const label = b.closest('label');
        out.push('parent label: <'+label.tagName+'> class='+JSON.stringify(label.className)+' html='+JSON.stringify(label.outerHTML.slice(0,300)));
        const lcs = getComputedStyle(label);
        const lr = label.getBoundingClientRect();
        out.push('label style: display='+lcs.display+' w='+lr.width+' h='+lr.height);
      }
      return out.join('\n');
    });
    console.log(info);

    // Now try each strategy programmatically
    const nameAttr = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('input[type=checkbox]')).find(x => x.value === 'LinkedIn');
      return b ? b.name : null;
    });
    console.log('name attr:', JSON.stringify(nameAttr));

    // Strategy A: frame.check by value selector (element likely hidden)
    try {
      await page.check(`input[name="${nameAttr}"][value="LinkedIn"]`, { timeout: 1500 });
      console.log('A native check by value: SUCCESS');
    } catch (e) { console.log('A native check by value: FAIL', e.message.split('\n')[0]); }

    // Strategy B: getByRole checkbox
    try {
      const opt = page.getByRole('checkbox', { name: /^\s*LinkedIn\s*$/i }).first();
      await opt.click({ timeout: 1500 });
      console.log('B getByRole checkbox click: SUCCESS');
    } catch (e) { console.log('B getByRole checkbox click: FAIL', e.message.split('\n')[0]); }

    // Strategy C: click the label
    try {
      const lbl = page.locator('label').filter({ hasText: /^\s*LinkedIn\s*$/ }).first();
      await lbl.click({ timeout: 1500 });
      console.log('C label click: SUCCESS');
    } catch (e) { console.log('C label click: FAIL', e.message.split('\n')[0]); }

    // Verify checked state
    const checked = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('input[type=checkbox]')).find(x => x.value === 'LinkedIn');
      return b ? b.checked : null;
    });
    console.log('LinkedIn checked after attempts:', checked);

  } catch (e) {
    console.log('FATAL', e.message);
  } finally {
    await browser.close();
  }
})();
