# Configuração do Supabase para o Deep-flow

Este guia explica como configurar o Supabase para que as páginas de notas e saúde funcionem corretamente.

## Pré-requisitos

1. Conta no [Supabase](https://supabase.com/)
2. Projeto criado no Supabase
3. Node.js instalado

## Configuração do Ambiente

1. Copie o arquivo `.env.example` para `.env` se ainda não o fez:

```bash
cp .env.example .env
```

2. Preencha as variáveis de ambiente do Supabase no arquivo `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

Você pode encontrar essas informações no painel do Supabase em "Project Settings" > "API".

## Criação das Tabelas

### Opção 1: Usando o Script Automatizado

1. Instale as dependências necessárias:

```bash
npm install
# ou
pnpm install
```

2. Execute o script de configuração:

```bash
node scripts/setup-supabase.js
```

### Opção 2: Manualmente via SQL Editor

1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `scripts/create-supabase-tables.sql`
5. Execute a consulta

## Verificação

Para verificar se as tabelas foram criadas corretamente:

1. Acesse o painel do Supabase
2. Vá para "Table Editor"
3. Você deve ver as seguintes tabelas:
   - `notes`
   - `note_sessions`
   - `note_messages`
   - `health_data`
   - `health_metrics`
   - `calendar_events`
   - `projects`
   - `tasks`

## Solução de Problemas

### As páginas de notas ou saúde não carregam

1. Verifique se você está autenticado na aplicação
2. Verifique se as tabelas foram criadas corretamente no Supabase
3. Verifique os logs do console do navegador para identificar erros específicos

### Erro de permissão

Se você encontrar erros de permissão, verifique se as políticas RLS (Row Level Security) foram criadas corretamente. Elas estão incluídas no script SQL.

### Erro ao executar o script de configuração

Se o script `setup-supabase.js` falhar, você pode tentar executar o SQL manualmente através do SQL Editor no painel do Supabase.

## Estrutura das Tabelas

### Tabela `notes`

Armazena as notas do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único da nota |
| title | TEXT | Título da nota |
| content | TEXT | Conteúdo da nota |
| source | TEXT | Fonte da nota (YouTube, Instagram, etc.) |
| source_url | TEXT | URL da fonte |
| summary | TEXT | Resumo da nota |
| transcript | TEXT | Transcrição (para notas de áudio/vídeo) |
| metadata | JSONB | Metadados adicionais |
| user_id | UUID | ID do usuário proprietário |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Tabela `health_data`

Armazena os dados de saúde do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário proprietário |
| date | DATE | Data do registro |
| health_score | INTEGER | Pontuação de saúde |
| hydration_ml | INTEGER | Hidratação em ml |
| hydration_goal_ml | INTEGER | Meta de hidratação em ml |
| sleep_hours | NUMERIC | Horas de sono |
| sleep_quality | INTEGER | Qualidade do sono |
| blood_pressure_systolic | INTEGER | Pressão sistólica |
| blood_pressure_diastolic | INTEGER | Pressão diastólica |
| pulse | INTEGER | Pulso |
| workouts_completed | INTEGER | Treinos completados |
| workouts_goal | INTEGER | Meta de treinos |
| sleep_phases | JSONB | Fases do sono |
| medications | JSONB | Medicamentos |
| notes | TEXT | Observações |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Tabela `calendar_events`

Armazena os eventos de calendário do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| title | TEXT | Título do evento |
| description | TEXT | Descrição do evento |
| date | TIMESTAMP | Data e hora do evento |
| end_date | TIMESTAMP | Data e hora de término |
| category | TEXT | Categoria do evento |
| color | TEXT | Cor do evento |
| location | TEXT | Local do evento |
| is_all_day | BOOLEAN | Indica se é um evento de dia inteiro |
| user_id | UUID | ID do usuário proprietário |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Tabela `projects`

Armazena os projetos do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome do projeto |
| description | TEXT | Descrição do projeto |
| color | TEXT | Cor do projeto |
| icon | TEXT | Ícone do projeto |
| status | TEXT | Status do projeto |
| user_id | UUID | ID do usuário proprietário |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Tabela `tasks`

Armazena as tarefas dos projetos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| project_id | UUID | ID do projeto |
| title | TEXT | Título da tarefa |
| description | TEXT | Descrição da tarefa |
| status | TEXT | Status da tarefa (TODO, IN_PROGRESS, DONE) |
| priority | TEXT | Prioridade da tarefa |
| due_date | TIMESTAMP | Data de vencimento |
| order | INTEGER | Ordem de exibição |
| user_id | UUID | ID do usuário proprietário |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |