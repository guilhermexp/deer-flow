# 🚨 Solução para Timeout de Autenticação

## Problema Identificado
O erro `⚠️ Auth: Timeout reached, setting loading to false` indica que a conexão com o Supabase está demorando muito ou não está configurada corretamente.

## Soluções Rápidas

### 1. Verificar Arquivo .env
Certifique-se de que o arquivo `.env` existe e contém as variáveis corretas:

```bash
cd web
cat .env
```

Deve conter:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### 2. Criar/Atualizar o .env
Se não existir ou estiver vazio:

```bash
cp .env.example .env
```

Então edite com suas credenciais do Supabase.

### 3. Reiniciar o Servidor
Após configurar o .env, reinicie o servidor:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
pnpm dev
```

### 4. Verificar Configuração
Acesse: http://localhost:4000/test-supabase

Você deve ver:
- ✅ Autenticação: Configurada
- ✅ Banco de Dados: Conectado

### 5. Limpar Cache do Navegador
Se ainda tiver problemas:
1. Abra o DevTools (F12)
2. Vá para Application/Storage
3. Clear site data
4. Recarregue a página

## Diagnóstico Detalhado

Se o problema persistir, verifique o console do navegador:

1. **"Supabase environment variables not configured"**
   - Solução: Configure o arquivo .env

2. **"Failed to fetch"**
   - Verifique se o URL do Supabase está correto
   - Confirme que o projeto Supabase está ativo

3. **Timeout constante**
   - Pode ser firewall/proxy bloqueando
   - Tente acessar diretamente: https://seu-projeto.supabase.co

## Script de Diagnóstico

Execute este comando para verificar a configuração:

```bash
cd web
node -e "
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('URL:', url ? '✅ Configurado' : '❌ Faltando');
console.log('Key:', key ? '✅ Configurado' : '❌ Faltando');
if (url) console.log('URL Value:', url);
"
```

## Próximos Passos

1. Se tudo estiver configurado mas ainda não funciona:
   - Verifique se o projeto Supabase está pausado
   - Confirme as credenciais no painel do Supabase

2. Para criar um novo projeto Supabase:
   - Siga o guia em `SETUP_COMPLETO_SUPABASE.md`

3. Para testar sem Supabase:
   - A aplicação tem fallback para localStorage
   - Mas algumas funcionalidades ficarão limitadas

## Ajuda Adicional

Se o problema persistir:
1. Verifique os logs do console
2. Teste em uma aba anônima
3. Verifique se há bloqueios de rede/firewall
4. Confirme que o Supabase está acessível na sua região