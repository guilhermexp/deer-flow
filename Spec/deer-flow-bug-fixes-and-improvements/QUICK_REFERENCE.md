# 🚀 Quick Reference - DeerFlow Workflow

## 📍 Localização
```
Spec/deer-flow-bug-fixes-and-improvements/
├── README.md ..................... Guia completo (comece aqui!)
├── requirements.md ............... O QUE fazer (8 requisitos)
├── design.md ..................... COMO fazer (6 designs)
├── tasks.md ...................... QUEM/QUANDO (29 tasks)
└── QUICK_REFERENCE.md ............ Este arquivo
```

## ⚡ Início Rápido

### 1. Entender o Escopo (5 min)
```bash
# Leia os problemas identificados
cat requirements.md | head -50
```

### 2. Entender a Arquitetura (10 min)
```bash
# Veja os designs
grep "^## D-" design.md
```

### 3. Iniciar Implementação (40h)
```bash
# Abra tasks.md e comece pela Fase 1
# Task 1.1.1: Refatorar configuration.py
```

## 📊 Resumo Executivo

| Aspecto | Detalhes |
|---------|----------|
| **Problemas** | 8 (3 P0, 2 P1, 3 P2) |
| **Requisitos** | 5 RF + 3 RNF |
| **Designs** | 6 componentes |
| **Tasks** | 29 detalhadas |
| **Tempo Total** | ~40 horas |
| **Fases** | 5 (P0→P1→P2) |
| **Arquivos** | ~30 modificados |

## 🎯 Problemas P0 (Crítico)

| ID | Problema | Solução |
|----|----------|---------|
| RF-1 | Auth insegura | Clerk verification + UserResponse schema |
| RF-2 | Config inconsistente | Pydantic BaseSettings + YAML |
| RF-5 | Testes falhando | psycopg2 + pytest coverage |

## 🟠 Problemas P1 (Alto)

| ID | Problema | Solução |
|----|----------|---------|
| RF-3 | Proxy com bugs | Refatorar handler, remover logs |
| RNF-1 | TypeScript violations | pnpm lint --fix + manual review |

## 🔵 Problemas P2 (Médio)

| ID | Problema | Solução |
|----|----------|---------|
| RF-4 | Kanban misaligned | Adapters + REST API |
| RNF-2 | Docs faltando | ENV_VARIABLES_NEEDED.md |
| RNF-3 | Security gaps | Validação de secrets |

## 📋 Fases

### Fase 1: Setup (6h)
- 1.1: Centralizar config
- 1.2: Adicionar psycopg2
- 1.3: Documentação

### Fase 2: Auth (8h)
- 2.1: Hardening auth
- 2.2: Health check

### Fase 3: Proxy (10h)
- 3.1: Refatorar proxy
- 3.2: TypeScript linting

### Fase 4: Kanban (8h)
- 4.1: Alinhamento de modelos

### Fase 5: Testes (8h)
- 5.1: Cobertura de testes
- 5.2: Documentação final
- 5.3: Validação

## ✅ Checklist de Aprovação

- [ ] Requirements revisados
- [ ] Design aprovado
- [ ] Tasks validadas
- [ ] Estratégia escolhida (manual/paralelo/auto)
- [ ] Equipe alocada
- [ ] Pronto para começar!

## 🔗 Arquivos Principais

### Backend Python
```
src/config/configuration.py ......... Config centralizada
src/server/auth.py ................. Clerk verification
src/server/app.py .................. Middleware auth
src/server/health.py ............... SQLite compat
pyproject.toml ..................... psycopg2 + pytest
```

### Frontend TypeScript
```
web/src/app/api/[...path]/route.ts .. Proxy refatorado
web/src/core/api/hooks.ts ........... useAuth hook
web/src/components/jarvis/kanban/ ... Kanban models
web/eslint.config.js ............... Linting rules
```

### Configuração
```
conf.example.yaml .................. Config template
.env.example ........................ Env vars
README.md ........................... Documentação
ENV_VARIABLES_NEEDED.md ............ Matriz de vars
```

## 🚀 Comandos Rápidos

```bash
# Validar config
python -c "from src.config import load_config; load_config()"

# Rodar testes
pytest --cov=src --cov-report=term

# Linting
pnpm lint

# Formatação
pnpm format

# Startup
python server.py &
pnpm dev

# CI/CD
git push  # Verifica lint.yaml, unittest.yaml, container.yaml
```

## 📞 Dúvidas?

| Pergunta | Resposta |
|----------|----------|
| O que fazer? | Leia `requirements.md` |
| Como fazer? | Leia `design.md` |
| Qual task executar? | Leia `tasks.md` |
| Como começar? | Leia `README.md` |
| Preciso de ajuda? | Revise `design.md` seção D-X |

## 🎓 Próximos Passos

1. ✅ Workflow criado (você está aqui)
2. ⏳ Revisar documentos
3. ⏳ Aprovar especificação
4. ⏳ Iniciar Fase 1
5. ⏳ Completar todas as fases
6. ⏳ Validar globalmente
7. ⏳ Deploy em produção

---

**Tempo estimado para ler tudo:** 30 minutos  
**Tempo estimado para implementar:** 40 horas  
**Tempo estimado para validar:** 2 horas

**Total:** ~42 horas de trabalho

---

Comece por: `Spec/deer-flow-bug-fixes-and-improvements/README.md`
