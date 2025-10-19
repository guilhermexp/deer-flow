#!/usr/bin/env python3
"""
Environment Consolidation Planner for Repository Cleanup
Creates a plan for consolidating environment files based on analysis.
"""

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from env_analyzer import ConsolidationOpportunity, EnvAnalyzer, EnvFileAnalysis


@dataclass
class ConsolidationAction:
    """A specific action to take for consolidation."""
    action_type: str  # "merge", "remove", "create_template", "move", "rename"
    source_files: list[str]
    target_file: str
    variables_to_move: dict[str, str]
    backup_required: bool
    reason: str
    risk_level: str  # "low", "medium", "high"


@dataclass
class ConsolidationPlan:
    """Complete consolidation plan."""
    actions: list[ConsolidationAction]
    estimated_files_removed: int
    estimated_variables_deduplicated: int
    safety_recommendations: list[str]
    execution_order: list[int]  # Indices into actions list
    timestamp: str


class EnvConsolidationPlanner:
    def __init__(self, repo_path: str = ".", safety_level: str = "medium"):
        self.repo_path = Path(repo_path).resolve()
        self.analyzer = EnvAnalyzer(repo_path)
        self.safety_level = safety_level  # "low", "medium", "high"

    def create_consolidation_plan(self) -> ConsolidationPlan:
        """Create a comprehensive consolidation plan."""
        analyses = self.analyzer.analyze_all_env_files()
        opportunities = self.analyzer.find_consolidation_opportunities(analyses)

        actions = []
        safety_recommendations = []

        # Plan template creation
        template_actions = self._plan_template_creation(analyses)
        actions.extend(template_actions)

        # Plan file merging
        merge_actions = self._plan_file_merging(analyses, opportunities)
        actions.extend(merge_actions)

        # Plan duplicate removal
        duplicate_actions = self._plan_duplicate_removal(analyses)
        actions.extend(duplicate_actions)

        # Plan file organization
        organization_actions = self._plan_file_organization(analyses)
        actions.extend(organization_actions)

        # Generate safety recommendations
        safety_recommendations = self._generate_safety_recommendations(analyses, actions)

        # Determine execution order
        execution_order = self._determine_execution_order(actions)

        # Calculate impact
        estimated_files_removed = len([a for a in actions if a.action_type == "remove"])
        estimated_variables_deduplicated = sum(len(a.variables_to_move) for a in actions if a.action_type == "merge")

        return ConsolidationPlan(
            actions=actions,
            estimated_files_removed=estimated_files_removed,
            estimated_variables_deduplicated=estimated_variables_deduplicated,
            safety_recommendations=safety_recommendations,
            execution_order=execution_order,
            timestamp=datetime.now().isoformat()
        )

    def _plan_template_creation(self, analyses: list[EnvFileAnalysis]) -> list[ConsolidationAction]:
        """Plan creation of .env.example templates."""
        actions = []

        # Group by directory
        by_directory = {}
        for analysis in analyses:
            if not analysis.exists or analysis.is_template:
                continue

            dir_path = str(Path(analysis.path).parent)
            if dir_path not in by_directory:
                by_directory[dir_path] = []
            by_directory[dir_path].append(analysis)

        for directory, files in by_directory.items():
            # Check if we need a template in this directory
            has_template = any(f.file_type == "example" for f in files)
            has_multiple_env_files = len([f for f in files if f.file_type in ["local", "development", "generic"]]) > 1

            if not has_template and has_multiple_env_files:
                # Create template from common variables
                all_variables = {}
                for file in files:
                    for key, var in file.variables.items():
                        if not var.is_secret:  # Don't include secrets in templates
                            if key not in all_variables:
                                all_variables[key] = []
                            all_variables[key].append(var.value)

                # Find variables that appear in multiple files
                common_variables = {}
                for key, values in all_variables.items():
                    if len(set(values)) == 1:  # Same value across files
                        common_variables[key] = values[0]
                    elif len(values) > 1:  # Different values - use placeholder
                        common_variables[key] = f"your_{key.lower()}_here"

                if len(common_variables) >= 3:  # Threshold for template creation
                    template_path = os.path.join(directory, ".env.example")

                    actions.append(ConsolidationAction(
                        action_type="create_template",
                        source_files=[f.path for f in files],
                        target_file=template_path,
                        variables_to_move=common_variables,
                        backup_required=False,
                        reason=f"Create template with {len(common_variables)} common variables",
                        risk_level="low"
                    ))

        return actions

    def _plan_file_merging(self, analyses: list[EnvFileAnalysis], opportunities: list[ConsolidationOpportunity]) -> list[ConsolidationAction]:
        """Plan merging of similar environment files."""
        actions = []

        for opportunity in opportunities:
            if opportunity.consolidation_type != "merge":
                continue

            # Only merge if low conflict
            if len(opportunity.conflicting_variables) <= 2:
                # Choose target file (prefer .env over others)
                target_file = opportunity.files[0]
                for file_path in opportunity.files:
                    if Path(file_path).name == ".env":
                        target_file = file_path
                        break

                source_files = [f for f in opportunity.files if f != target_file]

                actions.append(ConsolidationAction(
                    action_type="merge",
                    source_files=source_files,
                    target_file=target_file,
                    variables_to_move=opportunity.common_variables,
                    backup_required=True,
                    reason=f"Merge {len(source_files)} files with {len(opportunity.common_variables)} common variables",
                    risk_level="medium" if opportunity.conflicting_variables else "low"
                ))

        return actions

    def _plan_duplicate_removal(self, analyses: list[EnvFileAnalysis]) -> list[ConsolidationAction]:
        """Plan removal of duplicate files."""
        actions = []

        # Find exact duplicates (same variables and values)
        for i, analysis1 in enumerate(analyses):
            if not analysis1.exists or analysis1.is_template:
                continue

            for analysis2 in analyses[i + 1:]:
                if not analysis2.exists or analysis2.is_template:
                    continue

                # Check if files are identical
                if self._are_files_identical(analysis1, analysis2):
                    # Keep the one with the more standard name
                    keep_file, remove_file = self._choose_file_to_keep(analysis1, analysis2)

                    actions.append(ConsolidationAction(
                        action_type="remove",
                        source_files=[remove_file.path],
                        target_file="",
                        variables_to_move={},
                        backup_required=True,
                        reason=f"Remove duplicate of {keep_file.path}",
                        risk_level="low"
                    ))

        return actions

    def _plan_file_organization(self, analyses: list[EnvFileAnalysis]) -> list[ConsolidationAction]:
        """Plan organization of environment files."""
        actions = []

        for analysis in analyses:
            if not analysis.exists:
                continue

            current_path = Path(analysis.path)

            # Suggest renaming files with non-standard names
            if self._should_rename_file(current_path):
                new_name = self._suggest_standard_name(current_path, analysis)
                new_path = current_path.parent / new_name

                if new_name != current_path.name:
                    actions.append(ConsolidationAction(
                        action_type="rename",
                        source_files=[analysis.path],
                        target_file=str(new_path),
                        variables_to_move={},
                        backup_required=False,
                        reason=f"Rename to standard convention: {new_name}",
                        risk_level="low"
                    ))

        return actions

    def _generate_safety_recommendations(self, analyses: list[EnvFileAnalysis], actions: list[ConsolidationAction]) -> list[str]:
        """Generate safety recommendations for the consolidation."""
        recommendations = []

        # Check for secrets
        secret_files = [a for a in analyses if a.exists and a.secrets_count > 0]
        if secret_files:
            recommendations.append(
                "⚠️  CRITICAL: Backup all files containing secrets before consolidation. "
                f"Found {len(secret_files)} files with secrets."
            )

        # Check for production files
        prod_files = [a for a in analyses if a.exists and a.file_type == "production"]
        if prod_files:
            recommendations.append(
                "⚠️  HIGH: Production environment files detected. "
                "Test consolidation in development first."
            )

        # Check for high-risk actions
        high_risk_actions = [a for a in actions if a.risk_level == "high"]
        if high_risk_actions:
            recommendations.append(
                f"⚠️  HIGH: {len(high_risk_actions)} high-risk actions detected. "
                "Review each action carefully before execution."
            )

        # General recommendations
        recommendations.extend([
            "💾 Create full repository backup before starting consolidation",
            "🧪 Test application functionality after consolidation",
            "👥 Notify team members about environment file changes",
            "📝 Update documentation to reflect new file structure"
        ])

        return recommendations

    def _determine_execution_order(self, actions: list[ConsolidationAction]) -> list[int]:
        """Determine the optimal execution order for actions."""
        # Group actions by type and risk level
        order_priority = {
            ("create_template", "low"): 1,
            ("rename", "low"): 2,
            ("merge", "low"): 3,
            ("merge", "medium"): 4,
            ("remove", "low"): 5,
            ("remove", "medium"): 6,
            ("merge", "high"): 7,
            ("remove", "high"): 8,
        }

        # Sort actions by priority
        indexed_actions = [(i, action) for i, action in enumerate(actions)]
        indexed_actions.sort(key=lambda x: order_priority.get((x[1].action_type, x[1].risk_level), 99))

        return [i for i, _ in indexed_actions]

    def _are_files_identical(self, analysis1: EnvFileAnalysis, analysis2: EnvFileAnalysis) -> bool:
        """Check if two environment files are identical."""
        if len(analysis1.variables) != len(analysis2.variables):
            return False

        for key, var1 in analysis1.variables.items():
            var2 = analysis2.variables.get(key)
            if not var2 or var1.value != var2.value:
                return False

        return True

    def _choose_file_to_keep(self, analysis1: EnvFileAnalysis, analysis2: EnvFileAnalysis) -> tuple[EnvFileAnalysis, EnvFileAnalysis]:
        """Choose which file to keep when removing duplicates."""
        # Prefer standard names
        name1 = Path(analysis1.path).name
        name2 = Path(analysis2.path).name

        standard_names = [".env", ".env.local", ".env.development", ".env.example"]

        for standard_name in standard_names:
            if name1 == standard_name:
                return analysis1, analysis2
            elif name2 == standard_name:
                return analysis2, analysis1

        # Prefer newer files
        if analysis1.modified_time > analysis2.modified_time:
            return analysis1, analysis2
        else:
            return analysis2, analysis1

    def _should_rename_file(self, file_path: Path) -> bool:
        """Check if a file should be renamed for standardization."""
        name = file_path.name

        # Don't rename standard names
        standard_names = [".env", ".env.local", ".env.development", ".env.production", ".env.example", ".env.test"]
        if name in standard_names:
            return False

        # Rename non-standard environment files
        return True

    def _suggest_standard_name(self, file_path: Path, analysis: EnvFileAnalysis) -> str:
        """Suggest a standard name for an environment file."""
        current_name = file_path.name.lower()

        if analysis.file_type == "example" or analysis.is_template:
            return ".env.example"
        elif analysis.file_type == "local":
            return ".env.local"
        elif analysis.file_type == "development":
            return ".env.development"
        elif analysis.file_type == "production":
            return ".env.production"
        elif analysis.file_type == "test":
            return ".env.test"
        else:
            return ".env"

    def generate_plan_report(self, plan: ConsolidationPlan) -> str:
        """Generate a human-readable consolidation plan report."""
        report_lines = [
            "# Environment File Consolidation Plan",
            f"Generated: {plan.timestamp}",
            f"Repository: {self.repo_path}",
            "",
            "## Summary",
            f"- Total actions: {len(plan.actions)}",
            f"- Files to be removed: {plan.estimated_files_removed}",
            f"- Variables to deduplicate: {plan.estimated_variables_deduplicated}",
            "",
            "## Safety Recommendations",
            ""
        ]

        for recommendation in plan.safety_recommendations:
            report_lines.append(f"{recommendation}")
        report_lines.append("")

        # Actions by type
        by_type = {}
        for action in plan.actions:
            action_type = action.action_type
            if action_type not in by_type:
                by_type[action_type] = []
            by_type[action_type].append(action)

        for action_type, actions in by_type.items():
            if not actions:
                continue

            report_lines.extend([
                f"## {action_type.title().replace('_', ' ')} Actions ({len(actions)})",
                ""
            ])

            for i, action in enumerate(actions, 1):
                risk_emoji = {"low": "🟢", "medium": "🟡", "high": "🔴"}[action.risk_level]
                backup_str = "💾 Backup required" if action.backup_required else "No backup needed"

                report_lines.extend([
                    f"### Action {i}: {risk_emoji} {action.reason}",
                    f"- **Risk Level**: {action.risk_level}",
                    f"- **Source Files**: {', '.join(action.source_files) if action.source_files else 'N/A'}",
                    f"- **Target File**: {action.target_file or 'N/A'}",
                    f"- **Variables**: {len(action.variables_to_move)}",
                    f"- **Backup**: {backup_str}",
                    ""
                ])

        # Execution order
        report_lines.extend([
            "## Recommended Execution Order",
            ""
        ])

        for i, action_index in enumerate(plan.execution_order, 1):
            action = plan.actions[action_index]
            risk_emoji = {"low": "🟢", "medium": "🟡", "high": "🔴"}[action.risk_level]
            report_lines.append(f"{i}. {risk_emoji} {action.action_type}: {action.reason}")

        return "\n".join(report_lines)

    def export_plan(self, plan: ConsolidationPlan, output_file: str) -> None:
        """Export consolidation plan to JSON file."""
        data = asdict(plan)

        with open(output_file, "w") as f:
            json.dump(data, f, indent=2, default=str)

        print(f"📋 Consolidation plan exported to: {output_file}")

    def load_plan(self, input_file: str) -> ConsolidationPlan:
        """Load consolidation plan from JSON file."""
        with open(input_file) as f:
            data = json.load(f)

        actions = [ConsolidationAction(**action_data) for action_data in data["actions"]]

        return ConsolidationPlan(
            actions=actions,
            estimated_files_removed=data["estimated_files_removed"],
            estimated_variables_deduplicated=data["estimated_variables_deduplicated"],
            safety_recommendations=data["safety_recommendations"],
            execution_order=data["execution_order"],
            timestamp=data["timestamp"]
        )


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Environment File Consolidation Planner")
    parser.add_argument("--create", action="store_true", help="Create consolidation plan")
    parser.add_argument("--report", help="Generate report from existing plan file")
    parser.add_argument("--output", help="Output file for consolidation plan")
    parser.add_argument("--safety", choices=["low", "medium", "high"], default="medium",
                       help="Safety level for consolidation")

    args = parser.parse_args()

    planner = EnvConsolidationPlanner(safety_level=args.safety)

    if args.create:
        print("📊 Analyzing environment files...")
        plan = planner.create_consolidation_plan()

        if args.output:
            planner.export_plan(plan, args.output)

        report = planner.generate_plan_report(plan)
        print(report)

    elif args.report:
        if not Path(args.report).exists():
            print(f"❌ Plan file not found: {args.report}")
            return

        plan = planner.load_plan(args.report)
        report = planner.generate_plan_report(plan)
        print(report)

    else:
        print("❌ Please specify --create or --report")


if __name__ == "__main__":
    main()
