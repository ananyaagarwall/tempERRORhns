"""
dedupe_pg_entities.py
--------------------
Deduplicate rows in Postgres `property` and `builder` tables, and fix up foreign
key references to the kept rows.

This script is intentionally conservative by default:
  - Property dedupe:
      1) If `RERA_ID` is present: dedupe by (user_id, normalized RERA_ID)
      2) Else: dedupe by (user_id, normalized Property_Name, normalized Location, normalized Address)
  - Builder dedupe:
      1) If duplicate rera_id rows exist: dedupe by normalized rera_id
      2) (Optional) dedupe by normalized company_name with --builders-by-name

It keeps the "best" row per duplicate group based on:
  - highest completeness score (non-empty columns)
  - lowest primary key as final tie-breaker

Usage:
  python backend/scripts/dedupe_pg_entities.py
  python backend/scripts/dedupe_pg_entities.py postgresql://user:pass@host/db
  python backend/scripts/dedupe_pg_entities.py --apply
  python backend/scripts/dedupe_pg_entities.py --apply --builders-by-name

Notes:
  - Default mode is a dry-run (no changes). Use --apply to commit.
  - Uses DATABASE_URL (env or backend/.env) if no URL is passed.
"""

from __future__ import annotations

import argparse
import os
import sys
from urllib.parse import unquote, urlparse


def _resolve_database_url(positional_url: str | None) -> str:
    db_url = positional_url or os.environ.get("DATABASE_URL")

    if not db_url:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path, encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if line.startswith("DATABASE_URL"):
                        _, _, value = line.partition("=")
                        db_url = value.strip().strip('"').strip("'")
                        break

    if not db_url:
        raise SystemExit(
            "Could not find DATABASE_URL. Pass it as a positional arg or set env var."
        )

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    return db_url


def _connect(db_url: str):
    try:
        import psycopg2
    except Exception as exc:  # pragma: no cover
        raise SystemExit(f"psycopg2 is required: {exc}") from exc

    parsed = urlparse(db_url)
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        dbname=parsed.path.lstrip("/"),
        user=unquote(parsed.username or ""),
        password=unquote(parsed.password or ""),
        connect_timeout=20,
    )
    conn.autocommit = False
    cur = conn.cursor()
    cur.execute("SET lock_timeout = '10s';")
    cur.execute("SET statement_timeout = '120s';")
    return conn, cur


def _to_regclass(cur, table_name: str) -> str | None:
    cur.execute("SELECT to_regclass(%s)", (f"public.{table_name}",))
    row = cur.fetchone()
    return row[0] if row else None


def _pick_existing_table(cur, candidates: list[str]) -> str | None:
    for candidate in candidates:
        if _to_regclass(cur, candidate):
            return candidate
    return None


def _columns(cur, table_name: str) -> set[str]:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        """,
        (table_name,),
    )
    return {row[0] for row in cur.fetchall()}


def _has_column(cur, table_name: str, column_name: str) -> bool:
    return column_name in _columns(cur, table_name)


def _quote_ident(name: str) -> str:
    # Quote identifiers to support mixed-case SQLAlchemy columns like "RERA_ID".
    return '"' + name.replace('"', '""') + '"'


def _normalized_expr(column_sql: str) -> str:
    # Remove punctuation/whitespace differences and compare case-insensitively.
    return (
        "regexp_replace(lower(btrim(coalesce("
        + column_sql
        + "::text,''))), '[^a-z0-9]+', '', 'g')"
    )


def _non_empty_score_expr(columns: list[str]) -> str:
    # Count columns that are non-null and non-empty once cast to text.
    parts = []
    for column_sql in columns:
        parts.append(
            f"CASE WHEN NULLIF(btrim(coalesce({column_sql}::text,'')), '') IS NULL THEN 0 ELSE 1 END"
        )
    if not parts:
        return "0"
    return " + ".join(parts)


def _count_duplicates(cur, table: str, key_expr: str) -> int:
    cur.execute(
        f"""
        WITH grouped AS (
          SELECT {key_expr} AS k, COUNT(*) AS c
          FROM {_quote_ident(table)}
          GROUP BY {key_expr}
        )
        SELECT COALESCE(SUM(CASE WHEN c > 1 THEN c - 1 ELSE 0 END), 0)::int
        FROM grouped
        """
    )
    return int(cur.fetchone()[0])


def _create_mapping_temp_table(cur, temp_name: str):
    cur.execute(f"DROP TABLE IF EXISTS {temp_name};")
    cur.execute(f"CREATE TEMP TABLE {temp_name} (dup_id TEXT NOT NULL, keep_id TEXT NOT NULL);")


def _fill_mapping(cur, *, temp_name: str, table: str, pk_col: str, key_expr: str, score_expr: str):
    pk_sql = _quote_ident(pk_col)
    cur.execute(
        f"""
        INSERT INTO {temp_name} (dup_id, keep_id)
        WITH ranked AS (
          SELECT
            {pk_sql}::text AS pk,
            {key_expr} AS k,
            ({score_expr})::int AS score,
            row_number() OVER (
              PARTITION BY {key_expr}
              ORDER BY ({score_expr}) DESC, {pk_sql} ASC
            ) AS rn,
            first_value({pk_sql}::text) OVER (
              PARTITION BY {key_expr}
              ORDER BY ({score_expr}) DESC, {pk_sql} ASC
            ) AS keep_pk
          FROM {_quote_ident(table)}
          WHERE {key_expr} IS NOT NULL AND {key_expr} <> ''
        )
        SELECT pk, keep_pk
        FROM ranked
        WHERE rn > 1
        """
    )


def _execute(cur, sql: str, label: str):
    cur.execute(sql)
    # Rowcount for DELETE in Postgres can be -1 depending on driver, so avoid relying on it.
    print(f"  - {label}")


def _dedupe_builders(cur, *, apply: bool, builders_by_name: bool) -> None:
    builder_table = _pick_existing_table(cur, ["builder", "builders"])
    if not builder_table:
        print("Builders table not found (tried: builder, builders). Skipping builders.")
        return

    cols = _columns(cur, builder_table)
    if "rera_id" not in cols:
        print(f"Builders table `{builder_table}` has no rera_id column; skipping builders.")
        return

    pk_col = "rera_id"
    table_sql = _quote_ident(builder_table)

    builder_score_cols = [
        "company_name",
        "brand_name",
        "established_year",
        "builder_type",
        "rera_registered",
        "corporate_address",
        "city",
        "state",
        "pin_code",
        "contact_email",
        "contact_number",
        "website_url",
        "builder_logo",
        "cover_banner",
        "certificates",
        "location",
        "short_description",
        "detailed_description",
        "completed_projects",
        "ongoing_projects",
        "awards",
        "verified",
    ]
    builder_score_cols_sql = [_quote_ident(name) for name in builder_score_cols if name in cols]
    score_expr = _non_empty_score_expr(builder_score_cols_sql)

    # Strategy 1: dedupe by rera_id (only if duplicates exist).
    key_expr_rera = _normalized_expr(_quote_ident("rera_id"))
    dup_count = _count_duplicates(cur, builder_table, key_expr_rera)
    print(f"Builders: found {dup_count} duplicate row(s) by rera_id in `{builder_table}`.")

    if dup_count:
        temp_name = "tmp_builder_dedupe"
        _create_mapping_temp_table(cur, temp_name)
        _fill_mapping(
            cur,
            temp_name=temp_name,
            table=builder_table,
            pk_col=pk_col,
            key_expr=key_expr_rera,
            score_expr=score_expr,
        )

        cur.execute(f"SELECT COUNT(*) FROM {temp_name}")
        mapping_rows = int(cur.fetchone()[0])
        print(f"Builders: would merge/delete {mapping_rows} row(s).")

        if apply and mapping_rows:
            # Fix up builder_project foreign keys.
            if _to_regclass(cur, "builder_project"):
                _execute(
                    cur,
                    f"""
                    UPDATE builder_project bp
                    SET builder_id = m.keep_id
                    FROM {temp_name} m
                    WHERE bp.builder_id::text = m.dup_id
                    """,
                    "Updated builder_project.builder_id to kept builder",
                )

            _execute(
                cur,
                f"""
                DELETE FROM {table_sql} b
                USING {temp_name} m
                WHERE b.{_quote_ident(pk_col)}::text = m.dup_id
                """,
                "Deleted duplicate builder rows",
            )

    # Strategy 2 (optional): dedupe by company_name.
    if not builders_by_name:
        return

    if "company_name" not in cols:
        print(f"Builders table `{builder_table}` has no company_name column; skipping name-based dedupe.")
        return

    key_expr_name = _normalized_expr(_quote_ident("company_name"))
    dup_by_name = _count_duplicates(cur, builder_table, key_expr_name)
    print(f"Builders: found {dup_by_name} duplicate row(s) by company_name in `{builder_table}`.")
    if not dup_by_name:
        return

    temp_name = "tmp_builder_name_dedupe"
    _create_mapping_temp_table(cur, temp_name)
    _fill_mapping(
        cur,
        temp_name=temp_name,
        table=builder_table,
        pk_col=pk_col,
        key_expr=key_expr_name,
        score_expr=score_expr,
    )

    cur.execute(f"SELECT COUNT(*) FROM {temp_name}")
    mapping_rows = int(cur.fetchone()[0])
    print(f"Builders: would merge/delete {mapping_rows} row(s) by company_name.")

    if apply and mapping_rows:
        if _to_regclass(cur, "builder_project"):
            _execute(
                cur,
                f"""
                UPDATE builder_project bp
                SET builder_id = m.keep_id
                FROM {temp_name} m
                WHERE bp.builder_id::text = m.dup_id
                """,
                "Updated builder_project.builder_id for name-based dedupe",
            )

        _execute(
            cur,
            f"""
            DELETE FROM {table_sql} b
            USING {temp_name} m
            WHERE b.{_quote_ident(pk_col)}::text = m.dup_id
            """,
            "Deleted duplicate builder rows (name-based)",
        )


def _dedupe_properties(cur, *, apply: bool) -> None:
    property_table = _pick_existing_table(cur, ["property", "properties"])
    if not property_table:
        print("Property table not found (tried: property, properties). Skipping properties.")
        return

    cols = _columns(cur, property_table)
    if "id" not in cols:
        print(f"Property table `{property_table}` has no id column; skipping properties.")
        return

    pk_col = "id"
    table_sql = _quote_ident(property_table)

    # Build a conservative key:
    # - Prefer (user_id + normalized RERA_ID) when RERA_ID exists/non-empty
    # - Else (user_id + normalized Property_Name + Location + Address)
    has_user_id = "user_id" in cols
    has_rera = "RERA_ID" in cols
    name_col = "Property_Name" if "Property_Name" in cols else None
    location_col = "Location" if "Location" in cols else None
    address_col = "Address" if "Address" in cols else None

    user_prefix = ""
    if has_user_id:
        user_prefix = f"coalesce({_quote_ident('user_id')}::text,'') || '|' || "

    rera_norm = _normalized_expr(_quote_ident("RERA_ID")) if has_rera else "''"
    name_norm = _normalized_expr(_quote_ident(name_col)) if name_col else "''"
    loc_norm = _normalized_expr(_quote_ident(location_col)) if location_col else "''"
    addr_norm = _normalized_expr(_quote_ident(address_col)) if address_col else "''"

    core_fallback = f"{name_norm} || '|' || {loc_norm} || '|' || {addr_norm}"
    core_expr = (
        f"CASE WHEN NULLIF(btrim(coalesce({_quote_ident('RERA_ID')}::text,'')), '') IS NOT NULL "
        f"THEN {rera_norm} ELSE ({core_fallback}) END"
        if has_rera
        else f"({core_fallback})"
    )
    key_expr = user_prefix + core_expr

    property_score_cols = [
        "Property_Name",
        "Location",
        "Carpet_Area",
        "Price_Starting_From",
        "Pricing",
        "Highlights",
        "Extra_Charges",
        "Builder_Name",
        "Builder_Details",
        "Existing_Configurations",
        "Built_up_Area",
        "Main_Door_Facing",
        "Ceiling_Height",
        "Kitchen",
        "Key_Highlights",
        "Address",
        "Flat_Details",
        "Loan_Availability",
        "Approved_by_Authorities",
        "Project_Status",
        "Possession_Date",
        "RERA_ID",
        "Vastu_Compliant",
        "Parking",
        "Lift_Availability",
        "Security",
        "Connectivity",
        "project_id",
        "created_at",
    ]
    property_score_cols_sql = [_quote_ident(name) for name in property_score_cols if name in cols]
    score_expr = _non_empty_score_expr(property_score_cols_sql)

    dup_count = _count_duplicates(cur, property_table, key_expr)
    print(f"Properties: found {dup_count} duplicate row(s) in `{property_table}` by conservative key.")
    if not dup_count:
        return

    temp_name = "tmp_property_dedupe"
    _create_mapping_temp_table(cur, temp_name)
    _fill_mapping(
        cur,
        temp_name=temp_name,
        table=property_table,
        pk_col=pk_col,
        key_expr=key_expr,
        score_expr=score_expr,
    )

    cur.execute(f"SELECT COUNT(*) FROM {temp_name}")
    mapping_rows = int(cur.fetchone()[0])
    print(f"Properties: would merge/delete {mapping_rows} row(s).")

    if not apply or not mapping_rows:
        return

    # Fix up FK references.
    fk_tables = [
        ("enquiry", "property_id"),
        ("review", "property_id"),
        ("user_interaction", "property_id"),
        ("favorite", "property_id"),
    ]
    for fk_table, fk_column in fk_tables:
        if not _to_regclass(cur, fk_table):
            continue
        if not _has_column(cur, fk_table, fk_column):
            continue
        _execute(
            cur,
            f"""
            UPDATE {_quote_ident(fk_table)} t
            SET {_quote_ident(fk_column)} = m.keep_id::int
            FROM {temp_name} m
            WHERE t.{_quote_ident(fk_column)}::text = m.dup_id
            """,
            f"Updated {fk_table}.{fk_column} to kept property",
        )

    _execute(
        cur,
        f"""
        DELETE FROM {table_sql} p
        USING {temp_name} m
        WHERE p.{_quote_ident(pk_col)}::text = m.dup_id
        """,
        "Deleted duplicate property rows",
    )


def _add_unique_indexes(cur, *, apply: bool) -> None:
    if not apply:
        return

    builder_table = _pick_existing_table(cur, ["builder", "builders"])
    if builder_table:
        builder_cols = _columns(cur, builder_table)
        if "rera_id" in builder_cols:
            _execute(
                cur,
                f"""
                CREATE UNIQUE INDEX IF NOT EXISTS ux_{builder_table}_rera_norm
                ON {_quote_ident(builder_table)} (lower(btrim({_quote_ident('rera_id')}::text)))
                WHERE {_quote_ident('rera_id')} IS NOT NULL AND btrim({_quote_ident('rera_id')}::text) <> ''
                """,
                f"Ensured unique index on {builder_table}.rera_id (normalized)",
            )

    property_table = _pick_existing_table(cur, ["property", "properties"])
    if property_table:
        property_cols = _columns(cur, property_table)
        if "user_id" in property_cols and "RERA_ID" in property_cols:
            _execute(
                cur,
                f"""
                CREATE UNIQUE INDEX IF NOT EXISTS ux_{property_table}_user_rera_norm
                ON {_quote_ident(property_table)} ({_quote_ident('user_id')}, lower(btrim({_quote_ident('RERA_ID')}::text)))
                WHERE {_quote_ident('RERA_ID')} IS NOT NULL AND btrim({_quote_ident('RERA_ID')}::text) <> ''
                """,
                f"Ensured unique index on {property_table}.(user_id, RERA_ID) (normalized)",
            )


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Deduplicate Postgres property and builder tables.")
    parser.add_argument("db_url", nargs="?", default=None, help="Optional DATABASE_URL")
    parser.add_argument("--apply", action="store_true", help="Commit changes (default is dry-run)")
    parser.add_argument(
        "--builders-by-name",
        action="store_true",
        help="Also dedupe builders by normalized company_name (higher risk)",
    )
    parser.add_argument(
        "--add-unique-indexes",
        action="store_true",
        help="Add unique indexes after dedupe to prevent re-duplication (only with --apply)",
    )
    args = parser.parse_args(argv)

    db_url = _resolve_database_url(args.db_url)
    redacted = db_url
    if "@" in redacted:
        redacted = redacted[: redacted.index("@") + 1] + "***"
    print(f"Connecting to: {redacted}")

    conn, cur = _connect(db_url)
    try:
        print(f"Mode: {'APPLY (will commit)' if args.apply else 'DRY-RUN (will rollback)'}")
        _dedupe_builders(cur, apply=args.apply, builders_by_name=args.builders_by_name)
        _dedupe_properties(cur, apply=args.apply)
        if args.add_unique_indexes:
            _add_unique_indexes(cur, apply=args.apply)

        if args.apply:
            conn.commit()
            print("Done: changes committed.")
        else:
            conn.rollback()
            print("Done: dry-run complete (rolled back).")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: {exc}")
        raise
    finally:
        try:
            cur.close()
        finally:
            conn.close()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
