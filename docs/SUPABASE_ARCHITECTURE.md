# Deep-flow Supabase Architecture Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Architecture](#api-architecture)
5. [Real-time Features](#real-time-features)
6. [File Storage](#file-storage)
7. [Migration Strategy](#migration-strategy)
8. [Security Best Practices](#security-best-practices)
9. [Performance Optimization](#performance-optimization)
10. [Implementation Guide](#implementation-guide)

## Overview

Deep-flow is being transformed from a localStorage-based application to a full-featured, multi-user platform using Supabase as the backend. This architecture provides:

- **User Authentication**: Secure login with email/password and OAuth providers
- **Real-time Sync**: Instant updates across all devices
- **Data Persistence**: Permanent storage with automatic backups
- **Scalability**: Serverless architecture that scales automatically
- **Security**: Row Level Security (RLS) ensures data privacy

## Database Schema

### Core Tables

#### 1. **user_profiles**
Extends Supabase Auth with additional user information.
```sql
- id (UUID, Primary Key)
- username (Text, Unique)
- full_name (Text)
- avatar_url (Text)
- role (Enum: user, admin)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 2. **conversations**
Stores chat threads with AI agents.
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- thread_id (Text, Unique)
- title (Text)
- query (Text)
- is_archived (Boolean)
- metadata (JSONB)
```

#### 3. **messages**
Individual messages within conversations.
```sql
- id (UUID, Primary Key)
- conversation_id (UUID, Foreign Key)
- agent (Text)
- role (Enum: user, assistant, system)
- content (Text)
- reasoning_content (Text)
- tool_calls (JSONB)
- resources (JSONB)
```

#### 4. **notes**
User's multimedia notes with AI processing.
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- title (Text)
- media_type (Text)
- media_url (Text)
- content (Text)
- transcript (Text)
- summary (Text)
- ai_processed (Boolean)
```

#### 5. **projects** & **tasks**
Kanban board functionality.
```sql
projects:
- id, user_id, name, description, columns (JSONB)

tasks:
- id, project_id, title, description, column_id, position
- priority (Enum: low, medium, high)
- due_date, completed
```

#### 6. **calendar_events**
User's calendar with recurring event support.
```sql
- id, user_id, title, description
- start_time, end_time
- all_day (Boolean)
- recurrence_rule (Text, RFC 5545)
```

#### 7. **health_metrics**
Health tracking data.
```sql
- id, user_id
- metric_type (Text: sleep, water, steps, etc.)
- value (JSONB)
- recorded_at (Timestamp)
```

### Relationships
```
users
  ├── user_profiles (1:1)
  ├── conversations (1:n)
  │   ├── messages (1:n)
  │   └── research_activities (1:n)
  ├── notes (1:n)
  │   └── note_sessions (1:n)
  │       └── note_messages (1:n)
  ├── projects (1:n)
  │   └── tasks (1:n)
  ├── calendar_events (1:n)
  ├── health_metrics (1:n)
  └── generated_content (1:n)
```

## Authentication & Authorization

### Authentication Flow
```typescript
1. User Registration/Login
   ├── Email/Password
   ├── OAuth (Google, GitHub)
   └── Magic Link

2. Session Management
   ├── JWT Tokens
   ├── Refresh Tokens
   └── Secure Cookie Storage

3. Multi-Factor Authentication (Optional)
```

### Authorization with RLS
Every table has Row Level Security policies:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);
```

### API Key Management
For external integrations:
- User-specific API keys
- Rate limiting per key
- Usage tracking

## API Architecture

### RESTful Endpoints
```
/api/v1/
├── /auth/
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh
│   └── GET    /profile
├── /chat/
│   ├── POST   /stream (SSE)
│   ├── GET    /conversations
│   ├── GET    /conversations/:id
│   └── DELETE /conversations/:id
├── /notes/
│   ├── GET    /
│   ├── POST   /
│   ├── PUT    /:id
│   ├── DELETE /:id
│   └── POST   /:id/process-media
├── /projects/
│   ├── CRUD operations
│   └── /tasks/ (nested CRUD)
├── /calendar/
│   └── CRUD for events
└── /health/
    └── CRUD for metrics
```

### Request/Response Flow
```typescript
// Example: Chat Stream
Request:
POST /api/v1/chat/stream
{
  "threadId": "uuid",
  "message": "User query",
  "resources": [],
  "settings": {
    "enableDeepThinking": true,
    "reportStyle": "ACADEMIC"
  }
}

Response: Server-Sent Events
event: message_chunk
data: {"content": "AI response..."}

event: tool_call
data: {"toolName": "search", "args": {...}}

event: complete
data: {"threadId": "uuid", "status": "completed"}
```

## Real-time Features

### Supabase Realtime Subscriptions
```typescript
// Subscribe to conversation updates
const subscription = supabase
  .channel('conversations')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'conversations',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### Real-time Use Cases
1. **Live Collaboration**: Multiple devices sync instantly
2. **Notifications**: New messages, task updates
3. **Presence**: Show online status
4. **Live Updates**: Dashboard metrics, calendar events

## File Storage

### Storage Buckets
```
supabase-storage/
├── avatars/           # User profile pictures
│   └── {user_id}/
├── generated-content/ # AI-generated files
│   ├── podcasts/
│   ├── presentations/
│   └── reports/
└── note-attachments/  # User uploads
    └── {user_id}/
```

### Storage Policies
```typescript
// Example: Users can only access their own files
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true
  });
```

## Migration Strategy

### Phase 1: Setup (Week 1)
- [ ] Create Supabase project
- [ ] Run database schema
- [ ] Configure authentication
- [ ] Set up storage buckets

### Phase 2: Core Features (Week 2-3)
- [ ] Implement authentication flow
- [ ] Create Supabase client service
- [ ] Migrate chat functionality
- [ ] Add real-time subscriptions

### Phase 3: Feature Migration (Week 4-5)
- [ ] Migrate notes system
- [ ] Migrate calendar
- [ ] Migrate projects/tasks
- [ ] Migrate health tracking

### Phase 4: Data Migration (Week 6)
- [ ] Create migration scripts
- [ ] Test data migration
- [ ] Implement fallback mechanisms
- [ ] Deploy with feature flags

### Migration Script Example
```typescript
// Migrate localStorage data to Supabase
async function migrateUserData(userId: string) {
  // Get localStorage data
  const localData = {
    conversations: localStorage.getItem('deerflow.history'),
    notes: localStorage.getItem('jarvis-notes'),
    events: localStorage.getItem('jarvis-calendar-events'),
    projects: localStorage.getItem('kanban-projects-v2')
  };

  // Parse and transform data
  const conversations = JSON.parse(localData.conversations || '[]');
  
  // Batch insert into Supabase
  const { error } = await supabase
    .from('conversations')
    .insert(
      conversations.map(conv => ({
        user_id: userId,
        thread_id: conv.threadId,
        title: conv.title,
        query: conv.query,
        created_at: conv.timestamp
      }))
    );
}
```

## Security Best Practices

### 1. Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx # Server-side only
```

### 2. API Security
- Rate limiting per user
- Request validation (Zod schemas)
- Input sanitization
- CORS configuration

### 3. Data Encryption
- Sensitive data encrypted at rest
- HTTPS for all communications
- Secure cookie settings

### 4. Monitoring
- API usage tracking
- Error logging
- Security alerts

## Performance Optimization

### 1. Database Optimization
```sql
-- Indexes for common queries
CREATE INDEX idx_conversations_user_created 
  ON conversations(user_id, created_at DESC);

CREATE INDEX idx_messages_conversation_created 
  ON messages(conversation_id, created_at);
```

### 2. Caching Strategy
```typescript
// React Query for client-side caching
const { data: conversations } = useQuery({
  queryKey: ['conversations', userId],
  queryFn: fetchConversations,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 3. Pagination
```typescript
// Implement cursor-based pagination
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['messages', conversationId],
  queryFn: ({ pageParam = 0 }) => 
    fetchMessages(conversationId, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

### 4. Optimistic Updates
```typescript
// Update UI immediately, sync in background
const updateTask = useMutation({
  mutationFn: updateTaskApi,
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tasks']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks']);
    
    // Optimistically update
    queryClient.setQueryData(['tasks'], old => 
      [...old, newTask]
    );
    
    return { previous };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

## Implementation Guide

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @tanstack/react-query
```

### Step 2: Create Supabase Client
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 3: Create API Service Layer
```typescript
// services/api/conversations.ts
import { createClient } from '@/lib/supabase/client'

export const conversationsApi = {
  async list(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(conversation: NewConversation) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  // ... other methods
}
```

### Step 4: Update Store to Use Supabase
```typescript
// store/store.ts
import { conversationsApi } from '@/services/api/conversations'

const useStore = create((set, get) => ({
  conversations: [],
  
  async loadConversations() {
    try {
      const data = await conversationsApi.list(userId)
      set({ conversations: data })
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  },
  
  async createConversation(conversation) {
    try {
      const data = await conversationsApi.create(conversation)
      set(state => ({
        conversations: [data, ...state.conversations]
      }))
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }
}))
```

### Step 5: Add Real-time Subscriptions
```typescript
// hooks/useRealtimeConversations.ts
export function useRealtimeConversations(userId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Invalidate and refetch
        queryClient.invalidateQueries(['conversations'])
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
```

## Next Steps

1. **Setup Supabase Project**
   - Create new project at supabase.com
   - Run the schema.sql file
   - Configure authentication providers

2. **Environment Configuration**
   - Add Supabase credentials to .env
   - Configure CORS and security rules

3. **Implement Authentication**
   - Create auth pages (login, register)
   - Add auth context provider
   - Protect routes with middleware

4. **Migrate Features Incrementally**
   - Start with authentication
   - Then conversations/chat
   - Followed by other features

5. **Testing & Deployment**
   - Unit tests for API services
   - Integration tests for real-time features
   - Staged rollout with feature flags

This architecture transforms Deep-flow into a production-ready, scalable application while maintaining all existing functionality and adding enterprise-grade features.