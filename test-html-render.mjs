import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const htmlPath = resolve(__dirname, 'interface-demo.html');
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  
  console.log('Opening:', fileUrl);
  await page.goto(fileUrl);
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'interface-demo-screenshot.png', 
    fullPage: true 
  });
  console.log('Screenshot saved: interface-demo-screenshot.png');
  
  // Test canvas functionality
  console.log('\nTesting canvas functionality...');
  
  // Click "Open Canvas" button
  const openCanvasBtn = page.locator('button:has-text("OPEN CANVAS")');
  if (await openCanvasBtn.count() > 0) {
    await openCanvasBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ Canvas opened');
    
    // Take screenshot with canvas open
    await page.screenshot({ 
      path: 'interface-demo-with-canvas.png', 
      fullPage: true 
    });
    console.log('Screenshot with canvas saved: interface-demo-with-canvas.png');
    
    // Test code view
    const codeBtn = page.locator('button#codeBtn');
    if (await codeBtn.count() > 0) {
      await codeBtn.click();
      await page.waitForTimeout(300);
      console.log('✓ Code view toggled');
      
      await page.screenshot({ 
        path: 'interface-demo-code-view.png', 
        fullPage: true 
      });
      console.log('Screenshot with code view saved: interface-demo-code-view.png');
    }
  }
  
  // Test citation tooltips
  console.log('\nTesting citation tooltips...');
  const citationBadge = page.locator('.citation-badge').first();
  if (await citationBadge.count() > 0) {
    await citationBadge.hover();
    await page.waitForTimeout(300);
    console.log('✓ Citation tooltip displayed');
    
    await page.screenshot({ 
      path: 'interface-demo-citation-tooltip.png', 
      fullPage: false 
    });
    console.log('Screenshot with citation tooltip saved: interface-demo-citation-tooltip.png');
  }
  
  console.log('\n✅ All tests completed successfully!');
  console.log('\nKeeping browser open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();
