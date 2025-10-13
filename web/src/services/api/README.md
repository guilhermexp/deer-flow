# Serviços REST API

Este diretório contém os serviços cliente para comunicação com a API REST do backend.

## Arquivos Criados

### 1. `projects.ts` - Serviço de Projetos
Gerencia projetos e quadros Kanban.

**Endpoints:**
- `GET /api/projects` - Listar projetos
- `GET /api/projects/{id}` - Buscar projeto por ID
- `POST /api/projects` - Criar novo projeto
- `PUT /api/projects/{id}` - Atualizar projeto
- `DELETE /api/projects/{id}` - Deletar projeto
- `GET /api/projects/{id}/kanban` - Buscar quadro Kanban

**Exemplo de uso:**
```typescript
import { projectsApiService } from '@/services/api/projects';

// Listar projetos
const projects = await projectsApiService.list({ status: 'active' });

// Criar projeto
const newProject = await projectsApiService.create({
  name: 'Meu Projeto',
  description: 'Descrição do projeto',
  color: '#3B82F6',
  icon: 'folder'
});

// Buscar Kanban
const kanban = await projectsApiService.getKanban(projectId);
```

### 2. `tasks.ts` - Serviço de Tarefas
Gerencia tarefas dentro dos projetos.

**Endpoints:**
- `POST /api/projects/{project_id}/tasks` - Criar tarefa
- `PUT /api/projects/{project_id}/tasks/{task_id}/move` - Mover tarefa

**Exemplo de uso:**
```typescript
import { tasksApiService } from '@/services/api/tasks';

// Criar tarefa
const task = await tasksApiService.create(projectId, {
  title: 'Nova Tarefa',
  description: 'Descrição da tarefa',
  priority: TaskPriority.HIGH
}, 'todo');

// Mover tarefa
await tasksApiService.move(projectId, taskId, {
  column_id: 'in_progress',
  order: 1
});
```

### 3. `notes.ts` - Serviço de Notas
Gerencia notas e anotações do usuário.

**Endpoints:**
- `GET /api/notes` - Listar notas
- `GET /api/notes/{id}` - Buscar nota por ID
- `POST /api/notes` - Criar nova nota
- `PUT /api/notes/{id}` - Atualizar nota
- `DELETE /api/notes/{id}` - Deletar nota
- `GET /api/notes/stats` - Buscar estatísticas
- `POST /api/notes/extract` - Extrair conteúdo de URL
- `POST /api/notes/summarize/{id}` - Gerar resumo

**Exemplo de uso:**
```typescript
import { notesApiService } from '@/services/api/notes';

// Listar notas
const notes = await notesApiService.list({ search: 'palavra-chave' });

// Criar nota
const note = await notesApiService.create({
  title: 'Minha Nota',
  content: 'Conteúdo da nota',
  source: 'youtube',
  source_url: 'https://youtube.com/watch?v=...'
});

// Extrair conteúdo
const extracted = await notesApiService.extractContent('https://youtube.com/...');

// Gerar resumo
const summary = await notesApiService.summarize(noteId);
```

### 4. `health.ts` - Serviço de Dados de Saúde
Gerencia dados de saúde e bem-estar do usuário.

**Endpoints:**
- `GET /api/health/data` - Listar dados de saúde
- `GET /api/health/data/today` - Buscar dados de hoje
- `GET /api/health/data/{date}` - Buscar dados por data
- `POST /api/health/data` - Criar/atualizar dados
- `PUT /api/health/data/{id}` - Atualizar dados por ID
- `DELETE /api/health/data/{id}` - Deletar dados
- `GET /api/health/stats` - Buscar estatísticas
- `GET /api/health/check` - Verificar saúde do sistema

**Exemplo de uso:**
```typescript
import { healthApiService } from '@/services/api/health';

// Buscar dados de hoje
const today = await healthApiService.getToday();

// Criar/atualizar dados
const data = await healthApiService.create({
  health_score: 85,
  hydration_ml: 2000,
  sleep_hours: 7.5,
  sleep_quality: 80,
  workouts_completed: 1
});

// Buscar estatísticas
const stats = await healthApiService.getStats(30); // últimos 30 dias
```

### 5. `calendar.ts` - Serviço de Calendário
Gerencia eventos de calendário.

**Endpoints:**
- `GET /api/calendar/events` - Listar eventos
- `GET /api/calendar/events/{id}` - Buscar evento por ID
- `POST /api/calendar/events` - Criar novo evento
- `PUT /api/calendar/events/{id}` - Atualizar evento
- `DELETE /api/calendar/events/{id}` - Deletar evento
- `GET /api/calendar/events/month/{year}/{month}` - Buscar eventos do mês

**Exemplo de uso:**
```typescript
import { calendarApiService } from '@/services/api/calendar';

// Listar eventos
const events = await calendarApiService.list({
  start_date: '2025-10-01',
  end_date: '2025-10-31'
});

// Criar evento
const event = await calendarApiService.create({
  title: 'Reunião',
  description: 'Reunião de equipe',
  date: '2025-10-15T10:00:00',
  end_date: '2025-10-15T11:00:00',
  category: 'work',
  color: '#3B82F6'
});

// Buscar eventos do mês
const monthEvents = await calendarApiService.getByMonth(2025, 10);
```

## Estrutura Comum

Todos os serviços seguem o mesmo padrão:

1. **Interfaces TypeScript**: Definem os tipos de dados usados
2. **Métodos CRUD**: `list`, `get`, `create`, `update`, `delete`
3. **Tratamento de erros**: Erros são capturados e logados no console
4. **Compatibilidade**: Método `checkXXXTableExists()` que retorna `true` para compatibilidade com código antigo
5. **Cliente HTTP**: Utilizam o `api` de `./http-client` para fazer as requisições

## Cliente HTTP

O cliente HTTP (`http-client.ts`) fornece:

- Autenticação automática via Clerk
- Headers padrão (Content-Type: application/json)
- Tratamento de erros centralizado
- Métodos de conveniência: `api.get()`, `api.post()`, `api.put()`, `api.delete()`

## Importação Centralizada

Use o arquivo `index.ts` para importar múltiplos serviços:

```typescript
import {
  projectsApiService,
  tasksApiService,
  notesApiService,
  healthApiService,
  calendarApiService
} from '@/services/api';
```

## Notas de Desenvolvimento

- Todos os serviços retornam `null` ou array vazio em caso de erro ao invés de lançar exceção
- Os métodos de criação e atualização lançam exceções em caso de erro (para forçar tratamento explícito)
- Parâmetros opcionais são tipados como `| null` para compatibilidade com o backend Python
- Datas são representadas como strings ISO 8601
