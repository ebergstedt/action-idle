const puppeteer = require('puppeteer');
async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  for (let w = 1; w <= 5; w++) {
    await page.screenshot({ path: `screenshots/wave${w}.png` });
    console.log(`Wave ${w}`);
    if (w < 5) {
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === '+' && !x.disabled);
        if (b) b.click();
      });
      await new Promise(r => setTimeout(r, 800));
    }
  }
  await browser.close();
}
run();
