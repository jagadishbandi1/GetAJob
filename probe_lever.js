const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://jobs.lever.co/hive/36eaf4d5-fa38-43fa-9a03-d66e5518121b', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    // Try to reach the application form
    try {
      const applyBtn = page.getByRole('link', { name: /apply/i }).first();
      if (await applyBtn.isVisible({ timeout: 3000 })) {
        console.log('clicking apply link');
        await Promise.allSettled([
          page.waitForLoadState('domcontentloaded', { timeout: 8000 }),
          applyBtn.click({ timeout: 3000 }),
        ]);
        await page.waitForTimeout(2000);
      }
    } catch (e) { console.log('no apply link', e.message); }

    console.log('URL:', page.url());

    // Dump the "How did you hear" widget structure
    const dump = await page.evaluate(() => {
      const out = [];
      // Find elements whose surrounding text mentions "how did you hear"
      const all = Array.from(document.querySelectorAll('*'));
      // find fields / labels
      const labelHits = all.filter(el => {
        const t = (el.textContent || '').toLowerCase();
        return t.includes('how did you hear') && el.children.length < 4 && t.length < 200;
      });
      out.push('=== label hits: ' + labelHits.length);
      labelHits.slice(0,3).forEach(el => {
        out.push('LABEL <'+el.tagName+'> class='+el.className+' text='+JSON.stringify((el.textContent||'').trim().slice(0,120)));
        // walk up to a container and dump inputs/radio/options within
        let container = el.closest('li, fieldset, .application-question, div');
        for (let i=0;i<3 && container;i++) {
          const radios = container.querySelectorAll('input[type=radio], input[type=checkbox], [role=radio], [role=option], select, button, [role=button]');
          if (radios.length) {
            out.push('  container <'+container.tagName+'> class='+container.className+' has '+radios.length+' controls');
            Array.from(radios).slice(0,12).forEach(r => {
              out.push('    <'+r.tagName+'> type='+r.getAttribute('type')+' role='+r.getAttribute('role')+' name='+r.getAttribute('name')+' value='+JSON.stringify(r.getAttribute('value'))+' id='+r.id+' aria-label='+r.getAttribute('aria-label')+' class='+r.className.slice(0,60)+' text='+JSON.stringify((r.textContent||'').trim().slice(0,50)));
            });
            break;
          }
          container = container.parentElement;
        }
      });

      // Also directly search for LinkedIn option text
      out.push('=== elements with text "LinkedIn":');
      all.filter(el => (el.textContent||'').trim().toLowerCase() === 'linkedin' && el.children.length===0).slice(0,5).forEach(el=>{
        out.push('  <'+el.tagName+'> class='+el.className+' parent=<'+el.parentElement.tagName+' role='+el.parentElement.getAttribute('role')+' class='+el.parentElement.className.slice(0,60)+'>');
      });

      // dump native selects
      out.push('=== native selects: '+document.querySelectorAll('select').length);
      Array.from(document.querySelectorAll('select')).slice(0,10).forEach(s=>{
        out.push('  select name='+s.name+' id='+s.id+' options='+JSON.stringify(Array.from(s.options).map(o=>o.textContent.trim()).slice(0,8)));
      });
      return out.join('\n');
    });
    console.log(dump);
  } catch (e) {
    console.log('FATAL', e.message);
  } finally {
    await browser.close();
  }
})();
