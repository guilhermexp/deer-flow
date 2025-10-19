# Repository Cleanup Rollback Guide

**Critical Document**: Keep this guide accessible during and after cleanup operations

## 🚨 Emergency Rollback Procedures

### Immediate Action Required
If you encounter critical issues after running cleanup scripts:

1. **STOP** any running cleanup operations
2. **DO NOT** run additional cleanup scripts
3. **IDENTIFY** the backup name from the operation
4. **FOLLOW** the appropriate rollback procedure below

## 📋 Quick Rollback Commands

### List Available Backups
```bash
python scripts/backup-manager.py --action list
```

### Restore Specific Backup
```bash
python scripts/backup-manager.py --action restore --name BACKUP_NAME
```

### Verify Backup Integrity
```bash
python scripts/backup-verification.py --action verify --backup BACKUP_NAME
```

## 🔄 Rollback Procedures by Operation

### Screenshot Cleanup Rollback
```bash
# 1. List screenshot backups
python scripts/backup-manager.py --action list | grep screenshot

# 2. Restore the backup (replace with actual backup name)
python scripts/backup-manager.py --action restore --name screenshot_cleanup_YYYYMMDD_HHMMSS

# 3. Verify restoration
python scripts/screenshot-analyzer.py --summary
```

### Environment File Rollback
```bash
# 1. List environment backups
python scripts/backup-manager.py --action list | grep env

# 2. Restore the backup
python scripts/backup-manager.py --action restore --name env_consolidation_YYYYMMDD_HHMMSS

# 3. Verify .env files
ls -la .env* web/.env*
```

### Temporary Files Rollback
```bash
# 1. List temp file backups
python scripts/backup-manager.py --action list | grep temp

# 2. Restore the backup
python scripts/backup-manager.py --action restore --name temp_cleanup_YYYYMMDD_HHMMSS

# 3. Check restored files
python scripts/temp-file-scanner.py --summary
```

### Python Cache Rollback
```bash
# Note: Python cache files can be safely regenerated
# No rollback needed - just regenerate:
cd your_project
python -c "import py_compile; print('Python ready')"
```

## 🔍 Verification After Rollback

### Health Check
```bash
python scripts/health-check.py
```

### Application Functionality Test
```bash
# Backend test
uv run python main.py --help

# Frontend test (if applicable)
cd web
pnpm run build
```

### Import System Test
```bash
uv run python -c "
import src.graph.coordinator
import src.agents.planner
import src.llms.llm
print('All critical imports successful')
"
```

## 📁 Backup Locations and Structure

### Default Backup Directory
```
backups/
├── backup_name.tar.gz           # Compressed backup archive
├── backup_name_metadata.json    # Backup metadata and checksums
└── ...
```

### Backup Metadata Structure
```json
{
  "backup_name": "cleanup_backup_20250117_143000",
  "timestamp": "2025-01-17T14:30:00.123456",
  "targets": ["path1", "path2"],
  "backup_size": 1234567,
  "checksum": "sha256_hash",
  "repo_path": "/path/to/repository"
}
```

## 🚨 Critical File Recovery

### Essential Files to Verify After Rollback
```bash
# Check critical Python files
ls -la main.py server.py pyproject.toml

# Check critical frontend files
ls -la web/package.json web/next.config.js

# Check environment files
ls -la .env* web/.env*

# Check source code structure
ls -la src/
```

### Manual File Recovery
If automatic rollback fails, manually extract files:

```bash
# Extract specific files from backup
tar -tf backups/backup_name.tar.gz | head -20  # List contents
tar -xf backups/backup_name.tar.gz path/to/specific/file
```

## 🔧 Troubleshooting Common Issues

### Issue: "Backup not found"
```bash
# List all backups
ls -la backups/

# Verify backup exists
python scripts/backup-verification.py --action verify --backup BACKUP_NAME
```

### Issue: "Checksum mismatch"
```bash
# This indicates backup corruption
# Try test restoration to temporary directory
python scripts/backup-verification.py --action test-restore --backup BACKUP_NAME
```

### Issue: "Import errors after rollback"
```bash
# Sync dependencies
uv sync

# Test imports
python scripts/health-check.py
```

### Issue: "Application won't start"
```bash
# Check Python environment
uv run python --version
uv run python -c "import sys; print(sys.path)"

# Check for missing dependencies
uv sync
```

## ⚠️ Prevention Strategies

### Before Running Cleanup Scripts
1. **Create manual backup**:
   ```bash
   tar -czf manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz .
   ```

2. **Test in development first**:
   ```bash
   # Always use --dry-run first
   python scripts/cleanup-screenshots.py --dry-run
   ```

3. **Verify current health**:
   ```bash
   python scripts/health-check.py
   ```

### During Cleanup Operations
1. **Monitor output carefully**
2. **Note backup names from script output**
3. **Stop if unexpected errors occur**
4. **Test after each major operation**

### After Cleanup Operations
1. **Run final validation**:
   ```bash
   python scripts/final-validation.py
   ```

2. **Test core functionality**:
   ```bash
   uv run python main.py --help
   cd web && pnpm run build
   ```

## 📞 Emergency Contacts and Resources

### Self-Help Resources
1. **Health Check**: `python scripts/health-check.py`
2. **Backup Verification**: `python scripts/backup-verification.py --action report`
3. **Repository Validation**: `python scripts/final-validation.py`

### Manual Recovery Steps
If automated tools fail:

1. **Git History**: Use git to restore from previous commits
   ```bash
   git log --oneline -10
   git checkout HEAD~1 -- path/to/file
   ```

2. **IDE/Editor Recovery**: Check if your editor has file history
   - VS Code: File History extension
   - IntelliJ: Local History
   - Vim: Persistent undo

3. **System Backups**: Check OS-level backups
   - macOS: Time Machine
   - Windows: File History
   - Linux: rsync backups

## 🔒 Data Safety Protocols

### Backup Verification Checklist
- [ ] Backup file exists and is not empty
- [ ] Metadata file exists and is valid JSON
- [ ] Checksum matches original backup
- [ ] Test extraction works without errors
- [ ] Critical files are present in backup

### Recovery Verification Checklist
- [ ] All expected files are restored
- [ ] File permissions are correct
- [ ] Application starts without errors
- [ ] Critical imports work
- [ ] Basic functionality tests pass

## 📝 Documentation and Logging

### Keep Records Of
1. **Backup names and timestamps**
2. **Operations performed**
3. **Any errors encountered**
4. **Recovery actions taken**

### Log File Locations
- Cleanup reports: `reports/`
- Backup metadata: `backups/*_metadata.json`
- Health check results: Output of `scripts/health-check.py --output`

## 🚑 Last Resort Recovery

### If All Else Fails

1. **Git Reset** (if repository is under version control):
   ```bash
   git status
   git reset --hard HEAD
   git clean -fd
   ```

2. **Fresh Clone** (if using git):
   ```bash
   cd ..
   git clone <repository_url> fresh_clone
   cp -r fresh_clone/* original_directory/
   ```

3. **Restore from External Backup**:
   - Use system backups (Time Machine, etc.)
   - Restore from cloud storage
   - Use deployment backups

## ⚡ Quick Reference Commands

### Emergency Rollback (One-Liner)
```bash
# Replace BACKUP_NAME with actual backup name
python scripts/backup-manager.py --action restore --name BACKUP_NAME && python scripts/health-check.py
```

### Complete Validation
```bash
python scripts/final-validation.py --output validation_results.json
```

### Backup Everything Now
```bash
python scripts/backup-manager.py --action create --targets . --name emergency_backup_$(date +%Y%m%d_%H%M%S)
```

---

## 📋 Recovery Checklist

After any rollback operation:

- [ ] Backup successfully restored
- [ ] Health check passes
- [ ] Application starts correctly
- [ ] Critical functionality works
- [ ] No import errors
- [ ] Environment files present
- [ ] Documentation accessible

**Remember**: When in doubt, restore from backup first, ask questions later. Data integrity is more important than cleanup progress.

---

*Keep this guide accessible at all times during cleanup operations. Print or save offline for emergency situations.*