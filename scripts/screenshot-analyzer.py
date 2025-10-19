#!/usr/bin/env python3
"""
Screenshot Directory Analyzer for Repository Cleanup
Analyzes screenshot directories and their contents for cleanup decisions.
"""

import hashlib
import json
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class ScreenshotInfo:
    """Information about a screenshot file."""
    path: str
    size: int
    modified_time: str
    file_type: str
    checksum: str


@dataclass
class DirectoryAnalysis:
    """Analysis of a screenshot directory."""
    path: str
    total_files: int
    total_size: int
    file_types: dict[str, int]
    oldest_file: str | None
    newest_file: str | None
    screenshots: list[ScreenshotInfo]
    creation_pattern: str  # "test", "documentation", "archive", "unknown"


class ScreenshotAnalyzer:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        self.screenshot_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'}

    def find_screenshot_directories(self) -> list[Path]:
        """Find all directories that might contain screenshots."""
        screenshot_dirs = []

        # Common screenshot directory patterns
        patterns = [
            "*screenshot*",
            "*screen*",
            "*image*",
            "*assets*",
            "*media*",
            "*pics*",
            "*photos*"
        ]

        for pattern in patterns:
            for path in self.repo_path.glob(f"**/{pattern}"):
                if path.is_dir() and self._has_images(path):
                    screenshot_dirs.append(path)

        # Remove duplicates and sort
        return sorted(set(screenshot_dirs))

    def analyze_directory(self, dir_path: Path) -> DirectoryAnalysis:
        """Analyze a screenshot directory."""
        screenshots = []
        file_types = {}
        total_size = 0

        oldest_time = None
        newest_time = None
        oldest_file = None
        newest_file = None

        # Walk through directory
        for file_path in dir_path.rglob("*"):
            if file_path.is_file():
                suffix = file_path.suffix.lower()
                file_types[suffix] = file_types.get(suffix, 0) + 1

                stat = file_path.stat()
                total_size += stat.st_size
                modified_time = datetime.fromtimestamp(stat.st_mtime)

                # Track oldest and newest files
                if oldest_time is None or modified_time < oldest_time:
                    oldest_time = modified_time
                    oldest_file = str(file_path.relative_to(self.repo_path))

                if newest_time is None or modified_time > newest_time:
                    newest_time = modified_time
                    newest_file = str(file_path.relative_to(self.repo_path))

                # If it's an image, create detailed info
                if suffix in self.screenshot_extensions:
                    checksum = self._calculate_file_checksum(file_path)
                    screenshot_info = ScreenshotInfo(
                        path=str(file_path.relative_to(self.repo_path)),
                        size=stat.st_size,
                        modified_time=modified_time.isoformat(),
                        file_type=suffix,
                        checksum=checksum
                    )
                    screenshots.append(screenshot_info)

        # Determine creation pattern
        creation_pattern = self._determine_creation_pattern(dir_path)

        return DirectoryAnalysis(
            path=str(dir_path.relative_to(self.repo_path)),
            total_files=sum(file_types.values()),
            total_size=total_size,
            file_types=file_types,
            oldest_file=oldest_file,
            newest_file=newest_file,
            screenshots=screenshots,
            creation_pattern=creation_pattern
        )

    def analyze_all_directories(self) -> list[DirectoryAnalysis]:
        """Analyze all screenshot directories in the repository."""
        directories = self.find_screenshot_directories()
        analyses = []

        for dir_path in directories:
            try:
                analysis = self.analyze_directory(dir_path)
                analyses.append(analysis)
            except Exception as e:
                print(f"⚠️  Error analyzing {dir_path}: {e}")

        return analyses

    def generate_analysis_report(self) -> str:
        """Generate a comprehensive analysis report."""
        analyses = self.analyze_all_directories()

        # Calculate totals
        total_dirs = len(analyses)
        total_files = sum(a.total_files for a in analyses)
        total_size = sum(a.total_size for a in analyses)
        total_screenshots = sum(len(a.screenshots) for a in analyses)

        report_lines = [
            "# Screenshot Directory Analysis Report",
            f"Generated: {datetime.now().isoformat()}",
            f"Repository: {self.repo_path}",
            "",
            "## Summary",
            f"- Total screenshot directories: {total_dirs}",
            f"- Total files: {total_files}",
            f"- Total screenshots: {total_screenshots}",
            f"- Total size: {self._format_size(total_size)}",
            ""
        ]

        # Group by creation pattern
        by_pattern = {}
        for analysis in analyses:
            pattern = analysis.creation_pattern
            if pattern not in by_pattern:
                by_pattern[pattern] = []
            by_pattern[pattern].append(analysis)

        for pattern, dirs in by_pattern.items():
            pattern_size = sum(d.total_size for d in dirs)
            pattern_files = sum(d.total_files for d in dirs)

            report_lines.extend([
                f"## {pattern.title()} Directories ({len(dirs)})",
                f"- Total size: {self._format_size(pattern_size)}",
                f"- Total files: {pattern_files}",
                ""
            ])

            for dir_analysis in sorted(dirs, key=lambda x: x.total_size, reverse=True):
                report_lines.extend([
                    f"### {dir_analysis.path}",
                    f"- Files: {dir_analysis.total_files}",
                    f"- Size: {self._format_size(dir_analysis.total_size)}",
                    f"- Screenshots: {len(dir_analysis.screenshots)}",
                    f"- Oldest: {dir_analysis.oldest_file}",
                    f"- Newest: {dir_analysis.newest_file}",
                    ""
                ])

        # File type distribution
        all_file_types = {}
        for analysis in analyses:
            for ext, count in analysis.file_types.items():
                all_file_types[ext] = all_file_types.get(ext, 0) + count

        if all_file_types:
            report_lines.extend([
                "## File Type Distribution",
                ""
            ])
            for ext, count in sorted(all_file_types.items(), key=lambda x: x[1], reverse=True):
                report_lines.append(f"- {ext or '(no extension)'}: {count} files")
            report_lines.append("")

        return "\n".join(report_lines)

    def export_analysis_data(self, output_file: str) -> None:
        """Export analysis data to JSON file."""
        analyses = self.analyze_all_directories()

        # Convert to serializable format
        data = {
            "timestamp": datetime.now().isoformat(),
            "repository": str(self.repo_path),
            "directories": [asdict(analysis) for analysis in analyses]
        }

        with open(output_file, "w") as f:
            json.dump(data, f, indent=2, default=str)

        print(f"📊 Analysis data exported to: {output_file}")

    def _has_images(self, dir_path: Path) -> bool:
        """Check if directory contains image files."""
        for file_path in dir_path.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in self.screenshot_extensions:
                return True
        return False

    def _determine_creation_pattern(self, dir_path: Path) -> str:
        """Determine the likely purpose/pattern of directory creation."""
        path_str = str(dir_path).lower()

        # Test-related patterns
        test_indicators = ["test", "testing", "spec", "demo", "example"]
        if any(indicator in path_str for indicator in test_indicators):
            return "test"

        # Documentation patterns
        doc_indicators = ["doc", "docs", "readme", "guide", "tutorial"]
        if any(indicator in path_str for indicator in doc_indicators):
            return "documentation"

        # Archive patterns
        archive_indicators = ["old", "backup", "archive", "deprecated", "legacy"]
        if any(indicator in path_str for indicator in archive_indicators):
            return "archive"

        # Production/assets patterns
        asset_indicators = ["assets", "public", "static", "media", "resources"]
        if any(indicator in path_str for indicator in asset_indicators):
            return "production"

        return "unknown"

    def _calculate_file_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(chunk)
            return sha256_hash.hexdigest()
        except Exception:
            return "error"

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

    parser = argparse.ArgumentParser(description="Screenshot Directory Analyzer")
    parser.add_argument("--output", help="Output file for analysis report")
    parser.add_argument("--json", help="Export analysis data to JSON file")
    parser.add_argument("--summary", action="store_true", help="Show only summary")

    args = parser.parse_args()

    analyzer = ScreenshotAnalyzer()

    if args.summary:
        analyses = analyzer.analyze_all_directories()
        total_size = sum(a.total_size for a in analyses)
        total_screenshots = sum(len(a.screenshots) for a in analyses)

        print(f"📊 Found {len(analyses)} screenshot directories")
        print(f"📁 Total size: {analyzer._format_size(total_size)}")
        print(f"🖼️  Total screenshots: {total_screenshots}")

        for analysis in analyses:
            print(f"  • {analysis.path} ({analysis.creation_pattern}) - {analyzer._format_size(analysis.total_size)}")
    else:
        report = analyzer.generate_analysis_report()

        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"📄 Analysis report saved to: {args.output}")
        else:
            print(report)

    if args.json:
        analyzer.export_analysis_data(args.json)


if __name__ == "__main__":
    main()
