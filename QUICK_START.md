# 🦌 DeerFlow - Início Rápido

## 🚀 Como Iniciar

### 1. Primeira vez? Instale as dependências:
```bash
./start.sh --install
```

### 2. Iniciar o sistema:
```bash
./start.sh
```

### 3. Acessar:
- 🌐 **Frontend**: http://localhost:4000
- 🔧 **Backend API**: http://localhost:8005/api

### 4. Parar o sistema:
```bash
./stop.sh
# ou pressione Ctrl+C
```

## 🎯 Modelos Disponíveis

O sistema vem configurado com múltiplos modelos LLM:

- **Google Gemini 2.5 Pro** (padrão)
- **Kimi K2** (MoonshotAI)
- **Grok 4** (xAI)
- **DeepSeek V3** (gratuito)
- **DeepSeek R1** (modelo de raciocínio)

Você pode selecionar o modelo desejado diretamente na interface do chat.

## 📁 Estrutura Simplificada

```
.
├── .env                # Todas as configurações em um só lugar
├── start.sh           # Script para iniciar tudo
├── stop.sh            # Script para parar tudo
├── backend.log        # Logs do backend (gerado automaticamente)
├── frontend.log       # Logs do frontend (gerado automaticamente)
└── conf.yaml          # Configuração dos modelos LLM
```

## ⚡ Desenvolvimento

- **Backend reinicia automaticamente** ao editar arquivos Python
- **Frontend reinicia automaticamente** ao editar arquivos TypeScript/React
- **Logs**: Verifique `backend.log` e `frontend.log` em caso de problemas
- **Autenticação**: Em desenvolvimento, não é necessário fazer login

## 🛠️ Comandos Úteis

```bash
# Iniciar com reinstalação de dependências
./start.sh --install

# Iniciar com reload automático do backend
./start.sh --reload

# Reiniciar tudo (mata processos existentes)
./start.sh --restart

# Ver opções disponíveis
./start.sh --help
```

## 📝 Configuração

Todas as configurações estão no arquivo `.env` na raiz do projeto:
- APIs dos LLMs
- Configurações do Neon PostgreSQL
- URLs do backend/frontend

## 🚨 Problemas Comuns

**Porta já em uso?**
```bash
./stop.sh
./start.sh --restart
```

**Backend não conecta?**
- Verifique se `NEXT_PUBLIC_API_URL=http://localhost:8005/api` está no `.env`
- Reinicie o frontend após alterar variáveis de ambiente

**Erro de autenticação?**
- Em desenvolvimento, a autenticação é opcional
- Verifique se `NODE_ENV=development` está no `.env`

---
✨ **Dica**: Use `./start.sh` e o sistema cuida de todo o resto!