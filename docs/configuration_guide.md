# Configuration Guide

## 🚀 Quick Setup

Copy the `conf.yaml.example` file to `conf.yaml` and modify the configurations to match your specific settings and requirements.

```bash
cd deer-flow
cp conf.yaml.example conf.yaml
```

## 🔐 Database & Authentication Setup

### Neon Database Configuration

1. **Create Neon Account**: Sign up at [https://console.neon.tech/](https://console.neon.tech/)
2. **Create Project**: Create a new PostgreSQL project
3. **Get Connection String**: Copy the connection string from the dashboard
4. **Configure Environment**: Set `DATABASE_URL` in your `.env` file

```bash
# Example Neon Database URL
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Clerk Authentication Setup

1. **Create Clerk Account**: Sign up at [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. **Create Application**: Create a new application in Clerk dashboard
3. **Configure Settings**: Set up your application settings and providers
4. **Get Keys**: Copy the publishable key and secret key
5. **Configure Environment**: Set Clerk variables in your `.env` file

```bash
# Example Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

## 🤖 LLM Model Configuration

### Which models does DeerFlow support?

In DeerFlow, we currently only support non-reasoning models. This means models like OpenAI's o1/o3 or DeepSeek's R1 are not supported yet, but we plan to add support for them in the future. Additionally, all Gemma-3 models are currently unsupported due to the lack of tool usage capabilities.

### Supported Models

`doubao-1.5-pro-32k-250115`, `gpt-4o`, `qwen-max-latest`, `gemini-2.0-flash`, `deepseek-v3`, and theoretically any other non-reasoning chat models that implement the OpenAI API specification.

> [!NOTE]
> The Deep Research process requires the model to have a **longer context window**, which is not supported by all models.
> A work-around is to set the `Max steps of a research plan` to `2` in the settings dialog located on the top right corner of the web page,
> or set `max_step_num` to `2` when invoking the API.

### How to switch models?
You can switch the model in use by modifying the `conf.yaml` file in the root directory of the project, using the configuration in the [litellm format](https://docs.litellm.ai/docs/providers/openai_compatible).

---

### How to use OpenAI-Compatible models?

DeerFlow supports integration with OpenAI-Compatible models, which are models that implement the OpenAI API specification. This includes various open-source and commercial models that provide API endpoints compatible with the OpenAI format. You can refer to [litellm OpenAI-Compatible](https://docs.litellm.ai/docs/providers/openai_compatible) for detailed documentation.
The following is a configuration example of `conf.yaml` for using OpenAI-Compatible models:

```yaml
# An example of Doubao models served by VolcEngine
BASIC_MODEL:
  base_url: "https://ark.cn-beijing.volces.com/api/v3"
  model: "doubao-1.5-pro-32k-250115"
  api_key: YOUR_API_KEY

# An example of Aliyun models
BASIC_MODEL:
  base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  model: "qwen-max-latest"
  api_key: YOUR_API_KEY

# An example of deepseek official models
BASIC_MODEL:
  base_url: "https://api.deepseek.com"
  model: "deepseek-chat"
  api_key: YOUR_API_KEY

# An example of Google Gemini models using OpenAI-Compatible interface
BASIC_MODEL:
  base_url: "https://generativelanguage.googleapis.com/v1beta/openai/"
  model: "gemini-2.0-flash"
  api_key: YOUR_API_KEY
```

### How to use models with self-signed SSL certificates?

If your LLM server uses self-signed SSL certificates, you can disable SSL certificate verification by adding the `verify_ssl: false` parameter to your model configuration:

```yaml
BASIC_MODEL:
  base_url: "https://your-llm-server.com/api/v1"
  model: "your-model-name"
  api_key: YOUR_API_KEY
  verify_ssl: false  # Disable SSL certificate verification for self-signed certificates
```

> [!WARNING]
> Disabling SSL certificate verification reduces security and should only be used in development environments or when you trust the LLM server. In production environments, it's recommended to use properly signed SSL certificates.

### How to use Ollama models?

DeerFlow supports the integration of Ollama models. You can refer to [litellm Ollama](https://docs.litellm.ai/docs/providers/ollama). <br>
The following is a configuration example of `conf.yaml` for using Ollama models(you might need to run the 'ollama serve' first):

```yaml
BASIC_MODEL:
  model: "model-name"  # Model name, which supports the completions API(important), such as: qwen3:8b, mistral-small3.1:24b, qwen2.5:3b
  base_url: "http://localhost:11434/v1" # Local service address of Ollama, which can be started/viewed via ollama serve
  api_key: "whatever"  # Mandatory, fake api_key with a random string you like :-)
```

### How to use OpenRouter models?

DeerFlow supports the integration of OpenRouter models. You can refer to [litellm OpenRouter](https://docs.litellm.ai/docs/providers/openrouter). To use OpenRouter models, you need to:
1. Obtain the OPENROUTER_API_KEY from OpenRouter (https://openrouter.ai/) and set it in the environment variable.
2. Add the `openrouter/` prefix before the model name.
3. Configure the correct OpenRouter base URL.

The following is a configuration example for using OpenRouter models:
1. Configure OPENROUTER_API_KEY in the environment variable (such as the `.env` file)
```ini
OPENROUTER_API_KEY=""
```
2. Set the model name in `conf.yaml`
```yaml
BASIC_MODEL:
  model: "openrouter/google/palm-2-chat-bison"
```

Note: The available models and their exact names may change over time. Please verify the currently available models and their correct identifiers in [OpenRouter's official documentation](https://openrouter.ai/docs).

### How to use Azure OpenAI chat models?

DeerFlow supports the integration of Azure OpenAI chat models. You can refer to [AzureChatOpenAI](https://python.langchain.com/api_reference/openai/chat_models/langchain_openai.chat_models.azure.AzureChatOpenAI.html). Configuration example of `conf.yaml`:
```yaml
BASIC_MODEL:
  model: "azure/gpt-4o-2024-08-06"
  azure_endpoint: $AZURE_OPENAI_ENDPOINT
  api_version: $OPENAI_API_VERSION
  api_key: $AZURE_OPENAI_API_KEY
```

## 🔍 Search Engine Configuration

### How to control search domains for Tavily?

DeerFlow allows you to control which domains are included or excluded in Tavily search results through the configuration file. This helps improve search result quality and reduce hallucinations by focusing on trusted sources.

`Tips`: it only supports Tavily currently. 

You can configure domain filtering in your `conf.yaml` file as follows:

```yaml
SEARCH_ENGINE:
  engine: tavily
  # Only include results from these domains (whitelist)
  include_domains:
    - trusted-news.com
    - gov.org
    - reliable-source.edu
  # Exclude results from these domains (blacklist)
  exclude_domains:
    - unreliable-site.com
    - spam-domain.net
```

### Supported Search Engines

DeerFlow supports multiple search engines that can be configured in your `.env` file using the `SEARCH_API` variable:

- **Tavily** (default): A specialized search API for AI applications
  - Requires `TAVILY_API_KEY` in your `.env` file
  - Sign up at: https://app.tavily.com/home

- **DuckDuckGo**: Privacy-focused search engine
  - No API key required

- **Brave Search**: Privacy-focused search engine with advanced features
  - Requires `BRAVE_SEARCH_API_KEY` in your `.env` file
  - Sign up at: https://brave.com/search/api/

- **Arxiv**: Scientific paper search for academic research
  - No API key required
  - Specialized for scientific and academic papers

To configure your preferred search engine, set the `SEARCH_API` variable in your `.env` file:

```bash
# Choose one: tavily, duckduckgo, brave_search, arxiv
SEARCH_API=tavily
```

## 📊 Private Knowledge Base Configuration

### RAGFlow Integration

DeerFlow supports private knowledge bases such as RAGFlow, allowing you to use your private documents to answer questions.

```yaml
# Example RAGFlow configuration in .env
RAG_PROVIDER=ragflow
RAGFLOW_API_URL="http://localhost:9388"
RAGFLOW_API_KEY="ragflow-xxx"
RAGFLOW_RETRIEVAL_SIZE=10
```

### VikingDB Integration

```yaml
# Example VikingDB configuration in .env
VIKINGDB_KNOWLEDGE_BASE_API_URL="https://api.vikingdb.com"
VIKINGDB_KNOWLEDGE_BASE_API_AK="your-access-key"
VIKINGDB_KNOWLEDGE_BASE_API_SK="your-secret-key"
VIKINGDB_KNOWLEDGE_BASE_RETRIEVAL_SIZE=10
```

## 🎙️ Text-to-Speech Configuration

### Google Gemini TTS for Podcast Generation

DeerFlow uses Google Gemini TTS for podcast generation with natural-sounding voices:

```bash
# Google Gemini TTS for podcast generation
GOOGLE_API_KEY=your-google-api-key
# Optional: Customize the model and default voice
GOOGLE_TTS_MODEL=gemini-2.5-flash-preview-tts  # Default value
GOOGLE_TTS_VOICE=kore  # Default value (female voice)
```

Available voices:
- **orus**: Male voice
- **kore**: Female voice

### Volcengine TTS for Standalone TTS

For standalone TTS functionality, configure volcengine TTS credentials:

```bash
# Volcengine TTS configuration
VOLCENGINE_ACCESS_KEY=your-access-key
VOLCENGINE_SECRET_KEY=your-secret-key
VOLCENGINE_APP_ID=your-app-id
```

## 🔧 Environment Variables Reference

### 🔐 Authentication & Database

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string with `sslmode`. | Yes | — |
| `NEON_DATABASE_URL` | Alternative Neon database URL. | No | — |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for frontend. | Yes | — |
| `CLERK_SECRET_KEY` | Clerk backend secret key. | Yes | — |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook secret for sync events. | Recommended | — |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend. | Yes | `http://localhost:8000` |

### 🚀 Application Settings

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `ENVIRONMENT` | Application environment (`development`, `staging`, `test`, `production`). | No | `production` |
| `APP_NAME` | Displayed application name. | No | `DeerFlow` |
| `APP_VERSION` | Application version string. | No | `0.1.0` |
| `DEBUG` | Enable verbose backend logging. | No | `false` |
| `HOST` | Backend bind address. | No | `0.0.0.0` |
| `PORT` | Backend port (must remain 8005). | No | `8005` |

### 🗄️ Database Configuration

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `DB_POOL_SIZE` | SQLAlchemy core pool size. | No | `20` |
| `DB_MAX_OVERFLOW` | SQLAlchemy overflow connections. | No | `10` |
| `DB_POOL_TIMEOUT` | Seconds to wait for DB connection. | No | `30` |
| `DB_POOL_RECYCLE` | Seconds before connections recycle. | No | `3600` |

### 🔒 Security & CORS

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `JWT_SECRET_KEY` | 32+ character HMAC secret for tokens. | Yes | — |
| `JWT_ALGORITHM` | JWT signing algorithm. | No | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Minutes before access token expires. | No | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Days before refresh token expires. | No | `7` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins. | No | `http://localhost:4000,http://localhost:3000` |

### 🤖 AI & LLM Integration

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI-compatible API key. | Conditional (OpenAI) | — |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key. | Conditional (Anthropic) | — |
| `GOOGLE_API_KEY` | Google Generative AI / TTS API key. | Conditional (Google) | — |
| `OPENROUTER_API_KEY` | OpenRouter API key. | Conditional (OpenRouter) | — |

### 🔍 Search & Retrieval

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `TAVILY_API_KEY` | Tavily search API key. | Conditional (Tavily) | — |
| `BRAVE_SEARCH_API_KEY` | Brave Search API key. | Conditional (Brave) | — |
| `FIRECRAWL_API_KEY` | Firecrawl extraction API key. | Conditional (Firecrawl) | — |

### 🎙️ Text-to-Speech

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `GOOGLE_TTS_MODEL` | Google TTS model identifier. | Conditional (Podcast) | `gemini-2.5-flash-preview-tts` |
| `GOOGLE_TTS_VOICE` | Google TTS default voice. | Conditional (Podcast) | `kore` |

### 📈 Monitoring & Debugging

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing integration. | No | `false` |
| `LANGSMITH_API_KEY` | LangSmith API key. | Conditional (LangSmith) | — |
| `NODE_ENV` | Enables dev-mode auth bypass when `development`. | Conditional (Local dev) | — |

## 🚀 Deployment Configuration

### Production Environment

For production deployment, ensure the following configurations:

```bash
# Environment
ENVIRONMENT=production
DEBUG=false

# Security
JWT_SECRET_KEY=your-very-secure-32-character-secret-key
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Database (use connection pooling)
DB_POOL_SIZE=50
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=60
DB_POOL_RECYCLE=7200

# Clerk (production keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

### Development Environment

For local development:

```bash
# Environment
ENVIRONMENT=development
DEBUG=true
NODE_ENV=development

# Local database (if not using Neon)
DATABASE_URL=postgresql://localhost/deerflow_dev

# Clerk (development keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure `DATABASE_URL` includes `sslmode=require` for Neon
   - Check if the database is accessible from your network
   - Verify connection string format

2. **Authentication Issues**
   - Verify Clerk keys are correct and match the environment
   - Check if webhook URLs are properly configured in Clerk dashboard
   - Ensure `NEXT_PUBLIC_API_URL` is accessible from frontend

3. **LLM API Issues**
   - Verify API keys are valid and have sufficient credits
   - Check if `base_url` is accessible and correct
   - Ensure model name matches the provider's format

4. **Search Engine Issues**
   - Verify search API keys are valid
   - Check if `SEARCH_API` environment variable is set correctly
   - Ensure search provider is supported

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=true
```

This will provide:
- Detailed SQL query logs
- HTTP request/response logging
- LLM API call details
- Error stack traces

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [LangChain Documentation](https://python.langchain.com/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
