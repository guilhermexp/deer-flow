#!/usr/bin/env node

/**
 * Script para testar a autenticação com Supabase e backend
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

async function testAuth() {
  console.log('\n🔍 Testando configuração de autenticação...\n');
  
  // 1. Verificar variáveis de ambiente
  console.log('1️⃣ Variáveis de ambiente:');
  console.log(`   NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || '❌ NÃO CONFIGURADO'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NÃO CONFIGURADO'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   NEXT_PUBLIC_DISABLE_SUPABASE_SYNC: ${process.env.NEXT_PUBLIC_DISABLE_SUPABASE_SYNC || 'false'}`);
  
  // 2. Testar conexão com o backend
  console.log('\n2️⃣ Testando conexão com backend:');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    if (response.ok) {
      console.log('   ✅ Backend está rodando');
    } else {
      console.log(`   ❌ Backend retornou status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro ao conectar com backend: ${error.message}`);
  }
  
  // 3. Testar Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('\n3️⃣ Testando conexão com Supabase:');
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      // Verificar sessão
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log(`   ❌ Erro ao obter sessão: ${error.message}`);
      } else if (session) {
        console.log(`   ✅ Usuário autenticado: ${session.user.email}`);
        console.log(`   📝 User ID: ${session.user.id}`);
        console.log(`   🔑 Token disponível: ${session.access_token ? 'Sim' : 'Não'}`);
        
        // Testar chamada ao backend com autenticação
        console.log('\n4️⃣ Testando chamada autenticada ao backend:');
        try {
          const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'teste' }],
              thread_id: 'test-thread'
            })
          });
          
          console.log(`   Status: ${chatResponse.status}`);
          if (!chatResponse.ok) {
            const text = await chatResponse.text();
            console.log(`   Resposta: ${text}`);
          } else {
            console.log('   ✅ Chamada autenticada bem-sucedida');
          }
        } catch (error) {
          console.log(`   ❌ Erro na chamada: ${error.message}`);
        }
      } else {
        console.log('   ⚠️ Nenhum usuário autenticado');
        console.log('   💡 Execute no navegador para usar a sessão existente');
      }
    } catch (error) {
      console.log(`   ❌ Erro ao conectar com Supabase: ${error.message}`);
    }
  }
  
  console.log('\n✅ Teste concluído\n');
}

testAuth().catch(console.error);