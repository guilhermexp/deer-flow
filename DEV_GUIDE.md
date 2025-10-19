# 🦌 Deer Flow - Guia de Desenvolvimento

## 🚀 Início Rápido - Rodando Frontend + Backend Juntos

### Opção 1: Makefile (Recomendado)
```bash
# Instalar dependências dos scripts
make install-scripts

# Iniciar ambos os serviços
make dev
```

### Opção 2: Script Shell (Mais Completo)
```bash
# Script completo com logs e monitoramento
./scripts/dev.sh
```

### Opção 3: LangGraph (Backend Avançado)
```bash
# Com LangGraph Studio
./scripts/dev-langgraph.sh
```

### Opção 4: Manualmente
```bash
# Terminal 1 - Backend
make serve

# Terminal 2 - Frontend
cd web && pnpm dev
```

---

## 📋 Comandos Disponíveis

### Makefile
```bash
make help              # Mostra todos os comandos disponíveis
make dev               # Inicia frontend + backend (recomendado)
make dev-full          # Inicia com LangGraph backend
make dev-simple        # Inicia versão simples
make stop-dev          # Para todos os servidores
make serve             # Apenas backend
make test-all          # Executa todos os testes
make lint-full         # Lint completo do projeto
```

### Scripts Shell
```bash
./scripts/dev.sh              # Frontend + Backend com logs
./scripts/dev-langgraph.sh     # Frontend + LangGraph com logs
```

### Package.json (Frontend)
```bash
cd web
pnpm dev               # Apenas frontend
pnpm dev:all           # Frontend + Backend (requer concurrently)
pnpm build             # Build de produção
pnpm test:run          # Executar testes
pnpm lint:fix          # Corrigir lint issues
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:4000 | Next.js + React |
| Backend (Básico) | http://localhost:8000 | FastAPI + Uvicorn |
| LangGraph Studio | http://localhost:2024 | Interface visual do LangGraph |

---

## 📁 Estrutura do Projeto

```
deer-flow/
├── web/                    # Frontend Next.js
│   ├── src/               # Código fonte
│   ├── package.json       # Dependências frontend
│   └── pnpm-lock.yaml     # Lock file
├── scripts/               # Scripts de desenvolvimento
│   ├── dev.sh            # Script de desenvolvimento
│   └── dev-langgraph.sh  # Script com LangGraph
├── logs/                  # Logs dos servidores (criado automaticamente)
├── Makefile              # Comandos make
├── pyproject.toml        # Configuração Python
└── server.py             # Servidor backend
```

---

## 🔧 Pré-requisitos

### Necessário:
- **Python 3.12+**
- **Node.js 18+**
- **pnpm** (gerenciador de pacotes)
- **uv** (gerenciador de ambiente Python)

### Instalação:
```bash
# Instalar UV (Python)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Instalar PNPM (Node.js)
npm install -g pnpm
```

---

## 🗂️ Logs e Monitoramento

### Logs Automáticos
Os scripts criam logs na pasta `./logs/`:
- `frontend.log` - Saída do Next.js
- `backend.log` - Saída do servidor Python
- `langgraph.log` - Saída do LangGraph

### Monitoramento em Tempo Real
```bash
# Ver logs do frontend
tail -f logs/frontend.log

# Ver logs do backend
tail -f logs/backend.log

# Ver todos os logs
tail -f logs/*.log
```

---

## 🛠️ Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz:
```env
# Backend
DATABASE_URL=sqlite:///./deer_flow.db
OPENAI_API_KEY=sua_chave_aqui

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Portas Configuradas
- Frontend: 4000
- Backend: 8000
- LangGraph: 2024

---

## 🐛 Troubleshooting

### Portas Ocupadas
```bash
# Ver processos nas portas
lsof -i :4000  # Frontend
lsof -i :8000  # Backend
lsof -i :2024  # LangGraph

# Matar processos
make stop-dev  # Para todos
# ou manualmente
pkill -f "next dev"
pkill -f "server.py"
```

### Dependências
```bash
# Reinstalar tudo
rm -rf web/node_modules .venv
make install-dev
cd web && pnpm install
```

### Permissões dos Scripts
```bash
# Se os scripts não executarem
chmod +x scripts/dev.sh scripts/dev-langgraph.sh
make install-scripts
```

---

## 🚀 Deploy

### Build de Produção
```bash
# Testar build
make test-build-frontend

# Build manual
cd web && pnpm build
```

### Variáveis de Produção
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://sua-api.com
```

---

## 📚 Recursos Adicionais

### Documentação
- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph)

### Ferramentas Úteis
- **LangGraph Studio**: http://localhost:2024 (se usando LangGraph)
- **React DevTools**: Extensão do navegador
- **Python Debugger**: `uv run python -m pdb server.py`

---

## 🤝 Contribuição

### Fluxo de Trabalho
1. Faça fork do projeto
2. Crie branch: `git checkout -b feature/nova-funcionalidade`
3. Faça as mudanças
4. Teste: `make test-all && make lint-full`
5. Commit: `git commit -m "feat: nova funcionalidade"`
6. Push: `git push origin feature/nova-funcionalidade`
7. Abra PR

### Code Quality
```bash
# Verificar qualidade do código
make lint-full     # Lint completo
make test-all      # Todos os testes
```

---

**🎉 Pronto para desenvolver! Use `make dev` para começar!**