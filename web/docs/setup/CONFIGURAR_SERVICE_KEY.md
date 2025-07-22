# 🔑 Como Configurar a Service Role Key do Supabase

## Por que preciso desta chave?

A **Service Role Key** é necessária para criar tabelas e configurar políticas de segurança no seu banco de dados Supabase. É uma chave administrativa que tem permissões totais.

## Como obter a chave:

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://supabase.com/dashboard
   - Faça login com sua conta

2. **Selecione seu projeto**
   - Clique no projeto: `vlwujoxrehymafeeiihh`

3. **Navegue até as configurações de API**
   - No menu lateral, clique em **Settings** (Configurações)
   - Depois clique em **API**

4. **Copie a Service Role Key**
   - Na seção **Project API keys**
   - Procure por **service_role** (secret)
   - Clique em **Reveal** para mostrar a chave
   - Copie a chave completa

5. **Configure no arquivo .env**
   ```bash
   # Edite o arquivo .env
   nano .env
   
   # Adicione a chave na linha:
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
   ```

## ⚠️ IMPORTANTE

- **NUNCA** compartilhe esta chave publicamente
- **NUNCA** commite esta chave no Git
- Esta chave tem acesso TOTAL ao seu banco de dados
- Use apenas em scripts de setup e desenvolvimento local

## Após configurar:

Execute o setup:
```bash
node run-supabase-setup.js
```

Ou manualmente:
```bash
node scripts/setup-supabase-complete.js
```

## Alternativa: Setup Manual

Se preferir não usar a Service Role Key, você pode:

1. Acessar o SQL Editor no Dashboard do Supabase
2. Copiar o conteúdo de `scripts/create-supabase-tables.sql`
3. Executar diretamente no SQL Editor

Esta é uma opção mais segura se você estiver preocupado com segurança.