#!/usr/bin/env python3
"""
Backup Verification System for Repository Cleanup
Verifies backup integrity and provides restoration validation.
"""

import hashlib
import json
import shutil
import tarfile
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class VerificationResult:
    """Result of backup verification."""
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    metadata: dict[str, Any] | None = None


class BackupVerifier:
    def __init__(self, backup_dir: str = "backups"):
        self.backup_dir = Path(backup_dir).resolve()

    def verify_backup(self, backup_name: str) -> VerificationResult:
        """Comprehensive verification of a backup."""
        backup_path = self.backup_dir / f"{backup_name}.tar.gz"
        metadata_path = self.backup_dir / f"{backup_name}_metadata.json"

        errors = []
        warnings = []
        metadata = None

        # Check if files exist
        if not backup_path.exists():
            errors.append(f"Backup file not found: {backup_path}")

        if not metadata_path.exists():
            errors.append(f"Metadata file not found: {metadata_path}")

        if errors:
            return VerificationResult(False, errors, warnings)

        # Load and validate metadata
        try:
            with open(metadata_path) as f:
                metadata = json.load(f)
        except json.JSONDecodeError as e:
            errors.append(f"Invalid metadata JSON: {e}")
            return VerificationResult(False, errors, warnings)

        # Verify required metadata fields
        required_fields = ["backup_name", "timestamp", "targets", "backup_size", "checksum", "repo_path"]
        for field in required_fields:
            if field not in metadata:
                errors.append(f"Missing metadata field: {field}")

        # Verify backup file size
        actual_size = backup_path.stat().st_size
        expected_size = metadata.get("backup_size", 0)
        if actual_size != expected_size:
            errors.append(f"Size mismatch: expected {expected_size}, got {actual_size}")

        # Verify checksum
        actual_checksum = self._calculate_checksum(backup_path)
        expected_checksum = metadata.get("checksum", "")
        if actual_checksum != expected_checksum:
            errors.append("Checksum mismatch: backup may be corrupted")

        # Verify archive integrity
        try:
            with tarfile.open(backup_path, "r:gz") as tar:
                # Check if all expected targets are in the archive
                archive_members = {member.name for member in tar.getmembers()}
                expected_targets = set(metadata.get("targets", []))

                missing_targets = expected_targets - archive_members
                if missing_targets:
                    warnings.append(f"Missing targets in archive: {missing_targets}")

                # Test extraction to temporary directory
                with tempfile.TemporaryDirectory() as temp_dir:
                    tar.extractall(temp_dir)

        except (tarfile.TarError, OSError) as e:
            errors.append(f"Archive corruption or extraction failed: {e}")

        is_valid = len(errors) == 0
        return VerificationResult(is_valid, errors, warnings, metadata)

    def verify_all_backups(self) -> dict[str, VerificationResult]:
        """Verify all backups in the backup directory."""
        results = {}

        for metadata_file in self.backup_dir.glob("*_metadata.json"):
            backup_name = metadata_file.stem.replace("_metadata", "")
            results[backup_name] = self.verify_backup(backup_name)

        return results

    def test_restoration(self, backup_name: str, test_dir: str | None = None) -> VerificationResult:
        """Test restoration of a backup to a temporary directory."""
        if test_dir:
            test_path = Path(test_dir)
            test_path.mkdir(parents=True, exist_ok=True)
            cleanup_test_dir = False
        else:
            test_path = Path(tempfile.mkdtemp(prefix="backup_test_"))
            cleanup_test_dir = True

        errors = []
        warnings = []

        try:
            # First verify the backup
            verify_result = self.verify_backup(backup_name)
            if not verify_result.is_valid:
                errors.extend(verify_result.errors)
                return VerificationResult(False, errors, warnings)

            backup_path = self.backup_dir / f"{backup_name}.tar.gz"

            # Extract to test directory
            with tarfile.open(backup_path, "r:gz") as tar:
                tar.extractall(test_path)

            # Verify extracted files
            metadata = verify_result.metadata
            if metadata:
                for target in metadata.get("targets", []):
                    target_path = test_path / target
                    if not target_path.exists():
                        errors.append(f"Failed to extract target: {target}")

            print(f"✅ Test restoration successful to: {test_path}")

        except Exception as e:
            errors.append(f"Restoration test failed: {e}")

        finally:
            if cleanup_test_dir and test_path.exists():
                shutil.rmtree(test_path)

        is_valid = len(errors) == 0
        return VerificationResult(is_valid, errors, warnings)

    def generate_verification_report(self) -> str:
        """Generate a comprehensive verification report."""
        results = self.verify_all_backups()

        report_lines = [
            "# Backup Verification Report",
            f"Generated: {self._get_timestamp()}",
            f"Backup Directory: {self.backup_dir}",
            "",
            "## Summary",
            f"Total Backups: {len(results)}",
            f"Valid Backups: {sum(1 for r in results.values() if r.is_valid)}",
            f"Invalid Backups: {sum(1 for r in results.values() if not r.is_valid)}",
            ""
        ]

        # Valid backups
        valid_backups = {name: result for name, result in results.items() if result.is_valid}
        if valid_backups:
            report_lines.extend([
                "## Valid Backups",
                ""
            ])
            for name, result in valid_backups.items():
                metadata = result.metadata or {}
                size_mb = metadata.get("backup_size", 0) / (1024 * 1024)
                report_lines.extend([
                    f"### {name}",
                    f"- Timestamp: {metadata.get('timestamp', 'Unknown')}",
                    f"- Size: {size_mb:.2f} MB",
                    f"- Targets: {len(metadata.get('targets', []))}",
                    ""
                ])

        # Invalid backups
        invalid_backups = {name: result for name, result in results.items() if not result.is_valid}
        if invalid_backups:
            report_lines.extend([
                "## Invalid Backups",
                ""
            ])
            for name, result in invalid_backups.items():
                report_lines.extend([
                    f"### {name}",
                    "**Errors:**"
                ])
                for error in result.errors:
                    report_lines.append(f"- {error}")

                if result.warnings:
                    report_lines.append("**Warnings:**")
                    for warning in result.warnings:
                        report_lines.append(f"- {warning}")
                report_lines.append("")

        return "\n".join(report_lines)

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Backup Verification System")
    parser.add_argument("--action", choices=["verify", "test-restore", "report"],
                       required=True, help="Action to perform")
    parser.add_argument("--backup", help="Specific backup to verify/test")
    parser.add_argument("--test-dir", help="Directory for test restoration")
    parser.add_argument("--output", help="Output file for report")

    args = parser.parse_args()

    verifier = BackupVerifier()

    if args.action == "verify":
        if args.backup:
            result = verifier.verify_backup(args.backup)
            if result.is_valid:
                print(f"✅ Backup {args.backup} is valid")
            else:
                print(f"❌ Backup {args.backup} is invalid:")
                for error in result.errors:
                    print(f"  • {error}")
        else:
            results = verifier.verify_all_backups()
            valid_count = sum(1 for r in results.values() if r.is_valid)
            print(f"📊 Verified {len(results)} backups: {valid_count} valid, {len(results) - valid_count} invalid")

    elif args.action == "test-restore":
        if not args.backup:
            print("❌ Backup name required for test restoration")
            return

        result = verifier.test_restoration(args.backup, args.test_dir)
        if result.is_valid:
            print(f"✅ Test restoration successful for {args.backup}")
        else:
            print(f"❌ Test restoration failed for {args.backup}:")
            for error in result.errors:
                print(f"  • {error}")

    elif args.action == "report":
        report = verifier.generate_verification_report()
        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"📄 Verification report saved to: {args.output}")
        else:
            print(report)


if __name__ == "__main__":
    main()
