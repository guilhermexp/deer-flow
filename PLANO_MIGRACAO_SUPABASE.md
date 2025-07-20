# Plano Detalhado de Migração para Supabase Auth

## 📋 Resumo Executivo
Este documento detalha o plano completo para migrar o sistema de autenticação JWT customizado para usar exclusivamente o Supabase Auth, eliminando a duplicação atual.

## 🔍 Análise da Situação Atual

### Sistema JWT Customizado (Backend)
- **Localização**: `/src/server/auth.py` e `/src/server/auth_routes.py`
- **Tokens**: Access (30 min) + Refresh (7 dias)
- **Banco**: SQLAlchemy com modelo User local
- **Endpoints protegidos**: 40+ endpoints usando `Depends(get_current_active_user)`

### Sistema Supabase (Frontend)
- **Localização**: `/web/src/lib/supabase/` e `/web/src/services/supabase/`
- **Auth**: Supabase Auth com suporte a OAuth
- **Middleware**: Já configurado para refresh automático
- **Problema**: Frontend usa ambos os sistemas (JWT + Supabase)

## 🎯 Objetivos da Migração

1. Usar exclusivamente Supabase Auth
2. Manter compatibilidade com todos os endpoints existentes
3. Zero downtime durante a migração
4. Preservar todas as relações de dados dos usuários

## 📊 Mapeamento de Endpoints Afetados

### Rotas de Autenticação
- `/api/auth/register` → Supabase signUp
- `/api/auth/login` → Supabase signIn
- `/api/auth/refresh` → Supabase session refresh
- `/api/auth/me` → Supabase getUser

### Rotas Protegidas (40+ endpoints)
- **Dashboard**: tasks, reminders, stats
- **Calendar**: events CRUD
- **Notes**: notes CRUD, attachments
- **Projects**: projects, kanban tasks
- **Health**: health data tracking
- **Conversations**: chat history

## 🔄 Estratégia de Migração

### Fase 1: Preparação (Sem Breaking Changes)
1. **Criar tabela de mapeamento** user_id ↔ supabase_id
2. **Implementar auth duplo** no backend (aceitar JWT e Supabase)
3. **Adicionar middleware** para validar tokens Supabase
4. **Criar funções helper** para migração gradual

### Fase 2: Backend - Suporte Duplo
1. **Modificar `get_current_user`**:
   ```python
   async def get_current_user(
       authorization: str = Header(None),
       db: Session = Depends(get_db)
   ):
       # Tentar JWT primeiro (retrocompatibilidade)
       if jwt_token := extract_jwt(authorization):
           return await get_user_from_jwt(jwt_token, db)
       
       # Tentar Supabase token
       if supabase_token := extract_supabase(authorization):
           return await get_user_from_supabase(supabase_token, db)
       
       raise HTTPException(401)
   ```

2. **Sincronizar usuários**:
   - Criar/atualizar user profile no Supabase quando JWT é usado
   - Mapear supabase_id no modelo User existente

### Fase 3: Frontend - Migração Gradual
1. **Remover client.ts JWT**:
   - Parar de usar localStorage para tokens
   - Usar apenas Supabase client
   
2. **Atualizar API calls**:
   - Substituir apiClient por supabase client wrapper
   - Manter mesma interface para minimizar mudanças

3. **Migrar fluxos de auth**:
   - Login/Register usar Supabase
   - Remover contexto JWT, usar apenas Supabase

### Fase 4: Cleanup
1. **Remover código JWT** do backend
2. **Remover tabelas temporárias**
3. **Atualizar documentação**

## ⚠️ Pontos Críticos e Mitigações

### 1. **User ID Mismatch**
- **Problema**: IDs locais vs Supabase UUIDs
- **Solução**: Manter ID local, adicionar coluna supabase_id
- **FK Relations**: Continuar usando ID local

### 2. **Token Format**
- **Problema**: JWT vs Supabase JWT (diferente estrutura)
- **Solução**: Middleware inteligente que detecta tipo

### 3. **Session Management**
- **Problema**: Refresh token flow diferente
- **Solução**: Usar Supabase session refresh automático

### 4. **Permissões/RLS**
- **Problema**: Backend valida tudo vs RLS do Supabase
- **Solução**: Manter validação no backend inicialmente

### 5. **OAuth Integration**
- **Problema**: Criar usuários locais para OAuth
- **Solução**: Webhook Supabase para sincronizar

## 🛠️ Implementação Técnica

### Backend Modifications

```python
# src/server/supabase_auth.py
from supabase import create_client, Client
import jwt

class SupabaseAuthMiddleware:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_ANON_KEY")
        )
    
    async def verify_token(self, token: str) -> dict:
        try:
            # Verificar com Supabase
            user = self.supabase.auth.get_user(token)
            return user
        except Exception:
            return None
    
    async def get_or_create_local_user(
        self, 
        supabase_user: dict,
        db: Session
    ) -> User:
        # Buscar por supabase_id
        user = db.query(User).filter(
            User.supabase_id == supabase_user['id']
        ).first()
        
        if not user:
            # Criar usuário local
            user = User(
                email=supabase_user['email'],
                username=supabase_user['email'].split('@')[0],
                supabase_id=supabase_user['id'],
                is_active=True
            )
            db.add(user)
            db.commit()
        
        return user
```

### Database Migration

```sql
-- Adicionar coluna supabase_id
ALTER TABLE users ADD COLUMN supabase_id UUID UNIQUE;

-- Índice para performance
CREATE INDEX idx_users_supabase_id ON users(supabase_id);

-- Trigger para sincronização (opcional)
CREATE TRIGGER sync_supabase_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_to_local_users();
```

### Frontend Modifications

```typescript
// src/core/api/supabase-client.ts
class SupabaseAPIClient {
  async request(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        // Trigger Supabase refresh
        await supabase.auth.refreshSession()
        // Retry request...
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
}
```

## 📅 Cronograma

### Semana 1: Preparação
- [ ] Adicionar coluna supabase_id
- [ ] Implementar SupabaseAuthMiddleware
- [ ] Criar testes de integração
- [ ] Setup ambiente de staging

### Semana 2: Backend Dual Support
- [ ] Modificar get_current_user
- [ ] Testar todos endpoints com ambos tokens
- [ ] Implementar sincronização de usuários
- [ ] Monitorar logs de erro

### Semana 3: Frontend Migration
- [ ] Substituir apiClient gradualmente
- [ ] Migrar fluxos de autenticação
- [ ] Testar funcionalidades críticas
- [ ] Deploy em produção com feature flag

### Semana 4: Cleanup
- [ ] Remover código JWT antigo
- [ ] Atualizar documentação
- [ ] Monitorar métricas
- [ ] Rollback plan se necessário

## 🧪 Plano de Testes

1. **Testes Unitários**
   - Novo middleware auth
   - Sincronização de usuários
   - Token validation

2. **Testes de Integração**
   - Todos endpoints com Supabase token
   - Fluxo completo de auth
   - OAuth providers

3. **Testes E2E**
   - Login/Register/Logout
   - Acesso a recursos protegidos
   - Session refresh

4. **Testes de Carga**
   - Performance do novo auth
   - Latência adicional

## 🚨 Plano de Rollback

1. **Feature Flags**
   ```python
   USE_SUPABASE_AUTH = os.getenv('USE_SUPABASE_AUTH', 'false') == 'true'
   ```

2. **Dual Mode**
   - Manter ambos sistemas funcionando
   - Rollback instantâneo via env var

3. **Database Rollback**
   - Manter backup antes da migration
   - Script para reverter schema

## 📊 Métricas de Sucesso

1. **Zero downtime** durante migração
2. **100% dos endpoints** funcionando com Supabase
3. **Latência auth** < 100ms p95
4. **Zero perda de dados** de usuários
5. **Redução de código** ~500 linhas

## 🔐 Considerações de Segurança

1. **Token Validation**
   - Validar JWT signature
   - Verificar issuer/audience
   - Check token expiration

2. **Rate Limiting**
   - Implementar no API Gateway
   - Proteger endpoints de auth

3. **Audit Trail**
   - Log todas mudanças de auth
   - Monitorar tentativas falhas

## 📝 Checklist Pré-Deploy

- [ ] Backup completo do banco
- [ ] Variáveis de ambiente configuradas
- [ ] Testes passando em staging
- [ ] Documentação atualizada
- [ ] Equipe notificada
- [ ] Plano de rollback testado
- [ ] Monitoramento configurado

## 🎯 Resultado Final

Após a migração completa:
- ✅ Apenas Supabase Auth em uso
- ✅ Código mais simples e manutenível
- ✅ OAuth providers integrados
- ✅ Melhor segurança com RLS
- ✅ Session management automático