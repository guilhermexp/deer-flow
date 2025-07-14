# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeerFlow (Deep Exploration and Efficient Research Flow) is a hybrid application combining a Python-based multi-agent research framework with a Next.js frontend. The system uses LangGraph for workflow orchestration and supports multiple LLMs via litellm.

## Key Commands

### Backend Development (Python)
```bash
# Install dependencies using uv
uv sync

# Run the main console UI
uv run main.py

# Run the API server
uv run server.py

# Run with auto-reload
make serve

# Run tests
make test
uv run pytest tests/

# Run tests with coverage
make coverage

# Lint and format
make lint       # Check formatting
make format     # Auto-format code

# Run LangGraph Studio for debugging
make langgraph-dev
```

### Frontend Development (Next.js)
```bash
cd web

# Install dependencies
pnpm install

# Development server (port 4000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting and type checking
pnpm lint
pnpm typecheck
pnpm check      # Both lint and typecheck
```

### Full Stack Development
```bash
# Run both backend and frontend in development mode
./bootstrap.sh -d     # macOS/Linux
bootstrap.bat -d      # Windows

# Docker Compose
docker compose build
docker compose up
```

## Architecture Overview

### Multi-Agent System (Backend)
The backend implements a LangGraph-based multi-agent architecture:

1. **Coordinator** (`src/graph/coordinator.py`): Entry point managing workflow lifecycle
2. **Planner** (`src/agents/planner.py`): Strategic task decomposition and planning
3. **Research Team**:
   - **Researcher** (`src/agents/researcher.py`): Web search and information gathering
   - **Coder** (`src/agents/coder.py`): Code analysis and Python execution
4. **Reporter** (`src/agents/reporter.py`): Final report generation

Key integration points:
- LLM interactions via `src/llms/llm.py` using litellm
- Tools in `src/tools/` (search engines, TTS, web crawling)
- Workflow definitions in `src/graph/`
- FastAPI server in `src/server/app.py`

### Frontend Architecture (Next.js + TypeScript)
The web UI uses Next.js 15 with React 19:

- **App Router**: Pages in `src/app/(with-sidebar)/` use sidebar layout
- **State Management**: Zustand stores in `src/core/store/`
- **API Client**: Functions in `src/core/api/` for backend communication
- **UI Components**: 
  - Base components in `src/components/ui/` (Radix UI + Tailwind)
  - DeerFlow-specific in `src/components/deer-flow/`
  - Rich text editing via Tiptap in report components
- **Styling**: Tailwind CSS 4 with dark theme (Kortex-inspired glassmorphism)

Key features:
- Real-time SSE streaming for research progress
- MCP (Model Context Protocol) integration
- Supabase authentication and data persistence
- Report editing with AI-assisted refinements

## Development Guidelines

### Python Development
- Python 3.12+ required
- Use `uv` for dependency management
- Follow Black formatting standards
- Test coverage expected for new features

### TypeScript/React Development
- Strict TypeScript mode enabled
- Use absolute imports from `@/`
- Follow existing component patterns in `src/components/`
- Maintain dark theme consistency per `LAYOUT_STANDARDS.md`

### Configuration
- Backend: Copy `conf.yaml.example` to `conf.yaml` and configure LLM settings
- Frontend: Copy `.env.example` to `.env` and set API keys
- See `docs/configuration_guide.md` for detailed setup

### Testing
- Backend: pytest with unit/integration tests in `tests/`
- Frontend: Type checking and ESLint (no test files found)
- Run `make test` (backend) or `pnpm check` (frontend) before commits

## Important Notes

- The system requires models with longer context windows for deep research
- Human-in-the-loop feedback is supported during planning phase
- MCP integration allows extending capabilities with external services
- Supabase is used for user management and data persistence
- Docker Compose available for containerized deployment