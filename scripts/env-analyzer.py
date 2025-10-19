#!/usr/bin/env python3
"""
Environment File Analyzer for Repository Cleanup
Analyzes .env file duplications and inconsistencies for consolidation planning.
"""

import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class EnvVariable:
    """Represents an environment variable."""
    key: str
    value: str
    is_secret: bool
    comment: str | None = None


@dataclass
class EnvFileAnalysis:
    """Analysis of a single .env file."""
    path: str
    exists: bool
    size: int
    modified_time: str
    variables: dict[str, EnvVariable]
    file_type: str  # "example", "local", "development", "production", "generic"
    is_template: bool
    secrets_count: int
    duplicates_with: list[str]


@dataclass
class ConsolidationOpportunity:
    """Represents an opportunity for environment file consolidation."""
    files: list[str]
    common_variables: dict[str, str]
    conflicting_variables: dict[str, dict[str, str]]
    consolidation_type: str  # "merge", "deduplicate", "template"
    estimated_benefit: str


class EnvAnalyzer:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        self.secret_patterns = [
            r'.*password.*',
            r'.*secret.*',
            r'.*key.*',
            r'.*token.*',
            r'.*api.*key.*',
            r'.*private.*',
            r'.*credential.*',
            r'.*auth.*'
        ]

    def find_env_files(self) -> list[Path]:
        """Find all environment files in the repository."""
        env_files = []

        # Common .env patterns
        patterns = [
            ".env",
            ".env.*",
            "*.env",
            "env.*"
        ]

        for pattern in patterns:
            for path in self.repo_path.glob(f"**/{pattern}"):
                if path.is_file() and self._is_env_file(path):
                    env_files.append(path)

        # Remove duplicates and sort
        return sorted(set(env_files))

    def analyze_env_file(self, file_path: Path) -> EnvFileAnalysis:
        """Analyze a single environment file."""
        if not file_path.exists():
            return EnvFileAnalysis(
                path=str(file_path.relative_to(self.repo_path)),
                exists=False,
                size=0,
                modified_time="",
                variables={},
                file_type="missing",
                is_template=False,
                secrets_count=0,
                duplicates_with=[]
            )

        # Read file content
        try:
            with open(file_path, encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")
            content = ""

        # Parse variables
        variables = self._parse_env_variables(content)

        # Analyze file
        stat = file_path.stat()
        file_type = self._determine_file_type(file_path)
        is_template = self._is_template_file(content, variables)
        secrets_count = sum(1 for var in variables.values() if var.is_secret)

        return EnvFileAnalysis(
            path=str(file_path.relative_to(self.repo_path)),
            exists=True,
            size=stat.st_size,
            modified_time=datetime.fromtimestamp(stat.st_mtime).isoformat(),
            variables=variables,
            file_type=file_type,
            is_template=is_template,
            secrets_count=secrets_count,
            duplicates_with=[]
        )

    def analyze_all_env_files(self) -> list[EnvFileAnalysis]:
        """Analyze all environment files in the repository."""
        env_files = self.find_env_files()
        analyses = []

        for file_path in env_files:
            analysis = self.analyze_env_file(file_path)
            analyses.append(analysis)

        # Find duplicates
        self._find_duplicates(analyses)

        return analyses

    def find_consolidation_opportunities(self, analyses: list[EnvFileAnalysis]) -> list[ConsolidationOpportunity]:
        """Find opportunities for consolidating environment files."""
        opportunities = []

        # Group files by directory
        by_directory = {}
        for analysis in analyses:
            if not analysis.exists:
                continue

            dir_path = str(Path(analysis.path).parent)
            if dir_path not in by_directory:
                by_directory[dir_path] = []
            by_directory[dir_path].append(analysis)

        # Analyze each directory
        for directory, files in by_directory.items():
            if len(files) < 2:
                continue

            # Find merge opportunities
            merge_opportunities = self._find_merge_opportunities(files)
            opportunities.extend(merge_opportunities)

            # Find template opportunities
            template_opportunities = self._find_template_opportunities(files)
            opportunities.extend(template_opportunities)

        return opportunities

    def generate_analysis_report(self) -> str:
        """Generate a comprehensive analysis report."""
        analyses = self.analyze_all_env_files()
        opportunities = self.find_consolidation_opportunities(analyses)

        # Calculate statistics
        total_files = len([a for a in analyses if a.exists])
        total_variables = sum(len(a.variables) for a in analyses if a.exists)
        total_secrets = sum(a.secrets_count for a in analyses if a.exists)
        total_size = sum(a.size for a in analyses if a.exists)

        report_lines = [
            "# Environment File Analysis Report",
            f"Generated: {datetime.now().isoformat()}",
            f"Repository: {self.repo_path}",
            "",
            "## Summary",
            f"- Total .env files: {total_files}",
            f"- Total variables: {total_variables}",
            f"- Total secrets: {total_secrets}",
            f"- Total size: {self._format_size(total_size)}",
            f"- Consolidation opportunities: {len(opportunities)}",
            ""
        ]

        # Files by type
        by_type = {}
        for analysis in analyses:
            if not analysis.exists:
                continue
            file_type = analysis.file_type
            if file_type not in by_type:
                by_type[file_type] = []
            by_type[file_type].append(analysis)

        report_lines.extend(["## Files by Type", ""])
        for file_type, files in by_type.items():
            type_vars = sum(len(f.variables) for f in files)
            type_secrets = sum(f.secrets_count for f in files)

            report_lines.extend([
                f"### {file_type.title()} Files ({len(files)})",
                f"- Variables: {type_vars}",
                f"- Secrets: {type_secrets}",
                ""
            ])

            for file_analysis in files:
                template_str = " (template)" if file_analysis.is_template else ""
                duplicates_str = f" - duplicates: {len(file_analysis.duplicates_with)}" if file_analysis.duplicates_with else ""
                report_lines.append(f"  • {file_analysis.path}{template_str}{duplicates_str}")
            report_lines.append("")

        # Consolidation opportunities
        if opportunities:
            report_lines.extend(["## Consolidation Opportunities", ""])
            for i, opp in enumerate(opportunities, 1):
                report_lines.extend([
                    f"### Opportunity {i}: {opp.consolidation_type.title()}",
                    f"- Files: {', '.join(opp.files)}",
                    f"- Common variables: {len(opp.common_variables)}",
                    f"- Conflicts: {len(opp.conflicting_variables)}",
                    f"- Benefit: {opp.estimated_benefit}",
                    ""
                ])

        # Duplicates analysis
        duplicates = [(a.path, a.duplicates_with) for a in analyses if a.duplicates_with]
        if duplicates:
            report_lines.extend(["## Duplicate Variables", ""])
            for file_path, duplicate_files in duplicates:
                report_lines.append(f"- **{file_path}** duplicates with: {', '.join(duplicate_files)}")
            report_lines.append("")

        return "\n".join(report_lines)

    def export_analysis_data(self, output_file: str) -> None:
        """Export analysis data to JSON file."""
        analyses = self.analyze_all_env_files()
        opportunities = self.find_consolidation_opportunities(analyses)

        # Convert to serializable format
        data = {
            "timestamp": datetime.now().isoformat(),
            "repository": str(self.repo_path),
            "files": [self._analysis_to_dict(analysis) for analysis in analyses],
            "opportunities": [asdict(opp) for opp in opportunities]
        }

        with open(output_file, "w") as f:
            json.dump(data, f, indent=2, default=str)

        print(f"📊 Analysis data exported to: {output_file}")

    def _is_env_file(self, file_path: Path) -> bool:
        """Check if a file is an environment file."""
        name = file_path.name.lower()

        # Common .env file patterns
        env_patterns = [
            r'^\.env$',
            r'^\.env\.',
            r'\.env$',
            r'^env\.',
            r'environment'
        ]

        for pattern in env_patterns:
            if re.match(pattern, name):
                return True

        # Check content for environment variable patterns
        try:
            with open(file_path, encoding='utf-8') as f:
                content = f.read(1000)  # Read first 1000 chars
                env_lines = [line for line in content.split('\n') if re.match(r'^[A-Z_][A-Z0-9_]*=', line.strip())]
                return len(env_lines) > 0
        except Exception:
            return False

    def _parse_env_variables(self, content: str) -> dict[str, EnvVariable]:
        """Parse environment variables from file content."""
        variables = {}
        lines = content.split('\n')

        for line_num, line in enumerate(lines):
            line = line.strip()

            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue

            # Parse variable
            match = re.match(r'^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$', line)
            if match:
                key, value = match.groups()

                # Remove quotes
                value = value.strip('"\'')

                # Check if it's a secret
                is_secret = self._is_secret_variable(key, value)

                # Look for comment on same line or previous line
                comment = None
                if '#' in line:
                    comment = line.split('#', 1)[1].strip()
                elif line_num > 0 and lines[line_num - 1].strip().startswith('#'):
                    comment = lines[line_num - 1].strip()[1:].strip()

                variables[key] = EnvVariable(
                    key=key,
                    value=value,
                    is_secret=is_secret,
                    comment=comment
                )

        return variables

    def _is_secret_variable(self, key: str, value: str) -> bool:
        """Determine if a variable contains secret information."""
        key_lower = key.lower()

        for pattern in self.secret_patterns:
            if re.match(pattern, key_lower):
                return True

        # Check for placeholder values
        placeholder_patterns = [
            r'^your_.*',
            r'^<.*>$',
            r'^\[.*\]$',
            r'.*_here$',
            r'.*_placeholder$'
        ]

        for pattern in placeholder_patterns:
            if re.match(pattern, value.lower()):
                return False

        # If value looks like a real secret (long alphanumeric)
        if len(value) > 20 and re.match(r'^[a-zA-Z0-9_\-]+$', value):
            return True

        return False

    def _determine_file_type(self, file_path: Path) -> str:
        """Determine the type of environment file."""
        name = file_path.name.lower()

        if 'example' in name or 'template' in name or 'sample' in name:
            return "example"
        elif 'local' in name:
            return "local"
        elif 'development' in name or 'dev' in name:
            return "development"
        elif 'production' in name or 'prod' in name:
            return "production"
        elif 'test' in name:
            return "test"
        else:
            return "generic"

    def _is_template_file(self, content: str, variables: dict[str, EnvVariable]) -> bool:
        """Check if file appears to be a template."""
        # Count placeholder values
        placeholders = 0
        for var in variables.values():
            if any(pattern in var.value.lower() for pattern in ['your_', '<', '>', 'placeholder', 'example', 'here']):
                placeholders += 1

        # If most values are placeholders, it's likely a template
        return placeholders > len(variables) * 0.5 if variables else False

    def _find_duplicates(self, analyses: list[EnvFileAnalysis]) -> None:
        """Find duplicate variables between files."""
        for i, analysis1 in enumerate(analyses):
            if not analysis1.exists:
                continue

            for j, analysis2 in enumerate(analyses[i + 1:], i + 1):
                if not analysis2.exists:
                    continue

                # Find common variables
                common_vars = set(analysis1.variables.keys()) & set(analysis2.variables.keys())
                if len(common_vars) > len(analysis1.variables) * 0.3:  # 30% overlap threshold
                    analysis1.duplicates_with.append(analysis2.path)
                    analysis2.duplicates_with.append(analysis1.path)

    def _find_merge_opportunities(self, files: list[EnvFileAnalysis]) -> list[ConsolidationOpportunity]:
        """Find opportunities to merge files."""
        opportunities = []

        for i, file1 in enumerate(files):
            for file2 in files[i + 1:]:
                if file1.file_type == file2.file_type or (file1.is_template and file2.is_template):
                    common_vars = {}
                    conflicts = {}

                    # Find common and conflicting variables
                    all_keys = set(file1.variables.keys()) | set(file2.variables.keys())
                    for key in all_keys:
                        var1 = file1.variables.get(key)
                        var2 = file2.variables.get(key)

                        if var1 and var2:
                            if var1.value == var2.value:
                                common_vars[key] = var1.value
                            else:
                                conflicts[key] = {file1.path: var1.value, file2.path: var2.value}

                    if len(common_vars) > 3:  # Threshold for merge consideration
                        opportunities.append(ConsolidationOpportunity(
                            files=[file1.path, file2.path],
                            common_variables=common_vars,
                            conflicting_variables=conflicts,
                            consolidation_type="merge",
                            estimated_benefit=f"Reduce {len(common_vars)} duplicate variables"
                        ))

        return opportunities

    def _find_template_opportunities(self, files: list[EnvFileAnalysis]) -> list[ConsolidationOpportunity]:
        """Find opportunities to create templates."""
        opportunities = []

        # Look for files that could be templated
        template_candidates = [f for f in files if not f.is_template and f.file_type in ["example", "local"]]

        if len(template_candidates) >= 2:
            all_vars = {}
            for file in template_candidates:
                for key, var in file.variables.items():
                    if key not in all_vars:
                        all_vars[key] = []
                    all_vars[key].append((file.path, var.value))

            # Find variables that appear in multiple files
            common_structure = {k: v for k, v in all_vars.items() if len(v) >= 2}

            if len(common_structure) > 5:  # Threshold for template creation
                opportunities.append(ConsolidationOpportunity(
                    files=[f.path for f in template_candidates],
                    common_variables={},
                    conflicting_variables={},
                    consolidation_type="template",
                    estimated_benefit=f"Create template with {len(common_structure)} variables"
                ))

        return opportunities

    def _analysis_to_dict(self, analysis: EnvFileAnalysis) -> dict:
        """Convert analysis to dictionary for JSON serialization."""
        result = asdict(analysis)
        # Convert EnvVariable objects to dicts
        result['variables'] = {k: asdict(v) for k, v in analysis.variables.items()}
        return result

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

    parser = argparse.ArgumentParser(description="Environment File Analyzer")
    parser.add_argument("--output", help="Output file for analysis report")
    parser.add_argument("--json", help="Export analysis data to JSON file")
    parser.add_argument("--summary", action="store_true", help="Show only summary")

    args = parser.parse_args()

    analyzer = EnvAnalyzer()

    if args.summary:
        analyses = analyzer.analyze_all_env_files()
        total_files = len([a for a in analyses if a.exists])
        total_vars = sum(len(a.variables) for a in analyses if a.exists)
        total_secrets = sum(a.secrets_count for a in analyses if a.exists)

        print(f"📊 Found {total_files} environment files")
        print(f"🔧 Total variables: {total_vars}")
        print(f"🔒 Total secrets: {total_secrets}")

        for analysis in analyses:
            if analysis.exists:
                template_str = " (template)" if analysis.is_template else ""
                secrets_str = f" | {analysis.secrets_count} secrets" if analysis.secrets_count else ""
                print(f"  • {analysis.path} ({analysis.file_type}){template_str} - {len(analysis.variables)} vars{secrets_str}")
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
