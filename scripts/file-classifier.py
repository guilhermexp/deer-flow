#!/usr/bin/env python3
"""
File Classification Script - Task 1.1.2
Classifies files into categories (screenshot, config, temp, mock, spec, cache) with importance levels.
"""

import json
import os
import re
from datetime import datetime, timedelta
from enum import Enum
from typing import Any


class FileCategory(Enum):
    """File categories for cleanup classification."""
    SCREENSHOT = 'screenshot'
    CONFIG = 'config'
    TEMPORARY = 'temporary'
    MOCK_DATA = 'mock_data'
    SPEC = 'spec'
    CACHE = 'cache'
    DOCUMENTATION = 'documentation'
    CODE = 'code'
    TEST = 'test'
    BUILD = 'build'
    DATA = 'data'
    OTHER = 'other'

class ImportanceLevel(Enum):
    """Importance levels for cleanup decisions."""
    CRITICAL = 'critical'        # Never remove
    IMPORTANT = 'important'      # Remove only with confirmation
    OPTIONAL = 'optional'        # Safe to remove
    OBSOLETE = 'obsolete'        # Should be removed

class FileClassifier:
    """
    Classifies files for repository cleanup based on patterns, content, and metadata.
    """

    def __init__(self, repo_analysis_path: str = "reports/repo-analysis.json"):
        self.repo_analysis_path = repo_analysis_path
        self.file_inventory = []
        self.classification_rules = self._load_classification_rules()

    def _load_classification_rules(self) -> dict[str, Any]:
        """Load classification rules for different file types."""
        return {
            'screenshot_patterns': [
                r'screenshot.*',
                r'.*-screenshot.*',
                r'.*\.png$',
                r'.*\.jpg$',
                r'.*\.jpeg$',
                r'.*\.gif$'
            ],
            'config_patterns': [
                r'.*\.env.*',
                r'.*config.*',
                r'.*\.yaml$',
                r'.*\.yml$',
                r'.*\.toml$',
                r'.*\.ini$',
                r'makefile.*',
                r'dockerfile.*',
                r'.*\.conf$'
            ],
            'temporary_patterns': [
                r'.*\.log$',
                r'.*\.tmp$',
                r'.*\.temp$',
                r'.*debug.*',
                r'.*\.bak$',
                r'.*\.backup$',
                r'.*~$'
            ],
            'mock_patterns': [
                r'.*mock.*',
                r'.*replay.*',
                r'.*fixture.*',
                r'.*sample.*',
                r'.*dummy.*'
            ],
            'spec_patterns': [
                r'spec.*',
                r'.*spec.*',
                r'.*specification.*',
                r'.*requirements.*',
                r'.*design.*'
            ],
            'cache_patterns': [
                r'__pycache__.*',
                r'.*\.pyc$',
                r'.*\.pyo$',
                r'\.pytest_cache.*',
                r'\.coverage$',
                r'node_modules.*',
                r'\.next.*',
                r'dist.*',
                r'build.*'
            ]
        }

    def load_file_inventory(self):
        """Load file inventory from repository analysis."""
        if not os.path.exists(self.repo_analysis_path):
            raise FileNotFoundError(f"Repository analysis not found: {self.repo_analysis_path}")

        with open(self.repo_analysis_path, encoding='utf-8') as f:
            analysis_data = json.load(f)

        self.file_inventory = analysis_data.get('file_inventory', [])
        print(f"📂 Loaded {len(self.file_inventory)} files from inventory")

    def classify_file(self, file_info: dict[str, Any]) -> dict[str, Any]:
        """
        Classify a single file based on its attributes.

        Args:
            file_info: File information from repository analysis

        Returns:
            Classification result with category, importance, and reasoning
        """
        path = file_info['path'].lower()
        name = file_info['name'].lower()
        extension = file_info.get('extension', '').lower()
        size = file_info.get('size', 0)
        modified = file_info.get('modified', '')

        # Initialize classification result
        result = {
            'file_info': file_info,
            'category': FileCategory.OTHER.value,
            'importance': ImportanceLevel.OPTIONAL.value.value,
            'can_remove': False,
            'reason': '',
            'cleanup_action': 'keep',
            'confidence': 0.0
        }

        # Screenshot classification
        if self._matches_patterns(path, self.classification_rules['screenshot_patterns']) or \
           self._matches_patterns(name, self.classification_rules['screenshot_patterns']) or \
           'screenshot' in path:
            result.update(self._classify_screenshot(file_info, path, name))

        # Configuration file classification
        elif self._matches_patterns(path, self.classification_rules['config_patterns']) or \
             self._matches_patterns(name, self.classification_rules['config_patterns']):
            result.update(self._classify_config(file_info, path, name))

        # Temporary file classification
        elif self._matches_patterns(path, self.classification_rules['temporary_patterns']) or \
             self._matches_patterns(name, self.classification_rules['temporary_patterns']):
            result.update(self._classify_temporary(file_info, path, name))

        # Mock data classification
        elif self._matches_patterns(path, self.classification_rules['mock_patterns']) or \
             self._matches_patterns(name, self.classification_rules['mock_patterns']):
            result.update(self._classify_mock_data(file_info, path, name))

        # Spec document classification
        elif self._matches_patterns(path, self.classification_rules['spec_patterns']) or \
             self._matches_patterns(name, self.classification_rules['spec_patterns']) or \
             path.startswith('spec/'):
            result.update(self._classify_spec(file_info, path, name))

        # Cache file classification
        elif self._matches_patterns(path, self.classification_rules['cache_patterns']) or \
             self._matches_patterns(name, self.classification_rules['cache_patterns']):
            result.update(self._classify_cache(file_info, path, name))

        # Other file types
        else:
            result.update(self._classify_other(file_info, path, name, extension))

        return result

    def _matches_patterns(self, text: str, patterns: list[str]) -> bool:
        """Check if text matches any of the given regex patterns."""
        return any(re.match(pattern, text, re.IGNORECASE) for pattern in patterns)

    def _classify_screenshot(self, file_info: dict, path: str, name: str) -> dict[str, Any]:
        """Classify screenshot files."""
        category = FileCategory.SCREENSHOT.value

        # Check if it's part of a test suite or documentation
        if 'test' in path or 'crud' in path:
            if 'screenshots-crud-test' in path:
                return {
                    'category': category,
                    'importance': ImportanceLevel.OBSOLETE.value.value,
                    'can_remove': True,
                    'reason': 'Obsolete test screenshots - newer versions available',
                    'cleanup_action': 'remove',
                    'confidence': 0.9
                }
            else:
                return {
                    'category': category,
                    'importance': ImportanceLevel.OPTIONAL.value.value,
                    'can_remove': True,
                    'reason': 'Test screenshots - verify if still needed',
                    'cleanup_action': 'review',
                    'confidence': 0.7
                }

        # Check for documentation screenshots
        if 'doc' in path or 'readme' in path:
            return {
                'category': category,
                'importance': ImportanceLevel.IMPORTANT.value.value,
                'can_remove': False,
                'reason': 'Documentation screenshots - keep for reference',
                'cleanup_action': 'keep',
                'confidence': 0.8
            }

        # Recent screenshots (last 30 days) are more important
        if self._is_recent_file(file_info.get('modified', ''), days=30):
            return {
                'category': category,
                'importance': ImportanceLevel.IMPORTANT.value.value,
                'can_remove': False,
                'reason': 'Recent screenshot - may be actively used',
                'cleanup_action': 'keep',
                'confidence': 0.7
            }

        return {
            'category': category,
            'importance': ImportanceLevel.OPTIONAL.value.value,
            'can_remove': True,
            'reason': 'Old screenshot - review for relevance',
            'cleanup_action': 'review',
            'confidence': 0.6
        }

    def _classify_config(self, file_info: dict, path: str, name: str) -> dict[str, Any]:
        """Classify configuration files."""
        category = FileCategory.CONFIG.value

        # Environment files need special handling
        if '.env' in name:
            if name == '.env.example':
                # Check for duplicates in different directories
                if 'web/' in path:
                    return {
                        'category': category,
                        'importance': ImportanceLevel.OPTIONAL.value.value,
                        'can_remove': True,
                        'reason': 'Duplicate .env.example - consolidate to root',
                        'cleanup_action': 'consolidate',
                        'confidence': 0.8
                    }
                else:
                    return {
                        'category': category,
                        'importance': ImportanceLevel.IMPORTANT.value.value,
                        'can_remove': False,
                        'reason': 'Main .env.example template',
                        'cleanup_action': 'keep',
                        'confidence': 0.9
                    }
            else:
                return {
                    'category': category,
                    'importance': ImportanceLevel.CRITICAL.value.value,
                    'can_remove': False,
                    'reason': 'Active environment configuration',
                    'cleanup_action': 'keep',
                    'confidence': 1.0
                }

        # Docker and build configurations
        if any(x in name for x in ['dockerfile', 'docker-compose', 'makefile']):
            return {
                'category': category,
                'importance': ImportanceLevel.IMPORTANT.value,
                'can_remove': False,
                'reason': 'Build/deployment configuration',
                'cleanup_action': 'keep',
                'confidence': 0.9
            }

        return {
            'category': category,
            'importance': ImportanceLevel.IMPORTANT.value,
            'can_remove': False,
            'reason': 'Configuration file - review before removal',
            'cleanup_action': 'review',
            'confidence': 0.7
        }

    def _classify_temporary(self, file_info: dict, path: str, name: str) -> dict[str, Any]:
        """Classify temporary files."""
        category = FileCategory.TEMPORARY.value

        # Log files
        if '.log' in name:
            if name == 'backend.log':
                return {
                    'category': category,
                    'importance': ImportanceLevel.OBSOLETE.value,
                    'can_remove': True,
                    'reason': 'Runtime log file - can be regenerated',
                    'cleanup_action': 'remove',
                    'confidence': 0.9
                }

        # Debug files
        if 'debug' in name:
            if name == 'debug-chat-output.txt':
                return {
                    'category': category,
                    'importance': ImportanceLevel.OBSOLETE.value,
                    'can_remove': True,
                    'reason': 'Debug output file - can be regenerated',
                    'cleanup_action': 'remove',
                    'confidence': 0.9
                }

        # Backup and temporary files
        if any(x in name for x in ['.tmp', '.temp', '.bak', '.backup', '~']):
            return {
                'category': category,
                'importance': ImportanceLevel.OBSOLETE.value,
                'can_remove': True,
                'reason': 'Temporary file - safe to remove',
                'cleanup_action': 'remove',
                'confidence': 0.9
            }

        return {
            'category': category,
            'importance': ImportanceLevel.OPTIONAL.value,
            'can_remove': True,
            'reason': 'Temporary file - review content before removal',
            'cleanup_action': 'review',
            'confidence': 0.7
        }

    def _classify_mock_data(self, file_info: dict, path: str, name: str) -> dict[str, Any]:
        """Classify mock data files."""
        category = FileCategory.MOCK_DATA

        # Check if in web/public (likely frontend mock data)
        if 'web/public' in path:
            return {
                'category': category,
                'importance': ImportanceLevel.OPTIONAL.value,
                'can_remove': True,
                'reason': 'Frontend mock data - verify if still needed for development',
                'cleanup_action': 'review',
                'confidence': 0.8
            }

        # Test fixtures and samples
        if any(x in path for x in ['test', 'fixture', 'sample']):
            return {
                'category': category,
                'importance': ImportanceLevel.IMPORTANT.value,
                'can_remove': False,
                'reason': 'Test mock data - may be needed for tests',
                'cleanup_action': 'keep',
                'confidence': 0.8
            }

        return {
            'category': category,
            'importance': ImportanceLevel.OPTIONAL.value,
            'can_remove': True,
            'reason': 'Mock data - review usage before removal',
            'cleanup_action': 'review',
            'confidence': 0.6
        }

    def _classify_spec(self, file_info: dict, path: str, name: str) -> dict[str, Any]:
        """Classify specification documents."""
        category = FileCategory.SPEC

        # Check for date patterns indicating old specs
        date_patterns = [
            r'.*-2024-.*',
            r'.*-2023-.*',
            r'.*-\d{4}-\d{2}-\d{2}.*'
        ]

        if any(re.search(pattern, path) for pattern in date_patterns):
            # Check if it's very old (more than 6 months)
            if self._is_old_file(file_info.get('modified', ''), days=180):
                return {
                    'category': category,
                    'importance': ImportanceLevel.OBSOLETE.value,
                    'can_remove': True,
                    'reason': 'Old dated spec document - likely completed or obsolete',
                    'cleanup_action': 'archive',
                    'confidence': 0.8
                }

        # Check for completion indicators
        if any(x in name for x in ['complete', 'done', 'finished', 'archived']):
            return {
                'category': category,
                'importance': ImportanceLevel.OPTIONAL.value,
                'can_remove': True,
                'reason': 'Completed specification - can be archived',
                'cleanup_action': 'archive',
                'confidence': 0.9
            }

        # Active or recent specs
        if self._is_recent_file(file_info.get('modified', ''), days=30):
            return {
                'category': category,
                'importance': ImportanceLevel.IMPORTANT.value,
                'can_remove': False,
                'reason': 'Recent specification - likely active',
                'cleanup_action': 'keep',
                'confidence': 0.8
            }

        return {
            'category': category,
            'importance': ImportanceLevel.IMPORTANT.value,
            'can_remove': False,
            'reason': 'Specification document - review status before removal',
            'cleanup_action': 'review',
            'confidence': 0.7
        }

    def _classify_cache(self, file_info: dict, path: str, name: str) -> dict[str, Any]:
        """Classify cache files."""
        category = FileCategory.CACHE

        # Python cache files
        if '__pycache__' in path or name.endswith(('.pyc', '.pyo')):
            return {
                'category': category,
                'importance': ImportanceLevel.OBSOLETE.value,
                'can_remove': True,
                'reason': 'Python cache file - can be regenerated',
                'cleanup_action': 'remove',
                'confidence': 1.0
            }

        # Test cache
        if '.pytest_cache' in path:
            return {
                'category': category,
                'importance': ImportanceLevel.OBSOLETE.value,
                'can_remove': True,
                'reason': 'Pytest cache - can be regenerated',
                'cleanup_action': 'remove',
                'confidence': 1.0
            }

        # Coverage files
        if name == '.coverage':
            return {
                'category': category,
                'importance': ImportanceLevel.OBSOLETE.value,
                'can_remove': True,
                'reason': 'Coverage data file - can be regenerated',
                'cleanup_action': 'remove',
                'confidence': 1.0
            }

        # Node.js and build artifacts
        if any(x in path for x in ['node_modules', '.next', 'dist', 'build']):
            return {
                'category': category,
                'importance': ImportanceLevel.OBSOLETE.value,
                'can_remove': True,
                'reason': 'Build artifact - can be regenerated',
                'cleanup_action': 'remove',
                'confidence': 1.0
            }

        return {
            'category': category,
            'importance': ImportanceLevel.OBSOLETE.value,
            'can_remove': True,
            'reason': 'Cache file - safe to remove',
            'cleanup_action': 'remove',
            'confidence': 0.9
        }

    def _classify_other(self, file_info: dict, path: str, name: str, extension: str) -> dict[str, Any]:
        """Classify other file types."""
        # Code files
        if extension in ['.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.scss']:
            return {
                'category': FileCategory.CODE,
                'importance': ImportanceLevel.CRITICAL.value,
                'can_remove': False,
                'reason': 'Source code file',
                'cleanup_action': 'keep',
                'confidence': 1.0
            }

        # Documentation
        if extension in ['.md', '.rst', '.txt'] and any(x in name for x in ['readme', 'doc', 'guide']):
            return {
                'category': FileCategory.DOCUMENTATION,
                'importance': ImportanceLevel.IMPORTANT.value,
                'can_remove': False,
                'reason': 'Documentation file',
                'cleanup_action': 'keep',
                'confidence': 0.9
            }

        # Test files
        if 'test' in path or 'test' in name:
            return {
                'category': FileCategory.TEST,
                'importance': ImportanceLevel.IMPORTANT.value,
                'can_remove': False,
                'reason': 'Test file',
                'cleanup_action': 'keep',
                'confidence': 0.9
            }

        return {
            'category': FileCategory.OTHER,
            'importance': ImportanceLevel.OPTIONAL.value,
            'can_remove': False,
            'reason': 'Unclassified file - review manually',
            'cleanup_action': 'review',
            'confidence': 0.5
        }

    def _is_recent_file(self, modified_date: str, days: int = 30) -> bool:
        """Check if file was modified within the specified number of days."""
        if not modified_date:
            return False

        try:
            file_date = datetime.fromisoformat(modified_date.replace('Z', '+00:00'))
            cutoff_date = datetime.now() - timedelta(days=days)
            return file_date > cutoff_date
        except (ValueError, TypeError):
            return False

    def _is_old_file(self, modified_date: str, days: int = 180) -> bool:
        """Check if file is older than the specified number of days."""
        if not modified_date:
            return True

        try:
            file_date = datetime.fromisoformat(modified_date.replace('Z', '+00:00'))
            cutoff_date = datetime.now() - timedelta(days=days)
            return file_date < cutoff_date
        except (ValueError, TypeError):
            return True

    def classify_all_files(self) -> list[dict[str, Any]]:
        """Classify all files in the inventory."""
        if not self.file_inventory:
            self.load_file_inventory()

        print(f"🔍 Classifying {len(self.file_inventory)} files...")

        classified_files = []
        for file_info in self.file_inventory:
            classification = self.classify_file(file_info)
            classified_files.append(classification)

        return classified_files

    def generate_classification_report(self, output_path: str = "reports/file-classification.json") -> dict[str, Any]:
        """Generate comprehensive classification report."""
        classified_files = self.classify_all_files()

        # Group by category and importance
        by_category = {}
        by_importance = {}
        by_action = {}

        for item in classified_files:
            category = item['category'].value
            importance = item['importance'].value
            action = item['cleanup_action']

            # Group by category
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(item)

            # Group by importance
            if importance not in by_importance:
                by_importance[importance] = []
            by_importance[importance].append(item)

            # Group by action
            if action not in by_action:
                by_action[action] = []
            by_action[action].append(item)

        # Calculate statistics
        total_files = len(classified_files)
        removable_files = len([f for f in classified_files if f['can_remove']])
        total_size = sum(f['file_info']['size'] for f in classified_files)
        removable_size = sum(f['file_info']['size'] for f in classified_files if f['can_remove'])

        report = {
            'classification_timestamp': datetime.now().isoformat(),
            'summary': {
                'total_files': total_files,
                'removable_files': removable_files,
                'retention_rate': round((total_files - removable_files) / total_files * 100, 2),
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'removable_size_mb': round(removable_size / (1024 * 1024), 2),
                'potential_savings_mb': round(removable_size / (1024 * 1024), 2)
            },
            'by_category': {cat: len(files) for cat, files in by_category.items()},
            'by_importance': {imp: len(files) for imp, files in by_importance.items()},
            'by_action': {action: len(files) for action, files in by_action.items()},
            'detailed_classification': classified_files
        }

        # Save report
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"✅ Classification report saved to: {output_path}")

        # Print summary
        print("\n📊 File Classification Summary:")
        print(f"   Total files classified: {total_files:,}")
        print(f"   Files eligible for removal: {removable_files:,}")
        print(f"   Potential space savings: {report['summary']['potential_savings_mb']:.2f} MB")

        print("\n📁 By Category:")
        for category, count in report['by_category'].items():
            print(f"   {category}: {count} files")

        print("\n⚡ By Action:")
        for action, count in report['by_action'].items():
            print(f"   {action}: {count} files")

        return report

def main():
    """Main execution function."""
    print("🚀 File Classification Started - Task 1.1.2")
    print("=" * 60)

    classifier = FileClassifier()

    try:
        report = classifier.generate_classification_report()
        print("\n🎯 File Classification Complete!")
        print("📝 Report available at: reports/file-classification.json")
        return report

    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print("💡 Run Task 1.1.1 (repo-analysis.py) first to generate the file inventory.")
        return None

if __name__ == "__main__":
    main()
