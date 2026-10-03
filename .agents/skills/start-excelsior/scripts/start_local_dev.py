#!/usr/bin/env python3
"""Start/reuse Excelsior local dev servers and print health status."""

from __future__ import annotations

import json
import argparse
import os
import re
import tempfile
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
FRONTEND = ROOT / "frontend"
API_HEALTH = "http://localhost:8085/health"
FRONTEND_URL = "http://localhost:5173"
REPORT_FILE = None


def port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
      sock.settimeout(0.25)
      return sock.connect_ex(("127.0.0.1", port)) == 0


def fetch(url: str, timeout: float = 2.0) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "codex-start-excelsior", "Cache-Control": "no-cache, no-store"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.status, response.read().decode("utf-8", errors="replace")


def start_process(name: str, cwd: Path) -> subprocess.Popen[str]:
    log_dir = Path("/tmp") / "excelsior-start-excelsior"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"{name}.log"
    log = log_path.open("a", encoding="utf-8")
    process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(cwd),
        stdout=log,
        stderr=subprocess.STDOUT,
        text=True,
        start_new_session=True,
    )
    print(f"Started {name} dev server (pid {process.pid}); log: {log_path}")
    return process


def wait_for_health(deadline_seconds: int = 45) -> dict:
    deadline = time.time() + deadline_seconds
    last_error = ""
    while time.time() < deadline:
        try:
            status, body = fetch(API_HEALTH, timeout=3.0)
            if status == 200:
                return json.loads(body)
            last_error = f"HTTP {status}"
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = str(exc)
        time.sleep(1)
    raise RuntimeError(f"Health check did not pass within {deadline_seconds}s: {last_error}")


def wait_for_frontend(deadline_seconds: int = 20) -> int:
    deadline = time.time() + deadline_seconds
    last_status = 0
    while time.time() < deadline:
        try:
            status, _ = fetch(FRONTEND_URL, timeout=2.0)
            return status
        except urllib.error.HTTPError as exc:
            last_status = exc.code
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(1)
    return last_status


def process_identity(port: int, expected: Path) -> dict:
    """Return safe fields only; never print process environments or command lines."""
    found = subprocess.run(["lsof", "-nP", "-t", f"-iTCP:{port}", "-sTCP:LISTEN"], capture_output=True, text=True, timeout=5)
    pids = sorted(set(int(value) for value in found.stdout.split() if value.isdigit()))
    processes = []
    for pid in pids:
        cwd = subprocess.run(["lsof", "-a", "-p", str(pid), "-d", "cwd", "-Fn"], capture_output=True, text=True, timeout=5)
        paths = [line[1:] for line in cwd.stdout.splitlines() if line.startswith("n")]
        actual = str(Path(paths[0]).resolve()) if len(paths) == 1 else None
        processes.append({"pid": pid, "cwd": actual, "matches": actual == str(expected.resolve())})
    return {"port": port, "processes": processes, "verified": bool(processes) and all(item["matches"] for item in processes)}


def database_binding(pid: int, root: Path, owner: str) -> dict:
    keys = {"DATABASE_URL", "DB_HOST", "DB_PORT", "DB_NAME"}
    values = {}
    env_file = root / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            match = re.match(r"^(?:export\s+)?([A-Z_]+)\s*=\s*(.*)$", line.strip())
            if match and match[1] in keys:
                values[match[1]] = match[2].strip().strip("\"'")
    # ps output stays private in memory. Extract only DB selectors, never credentials.
    launched = subprocess.run(["ps", "eww", "-p", str(pid), "-o", "command="], capture_output=True, text=True, timeout=5)
    for key in keys:
        match = re.search(r"(?:^|\s)" + key + r"=([^\s]+)", launched.stdout)
        if match:
            values[key] = match[1]
    if values.get("DATABASE_URL"):
        url = urlparse(values["DATABASE_URL"])
        host, port, name = url.hostname, url.port or 5432, url.path.lstrip("/")
    else:
        host, port, name = values.get("DB_HOST", "localhost"), int(values.get("DB_PORT", "1337")), values.get("DB_NAME", "overpower")
    binding = {"host": host, "port": port, "database": name, "owner": owner,
               "provenance": "listener launch settings plus checkout dotenv/defaults", "verified": False}
    if host not in {"localhost", "127.0.0.1", "::1"}:
        binding["gap"] = "Database is not loopback; no fixture operations permitted"
        return binding
    inspected = subprocess.run(["docker", "inspect", owner], capture_output=True, text=True, timeout=10)
    if inspected.returncode:
        binding["gap"] = "Selected local database container unavailable"
        return binding
    container = json.loads(inspected.stdout)[0]
    published = container.get("NetworkSettings", {}).get("Ports", {}).get("5432/tcp") or []
    env = dict(value.split("=", 1) for value in container.get("Config", {}).get("Env", []) if "=" in value)
    binding["verified"] = bool(container.get("State", {}).get("Running")) and any(int(item["HostPort"]) == port for item in published) and name == env.get("POSTGRES_DB", env.get("POSTGRES_USER", "postgres"))
    if not binding["verified"]:
        binding["gap"] = "Database launch selectors do not match the selected local container"
    return binding


def main() -> int:
    global ROOT, FRONTEND, API_HEALTH, FRONTEND_URL, REPORT_FILE
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default=str(Path.cwd()))
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--api-port", type=int, default=8085)
    parser.add_argument("--frontend-port", type=int, default=5173)
    parser.add_argument("--expected-migration")
    parser.add_argument("--database-owner", default="overpower-postgres")
    parser.add_argument("--report-dir")
    args = parser.parse_args()
    report_dir = Path(args.report_dir or tempfile.mkdtemp(prefix="excelsior-startup-"))
    report_dir.mkdir(parents=True, exist_ok=True)
    REPORT_FILE = report_dir / "startup.json"
    ROOT = Path(args.root).resolve(); FRONTEND = ROOT / "frontend"
    API_HEALTH = f"http://localhost:{args.api_port}/health"
    FRONTEND_URL = f"http://localhost:{args.frontend_port}"
    started = time.time()
    if not (ROOT / "package.json").exists() or not FRONTEND.exists():
        print(f"Not an Excelsior repo root: {ROOT}", file=sys.stderr)
        return 2

    api_running = port_open(args.api_port)
    frontend_running = port_open(args.frontend_port)
    if api_running and not process_identity(args.api_port, ROOT)["verified"]:
        raise RuntimeError("Existing API belongs to another checkout")
    if frontend_running and not process_identity(args.frontend_port, FRONTEND)["verified"]:
        raise RuntimeError("Existing frontend belongs to another checkout")
    if not api_running:
        if args.verify_only:
            raise RuntimeError("API unavailable; verify-only never starts a server")
        if args.api_port != 8085:
            raise RuntimeError("Custom ports require an already controlled isolated launch")
        if not database_binding(os.getpid(), ROOT, args.database_owner)["verified"]:
            raise RuntimeError("Unverified local DB binding; do not start an API that can migrate unknown data")
        start_process("api", ROOT)
    else:
        print(f"API listener on {args.api_port}; verifying ownership.")

    if not frontend_running:
        if args.verify_only:
            raise RuntimeError("Frontend unavailable; verify-only never starts a server")
        if args.frontend_port != 5173:
            raise RuntimeError("Custom ports require an already controlled isolated launch")
        start_process("frontend", FRONTEND)
    else:
        print(f"Frontend listener on {args.frontend_port}; verifying ownership.")

    health = wait_for_health()
    frontend_status = wait_for_frontend()
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    api = process_identity(args.api_port, ROOT)
    frontend = process_identity(args.frontend_port, FRONTEND)
    binding = database_binding(api["processes"][0]["pid"], ROOT, args.database_owner) if api["verified"] else {"verified": False, "gap": "API checkout mismatch"}
    migration = args.expected_migration or str(max(int(re.match(r"V(\d+)__", path.name)[1]) for path in (ROOT / "migrations").glob("V*__*.sql")))
    report_file = REPORT_FILE
    helper_root = Path(__file__).resolve().parents[4]
    target = subprocess.run(["node", str(helper_root / "scripts/browser-test-target.mjs"), "--mode", "local", "--source-root", str(ROOT),
        "--api", API_HEALTH.removesuffix("/health"), "--frontend", FRONTEND_URL, "--expected-revision", revision, "--expected-migration", migration], capture_output=True, text=True, timeout=40)
    target_report = json.loads(target.stdout) if target.returncode == 0 else {"verified": False, "gap": "Health/proxy/revision/migration verification failed"}
    passed = api["verified"] and frontend["verified"] and binding["verified"] and target_report.get("verified", False) and health.get("database", {}).get("status") == "OK" and frontend_status == 200
    report = {"schema": 1, "kind": "startup", "environment": "local", "status": "passed" if passed else "blocked", "sourceRevision": revision,
        "target": target_report, "processes": {"api": api, "frontend": frontend}, "databaseBinding": binding,
        "durationSeconds": round(time.time() - started, 2), "cleanup": "existing servers preserved", "gaps": [] if passed else ["Target identity must be resolved before fixtures or browser acceptance"]}
    report_file.write_text(json.dumps(report, indent=2) + "\n"); os.chmod(report_file, 0o600)
    print(json.dumps({"status": report["status"], "sourceRevision": revision, "api": API_HEALTH, "frontend": FRONTEND_URL, "receipt": str(report_file)}))
    return 0 if passed else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError, subprocess.SubprocessError) as error:
        blocked = {"schema": 1, "kind": "startup", "environment": "local", "status": "blocked", "errorCategory": type(error).__name__,
                   "gaps": ["Target readiness/identity unavailable; no browser acceptance or fixture permission"], "cleanup": "existing servers preserved; inspect any newly started processes"}
        if REPORT_FILE:
            REPORT_FILE.write_text(json.dumps(blocked, indent=2) + "\n"); os.chmod(REPORT_FILE, 0o600)
        print(json.dumps({"status": "blocked", "errorCategory": type(error).__name__, "receipt": str(REPORT_FILE) if REPORT_FILE else None}), file=sys.stderr)
        raise SystemExit(1)
