"""
Cliente Supabase para o backend Python
"""

import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from datetime import datetime
import json


class SupabaseClient:
    """Cliente Supabase para persistência de dados do chat"""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        # Preferir SERVICE_ROLE_KEY para operações do servidor
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) devem estar configurados")
        
        self.client: Client = create_client(supabase_url, supabase_key)
    
    async def save_message(
        self,
        conversation_id: str,
        message_id: str,
        role: str,
        content: str,
        agent: Optional[str] = None,
        finish_reason: Optional[str] = None,
        reasoning_content: Optional[str] = None,
        tool_calls: Optional[List[Dict[str, Any]]] = None,
        resources: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Salva uma mensagem no Supabase"""
        
        data = {
            "id": message_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "agent": agent,
            "finish_reason": finish_reason,
            "reasoning_content": reasoning_content,
            "tool_calls": json.dumps(tool_calls) if tool_calls else None,
            "resources": json.dumps(resources) if resources else None,
            "metadata": metadata
        }
        
        # Remove campos None
        data = {k: v for k, v in data.items() if v is not None}
        
        try:
            result = self.client.table("messages").insert(data).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"Erro ao salvar mensagem no Supabase: {e}")
            # Não falha se não conseguir salvar
            return {}
    
    async def update_message(
        self,
        message_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Atualiza uma mensagem existente"""
        
        # Serializa campos complexos
        if "tool_calls" in updates and updates["tool_calls"] is not None:
            updates["tool_calls"] = json.dumps(updates["tool_calls"])
        if "resources" in updates and updates["resources"] is not None:
            updates["resources"] = json.dumps(updates["resources"])
        
        try:
            result = self.client.table("messages").update(updates).eq("id", message_id).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"Erro ao atualizar mensagem no Supabase: {e}")
            return {}
    
    async def get_or_create_conversation(
        self,
        conversation_id: str,
        user_id: str,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """Obtém ou cria uma conversa"""
        
        # Tenta buscar a conversa existente por thread_id
        try:
            result = self.client.table("conversations").select("*").eq("thread_id", conversation_id).execute()
            
            if result.data:
                return result.data[0]
            
            # Se não existe, cria uma nova
            data = {
                "user_id": user_id,
                "thread_id": conversation_id,  # Usa conversation_id como thread_id
                "title": title or "Nova conversa",
                "query": title or "Nova conversa"  # Campo obrigatório
            }
            
            result = self.client.table("conversations").insert(data).execute()
            return result.data[0] if result.data else {}
            
        except Exception as e:
            print(f"Erro ao gerenciar conversa no Supabase: {e}")
            return {}
    
    async def save_research_activity(
        self,
        conversation_id: str,
        research_id: str,
        activity_type: str,
        content: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Salva uma atividade de pesquisa"""
        
        # Mapeamento para a estrutura correta do banco
        data = {
            "conversation_id": conversation_id,
            "activity_type": activity_type,
            "description": f"Research {research_id}: {activity_type}",
            "status": "executing",
            "results": content,  # content vai para results (JSONB)
        }
        
        # Adiciona metadata dentro de results se fornecido
        if metadata:
            data["results"]["metadata"] = metadata
        
        try:
            result = self.client.table("research_activities").insert(data).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"Erro ao salvar atividade de pesquisa: {e}")
            return {}
    
    async def get_user_id_from_token(self, token: str) -> Optional[str]:
        """Obtém o ID do usuário a partir do token JWT"""
        try:
            # Verifica o token e obtém o usuário
            response = self.client.auth.get_user(token)
            return response.user.id if response.user else None
        except Exception as e:
            print(f"Erro ao verificar token: {e}")
            return None


# Singleton para reutilizar a conexão
_supabase_client: Optional[SupabaseClient] = None


def get_supabase_client() -> Optional[SupabaseClient]:
    """Retorna o cliente Supabase singleton"""
    global _supabase_client
    
    if _supabase_client is None:
        try:
            _supabase_client = SupabaseClient()
        except Exception as e:
            print(f"Supabase não configurado: {e}")
            return None
    
    return _supabase_client