.PHONY: lint format install-dev serve test coverage init-db

install-dev:
	uv pip install -e ".[dev]" && uv pip install -e ".[test]"

format:
	uv run black --preview .

lint:
	uv run black --check .
	uv run ruff check .

serve:
	uv run server.py --reload --port 8005

test:
	uv run pytest tests/

langgraph-dev:
	uvx --refresh --from "langgraph-cli[inmem]" --with-editable . --python 3.12 langgraph dev --allow-blocking

coverage:
	uv run pytest --cov=src tests/ --cov-report=term-missing --cov-report=xml

init-db:
	uv run python src/server/init_db.py
