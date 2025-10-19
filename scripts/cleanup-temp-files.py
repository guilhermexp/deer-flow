#!/usr/bin/env python3
"""
Temporary Files Cleanup Script
Safely removes temporary files based on scan results.
"""

import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from backup_manager import BackupManager
from temp_file_scanner import TempFileInfo, TempFileScanner


class TempFileCleanup:
    def __init__(self, repo_path: str = ".", dry_run: bool = False):
        self.repo_path = Path(repo_path).resolve()
        self.dry_run = dry_run
        self.backup_manager = BackupManager(repo_path)
        self.scanner = TempFileScanner(repo_path)

    def cleanup_temp_files(self, scan_file: str | None = None) -> dict[str, Any]:
        """Clean up temporary files with safety measures."""
        if scan_file and Path(scan_file).exists():
            temp_files = self._load_scan_results(scan_file)
            print(f"📋 Loaded scan results from: {scan_file}")
        else:
            print("📊 Scanning for temporary files...")
            temp_files = self.scanner.scan_temp_files()

        safe_files = [f for f in temp_files if f.is_safe_to_delete]
        unsafe_files = [f for f in temp_files if not f.is_safe_to_delete]

        self._display_cleanup_summary(safe_files, unsafe_files)

        if not self._confirm_cleanup():
            return {"status": "cancelled", "reason": "user_cancelled"}

        backup_name = self._create_safety_backup(unsafe_files)

        results = {
            "status": "completed",
            "backup_name": backup_name,
            "files_processed": 0,
            "space_freed": 0,
            "errors": [],
            "warnings": [],
            "timestamp": datetime.now().isoformat()
        }

        for file_info in safe_files:
            try:
                space_freed = self._remove_temp_file(file_info)
                results["files_processed"] += 1
                results["space_freed"] += space_freed
            except Exception as e:
                error_msg = f"Failed to remove {file_info.path}: {e}"
                results["errors"].append(error_msg)
                print(f"❌ {error_msg}")

        self._generate_cleanup_report(results, len(safe_files))
        return results

    def _display_cleanup_summary(self, safe_files: list[TempFileInfo], unsafe_files: list[TempFileInfo]) -> None:
        """Display cleanup summary."""
        safe_size = sum(f.size for f in safe_files)
        unsafe_size = sum(f.size for f in unsafe_files)

        print("\n" + "=" * 60)
        print("🧹 TEMPORARY FILES CLEANUP SUMMARY")
        print("=" * 60)
        print(f"Safe to delete: {len(safe_files)} files ({self._format_size(safe_size)})")
        print(f"Requires review: {len(unsafe_files)} files ({self._format_size(unsafe_size)})")
        print()

        if unsafe_files:
            print("⚠️  FILES REQUIRING REVIEW:")
            for file_info in unsafe_files[:5]:
                print(f"  • {file_info.path} - {file_info.reason}")
            if len(unsafe_files) > 5:
                print(f"  ... and {len(unsafe_files) - 5} more files")
            print()

    def _confirm_cleanup(self) -> bool:
        """Get user confirmation for cleanup."""
        if self.dry_run:
            print("🔍 DRY RUN MODE - No actual changes will be made")
            return True

        print("⚠️  This will permanently delete temporary files!")
        print("   Files requiring review will be backed up but not deleted.")

        while True:
            response = input("\nProceed with cleanup? (yes/no): ").lower().strip()
            if response in ["yes", "y"]:
                return True
            elif response in ["no", "n"]:
                return False
            else:
                print("Please enter 'yes' or 'no'")

    def _create_safety_backup(self, unsafe_files: list[TempFileInfo]) -> str:
        """Create backup of files that require review."""
        if not unsafe_files:
            return ""

        print("💾 Creating backup of files requiring review...")
        targets = [f.path for f in unsafe_files if (self.repo_path / f.path).exists()]

        if not targets:
            return ""

        backup_name = f"temp_cleanup_review_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if not self.dry_run:
            backup_path = self.backup_manager.create_backup(targets, backup_name)
            print(f"✅ Review backup created: {backup_path}")
        else:
            print(f"🔍 DRY RUN: Would create backup '{backup_name}' for {len(targets)} files")

        return backup_name

    def _remove_temp_file(self, file_info: TempFileInfo) -> int:
        """Remove a temporary file or directory."""
        file_path = self.repo_path / file_info.path

        if not file_path.exists():
            return 0

        original_size = file_info.size

        if self.dry_run:
            print(f"🔍 DRY RUN: Would remove {file_info.path}")
            return original_size

        try:
            if file_path.is_dir():
                shutil.rmtree(file_path)
                print(f"🗑️  REMOVED DIR: {file_info.path}")
            else:
                file_path.unlink()
                print(f"🗑️  REMOVED FILE: {file_info.path}")

            return original_size

        except Exception as e:
            print(f"❌ Failed to remove {file_info.path}: {e}")
            raise

    def _load_scan_results(self, scan_file: str) -> list[TempFileInfo]:
        """Load scan results from JSON file."""
        import json

        with open(scan_file) as f:
            data = json.load(f)

        return [TempFileInfo(**file_data) for file_data in data["files"]]

    def _generate_cleanup_report(self, results: dict[str, Any], total_safe_files: int) -> None:
        """Generate cleanup report."""
        report_lines = [
            "# Temporary Files Cleanup Report",
            f"Generated: {results['timestamp']}",
            f"Repository: {self.repo_path}",
            f"Backup: {results['backup_name']}",
            f"Status: {results['status']}",
            "",
            "## Summary",
            f"- Files processed: {results['files_processed']}/{total_safe_files}",
            f"- Space freed: {self._format_size(results['space_freed'])}",
            f"- Errors: {len(results['errors'])}",
            f"- Warnings: {len(results['warnings'])}",
            ""
        ]

        if results["errors"]:
            report_lines.extend(["## Errors", ""])
            for error in results["errors"]:
                report_lines.append(f"❌ {error}")
            report_lines.append("")

        if results["warnings"]:
            report_lines.extend(["## Warnings", ""])
            for warning in results["warnings"]:
                report_lines.append(f"⚠️  {warning}")
            report_lines.append("")

        report_content = "\n".join(report_lines)
        report_file = f"reports/temp_cleanup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        os.makedirs("reports", exist_ok=True)

        if not self.dry_run:
            with open(report_file, "w") as f:
                f.write(report_content)
            print(f"📄 Cleanup report saved: {report_file}")
        else:
            print(f"🔍 DRY RUN: Would save report to {report_file}")

    def _format_size(self, size_bytes: int) -> str:
        """Format size in human-readable format."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} TB"


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Temporary Files Cleanup")
    parser.add_argument("--scan", help="JSON file with scan results")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--auto-confirm", action="store_true", help="Skip confirmation prompts")

    args = parser.parse_args()

    cleanup = TempFileCleanup(dry_run=args.dry_run)

    if args.auto_confirm:
        cleanup._confirm_cleanup = lambda: True

    try:
        results = cleanup.cleanup_temp_files(args.scan)

        if results["status"] == "completed":
            print("\n✅ Cleanup completed successfully!")
            print(f"🗑️  Files removed: {results['files_processed']}")
            print(f"💾 Space freed: {cleanup._format_size(results['space_freed'])}")
        else:
            print(f"\n⚠️  Cleanup status: {results['status']}")

    except KeyboardInterrupt:
        print("\n❌ Cleanup interrupted by user")
    except Exception as e:
        print(f"\n❌ Cleanup failed: {e}")


if __name__ == "__main__":
    main()
