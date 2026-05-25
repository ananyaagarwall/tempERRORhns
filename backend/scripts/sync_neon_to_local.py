"""
Dump Neon (primary) → local PostgreSQL (fallback) to keep both in sync.

Usage:
    cd backend
    python scripts/sync_neon_to_local.py
"""

import os
import subprocess
import sys
from urllib.parse import urlparse

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
    p = urlparse(url)
    return {
        'host':     p.hostname,
        'port':     str(p.port or 5432),
        'user':     p.username,
        'password': p.password,
        'dbname':   p.path.lstrip('/').split('?')[0],
    }

neon  = _parse(NEON_URL)
local = _parse(LOCAL_URL)

print(f"Source : {neon['host']}/{neon['dbname']}")
print(f"Target : {local['host']}/{local['dbname']}")
print("Dumping from Neon and restoring to local ...\n")

env = os.environ.copy()
env['PGPASSWORD'] = neon['password'] or ''

dump_cmd = [
    'pg_dump',
    '-h', neon['host'],
    '-p', neon['port'],
    '-U', neon['user'],
    '-d', neon['dbname'],
    '--no-owner', '--no-acl', '--clean', '--if-exists',
    '--no-password',
]
# append sslmode for Neon
dump_cmd += [f'--dbname=sslmode=require']

# Build full dump command piped into psql
restore_env = os.environ.copy()
restore_env['PGPASSWORD'] = local['password'] or ''

restore_cmd = [
    'psql',
    '-h', local['host'],
    '-p', local['port'],
    '-U', local['user'],
    '-d', local['dbname'],
    '--no-password',
]

# Run as a shell pipeline
shell_cmd = (
    f'PGPASSWORD="{neon["password"]}" pg_dump '
    f'-h {neon["host"]} -p {neon["port"]} -U {neon["user"]} -d {neon["dbname"]} '
    f'--no-owner --no-acl --clean --if-exists '
    f'| PGPASSWORD="{local["password"]}" psql '
    f'-h {local["host"]} -p {local["port"]} -U {local["user"]} -d {local["dbname"]}'
)

result = subprocess.run(shell_cmd, shell=True)

if result.returncode == 0:
    print("\nSync complete — local PostgreSQL is now in sync with Neon.")
else:
    print(f"\nSync failed (exit code {result.returncode}). Check pg_dump/psql output above.")
    sys.exit(result.returncode)
