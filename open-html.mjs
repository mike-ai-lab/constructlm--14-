import { chromium } from 'playwright';
import { resolve } from 'path';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const htmlPath = resolve(process.cwd(), 'interface-demo.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  
  console.log('Opening HTML file:', fileUrl);
  await page.goto(fileUrl);
  
  console.log('Page loaded. Taking screenshot...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'demo-screenshot.png', 
    fullPage: true 
  });
  
  console.log('✓ Screenshot saved as demo-screenshot.png');
  console.log('\nBrowser will stay open for 30 seconds for inspection...');
  
  await page.waitForTimeout(30000);
  await browser.close();
  console.log('Done!');
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
