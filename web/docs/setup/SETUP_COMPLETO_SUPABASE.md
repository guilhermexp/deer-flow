# 🚀 Guia Completo de Setup do Supabase - DeerFlow

Este guia fornece instruções passo a passo para configurar completamente o banco de dados Supabase para a aplicação DeerFlow.

## 📋 Pré-requisitos

1. **Conta no Supabase**: Crie uma conta gratuita em [supabase.com](https://supabase.com)
2. **Node.js**: Versão 18+ instalada
3. **pnpm**: Gerenciador de pacotes (`npm install -g pnpm`)

## 🔧 Passo 1: Criar Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em "New Project"
3. Preencha os dados:
   - **Name**: DeerFlow (ou outro nome de sua preferência)
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a mais próxima
   - **Pricing Plan**: Free tier é suficiente

## 🔑 Passo 2: Obter Credenciais

Após criar o projeto, vá em **Settings > API** e copie:

1. **Project URL**: `https://seu-projeto.supabase.co`
2. **Anon Key**: Chave pública para o cliente
3. **Service Role Key**: Chave privada (NUNCA exponha no frontend!)

## 📝 Passo 3: Configurar Variáveis de Ambiente

1. Navegue até a pasta `web`:
   ```bash
   cd web
   ```

2. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

3. Edite o arquivo `.env` com suas credenciais:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
   ```

## 🗄️ Passo 4: Criar Estrutura do Banco de Dados

### Opção A: Script Automático (Recomendado)

Execute o script de setup que criará todas as tabelas automaticamente:

```bash
cd web
node scripts/setup-supabase-complete.js
```

### Opção B: Setup Manual via SQL Editor

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `web/scripts/create-supabase-tables.sql`
4. Clique em **Run**

## ✅ Passo 5: Verificar Configuração

1. Inicie a aplicação:
   ```bash
   pnpm dev
   ```

2. Acesse a página de teste:
   ```
   http://localhost:4000/test-supabase
   ```

3. Verifique se todas as tabelas estão com status "OK" ✅

## 👤 Passo 6: Criar Primeiro Usuário

1. Acesse: `http://localhost:4000/register`
2. Crie uma conta com email e senha
3. Faça login em: `http://localhost:4000/login`

## 🎯 Passo 7: Testar Funcionalidades

### 📝 Notas
- Acesse `/notes`
- Crie uma nova nota
- Verifique se foi salva no Supabase

### ❤️ Saúde
- Acesse `/health`
- Adicione dados de hidratação
- Verifique se os dados persistem

### 📁 Projetos
- Acesse `/projects`
- Crie um novo projeto
- Adicione tarefas

## 🛠️ Solução de Problemas

### Erro: "Tabela não encontrada"
```bash
# Execute o script de setup novamente
cd web && node scripts/setup-supabase-complete.js
```

### Erro: "Não autorizado"
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o RLS está habilitado nas tabelas

### Erro: "Conexão recusada"
- Verifique se o projeto Supabase está ativo
- Confirme as URLs no arquivo `.env`

## 📊 Estrutura das Tabelas

```sql
📁 Tabelas Criadas:
├── user_profiles      # Perfis de usuário
├── notes             # Notas e documentos
├── note_sessions     # Sessões de chat das notas
├── note_messages     # Mensagens das sessões
├── health_data       # Dados de saúde diários
├── health_metrics    # Métricas de saúde históricas
├── calendar_events   # Eventos do calendário
├── projects          # Projetos do Kanban
└── tasks            # Tarefas dos projetos
```

## 🔒 Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) habilitado:
- Usuários só podem ver/editar seus próprios dados
- Isolamento completo entre usuários
- Políticas aplicadas automaticamente

## 🚀 Próximos Passos

1. **Dados de Exemplo**: Na página `/test-supabase`, clique em "Criar Dados" para popular o banco
2. **Explorar**: Navegue pelas diferentes seções da aplicação
3. **Personalizar**: Modifique as tabelas conforme necessário

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Cliente JavaScript](https://supabase.com/docs/reference/javascript/introduction)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Consulte os logs do servidor (`pnpm dev`)
3. Acesse `/test-supabase` para diagnóstico
4. Verifique os logs no painel do Supabase

---

**Pronto!** Sua aplicação DeerFlow está configurada e pronta para uso com Supabase! 🎉