# Guia de Migração para Supabase Cloud

## 🎯 Objetivo
Migrar o sistema de autenticação para usar exclusivamente o Supabase Cloud, mantendo compatibilidade com o sistema atual.

## 📋 Pré-requisitos

1. **Conta no Supabase Cloud** com um projeto criado
2. **Credenciais do Supabase** (URL e chaves)
3. **Acesso ao SQL Editor** do Supabase

## 🔧 Passo 1: Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# Backend - Supabase Cloud
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"  # Opcional mas recomendado

# Frontend - mesmas credenciais
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"
```

### Onde encontrar as credenciais:
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL**
   - **Project API keys** → `anon` `public`
   - **Project API keys** → `service_role` (mantenha segura!)

## 🗄️ Passo 2: Verificar/Criar Tabela no Supabase

### Opção A: Se a tabela `users` NÃO existe ainda

Execute este SQL no Supabase Dashboard → SQL Editor:

```sql
-- Criar tabela users compatível com o sistema atual
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    supabase_id UUID UNIQUE REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_supabase_id ON public.users(supabase_id);

-- Criar outras tabelas relacionadas
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicione outras tabelas conforme necessário...
```

### Opção B: Se a tabela `users` JÁ existe

Execute este SQL para adicionar suporte ao Supabase:

```sql
-- Adicionar coluna supabase_id se não existir
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE REFERENCES auth.users(id);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON public.users(supabase_id);
```

## 🔐 Passo 3: Aplicar Migração de Autenticação

Execute o SQL do arquivo `supabase-simple-migration.sql` no SQL Editor:

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios dados
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (auth.uid() = supabase_id);

-- Função para sincronizar novos usuários do Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (email, username, supabase_id, hashed_password)
    VALUES (
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.id,
        '$supabase$managed'
    )
    ON CONFLICT (email) 
    DO UPDATE SET supabase_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário local quando alguém se registra no Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🧪 Passo 4: Testar a Integração

### 1. Testar conexão Python:
```bash
uv run python migrate_to_supabase_cloud.py
```

### 2. Testar autenticação dupla:
```bash
uv run pytest tests/unit/server/test_dual_auth.py -v
```

### 3. Testar criação de usuário:
```python
# Teste manual
from supabase import create_client
import os

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

# Criar usuário
user = supabase.auth.sign_up({
    "email": "teste@example.com",
    "password": "senha123",
    "options": {
        "data": {"username": "testuser"}
    }
})
```

## 🚀 Passo 5: Testar no Frontend

O frontend já está configurado para usar Supabase. Teste:

1. Faça login com um usuário existente (JWT)
2. Crie um novo usuário (Supabase)
3. Verifique se ambos funcionam

## ⚠️ Troubleshooting

### Erro: "relation 'users' does not exist"
- Execute o SQL de criação da tabela (Passo 2, Opção A)

### Erro: "permission denied for schema public"
- Use o painel do Supabase ou entre em contato com o suporte

### Erro: "Could not validate credentials"
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o usuário existe no Supabase Auth

## 📊 Monitoramento

No Supabase Dashboard, você pode:
- Ver logs em **Logs** → **API logs**
- Monitorar autenticações em **Authentication** → **Users**
- Verificar queries em **Database** → **Query Performance**

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Tabela `users` criada/atualizada no Supabase
- [ ] Migração SQL executada
- [ ] Testes passando
- [ ] Frontend funcionando com ambas autenticações
- [ ] Monitoramento ativo

## 🎉 Próximos Passos

Após confirmar que tudo funciona:
1. Migre gradualmente os usuários existentes
2. Atualize o frontend para usar apenas Supabase
3. Remova o código JWT antigo (Fase 4 do plano)