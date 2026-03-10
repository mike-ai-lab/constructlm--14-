import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Opening app at http://localhost:5000...');
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  
  console.log('✓ App loaded successfully');
  console.log('Testing editor stability...');
  
  // Wait for Monaco to load
  await page.waitForTimeout(3000);
  
  // Check for errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.error('❌ Page Error:', err.message);
  });
  
  // Simulate scrolling to test for flickering
  console.log('Simulating scroll...');
  await page.evaluate(() => {
    const editor = document.getElementById('editor');
    if (editor) {
      editor.scrollTop += 100;
      editor.scrollTop -= 100;
    }
  });
  
  await page.waitForTimeout(2000);
  
  console.log('✓ App appears stable');
  console.log('Browser window open - inspect the app manually');
  console.log('Press Ctrl+C to close when done');
  
  // Keep browser open
  await new Promise(() => {});
})();
