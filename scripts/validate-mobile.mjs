import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3, hasTouch: true });
  const base = process.env.BASE_URL || 'http://localhost:3010';
  await page.goto(base, { waitUntil: 'networkidle2' });

  const results = { device: 'iPhone 12 Pro' };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const exists = async (sel) => !!(await page.$(sel));

  // Primary CTA presence
  results.generateBtn = await exists('#open-campaign');
  results.menuBtn = await exists('#menu-more');
  results.shareBtn = await exists('#share-whatsapp');

  // Menu open/close
  if (results.menuBtn) {
    await page.evaluate(()=>document.querySelector('#menu-more')?.click());
    await sleep(150);
    results.menuOpen = await page.evaluate(() => {
      const el = document.querySelector('#menu-panel');
      return !!el && getComputedStyle(el).display !== 'none';
    });
    await page.evaluate(()=>document.querySelector('#menu-more')?.click());
    await sleep(100);
    results.menuClosed = await page.evaluate(() => {
      const el = document.querySelector('#menu-panel');
      return !!el && getComputedStyle(el).display === 'none';
    });
  } else {
    results.menuOpen = false; results.menuClosed = false;
  }

  // Open campaign modal
  if (results.generateBtn) {
    await page.evaluate(()=>{const el=document.querySelector('#open-campaign'); if (el){ el.scrollIntoView({block:'center'}); (el).click(); }});
    await sleep(200);
    results.campaignModalOpen = await exists('#campaign-modal');
  } else {
    results.campaignModalOpen = false;
  }

  // Move a card using Move → button
  const beforeDoing = await page.$$eval('#kanban h3', (els) => {
    const m = {};
    els.forEach((h) => { const t = h.textContent || ''; const mm = /(.*)\s*\((\d+)\)/.exec(t); if (mm) m[mm[1].trim()] = parseInt(mm[2],10); });
    return m;
  });
  const moveBtn = await page.$('#kanban [data-move]');
  results.hasMoveButton = !!moveBtn;
  if (moveBtn) {
    await moveBtn.evaluate((el)=>el.click());
    await sleep(600);
  }
  const afterDoing = await page.$$eval('#kanban h3', (els) => {
    const m = {};
    els.forEach((h) => { const t = h.textContent || ''; const mm = /(.*)\s*\((\d+)\)/.exec(t); if (mm) m[mm[1].trim()] = parseInt(mm[2],10); });
    return m;
  });
  results.moveChangedCounts = JSON.stringify(beforeDoing) !== JSON.stringify(afterDoing);

  // WhatsApp share
  await page.evaluate(() => {
    const prev = window.open;
    window.__waUrl = '';
    window.open = (url, target) => { window.__waUrl = String(url||''); try { return prev.call(window, url, target); } catch { return null; } };
  });
  await page.evaluate(()=>document.querySelector('#share-whatsapp')?.click());
  await sleep(200);
  results.waOpened = await page.evaluate(() => (window.__waUrl||'').includes('https://wa.me/'));

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

run().catch((e) => { console.error('Mobile validation failed:', e); process.exit(1); });
