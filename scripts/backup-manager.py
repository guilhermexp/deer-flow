#!/usr/bin/env python3
"""
Backup Management Script for Repository Cleanup
Creates and manages backups before performing cleanup operations.
"""

import hashlib
import json
import tarfile
from datetime import datetime
from pathlib import Path


class BackupManager:
    def __init__(self, repo_path: str = ".", backup_dir: str = "backups"):
        self.repo_path = Path(repo_path).resolve()
        self.backup_dir = Path(backup_dir).resolve()
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(self, targets: list[str], backup_name: str | None = None) -> str:
        """Create a backup of specified files/directories."""
        if not backup_name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"cleanup_backup_{timestamp}"

        backup_path = self.backup_dir / f"{backup_name}.tar.gz"
        metadata_path = self.backup_dir / f"{backup_name}_metadata.json"

        # Create backup archive
        with tarfile.open(backup_path, "w:gz") as tar:
            for target in targets:
                target_path = self.repo_path / target
                if target_path.exists():
                    tar.add(target_path, arcname=target)

        # Create metadata file
        metadata = {
            "backup_name": backup_name,
            "timestamp": datetime.now().isoformat(),
            "targets": targets,
            "backup_size": backup_path.stat().st_size,
            "checksum": self._calculate_checksum(backup_path),
            "repo_path": str(self.repo_path)
        }

        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

        print(f"✅ Backup created: {backup_path}")
        print(f"📊 Metadata saved: {metadata_path}")
        return str(backup_path)

    def list_backups(self) -> list[dict]:
        """List all available backups."""
        backups = []
        for metadata_file in self.backup_dir.glob("*_metadata.json"):
            try:
                with open(metadata_file) as f:
                    metadata = json.load(f)
                    backups.append(metadata)
            except (json.JSONDecodeError, FileNotFoundError):
                continue
        return sorted(backups, key=lambda x: x["timestamp"], reverse=True)

    def restore_backup(self, backup_name: str) -> bool:
        """Restore a backup to the repository."""
        backup_path = self.backup_dir / f"{backup_name}.tar.gz"
        metadata_path = self.backup_dir / f"{backup_name}_metadata.json"

        if not backup_path.exists() or not metadata_path.exists():
            print(f"❌ Backup not found: {backup_name}")
            return False

        # Load metadata
        with open(metadata_path) as f:
            metadata = json.load(f)

        # Verify checksum
        if self._calculate_checksum(backup_path) != metadata["checksum"]:
            print(f"❌ Backup integrity check failed: {backup_name}")
            return False

        # Extract backup
        with tarfile.open(backup_path, "r:gz") as tar:
            tar.extractall(self.repo_path)

        print(f"✅ Backup restored: {backup_name}")
        return True

    def cleanup_old_backups(self, keep_count: int = 5) -> None:
        """Remove old backups, keeping only the most recent ones."""
        backups = self.list_backups()
        if len(backups) <= keep_count:
            return

        for backup in backups[keep_count:]:
            backup_name = backup["backup_name"]
            backup_path = self.backup_dir / f"{backup_name}.tar.gz"
            metadata_path = self.backup_dir / f"{backup_name}_metadata.json"

            backup_path.unlink(missing_ok=True)
            metadata_path.unlink(missing_ok=True)
            print(f"🗑️  Removed old backup: {backup_name}")

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Backup Manager for Repository Cleanup")
    parser.add_argument("--action", choices=["create", "list", "restore", "cleanup"],
                       required=True, help="Action to perform")
    parser.add_argument("--targets", nargs="+", help="Files/directories to backup")
    parser.add_argument("--name", help="Backup name")
    parser.add_argument("--keep", type=int, default=5, help="Number of backups to keep")

    args = parser.parse_args()

    manager = BackupManager()

    if args.action == "create":
        if not args.targets:
            print("❌ Targets required for backup creation")
            return
        manager.create_backup(args.targets, args.name)

    elif args.action == "list":
        backups = manager.list_backups()
        print(f"\n📦 Available backups ({len(backups)}):")
        for backup in backups:
            print(f"  • {backup['backup_name']} - {backup['timestamp']}")
            print(f"    Size: {backup['backup_size']} bytes")
            print(f"    Targets: {', '.join(backup['targets'])}")

    elif args.action == "restore":
        if not args.name:
            print("❌ Backup name required for restore")
            return
        manager.restore_backup(args.name)

    elif args.action == "cleanup":
        manager.cleanup_old_backups(args.keep)


if __name__ == "__main__":
    main()
