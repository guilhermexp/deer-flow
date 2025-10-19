#!/usr/bin/env python3
"""
Screenshot Cleanup Script for Repository Cleanup
Executes the cleanup plan for screenshot directories with safety measures.
"""

import os
import shutil
import sys
import tarfile
from datetime import datetime
from pathlib import Path
from typing import Any

from backup_manager import BackupManager
from screenshot_decision import (
    PreservationDecision,
    PreservationPlan,
    ScreenshotDecisionEngine,
)


class ScreenshotCleanup:
    def __init__(self, repo_path: str = ".", dry_run: bool = False):
        self.repo_path = Path(repo_path).resolve()
        self.dry_run = dry_run
        self.backup_manager = BackupManager(repo_path)
        self.decision_engine = ScreenshotDecisionEngine(repo_path)

    def execute_cleanup_plan(self, plan_file: str | None = None) -> dict[str, Any]:
        """Execute the cleanup plan with comprehensive safety measures."""
        # Load or generate plan
        if plan_file and Path(plan_file).exists():
            plan = self.decision_engine.load_decision_plan(plan_file)
            print(f"📋 Loaded cleanup plan from: {plan_file}")
        else:
            print("📊 Generating new cleanup plan...")
            plan = self.decision_engine.analyze_and_decide()

        # Display plan summary
        self._display_plan_summary(plan)

        if not self._confirm_execution():
            print("❌ Cleanup cancelled by user")
            return {"status": "cancelled", "reason": "user_cancelled"}

        # Create backup before any operations
        backup_name = self._create_safety_backup(plan)

        # Execute cleanup
        results = {
            "status": "completed",
            "backup_name": backup_name,
            "actions_taken": {},
            "errors": [],
            "warnings": [],
            "space_saved": 0,
            "timestamp": datetime.now().isoformat()
        }

        for decision in plan.decisions:
            try:
                action_result = self._execute_decision(decision)
                results["actions_taken"][decision.directory] = action_result
                if action_result.get("space_saved"):
                    results["space_saved"] += action_result["space_saved"]
            except Exception as e:
                error_msg = f"Failed to process {decision.directory}: {e}"
                results["errors"].append(error_msg)
                print(f"❌ {error_msg}")

        # Generate cleanup report
        self._generate_cleanup_report(results)

        return results

    def _display_plan_summary(self, plan: PreservationPlan) -> None:
        """Display a summary of the cleanup plan."""
        print("\n" + "=" * 60)
        print("📋 SCREENSHOT CLEANUP PLAN SUMMARY")
        print("=" * 60)
        print(f"Directories to preserve: {plan.total_to_preserve}")
        print(f"Directories to archive:  {plan.total_to_archive}")
        print(f"Directories to remove:   {plan.total_to_remove}")
        print(f"Estimated space savings: {self._format_size(plan.estimated_space_savings)}")
        print()

        # Show high-priority items
        high_priority = [d for d in plan.decisions if d.priority == 1]
        if high_priority:
            print("🔴 HIGH PRIORITY ACTIONS:")
            for decision in high_priority:
                print(f"  • {decision.action.upper()}: {decision.directory}")
                print(f"    Reason: {decision.reason}")
        print()

    def _confirm_execution(self) -> bool:
        """Get user confirmation for plan execution."""
        if self.dry_run:
            print("🔍 DRY RUN MODE - No actual changes will be made")
            return True

        print("⚠️  This will permanently modify your repository!")
        print("   A backup will be created before any changes.")

        while True:
            response = input("\nProceed with cleanup? (yes/no): ").lower().strip()
            if response in ["yes", "y"]:
                return True
            elif response in ["no", "n"]:
                return False
            else:
                print("Please enter 'yes' or 'no'")

    def _create_safety_backup(self, plan: PreservationPlan) -> str:
        """Create a comprehensive backup before cleanup."""
        print("💾 Creating safety backup...")

        # Collect all directories that will be modified
        targets = []
        for decision in plan.decisions:
            if decision.action in ["remove", "archive"]:
                targets.append(decision.directory)

        if not targets:
            print("🔍 No directories to backup")
            return ""

        backup_name = f"screenshot_cleanup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if not self.dry_run:
            backup_path = self.backup_manager.create_backup(targets, backup_name)
            print(f"✅ Backup created: {backup_path}")
        else:
            print(f"🔍 DRY RUN: Would create backup '{backup_name}' for {len(targets)} directories")

        return backup_name

    def _execute_decision(self, decision: PreservationDecision) -> dict[str, Any]:
        """Execute a single preservation decision."""
        dir_path = self.repo_path / decision.directory
        action_result = {
            "action": decision.action,
            "success": False,
            "space_saved": 0,
            "details": ""
        }

        if not dir_path.exists():
            action_result["details"] = "Directory not found (already removed?)"
            action_result["success"] = True
            return action_result

        original_size = self._get_directory_size(dir_path)

        if decision.action == "preserve":
            action_result.update({
                "success": True,
                "details": "Directory preserved",
                "space_saved": 0
            })
            print(f"✅ PRESERVE: {decision.directory}")

        elif decision.action == "remove":
            action_result.update(self._remove_directory(dir_path, decision))
            action_result["space_saved"] = original_size

        elif decision.action == "archive":
            action_result.update(self._archive_directory(dir_path, decision))
            action_result["space_saved"] = original_size - self._get_directory_size(dir_path)

        return action_result

    def _remove_directory(self, dir_path: Path, decision: PreservationDecision) -> dict[str, Any]:
        """Remove a directory completely."""
        if self.dry_run:
            print(f"🔍 DRY RUN: Would remove {dir_path}")
            return {"success": True, "details": "Dry run - directory would be removed"}

        try:
            shutil.rmtree(dir_path)
            print(f"🗑️  REMOVED: {decision.directory}")
            return {"success": True, "details": "Directory removed successfully"}
        except Exception as e:
            print(f"❌ Failed to remove {decision.directory}: {e}")
            return {"success": False, "details": f"Removal failed: {e}"}

    def _archive_directory(self, dir_path: Path, decision: PreservationDecision) -> dict[str, Any]:
        """Archive a directory by compressing it."""
        if self.dry_run:
            print(f"🔍 DRY RUN: Would archive {dir_path}")
            return {"success": True, "details": "Dry run - directory would be archived"}

        try:
            # Create archive in the same parent directory
            archive_path = dir_path.parent / f"{dir_path.name}_archived.tar.gz"

            with tarfile.open(archive_path, "w:gz") as tar:
                tar.add(dir_path, arcname=dir_path.name)

            # Remove original directory
            shutil.rmtree(dir_path)

            print(f"📦 ARCHIVED: {decision.directory} -> {archive_path.name}")
            return {
                "success": True,
                "details": f"Directory archived to {archive_path.name}"
            }
        except Exception as e:
            print(f"❌ Failed to archive {decision.directory}: {e}")
            return {"success": False, "details": f"Archive failed: {e}"}

    def _get_directory_size(self, dir_path: Path) -> int:
        """Calculate total size of directory."""
        if not dir_path.exists():
            return 0

        total_size = 0
        for file_path in dir_path.rglob("*"):
            if file_path.is_file():
                try:
                    total_size += file_path.stat().st_size
                except (OSError, FileNotFoundError):
                    pass
        return total_size

    def _generate_cleanup_report(self, results: dict[str, Any]) -> None:
        """Generate a detailed cleanup report."""
        report_lines = [
            "# Screenshot Cleanup Report",
            f"Generated: {results['timestamp']}",
            f"Repository: {self.repo_path}",
            f"Backup: {results['backup_name']}",
            f"Status: {results['status']}",
            "",
            "## Summary",
            f"- Total space saved: {self._format_size(results['space_saved'])}",
            f"- Actions taken: {len(results['actions_taken'])}",
            f"- Errors: {len(results['errors'])}",
            f"- Warnings: {len(results['warnings'])}",
            ""
        ]

        # Actions taken
        if results["actions_taken"]:
            report_lines.extend(["## Actions Taken", ""])
            for directory, action in results["actions_taken"].items():
                status = "✅" if action["success"] else "❌"
                space_info = f" (saved {self._format_size(action.get('space_saved', 0))})" if action.get('space_saved') else ""
                report_lines.append(f"{status} **{action['action'].upper()}**: {directory}{space_info}")
                if action.get('details'):
                    report_lines.append(f"   {action['details']}")
                report_lines.append("")

        # Errors
        if results["errors"]:
            report_lines.extend(["## Errors", ""])
            for error in results["errors"]:
                report_lines.append(f"❌ {error}")
            report_lines.append("")

        # Warnings
        if results["warnings"]:
            report_lines.extend(["## Warnings", ""])
            for warning in results["warnings"]:
                report_lines.append(f"⚠️  {warning}")
            report_lines.append("")

        report_content = "\n".join(report_lines)

        # Save report
        report_file = f"reports/screenshot_cleanup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        os.makedirs("reports", exist_ok=True)

        if not self.dry_run:
            with open(report_file, "w") as f:
                f.write(report_content)
            print(f"📄 Cleanup report saved: {report_file}")
        else:
            print(f"🔍 DRY RUN: Would save report to {report_file}")
            print("\n" + report_content)

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

    parser = argparse.ArgumentParser(description="Screenshot Cleanup Execution")
    parser.add_argument("--plan", help="JSON file with cleanup plan")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--auto-confirm", action="store_true", help="Skip confirmation prompts")

    args = parser.parse_args()

    cleanup = ScreenshotCleanup(dry_run=args.dry_run)

    # Override confirmation for automation
    if args.auto_confirm:
        cleanup._confirm_execution = lambda: True

    try:
        results = cleanup.execute_cleanup_plan(args.plan)

        if results["status"] == "completed":
            print("\n✅ Cleanup completed successfully!")
            print(f"💾 Backup: {results['backup_name']}")
            print(f"💾 Space saved: {cleanup._format_size(results['space_saved'])}")
        else:
            print(f"\n⚠️  Cleanup status: {results['status']}")

    except KeyboardInterrupt:
        print("\n❌ Cleanup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Cleanup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
