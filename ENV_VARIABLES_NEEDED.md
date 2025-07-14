# Variáveis de Ambiente Necessárias para DeerFlow

## ✅ Já Configuradas
- `TAVILY_API_KEY` - API para busca na web (configurada)
- `NEXT_PUBLIC_API_URL` - URL da API backend (configurada)
- `GOOGLE_API_KEY` - API do Google Gemini para TTS/Podcasts (configurada)
- `FIRECRAWL_API_KEY` - API para web scraping avançado (configurada)
- `BRAVE_SEARCH_API_KEY` - API alternativa para busca web (configurada)

## 🔧 Opcionais mas Recomendadas

### Para Text-to-Speech (TTS) - Podcasts
Se você quiser gerar podcasts:
- `GOOGLE_API_KEY` - Necessária para gerar podcasts com o Google Gemini TTS
- `GOOGLE_TTS_MODEL` - (opcional) padrão: gemini-2.5-flash-preview-tts
- `GOOGLE_TTS_VOICE` - (opcional) padrão: kore (feminina), outras: orus (masculina)

### Para TTS Geral (Volcengine)
Se você quiser usar TTS da Volcengine:
- `VOLCENGINE_TTS_APPID` - ID da aplicação Volcengine
- `VOLCENGINE_TTS_ACCESS_TOKEN` - Token de acesso

### Para Busca Alternativa
Se você quiser usar outros mecanismos de busca:
- `BRAVE_SEARCH_API_KEY` - Se usar SEARCH_API=brave_search
- `JINA_API_KEY` - Para melhorar a extração de conteúdo web (opcional)

### Para RAG (Retrieval-Augmented Generation)
Se você quiser usar RAG local:
- `RAG_PROVIDER=ragflow`
- `RAGFLOW_API_URL` - URL da API RAGFlow
- `RAGFLOW_API_KEY` - Chave da API RAGFlow

### Para Monitoramento (LangSmith)
Se você quiser monitorar as execuções:
- `LANGSMITH_TRACING=true`
- `LANGSMITH_API_KEY` - Chave da API LangSmith
- `LANGSMITH_PROJECT` - Nome do projeto

## Como Adicionar Variáveis

1. Edite o arquivo `.env`:
```bash
echo "GOOGLE_API_KEY=sua-chave-aqui" >> .env
```

2. Ou exporte temporariamente:
```bash
export GOOGLE_API_KEY=sua-chave-aqui
```

3. Reinicie o servidor após adicionar novas variáveis:
```bash
pkill -f server.py
uv run server.py
```

## Nota
A maioria dessas variáveis são opcionais. O sistema funciona com apenas:
- Configuração dos modelos LLM em `conf.yaml`
- `TAVILY_API_KEY` para pesquisas web