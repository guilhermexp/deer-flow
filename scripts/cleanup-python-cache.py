#!/usr/bin/env python3
"""
Python Cache Cleanup Script
Removes Python cache files and directories.
"""

import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any


class PythonCacheCleanup:
    def __init__(self, repo_path: str = ".", dry_run: bool = False):
        self.repo_path = Path(repo_path).resolve()
        self.dry_run = dry_run
        self.cache_patterns = [
            "__pycache__",
            "*.pyc",
            "*.pyo",
            "*.pyd",
            ".pytest_cache",
            ".coverage",
            ".coverage.*",
            "htmlcov/",
            ".tox/",
            ".nox/",
            "*.egg-info/",
            "build/",
            "dist/",
            ".mypy_cache/",
            ".dmypy.json",
            "dmypy.json"
        ]

    def cleanup_python_cache(self) -> dict[str, Any]:
        """Clean up Python cache files and directories."""
        cache_items = self._find_python_cache()

        self._display_cleanup_summary(cache_items)

        if not self._confirm_cleanup():
            return {"status": "cancelled", "reason": "user_cancelled"}

        results = {
            "status": "completed",
            "items_removed": 0,
            "space_freed": 0,
            "errors": [],
            "timestamp": datetime.now().isoformat()
        }

        for item_path, item_size in cache_items:
            try:
                if self._remove_cache_item(item_path):
                    results["items_removed"] += 1
                    results["space_freed"] += item_size
            except Exception as e:
                error_msg = f"Failed to remove {item_path}: {e}"
                results["errors"].append(error_msg)
                print(f"❌ {error_msg}")

        self._generate_cleanup_report(results)
        return results

    def _find_python_cache(self) -> list[tuple[Path, int]]:
        """Find Python cache files and directories."""
        cache_items = []

        for root, dirs, files in os.walk(self.repo_path):
            root_path = Path(root)

            # Skip git directories
            if '.git' in root_path.parts:
                continue

            # Check directories for cache patterns
            for dir_name in dirs[:]:
                if self._is_cache_directory(dir_name):
                    dir_path = root_path / dir_name
                    size = self._get_directory_size(dir_path)
                    cache_items.append((dir_path, size))
                    dirs.remove(dir_name)  # Don't recurse into cache directories

            # Check files for cache patterns
            for file_name in files:
                if self._is_cache_file(file_name):
                    file_path = root_path / file_name
                    try:
                        size = file_path.stat().st_size
                        cache_items.append((file_path, size))
                    except (OSError, FileNotFoundError):
                        cache_items.append((file_path, 0))

        return cache_items

    def _is_cache_directory(self, dir_name: str) -> bool:
        """Check if directory is a Python cache directory."""
        for pattern in self.cache_patterns:
            if pattern.endswith('/'):
                if dir_name == pattern[:-1]:
                    return True
            elif '*' not in pattern and dir_name == pattern:
                return True
        return False

    def _is_cache_file(self, file_name: str) -> bool:
        """Check if file is a Python cache file."""
        import fnmatch
        for pattern in self.cache_patterns:
            if '*' in pattern and fnmatch.fnmatch(file_name, pattern):
                return True
            elif file_name == pattern:
                return True
        return False

    def _get_directory_size(self, dir_path: Path) -> int:
        """Calculate total size of directory."""
        total = 0
        try:
            for item in dir_path.rglob('*'):
                if item.is_file():
                    total += item.stat().st_size
        except (OSError, PermissionError):
            pass
        return total

    def _display_cleanup_summary(self, cache_items: list[tuple[Path, int]]) -> None:
        """Display cleanup summary."""
        total_size = sum(size for _, size in cache_items)
        dirs = [item for item, _ in cache_items if item.is_dir()]
        files = [item for item, _ in cache_items if item.is_file()]

        print("\n" + "=" * 60)
        print("🐍 PYTHON CACHE CLEANUP SUMMARY")
        print("=" * 60)
        print(f"Cache directories: {len(dirs)}")
        print(f"Cache files: {len(files)}")
        print(f"Total space to free: {self._format_size(total_size)}")
        print()

        if cache_items:
            print("📁 ITEMS TO REMOVE:")
            # Show largest items first
            sorted_items = sorted(cache_items, key=lambda x: x[1], reverse=True)
            for item_path, size in sorted_items[:10]:
                rel_path = item_path.relative_to(self.repo_path)
                item_type = "DIR " if item_path.is_dir() else "FILE"
                print(f"  {item_type} {rel_path} ({self._format_size(size)})")

            if len(cache_items) > 10:
                print(f"  ... and {len(cache_items) - 10} more items")
            print()

    def _confirm_cleanup(self) -> bool:
        """Get user confirmation for cleanup."""
        if self.dry_run:
            print("🔍 DRY RUN MODE - No actual changes will be made")
            return True

        print("⚠️  This will permanently delete Python cache files!")
        print("   These files can be safely regenerated by Python.")

        while True:
            response = input("\nProceed with cleanup? (yes/no): ").lower().strip()
            if response in ["yes", "y"]:
                return True
            elif response in ["no", "n"]:
                return False
            else:
                print("Please enter 'yes' or 'no'")

    def _remove_cache_item(self, item_path: Path) -> bool:
        """Remove a cache file or directory."""
        if not item_path.exists():
            return False

        if self.dry_run:
            print(f"🔍 DRY RUN: Would remove {item_path.relative_to(self.repo_path)}")
            return True

        try:
            if item_path.is_dir():
                shutil.rmtree(item_path)
                print(f"🗑️  REMOVED DIR: {item_path.relative_to(self.repo_path)}")
            else:
                item_path.unlink()
                print(f"🗑️  REMOVED FILE: {item_path.relative_to(self.repo_path)}")
            return True

        except Exception as e:
            print(f"❌ Failed to remove {item_path.relative_to(self.repo_path)}: {e}")
            raise

    def _generate_cleanup_report(self, results: dict[str, Any]) -> None:
        """Generate cleanup report."""
        report_lines = [
            "# Python Cache Cleanup Report",
            f"Generated: {results['timestamp']}",
            f"Repository: {self.repo_path}",
            f"Status: {results['status']}",
            "",
            "## Summary",
            f"- Items removed: {results['items_removed']}",
            f"- Space freed: {self._format_size(results['space_freed'])}",
            f"- Errors: {len(results['errors'])}",
            ""
        ]

        if results["errors"]:
            report_lines.extend(["## Errors", ""])
            for error in results["errors"]:
                report_lines.append(f"❌ {error}")

        report_content = "\n".join(report_lines)
        report_file = f"reports/python_cache_cleanup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
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

    parser = argparse.ArgumentParser(description="Python Cache Cleanup")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--auto-confirm", action="store_true", help="Skip confirmation prompts")

    args = parser.parse_args()

    cleanup = PythonCacheCleanup(dry_run=args.dry_run)

    if args.auto_confirm:
        cleanup._confirm_cleanup = lambda: True

    try:
        results = cleanup.cleanup_python_cache()

        if results["status"] == "completed":
            print("\n✅ Python cache cleanup completed!")
            print(f"🗑️  Items removed: {results['items_removed']}")
            print(f"💾 Space freed: {cleanup._format_size(results['space_freed'])}")
        else:
            print(f"\n⚠️  Cleanup status: {results['status']}")

    except KeyboardInterrupt:
        print("\n❌ Cleanup interrupted by user")
    except Exception as e:
        print(f"\n❌ Cleanup failed: {e}")


if __name__ == "__main__":
    main()
