#!/usr/bin/env python3
"""
Script de teste para verificar real-time subscriptions do Supabase
"""

import asyncio
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

async def test_realtime_messages():
    """Testa real-time subscriptions de mensagens"""
    print("🔍 Testando Real-Time Subscriptions...")
    print("=" * 50)
    
    try:
        from src.server.supabase_client import get_supabase_client
        
        client = get_supabase_client()
        if not client:
            print("❌ Cliente Supabase não disponível")
            return
            
        # Criar usuário e conversa de teste
        test_email = f"realtime_test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "Test123456!"
        
        auth_response = client.client.auth.sign_up({
            "email": test_email,
            "password": test_password
        })
        
        if not auth_response.user:
            print("❌ Falha ao criar usuário de teste")
            return
            
        user_id = auth_response.user.id
        print(f"✅ Usuário criado: {user_id}")
        
        # Criar conversa
        conversation_id = str(uuid.uuid4())
        conv_result = await client.get_or_create_conversation(
            conversation_id=conversation_id,
            user_id=user_id,
            title="Teste Real-Time"
        )
        
        if not conv_result:
            print("❌ Falha ao criar conversa")
            return
            
        db_conversation_id = conv_result.get('id')
        print(f"✅ Conversa criada: {db_conversation_id}")
        
        # Configurar subscription
        print("\n📡 Configurando subscription para mensagens...")
        
        # Lista para armazenar eventos recebidos
        received_events = []
        
        def on_message_change(payload):
            """Callback para mudanças em mensagens"""
            event_type = payload.get('eventType')
            new_record = payload.get('new')
            old_record = payload.get('old')
            
            print(f"\n🔔 Evento recebido: {event_type}")
            if new_record:
                print(f"   Conteúdo: {new_record.get('content', 'N/A')}")
            
            received_events.append({
                'type': event_type,
                'timestamp': datetime.now().isoformat(),
                'data': new_record or old_record
            })
        
        # Criar subscription
        channel = client.client.channel('messages-changes').on(
            'postgres_changes',
            {
                'event': '*',  # Escutar todos os eventos
                'schema': 'public',
                'table': 'messages',
                'filter': f"conversation_id=eq.{db_conversation_id}"
            },
            on_message_change
        ).subscribe()
        
        print("✅ Subscription configurada")
        
        # Aguardar um momento para a subscription se estabelecer
        await asyncio.sleep(2)
        
        # Testar INSERT
        print("\n📝 Testando INSERT de mensagem...")
        message1_id = str(uuid.uuid4())
        await client.save_message(
            conversation_id=db_conversation_id,
            message_id=message1_id,
            role="user",
            content="Teste de mensagem real-time"
        )
        
        # Aguardar evento
        await asyncio.sleep(2)
        
        # Testar UPDATE
        print("\n🔄 Testando UPDATE de mensagem...")
        await client.update_message(
            message_id=message1_id,
            updates={
                "content": "Mensagem atualizada via real-time",
                "finish_reason": "stop"
            }
        )
        
        # Aguardar evento
        await asyncio.sleep(2)
        
        # Verificar eventos recebidos
        print("\n📊 Resumo dos eventos recebidos:")
        print(f"   Total de eventos: {len(received_events)}")
        
        for i, event in enumerate(received_events):
            print(f"\n   Evento {i+1}:")
            print(f"     Tipo: {event['type']}")
            print(f"     Timestamp: {event['timestamp']}")
            if event['data']:
                print(f"     Conteúdo: {event['data'].get('content', 'N/A')}")
        
        # Limpar subscription
        await channel.unsubscribe()
        print("\n✅ Subscription encerrada")
        
        # Verificar se recebemos os eventos esperados
        if len(received_events) >= 2:
            print("\n✅ Real-time subscriptions funcionando corretamente!")
        else:
            print(f"\n⚠️  Esperados 2 eventos, recebidos {len(received_events)}")
            
    except Exception as e:
        print(f"\n❌ Erro no teste real-time: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """Executa os testes"""
    await test_realtime_messages()
    print("\n✨ Teste real-time concluído!")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())