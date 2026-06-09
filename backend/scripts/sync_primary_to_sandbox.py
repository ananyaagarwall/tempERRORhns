"""
Sync primary Neon DB → sandbox Neon DB (one-way, destructive on sandbox).

The sandbox is a safe space to experiment — schema changes, data tests,
new features — without touching production.

Usage:
    cd backend
    python scripts/sync_primary_to_sandbox.py

WARNING: This OVERWRITES all data in DATABASE_URL_SANDBOX with the current
         state of DATABASE_URL (primary). Run only when you want a fresh copy.
"""

import os
import sys
import subprocess
import shutil
import glob
from urllib.parse import urlparse


def _find_pg_bin(exe: str) -> str:
    found = shutil.which(exe)
    if found:
        return found
    patterns = [
        r"C:\Program Files\PostgreSQL\*\bin",
        r"C:\Program Files (x86)\PostgreSQL\*\bin",
        r"C:\PostgreSQL\*\bin",
    ]
    candidates = []
    for pattern in patterns:
        candidates.extend(glob.glob(pattern))
    for folder in sorted(candidates, reverse=True):
        full = os.path.join(folder, exe + ('.exe' if sys.platform == 'win32' else ''))
        if os.path.isfile(full):
            return full
    return exe


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

PRIMARY_URL = os.getenv('DATABASE_URL', '')
SANDBOX_URL = os.getenv('DATABASE_URL_CHILD', '')

if not PRIMARY_URL:
    print("ERROR: DATABASE_URL (primary) not set in .env")
    sys.exit(1)
if not SANDBOX_URL:
    print("ERROR: DATABASE_URL_CHILD not set in .env")
    sys.exit(1)


def _parse(url):
    p = urlparse(url.split('?')[0])
    password = (p.password or '').replace('%40', '@')
    return {
        'host':    p.hostname or 'localhost',
        'port':    str(p.port or 5432),
        'user':    p.username or '',
        'password': password,
        'dbname':  p.path.lstrip('/'),
    }


src = _parse(PRIMARY_URL)
dst = _parse(SANDBOX_URL)

print(f"Source  (primary) : {src['host']}/{src['dbname']}")
print(f"Target  (sandbox) : {dst['host']}/{dst['dbname']}")
print()
print("WARNING: All sandbox data will be replaced with primary data.")
confirm = input("Type 'yes' to continue: ").strip().lower()
if confirm != 'yes':
    print("Aborted.")
    sys.exit(0)

print("\nDumping from primary...")

dump_env = os.environ.copy()
dump_env['PGPASSWORD'] = src['password']

dump_cmd = [
    _find_pg_bin('pg_dump'),
    '-h', src['host'],
    '-p', src['port'],
    '-U', src['user'],
    '-d', src['dbname'],
    '--no-owner',
    '--no-acl',
    '--clean',
    '--if-exists',
]

restore_env = os.environ.copy()
restore_env['PGPASSWORD'] = dst['password']

restore_cmd = [
    _find_pg_bin('psql'),
    '-h', dst['host'],
    '-p', dst['port'],
    '-U', dst['user'],
    '-d', dst['dbname'],
    '-v', 'ON_ERROR_STOP=0',
]

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
    dump_proc.wait()

    if restore_err:
        decoded = restore_err.decode(errors='replace')
        errors = [l for l in decoded.splitlines() if 'ERROR' in l.upper()]
        if errors:
            print("Restore warnings/errors:")
            for e in errors:
                print(f"  {e}")

    if restore_proc.returncode == 0:
        print("\nDone — sandbox is now a fresh copy of primary.")
    else:
        print(f"\nRestore exited with code {restore_proc.returncode}.")
        print("DROP warnings on first run are normal. Check errors above.")

except FileNotFoundError as e:
    print(f"\nERROR: {e}")
    print("Make sure pg_dump and psql are installed and in your PATH.")
    sys.exit(1)
