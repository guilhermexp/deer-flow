#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'
import { toUUID } from '../lib/id-converter'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vlwujoxrehymafeeiihh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3Vqb3hyZWh5bWFmZWVpaWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjE2MjcsImV4cCI6MjA2ODIzNzYyN30.nI0w1KdqsqL3yjVSwov94_dWttdmh23-i0KxowKW09s'

async function testMessages() {
  console.log('🧪 Testando criação de mensagens no Supabase...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // 1. Verificar autenticação
  console.log('1️⃣ Verificando autenticação...')
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (authError) {
    console.error('❌ Erro de autenticação:', authError)
    return
  }
  
  if (!session) {
    console.log('⚠️ Nenhuma sessão ativa. Fazendo login anônimo...')
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('❌ Erro ao fazer login anônimo:', error)
      return
    }
    console.log('✅ Login anônimo realizado')
  } else {
    console.log('✅ Sessão ativa encontrada')
  }
  
  // 2. Testar conversão de IDs
  console.log('\n2️⃣ Testando conversão de IDs...')
  const testIds = [
    '0b52itrVAvubV8tLSGN2F',
    'run-87c2d996-bd6c-4d8a-8295-e0416a1e7cae',
    'test-message-123'
  ]
  
  testIds.forEach(id => {
    const uuid = toUUID(id)
    console.log(`  ${id} → ${uuid}`)
  })
  
  // 3. Verificar tabela de conversas
  console.log('\n3️⃣ Verificando tabela conversations...')
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .limit(1)
  
  if (convError) {
    console.error('❌ Erro ao acessar tabela conversations:', convError)
  } else {
    console.log('✅ Tabela conversations acessível')
  }
  
  // 4. Criar uma conversa de teste
  console.log('\n4️⃣ Criando conversa de teste...')
  const threadId = crypto.randomUUID()
  const userId = session?.user?.id || crypto.randomUUID()
  
  const { data: conversation, error: createConvError } = await supabase
    .from('conversations')
    .insert({
      thread_id: threadId,
      title: 'Teste de Mensagens',
      query: 'Teste',
      user_id: userId
    })
    .select()
    .single()
  
  if (createConvError) {
    console.error('❌ Erro ao criar conversa:', createConvError)
    return
  }
  
  console.log('✅ Conversa criada:', conversation.id)
  
  // 5. Testar criação de mensagem
  console.log('\n5️⃣ Testando criação de mensagem...')
  const messageId = 'test-message-' + Date.now()
  const uuid = toUUID(messageId)
  
  const messageData = {
    id: uuid,
    conversation_id: conversation.id,
    content: 'Mensagem de teste',
    role: 'user' as const,
    agent: null,
    finish_reason: null,
    reasoning_content: null,
    tool_calls: null,
    resources: null,
    metadata: null
  }
  
  console.log('📤 Dados da mensagem:', messageData)
  
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()
  
  if (msgError) {
    console.error('❌ Erro ao criar mensagem:', {
      error: msgError,
      code: msgError.code,
      message: msgError.message,
      details: msgError.details
    })
    return
  }
  
  console.log('✅ Mensagem criada com sucesso!')
  console.log('📨 Mensagem:', message)
  
  // 6. Limpar dados de teste
  console.log('\n6️⃣ Limpando dados de teste...')
  
  // Deletar mensagem
  await supabase
    .from('messages')
    .delete()
    .eq('id', message.id)
  
  // Deletar conversa
  await supabase
    .from('conversations')
    .delete()
    .eq('id', conversation.id)
  
  console.log('✅ Dados de teste removidos')
  console.log('\n🎉 Teste concluído com sucesso!')
}

// Executar teste
testMessages().catch(console.error)