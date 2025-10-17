import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testClerk() {
  console.log('🧪 Testando integração do Clerk...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Testar página inicial
    console.log('1️⃣ Acessando página inicial (http://localhost:4000)...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots-clerk-test/01-homepage.png' });
    console.log('   ✅ Página inicial carregada');

    // Verificar componentes presentes
    const jumbotron = await page.locator('text=DeerFlow').first().isVisible().catch(() => false);
    console.log(`   ${jumbotron ? '✅' : '❌'} Jumbotron presente: ${jumbotron}`);

    // 2. Testar redirecionamento para /sign-in
    console.log('\n2️⃣ Acessando página de Sign In (http://localhost:4000/sign-in)...');
    await page.goto('http://localhost:4000/sign-in', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots-clerk-test/02-sign-in.png' });

    // Verificar se o componente do Clerk está presente
    const clerkSignIn = await page.locator('[data-clerk-id], .cl-component, .cl-rootBox').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ${clerkSignIn ? '✅' : '❌'} Componente Clerk Sign-In presente: ${clerkSignIn}`);

    // 3. Testar página de Sign Up
    console.log('\n3️⃣ Acessando página de Sign Up (http://localhost:4000/sign-up)...');
    await page.goto('http://localhost:4000/sign-up', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots-clerk-test/03-sign-up.png' });

    const clerkSignUp = await page.locator('[data-clerk-id], .cl-component, .cl-rootBox').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ${clerkSignUp ? '✅' : '❌'} Componente Clerk Sign-Up presente: ${clerkSignUp}`);

    // 4. Verificar proteção de rota /chat (deve redirecionar para sign-in)
    console.log('\n4️⃣ Testando proteção de rota /chat (deve redirecionar)...');
    await page.goto('http://localhost:4000/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const isProtected = currentUrl.includes('/sign-in') || currentUrl.includes('clerk');
    console.log(`   ${isProtected ? '✅' : '❌'} Rota protegida funcionando: ${isProtected}`);
    console.log(`   URL atual: ${currentUrl}`);
    await page.screenshot({ path: 'screenshots-clerk-test/04-protected-route.png' });

    // 5. Verificar variáveis de ambiente
    console.log('\n5️⃣ Verificando configuração do Clerk...');
    await page.goto('http://localhost:4000/sign-in');
    const hasClerkPublicKey = await page.evaluate(() => {
      return window.process?.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== undefined;
    }).catch(() => false);
    console.log(`   ${hasClerkPublicKey ? '✅' : '⚠️'} Clerk Public Key configurada`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO TESTE');
    console.log('='.repeat(60));
    console.log(`✅ Página inicial: Funcionando`);
    console.log(`${clerkSignIn ? '✅' : '❌'} Sign In: ${clerkSignIn ? 'Funcionando' : 'FALHOU'}`);
    console.log(`${clerkSignUp ? '✅' : '❌'} Sign Up: ${clerkSignUp ? 'Funcionando' : 'FALHOU'}`);
    console.log(`${isProtected ? '✅' : '❌'} Proteção de rotas: ${isProtected ? 'Funcionando' : 'FALHOU'}`);
    console.log('='.repeat(60));

    // Manter navegador aberto por 5 segundos para inspeção
    console.log('\n⏳ Mantendo navegador aberto por 5 segundos para inspeção...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    await page.screenshot({ path: 'screenshots-clerk-test/error.png' });
  } finally {
    await browser.close();
    console.log('\n✅ Teste concluído!');
  }
}

// Criar diretório de screenshots
import { mkdirSync } from 'fs';
try {
  mkdirSync('screenshots-clerk-test', { recursive: true });
} catch (e) {}

testClerk().catch(console.error);
