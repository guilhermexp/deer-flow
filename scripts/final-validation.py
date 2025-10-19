#!/usr/bin/env python3
"""
Final Repository Validation Script
Performs comprehensive validation after cleanup operations.
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


class FinalValidator:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        self.validation_checks = [
            ("Repository Structure", self._validate_structure),
            ("Critical Files", self._validate_critical_files),
            ("Python Environment", self._validate_python_env),
            ("Frontend Environment", self._validate_frontend_env),
            ("Configuration Files", self._validate_config),
            ("Import System", self._validate_imports),
            ("Basic Functionality", self._validate_functionality),
            ("Git Repository", self._validate_git_status),
            ("Cleanup Artifacts", self._validate_cleanup_artifacts)
        ]

    def run_final_validation(self) -> dict[str, Any]:
        """Run comprehensive final validation."""
        print("🔍 Running final repository validation...")
        print("=" * 70)

        results = {
            "timestamp": datetime.now().isoformat(),
            "repository": str(self.repo_path),
            "validation_status": "unknown",
            "checks": {},
            "errors": [],
            "warnings": [],
            "critical_issues": [],
            "recommendations": []
        }

        passed = 0
        failed = 0
        critical_failed = 0

        for check_name, check_func in self.validation_checks:
            print(f"\n🔍 Validating {check_name}...")
            try:
                check_result = check_func()
                results["checks"][check_name] = check_result

                if check_result["status"] == "pass":
                    print(f"✅ {check_name}: PASS")
                    passed += 1
                elif check_result["status"] == "fail":
                    print(f"❌ {check_name}: FAIL - {check_result.get('message', 'Unknown error')}")
                    failed += 1

                    if check_result.get("critical", False):
                        critical_failed += 1
                        results["critical_issues"].append(f"{check_name}: {check_result.get('message', 'Failed')}")
                    else:
                        results["errors"].append(f"{check_name}: {check_result.get('message', 'Failed')}")
                else:
                    print(f"⚠️  {check_name}: WARNING - {check_result.get('message', 'Unknown warning')}")
                    results["warnings"].append(f"{check_name}: {check_result.get('message', 'Warning')}")

                if check_result.get("recommendations"):
                    results["recommendations"].extend(check_result["recommendations"])

            except Exception as e:
                print(f"❌ {check_name}: ERROR - {e}")
                results["errors"].append(f"{check_name}: {e}")
                failed += 1

        # Determine overall validation status
        if critical_failed > 0:
            results["validation_status"] = "critical_failure"
        elif failed == 0:
            results["validation_status"] = "passed"
        elif failed < len(self.validation_checks) / 2:
            results["validation_status"] = "passed_with_warnings"
        else:
            results["validation_status"] = "failed"

        self._display_validation_summary(results, passed, failed, critical_failed)
        return results

    def _validate_structure(self) -> dict[str, Any]:
        """Validate repository structure integrity."""
        essential_dirs = [
            "src",
            "src/agents",
            "src/graph",
            "src/llms",
            "src/tools",
            "web",
            "web/src",
            "tests"
        ]

        missing_dirs = []
        present_dirs = []

        for dir_path in essential_dirs:
            full_path = self.repo_path / dir_path
            if full_path.exists() and full_path.is_dir():
                present_dirs.append(dir_path)
            else:
                missing_dirs.append(dir_path)

        if missing_dirs:
            return {
                "status": "fail",
                "critical": True,
                "message": f"Missing essential directories: {', '.join(missing_dirs)}",
                "details": {"missing": missing_dirs, "present": present_dirs}
            }

        return {
            "status": "pass",
            "message": "Repository structure is intact",
            "details": {"directories_checked": len(essential_dirs)}
        }

    def _validate_critical_files(self) -> dict[str, Any]:
        """Validate critical files are present."""
        critical_files = {
            "pyproject.toml": True,
            "main.py": True,
            "server.py": True,
            "web/package.json": True,
            "web/next.config.js": False,
            "CLAUDE.md": False,
            ".env.example": False
        }

        missing_critical = []
        missing_optional = []
        present_files = []

        for file_path, is_critical in critical_files.items():
            full_path = self.repo_path / file_path
            if full_path.exists():
                present_files.append(file_path)
            else:
                if is_critical:
                    missing_critical.append(file_path)
                else:
                    missing_optional.append(file_path)

        if missing_critical:
            return {
                "status": "fail",
                "critical": True,
                "message": f"Missing critical files: {', '.join(missing_critical)}",
                "details": {
                    "missing_critical": missing_critical,
                    "missing_optional": missing_optional,
                    "present": present_files
                }
            }

        if missing_optional:
            return {
                "status": "warning",
                "message": f"Missing optional files: {', '.join(missing_optional)}",
                "details": {"missing_optional": missing_optional, "present": present_files}
            }

        return {
            "status": "pass",
            "message": "All critical files are present",
            "details": {"files_checked": len(critical_files)}
        }

    def _validate_python_env(self) -> dict[str, Any]:
        """Validate Python environment and dependencies."""
        try:
            # Check uv is available
            result = subprocess.run(["uv", "--version"], capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                return {
                    "status": "fail",
                    "critical": True,
                    "message": "uv package manager not available",
                    "recommendations": ["Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"]
                }

            # Check dependencies sync
            result = subprocess.run(
                ["uv", "sync", "--check"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                return {"status": "pass", "message": "Python environment is properly configured"}
            else:
                return {
                    "status": "fail",
                    "message": "Python dependencies are out of sync",
                    "details": {"stderr": result.stderr},
                    "recommendations": ["Run: uv sync"]
                }

        except subprocess.TimeoutExpired:
            return {"status": "warning", "message": "Python environment check timed out"}
        except FileNotFoundError:
            return {
                "status": "fail",
                "critical": True,
                "message": "uv not found in PATH",
                "recommendations": ["Install uv package manager"]
            }
        except Exception as e:
            return {"status": "fail", "message": f"Python environment validation failed: {e}"}

    def _validate_frontend_env(self) -> dict[str, Any]:
        """Validate frontend environment."""
        web_dir = self.repo_path / "web"
        if not web_dir.exists():
            return {"status": "pass", "message": "No frontend directory to validate"}

        try:
            # Check if node_modules exists
            node_modules = web_dir / "node_modules"
            if not node_modules.exists():
                return {
                    "status": "fail",
                    "message": "Frontend dependencies not installed",
                    "recommendations": ["Run: cd web && pnpm install"]
                }

            return {"status": "pass", "message": "Frontend environment is configured"}

        except Exception as e:
            return {"status": "warning", "message": f"Frontend validation failed: {e}"}

    def _validate_config(self) -> dict[str, Any]:
        """Validate configuration files."""
        try:
            # Check pyproject.toml syntax
            import tomllib
            pyproject_path = self.repo_path / "pyproject.toml"

            if pyproject_path.exists():
                with open(pyproject_path, 'rb') as f:
                    tomllib.load(f)

            # Check package.json syntax
            package_json = self.repo_path / "web" / "package.json"
            if package_json.exists():
                with open(package_json) as f:
                    json.load(f)

            return {"status": "pass", "message": "Configuration files are valid"}

        except Exception as e:
            return {
                "status": "fail",
                "message": f"Configuration file validation failed: {e}",
                "recommendations": ["Check syntax of configuration files"]
            }

    def _validate_imports(self) -> dict[str, Any]:
        """Validate critical imports work."""
        critical_imports = [
            "src.graph.coordinator",
            "src.agents.planner",
            "src.llms.llm"
        ]

        failed_imports = []

        for module_name in critical_imports:
            try:
                result = subprocess.run(
                    ["uv", "run", "python", "-c", f"import {module_name}"],
                    cwd=self.repo_path,
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                if result.returncode != 0:
                    failed_imports.append(module_name)

            except (subprocess.TimeoutExpired, Exception):
                failed_imports.append(module_name)

        if failed_imports:
            return {
                "status": "fail",
                "critical": True,
                "message": f"Critical imports failed: {', '.join(failed_imports)}",
                "details": {"failed_imports": failed_imports},
                "recommendations": ["Check for missing dependencies", "Run: uv sync"]
            }

        return {"status": "pass", "message": "All critical modules can be imported"}

    def _validate_functionality(self) -> dict[str, Any]:
        """Validate basic application functionality."""
        try:
            # Test main.py can be executed
            result = subprocess.run(
                ["uv", "run", "python", "main.py", "--help"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=15
            )

            if result.returncode == 0:
                return {"status": "pass", "message": "Application can be executed successfully"}
            else:
                return {
                    "status": "fail",
                    "critical": True,
                    "message": "Main application failed to execute",
                    "details": {"stderr": result.stderr}
                }

        except subprocess.TimeoutExpired:
            return {"status": "warning", "message": "Functionality test timed out"}
        except Exception as e:
            return {"status": "fail", "message": f"Functionality validation failed: {e}"}

    def _validate_git_status(self) -> dict[str, Any]:
        """Validate git repository status."""
        try:
            # Check if we're in a git repository
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode != 0:
                return {"status": "warning", "message": "Not a git repository or git not available"}

            # Check for uncommitted changes
            output = result.stdout.strip()
            if output:
                lines = output.split('\n')
                return {
                    "status": "warning",
                    "message": f"Repository has {len(lines)} uncommitted changes",
                    "recommendations": ["Commit or stash changes before deployment"]
                }

            return {"status": "pass", "message": "Git repository is clean"}

        except subprocess.TimeoutExpired:
            return {"status": "warning", "message": "Git status check timed out"}
        except Exception as e:
            return {"status": "warning", "message": f"Git validation failed: {e}"}

    def _validate_cleanup_artifacts(self) -> dict[str, Any]:
        """Check for cleanup artifacts and verify cleanup was successful."""
        try:
            # Check for common cleanup artifacts
            artifacts = []

            # Python cache files
            for cache_dir in self.repo_path.rglob("__pycache__"):
                artifacts.append(str(cache_dir.relative_to(self.repo_path)))

            # Temporary files
            for temp_file in self.repo_path.rglob("*.tmp"):
                artifacts.append(str(temp_file.relative_to(self.repo_path)))

            # Check if reports directory exists (cleanup scripts create this)
            reports_dir = self.repo_path / "reports"
            reports_exist = reports_dir.exists()

            # Check if backups directory exists
            backups_dir = self.repo_path / "backups"
            backups_exist = backups_dir.exists()

            if artifacts:
                return {
                    "status": "warning",
                    "message": f"Found {len(artifacts)} cleanup artifacts",
                    "details": {"artifacts": artifacts[:10]},  # Show first 10
                    "recommendations": ["Run cleanup scripts to remove remaining artifacts"]
                }

            details = {
                "reports_directory": reports_exist,
                "backups_directory": backups_exist,
                "artifacts_found": len(artifacts)
            }

            return {
                "status": "pass",
                "message": "Repository is clean of temporary artifacts",
                "details": details
            }

        except Exception as e:
            return {"status": "warning", "message": f"Cleanup artifacts validation failed: {e}"}

    def _display_validation_summary(self, results: dict[str, Any], passed: int, failed: int, critical_failed: int) -> None:
        """Display validation summary."""
        status = results["validation_status"]
        status_emoji = {
            "passed": "✅",
            "passed_with_warnings": "⚠️ ",
            "failed": "❌",
            "critical_failure": "🚨"
        }

        print("\n" + "=" * 70)
        print(f"🔍 FINAL VALIDATION SUMMARY - {status_emoji.get(status, '❓')} {status.upper().replace('_', ' ')}")
        print("=" * 70)
        print(f"Checks passed: {passed}")
        print(f"Checks failed: {failed}")
        print(f"Critical failures: {critical_failed}")
        print(f"Total checks: {len(self.validation_checks)}")

        if results["critical_issues"]:
            print(f"\n🚨 CRITICAL ISSUES ({len(results['critical_issues'])}):")
            for issue in results["critical_issues"]:
                print(f"  • {issue}")

        if results["errors"]:
            print(f"\n❌ ERRORS ({len(results['errors'])}):")
            for error in results["errors"]:
                print(f"  • {error}")

        if results["warnings"]:
            print(f"\n⚠️  WARNINGS ({len(results['warnings'])}):")
            for warning in results["warnings"]:
                print(f"  • {warning}")

        if results["recommendations"]:
            print("\n💡 RECOMMENDATIONS:")
            for rec in set(results["recommendations"]):
                print(f"  • {rec}")

    def export_validation_results(self, results: dict[str, Any], output_file: str) -> None:
        """Export validation results to file."""
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2, default=str)
        print(f"📄 Validation results saved to: {output_file}")


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Final Repository Validation")
    parser.add_argument("--output", help="Output file for validation results")
    parser.add_argument("--exit-code", action="store_true", help="Exit with status code based on validation result")

    args = parser.parse_args()

    validator = FinalValidator()
    results = validator.run_final_validation()

    if args.output:
        validator.export_validation_results(results, args.output)

    # Exit with appropriate code if requested
    if args.exit_code:
        if results["validation_status"] == "passed":
            sys.exit(0)
        elif results["validation_status"] == "passed_with_warnings":
            sys.exit(1)
        elif results["validation_status"] == "failed":
            sys.exit(2)
        else:  # critical_failure
            sys.exit(3)


if __name__ == "__main__":
    main()
