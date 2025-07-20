# Migração de Autenticação para Supabase

## Status da Implementação - Fase 1 Completa ✅

### O que foi feito:

1. **Backend - Suporte Duplo de Autenticação**
   - ✅ Adicionada coluna `supabase_id` ao modelo User
   - ✅ Criado `SupabaseAuthMiddleware` para verificar tokens Supabase
   - ✅ Modificado `get_current_user` para aceitar tanto JWT quanto Supabase
   - ✅ Criados testes unitários completos

2. **Arquivos Criados/Modificados**:
   - `src/database/models.py` - Adicionada coluna supabase_id
   - `src/server/supabase_auth.py` - Novo middleware Supabase
   - `src/server/auth.py` - Suporte duplo de autenticação
   - `tests/unit/server/test_supabase_auth.py` - Testes do middleware
   - `tests/unit/server/test_dual_auth.py` - Testes da autenticação dupla
   - `.env.example` - Variáveis do Supabase
   - `pyproject.toml` - Dependência supabase
   - `supabase-auth-migration.sql` - Script SQL para Supabase

## Como Aplicar a Migração

### 1. Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Backend
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key"

# Frontend
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"
```

### 2. Executar Migration do Banco Local

Se estiver usando banco local (SQLite/PostgreSQL):

```bash
# Criar arquivo de migration se usar Alembic
alembic revision --autogenerate -m "add supabase_id to users"
alembic upgrade head

# Ou executar SQL diretamente
sqlite3 deerflow.db < alembic/versions/add_supabase_id_to_users.py
```

### 3. Executar Script no Supabase

No Supabase Dashboard:
1. Vá para SQL Editor
2. Cole o conteúdo de `supabase-auth-migration.sql`
3. Execute o script

### 4. Testar a Autenticação Dupla

```bash
# Rodar os testes
uv run pytest tests/unit/server/test_supabase_auth.py -v
uv run pytest tests/unit/server/test_dual_auth.py -v

# Testar manualmente
uv run server.py
```

## Como Funciona Agora

1. **JWT (Mantido para compatibilidade)**:
   - Login via `/api/auth/login` continua funcionando
   - Gera tokens JWT como antes
   - Todos os endpoints existentes funcionam sem mudanças

2. **Supabase (Novo)**:
   - Frontend pode usar Supabase Auth diretamente
   - Backend aceita tokens Supabase automaticamente
   - Usuários são sincronizados automaticamente

3. **Fluxo de Autenticação**:
   ```
   Request → get_current_user
   ├─ Tenta JWT primeiro
   │  └─ Se válido → Retorna usuário
   └─ Tenta Supabase
      ├─ Verifica token
      ├─ Busca/cria usuário local
      └─ Retorna usuário
   ```

## Próximos Passos (Fase 2)

1. **Frontend - Migrar para Supabase Client**:
   - Remover uso de localStorage para tokens
   - Usar supabase.auth para login/logout
   - Atualizar componentes de autenticação

2. **Backend - Otimizações**:
   - Implementar cache de usuários
   - Adicionar métricas de autenticação
   - Configurar webhooks Supabase

3. **Cleanup Final**:
   - Remover código JWT antigo
   - Remover colunas desnecessárias
   - Atualizar documentação

## Troubleshooting

### Erro: "Supabase credentials not configured"
- Verifique as variáveis SUPABASE_URL e SUPABASE_ANON_KEY

### Erro: "Could not validate credentials"
- Token expirado ou inválido
- Verifique se o usuário existe no Supabase

### Usuários duplicados
- Execute o SQL de sincronização manual (comentado no script)

## Rollback

Se precisar reverter:
1. Remova as importações de `supabase_auth`
2. Reverta `get_current_user` para versão anterior
3. O sistema continuará funcionando apenas com JWT