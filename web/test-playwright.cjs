const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    console.log('Navigating to http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    
    console.log('Getting page title...');
    const title = await page.title();
    console.log('Page title:', title);
    
    console.log('Checking for main elements...');
    const heading = await page.textContent('h1');
    console.log('Main heading:', heading);
    
    // Check if there are any "Começar" (Start) buttons
    const startButton = await page.locator('text=Começar').first();
    if (await startButton.isVisible()) {
      console.log('Start button found and visible');
    } else {
      console.log('Start button not found or not visible');
    }
    
    // Check for any loading states or error messages
    const loadingElements = await page.locator('[data-testid*="loading"], [class*="loading"], [class*="spinner"]').count();
    console.log('Loading elements found:', loadingElements);
    
    const errorElements = await page.locator('[class*="error"], [data-testid*="error"]').count();
    console.log('Error elements found:', errorElements);
    
    // Try clicking the start button to test functionality
    try {
      await startButton.click();
      console.log('Clicked start button successfully');
      await page.waitForTimeout(2000); // Wait for navigation
      const newUrl = page.url();
      console.log('New URL after clicking start:', newUrl);
    } catch (clickError) {
      console.log('Could not click start button:', clickError.message);
    }
    
  } catch (error) {
    console.error('Error during testing:', error.message);
  }
  
  await browser.close();
  console.log('Browser closed.');
})();