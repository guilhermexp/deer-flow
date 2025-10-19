#!/usr/bin/env python3
"""
Environment File Consolidation Executor
Executes the consolidation plan for environment files.
"""

import os
from datetime import datetime
from pathlib import Path
from typing import Any

from backup_manager import BackupManager
from env_consolidation import (
    ConsolidationAction,
    ConsolidationPlan,
    EnvConsolidationPlanner,
)


class EnvConsolidator:
    def __init__(self, repo_path: str = ".", dry_run: bool = False):
        self.repo_path = Path(repo_path).resolve()
        self.dry_run = dry_run
        self.backup_manager = BackupManager(repo_path)
        self.planner = EnvConsolidationPlanner(repo_path)

    def execute_consolidation_plan(self, plan_file: str | None = None) -> dict[str, Any]:
        """Execute the consolidation plan with safety measures."""
        if plan_file and Path(plan_file).exists():
            plan = self.planner.load_plan(plan_file)
            print(f"📋 Loaded consolidation plan from: {plan_file}")
        else:
            print("📊 Generating new consolidation plan...")
            plan = self.planner.create_consolidation_plan()

        self._display_plan_summary(plan)

        if not self._confirm_execution():
            return {"status": "cancelled", "reason": "user_cancelled"}

        backup_name = self._create_safety_backup(plan)

        results = {
            "status": "completed",
            "backup_name": backup_name,
            "actions_taken": {},
            "errors": [],
            "warnings": [],
            "files_consolidated": 0,
            "timestamp": datetime.now().isoformat()
        }

        for action_index in plan.execution_order:
            action = plan.actions[action_index]
            try:
                action_result = self._execute_action(action)
                results["actions_taken"][f"action_{action_index}"] = action_result
                if action_result.get("success"):
                    results["files_consolidated"] += 1
            except Exception as e:
                error_msg = f"Failed to execute action {action_index}: {e}"
                results["errors"].append(error_msg)
                print(f"❌ {error_msg}")

        self._generate_consolidation_report(results)
        return results

    def _display_plan_summary(self, plan: ConsolidationPlan) -> None:
        """Display a summary of the consolidation plan."""
        print("\n" + "=" * 60)
        print("📋 ENVIRONMENT CONSOLIDATION PLAN SUMMARY")
        print("=" * 60)
        print(f"Total actions: {len(plan.actions)}")
        print(f"Files to remove: {plan.estimated_files_removed}")
        print(f"Variables to deduplicate: {plan.estimated_variables_deduplicated}")
        print()

        action_counts = {}
        for action in plan.actions:
            action_type = action.action_type
            action_counts[action_type] = action_counts.get(action_type, 0) + 1

        for action_type, count in action_counts.items():
            print(f"  • {action_type.title().replace('_', ' ')}: {count}")
        print()

    def _confirm_execution(self) -> bool:
        """Get user confirmation for plan execution."""
        if self.dry_run:
            print("🔍 DRY RUN MODE - No actual changes will be made")
            return True

        print("⚠️  This will modify environment files in your repository!")
        print("   A backup will be created before any changes.")

        while True:
            response = input("\nProceed with consolidation? (yes/no): ").lower().strip()
            if response in ["yes", "y"]:
                return True
            elif response in ["no", "n"]:
                return False
            else:
                print("Please enter 'yes' or 'no'")

    def _create_safety_backup(self, plan: ConsolidationPlan) -> str:
        """Create a backup of all environment files."""
        print("💾 Creating safety backup...")

        targets = []
        for action in plan.actions:
            targets.extend(action.source_files)
            if action.target_file and action.target_file not in targets:
                targets.append(action.target_file)

        # Remove duplicates and non-existent files
        targets = list(set(targets))
        existing_targets = [t for t in targets if (self.repo_path / t).exists()]

        if not existing_targets:
            print("🔍 No files to backup")
            return ""

        backup_name = f"env_consolidation_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if not self.dry_run:
            backup_path = self.backup_manager.create_backup(existing_targets, backup_name)
            print(f"✅ Backup created: {backup_path}")
        else:
            print(f"🔍 DRY RUN: Would create backup '{backup_name}' for {len(existing_targets)} files")

        return backup_name

    def _execute_action(self, action: ConsolidationAction) -> dict[str, Any]:
        """Execute a single consolidation action."""
        action_result = {
            "action_type": action.action_type,
            "success": False,
            "details": "",
            "files_affected": []
        }

        if action.action_type == "create_template":
            action_result.update(self._create_template(action))
        elif action.action_type == "merge":
            action_result.update(self._merge_files(action))
        elif action.action_type == "remove":
            action_result.update(self._remove_files(action))
        elif action.action_type == "rename":
            action_result.update(self._rename_file(action))
        else:
            action_result["details"] = f"Unknown action type: {action.action_type}"

        return action_result

    def _create_template(self, action: ConsolidationAction) -> dict[str, Any]:
        """Create a template file."""
        target_path = self.repo_path / action.target_file

        if self.dry_run:
            print(f"🔍 DRY RUN: Would create template {target_path}")
            return {"success": True, "details": "Dry run - template would be created"}

        try:
            # Generate template content
            template_lines = [
                "# Environment Configuration Template",
                "# Copy this file to .env and fill in your values",
                ""
            ]

            for key, value in action.variables_to_move.items():
                if value.startswith("your_") and value.endswith("_here"):
                    template_lines.append(f"{key}={value}")
                else:
                    template_lines.append(f"# {key}={value}")

            template_content = "\n".join(template_lines) + "\n"

            with open(target_path, "w") as f:
                f.write(template_content)

            print(f"📝 TEMPLATE CREATED: {action.target_file}")
            return {
                "success": True,
                "details": f"Template created with {len(action.variables_to_move)} variables",
                "files_affected": [action.target_file]
            }

        except Exception as e:
            print(f"❌ Failed to create template {action.target_file}: {e}")
            return {"success": False, "details": f"Template creation failed: {e}"}

    def _merge_files(self, action: ConsolidationAction) -> dict[str, Any]:
        """Merge environment files."""
        target_path = self.repo_path / action.target_file

        if self.dry_run:
            print(f"🔍 DRY RUN: Would merge {len(action.source_files)} files into {target_path}")
            return {"success": True, "details": "Dry run - files would be merged"}

        try:
            # Read target file if it exists
            target_variables = {}
            if target_path.exists():
                target_variables = self._read_env_file(target_path)

            # Read source files and collect variables
            all_variables = {}
            all_variables.update(target_variables)

            for source_file in action.source_files:
                source_path = self.repo_path / source_file
                if source_path.exists():
                    source_variables = self._read_env_file(source_path)
                    all_variables.update(source_variables)

            # Write merged file
            self._write_env_file(target_path, all_variables)

            # Remove source files
            for source_file in action.source_files:
                source_path = self.repo_path / source_file
                if source_path.exists():
                    source_path.unlink()

            print(f"🔀 MERGED: {len(action.source_files)} files -> {action.target_file}")
            return {
                "success": True,
                "details": f"Merged {len(action.source_files)} files",
                "files_affected": [action.target_file] + action.source_files
            }

        except Exception as e:
            print(f"❌ Failed to merge files: {e}")
            return {"success": False, "details": f"Merge failed: {e}"}

    def _remove_files(self, action: ConsolidationAction) -> dict[str, Any]:
        """Remove files."""
        if self.dry_run:
            print(f"🔍 DRY RUN: Would remove {len(action.source_files)} files")
            return {"success": True, "details": "Dry run - files would be removed"}

        try:
            removed_files = []
            for source_file in action.source_files:
                source_path = self.repo_path / source_file
                if source_path.exists():
                    source_path.unlink()
                    removed_files.append(source_file)

            print(f"🗑️  REMOVED: {len(removed_files)} files")
            return {
                "success": True,
                "details": f"Removed {len(removed_files)} files",
                "files_affected": removed_files
            }

        except Exception as e:
            print(f"❌ Failed to remove files: {e}")
            return {"success": False, "details": f"Removal failed: {e}"}

    def _rename_file(self, action: ConsolidationAction) -> dict[str, Any]:
        """Rename a file."""
        source_path = self.repo_path / action.source_files[0]
        target_path = self.repo_path / action.target_file

        if self.dry_run:
            print(f"🔍 DRY RUN: Would rename {source_path} -> {target_path}")
            return {"success": True, "details": "Dry run - file would be renamed"}

        try:
            if not source_path.exists():
                return {"success": False, "details": "Source file not found"}

            if target_path.exists():
                return {"success": False, "details": "Target file already exists"}

            source_path.rename(target_path)

            print(f"📝 RENAMED: {action.source_files[0]} -> {action.target_file}")
            return {
                "success": True,
                "details": f"Renamed to {action.target_file}",
                "files_affected": [action.source_files[0], action.target_file]
            }

        except Exception as e:
            print(f"❌ Failed to rename file: {e}")
            return {"success": False, "details": f"Rename failed: {e}"}

    def _read_env_file(self, file_path: Path) -> dict[str, str]:
        """Read environment variables from a file."""
        variables = {}
        try:
            with open(file_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        variables[key.strip()] = value.strip().strip('"\'')
        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")
        return variables

    def _write_env_file(self, file_path: Path, variables: dict[str, str]) -> None:
        """Write environment variables to a file."""
        lines = [
            "# Environment configuration",
            f"# Generated: {datetime.now().isoformat()}",
            ""
        ]

        for key, value in sorted(variables.items()):
            lines.append(f"{key}={value}")

        with open(file_path, 'w') as f:
            f.write('\n'.join(lines) + '\n')

    def _generate_consolidation_report(self, results: dict[str, Any]) -> None:
        """Generate a consolidation report."""
        report_lines = [
            "# Environment File Consolidation Report",
            f"Generated: {results['timestamp']}",
            f"Repository: {self.repo_path}",
            f"Backup: {results['backup_name']}",
            f"Status: {results['status']}",
            "",
            "## Summary",
            f"- Files consolidated: {results['files_consolidated']}",
            f"- Actions taken: {len(results['actions_taken'])}",
            f"- Errors: {len(results['errors'])}",
            f"- Warnings: {len(results['warnings'])}",
            ""
        ]

        if results["actions_taken"]:
            report_lines.extend(["## Actions Taken", ""])
            for action_id, action_result in results["actions_taken"].items():
                status = "✅" if action_result["success"] else "❌"
                report_lines.extend([
                    f"{status} **{action_result['action_type'].upper()}**",
                    f"   {action_result['details']}",
                    ""
                ])

        if results["errors"]:
            report_lines.extend(["## Errors", ""])
            for error in results["errors"]:
                report_lines.append(f"❌ {error}")

        report_content = "\n".join(report_lines)

        report_file = f"reports/env_consolidation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        os.makedirs("reports", exist_ok=True)

        if not self.dry_run:
            with open(report_file, "w") as f:
                f.write(report_content)
            print(f"📄 Consolidation report saved: {report_file}")
        else:
            print(f"🔍 DRY RUN: Would save report to {report_file}")
            print("\n" + report_content)


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Environment File Consolidation Executor")
    parser.add_argument("--plan", help="JSON file with consolidation plan")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--auto-confirm", action="store_true", help="Skip confirmation prompts")

    args = parser.parse_args()

    consolidator = EnvConsolidator(dry_run=args.dry_run)

    if args.auto_confirm:
        consolidator._confirm_execution = lambda: True

    try:
        results = consolidator.execute_consolidation_plan(args.plan)

        if results["status"] == "completed":
            print("\n✅ Consolidation completed successfully!")
            print(f"💾 Backup: {results['backup_name']}")
            print(f"📁 Files consolidated: {results['files_consolidated']}")
        else:
            print(f"\n⚠️  Consolidation status: {results['status']}")

    except KeyboardInterrupt:
        print("\n❌ Consolidation interrupted by user")
    except Exception as e:
        print(f"\n❌ Consolidation failed: {e}")


if __name__ == "__main__":
    main()
