import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

// Criar diretório de screenshots
try {
  mkdirSync('screenshots', { recursive: true });
} catch (e) {}

async function captureHomepage() {
  console.log('📸 Capturando screenshot da homepage...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('Acessando http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Aguardar um pouco para garantir que o redirecionamento ocorreu e a página carregou
    console.log('Aguardando página carregar completamente...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`URL atual: ${currentUrl}`);

    // Capturar screenshot da página atual (que deve ser /sign-in após redirecionamento)
    console.log('Capturando screenshot...');
    await page.screenshot({
      path: 'screenshots/final-landing-page.png',
      fullPage: true
    });

    console.log('\n✅ Screenshot salvo em: web/screenshots/final-landing-page.png');
    console.log(`📍 Página capturada: ${currentUrl}`);

    // Manter navegador aberto por 3 segundos para visualização
    console.log('\n⏳ Mantendo navegador aberto por 3 segundos...');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Erro ao capturar screenshot:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Concluído!');
  }
}

captureHomepage().catch(console.error);
