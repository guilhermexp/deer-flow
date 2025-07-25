#!/usr/bin/env python3
"""
Script de teste para verificar a integração completa do Supabase
"""

import asyncio
import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Verificar configuração
print("🔍 Verificando configuração do Supabase...")
print("=" * 50)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not supabase_url:
    print("❌ SUPABASE_URL não configurado")
else:
    print(f"✅ SUPABASE_URL: {supabase_url}")

if not supabase_key:
    print("❌ SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY não configurado")
else:
    key_type = "SERVICE_ROLE_KEY" if os.getenv("SUPABASE_SERVICE_ROLE_KEY") else "ANON_KEY"
    print(f"✅ SUPABASE_{key_type} configurado")

print("\n🧪 Executando testes de integração...")
print("=" * 50)

async def test_supabase_client():
    """Testa o cliente Supabase"""
    try:
        from src.server.supabase_client import get_supabase_client
        
        client = get_supabase_client()
        if client:
            print("✅ Cliente Supabase inicializado com sucesso")
            return client
        else:
            print("❌ Falha ao inicializar cliente Supabase")
            return None
    except Exception as e:
        print(f"❌ Erro ao importar cliente Supabase: {e}")
        return None

async def test_save_message(client, conversation_id=None):
    """Testa salvamento de mensagem"""
    if not client:
        return
    
    print("\n📝 Testando salvamento de mensagem...")
    
    try:
        # Usa o conversation_id fornecido ou cria um novo
        conv_id = conversation_id or str(uuid.uuid4())
        
        result = await client.save_message(
            conversation_id=conv_id,
            message_id=str(uuid.uuid4()),
            role="user",
            content="Teste de integração",
            metadata={"test": True}
        )
        
        if result:
            print("✅ Mensagem salva com sucesso")
            print(f"   ID: {result.get('id')}")
        else:
            print("❌ Falha ao salvar mensagem")
    except Exception as e:
        print(f"❌ Erro ao salvar mensagem: {e}")

async def test_create_user(client):
    """Cria um usuário de teste"""
    if not client:
        return None
    
    print("\n👤 Criando usuário de teste...")
    
    try:
        # Criar um usuário usando a API de autenticação do Supabase
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "Test123456!"
        
        # Usar diretamente o cliente do Supabase para criar usuário
        auth_response = client.client.auth.sign_up({
            "email": test_email,
            "password": test_password
        })
        
        if auth_response.user:
            print("✅ Usuário criado com sucesso")
            print(f"   ID: {auth_response.user.id}")
            print(f"   Email: {test_email}")
            return auth_response.user.id
        else:
            print("❌ Falha ao criar usuário")
            return None
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        return None

async def test_conversation_creation(client, user_id=None):
    """Testa criação de conversa"""
    if not client:
        return
    
    print("\n💬 Testando criação de conversa...")
    
    try:
        # Gerar IDs únicos
        test_conversation_id = str(uuid.uuid4())
        test_user_id = user_id or str(uuid.uuid4())
        
        result = await client.get_or_create_conversation(
            conversation_id=test_conversation_id,
            user_id=test_user_id,
            title="Conversa de Teste"
        )
        
        if result:
            print("✅ Conversa criada/obtida com sucesso")
            print(f"   ID: {result.get('id')}")
            print(f"   Título: {result.get('title')}")
            # Retorna o ID real do banco, não o thread_id
            return result.get('id')
        else:
            print("❌ Falha ao criar/obter conversa")
            return None
    except Exception as e:
        print(f"❌ Erro ao criar conversa: {e}")
        return None

async def test_research_activity(client, conversation_id=None):
    """Testa salvamento de atividade de pesquisa"""
    if not client:
        return
    
    print("\n🔬 Testando atividade de pesquisa...")
    
    try:
        # Usa o conversation_id fornecido ou cria um novo
        conv_id = conversation_id or str(uuid.uuid4())
        
        result = await client.save_research_activity(
            conversation_id=conv_id,
            research_id=str(uuid.uuid4()),
            activity_type="search",
            content={
                "query": "teste de pesquisa",
                "results": ["resultado 1", "resultado 2"]
            }
        )
        
        if result:
            print("✅ Atividade de pesquisa salva com sucesso")
            print(f"   ID: {result.get('id')}")
        else:
            print("❌ Falha ao salvar atividade de pesquisa")
    except Exception as e:
        print(f"❌ Erro ao salvar atividade: {e}")

async def test_message_update(client, conversation_id=None):
    """Testa atualização de mensagem"""
    if not client:
        return
    
    print("\n🔄 Testando atualização de mensagem...")
    
    try:
        # Se não tiver conversation_id, não pode testar
        if not conversation_id:
            print("⚠️  Pulando teste de atualização (precisa de conversation_id válido)")
            return
            
        # Primeiro criar uma mensagem
        message_id = str(uuid.uuid4())
        
        await client.save_message(
            conversation_id=conversation_id,
            message_id=message_id,
            role="assistant",
            content="Mensagem inicial"
        )
        
        # Depois atualizar
        result = await client.update_message(
            message_id=message_id,
            updates={
                "content": "Mensagem atualizada",
                "finish_reason": "stop"
            }
        )
        
        if result:
            print("✅ Mensagem atualizada com sucesso")
            print(f"   Novo conteúdo: {result.get('content')}")
        else:
            print("❌ Falha ao atualizar mensagem")
    except Exception as e:
        print(f"❌ Erro ao atualizar mensagem: {e}")

async def main():
    """Executa todos os testes"""
    # Testar cliente
    client = await test_supabase_client()
    
    if client:
        # Primeiro criar um usuário de teste
        user_id = await test_create_user(client)
        
        if user_id:
            # Criar conversa com o usuário válido
            conversation_id = await test_conversation_creation(client, user_id)
            
            if conversation_id:
                # Usa a mesma conversa para os outros testes
                await test_save_message(client, conversation_id)
                await test_research_activity(client, conversation_id)
                await test_message_update(client, conversation_id)
            else:
                # Se não conseguiu criar conversa, testa sem ID específico
                await test_save_message(client)
                await test_research_activity(client)
                await test_message_update(client)
        else:
            print("⚠️  Continuando testes sem usuário válido (podem falhar)")
            # Tenta executar mesmo sem usuário
            conversation_id = await test_conversation_creation(client)
            if conversation_id:
                await test_save_message(client, conversation_id)
                await test_research_activity(client, conversation_id)
                await test_message_update(client, conversation_id)
            else:
                await test_message_update(client)
    
    print("\n✨ Testes concluídos!")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())