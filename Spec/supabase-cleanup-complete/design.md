# Design: Supabase Cleanup Complete

## 1. Architecture Overview
### 1.1 Current State vs Target State
```mermaid
graph LR
    A[Supabase References] --> B[Neon + Clerk Clean]
    
    subgraph "Current Problems"
        C[Config files with Supabase]
        D[Documentation outdated]
        E[Code comments outdated]
        F[Test files obsolete]
    end
    
    subgraph "Target State"
        G[Neon PostgreSQL config]
        H[Clerk auth config]
        I[Updated documentation]
        J[Clean codebase]
    end
```

### 1.2 Component Structure
- **Configuration Layer**: Remove Supabase, add Neon/Clerk
- **Documentation Layer**: Complete removal of Supabase docs
- **Code Layer**: Update all references
- **Test Layer**: Remove Supabase-specific tests

## 2. File Mapping and Updates

### 2.1 Configuration Files
| File | Action | Details |
|------|--------|---------|
| `bootstrap.sh` | Update | Replace Supabase validation with Neon/Clerk |
| `conf.yaml.example` | Remove | Delete SUPABASE section |
| `env.example` | Replace | Supabase vars → Neon/Clerk vars |
| `.claude/settings.local.json` | Remove | Delete MCP Supabase permissions |
| `web/src/app/(with-sidebar)/chat/settings.json` | Remove | Delete Supabase MCP server |

### 2.2 Code Files
| File | Action | Details |
|------|--------|---------|
| `web/src/lib/constants.ts` | Update | Remove SUPABASE_QUERY, SUPABASE_URL |
| `web/src/lib/id-converter.ts` | Update | Update comment about UUID compatibility |
| `web/src/hooks/use-realtime-messages.ts` | Update | Update comments about Supabase |
| `web/src/components/jarvis/kanban/hooks/use-kanban-api.ts` | Update | Update comments about Supabase |

### 2.3 Documentation Files (Delete)
| Category | Files |
|----------|-------|
| Reports | `*_REPORT.md`, `*_VALIDATION*.md` |
| Migration | `PLANO_MIGRACAO_*.md`, `GUIA_MIGRACAO_*.md` |
| Architecture | `docs/SUPABASE_*.md` |
| Setup | `web/docs/setup/*SUPABASE*.md` |

### 2.4 Test Files (Delete)
| File | Reason |
|------|--------|
| `tests/unit/server/test_dual_auth.py` | Supabase-specific tests |
| `web/src/hooks/__tests__/use-realtime-messages.test.ts` | Supabase mocks |

## 3. Implementation Details

### 3.1 Neon PostgreSQL Configuration
```yaml
# New conf.yaml.example section
DATABASE:
  url: postgresql://username:password@hostname/database?sslmode=require
  pool_size: 20
  max_overflow: 10
```

### 3.2 Clerk Authentication Configuration
```yaml
# New auth section
AUTH:
  jwt_secret_key: "your-secure-random-key-here"
  jwt_algorithm: HS256
  access_token_expire_minutes: 30

CLERK:
  publishable_key: null
  secret_key: null
```

### 3.3 Environment Variables
```bash
# New env.example
NEXT_PUBLIC_API_URL=http://localhost:8005/api
NODE_ENV=development
```

## 4. Database Connection Updates

### 4.1 Constants Update
```typescript
// Before
export const TIMEOUTS = {
  SUPABASE_QUERY: 15000,
}

export const API_ENDPOINTS = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
}

// After  
export const TIMEOUTS = {
  DATABASE_QUERY: 15000,
}

export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api',
}
```

## 5. Security Considerations
- Remove all Supabase API keys and URLs
- Ensure no hardcoded credentials remain
- Validate Neon connection strings properly
- Verify Clerk authentication setup

## 6. Testing Strategy
### 6.1 Validation Tests
- Search for any remaining Supabase references
- Validate bootstrap script works with new configuration
- Test environment setup with new variables

### 6.2 Integration Tests
- Ensure application starts without Supabase references
- Verify authentication flows work with Clerk
- Confirm database operations work with Neon

## 7. Deployment
### 7.1 Dependencies
- No new dependencies required
- Remove Supabase dependencies if they exist

### 7.2 Migration Path
1. Update configuration files
2. Remove documentation
3. Update code references  
4. Remove test files
5. Validate complete cleanup

## 8. Rollback Strategy
- Keep git history for reference
- Document changes made
- Test thoroughly before committing