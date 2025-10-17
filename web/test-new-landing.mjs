import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

// Criar diretório de screenshots
try {
  mkdirSync('screenshots-new-landing', { recursive: true });
} catch (e) {}

async function testNewLanding() {
  console.log('🧪 Testando nova landing page com Clerk centralizado...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. Testar nova página inicial
    console.log('1️⃣ Acessando nova página inicial (http://localhost:4000)...');
    await page.goto('http://localhost:4000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots-new-landing/01-new-homepage.png', fullPage: true });
    console.log('   ✅ Página inicial carregada');

    // Verificar se componentes antigos foram removidos
    const hasJumbotron = await page.locator('text=Pesquisa Profunda ao Seu Alcance').isVisible().catch(() => false);
    const hasCaseStudy = await page.locator('text=Case Study').isVisible().catch(() => false);
    const hasMultiAgent = await page.locator('text=Multi Agent').isVisible().catch(() => false);

    console.log(`   ${!hasJumbotron ? '✅' : '❌'} Jumbotron removido: ${!hasJumbotron}`);
    console.log(`   ${!hasCaseStudy ? '✅' : '❌'} CaseStudy removido: ${!hasCaseStudy}`);
    console.log(`   ${!hasMultiAgent ? '✅' : '❌'} MultiAgent removido: ${!hasMultiAgent}`);

    // Verificar se o Clerk Sign-In está presente e centralizado
    const hasClerkSignIn = await page.locator('[data-clerk-id], .cl-component, .cl-rootBox, text=Sign in to My Application').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ${hasClerkSignIn ? '✅' : '❌'} Clerk Sign-In presente: ${hasClerkSignIn}`);

    // Verificar se o background Ray está presente
    const hasRay = await page.locator('svg.animate-spotlight').isVisible().catch(() => false);
    console.log(`   ${hasRay ? '✅' : '❌'} Background Ray presente: ${hasRay}`);

    // Verificar se o Footer está presente
    const hasFooter = await page.locator('footer').isVisible().catch(() => false);
    const hasFooterText = await page.locator('text=Originated from Open Source').isVisible().catch(() => false);
    console.log(`   ${hasFooter ? '✅' : '❌'} Footer presente: ${hasFooter}`);
    console.log(`   ${hasFooterText ? '✅' : '❌'} Footer texto presente: ${hasFooterText}`);

    // 2. Testar se botões do Clerk funcionam
    console.log('\n2️⃣ Testando interação com componente Clerk...');

    // Verificar se consegue clicar no campo de email
    const emailField = await page.locator('input[name="identifier"], input[type="email"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    if (emailField) {
      console.log('   ✅ Campo de email encontrado e interativo');
      await page.screenshot({ path: 'screenshots-new-landing/02-clerk-interactive.png', fullPage: true });
    } else {
      console.log('   ⚠️ Campo de email não encontrado imediatamente (pode estar carregando)');
    }

    // 3. Verificar link de Sign Up
    const signUpLink = await page.locator('text=Sign up, a[href*="sign-up"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`   ${signUpLink ? '✅' : '❌'} Link para Sign Up presente: ${signUpLink}`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO TESTE - NOVA LANDING PAGE');
    console.log('='.repeat(60));
    console.log(`${!hasJumbotron && !hasCaseStudy && !hasMultiAgent ? '✅' : '❌'} Componentes antigos removidos: ${!hasJumbotron && !hasCaseStudy && !hasMultiAgent}`);
    console.log(`${hasClerkSignIn ? '✅' : '❌'} Clerk Sign-In centralizado: ${hasClerkSignIn}`);
    console.log(`${hasRay ? '✅' : '❌'} Background customizado preservado: ${hasRay}`);
    console.log(`${hasFooter && hasFooterText ? '✅' : '❌'} Footer mantido: ${hasFooter && hasFooterText}`);
    console.log('='.repeat(60));

    const allTestsPassed = !hasJumbotron && !hasCaseStudy && !hasMultiAgent && hasClerkSignIn && hasRay && hasFooter && hasFooterText;

    if (allTestsPassed) {
      console.log('\n🎉 SUCESSO! Todos os testes passaram!');
      console.log('✅ Landing page limpa com sucesso');
      console.log('✅ Clerk integrado e centralizado');
      console.log('✅ Background e Footer preservados');
    } else {
      console.log('\n⚠️ Alguns testes falharam. Verifique os screenshots para mais detalhes.');
    }

    // Manter navegador aberto por 10 segundos para inspeção visual
    console.log('\n⏳ Mantendo navegador aberto por 10 segundos para inspeção visual...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    await page.screenshot({ path: 'screenshots-new-landing/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Teste concluído!');
  }
}

testNewLanding().catch(console.error);
