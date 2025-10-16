# Requisitos: Correções e Melhorias DeerFlow

## Contexto
Análise completa do projeto DeerFlow identificou bugs críticos, problemas de segurança, configuração inadequada, e débito técnico em testes e linting que impedem CI/CD e implantação em produção.

---

## Requisitos Funcionais

### RF-1: Hardening de Autenticação e Autorização
**Cenário:** O sistema deve garantir autenticação segura em todas as rotas
- **Dado que** o projeto usa Clerk para autenticação
- **Quando** um usuário faz login ou acessa recursos protegidos
- **Então** o token deve ser verificado corretamente e sem falhas silenciosas

**Critérios de Aceitação:**
- [ ] Variável ENVIRONMENT possui default seguro (não 'dev' em produção)
- [ ] Clerk token verification implementada em src/server/auth.py
- [ ] UserResponse schema alinhado entre backend e frontend
- [ ] JWT_SECRET_KEY validação reforçada (≥32 chars, obrigatório)
- [ ] Tests passam: `pytest src/server/test_auth.py`

**Referência:** src/server/auth.py, src/server/auth_dev.py, web/src/core/api/hooks.ts

---

### RF-2: Configuração Centralizada e Validada
**Cenário:** O sistema deve ter configuração completa e documentada
- **Dado que** conf.yaml está faltando e variáveis de ambiente são inconsistentes
- **Quando** a aplicação inicia
- **Então** todas as dependências estão configuradas ou falham cedo com mensagem clara

**Critérios de Aceitação:**
- [ ] conf.yaml criado com template funcional (conf.example.yaml)
- [ ] ENVIRONMENT vs NODE_ENV consolidados em uma única variável canônica
- [ ] Redis configuração documentada (url, porta, db) com opção de fallback
- [ ] SUPABASE_SERVICE_ROLE_KEY validado no startup (falha loud, não silencioso)
- [ ] Variáveis obrigatórias documentadas em README.md e ENV_VARIABLES_NEEDED.md
- [ ] .env.example completo com todos os valores necessários

**Referência:** src/config/configuration.py, .env.example, README.md

---

### RF-3: Correção do Proxy Next.js
**Cenário:** O proxy API do Next.js deve rotear requisições corretamente
- **Dado que** web/src/app/api/[...path]/route.ts tem problemas
- **Quando** um cliente faz requisição para /api/*
- **Então** a requisição é roteada corretamente e sem console logs vazando

**Critérios de Aceitação:**
- [ ] Handler de proxy funciona sem erros
- [ ] Console logs removidos ou condicionados a DEBUG=true
- [ ] Tratamento de erro HTTP robusto (4xx, 5xx)
- [ ] Headers propagados corretamente
- [ ] Tests passam: `pnpm test web/src/app/api/`

**Referência:** web/src/app/api/[...path]/route.ts, web/src/app/api/webhook-proxy/route.ts

---

### RF-4: Alinhamento de Modelos Kanban
**Cenário:** Modelos do cliente Kanban devem corresponder às respostas da API REST
- **Dado que** há mismatch entre Kanban client models e REST responses
- **Quando** dados de Kanban são buscados
- **Então** os dados são desserializados corretamente sem erros de tipo

**Critérios de Aceitação:**
- [ ] Kanban client models alinhados com REST responses (types.ts)
- [ ] Adapters implementados se houver mudanças breaking
- [ ] Hooks kanban retornam dados tipados corretamente
- [ ] Tests passam: `pnpm test use-kanban-*.ts`
- [ ] Supabase client code removido ou claramente deprecado

**Referência:** web/src/components/jarvis/kanban/hooks/, web/src/components/jarvis/kanban/lib/types.ts

---

### RF-5: Dependências Python e Cobertura de Testes
**Cenário:** Backend Python deve ter testes executáveis com cobertura adequada
- **Dado que** psycopg2 está faltando e cobertura é 19.38%
- **Quando** `uv run pytest` é executado
- **Então** todos os testes passam com cobertura ≥25%

**Critérios de Aceitação:**
- [ ] psycopg2 adicionado ao pyproject.toml com versão pinada
- [ ] pytest executa completamente: `uv run pytest --cov=src`
- [ ] Cobertura de testes ≥25% (meta intermediária)
- [ ] Health-check SQL compatível com SQLite e PostgreSQL
- [ ] CI workflow .github/workflows/unittest.yaml passa

**Referência:** pyproject.toml, src/server/health.py, .github/workflows/unittest.yaml

---

## Requisitos Não-Funcionais

### RNF-1: Qualidade de Código TypeScript/Frontend
**Descrição:** Eliminar violações de linting no frontend
- **Critério de Aceitação:**
  - [ ] Import order corrigido em todos os arquivos (eslint-plugin-import)
  - [ ] Uso de `any` eliminado ou justificado com @ts-ignore + comentário
  - [ ] Variáveis não-utilizadas removidas
  - [ ] Missing awaits corrigidos (async functions)
  - [ ] `pnpm lint` passa sem erros ou warnings
  - [ ] `pnpm format` padroniza código

**Referência:** web/eslint.config.js, web/prettier.config.js

---

### RNF-2: Documentação de Configuração e Setup
**Descrição:** Guias claros para desenvolvedores e operations
- **Critério de Aceitação:**
  - [ ] README.md atualiza seção de environment variables obrigatórias
  - [ ] ENV_VARIABLES_NEEDED.md lista todas com descrições e defaults
  - [ ] QUICK_START.md inclui checklist de config
  - [ ] Startup errors mensagens claras e acionáveis
  - [ ] Docker Compose .env template incluído

**Referência:** README.md, QUICK_START.md, ENV_VARIABLES_NEEDED.md, docker-compose.yaml

---

### RNF-3: Segurança em Produção
**Descrição:** Garantir práticas de segurança apropriadas
- **Critério de Aceitação:**
  - [ ] Sem hardcoding de URLs, ports ou service keys
  - [ ] Secrets validados obrigatoriamente no startup
  - [ ] Erros não expõem stack traces em produção
  - [ ] Rate limiting documentado e funcional
  - [ ] CORS configuração restritiva

**Referência:** src/server/app.py, src/server/rate_limiter.py, src/server/auth.py

---

## Priorização

| Requisito | Prioridade | Justificativa |
|-----------|-----------|---------------|
| RF-1 Auth Hardening | P0 - Crítico | Segurança e falhas de login |
| RF-2 Config | P0 - Crítico | Bloqueador para startup |
| RF-5 Dependências | P0 - Crítico | Testes não rodam |
| RF-3 Next.js Proxy | P1 - Alto | Impacta todas as requisições |
| RNF-1 TypeScript Linting | P1 - Alto | CI/CD falha |
| RF-4 Kanban | P2 - Médio | Funcionalidade específica |
| RNF-2 Documentação | P2 - Médio | Manutenibilidade |
| RNF-3 Segurança | P2 - Médio | Produção readiness |

---

## Notas e Restrições
- Mudanças em auth.py requerem testes E2E com Clerk sandbox
- Configurações devem ser backward-compatible onde possível
- TypeScript migration incremental (não refazer tudo de uma vez)
- Database migrations devem suportar PostgreSQL ≥12

---

## Referências de Descobertas (Análise Droid)
- **Backend Issues:** psycopg2 missing, coverage 19.38%, health-check SQL PostgreSQL-only
- **Frontend Issues:** Hundreds of lint violations, proxy handler errors, console.log leaks
- **Config Issues:** conf.yaml missing, Redis hardcoded, env var naming inconsistent, SUPABASE_SERVICE_ROLE_KEY silent failures
- **Auth Issues:** ENVIRONMENT default unsafe, Clerk verification incomplete, UserResponse mismatch