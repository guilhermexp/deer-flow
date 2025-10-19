#!/usr/bin/env python3
"""
Temporary File Scanner for Repository Cleanup
Identifies temporary files and directories for cleanup.
"""

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class TempFileInfo:
    path: str
    size: int
    modified_time: str
    file_type: str
    is_safe_to_delete: bool
    reason: str


class TempFileScanner:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        self.temp_patterns = {
            'cache': ['__pycache__', '.pytest_cache', '.coverage', '*.pyc', '*.pyo', '.DS_Store'],
            'logs': ['*.log', '*.log.*', 'logs/', 'tmp/', 'temp/'],
            'build': ['dist/', 'build/', '*.egg-info/', 'node_modules/.cache/'],
            'temp': ['*.tmp', '*.temp', '.tmp*', 'tmp*', 'temp*'],
            'backup': ['*.bak', '*.backup', '*~', '.#*', '#*#'],
            'test': ['*.test', '.coverage.*', 'coverage/']
        }

    def scan_temp_files(self) -> list[TempFileInfo]:
        """Scan for temporary files in the repository."""
        temp_files = []

        for root, dirs, files in os.walk(self.repo_path):
            root_path = Path(root)

            # Skip git and other VCS directories
            if any(vcs in root_path.parts for vcs in ['.git', '.svn', '.hg']):
                continue

            # Check directories
            for dir_name in dirs[:]:
                dir_path = root_path / dir_name
                if self._is_temp_directory(dir_path):
                    temp_info = self._analyze_path(dir_path)
                    temp_files.append(temp_info)
                    dirs.remove(dir_name)  # Don't recurse into temp directories

            # Check files
            for file_name in files:
                file_path = root_path / file_name
                if self._is_temp_file(file_path):
                    temp_info = self._analyze_path(file_path)
                    temp_files.append(temp_info)

        return temp_files

    def _is_temp_directory(self, dir_path: Path) -> bool:
        """Check if directory is temporary."""
        name = dir_path.name.lower()

        for category, patterns in self.temp_patterns.items():
            for pattern in patterns:
                if pattern.endswith('/'):
                    if name == pattern[:-1]:
                        return True
                elif '*' in pattern:
                    import fnmatch
                    if fnmatch.fnmatch(name, pattern):
                        return True
                elif name == pattern:
                    return True
        return False

    def _is_temp_file(self, file_path: Path) -> bool:
        """Check if file is temporary."""
        name = file_path.name.lower()

        for category, patterns in self.temp_patterns.items():
            for pattern in patterns:
                if '*' in pattern:
                    import fnmatch
                    if fnmatch.fnmatch(name, pattern):
                        return True
                elif name == pattern:
                    return True
        return False

    def _analyze_path(self, path: Path) -> TempFileInfo:
        """Analyze a temporary file or directory."""
        try:
            stat = path.stat()
            size = self._get_total_size(path) if path.is_dir() else stat.st_size
            modified_time = datetime.fromtimestamp(stat.st_mtime)
        except (OSError, FileNotFoundError):
            size = 0
            modified_time = datetime.now()

        file_type = self._categorize_temp_file(path)
        is_safe, reason = self._assess_safety(path, file_type, modified_time)

        return TempFileInfo(
            path=str(path.relative_to(self.repo_path)),
            size=size,
            modified_time=modified_time.isoformat(),
            file_type=file_type,
            is_safe_to_delete=is_safe,
            reason=reason
        )

    def _get_total_size(self, dir_path: Path) -> int:
        """Calculate total size of directory."""
        total = 0
        try:
            for item in dir_path.rglob('*'):
                if item.is_file():
                    total += item.stat().st_size
        except (OSError, PermissionError):
            pass
        return total

    def _categorize_temp_file(self, path: Path) -> str:
        """Categorize the type of temporary file."""
        name = path.name.lower()

        for category, patterns in self.temp_patterns.items():
            for pattern in patterns:
                if '*' in pattern:
                    import fnmatch
                    if fnmatch.fnmatch(name, pattern):
                        return category
                elif pattern.endswith('/') and name == pattern[:-1]:
                    return category
                elif name == pattern:
                    return category
        return 'unknown'

    def _assess_safety(self, path: Path, file_type: str, modified_time: datetime) -> tuple[bool, str]:
        """Assess if it's safe to delete the file."""
        age_days = (datetime.now() - modified_time).days

        # Always safe to delete
        if file_type in ['cache', 'logs', 'temp']:
            return True, f"{file_type} files are safe to delete"

        # Safe if old
        if file_type == 'backup' and age_days > 30:
            return True, f"Old backup file ({age_days} days)"

        if file_type == 'test' and age_days > 7:
            return True, f"Old test artifact ({age_days} days)"

        # Build artifacts - safe if not too recent
        if file_type == 'build' and age_days > 1:
            return True, f"Build artifact ({age_days} days old)"

        # Recent files - be cautious
        if age_days < 1:
            return False, f"Recent {file_type} file (created today)"

        return True, f"{file_type} file can be safely deleted"

    def generate_report(self, temp_files: list[TempFileInfo]) -> str:
        """Generate a report of temporary files."""
        safe_files = [f for f in temp_files if f.is_safe_to_delete]
        unsafe_files = [f for f in temp_files if not f.is_safe_to_delete]

        total_size = sum(f.size for f in temp_files)
        safe_size = sum(f.size for f in safe_files)

        # Group by type
        by_type = {}
        for file_info in temp_files:
            file_type = file_info.file_type
            if file_type not in by_type:
                by_type[file_type] = []
            by_type[file_type].append(file_info)

        report_lines = [
            "# Temporary Files Scan Report",
            f"Generated: {datetime.now().isoformat()}",
            f"Repository: {self.repo_path}",
            "",
            "## Summary",
            f"- Total temporary items: {len(temp_files)}",
            f"- Safe to delete: {len(safe_files)}",
            f"- Requires review: {len(unsafe_files)}",
            f"- Total size: {self._format_size(total_size)}",
            f"- Recoverable space: {self._format_size(safe_size)}",
            ""
        ]

        # Files by type
        for file_type, files in by_type.items():
            type_size = sum(f.size for f in files)
            safe_count = len([f for f in files if f.is_safe_to_delete])

            report_lines.extend([
                f"## {file_type.title()} Files ({len(files)})",
                f"- Total size: {self._format_size(type_size)}",
                f"- Safe to delete: {safe_count}/{len(files)}",
                ""
            ])

            for file_info in sorted(files, key=lambda x: x.size, reverse=True)[:10]:
                status = "✅" if file_info.is_safe_to_delete else "⚠️ "
                report_lines.append(f"{status} {file_info.path} ({self._format_size(file_info.size)})")

            if len(files) > 10:
                report_lines.append(f"... and {len(files) - 10} more files")
            report_lines.append("")

        return "\n".join(report_lines)

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

    parser = argparse.ArgumentParser(description="Temporary File Scanner")
    parser.add_argument("--output", help="Output file for scan report")
    parser.add_argument("--json", help="Export scan data to JSON file")
    parser.add_argument("--summary", action="store_true", help="Show only summary")

    args = parser.parse_args()

    scanner = TempFileScanner()
    temp_files = scanner.scan_temp_files()

    if args.summary:
        safe_files = [f for f in temp_files if f.is_safe_to_delete]
        total_size = sum(f.size for f in temp_files)
        safe_size = sum(f.size for f in safe_files)

        print(f"📊 Found {len(temp_files)} temporary items")
        print(f"✅ Safe to delete: {len(safe_files)} ({scanner._format_size(safe_size)})")
        print(f"⚠️  Requires review: {len(temp_files) - len(safe_files)}")
        print(f"💾 Total space: {scanner._format_size(total_size)}")
    else:
        report = scanner.generate_report(temp_files)
        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"📄 Scan report saved to: {args.output}")
        else:
            print(report)

    if args.json:
        data = {
            "timestamp": datetime.now().isoformat(),
            "repository": str(scanner.repo_path),
            "files": [asdict(file_info) for file_info in temp_files]
        }
        with open(args.json, "w") as f:
            json.dump(data, f, indent=2, default=str)
        print(f"📊 Scan data exported to: {args.json}")


if __name__ == "__main__":
    main()
