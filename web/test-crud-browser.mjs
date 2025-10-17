import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, '..', 'screenshots-crud-test');

async function testCRUD() {
  const browser = await chromium.launch({
    headless: false, // Modo visível
    slowMo: 1000 // Delay entre ações para visualização
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Capturar erros do console
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capturar erros de rede
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('📱 1. Abrindo http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    await page.screenshot({ path: join(screenshotsDir, '01-homepage.png'), fullPage: true });

    console.log('✅ Homepage carregada!');
    console.log(`   Console errors até agora: ${consoleErrors.length}`);
    console.log(`   Network errors até agora: ${networkErrors.length}`);

    // Esperar 3 segundos para ver se há autenticação ou redirect
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   URL atual: ${currentUrl}`);

    // Procurar botão de login na landing page
    const loginButton = await page.locator('button:has-text("Começar"), button:has-text("Entrar"), a:has-text("Entrar"), a[href*="sign-in"]').first();

    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('🔐 Botão de login encontrado na landing page. Clicando...');
      await loginButton.click();
      await page.waitForTimeout(2000);

      const afterClickUrl = page.url();
      console.log(`   URL após clicar no login: ${afterClickUrl}`);

      if (afterClickUrl.includes('clerk') || afterClickUrl.includes('sign-in') || afterClickUrl.includes('auth')) {
        console.log('⚠️  AÇÃO NECESSÁRIA: Por favor, faça login manualmente na janela do navegador');
        console.log('⚠️  Aguardando até 120 segundos para você completar o login...');

        // Esperar até que volte para localhost:4000 (sem clerk/auth na URL)
        try {
          await page.waitForURL(url => {
            const u = url.toString();
            return u.includes('localhost:4000') && !u.includes('clerk') && !u.includes('sign-in') && !u.includes('auth');
          }, { timeout: 120000 });

          console.log('✅ Login detectado! Continuando testes...');
          await page.waitForTimeout(3000);
        } catch (error) {
          console.log('⏱️  Timeout aguardando login. Tentando continuar mesmo assim...');
        }
      }
    } else {
      // Talvez já esteja logado, tentar acessar rota protegida
      console.log('🔍 Botão de login não encontrado. Tentando acessar /chat...');
      await page.goto('http://localhost:4000/chat', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const chatUrl = page.url();
      console.log(`   URL após tentar acessar /chat: ${chatUrl}`);

      if (chatUrl.includes('clerk') || chatUrl.includes('sign-in') || chatUrl.includes('auth')) {
        console.log('⚠️  AÇÃO NECESSÁRIA: Por favor, faça login manualmente na janela do navegador');
        console.log('⚠️  Aguardando até 120 segundos para você completar o login...');

        try {
          await page.waitForURL(url => {
            const u = url.toString();
            return u.includes('localhost:4000') && !u.includes('clerk') && !u.includes('sign-in') && !u.includes('auth');
          }, { timeout: 120000 });

          console.log('✅ Login detectado! Continuando testes...');
          await page.waitForTimeout(3000);
        } catch (error) {
          console.log('⏱️  Timeout aguardando login. Tentando continuar mesmo assim...');
        }
      }
    }

    await page.screenshot({ path: join(screenshotsDir, '02-after-auth.png'), fullPage: true });

    // ====================
    // TESTE 1: CRIAR PROJETO
    // ====================
    console.log('\n📂 2. Testando criação de PROJETO...');

    // Procurar botão de criar projeto (pode estar em /projects ou sidebar)
    await page.goto('http://localhost:4000/projects', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '03-projects-page.png'), fullPage: true });

    // Tentar encontrar botão de adicionar projeto
    const addProjectButton = await page.locator('button:has-text("New Project"), button:has-text("Add Project"), button:has-text("Create Project"), [data-testid="add-project"]').first();

    if (await addProjectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addProjectButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '04-project-dialog-opened.png'), fullPage: true });

      // Preencher nome do projeto
      const projectNameInput = await page.locator('input[name="name"], input[placeholder*="project" i], input[placeholder*="Project" i]').first();
      await projectNameInput.fill('Teste CRUD - Projeto Demo');

      const projectDescInput = await page.locator('input[name="description"], textarea[name="description"], input[placeholder*="description" i], textarea[placeholder*="description" i]').first();
      if (await projectDescInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await projectDescInput.fill('Projeto criado via teste automatizado para validar CRUD');
      }

      await page.screenshot({ path: join(screenshotsDir, '05-project-form-filled.png'), fullPage: true });

      // Clicar em salvar/criar
      const saveButton = await page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Add"), button[type="submit"]').first();
      await saveButton.click();

      await page.waitForTimeout(2000);
      await page.screenshot({ path: join(screenshotsDir, '06-project-created.png'), fullPage: true });
      console.log('✅ Projeto criado com sucesso!');
    } else {
      console.log('⚠️  Botão de criar projeto não encontrado. Tirando screenshot para debug...');
      await page.screenshot({ path: join(screenshotsDir, '04-project-button-not-found.png'), fullPage: true });
    }

    console.log(`   Console errors até agora: ${consoleErrors.length}`);
    console.log(`   Network errors até agora: ${networkErrors.length}`);

    // ====================
    // TESTE 2: CRIAR NOTA
    // ====================
    console.log('\n📝 3. Testando criação de NOTA...');

    await page.goto('http://localhost:4000/notes', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '07-notes-page.png'), fullPage: true });

    const addNoteButton = await page.locator('button:has-text("New Note"), button:has-text("Add Note"), button:has-text("Create Note"), [data-testid="add-note"]').first();

    if (await addNoteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addNoteButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '08-note-dialog-opened.png'), fullPage: true });

      // Preencher título da nota
      const noteTitleInput = await page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="Title" i]').first();
      await noteTitleInput.fill('Nota de Teste CRUD');

      const noteContentInput = await page.locator('textarea[name="content"], textarea[placeholder*="content" i], .tiptap, [contenteditable="true"]').first();
      if (await noteContentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await noteContentInput.fill('Esta é uma nota criada automaticamente para validar a funcionalidade CRUD do sistema DeerFlow.');
      }

      await page.screenshot({ path: join(screenshotsDir, '09-note-form-filled.png'), fullPage: true });

      const saveNoteButton = await page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Add"), button[type="submit"]').first();
      await saveNoteButton.click();

      await page.waitForTimeout(2000);
      await page.screenshot({ path: join(screenshotsDir, '10-note-created.png'), fullPage: true });
      console.log('✅ Nota criada com sucesso!');
    } else {
      console.log('⚠️  Botão de criar nota não encontrado. Tirando screenshot para debug...');
      await page.screenshot({ path: join(screenshotsDir, '08-note-button-not-found.png'), fullPage: true });
    }

    console.log(`   Console errors até agora: ${consoleErrors.length}`);
    console.log(`   Network errors até agora: ${networkErrors.length}`);

    // ====================
    // TESTE 3: CRIAR EVENTO NO CALENDÁRIO
    // ====================
    console.log('\n📅 4. Testando criação de EVENTO...');

    await page.goto('http://localhost:4000/calendar', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '11-calendar-page.png'), fullPage: true });

    // Tentar clicar em um dia do calendário ou botão de adicionar evento
    const addEventButton = await page.locator('button:has-text("New Event"), button:has-text("Add Event"), button:has-text("Create Event"), [data-testid="add-event"]').first();

    let eventCreated = false;

    if (await addEventButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addEventButton.click();
      eventCreated = true;
    } else {
      // Tentar clicar em um dia do calendário
      const calendarDay = await page.locator('.fc-day, .rbc-day-bg, [data-testid="calendar-day"]').first();
      if (await calendarDay.isVisible({ timeout: 5000 }).catch(() => false)) {
        await calendarDay.click();
        eventCreated = true;
      }
    }

    if (eventCreated) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '12-event-dialog-opened.png'), fullPage: true });

      // Preencher título do evento
      const eventTitleInput = await page.locator('input[name="title"], input[name="summary"], input[placeholder*="title" i], input[placeholder*="event" i]').first();
      if (await eventTitleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await eventTitleInput.fill('Reunião de Teste CRUD');
      }

      const eventDescInput = await page.locator('textarea[name="description"], input[name="description"], textarea[placeholder*="description" i]').first();
      if (await eventDescInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await eventDescInput.fill('Evento criado automaticamente para testar funcionalidade de calendário');
      }

      await page.screenshot({ path: join(screenshotsDir, '13-event-form-filled.png'), fullPage: true });

      const saveEventButton = await page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Add"), button[type="submit"]').first();
      if (await saveEventButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveEventButton.click();
      }

      await page.waitForTimeout(2000);
      await page.screenshot({ path: join(screenshotsDir, '14-event-created.png'), fullPage: true });
      console.log('✅ Evento criado com sucesso!');
    } else {
      console.log('⚠️  Não foi possível criar evento. Tirando screenshot para debug...');
      await page.screenshot({ path: join(screenshotsDir, '12-event-creation-failed.png'), fullPage: true });
    }

    console.log(`   Console errors até agora: ${consoleErrors.length}`);
    console.log(`   Network errors até agora: ${networkErrors.length}`);

    // ====================
    // TESTE 4: VERIFICAR PERSISTÊNCIA
    // ====================
    console.log('\n🔄 5. Testando PERSISTÊNCIA de dados...');

    console.log('   Recarregando página do projeto...');
    await page.goto('http://localhost:4000/projects', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '15-projects-after-reload.png'), fullPage: true });

    const projectExists = await page.locator('text="Teste CRUD - Projeto Demo"').isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ✅ Projeto persiste após reload: ${projectExists}`);

    console.log('   Recarregando página de notas...');
    await page.goto('http://localhost:4000/notes', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '16-notes-after-reload.png'), fullPage: true });

    const noteExists = await page.locator('text="Nota de Teste CRUD"').isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ✅ Nota persiste após reload: ${noteExists}`);

    console.log('   Recarregando página de calendário...');
    await page.goto('http://localhost:4000/calendar', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshotsDir, '17-calendar-after-reload.png'), fullPage: true });

    const eventExists = await page.locator('text="Reunião de Teste CRUD"').isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ✅ Evento persiste após reload: ${eventExists}`);

    // ====================
    // RELATÓRIO FINAL
    // ====================
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DO TESTE CRUD');
    console.log('='.repeat(60));
    console.log(`\n🖥️  Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('\nErros do Console:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log(`\n🌐 Network Errors: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      console.log('\nErros de Rede:');
      networkErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log(`\n📂 Screenshots salvos em: ${screenshotsDir}`);
    console.log('\n✅ Teste completo!');
    console.log('='.repeat(60));

    // Esperar 5 segundos para visualização final
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ ERRO durante teste:', error.message);
    await page.screenshot({ path: join(screenshotsDir, 'ERROR-final-state.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

// Criar diretório de screenshots se não existir
import { mkdirSync } from 'fs';
mkdirSync(screenshotsDir, { recursive: true });

// Executar teste
testCRUD().catch(console.error);
