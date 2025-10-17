# Requirements: Supabase Cleanup Complete

## 1. Overview
**Goal**: Remove ALL references to Supabase from the mudancy application and replace critical functionality with Neon PostgreSQL + Clerk authentication
**User Problem**: Application has extensive legacy Supabase references after migration to Neon PostgreSQL + Clerk

## 2. Functional Requirements
### 2.1 Complete Supabase Removal
- [ ] **FR-1**: Remove all Supabase environment variables and configuration
- [ ] **FR-2**: Remove all Supabase documentation files
- [ ] **FR-3**: Remove all Supabase test files
- [ ] **FR-4**: Update all code references from Supabase to Neon/Clerk
- [ ] **FR-5**: Remove Supabase MCP server configurations

### 2.2 Critical Functionality Updates
- [ ] **FR-6**: Update database connection logic to use Neon PostgreSQL
- [ ] **FR-7**: Update authentication logic to use Clerk
- [ ] **FR-8**: Update configuration templates to use Neon/Clerk
- [ ] **FR-9**: Update bootstrap scripts to validate Neon/Clerk setup

### 2.3 User Stories
As a developer, I want to have zero Supabase references in the codebase so that the application is cleanly using only Neon PostgreSQL + Clerk.

## 3. Technical Requirements
### 3.1 Performance
- Cleanup should not break existing functionality
- All configurations must be updated consistently

### 3.2 Constraints
- Must maintain backward compatibility where possible
- Cannot break the current working Neon + Clerk setup

## 4. Acceptance Criteria
- [ ] Given a search for "supabase" in the codebase, when executed, then zero results are returned
- [ ] Given bootstrap script execution, when run, then it validates Neon/Clerk configuration instead of Supabase
- [ ] Given env.example file, when viewed, then it contains only Neon/Clerk variables
- [ ] Given configuration files, when checked, then they contain no Supabase references
- [ ] Given documentation directory, when listed, then no Supabase-related files exist

## 5. Out of Scope
- Rewriting legacy component implementations (Calendar, Tasks, Health) - only update references
- Changing core application logic - only cleanup references
- Database schema migration - already completed