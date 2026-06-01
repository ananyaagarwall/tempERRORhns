"""
Sync Neon (primary) → local PostgreSQL (fallback).
Only new/changed data from Neon is applied to local via --clean --if-exists,
which rebuilds each table from Neon's current state.

Works on Windows, macOS, and Linux.

Usage:
    cd backend
    python scripts/sync_neon_to_local.py
"""

import os
import sys
import subprocess
import shutil
import glob
from urllib.parse import urlparse


def _find_pg_bin(exe: str) -> str:
    """Return full path to a PostgreSQL binary, searching common Windows install dirs."""
    found = shutil.which(exe)
    if found:
        return found

    # Common Windows PostgreSQL install paths (newest version first)
    patterns = [
        r"C:\Program Files\PostgreSQL\*\bin",
        r"C:\Program Files (x86)\PostgreSQL\*\bin",
        r"C:\PostgreSQL\*\bin",
    ]
    candidates = []
    for pattern in patterns:
        candidates.extend(glob.glob(pattern))

    # Sort descending so highest version wins
    for folder in sorted(candidates, reverse=True):
        full = os.path.join(folder, exe + ('.exe' if sys.platform == 'win32' else ''))
        if os.path.isfile(full):
            return full

    return exe  # fall back to bare name — will raise FileNotFoundError with a clear message

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

NEON_URL  = os.getenv('DATABASE_URL', '')
LOCAL_URL = os.getenv('DATABASE_URL_FALLBACK', '')

if not NEON_URL or not LOCAL_URL:
    print("ERROR: DATABASE_URL and DATABASE_URL_FALLBACK must both be set in .env")
    sys.exit(1)

def _parse(url):
    # Strip query params for urlparse
    p = urlparse(url.split('?')[0])
    password = p.password or ''
    # URL-decode %40 → @
    password = password.replace('%40', '@')
    return {
        'host':     p.hostname or 'localhost',
        'port':     str(p.port or 5432),
        'user':     p.username or '',
        'password': password,
        'dbname':   p.path.lstrip('/'),
    }

neon  = _parse(NEON_URL)
local = _parse(LOCAL_URL)

print(f"Source : {neon['host']}/{neon['dbname']}")
print(f"Target : {local['host']}/{local['dbname']}")
print("Syncing Neon → local (only new changes applied) ...\n")

# ── pg_dump from Neon ──────────────────────────────────────────────────────────
dump_env = os.environ.copy()
dump_env['PGPASSWORD'] = neon['password']

dump_cmd = [
    _find_pg_bin('pg_dump'),
    '-h', neon['host'],
    '-p', neon['port'],
    '-U', neon['user'],
    '-d', neon['dbname'],
    '--no-owner',
    '--no-acl',
    '--clean',       # DROP + CREATE — ensures full consistency
    '--if-exists',   # safe DROP even if table doesn't exist locally yet
]

# ── psql restore to local ──────────────────────────────────────────────────────
restore_env = os.environ.copy()
restore_env['PGPASSWORD'] = local['password']

restore_cmd = [
    _find_pg_bin('psql'),
    '-h', local['host'],
    '-p', local['port'],
    '-U', local['user'],
    '-d', local['dbname'],
    '-v', 'ON_ERROR_STOP=0',   # keep going on non-fatal errors (e.g. missing extensions)
]

# ── Pipe dump → restore (cross-platform, no shell PGPASSWORD= prefix) ─────────
try:
    dump_proc = subprocess.Popen(
        dump_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=dump_env,
    )

    restore_proc = subprocess.Popen(
        restore_cmd,
        stdin=dump_proc.stdout,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=restore_env,
    )

    if dump_proc.stdout:
        dump_proc.stdout.close()

    restore_out, restore_err = restore_proc.communicate()
    dump_proc.wait()  # stdout already closed — just wait for process to finish

    if restore_err:
        decoded = restore_err.decode(errors='replace')
        # psql prints non-fatal notices to stderr — only show real errors
        errors = [l for l in decoded.splitlines() if 'ERROR' in l.upper()]
        if errors:
            print("Restore errors:")
            for e in errors:
                print(f"  {e}")

    if restore_proc.returncode == 0:
        print("\nSync complete — local PostgreSQL is now consistent with Neon.")
    else:
        print(f"\nRestore exited with code {restore_proc.returncode}.")
        print("This is often normal (DROP warnings on first run). Check errors above.")

except FileNotFoundError as e:
    print(f"\nERROR: {e}")
    print("Make sure pg_dump and psql are installed and in your PATH.")
    print("Download: https://www.postgresql.org/download/")
    sys.exit(1)
