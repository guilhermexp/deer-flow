# Verificação de Dados Mockados no DeerFlow

## 📊 Resumo da Análise

### 1. **Dados Ainda Usando localStorage**:

#### Tasks (Tarefas):
- **Arquivo**: `src/lib/jarvis/task-utils.ts`
- **Status**: ⚠️ Ainda usa localStorage
- **Solução**: Já existe `useTasksApi.ts` que integra com Supabase via API

#### Health Dashboard (Configurações):
- **Arquivo**: `src/components/jarvis/health/health-dashboard.tsx`
- **Status**: ⚠️ Usa localStorage apenas para preferências de visualização de cards
- **Impacto**: Baixo (apenas preferências locais)

#### Calendar:
- **Arquivo**: `src/components/jarvis/calendar/hooks/useCalendarEvents.ts`
- **Status**: ⚠️ Pode estar usando localStorage
- **Solução**: Já existe `useCalendarEventsApi.ts` que integra com Supabase

#### Kanban:
- **Arquivos**: 
  - `src/components/jarvis/kanban/hooks/use-kanban-storage.ts`
  - `src/components/jarvis/kanban/hooks/use-kanban-storage-optimized.ts`
- **Status**: ⚠️ Usa localStorage
- **Solução**: Existe `use-kanban-api.ts` para integração

### 2. **Dados Mockados Hardcoded**:

#### Tasks Default:
- **Arquivo**: `src/data/tasks.ts`
- **Conteúdo**: Array com 3 tarefas mockadas
- **Uso**: `useTasks.ts` importa como dados padrão

#### Sleep Quality:
- **Arquivo**: `src/components/jarvis/health/sleep-quality-card.tsx`
- **Linha 56**: `const mockHistory = [6.5, 7, 7.5, 6.8, 8, 7.2, sleep.duration]`
- **Impacto**: Dados de histórico de sono são mockados

### 3. **Integrações com Supabase Já Implementadas**:

✅ **Tasks**: `useTasksApi.ts` - Integrado com backend
✅ **Calendar**: `useCalendarEventsApi.ts` - Integrado com backend
✅ **Health**: `use-health-data-supabase.ts` - Integrado com Supabase
✅ **Kanban**: `use-kanban-api.ts` - Preparado para integração

### 4. **APIs do Backend Disponíveis**:

- `/api/dashboard/*` - Tasks, reminders, stats
- `/api/calendar/*` - Eventos do calendário
- `/api/health/*` - Dados de saúde
- `/api/projects/*` - Projetos (kanban)
- `/api/notes/*` - Notas

## 🔧 Recomendações:

1. **Substituir `useTasks` por `useTasksApi`** em componentes que ainda usam dados mockados
2. **Substituir `useCalendarEvents` por `useCalendarEventsApi`** 
3. **Remover arquivo `src/data/tasks.ts`** após migração
4. **Implementar histórico real** para dados de sono/saúde
5. **Migrar kanban** de localStorage para API

## 📌 Prioridade:

1. **Alta**: Tasks e Calendar (dados principais)
2. **Média**: Health data histórico
3. **Baixa**: Preferências locais (podem continuar em localStorage)