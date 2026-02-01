const puppeteer = require('puppeteer');

async function takeScreenshot() {
  const url = process.argv[2] || 'http://localhost:5177';
  const output = process.argv[3] || 'screenshots/screenshot.png';

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Disable cache to get fresh content
  await page.setCacheEnabled(false);

  // Default to 1080p for PC gaming
  const width = parseInt(process.argv[4]) || 1920;
  const height = parseInt(process.argv[5]) || 1080;
  await page.setViewport({ width, height });
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Force reload to clear any HMR state
  await page.reload({ waitUntil: 'networkidle0' });

  // Wait for rendering
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: output, fullPage: false });
  console.log(`Screenshot saved to ${output}`);

  await browser.close();
}

takeScreenshot().catch(console.error);
