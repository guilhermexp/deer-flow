#!/usr/bin/env python3
"""
Spec Document Analyzer for Repository Cleanup
Analyzes specification documents and their status.
"""

import json
import os
import re
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class SpecDocInfo:
    path: str
    title: str
    status: str  # "draft", "active", "completed", "obsolete", "unknown"
    size: int
    modified_time: str
    word_count: int
    completeness: float  # 0.0 to 1.0
    references: list[str]
    is_linked: bool
    recommendation: str


class SpecAnalyzer:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        self.spec_patterns = [
            "spec*",
            "*spec*",
            "requirements*",
            "*requirements*",
            "design*",
            "*design*",
            "proposal*",
            "*proposal*",
            "rfc*",
            "*rfc*"
        ]
        self.spec_directories = [
            "spec",
            "specs",
            "documents",
            "docs/spec",
            "design",
            "proposals",
            "requirements"
        ]

    def find_spec_documents(self) -> list[SpecDocInfo]:
        """Find specification documents in the repository."""
        spec_docs = []

        for root, dirs, files in os.walk(self.repo_path):
            root_path = Path(root)

            # Skip git and node_modules
            if any(skip in root_path.parts for skip in ['.git', 'node_modules', '__pycache__']):
                continue

            # Check if we're in a spec directory
            in_spec_dir = any(spec_dir in str(root_path).lower() for spec_dir in self.spec_directories)

            # Check files
            for file_name in files:
                if file_name.endswith(('.md', '.txt', '.rst', '.adoc')):
                    file_path = root_path / file_name
                    if self._is_spec_document(file_name, file_path) or in_spec_dir:
                        spec_info = self._analyze_spec_document(file_path)
                        spec_docs.append(spec_info)

        return spec_docs

    def _is_spec_document(self, file_name: str, file_path: Path) -> bool:
        """Check if file appears to be a specification document."""
        name_lower = file_name.lower()

        # Check patterns
        import fnmatch
        for pattern in self.spec_patterns:
            if fnmatch.fnmatch(name_lower, pattern):
                return True

        # Check content for spec-like keywords
        try:
            with open(file_path, encoding='utf-8', errors='ignore') as f:
                content = f.read(1000).lower()  # Read first 1000 chars
                spec_keywords = [
                    'specification', 'requirements', 'design', 'proposal',
                    'architecture', 'technical spec', 'rfc', 'feature request'
                ]
                if any(keyword in content for keyword in spec_keywords):
                    return True
        except (OSError, UnicodeDecodeError):
            pass

        return False

    def _analyze_spec_document(self, file_path: Path) -> SpecDocInfo:
        """Analyze a specification document."""
        try:
            stat = file_path.stat()
            size = stat.st_size
            modified_time = datetime.fromtimestamp(stat.st_mtime)
        except (OSError, FileNotFoundError):
            size = 0
            modified_time = datetime.now()

        # Read and analyze content
        title = "Unknown"
        word_count = 0
        status = "unknown"
        completeness = 0.0
        references = []

        try:
            with open(file_path, encoding='utf-8', errors='ignore') as f:
                content = f.read()
                title = self._extract_title(content)
                word_count = len(content.split())
                status = self._determine_status(content, file_path)
                completeness = self._assess_completeness(content)
                references = self._extract_references(content)
        except (OSError, UnicodeDecodeError):
            pass

        is_linked = self._check_if_linked(file_path)
        recommendation = self._get_recommendation(status, completeness, is_linked, modified_time)

        return SpecDocInfo(
            path=str(file_path.relative_to(self.repo_path)),
            title=title,
            status=status,
            size=size,
            modified_time=modified_time.isoformat(),
            word_count=word_count,
            completeness=completeness,
            references=references,
            is_linked=is_linked,
            recommendation=recommendation
        )

    def _extract_title(self, content: str) -> str:
        """Extract title from document content."""
        lines = content.split('\n')

        # Look for markdown title
        for line in lines[:10]:
            line = line.strip()
            if line.startswith('# '):
                return line[2:].strip()
            elif line.startswith('=') and len(line) > 3:
                # RST style title (previous line)
                prev_idx = lines.index(line) - 1
                if prev_idx >= 0:
                    return lines[prev_idx].strip()

        # Fallback to first non-empty line
        for line in lines[:5]:
            line = line.strip()
            if line and not line.startswith('#') and len(line) < 100:
                return line

        return "Unknown Title"

    def _determine_status(self, content: str, file_path: Path) -> str:
        """Determine the status of the specification."""
        content_lower = content.lower()
        path_lower = str(file_path).lower()

        # Check for status indicators in content
        status_patterns = {
            'draft': ['status: draft', 'draft', 'work in progress', 'wip', 'todo'],
            'active': ['status: active', 'status: in progress', 'active', 'current'],
            'completed': ['status: completed', 'status: done', 'completed', 'implemented', 'finished'],
            'obsolete': ['status: obsolete', 'deprecated', 'obsolete', 'superseded', 'archived']
        }

        for status, patterns in status_patterns.items():
            if any(pattern in content_lower for pattern in patterns):
                return status

        # Check path for status indicators
        if 'archive' in path_lower or 'old' in path_lower:
            return 'obsolete'
        elif 'draft' in path_lower:
            return 'draft'

        # Default based on content completeness
        if len(content.split()) < 100:
            return 'draft'
        else:
            return 'active'

    def _assess_completeness(self, content: str) -> float:
        """Assess the completeness of the specification."""
        # Basic completeness indicators
        indicators = {
            'has_title': bool(re.search(r'^#\s+', content, re.MULTILINE)),
            'has_sections': len(re.findall(r'^#{2,}\s+', content, re.MULTILINE)) >= 3,
            'has_details': len(content.split()) > 200,
            'has_code_examples': '```' in content or '`' in content,
            'has_todos': content.lower().count('todo') < 3,  # Fewer TODOs is better
            'has_references': '[' in content and ']' in content
        }

        score = sum(indicators.values()) / len(indicators)
        return min(1.0, score)

    def _extract_references(self, content: str) -> list[str]:
        """Extract references to other documents or code."""
        references = []

        # Find markdown links
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        for match in re.finditer(link_pattern, content):
            ref_text, ref_url = match.groups()
            if not ref_url.startswith(('http', 'mailto')):
                references.append(ref_url)

        # Find file references
        file_pattern = r'`([^`]+\.(py|ts|js|md|yaml|json))`'
        for match in re.finditer(file_pattern, content):
            references.append(match.group(1))

        return list(set(references))  # Remove duplicates

    def _check_if_linked(self, file_path: Path) -> bool:
        """Check if specification is linked from other documents."""
        relative_path = file_path.relative_to(self.repo_path)

        # Search for references in other markdown files
        for root, dirs, files in os.walk(self.repo_path):
            if '.git' in Path(root).parts:
                continue

            for file_name in files:
                if file_name.endswith('.md') and file_name != file_path.name:
                    other_file = Path(root) / file_name
                    try:
                        with open(other_file, encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            if str(relative_path) in content or file_path.name in content:
                                return True
                    except (OSError, UnicodeDecodeError):
                        continue

        return False

    def _get_recommendation(self, status: str, completeness: float, is_linked: bool, modified_time: datetime) -> str:
        """Get recommendation for the specification."""
        age_days = (datetime.now() - modified_time).days

        if status == 'obsolete':
            return "Archive - marked as obsolete"

        if status == 'completed' and not is_linked and age_days > 180:
            return "Archive - completed and old"

        if status == 'draft' and completeness < 0.3 and age_days > 90:
            return "Remove - incomplete draft, abandoned"

        if not is_linked and age_days > 365:
            return "Archive - very old and not referenced"

        if status == 'active' and is_linked:
            return "Keep - active and referenced"

        if completeness > 0.7:
            return "Keep - well-developed specification"

        return "Review - requires manual assessment"

    def generate_analysis_report(self, spec_docs: list[SpecDocInfo]) -> str:
        """Generate specification analysis report."""
        # Group by recommendation
        by_recommendation = {}
        for doc in spec_docs:
            rec = doc.recommendation.split(' - ')[0]  # Get action part
            if rec not in by_recommendation:
                by_recommendation[rec] = []
            by_recommendation[rec].append(doc)

        total_size = sum(doc.size for doc in spec_docs)

        report_lines = [
            "# Specification Documents Analysis Report",
            f"Generated: {datetime.now().isoformat()}",
            f"Repository: {self.repo_path}",
            "",
            "## Summary",
            f"- Total specification documents: {len(spec_docs)}",
            f"- Total size: {self._format_size(total_size)}",
            ""
        ]

        # Status distribution
        by_status = {}
        for doc in spec_docs:
            status = doc.status
            if status not in by_status:
                by_status[status] = []
            by_status[status].append(doc)

        report_lines.extend(["### By Status", ""])
        for status, docs in by_status.items():
            status_size = sum(d.size for d in docs)
            avg_completeness = sum(d.completeness for d in docs) / len(docs) if docs else 0
            report_lines.append(f"- **{status.title()}**: {len(docs)} docs, "
                              f"{self._format_size(status_size)}, "
                              f"{avg_completeness:.1%} avg completeness")

        report_lines.extend(["", "## Recommendations", ""])

        # Recommendations
        for action, docs in by_recommendation.items():
            if not docs:
                continue

            action_size = sum(d.size for d in docs)
            report_lines.extend([
                f"### {action} ({len(docs)} documents)",
                f"Total size: {self._format_size(action_size)}",
                ""
            ])

            for doc in sorted(docs, key=lambda x: x.size, reverse=True)[:10]:
                linked_str = " (linked)" if doc.is_linked else ""
                report_lines.append(f"- **{doc.title}**{linked_str}")
                report_lines.append(f"  - Path: {doc.path}")
                report_lines.append(f"  - Status: {doc.status}, Completeness: {doc.completeness:.1%}")
                report_lines.append(f"  - Reason: {doc.recommendation}")
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

    parser = argparse.ArgumentParser(description="Specification Document Analyzer")
    parser.add_argument("--output", help="Output file for analysis report")
    parser.add_argument("--json", help="Export analysis data to JSON file")
    parser.add_argument("--summary", action="store_true", help="Show only summary")

    args = parser.parse_args()

    analyzer = SpecAnalyzer()
    spec_docs = analyzer.find_spec_documents()

    if args.summary:
        keep = len([d for d in spec_docs if d.recommendation.startswith("Keep")])
        archive = len([d for d in spec_docs if d.recommendation.startswith("Archive")])
        remove = len([d for d in spec_docs if d.recommendation.startswith("Remove")])
        review = len([d for d in spec_docs if d.recommendation.startswith("Review")])

        print(f"📊 Found {len(spec_docs)} specification documents")
        print(f"✅ Keep: {keep}")
        print(f"📦 Archive: {archive}")
        print(f"🗑️  Remove: {remove}")
        print(f"🔍 Review: {review}")
    else:
        report = analyzer.generate_analysis_report(spec_docs)
        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"📄 Analysis report saved to: {args.output}")
        else:
            print(report)

    if args.json:
        data = {
            "timestamp": datetime.now().isoformat(),
            "repository": str(analyzer.repo_path),
            "specifications": [asdict(doc) for doc in spec_docs]
        }
        with open(args.json, "w") as f:
            json.dump(data, f, indent=2, default=str)
        print(f"📊 Analysis data exported to: {args.json}")


if __name__ == "__main__":
    main()
