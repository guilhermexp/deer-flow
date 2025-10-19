.PHONY: help lint format install-dev serve test coverage langgraph-dev lint-frontend test-frontend test-all dev dev-simple dev-full stop-dev

help: ## Show this help message
	@echo "Deer Flow - Available Make Targets:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Usage: make <target>"

install-dev: ## Install development dependencies
	uv pip install -e ".[dev]" && uv pip install -e ".[test]"

format: ## Format code using ruff
	uv run ruff format .

lint: ## Lint and fix code using ruff
	uv run ruff check --fix .

lint-check: ## Check linting without fixing
	uv run ruff check .

format-check: ## Check formatting without fixing
	uv run ruff format --check .

lint-full: ## Full lint check (backend + frontend)
	make lint-check
	make format-check
	make lint-frontend

lint-frontend: ## Lint frontend code
	cd web && pnpm lint

lint-frontend-fix: ## Fix frontend lint issues
	cd web && pnpm lint:fix
	cd web && pnpm format:write

test-build-frontend: ## Test, lint and build frontend
	cd web && pnpm install --frozen-lockfile
	cd web && pnpm lint
	cd web && pnpm typecheck
	cd web && pnpm test:run
	cd web && pnpm build

test-frontend: ## Run frontend tests with coverage
	cd web && pnpm test:coverage

test-all: ## Run all tests (backend + frontend)
	make test
	make test-frontend

dev: ## Start both frontend and backend (recommended)
	@echo "🚀 Starting Deer Flow development environment..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:4000"
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
	@make dev-simple

dev-simple: ## Simple start with basic backend and frontend
	@echo "Starting backend (uvicorn server)..."
	@cd web && pnpm dev &
	@sleep 3
	@uv run server.py --reload &
	@wait

dev-full: ## Start with LangGraph dev server (advanced backend)
	@echo "🚀 Starting Deer Flow with LangGraph backend..."
	@echo "Backend: http://localhost:2024 (LangGraph)"
	@echo "Frontend: http://localhost:4000"
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
	@cd web && pnpm dev &
	@sleep 3
	@make langgraph-dev &
	@wait

dev-docker: ## Start both services using Docker (if available)
	@echo "🐳 Starting services with Docker..."
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose -f docker-compose.dev.yml up --build; \
	else \
		echo "❌ Docker Compose not found. Use 'make dev' instead."; \
	fi

stop-dev: ## Stop all development servers
	@echo "🛑 Stopping all development servers..."
	@pkill -f "next dev" || true
	@pkill -f "server.py" || true
	@pkill -f "langgraph dev" || true
	@echo "✅ All servers stopped"

dev-script: ## Start development using shell script (recommended)
	@echo "🚀 Starting with shell script..."
	@./scripts/dev.sh

dev-langgraph-script: ## Start LangGraph development using shell script
	@echo "🚀 Starting LangGraph with shell script..."
	@./scripts/dev-langgraph.sh

install-scripts: ## Make scripts executable
	@chmod +x scripts/dev.sh scripts/dev-langgraph.sh
	@echo "✅ Scripts are now executable"

serve: ## Start development server with reload
	uv run server.py --reload

test: ## Run tests with pytest
	uv run pytest tests/

langgraph-dev: ## Start langgraph development server
	uvx --refresh --from "langgraph-cli[inmem]" --with-editable . --python 3.12 langgraph dev --allow-blocking

coverage: ## Run tests with coverage report
	uv run pytest --cov=src tests/ --cov-report=term-missing --cov-report=xml
