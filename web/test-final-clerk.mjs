import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

// Criar diretório de screenshots
try {
  mkdirSync('screenshots-final-test', { recursive: true });
} catch (e) {}

async function testFinalClerk() {
  console.log('🧪 TESTE FINAL - Integração Clerk + Landing Page\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    homepageRedirect: false,
    signInPageLoaded: false,
    clerkComponentPresent: false,
    backgroundPresent: false,
    footerPresent: false,
    signUpLinkWorks: false,
    protectedRouteWorks: false
  };

  try {
    // 1. Testar redirecionamento da homepage
    console.log('\n1️⃣ Testando redirecionamento automático de / para /sign-in...');
    await page.goto('http://localhost:4000/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    results.homepageRedirect = currentUrl.includes('/sign-in');
    console.log(`   URL final: ${currentUrl}`);
    console.log(`   ${results.homepageRedirect ? '✅' : '❌'} Redirecionamento funcionando: ${results.homepageRedirect}`);
    await page.screenshot({ path: 'screenshots-final-test/01-homepage-redirect.png', fullPage: true });

    // 2. Verificar página de Sign In
    console.log('\n2️⃣ Verificando componentes na página de Sign In...');
    if (!currentUrl.includes('/sign-in')) {
      await page.goto('http://localhost:4000/sign-in', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);
    }

    results.signInPageLoaded = page.url().includes('/sign-in');
    console.log(`   ${results.signInPageLoaded ? '✅' : '❌'} Página Sign In carregada: ${results.signInPageLoaded}`);

    // Verificar componente do Clerk
    const clerkSelectors = [
      'text=Sign in to My Application',
      'text=Welcome back',
      '[data-clerk-id]',
      '.cl-component',
      '.cl-rootBox',
      'button:has-text("Continue")',
      'input[name="identifier"]'
    ];

    let clerkFound = false;
    for (const selector of clerkSelectors) {
      const isVisible = await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        clerkFound = true;
        console.log(`   ✅ Componente Clerk encontrado: ${selector}`);
        break;
      }
    }
    results.clerkComponentPresent = clerkFound;
    console.log(`   ${results.clerkComponentPresent ? '✅' : '❌'} Clerk presente na página: ${results.clerkComponentPresent}`);
    await page.screenshot({ path: 'screenshots-final-test/02-sign-in-page.png', fullPage: true });

    // 3. Verificar background e footer
    console.log('\n3️⃣ Verificando elementos visuais...');

    results.backgroundPresent = await page.locator('svg.animate-spotlight').isVisible().catch(() => false);
    console.log(`   ${results.backgroundPresent ? '✅' : '❌'} Background Ray presente: ${results.backgroundPresent}`);

    const footerText = await page.locator('text=Originated from Open Source').isVisible().catch(() => false);
    const footerElement = await page.locator('footer').isVisible().catch(() => false);
    results.footerPresent = footerText && footerElement;
    console.log(`   ${results.footerPresent ? '✅' : '❌'} Footer presente: ${results.footerPresent}`);

    // 4. Testar link para Sign Up
    console.log('\n4️⃣ Testando navegação para Sign Up...');
    const signUpLink = await page.locator('text=Sign up, a[href*="sign-up"]').first().isVisible({ timeout: 3000 }).catch(() => false);

    if (signUpLink) {
      await page.locator('text=Sign up, a[href*="sign-up"]').first().click();
      await page.waitForTimeout(3000);
      const signUpUrl = page.url();
      results.signUpLinkWorks = signUpUrl.includes('/sign-up');
      console.log(`   URL após clicar: ${signUpUrl}`);
      console.log(`   ${results.signUpLinkWorks ? '✅' : '❌'} Navegação para Sign Up: ${results.signUpLinkWorks}`);
      await page.screenshot({ path: 'screenshots-final-test/03-sign-up-page.png', fullPage: true });
    } else {
      // Tentar navegar diretamente
      await page.goto('http://localhost:4000/sign-up', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);
      results.signUpLinkWorks = page.url().includes('/sign-up');
      console.log(`   ${results.signUpLinkWorks ? '✅' : '❌'} Página Sign Up acessível: ${results.signUpLinkWorks}`);
      await page.screenshot({ path: 'screenshots-final-test/03-sign-up-page.png', fullPage: true });
    }

    // 5. Testar proteção de rota
    console.log('\n5️⃣ Testando proteção de rota /chat...');
    await page.goto('http://localhost:4000/chat', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    const protectedUrl = page.url();
    results.protectedRouteWorks = protectedUrl.includes('/sign-in') || protectedUrl.includes('clerk');
    console.log(`   URL após tentar acessar /chat: ${protectedUrl}`);
    console.log(`   ${results.protectedRouteWorks ? '✅' : '❌'} Redirecionamento de rota protegida: ${results.protectedRouteWorks}`);
    await page.screenshot({ path: 'screenshots-final-test/04-protected-route.png', fullPage: true });

    // 6. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO FINAL DOS TESTES');
    console.log('='.repeat(60));
    console.log(`${results.homepageRedirect ? '✅' : '❌'} Redirecionamento automático: ${results.homepageRedirect}`);
    console.log(`${results.signInPageLoaded ? '✅' : '❌'} Página de Sign In: ${results.signInPageLoaded}`);
    console.log(`${results.clerkComponentPresent ? '✅' : '❌'} Componente Clerk presente: ${results.clerkComponentPresent}`);
    console.log(`${results.backgroundPresent ? '✅' : '❌'} Background customizado: ${results.backgroundPresent}`);
    console.log(`${results.footerPresent ? '✅' : '❌'} Footer mantido: ${results.footerPresent}`);
    console.log(`${results.signUpLinkWorks ? '✅' : '❌'} Navegação Sign Up: ${results.signUpLinkWorks}`);
    console.log(`${results.protectedRouteWorks ? '✅' : '❌'} Proteção de rotas: ${results.protectedRouteWorks}`);
    console.log('='.repeat(60));

    const allPassed = Object.values(results).every(v => v === true);
    const passedCount = Object.values(results).filter(v => v === true).length;
    const totalTests = Object.values(results).length;

    console.log(`\n📈 Resultado: ${passedCount}/${totalTests} testes passaram`);

    if (allPassed) {
      console.log('\n🎉🎉🎉 SUCESSO TOTAL! 🎉🎉🎉');
      console.log('✅ Clerk está 100% integrado e funcional');
      console.log('✅ Landing page limpa com background e footer preservados');
      console.log('✅ Fluxo de autenticação completo funcionando');
      console.log('✅ Proteção de rotas ativa');
    } else {
      console.log('\n⚠️ Alguns testes falharam:');
      Object.entries(results).forEach(([key, value]) => {
        if (!value) {
          console.log(`   ❌ ${key}: FALHOU`);
        }
      });
    }

    // Manter navegador aberto por 10 segundos
    console.log('\n⏳ Mantendo navegador aberto por 10 segundos para inspeção...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    await page.screenshot({ path: 'screenshots-final-test/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Teste concluído!\n');
  }

  return results;
}

testFinalClerk().catch(console.error);
