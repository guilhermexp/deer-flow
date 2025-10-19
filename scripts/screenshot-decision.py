#!/usr/bin/env python3
"""
Screenshot Preservation Logic for Repository Cleanup
Determines which screenshot directories should be preserved, archived, or removed.
"""

import json
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from screenshot_analyzer import DirectoryAnalysis, ScreenshotAnalyzer


@dataclass
class PreservationDecision:
    """Decision about a screenshot directory."""
    directory: str
    action: str  # "preserve", "archive", "remove"
    reason: str
    priority: int  # 1=high, 2=medium, 3=low
    backup_required: bool
    estimated_savings: int  # bytes


@dataclass
class PreservationPlan:
    """Complete preservation plan for all screenshot directories."""
    decisions: list[PreservationDecision]
    total_to_remove: int
    total_to_archive: int
    total_to_preserve: int
    estimated_space_savings: int
    timestamp: str


class ScreenshotDecisionEngine:
    def __init__(self, repo_path: str = ".", preservation_rules: dict | None = None):
        self.repo_path = Path(repo_path).resolve()
        self.analyzer = ScreenshotAnalyzer(repo_path)
        self.preservation_rules = preservation_rules or self._default_preservation_rules()

    def _default_preservation_rules(self) -> dict:
        """Default rules for screenshot preservation."""
        return {
            "preserve_production": True,
            "preserve_documentation": True,
            "archive_test_dirs": True,
            "remove_old_test_days": 30,
            "min_size_for_archive_mb": 10,
            "preserve_recent_days": 7,
            "remove_empty_dirs": True,
            "preserve_unique_screenshots": True,
            "max_duplicate_threshold": 0.8
        }

    def analyze_and_decide(self) -> PreservationPlan:
        """Analyze all screenshot directories and make preservation decisions."""
        analyses = self.analyzer.analyze_all_directories()
        decisions = []

        for analysis in analyses:
            decision = self._make_preservation_decision(analysis)
            decisions.append(decision)

        # Calculate totals
        total_to_remove = sum(1 for d in decisions if d.action == "remove")
        total_to_archive = sum(1 for d in decisions if d.action == "archive")
        total_to_preserve = sum(1 for d in decisions if d.action == "preserve")
        estimated_space_savings = sum(d.estimated_savings for d in decisions if d.action in ["remove", "archive"])

        return PreservationPlan(
            decisions=decisions,
            total_to_remove=total_to_remove,
            total_to_archive=total_to_archive,
            total_to_preserve=total_to_preserve,
            estimated_space_savings=estimated_space_savings,
            timestamp=datetime.now().isoformat()
        )

    def _make_preservation_decision(self, analysis: DirectoryAnalysis) -> PreservationDecision:
        """Make a preservation decision for a single directory."""
        rules = self.preservation_rules
        path = analysis.path
        creation_pattern = analysis.creation_pattern

        # Production assets - always preserve
        if creation_pattern == "production":
            return PreservationDecision(
                directory=path,
                action="preserve",
                reason="Production assets required for application",
                priority=1,
                backup_required=True,
                estimated_savings=0
            )

        # Documentation - preserve
        if creation_pattern == "documentation" and rules["preserve_documentation"]:
            return PreservationDecision(
                directory=path,
                action="preserve",
                reason="Documentation screenshots provide user guidance",
                priority=1,
                backup_required=True,
                estimated_savings=0
            )

        # Archive directories - remove
        if creation_pattern == "archive":
            return PreservationDecision(
                directory=path,
                action="remove",
                reason="Archive directory no longer needed",
                priority=3,
                backup_required=True,
                estimated_savings=analysis.total_size
            )

        # Empty directories - remove
        if analysis.total_files == 0 and rules["remove_empty_dirs"]:
            return PreservationDecision(
                directory=path,
                action="remove",
                reason="Empty directory",
                priority=3,
                backup_required=False,
                estimated_savings=0
            )

        # Test directories - analyze further
        if creation_pattern == "test":
            return self._decide_test_directory(analysis)

        # Unknown directories - analyze by age and size
        return self._decide_unknown_directory(analysis)

    def _decide_test_directory(self, analysis: DirectoryAnalysis) -> PreservationDecision:
        """Decide what to do with test directories."""
        rules = self.preservation_rules
        path = analysis.path

        # Check if directory is recent
        if analysis.newest_file:
            try:
                newest_time = datetime.fromisoformat(
                    next(s.modified_time for s in analysis.screenshots
                         if s.path == analysis.newest_file)
                )
                days_old = (datetime.now() - newest_time).days

                # Recent test directory - preserve temporarily
                if days_old <= rules["preserve_recent_days"]:
                    return PreservationDecision(
                        directory=path,
                        action="preserve",
                        reason=f"Recent test directory ({days_old} days old)",
                        priority=2,
                        backup_required=True,
                        estimated_savings=0
                    )

                # Old test directory - remove or archive
                if days_old >= rules["remove_old_test_days"]:
                    if analysis.total_size >= rules["min_size_for_archive_mb"] * 1024 * 1024:
                        return PreservationDecision(
                            directory=path,
                            action="archive",
                            reason=f"Large old test directory ({days_old} days old)",
                            priority=2,
                            backup_required=True,
                            estimated_savings=analysis.total_size // 2  # Assume 50% compression
                        )
                    else:
                        return PreservationDecision(
                            directory=path,
                            action="remove",
                            reason=f"Small old test directory ({days_old} days old)",
                            priority=3,
                            backup_required=True,
                            estimated_savings=analysis.total_size
                        )
            except (ValueError, StopIteration):
                pass

        # Default for test directories
        if rules["archive_test_dirs"]:
            return PreservationDecision(
                directory=path,
                action="archive",
                reason="Test directory - archive for potential future reference",
                priority=2,
                backup_required=True,
                estimated_savings=analysis.total_size // 2
            )
        else:
            return PreservationDecision(
                directory=path,
                action="remove",
                reason="Test directory no longer needed",
                priority=3,
                backup_required=True,
                estimated_savings=analysis.total_size
            )

    def _decide_unknown_directory(self, analysis: DirectoryAnalysis) -> PreservationDecision:
        """Decide what to do with unknown directories."""
        path = analysis.path

        # Very small directories - likely remove
        if analysis.total_size < 1024 * 1024:  # < 1MB
            return PreservationDecision(
                directory=path,
                action="remove",
                reason="Small unknown directory with minimal impact",
                priority=3,
                backup_required=True,
                estimated_savings=analysis.total_size
            )

        # Large directories - archive for safety
        if analysis.total_size > 10 * 1024 * 1024:  # > 10MB
            return PreservationDecision(
                directory=path,
                action="archive",
                reason="Large unknown directory - archive for safety",
                priority=2,
                backup_required=True,
                estimated_savings=analysis.total_size // 2
            )

        # Medium directories - preserve for now
        return PreservationDecision(
            directory=path,
            action="preserve",
            reason="Unknown directory - preserve pending investigation",
            priority=2,
            backup_required=True,
            estimated_savings=0
        )

    def generate_decision_report(self, plan: PreservationPlan) -> str:
        """Generate a human-readable decision report."""
        report_lines = [
            "# Screenshot Preservation Decision Report",
            f"Generated: {plan.timestamp}",
            f"Repository: {self.repo_path}",
            "",
            "## Summary",
            f"- Directories to preserve: {plan.total_to_preserve}",
            f"- Directories to archive: {plan.total_to_archive}",
            f"- Directories to remove: {plan.total_to_remove}",
            f"- Estimated space savings: {self._format_size(plan.estimated_space_savings)}",
            ""
        ]

        # Group decisions by action
        by_action = {"preserve": [], "archive": [], "remove": []}
        for decision in plan.decisions:
            by_action[decision.action].append(decision)

        for action, decisions in by_action.items():
            if not decisions:
                continue

            action_savings = sum(d.estimated_savings for d in decisions)
            report_lines.extend([
                f"## {action.title()} ({len(decisions)} directories)",
                f"Space impact: {self._format_size(action_savings)}",
                ""
            ])

            # Sort by priority then by size
            sorted_decisions = sorted(decisions, key=lambda x: (x.priority, -x.estimated_savings))

            for decision in sorted_decisions:
                priority_str = {1: "HIGH", 2: "MEDIUM", 3: "LOW"}[decision.priority]
                backup_str = "⚠️  Backup required" if decision.backup_required else "No backup needed"

                report_lines.extend([
                    f"### {decision.directory}",
                    f"- **Priority**: {priority_str}",
                    f"- **Reason**: {decision.reason}",
                    f"- **Space savings**: {self._format_size(decision.estimated_savings)}",
                    f"- **Backup**: {backup_str}",
                    ""
                ])

        return "\n".join(report_lines)

    def export_decision_plan(self, plan: PreservationPlan, output_file: str) -> None:
        """Export decision plan to JSON file."""
        data = asdict(plan)

        with open(output_file, "w") as f:
            json.dump(data, f, indent=2, default=str)

        print(f"📋 Decision plan exported to: {output_file}")

    def load_decision_plan(self, input_file: str) -> PreservationPlan:
        """Load decision plan from JSON file."""
        with open(input_file) as f:
            data = json.load(f)

        decisions = [PreservationDecision(**d) for d in data["decisions"]]

        return PreservationPlan(
            decisions=decisions,
            total_to_remove=data["total_to_remove"],
            total_to_archive=data["total_to_archive"],
            total_to_preserve=data["total_to_preserve"],
            estimated_space_savings=data["estimated_space_savings"],
            timestamp=data["timestamp"]
        )

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

    parser = argparse.ArgumentParser(description="Screenshot Preservation Decision Engine")
    parser.add_argument("--analyze", action="store_true", help="Analyze and generate decision plan")
    parser.add_argument("--report", help="Generate report from existing plan file")
    parser.add_argument("--output", help="Output file for decision plan")
    parser.add_argument("--config", help="JSON file with preservation rules")

    args = parser.parse_args()

    # Load custom rules if provided
    preservation_rules = None
    if args.config:
        with open(args.config) as f:
            preservation_rules = json.load(f)

    engine = ScreenshotDecisionEngine(preservation_rules=preservation_rules)

    if args.analyze:
        print("📊 Analyzing screenshot directories...")
        plan = engine.analyze_and_decide()

        if args.output:
            engine.export_decision_plan(plan, args.output)

        report = engine.generate_decision_report(plan)
        print(report)

    elif args.report:
        if not Path(args.report).exists():
            print(f"❌ Plan file not found: {args.report}")
            return

        plan = engine.load_decision_plan(args.report)
        report = engine.generate_decision_report(plan)
        print(report)

    else:
        print("❌ Please specify --analyze or --report")


if __name__ == "__main__":
    main()
