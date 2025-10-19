# 🧪 Guia de Testes - DeerFlow

Este documento fornece informações completas sobre a implementação e execução de testes no projeto DeerFlow.

## 📋 Resumo da Implementação

### Framework de Testes Escolhido

**Backend (Python):**
- **Framework**: pytest + pytest-cov
- **Motivo**: Padrão da indústria para Python, excelente suporte async, rico ecossistema de plugins

**Frontend (Next.js):**
- **Framework**: Vitest + @testing-library/react
- **Motivo**: Mais rápido que Jest, melhor suporte a ESM, integração nativa com Vite

## 🎯 Cobertura de Testes Atual

### Backend (Python)
- **Cobertura Mínima**: 25% (configurada no pyproject.toml)
- **Testes Implementados**: 525 testes coletados
- **Status**: ⚠️ 55 falhas, 465 aprovados, 5 ignorados

### Frontend (Next.js)
- **Cobertura Mínima**: 75% linhas, 70% branches/functions
- **Testes Implementados**: 16 testes
- **Status**: ✅ 15 aprovados, 1 falha

## 🚀 Comandos para Executar Testes

### Backend

```bash
# Executar todos os testes
make test
uv run pytest tests/

# Executar com cobertura
make coverage
uv run pytest --cov=src tests/ --cov-report=term-missing

# Executar testes específicos
uv run pytest tests/unit/utils/test_json_utils.py
uv run pytest tests/integration/test_api_endpoints.py

# Executar em modo verbose
uv run pytest tests/ -v

# Executar apenas testes que falharam na última execução
uv run pytest --lf

# Executar testes em paralelo (se pytest-xdist estiver instalado)
uv run pytest tests/ -n auto
```

### Frontend

```bash
# Entrar no diretório web
cd web

# Executar todos os testes
pnpm test:run

# Executar com cobertura
pnpm test:coverage

# Executar em modo watch (desenvolvimento)
pnpm test:watch

# Executar testes com UI interativa
pnpm test:ui

# Executar testes específicos
pnpm vitest run src/components/ui/__tests__/liquid-glass-card.test.tsx
```

### Comandos Unificados (Makefile)

```bash
# Executar todos os testes (backend + frontend)
make test-all

# Executar apenas testes frontend com cobertura
make test-frontend

# Lint + testes + build frontend
make lint-frontend
```

## 📁 Estrutura de Testes

### Backend
```
tests/
├── integration/          # Testes de integração
│   ├── test_api_endpoints.py
│   ├── test_nodes.py
│   └── test_crawler.py
├── unit/                 # Testes unitários
│   ├── utils/
│   │   ├── test_json_utils.py
│   │   └── test_json_utils_enhanced.py
│   ├── llms/
│   │   ├── test_llm.py
│   │   └── test_llm_enhanced.py
│   └── server/
└── server/               # Testes específicos do servidor
```

### Frontend
```
web/src/
├── components/ui/__tests__/
│   └── liquid-glass-card.test.tsx
├── core/
│   ├── store/__tests__/
│   │   └── events.test.ts
│   └── utils/__tests__/
│       └── json.test.ts
├── lib/__tests__/
│   └── id-converter.test.ts
└── test/
    └── setup.ts          # Configuração global dos testes
```

## 🔧 Configuração de Testes

### Backend (pyproject.toml)
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --cov=src --cov-report=term-missing"
filterwarnings = [
    "ignore::DeprecationWarning",
    "ignore::UserWarning",
]

[tool.coverage.report]
fail_under = 25
```

### Frontend (vitest.config.ts)
```typescript
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 75,
          statements: 75
        }
      }
    }
  }
})
```

## 📊 Tipos de Testes Implementados

### 1. Testes Unitários

**Backend:**
- ✅ `test_json_utils_enhanced.py` - Testes para utilitários JSON
- ✅ `test_llm_enhanced.py` - Testes para gerenciamento de LLMs

**Frontend:**
- ✅ `liquid-glass-card.test.tsx` - Componente UI
- ✅ `json.test.ts` - Utilitário de parsing JSON
- ✅ `events.test.ts` - Sistema de eventos
- ✅ `id-converter.test.ts` - Conversão de IDs

### 2. Testes de Integração

**Backend:**
- ✅ `test_api_endpoints.py` - Endpoints da API FastAPI
- 🔄 `test_nodes.py` - Nodes do LangGraph (alguns falhando)
- ⚠️ `test_crawler.py` - Web crawler (problemas de dependência)

### 3. Testes de Componentes

**Frontend:**
- ✅ Testes de renderização e props de componentes React
- ✅ Testes de interação de usuário
- ✅ Testes de acessibilidade básica

## ⚠️ Problemas Conhecidos e Próximos Passos

### Problemas Backend
1. **55 testes falhando** - Principalmente relacionados a:
   - Configuração de autenticação (Clerk)
   - Dependências de LLM não configuradas
   - Problemas de Node.js para crawler

### Problemas Frontend
1. **1 teste falhando** - Sistema de eventos:
   - Captura de erros em listeners precisa ser melhorada

### Próximos Passos para Expansão

#### Curto Prazo (1-2 semanas)
1. **Corrigir testes falhando**:
   - Configurar mocks adequados para dependências externas
   - Resolver problemas de autenticação nos testes
   - Corrigir dependências Node.js do crawler

2. **Aumentar cobertura frontend**:
   - Testes para componentes deer-flow específicos
   - Testes para stores Zustand
   - Testes para hooks customizados

3. **Melhorar testes de integração**:
   - Testes E2E com Playwright
   - Testes de API completos
   - Testes de fluxos de trabalho

#### Médio Prazo (1 mês)
1. **Testes de Performance**:
   - Testes de carga para API
   - Testes de renderização frontend
   - Benchmarks de LLM

2. **Testes de Segurança**:
   - Validação de inputs
   - Testes de autorização
   - Sanitização de dados

3. **Testes Visuais**:
   - Screenshot testing
   - Regression visual
   - Testes de responsividade

#### Longo Prazo (3+ meses)
1. **CI/CD Integration**:
   - Pipeline automatizada
   - Quality gates
   - Deploy condicional

2. **Testes de Acessibilidade**:
   - Compliance WCAG
   - Screen reader testing
   - Keyboard navigation

## 🎯 Metas de Cobertura

### Atual
- **Backend**: 25% (mínimo configurado)
- **Frontend**: 75% (mínimo configurado)

### Meta 6 meses
- **Backend**: 60%
- **Frontend**: 85%
- **E2E**: Cobertura completa dos fluxos principais

### Meta 1 ano
- **Backend**: 80%
- **Frontend**: 90%
- **E2E**: Cobertura completa + testes de performance
- **Zero testes falhando** em ambiente estável

## 🔍 Como Contribuir com Testes

### Escrevendo Novos Testes

1. **Backend**: Seguir padrão pytest
```python
def test_function_name():
    # Arrange
    input_data = "test"

    # Act
    result = function_under_test(input_data)

    # Assert
    assert result == expected_output
```

2. **Frontend**: Seguir padrão Vitest + Testing Library
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Convenções

- Nomes de arquivo: `test_*.py` (backend), `*.test.ts(x)` (frontend)
- Um arquivo de teste por módulo/componente
- Mocks em arquivos separados quando complexos
- Comentários explicando cenários de teste não óbvios

## 📈 Monitoramento e Relatórios

### Relatórios de Cobertura
- **Backend**: Terminal + XML para CI/CD
- **Frontend**: Terminal + HTML + JSON

### Localização dos Relatórios
- **Backend**: Exibido no terminal após execução
- **Frontend**: `web/coverage/` (HTML) após `pnpm test:coverage`

### Métricas Acompanhadas
- Cobertura de linhas
- Cobertura de branches
- Cobertura de funções
- Tempo de execução dos testes
- Taxa de sucesso/falha

---

**Última atualização**: 19 de Outubro de 2025
**Responsável**: Claude Code
**Status**: ✅ Implementação básica completa