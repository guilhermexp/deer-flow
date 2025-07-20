# Backend API Setup - Sistema Funcional Real

## O que foi implementado

### 1. Infraestrutura de Banco de Dados
- **SQLAlchemy ORM** configurado com modelos completos
- **Modelos criados**:
  - `User` - Gerenciamento de usuários
  - `Task` - Tarefas do dashboard
  - `Reminder` - Lembretes
  - `CalendarEvent` - Eventos do calendário
  - `Note` - Notas e transcrições
  - `Project` - Projetos com suporte a Kanban
  - `HealthData` - Dados de saúde
  - `Conversation` - Histórico de conversas

### 2. Sistema de Autenticação
- **JWT tokens** para autenticação segura
- **Endpoints**:
  - `POST /api/auth/register` - Registro de novos usuários
  - `POST /api/auth/login` - Login com username/password
  - `POST /api/auth/refresh` - Renovar access token
  - `GET /api/auth/me` - Obter dados do usuário atual

### 3. APIs RESTful Completas

#### Dashboard (`/api/dashboard`)
- **Tasks**:
  - `GET /tasks` - Listar tarefas com filtros
  - `POST /tasks` - Criar nova tarefa
  - `PUT /tasks/{id}` - Atualizar tarefa
  - `DELETE /tasks/{id}` - Deletar tarefa
- **Reminders**:
  - `GET /reminders` - Listar lembretes
  - `POST /reminders` - Criar lembrete
  - `PUT /reminders/{id}` - Atualizar lembrete
  - `DELETE /reminders/{id}` - Deletar lembrete
- **Stats**:
  - `GET /stats` - Estatísticas do dashboard

#### Calendar (`/api/calendar`)
- `GET /events` - Listar eventos com filtro de data
- `POST /events` - Criar evento
- `PUT /events/{id}` - Atualizar evento
- `DELETE /events/{id}` - Deletar evento
- `GET /events/month/{year}/{month}` - Eventos por mês

#### Projects (`/api/projects`)
- `GET /` - Listar projetos
- `POST /` - Criar projeto
- `PUT /{id}` - Atualizar projeto
- `DELETE /{id}` - Deletar projeto
- **Kanban**:
  - `GET /{id}/kanban` - Obter board Kanban
  - `POST /{id}/tasks` - Criar tarefa no Kanban
  - `PUT /{id}/tasks/{task_id}/move` - Mover tarefa

#### Health (`/api/health`)
- `GET /data` - Histórico de dados de saúde
- `GET /data/today` - Dados de hoje
- `POST /data` - Criar/atualizar dados
- `GET /stats` - Estatísticas de saúde

#### Notes (`/api/notes`)
- `GET /` - Listar notas com busca
- `POST /` - Criar nota
- `PUT /{id}` - Atualizar nota
- `DELETE /{id}` - Deletar nota
- `POST /extract` - Extrair conteúdo de URL
- `POST /summarize/{id}` - Gerar resumo com IA

#### Conversations (`/api/conversations`)
- `GET /` - Listar conversas
- `GET /{thread_id}` - Obter conversa específica
- `POST /` - Criar conversa
- `PUT /{thread_id}` - Atualizar conversa
- `POST /{thread_id}/messages` - Adicionar mensagens

## Como executar

### 1. Instalar dependências
```bash
uv pip install sqlalchemy passlib[bcrypt] python-jose[cryptography] python-multipart
```

### 2. Inicializar banco de dados
```bash
# Criar as tabelas
uv run python src/server/init_db.py

# Ou usar Make
make init-db
```

### 3. Configurar variáveis de ambiente
Adicione ao `.env`:
```
JWT_SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///./deerflow.db
```

### 4. Executar servidor
```bash
uv run server.py
```

## Próximos passos para o Frontend

### 1. Instalar dependências no frontend
```bash
cd web
pnpm install axios @tanstack/react-query
```

### 2. Criar contexto de autenticação
- Implementar `AuthContext` para gerenciar tokens JWT
- Adicionar interceptors no axios para incluir token nos headers
- Implementar refresh token automático

### 3. Substituir localStorage por API calls
- Dashboard: Substituir `localStorage` por chamadas para `/api/dashboard`
- Calendar: Integrar com `/api/calendar/events`
- Projects: Conectar com `/api/projects` e Kanban
- Health: Usar `/api/health/data`
- Notes: Integrar com `/api/notes`

### 4. Adicionar páginas de autenticação
- Página de login
- Página de registro
- Proteção de rotas privadas

## Estrutura de dados esperada

### Exemplo de requisição autenticada
```javascript
// Login
const response = await fetch('http://localhost:9090/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: 'user@example.com',
    password: 'password123'
  })
});

const { access_token } = await response.json();

// Usar token em requisições
const tasks = await fetch('http://localhost:9090/api/dashboard/tasks', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### Exemplo de criação de tarefa
```javascript
const task = await fetch('http://localhost:9090/api/dashboard/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Nova tarefa',
    description: 'Descrição da tarefa',
    priority: 'high',
    category: 'work'
  })
});
```

## Benefícios da nova arquitetura

1. **Multi-usuário**: Cada usuário tem seus próprios dados isolados
2. **Persistência real**: Dados salvos em banco de dados SQLite
3. **Segurança**: Autenticação JWT com refresh tokens
4. **Escalabilidade**: Fácil migração para PostgreSQL/MySQL
5. **API RESTful**: Padrões consistentes em todos endpoints
6. **Validação**: Pydantic models garantem integridade dos dados