# Tasks: fix-test-suite

## Overview
Fix failing test suites in both backend and frontend, resolve dependency issues, and ensure all tests pass with proper configuration.

## Phase 1: Backend Test Fixes

### Task 1.1: Install Missing Test Dependencies
- **Task ID**: 1.1.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: None
- **Files**: `pyproject.toml`, `uv.lock`
- **Description**: Install mongomock dependency required for checkpoint tests
- **Acceptance Criteria**:
  - mongomock installed successfully
  - `uv pip list | grep mongomock` shows the package
  - No import errors when running tests

### Task 1.2: Configure pytest-asyncio
- **Task ID**: 1.2.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: Task 1.1.1
- **Files**: `pyproject.toml`
- **Description**: Add asyncio_mode configuration to pytest settings
- **Acceptance Criteria**:
  - `asyncio_mode = "auto"` added to `[tool.pytest.ini_options]`
  - No async test configuration warnings
  - Async tests execute without errors

### Task 1.3: Disable LangSmith in Test Environment
- **Task ID**: 1.3.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: None
- **Files**: `.env`, `.env.test` (create if needed)
- **Description**: Create .env.test file and disable LangSmith API calls during testing
- **Acceptance Criteria**:
  - `.env.test` file created with `LANGSMITH_API_KEY=""`
  - No LangSmith API 403 errors in test output
  - Tests can run without external API dependencies

### Task 1.4: Run Backend Tests and Generate Report
- **Task ID**: 1.4.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: Task 1.1.1, Task 1.2.1, Task 1.3.1
- **Files**: `tests/`
- **Description**: Run full backend test suite with coverage report
- **Acceptance Criteria**:
  - All tests run successfully
  - Pass rate >= 95%
  - Coverage report generated
  - No critical errors in output

## Phase 2: Frontend Test Fixes

### Task 2.1: Fix Import Paths in Frontend Tests
- **Task ID**: 2.1.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: None
- **Files**: `web/` (all test files)
- **Description**: Identify and fix broken import paths in Jest/Vitest tests
- **Acceptance Criteria**:
  - All import errors resolved
  - No "module not found" errors
  - Test files can be collected without errors

### Task 2.2: Align Test Configuration (Jest vs Vitest)
- **Task ID**: 2.2.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: Task 2.1.1
- **Files**: `web/vitest.config.ts`, `web/jest.config.js` (if exists)
- **Description**: Ensure consistent test configuration between Jest and Vitest
- **Acceptance Criteria**:
  - Single source of truth for test configuration
  - No conflicting Jest/Vitest settings
  - Configuration properly documented

### Task 2.3: Locate and Fix Missing Test Files
- **Task ID**: 2.3.1
- **Agent**: Codex
- **Priority**: Medium
- **Dependencies**: Task 2.1.1
- **Files**: `web/tests/`, `web/__tests__/`
- **Description**: Find missing test files and either create stubs or update references
- **Acceptance Criteria**:
  - All referenced test files exist
  - No "file not found" errors
  - Test collection succeeds

### Task 2.4: Run Frontend Tests and Generate Report
- **Task ID**: 2.4.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: Task 2.1.1, Task 2.2.1, Task 2.3.1
- **Files**: `web/`
- **Description**: Run full frontend test suite with coverage
- **Acceptance Criteria**:
  - All tests run successfully
  - Pass rate >= 95%
  - Coverage report generated
  - No critical errors in output

## Phase 3: Verification and Reporting

### Task 3.1: Run Full Test Suite (Backend + Frontend)
- **Task ID**: 3.1.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: Task 1.4.1, Task 2.4.1
- **Files**: `tests/`, `web/`
- **Description**: Execute complete test suite for both backend and frontend
- **Acceptance Criteria**:
  - Backend: 100% test pass rate
  - Frontend: 100% test pass rate
  - Combined coverage report generated
  - All tests complete without errors

### Task 3.2: Verify Application Startup
- **Task ID**: 3.2.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: Task 3.1.1
- **Files**: `server.py`, `web/package.json`
- **Description**: Start both backend and frontend servers and verify connectivity
- **Acceptance Criteria**:
  - Backend server starts on port 8005
  - Frontend server starts on port 4000
  - Both services respond to health checks
  - No startup errors in logs

### Task 3.3: Generate Final Validation Report
- **Task ID**: 3.3.1
- **Agent**: Codex
- **Priority**: High
- **Dependencies**: Task 3.1.1, Task 3.2.1
- **Files**: None (report generation)
- **Description**: Create comprehensive report of all fixes and test results
- **Acceptance Criteria**:
  - Report includes all test results
  - Report includes coverage metrics
  - Report includes server status
  - Report includes recommendations for any remaining issues

## Dependencies Graph
```
1.1.1 (Install mongomock)
  ↓
1.2.1 (Configure pytest-asyncio)
  ↓
1.3.1 (Disable LangSmith)
  ↓
1.4.1 (Run backend tests)
  ↓
3.1.1 (Full test suite)
  ↓
3.2.1 (Verify startup)
  ↓
3.3.1 (Final report)

2.1.1 (Fix imports)
  ↓
2.2.1 (Align config)
  ↓
2.3.1 (Fix missing files)
  ↓
2.4.1 (Run frontend tests)
  ↓
3.1.1 (Full test suite)
```

## Total Tasks: 9
**Estimated Time**: 45-60 minutes
**Success Metrics**: 
- All backend tests passing (100%)
- All frontend tests passing (100%)
- Both servers running without errors
- Comprehensive validation report generated
