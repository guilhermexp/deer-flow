#!/usr/bin/env python3
"""
Application Health Check Script
Verifies that the application is functioning correctly after cleanup.
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


class HealthChecker:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        self.checks = [
            ("Python Environment", self._check_python_env),
            ("Backend Dependencies", self._check_backend_deps),
            ("Frontend Dependencies", self._check_frontend_deps),
            ("Configuration Files", self._check_config_files),
            ("Import System", self._check_imports),
            ("Basic Functionality", self._check_basic_functionality),
            ("Database Connectivity", self._check_database),
            ("API Endpoints", self._check_api_endpoints)
        ]

    def run_health_check(self) -> dict[str, Any]:
        """Run comprehensive health check."""
        print("🏥 Running application health check...")
        print("=" * 60)

        results = {
            "timestamp": datetime.now().isoformat(),
            "repository": str(self.repo_path),
            "overall_status": "unknown",
            "checks": {},
            "errors": [],
            "warnings": [],
            "recommendations": []
        }

        passed = 0
        failed = 0

        for check_name, check_func in self.checks:
            print(f"\n🔍 {check_name}...")
            try:
                check_result = check_func()
                results["checks"][check_name] = check_result

                if check_result["status"] == "pass":
                    print(f"✅ {check_name}: PASS")
                    passed += 1
                elif check_result["status"] == "fail":
                    print(f"❌ {check_name}: FAIL - {check_result.get('message', 'Unknown error')}")
                    failed += 1
                    results["errors"].append(f"{check_name}: {check_result.get('message', 'Failed')}")
                else:
                    print(f"⚠️  {check_name}: WARNING - {check_result.get('message', 'Unknown warning')}")
                    results["warnings"].append(f"{check_name}: {check_result.get('message', 'Warning')}")

                # Add recommendations if any
                if check_result.get("recommendations"):
                    results["recommendations"].extend(check_result["recommendations"])

            except Exception as e:
                print(f"❌ {check_name}: ERROR - {e}")
                results["errors"].append(f"{check_name}: {e}")
                failed += 1

        # Determine overall status
        if failed == 0:
            results["overall_status"] = "healthy"
        elif failed < len(self.checks) / 2:
            results["overall_status"] = "degraded"
        else:
            results["overall_status"] = "unhealthy"

        self._display_summary(results, passed, failed)
        return results

    def _check_python_env(self) -> dict[str, Any]:
        """Check Python environment and virtual environment."""
        try:
            # Check Python version
            python_version = sys.version_info
            if python_version < (3, 8):
                return {
                    "status": "fail",
                    "message": f"Python {python_version.major}.{python_version.minor} is too old (requires 3.8+)",
                    "details": {"python_version": str(python_version)}
                }

            # Check if uv is available
            try:
                result = subprocess.run(["uv", "--version"], capture_output=True, text=True, timeout=10)
                uv_available = result.returncode == 0
            except (subprocess.TimeoutExpired, FileNotFoundError):
                uv_available = False

            # Check pyproject.toml
            pyproject_path = self.repo_path / "pyproject.toml"
            has_pyproject = pyproject_path.exists()

            details = {
                "python_version": f"{python_version.major}.{python_version.minor}.{python_version.micro}",
                "uv_available": uv_available,
                "has_pyproject": has_pyproject
            }

            if not uv_available:
                return {
                    "status": "fail",
                    "message": "uv package manager not found",
                    "details": details,
                    "recommendations": ["Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"]
                }

            return {"status": "pass", "message": "Python environment is healthy", "details": details}

        except Exception as e:
            return {"status": "fail", "message": f"Python environment check failed: {e}"}

    def _check_backend_deps(self) -> dict[str, Any]:
        """Check backend dependencies."""
        try:
            # Check if we can run uv sync
            result = subprocess.run(
                ["uv", "sync", "--check"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                return {"status": "pass", "message": "Backend dependencies are in sync"}
            else:
                return {
                    "status": "fail",
                    "message": "Backend dependencies need updating",
                    "details": {"stderr": result.stderr},
                    "recommendations": ["Run: uv sync"]
                }

        except subprocess.TimeoutExpired:
            return {"status": "warning", "message": "Dependency check timed out"}
        except Exception as e:
            return {"status": "fail", "message": f"Backend dependency check failed: {e}"}

    def _check_frontend_deps(self) -> dict[str, Any]:
        """Check frontend dependencies."""
        web_dir = self.repo_path / "web"
        if not web_dir.exists():
            return {"status": "pass", "message": "No frontend directory found"}

        try:
            # Check if package.json exists
            package_json = web_dir / "package.json"
            if not package_json.exists():
                return {"status": "fail", "message": "package.json not found in web directory"}

            # Check if node_modules exists
            node_modules = web_dir / "node_modules"
            if not node_modules.exists():
                return {
                    "status": "fail",
                    "message": "node_modules not found",
                    "recommendations": ["Run: cd web && pnpm install"]
                }

            # Try to run pnpm list to check dependencies
            result = subprocess.run(
                ["pnpm", "list", "--depth=0"],
                cwd=web_dir,
                capture_output=True,
                text=True,
                timeout=15
            )

            if result.returncode == 0:
                return {"status": "pass", "message": "Frontend dependencies are healthy"}
            else:
                return {
                    "status": "warning",
                    "message": "Some frontend dependencies may have issues",
                    "recommendations": ["Run: cd web && pnpm install"]
                }

        except subprocess.TimeoutExpired:
            return {"status": "warning", "message": "Frontend dependency check timed out"}
        except FileNotFoundError:
            return {
                "status": "warning",
                "message": "pnpm not found",
                "recommendations": ["Install pnpm: npm install -g pnpm"]
            }
        except Exception as e:
            return {"status": "fail", "message": f"Frontend dependency check failed: {e}"}

    def _check_config_files(self) -> dict[str, Any]:
        """Check critical configuration files."""
        critical_files = {
            "pyproject.toml": "Python project configuration",
            "web/package.json": "Frontend package configuration",
            ".env.example": "Environment template",
            "CLAUDE.md": "Claude Code configuration"
        }

        missing_files = []
        found_files = []

        for file_path, description in critical_files.items():
            full_path = self.repo_path / file_path
            if full_path.exists():
                found_files.append((file_path, description))
            else:
                missing_files.append((file_path, description))

        if missing_files:
            missing_list = [f"{path} ({desc})" for path, desc in missing_files]
            return {
                "status": "warning",
                "message": f"Missing {len(missing_files)} configuration files",
                "details": {
                    "missing": missing_list,
                    "found": [f"{path} ({desc})" for path, desc in found_files]
                }
            }

        return {
            "status": "pass",
            "message": "All critical configuration files found",
            "details": {"found": [f"{path} ({desc})" for path, desc in found_files]}
        }

    def _check_imports(self) -> dict[str, Any]:
        """Check if critical modules can be imported."""
        critical_imports = [
            "src.graph.coordinator",
            "src.agents.planner",
            "src.llms.llm",
            "fastapi",
            "uvicorn"
        ]

        import_results = {}
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

                if result.returncode == 0:
                    import_results[module_name] = "success"
                else:
                    import_results[module_name] = "failed"
                    failed_imports.append(module_name)

            except subprocess.TimeoutExpired:
                import_results[module_name] = "timeout"
                failed_imports.append(module_name)
            except Exception as e:
                import_results[module_name] = f"error: {e}"
                failed_imports.append(module_name)

        if failed_imports:
            return {
                "status": "fail",
                "message": f"Failed to import {len(failed_imports)} critical modules",
                "details": {"import_results": import_results, "failed": failed_imports},
                "recommendations": ["Run: uv sync", "Check for missing dependencies"]
            }

        return {
            "status": "pass",
            "message": "All critical modules can be imported",
            "details": {"import_results": import_results}
        }

    def _check_basic_functionality(self) -> dict[str, Any]:
        """Check basic application functionality."""
        try:
            # Try to run main.py with --help
            result = subprocess.run(
                ["uv", "run", "python", "main.py", "--help"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=15
            )

            if result.returncode == 0:
                return {"status": "pass", "message": "Main application can be executed"}
            else:
                return {
                    "status": "fail",
                    "message": "Main application failed to run",
                    "details": {"stderr": result.stderr}
                }

        except subprocess.TimeoutExpired:
            return {"status": "warning", "message": "Basic functionality check timed out"}
        except Exception as e:
            return {"status": "fail", "message": f"Basic functionality check failed: {e}"}

    def _check_database(self) -> dict[str, Any]:
        """Check database connectivity."""
        try:
            # Check if database configuration exists
            env_files = [".env", "web/.env", ".env.local", "web/.env.local"]
            db_config_found = False

            for env_file in env_files:
                env_path = self.repo_path / env_file
                if env_path.exists():
                    with open(env_path) as f:
                        content = f.read()
                        if 'DATABASE_URL' in content or 'POSTGRES' in content or 'NEON' in content:
                            db_config_found = True
                            break

            if not db_config_found:
                return {
                    "status": "warning",
                    "message": "No database configuration found",
                    "recommendations": ["Configure database connection in .env file"]
                }

            return {"status": "pass", "message": "Database configuration found"}

        except Exception as e:
            return {"status": "warning", "message": f"Database check failed: {e}"}

    def _check_api_endpoints(self) -> dict[str, Any]:
        """Check if API server can start."""
        try:
            # Try to validate server.py syntax
            result = subprocess.run(
                ["uv", "run", "python", "-m", "py_compile", "server.py"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                return {"status": "pass", "message": "API server code is valid"}
            else:
                return {
                    "status": "fail",
                    "message": "API server has syntax errors",
                    "details": {"stderr": result.stderr}
                }

        except subprocess.TimeoutExpired:
            return {"status": "warning", "message": "API check timed out"}
        except Exception as e:
            return {"status": "warning", "message": f"API check failed: {e}"}

    def _display_summary(self, results: dict[str, Any], passed: int, failed: int) -> None:
        """Display health check summary."""
        status = results["overall_status"]
        status_emoji = {"healthy": "✅", "degraded": "⚠️ ", "unhealthy": "❌"}

        print("\n" + "=" * 60)
        print(f"🏥 HEALTH CHECK SUMMARY - {status_emoji.get(status, '❓')} {status.upper()}")
        print("=" * 60)
        print(f"Checks passed: {passed}")
        print(f"Checks failed: {failed}")
        print(f"Total checks: {len(self.checks)}")

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
            for rec in set(results["recommendations"]):  # Remove duplicates
                print(f"  • {rec}")

    def export_results(self, results: dict[str, Any], output_file: str) -> None:
        """Export health check results to file."""
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2, default=str)
        print(f"📄 Health check results saved to: {output_file}")


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Application Health Check")
    parser.add_argument("--output", help="Output file for health check results")

    args = parser.parse_args()

    checker = HealthChecker()
    results = checker.run_health_check()

    if args.output:
        checker.export_results(results, args.output)

    # Exit with appropriate code
    if results["overall_status"] == "healthy":
        sys.exit(0)
    elif results["overall_status"] == "degraded":
        sys.exit(1)
    else:
        sys.exit(2)


if __name__ == "__main__":
    main()
