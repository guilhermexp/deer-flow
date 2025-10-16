# Installation & Development Guide

## 🚀 Quick Start

This guide will help you set up DeerFlow for development using the new Neon PostgreSQL + Clerk Authentication architecture.

## 📋 Prerequisites

### Required Software

- **Python 3.12+**: [Download](https://www.python.org/downloads/)
- **Node.js 22+**: [Download](https://nodejs.org/en/download/)
- **Git**: [Download](https://git-scm.com/)

### Recommended Tools

- **[`uv`](https://docs.astral.sh/uv/getting-started/installation/)**: Python environment and dependency management
- **[`nvm`](https://github.com/nvm-sh/nvm)**: Node.js version management
- **[`pnpm`](https://pnpm.io/installation)**: Fast, reliable package manager
- **Docker**: [Download](https://www.docker.com/products/docker-desktop/) (optional)

### External Services

1. **Neon Database**: [Sign up](https://console.neon.tech/)
2. **Clerk Authentication**: [Sign up](https://dashboard.clerk.com/)
3. **LLM API Key** (choose one):
   - [OpenAI](https://platform.openai.com/api-keys)
   - [Anthropic](https://console.anthropic.com/)
   - [Google AI Studio](https://aistudio.google.com/app/apikey)
4. **Search API** (choose one):
   - [Tavily](https://app.tavily.com/home) (recommended)
   - [Brave Search](https://brave.com/search/api/)

## 🛠️ Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/bytedance/deer-flow.git
cd deer-flow
```

### 2. Backend Setup

```bash
# Install Python dependencies using uv
uv sync

# This will:
# - Create a virtual environment in .venv/
# - Install all dependencies from pyproject.toml
# - Install the package in editable mode
```

### 3. Frontend Setup

```bash
cd web

# Install Node.js dependencies
pnpm install

# Return to root directory
cd ..
```

### 4. Environment Configuration

#### Backend Environment (.env)

```bash
# Copy the example environment file
cp .env.example .env

# Edit the file with your configuration
nano .env  # or use your preferred editor
```

**Required Variables:**

```bash
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
JWT_SECRET_KEY=your-32-character-secret-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8005

# LLM Configuration (choose one)
OPENAI_API_KEY=sk-xxx
# OR
ANTHROPIC_API_KEY=sk-ant-xxx
# OR
GOOGLE_API_KEY=xxx

# Search Engine (choose one)
TAVILY_API_KEY=tvly-xxx
# OR
BRAVE_SEARCH_API_KEY=BSK-xxx
```

#### Frontend Environment (web/.env.local)

```bash
# Copy the example environment file
cp web/.env.example web/.env.local

# Edit the file
nano web/.env.local
```

**Required Variables:**

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# API URL
NEXT_PUBLIC_API_URL=http://localhost:8005

# Environment
NODE_ENV=development
```

### 5. LLM Configuration

```bash
# Copy the configuration file
cp conf.yaml.example conf.yaml

# Edit with your preferred LLM configuration
nano conf.yaml
```

**Example Configuration:**

```yaml
# OpenAI Configuration
BASIC_MODEL:
  model: "gpt-4o"
  api_key: ${OPENAI_API_KEY}

# OR Anthropic Configuration
BASIC_MODEL:
  model: "claude-3-5-sonnet-20241022"
  api_key: ${ANTHROPIC_API_KEY}

# OR Google Gemini Configuration
BASIC_MODEL:
  model: "gemini-2.0-flash"
  api_key: ${GOOGLE_API_KEY}

# Search Engine Configuration
SEARCH_ENGINE:
  engine: tavily  # or duckduckgo, brave_search, arxiv
```

### 6. Database Setup

#### Neon Database (Recommended)

1. **Create Neon Account**: [https://console.neon.tech/](https://console.neon.tech/)
2. **Create Project**: Click "New Project"
3. **Get Connection String**: Copy from the dashboard
4. **Update .env**: Set `DATABASE_URL`

#### Local Database (Development Only)

```bash
# Install PostgreSQL
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb deerflow_dev

# Update .env
DATABASE_URL=postgresql://localhost/deerflow_dev
```

### 7. Run Database Migrations

```bash
# Run Alembic migrations
uv run alembic upgrade head

# This will create all necessary tables
```

## 🚀 Running the Application

### Development Mode (Recommended)

```bash
# Start both backend and frontend
# On macOS/Linux
./bootstrap.sh -d

# On Windows
bootstrap.bat -d
```

This will:
- Start the FastAPI backend on http://localhost:8005
- Start the Next.js frontend on http://localhost:3000
- Enable hot reloading for both services

### Manual Startup

#### Backend Only

```bash
# Start the FastAPI server
uv run uvicorn src.server.app:app --reload --host 0.0.0.0 --port 8005

# Or using the script
uv run server.py
```

#### Frontend Only

```bash
cd web

# Start the Next.js development server
pnpm dev

# This will start on http://localhost:3000
```

#### Console Interface

```bash
# Run the CLI version
uv run main.py

# Interactive mode
uv run main.py --interactive

# With specific query
uv run main.py "What is artificial intelligence?"
```

## 🔧 Development Workflow

### 1. Code Structure

```
deer-flow/
├── src/                    # Backend source code
│   ├── server/            # FastAPI application
│   ├── agents/            # AI agents
│   ├── database/          # Database models
│   ├── config/            # Configuration
│   └── utils/             # Utilities
├── web/                   # Frontend source code
│   ├── src/               # React components
│   ├── app/               # Next.js app router
│   ├── components/        # Reusable components
│   └── lib/               # Frontend utilities
├── docs/                  # Documentation
├── tests/                 # Test files
└── scripts/               # Utility scripts
```

### 2. Making Changes

#### Backend Changes

```bash
# After making changes to models
uv run alembic revision --autogenerate -m "Description of changes"
uv run alembic upgrade head

# Restart the backend server (it should auto-reload)
```

#### Frontend Changes

```bash
# The frontend will automatically reload when you save files
# No manual restart needed
```

#### Configuration Changes

```bash
# After changing conf.yaml, restart the backend
# After changing .env files, restart both services
```

### 3. Testing

#### Backend Tests

```bash
# Run all tests
make test

# Run specific test file
pytest tests/integration/test_workflow.py

# Run with coverage
make coverage

# Run with verbose output
pytest -v tests/
```

#### Frontend Tests

```bash
cd web

# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:coverage
```

### 4. Code Quality

#### Backend

```bash
# Format code
make format

# Run linting
make lint

# Type checking
uv run mypy src/

# Security check
uv run bandit -r src/
```

#### Frontend

```bash
cd web

# Format code
pnpm format

# Run linting
pnpm lint

# Type checking
pnpm type-check

# Security check
pnpm audit
```

## 🔍 Debugging

### Backend Debugging

#### Enable Debug Mode

```bash
# Set in .env
DEBUG=true

# Or set temporarily
DEBUG=true uv run server.py
```

#### Database Debugging

```bash
# Check database connection
uv run python -c "from src.database.base import engine; print(engine.url)"

# Run database health check
curl http://localhost:8005/api/health

# View SQL queries (when DEBUG=true)
# Queries will be printed to console
```

#### LLM Debugging

```bash
# Test LLM connection
uv run python -c "
from src.llms.llm import get_llm
llm = get_llm()
print(llm.invoke('Hello, world!'))
"
```

### Frontend Debugging

#### Browser DevTools

1. **Open DevTools**: F12 or Ctrl+Shift+I
2. **Network Tab**: Check API calls
3. **Console Tab**: View errors and logs
4. **Components Tab**: Inspect React components

#### React Query DevTools

```bash
# Install React Query DevTools browser extension
# https://chromewebstore.google.com/detail/react-query-devtools/
```

#### Clerk Debugging

```bash
# Check Clerk configuration
# Open browser console and run:
window.Clerk?.session?.getToken()
```

## 🐳 Docker Development

### Using Docker Compose

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Individual Services

```bash
# Backend only
docker build -t deer-flow-backend .
docker run -p 8005:8005 --env-file .env deer-flow-backend

# Frontend only
cd web
docker build -t deer-flow-frontend .
docker run -p 3000:3000 --env-file .env.local deer-flow-frontend
```

## 🔧 Common Issues & Solutions

### Database Issues

#### Connection Refused

```bash
# Check if DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# For Neon, ensure sslmode=require
```

#### Migration Errors

```bash
# Reset migrations (development only)
uv run alembic downgrade base
uv run alembic upgrade head

# Or drop and recreate database
dropdb deerflow_dev
createdb deerflow_dev
uv run alembic upgrade head
```

### Authentication Issues

#### Clerk Not Working

```bash
# Check Clerk keys
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Verify webhook configuration
# Check Clerk dashboard → Webhooks → Endpoint
```

#### CORS Errors

```bash
# Check CORS configuration in backend
# Ensure NEXT_PUBLIC_API_URL is correct
# Check CORS_ALLOWED_ORIGINS in .env
```

### LLM Issues

#### API Key Errors

```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check conf.yaml configuration
cat conf.yaml
```

#### Rate Limiting

```bash
# Check API usage in respective dashboard
# Implement rate limiting in production
```

### Frontend Issues

#### Build Errors

```bash
# Clear Next.js cache
cd web
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
pnpm install
```

#### Environment Variables

```bash
# Check environment variables
cd web
pnpm build:check  # Custom script to validate env vars

# Restart development server after env changes
pnpm dev
```

## 🚀 Production Deployment

### Environment Preparation

```bash
# Production environment variables
ENVIRONMENT=production
DEBUG=false

# Use production Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Use production database
DATABASE_URL=postgresql://user:pass@prod-host/dbname?sslmode=require

# Secure JWT secret
JWT_SECRET_KEY=$(openssl rand -base64 32)
```

### Build Process

```bash
# Backend
uv build

# Frontend
cd web
pnpm build
```

### Docker Deployment

```bash
# Production Docker Compose
docker compose -f docker-compose.prod.yml up -d
```

## 📚 Additional Resources

### Documentation

- [Configuration Guide](./configuration_guide.md)
- [Architecture Documentation](./NEON_CLERK_ARCHITECTURE.md)
- [API Documentation](http://localhost:8005/docs) (when running)
- [Neon Documentation](https://neon.tech/docs)
- [Clerk Documentation](https://clerk.com/docs)

### Community

- [GitHub Issues](https://github.com/bytedance/deer-flow/issues)
- [GitHub Discussions](https://github.com/bytedance/deer-flow/discussions)
- [Official Website](https://deerflow.tech/)

### Troubleshooting

- [FAQ](./FAQ.md)
- [Common Issues](https://github.com/bytedance/deer-flow/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
- [Discord Community](https://discord.gg/) (if available)

## 🎯 Next Steps

1. **Explore the Features**: Try the web interface at http://localhost:3000
2. **Read the Configuration Guide**: Understand all available options
3. **Review the Architecture**: Learn about the Neon + Clerk setup
4. **Contribute**: Check the contributing guidelines and submit a PR
5. **Deploy**: Try deploying to your preferred hosting platform

Happy coding! 🚀
