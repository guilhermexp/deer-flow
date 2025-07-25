"""
Testes para integração com Supabase
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
import json
import os
from datetime import datetime

# Simular variáveis de ambiente
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_KEY"] = "test-service-key"

from src.server.supabase_client import SupabaseClient, get_supabase_client


class TestSupabaseClient:
    """Testes para o cliente Supabase"""
    
    @pytest.fixture
    def mock_supabase_client(self):
        """Mock do cliente Supabase"""
        with patch('src.server.supabase_client.create_client') as mock_create:
            mock_client = MagicMock()
            mock_create.return_value = mock_client
            yield mock_client
    
    @pytest.fixture
    def supabase_client(self, mock_supabase_client):
        """Instância do SupabaseClient com mock"""
        return SupabaseClient()
    
    @pytest.mark.asyncio
    async def test_save_message_success(self, supabase_client, mock_supabase_client):
        """Testa salvamento de mensagem com sucesso"""
        # Configurar mock
        mock_table = MagicMock()
        mock_supabase_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.execute.return_value = MagicMock(
            data=[{"id": "test-id", "content": "Test message"}]
        )
        
        # Executar
        result = await supabase_client.save_message(
            conversation_id="conv-123",
            message_id="msg-123",
            role="assistant",
            content="Test message",
            agent="test-agent"
        )
        
        # Verificar
        assert result["id"] == "test-id"
        assert result["content"] == "Test message"
        mock_supabase_client.table.assert_called_with("messages")
        mock_table.insert.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_save_message_with_tool_calls(self, supabase_client, mock_supabase_client):
        """Testa salvamento de mensagem com tool_calls"""
        # Configurar mock
        mock_table = MagicMock()
        mock_supabase_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.execute.return_value = MagicMock(data=[{"id": "test-id"}])
        
        # Executar
        tool_calls = [{"name": "test_tool", "args": {"param": "value"}}]
        await supabase_client.save_message(
            conversation_id="conv-123",
            message_id="msg-123",
            role="assistant",
            content="Test",
            tool_calls=tool_calls
        )
        
        # Verificar que tool_calls foi serializado
        call_args = mock_table.insert.call_args[0][0]
        assert call_args["tool_calls"] == json.dumps(tool_calls)
    
    @pytest.mark.asyncio
    async def test_save_message_error_handling(self, supabase_client, mock_supabase_client):
        """Testa tratamento de erro ao salvar mensagem"""
        # Configurar mock para gerar erro
        mock_supabase_client.table.side_effect = Exception("Database error")
        
        # Executar - não deve lançar exceção
        result = await supabase_client.save_message(
            conversation_id="conv-123",
            message_id="msg-123",
            role="user",
            content="Test"
        )
        
        # Verificar que retornou dict vazio
        assert result == {}
    
    @pytest.mark.asyncio
    async def test_update_message(self, supabase_client, mock_supabase_client):
        """Testa atualização de mensagem"""
        # Configurar mock
        mock_table = MagicMock()
        mock_supabase_client.table.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = MagicMock(
            data=[{"id": "msg-123", "content": "Updated"}]
        )
        
        # Executar
        result = await supabase_client.update_message(
            message_id="msg-123",
            updates={"content": "Updated", "finish_reason": "stop"}
        )
        
        # Verificar
        assert result["content"] == "Updated"
        mock_table.update.assert_called_once()
        mock_table.eq.assert_called_with("id", "msg-123")
    
    @pytest.mark.asyncio
    async def test_get_or_create_conversation_existing(self, supabase_client, mock_supabase_client):
        """Testa obtenção de conversa existente"""
        # Configurar mock
        mock_table = MagicMock()
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        
        # Simular conversa existente
        existing_conv = {
            "id": "conv-123",
            "user_id": "user-123",
            "title": "Existing conversation"
        }
        mock_table.execute.return_value = MagicMock(data=[existing_conv])
        
        # Executar
        result = await supabase_client.get_or_create_conversation(
            conversation_id="conv-123",
            user_id="user-123",
            title="New title"  # Não deve ser usado
        )
        
        # Verificar
        assert result == existing_conv
        assert result["title"] == "Existing conversation"
    
    @pytest.mark.asyncio
    async def test_get_or_create_conversation_new(self, supabase_client, mock_supabase_client):
        """Testa criação de nova conversa"""
        # Configurar mock
        mock_table = MagicMock()
        mock_supabase_client.table.return_value = mock_table
        
        # Primeiro select retorna vazio
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_select
        mock_select.execute.return_value = MagicMock(data=[])
        
        # Insert retorna nova conversa
        mock_insert = MagicMock()
        mock_table.insert.return_value = mock_insert
        new_conv = {"id": "conv-123", "title": "Nova conversa"}
        mock_insert.execute.return_value = MagicMock(data=[new_conv])
        
        # Executar
        result = await supabase_client.get_or_create_conversation(
            conversation_id="conv-123",
            user_id="user-123",
            title="Nova conversa"
        )
        
        # Verificar
        assert result == new_conv
        mock_table.insert.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_save_research_activity(self, supabase_client, mock_supabase_client):
        """Testa salvamento de atividade de pesquisa"""
        # Configurar mock
        mock_table = MagicMock()
        mock_supabase_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.execute.return_value = MagicMock(
            data=[{"id": "activity-123"}]
        )
        
        # Executar
        result = await supabase_client.save_research_activity(
            conversation_id="conv-123",
            research_id="research-123",
            activity_type="search",
            content={"query": "test search"},
            metadata={"source": "tavily"}
        )
        
        # Verificar
        assert result["id"] == "activity-123"
        mock_supabase_client.table.assert_called_with("research_activities")
    
    def test_get_supabase_client_singleton(self):
        """Testa que get_supabase_client retorna singleton"""
        with patch('src.server.supabase_client.create_client'):
            client1 = get_supabase_client()
            client2 = get_supabase_client()
            
            # Deve ser a mesma instância
            assert client1 is client2
    
    def test_get_supabase_client_no_env_vars(self):
        """Testa comportamento quando variáveis não estão configuradas"""
        with patch.dict(os.environ, {}, clear=True):
            # Limpar singleton anterior
            import src.server.supabase_client
            src.server.supabase_client._supabase_client = None
            
            client = get_supabase_client()
            assert client is None


class TestSupabaseIntegrationWithApp:
    """Testes de integração com o app FastAPI"""
    
    @pytest.mark.asyncio
    async def test_chat_stream_saves_to_supabase(self):
        """Testa se o streaming de chat salva mensagens no Supabase"""
        from src.server.app import _astream_workflow_generator
        from src.database.models import User
        
        # Mock do usuário
        mock_user = User(id="user-123", email="test@example.com")
        
        # Mock do Supabase client
        with patch('src.server.app.get_supabase_client') as mock_get_client:
            mock_client = AsyncMock()
            mock_get_client.return_value = mock_client
            
            # Mock do graph
            with patch('src.server.app.build_graph_with_memory') as mock_build_graph:
                mock_graph = MagicMock()
                mock_build_graph.return_value = mock_graph
                
                # Simular streaming vazio para simplificar
                async def mock_astream(*args, **kwargs):
                    return
                    yield  # Faz a função ser um generator
                
                mock_graph.astream = mock_astream
                
                # Executar
                generator = _astream_workflow_generator(
                    messages=[{"role": "user", "content": "Test message"}],
                    thread_id="thread-123",
                    resources=[],
                    max_plan_iterations=3,
                    max_step_num=20,
                    max_search_results=5,
                    auto_accepted_plan=False,
                    interrupt_feedback="",
                    mcp_settings={},
                    enable_background_investigation=False,
                    report_style="ACADEMIC",
                    enable_deep_thinking=False,
                    selected_model=None,
                    current_user=mock_user
                )
                
                # Consumir generator
                async for _ in generator:
                    pass
                
                # Verificar que tentou criar conversa
                mock_client.get_or_create_conversation.assert_called_once_with(
                    "thread-123",
                    "user-123",
                    "Test message"
                )