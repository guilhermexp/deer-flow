#!/usr/bin/env python3
"""
Repository Analysis Script - Task 1.1.1
Generates complete inventory with file sizes, categories, and modification dates.
"""

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any


class RepositoryAnalyzer:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path).resolve()
        self.file_inventory = []
        self.dir_inventory = []
        self.total_size = 0

    def scan_repository(self):
        """Scan entire repository and collect file information."""
        print(f"🔍 Scanning repository: {self.root_path}")

        # Skip certain directories for efficiency and safety
        skip_dirs = {
            '.git', '__pycache__', 'node_modules', '.next', 'dist', 'build',
            '.venv', 'venv', 'env', '.pytest_cache', '.coverage'
        }

        for root, dirs, files in os.walk(self.root_path):
            # Filter out skip directories
            dirs[:] = [d for d in dirs if d not in skip_dirs]

            root_path = Path(root)

            # Process directories
            for dir_name in dirs:
                dir_path = root_path / dir_name
                try:
                    stat = dir_path.stat()
                    self.dir_inventory.append({
                        'path': str(dir_path.relative_to(self.root_path)),
                        'name': dir_name,
                        'size': 0,
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'type': 'directory'
                    })
                except (OSError, PermissionError) as e:
                    print(f"⚠️  Cannot access directory {dir_path}: {e}")

            # Process files
            for file_name in files:
                file_path = root_path / file_name
                try:
                    stat = file_path.stat()
                    relative_path = str(file_path.relative_to(self.root_path))

                    file_info = {
                        'path': relative_path,
                        'name': file_name,
                        'size': stat.st_size,
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'extension': file_path.suffix.lower(),
                        'type': 'file'
                    }

                    # Calculate file hash for small files (helps identify duplicates)
                    if stat.st_size < 10 * 1024 * 1024:  # Files smaller than 10MB
                        try:
                            with open(file_path, 'rb') as f:
                                file_hash = hashlib.md5(f.read()).hexdigest()[:8]
                                file_info['hash'] = file_hash
                        except (OSError, PermissionError):
                            file_info['hash'] = None
                    else:
                        file_info['hash'] = None

                    self.file_inventory.append(file_info)
                    self.total_size += stat.st_size

                except (OSError, PermissionError) as e:
                    print(f"⚠️  Cannot access file {file_path}: {e}")

    def categorize_files(self):
        """Basic categorization of files."""
        categories = {
            'screenshots': [],
            'config': [],
            'temp': [],
            'logs': [],
            'cache': [],
            'docs': [],
            'code': [],
            'tests': [],
            'build': [],
            'env': [],
            'data': [],
            'other': []
        }

        for file_info in self.file_inventory:
            path = file_info['path']
            name = file_info['name'].lower()
            ext = file_info['extension']

            if 'screenshot' in name or path.startswith('screenshots'):
                categories['screenshots'].append(file_info)
            elif name.endswith(('.env', '.env.example', '.env.local')):
                categories['env'].append(file_info)
            elif name.endswith(('.log', '.tmp')) or 'debug' in name:
                categories['logs'].append(file_info)
            elif path.endswith(('__pycache__', '.pytest_cache')) or name.endswith(('.pyc', '.pyo')):
                categories['cache'].append(file_info)
            elif name.endswith(('.md', '.txt', '.rst', '.pdf')):
                categories['docs'].append(file_info)
            elif ext in ('.py', '.js', '.ts', '.tsx', '.jsx', '.yaml', '.yml', '.json'):
                categories['code'].append(file_info)
            elif 'test' in name or path.startswith('tests/'):
                categories['tests'].append(file_info)
            elif path.endswith(('/node_modules', '/dist', '/build', '/.next')):
                categories['build'].append(file_info)
            elif ext in ('.db', '.sqlite', '.json', '.csv', '.data'):
                categories['data'].append(file_info)
            elif name in ('makefile', 'dockerfile', 'license', 'contributing'):
                categories['config'].append(file_info)
            else:
                categories['other'].append(file_info)

        return categories

    def generate_report(self) -> dict[str, Any]:
        """Generate comprehensive analysis report."""
        categories = self.categorize_files()

        # Calculate category statistics
        category_stats = {}
        for cat_name, files in categories.items():
            total_size = sum(f['size'] for f in files)
            category_stats[cat_name] = {
                'count': len(files),
                'size_bytes': total_size,
                'size_mb': round(total_size / (1024 * 1024), 2),
                'files': files
            }

        # Identify large files (>1MB)
        large_files = [f for f in self.file_inventory if f['size'] > 1024 * 1024]
        large_files.sort(key=lambda x: x['size'], reverse=True)

        # Identify recently modified files (last 7 days)
        recent_cutoff = datetime.now().timestamp() - (7 * 24 * 60 * 60)
        recent_files = [
            f for f in self.file_inventory
            if datetime.fromisoformat(f['modified']).timestamp() > recent_cutoff
        ]

        report = {
            'scan_timestamp': datetime.now().isoformat(),
            'repository_root': str(self.root_path),
            'summary': {
                'total_files': len(self.file_inventory),
                'total_directories': len(self.dir_inventory),
                'total_size_bytes': self.total_size,
                'total_size_mb': round(self.total_size / (1024 * 1024), 2),
                'total_size_gb': round(self.total_size / (1024 * 1024 * 1024), 2)
            },
            'categories': category_stats,
            'large_files': large_files[:20],  # Top 20 largest files
            'recent_files': recent_files[:20],  # Top 20 most recent files
            'file_inventory': self.file_inventory,
            'directory_inventory': self.dir_inventory
        }

        return report

    def save_report(self, output_path: str = "reports/repo-analysis.json"):
        """Save analysis report to JSON file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        report = self.generate_report()

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"✅ Analysis report saved to: {output_path}")

        # Print summary
        summary = report['summary']
        print("\n📊 Repository Analysis Summary:")
        print(f"   Total files: {summary['total_files']:,}")
        print(f"   Total directories: {summary['total_directories']:,}")
        print(f"   Total size: {summary['total_size_mb']:.2f} MB ({summary['total_size_gb']:.2f} GB)")

        print("\n📁 File Categories:")
        for cat_name, stats in report['categories'].items():
            if stats['count'] > 0:
                print(f"   {cat_name}: {stats['count']} files, {stats['size_mb']:.2f} MB")

        return report

def main():
    """Main execution function."""
    print("🚀 Repository Analysis Started - Task 1.1.1")
    print("=" * 60)

    analyzer = RepositoryAnalyzer()
    analyzer.scan_repository()
    report = analyzer.save_report()

    print("\n🎯 Repository Analysis Complete!")
    print("📝 Report available at: reports/repo-analysis.json")

    return report

if __name__ == "__main__":
    main()
