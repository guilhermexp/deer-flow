#!/usr/bin/env python3
"""
Mock Data Evaluation Script
Analyzes mock data files and determines their necessity.
"""

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class MockDataInfo:
    path: str
    size: int
    modified_time: str
    file_type: str
    purpose: str
    is_used: bool
    necessity: str  # "essential", "useful", "obsolete"
    reason: str


class MockDataEvaluator:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        self.mock_patterns = [
            "mock*",
            "*mock*",
            "test*data*",
            "*test*data*",
            "fixture*",
            "*fixture*",
            "sample*",
            "*sample*",
            "dummy*",
            "*dummy*"
        ]
        self.mock_directories = [
            "mocks",
            "fixtures",
            "test-data",
            "test_data",
            "samples",
            "examples"
        ]

    def find_mock_data(self) -> list[MockDataInfo]:
        """Find mock data files in the repository."""
        mock_files = []

        for root, dirs, files in os.walk(self.repo_path):
            root_path = Path(root)

            # Skip git and node_modules
            if any(skip in root_path.parts for skip in ['.git', 'node_modules', '__pycache__']):
                continue

            # Check if we're in a mock directory
            in_mock_dir = any(mock_dir in root_path.name.lower() for mock_dir in self.mock_directories)

            # Check directories
            for dir_name in dirs:
                if any(mock_dir in dir_name.lower() for mock_dir in self.mock_directories):
                    dir_path = root_path / dir_name
                    mock_info = self._analyze_mock_directory(dir_path)
                    mock_files.append(mock_info)

            # Check files
            for file_name in files:
                file_path = root_path / file_name
                if self._is_mock_file(file_name) or in_mock_dir:
                    mock_info = self._analyze_mock_file(file_path)
                    mock_files.append(mock_info)

        return mock_files

    def _is_mock_file(self, file_name: str) -> bool:
        """Check if file appears to be mock data."""
        name_lower = file_name.lower()

        # Check patterns
        import fnmatch
        for pattern in self.mock_patterns:
            if fnmatch.fnmatch(name_lower, pattern):
                return True

        # Check file extensions typically used for test data
        test_extensions = ['.json', '.csv', '.xml', '.yaml', '.yml', '.sql']
        if any(name_lower.endswith(ext) for ext in test_extensions):
            if any(keyword in name_lower for keyword in ['test', 'mock', 'sample', 'dummy', 'fixture']):
                return True

        return False

    def _analyze_mock_file(self, file_path: Path) -> MockDataInfo:
        """Analyze a mock data file."""
        try:
            stat = file_path.stat()
            size = stat.st_size
            modified_time = datetime.fromtimestamp(stat.st_mtime)
        except (OSError, FileNotFoundError):
            size = 0
            modified_time = datetime.now()

        file_type = self._determine_file_type(file_path)
        purpose = self._determine_purpose(file_path)
        is_used = self._check_if_used(file_path)
        necessity, reason = self._assess_necessity(file_path, purpose, is_used, modified_time)

        return MockDataInfo(
            path=str(file_path.relative_to(self.repo_path)),
            size=size,
            modified_time=modified_time.isoformat(),
            file_type=file_type,
            purpose=purpose,
            is_used=is_used,
            necessity=necessity,
            reason=reason
        )

    def _analyze_mock_directory(self, dir_path: Path) -> MockDataInfo:
        """Analyze a mock data directory."""
        try:
            stat = dir_path.stat()
            modified_time = datetime.fromtimestamp(stat.st_mtime)
        except (OSError, FileNotFoundError):
            modified_time = datetime.now()

        size = self._get_directory_size(dir_path)
        purpose = self._determine_purpose(dir_path)
        is_used = self._check_if_used(dir_path)
        necessity, reason = self._assess_necessity(dir_path, purpose, is_used, modified_time)

        return MockDataInfo(
            path=str(dir_path.relative_to(self.repo_path)),
            size=size,
            modified_time=modified_time.isoformat(),
            file_type="directory",
            purpose=purpose,
            is_used=is_used,
            necessity=necessity,
            reason=reason
        )

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

    def _determine_file_type(self, file_path: Path) -> str:
        """Determine the type of mock data file."""
        suffix = file_path.suffix.lower()
        name = file_path.name.lower()

        if suffix in ['.json']:
            return "json_data"
        elif suffix in ['.csv']:
            return "csv_data"
        elif suffix in ['.sql']:
            return "database_data"
        elif suffix in ['.xml', '.yaml', '.yml']:
            return "config_data"
        elif suffix in ['.png', '.jpg', '.jpeg', '.gif']:
            return "image_data"
        elif 'fixture' in name:
            return "test_fixture"
        elif 'sample' in name:
            return "sample_data"
        else:
            return "unknown"

    def _determine_purpose(self, file_path: Path) -> str:
        """Determine the purpose of the mock data."""
        path_str = str(file_path).lower()

        if 'test' in path_str:
            return "testing"
        elif 'example' in path_str or 'sample' in path_str:
            return "documentation"
        elif 'fixture' in path_str:
            return "test_fixtures"
        elif 'seed' in path_str:
            return "database_seeding"
        elif 'mock' in path_str:
            return "mocking"
        else:
            return "unknown"

    def _check_if_used(self, file_path: Path) -> bool:
        """Check if mock data is referenced in code."""
        relative_path = file_path.relative_to(self.repo_path)

        # Search for references in Python and TypeScript files
        search_patterns = [
            str(relative_path),
            file_path.name,
            file_path.stem  # filename without extension
        ]

        for root, dirs, files in os.walk(self.repo_path):
            # Skip certain directories
            if any(skip in Path(root).parts for skip in ['.git', 'node_modules', '__pycache__']):
                continue

            for file_name in files:
                if file_name.endswith(('.py', '.ts', '.tsx', '.js', '.jsx', '.md', '.yaml', '.yml')):
                    file_full_path = Path(root) / file_name
                    try:
                        with open(file_full_path, encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            for pattern in search_patterns:
                                if pattern in content:
                                    return True
                    except (OSError, UnicodeDecodeError):
                        continue

        return False

    def _assess_necessity(self, file_path: Path, purpose: str, is_used: bool, modified_time: datetime) -> tuple[str, str]:
        """Assess the necessity of keeping the mock data."""
        age_days = (datetime.now() - modified_time).days

        # Essential if actively used
        if is_used:
            return "essential", "Referenced in codebase"

        # Essential for certain purposes
        if purpose in ["test_fixtures", "database_seeding"]:
            return "essential", f"Required for {purpose}"

        # Useful if recent and for documentation
        if purpose == "documentation" and age_days < 90:
            return "useful", "Recent documentation examples"

        # Obsolete if old and unused
        if age_days > 180 and not is_used:
            return "obsolete", f"Unused for {age_days} days"

        # Obsolete if very old
        if age_days > 365:
            return "obsolete", f"Very old ({age_days} days)"

        # Default to useful if uncertain
        return "useful", "May be useful for development"

    def generate_evaluation_report(self, mock_data: list[MockDataInfo]) -> str:
        """Generate mock data evaluation report."""
        essential = [m for m in mock_data if m.necessity == "essential"]
        useful = [m for m in mock_data if m.necessity == "useful"]
        obsolete = [m for m in mock_data if m.necessity == "obsolete"]

        total_size = sum(m.size for m in mock_data)
        obsolete_size = sum(m.size for m in obsolete)

        report_lines = [
            "# Mock Data Evaluation Report",
            f"Generated: {datetime.now().isoformat()}",
            f"Repository: {self.repo_path}",
            "",
            "## Summary",
            f"- Total mock data items: {len(mock_data)}",
            f"- Essential (keep): {len(essential)}",
            f"- Useful (review): {len(useful)}",
            f"- Obsolete (remove): {len(obsolete)}",
            f"- Total size: {self._format_size(total_size)}",
            f"- Potential space savings: {self._format_size(obsolete_size)}",
            ""
        ]

        # Group by purpose
        by_purpose = {}
        for item in mock_data:
            purpose = item.purpose
            if purpose not in by_purpose:
                by_purpose[purpose] = []
            by_purpose[purpose].append(item)

        report_lines.extend(["## By Purpose", ""])
        for purpose, items in by_purpose.items():
            purpose_size = sum(i.size for i in items)
            report_lines.extend([
                f"### {purpose.title().replace('_', ' ')} ({len(items)})",
                f"- Total size: {self._format_size(purpose_size)}",
                ""
            ])

            for item in sorted(items, key=lambda x: x.size, reverse=True)[:5]:
                necessity_emoji = {"essential": "✅", "useful": "⚠️ ", "obsolete": "❌"}
                emoji = necessity_emoji.get(item.necessity, "❓")
                used_str = " (used)" if item.is_used else " (unused)"
                report_lines.append(f"{emoji} {item.path}{used_str} - {self._format_size(item.size)}")

            if len(items) > 5:
                report_lines.append(f"... and {len(items) - 5} more items")
            report_lines.append("")

        # Recommendations
        report_lines.extend([
            "## Recommendations",
            ""
        ])

        if obsolete:
            report_lines.extend([
                f"### 🗑️  Remove Obsolete Items ({len(obsolete)})",
                f"These items can be safely removed to free {self._format_size(obsolete_size)}:",
                ""
            ])
            for item in sorted(obsolete, key=lambda x: x.size, reverse=True)[:10]:
                report_lines.append(f"- {item.path} - {item.reason}")

        if useful:
            report_lines.extend([
                "",
                f"### 🔍 Review Useful Items ({len(useful)})",
                "These items may be useful but require review:",
                ""
            ])
            for item in sorted(useful, key=lambda x: x.size, reverse=True)[:5]:
                report_lines.append(f"- {item.path} - {item.reason}")

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

    parser = argparse.ArgumentParser(description="Mock Data Evaluator")
    parser.add_argument("--output", help="Output file for evaluation report")
    parser.add_argument("--json", help="Export evaluation data to JSON file")
    parser.add_argument("--summary", action="store_true", help="Show only summary")

    args = parser.parse_args()

    evaluator = MockDataEvaluator()
    mock_data = evaluator.find_mock_data()

    if args.summary:
        essential = len([m for m in mock_data if m.necessity == "essential"])
        useful = len([m for m in mock_data if m.necessity == "useful"])
        obsolete = len([m for m in mock_data if m.necessity == "obsolete"])
        total_size = sum(m.size for m in mock_data)

        print(f"📊 Found {len(mock_data)} mock data items")
        print(f"✅ Essential: {essential}")
        print(f"⚠️  Useful: {useful}")
        print(f"❌ Obsolete: {obsolete}")
        print(f"💾 Total size: {evaluator._format_size(total_size)}")
    else:
        report = evaluator.generate_evaluation_report(mock_data)
        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"📄 Evaluation report saved to: {args.output}")
        else:
            print(report)

    if args.json:
        data = {
            "timestamp": datetime.now().isoformat(),
            "repository": str(evaluator.repo_path),
            "mock_data": [asdict(item) for item in mock_data]
        }
        with open(args.json, "w") as f:
            json.dump(data, f, indent=2, default=str)
        print(f"📊 Evaluation data exported to: {args.json}")


if __name__ == "__main__":
    main()
