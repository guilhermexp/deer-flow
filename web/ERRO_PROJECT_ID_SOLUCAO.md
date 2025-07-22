# 🔧 Solução para Erro "column tasks.project_id does not exist"

## 🚨 Problema Identificado

O erro ocorre porque a tabela `tasks` no Supabase não possui a coluna `project_id`, mas o código da aplicação espera que ela exista.

### Detalhes do Erro
```
GET https://vlwujoxrehymafeeiihh.supabase.co/rest/v1/tasks?select=*&project_id=eq.e814a6c9-c13c-4485-8464-f45a2c41fced
400 (Bad Request)
```

### Causa Raiz
1. O schema SQL em `create-supabase-tables.sql` define a coluna `project_id` na tabela `tasks`
2. O código em `src/services/supabase/projects.ts` tenta filtrar tarefas por `project_id`
3. A tabela no banco de dados do Supabase não tem essa coluna

## 🛠️ Solução

### Passo 1: Execute o Script de Verificação e Correção

No Supabase Dashboard:
1. Vá para **SQL Editor**
2. Cole e execute o conteúdo de: `scripts/verify-and-fix-tasks-table.sql`

Este script irá:
- Verificar se a coluna `project_id` existe
- Adicionar a coluna se não existir
- Criar a tabela `projects` se não existir
- Configurar as políticas RLS necessárias

### Passo 2: Se Existirem Tarefas Sem Projeto

Se você já tem tarefas na tabela sem `project_id`, será necessário:

1. Criar um projeto padrão para cada usuário
2. Associar as tarefas existentes a esse projeto
3. Adicionar as constraints de chave estrangeira

Use o bloco comentado no script SQL para fazer isso.

### Passo 3: Alternativa - Recriar as Tabelas

Se preferir começar do zero:

```sql
-- ATENÇÃO: Isso irá APAGAR todos os dados existentes!

-- 1. Apagar tabelas existentes
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- 2. Executar o script original
-- Cole e execute o conteúdo de: scripts/create-supabase-tables.sql
```

## 📋 Verificação

Após executar a correção, verifique se funcionou:

```sql
-- Verificar estrutura da tabela tasks
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tasks'
ORDER BY ordinal_position;
```

Você deve ver a coluna `project_id` do tipo `uuid`.

## 🔄 Teste no App

1. Faça logout e login novamente
2. Acesse a página de Projetos
3. Crie um novo projeto
4. Tente adicionar tarefas ao projeto

## ⚠️ Possíveis Problemas

### "Tarefas existentes sem projeto"
Se você tem tarefas antigas sem `project_id`, elas não aparecerão em nenhum projeto. Use o script de migração para associá-las a um projeto padrão.

### "Erro de chave estrangeira"
Se receber erro ao adicionar a constraint de chave estrangeira, significa que existem `project_id` apontando para projetos que não existem. Limpe esses dados primeiro.

### "Políticas RLS bloqueando acesso"
Certifique-se de que as políticas RLS estão corretas executando:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'tasks');
```

## 🎯 Resultado Esperado

Após a correção:
1. ✅ A tabela `tasks` terá a coluna `project_id`
2. ✅ Tarefas estarão corretamente associadas a projetos
3. ✅ A página de projetos funcionará sem erros 400
4. ✅ Será possível criar, visualizar e gerenciar tarefas dentro de projetos

## 💡 Dica de Prevenção

Para evitar esse tipo de problema no futuro:
1. Sempre execute os scripts SQL completos ao configurar o banco
2. Verifique a estrutura das tabelas após criar/modificar
3. Mantenha os scripts SQL sincronizados com o código da aplicação