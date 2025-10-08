-- Script para corrigir problemas das tabelas de chat no Supabase
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos dropar as políticas existentes se houver conflito
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;

-- Verificar se as extensões necessárias estão habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tipos necessários se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
        CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
    END IF;
END$$;

-- Criar tabela conversations se não existir
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  thread_id TEXT UNIQUE NOT NULL,
  title TEXT,
  query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  project_id UUID DEFAULT NULL,
  CONSTRAINT conversations_thread_id_key UNIQUE (thread_id)
);

-- Criar tabela messages se não existir
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  agent TEXT,
  role message_role NOT NULL,
  content TEXT,
  reasoning_content TEXT,
  tool_calls JSONB,
  resources JSONB,
  finish_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_thread_id ON conversations(thread_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas RLS para messages
CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Criar view conversation_summary se não existir
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
  c.id,
  c.user_id,
  c.thread_id,
  c.title,
  c.query,
  c.created_at,
  c.updated_at,
  c.is_archived,
  c.project_id,
  COUNT(DISTINCT m.id) as message_count,
  MAX(m.created_at) as last_message_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, c.thread_id, c.title, c.query, c.created_at, c.updated_at, c.is_archived, c.project_id;

-- Dar permissões na view
GRANT SELECT ON conversation_summary TO authenticated;

-- Verificar se tudo foi criado corretamente
SELECT 
  'conversations' as table_name,
  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') as table_exists,
  pg_has_role('authenticated', 'SELECT', true) as has_select_permission
UNION ALL
SELECT 
  'messages' as table_name,
  EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') as table_exists,
  pg_has_role('authenticated', 'SELECT', true) as has_select_permission
UNION ALL
SELECT 
  'conversation_summary' as table_name,
  EXISTS(SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'conversation_summary') as table_exists,
  true as has_select_permission;

-- Verificar políticas RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;