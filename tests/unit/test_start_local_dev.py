"""Offline target-identity tests; these do not establish live browser coverage."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("startup", ROOT / ".agents/skills/start-excelsior/scripts/start_local_dev.py")
startup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(startup)

class StartupIdentityTests(unittest.TestCase):
    def test_unverified_database_prevents_api_startup(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); (root / 'frontend').mkdir(); (root / 'package.json').write_text('{}')
            with patch.object(startup.sys, 'argv', ['start_local_dev.py', str(root), '--report-dir', str(root / 'reports')]), patch.object(startup, 'port_open', return_value=False), patch.object(startup, 'database_binding', return_value={'verified': False}), patch.object(startup, 'start_process') as start:
                with self.assertRaisesRegex(RuntimeError, 'Unverified local DB'):
                    startup.main()
                start.assert_not_called()

    def test_wrong_listener_checkout_blocks_readiness(self):
        with patch.object(startup.subprocess, "run", side_effect=[SimpleNamespace(stdout="12\n12\n"), SimpleNamespace(stdout="p12\nfcwd\nn/another-checkout\n")]):
            result = startup.process_identity(5173, ROOT / "frontend")
        self.assertFalse(result["verified"])
        self.assertEqual(len(result["processes"]), 1)

    def test_url_credentials_never_enter_local_binding_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, ".env").write_text("DB_PORT=1337\n")
            env = SimpleNamespace(stdout="node DATABASE_URL=postgres://fixture:private-placeholder@127.0.0.1:15437/fixture\n")
            container = {"State": {"Running": True}, "Config": {"Env": ["POSTGRES_DB=fixture", "POSTGRES_PASSWORD=private-placeholder"]}, "NetworkSettings": {"Ports": {"5432/tcp": [{"HostPort": "15437"}]}}}
            inspected = SimpleNamespace(returncode=0, stdout=json.dumps([container]))
            with patch.object(startup.subprocess, "run", side_effect=[env, inspected]):
                result = startup.database_binding(12, Path(directory), "owned-fixture")
        self.assertTrue(result["verified"])
        self.assertEqual(result["port"], 15437)
        self.assertNotIn("private-placeholder", json.dumps(result))

    def test_nonlocal_database_is_blocked_before_container_inspection(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(startup.subprocess, "run", return_value=SimpleNamespace(stdout="node DB_HOST=remote.invalid")) as run:
                result = startup.database_binding(12, Path(directory), "owned-fixture")
        self.assertFalse(result["verified"])
        self.assertEqual(run.call_count, 1)

    def test_mismatched_database_port_does_not_pass(self):
        with tempfile.TemporaryDirectory() as directory:
            container = {"State": {"Running": True}, "Config": {"Env": ["POSTGRES_DB=overpower"]}, "NetworkSettings": {"Ports": {"5432/tcp": [{"HostPort": "1337"}]}}}
            with patch.object(startup.subprocess, "run", side_effect=[SimpleNamespace(stdout="node DB_PORT=15437"), SimpleNamespace(returncode=0, stdout=json.dumps([container]))]):
                result = startup.database_binding(12, Path(directory), "owned-fixture")
        self.assertFalse(result["verified"])

if __name__ == "__main__":
    unittest.main()
