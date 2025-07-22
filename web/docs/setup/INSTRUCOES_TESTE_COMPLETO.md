# 🧪 Instruções para Teste Completo do Sistema

## 1. Limpar Dados Locais

Abra o console do navegador (F12) e execute:

```javascript
// Limpar TUDO
localStorage.clear();
sessionStorage.clear();
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});
console.log('✅ Todos os dados locais foram limpos!');
```

## 2. Executar Debug Completo

No console, execute:

```javascript
// Se o debugSystem estiver disponível
if (window.debugSystem) {
  await window.debugSystem.runAll();
} else {
  console.error('❌ debugSystem não está disponível. Recarregue a página.');
}
```

## 3. Testes Manuais por Página

### 3.1 Teste de Autenticação
1. Acesse `/login`
2. Faça login com suas credenciais
3. Verifique no console se aparece "✅ Usuário autenticado"

### 3.2 Teste do Chat
1. Acesse `/chat`
2. Envie uma mensagem de teste
3. Verifique no console se aparece "✅ Mensagem salva no Supabase"
4. Recarregue a página
5. Verifique se a mensagem ainda está lá

### 3.3 Teste de Notas
1. Acesse `/notes`
2. Crie uma nova nota
3. Verifique se a nota foi salva
4. Recarregue a página
5. Verifique se a nota persiste

### 3.4 Teste de Projetos
1. Acesse `/projects`
2. Crie um novo projeto
3. Adicione tarefas
4. Mova tarefas entre colunas
5. Recarregue e verifique persistência

### 3.5 Teste de Calendário
1. Acesse `/calendar`
2. Adicione um evento
3. Recarregue e verifique se o evento persiste

### 3.6 Teste de Saúde
1. Acesse `/health`
2. Adicione água bebida
3. Adicione medicamentos
4. Recarregue e verifique persistência

## 4. Verificar Tabelas no Supabase

Execute no console:

```javascript
// Verificar se as tabelas estão acessíveis
const tables = ['conversations', 'messages', 'notes', 'projects', 'tasks', 'calendar_events', 'health_data'];
for (const table of tables) {
  try {
    const response = await fetch(`/api/debug/table/${table}`);
    const data = await response.json();
    console.log(`Tabela ${table}:`, data);
  } catch (error) {
    console.error(`Erro ao verificar ${table}:`, error);
  }
}
```

## 5. Problemas Conhecidos e Soluções

### Problema: "Usuário não autenticado" em algumas páginas
**Solução**: 
1. Verifique se o token não expirou
2. Faça logout e login novamente
3. Limpe os cookies do domínio

### Problema: Chat não salva mensagens
**Solução**:
1. Verifique se a tabela `conversations` existe
2. Verifique se a tabela `messages` existe
3. Verifique as políticas RLS no Supabase

### Problema: Dados não persistem após reload
**Solução**:
1. Verifique se está autenticado
2. Verifique erros no console
3. Verifique se as tabelas têm políticas RLS corretas

## 6. Script de Teste Automatizado

```javascript
// Teste automatizado completo
async function testeCompleto() {
  console.log('🚀 Iniciando teste completo...\n');
  
  // 1. Limpar dados
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Dados locais limpos');
  
  // 2. Verificar autenticação
  if (window.debugSystem) {
    await window.debugSystem.checkAuth();
  }
  
  // 3. Testar cada funcionalidade
  const paginas = ['/chat', '/notes', '/projects', '/calendar', '/health'];
  for (const pagina of paginas) {
    console.log(`\n📄 Testando ${pagina}...`);
    // Navegar para a página
    window.location.href = pagina;
    // Aguarde e teste manualmente
  }
  
  console.log('\n✅ Teste completo finalizado!');
}

// Executar
testeCompleto();
```

## 7. Checklist Final

- [ ] localStorage está vazio após limpeza
- [ ] Login funciona corretamente
- [ ] Usuário aparece autenticado em TODAS as páginas
- [ ] Chat salva e carrega mensagens
- [ ] Notas são persistidas
- [ ] Projetos e tarefas são salvos
- [ ] Eventos do calendário persistem
- [ ] Dados de saúde são salvos
- [ ] Não há erros no console
- [ ] Dados aparecem nas tabelas do Supabase

## 🚨 IMPORTANTE

Se algum teste falhar:
1. Capture os erros do console
2. Verifique o Network tab para requisições falhadas
3. Verifique as políticas RLS no Supabase
4. Confirme que as variáveis de ambiente estão corretas