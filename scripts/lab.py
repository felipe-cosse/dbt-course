#!/usr/bin/env python3
"""Cross-platform command runner for the dbt engineering lab.

Every subprocess is assembled from an allowlist and runs with ``shell=False``.
The wrapper deliberately does not accept arbitrary shell or dbt arguments.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
from typing import Sequence


ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "lab"
VENV = ROOT / ".venv"
COMMANDS = (
    "doctor",
    "setup",
    "quickstart",
    "services-up",
    "services-down",
    "seed",
    "run",
    "test",
    "build",
    "docs-generate",
    "docs-serve",
    "load-mysql",
    "extract-mysql",
    "build-extract",
    "postgres-build",
    "import-uci",
    "build-uci",
    "build-uci-sample",
    "generate-synthetic",
    "status",
    "clean",
)


def display_command(command: Sequence[str]) -> str:
    if os.name == "nt":
        return subprocess.list2cmdline(command)
    return shlex.join(command)


def run(command: Sequence[str], *, cwd: Path = ROOT, env: dict[str, str] | None = None) -> None:
    print(f"\n$ {display_command(command)}", flush=True)
    subprocess.run(list(command), cwd=cwd, env=env, check=True, shell=False)


def compose_command() -> list[str]:
    docker = shutil.which("docker")
    if docker:
        check = subprocess.run(
            [docker, "compose", "version"],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            shell=False,
        )
        if check.returncode == 0:
            return [docker, "compose"]
    legacy = shutil.which("docker-compose")
    if legacy:
        return [legacy]
    raise SystemExit("Docker Compose was not found. Install Docker Desktop or use --local.")


def local_python() -> str:
    candidate = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    return str(candidate if candidate.exists() else Path(sys.executable))


def local_dbt() -> str:
    candidate = VENV / ("Scripts/dbt.exe" if os.name == "nt" else "bin/dbt")
    if candidate.exists():
        return str(candidate)
    executable = shutil.which("dbt")
    if executable:
        return executable
    raise SystemExit("dbt was not found. Run `python scripts/lab.py setup --local` first.")


def local_env() -> dict[str, str]:
    env = os.environ.copy()
    env["DBT_PROFILES_DIR"] = str(LAB)
    return env


def dbt(args: Sequence[str], *, local: bool, service_ports: bool = False) -> None:
    if local:
        run([local_dbt(), *args], cwd=LAB, env=local_env())
        return
    compose = compose_command()
    options = ["run", "--rm"]
    if service_ports:
        options.append("--service-ports")
    run([*compose, *options, "dbt", *args])


def tool_script(filename: str, *, local: bool) -> None:
    if local:
        run([local_python(), str(ROOT / "scripts" / filename)], env=local_env())
        return
    run(
        [
            *compose_command(),
            "run",
            "--rm",
            "--entrypoint",
            "python",
            "dbt",
            f"/workspace/scripts/{filename}",
        ]
    )


def setup(*, local: bool) -> None:
    if local:
        if not VENV.exists():
            run([sys.executable, "-m", "venv", str(VENV)])
        run([local_python(), "-m", "pip", "install", "-r", str(ROOT / "requirements-dbt.txt")])
    else:
        run([*compose_command(), "build", "dbt"])
    dbt(["deps"], local=local)


def selected_args(selection: str | None) -> list[str]:
    return ["--select", selection] if selection else []


def doctor(*, local: bool) -> None:
    print(f"Python: {sys.version.split()[0]} ({sys.executable})")
    print(f"Project: {ROOT}")
    print(f"Execution mode: {'local virtual environment' if local else 'Docker Compose'}")
    if local:
        print(f"dbt: {shutil.which('dbt') or 'not on PATH (the wrapper also checks .venv)'}")
    else:
        print(f"Compose: {display_command(compose_command())}")
        run([*compose_command(), "config", "--quiet"])
    print("Configuration looks usable.")


def clean(*, local: bool) -> None:
    try:
        dbt(["clean"], local=local)
    except SystemExit:
        # A learner should still be able to remove generated DuckDB state before setup.
        pass
    for filename in ("warehouse.duckdb", "warehouse.duckdb.wal"):
        path = LAB / filename
        if path.exists():
            path.unlink()
            print(f"Removed {path.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=COMMANDS)
    parser.add_argument(
        "--local",
        action="store_true",
        help="Use a local .venv instead of Docker Compose.",
    )
    parser.add_argument(
        "--select",
        dest="selection",
        help="A dbt node selector used only by seed, run, test, or build.",
    )
    args = parser.parse_args()

    if args.selection and args.command not in {"seed", "run", "test", "build"}:
        parser.error("--select is supported only with seed, run, test, or build")

    selection = selected_args(args.selection)
    compose = None if args.local else compose_command

    if args.command == "doctor":
        doctor(local=args.local)
    elif args.command == "setup":
        setup(local=args.local)
    elif args.command == "quickstart":
        setup(local=args.local)
        dbt(["build"], local=args.local)
    elif args.command == "services-up":
        if args.local:
            raise SystemExit("services-up requires Docker Compose; omit --local.")
        run([*compose(), "up", "-d", "--wait", "mysql", "postgres"])
    elif args.command == "services-down":
        if args.local:
            raise SystemExit("services-down requires Docker Compose; omit --local.")
        run([*compose(), "down"])
    elif args.command in {"seed", "run", "test", "build"}:
        dbt([args.command, *selection], local=args.local)
    elif args.command == "docs-generate":
        dbt(["docs", "generate"], local=args.local)
    elif args.command == "docs-serve":
        dbt(
            ["docs", "serve", "--host", "0.0.0.0", "--port", "8080"],
            local=args.local,
            service_ports=not args.local,
        )
    elif args.command == "load-mysql":
        if args.local:
            tool_script("load_mysql.py", local=True)
        else:
            run([*compose(), "up", "-d", "--wait", "mysql"])
            tool_script("load_mysql.py", local=False)
    elif args.command == "extract-mysql":
        if args.local:
            tool_script("extract_mysql.py", local=True)
        else:
            run([*compose(), "up", "-d", "--wait", "mysql"])
            tool_script("extract_mysql.py", local=False)
    elif args.command == "build-extract":
        dbt(
            ["build", "--target", "dev", "--vars", '{"source_mode":"mysql_extract"}'],
            local=args.local,
        )
    elif args.command == "postgres-build":
        if args.local:
            dbt(["build", "--target", "postgres"], local=True)
        else:
            run([*compose(), "up", "-d", "--wait", "postgres"])
            dbt(["build", "--target", "postgres"], local=False)
    elif args.command == "import-uci":
        tool_script("import_uci.py", local=args.local)
    elif args.command == "build-uci":
        dbt(
            [
                "build",
                "--target",
                "dev",
                "--vars",
                '{"enable_uci":true}',
                "--select",
                "path:models/real_data",
            ],
            local=args.local,
        )
    elif args.command == "build-uci-sample":
        dbt(
            [
                "build",
                "--target",
                "dev",
                "--vars",
                '{"enable_uci":true,"uci_csv_path":"../data/real/uci_online_retail_sample.csv"}',
                "--select",
                "path:models/real_data",
            ],
            local=args.local,
        )
    elif args.command == "generate-synthetic":
        tool_script("generate_synthetic_data.py", local=args.local)
    elif args.command == "status":
        if args.local:
            dbt(["debug"], local=True)
        else:
            run([*compose(), "ps"])
    elif args.command == "clean":
        clean(local=args.local)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        print(f"Command failed with exit code {exc.returncode}.", file=sys.stderr)
        raise SystemExit(exc.returncode) from exc
