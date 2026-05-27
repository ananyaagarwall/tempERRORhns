"""
cleanup_builders_and_properties.py
---------------------------------
One-off Postgres data cleanup script requested for:
  1) Fix Trellis builder `location` -> "Koparkhairne"
  2) Deduplicate `property` rows by normalized Address (and user_id when present)
  3) Remove N builders from locations that have >1 builder (keep at least one),
     excluding specific builders ("Maithili", "Hiranandani"), and delete their
     dependent projects/properties + related rows in other tables.

Safety:
  - Default is DRY-RUN (rolls back).
  - To actually change data you must pass: --apply --yes

Usage:
  python backend/scripts/cleanup_builders_and_properties.py
  python backend/scripts/cleanup_builders_and_properties.py postgresql://user:pass@host/db
  python backend/scripts/cleanup_builders_and_properties.py --apply --yes
  python backend/scripts/cleanup_builders_and_properties.py --apply --yes --remove-builders 5
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Iterable
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
    cur.execute("SET statement_timeout = '180s';")
    return conn, cur


def _quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


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


def _normalized_expr(column_sql: str) -> str:
    return (
        "regexp_replace(lower(btrim(coalesce("
        + column_sql
        + "::text,''))), '[^a-z0-9]+', '', 'g')"
    )


def _non_empty_score_expr(columns: list[str]) -> str:
    parts = []
    for column_sql in columns:
        parts.append(
            f"CASE WHEN NULLIF(btrim(coalesce({column_sql}::text,'')), '') IS NULL THEN 0 ELSE 1 END"
        )
    return " + ".join(parts) if parts else "0"


def _execute(cur, sql: str, label: str, params: Iterable | None = None):
    if params is None:
        cur.execute(sql)
    else:
        cur.execute(sql, params)
    print(f"  - {label}")


def _fix_trellis_location(cur, *, builder_table: str, location_value: str) -> int:
    cols = _columns(cur, builder_table)
    if "location" not in cols:
        print(f"Trellis fix: `{builder_table}` has no location column. Skipping.")
        return 0

    name_cols = [col for col in ("company_name", "brand_name") if col in cols]
    if not name_cols:
        print(f"Trellis fix: `{builder_table}` has no company_name/brand_name columns. Skipping.")
        return 0

    # psycopg2 uses `%s` param style; literal `%` in SQL (LIKE patterns) must be
    # passed via parameters (otherwise it can be parsed as placeholders).
    trellis_pattern = "%trellis%"
    match_predicate = " OR ".join(f"{_quote_ident(col)}::text ILIKE %s" for col in name_cols)
    params = [location_value, *([trellis_pattern] * len(name_cols))]
    cur.execute(
        f"""
        UPDATE {_quote_ident(builder_table)}
        SET {_quote_ident('location')} = %s
        WHERE ({match_predicate})
        """,
        tuple(params),
    )
    updated = cur.rowcount if cur.rowcount != -1 else 0
    print(f"Trellis fix: updated {updated} builder row(s) to location={location_value!r}.")
    return updated


def _create_mapping_temp_table(cur, temp_name: str):
    cur.execute(f"DROP TABLE IF EXISTS {temp_name};")
    cur.execute(f"CREATE TEMP TABLE {temp_name} (dup_id TEXT NOT NULL, keep_id TEXT NOT NULL);")


def _fill_mapping(
    cur,
    *,
    temp_name: str,
    table: str,
    pk_col: str,
    key_expr: str,
    score_expr: str,
    created_at_col: str | None,
):
    pk_sql = _quote_ident(pk_col)
    created_at_sql = _quote_ident(created_at_col) if created_at_col else None
    order_clause = f"({score_expr}) DESC"
    if created_at_sql:
        order_clause += f", {created_at_sql} DESC NULLS LAST"
    order_clause += f", {pk_sql} ASC"

    cur.execute(
        f"""
        INSERT INTO {temp_name} (dup_id, keep_id)
        WITH ranked AS (
          SELECT
            {pk_sql}::text AS pk,
            {key_expr} AS k,
            ({score_expr})::int AS score,
            row_number() OVER (PARTITION BY {key_expr} ORDER BY {order_clause}) AS rn,
            first_value({pk_sql}::text) OVER (PARTITION BY {key_expr} ORDER BY {order_clause}) AS keep_pk
          FROM {_quote_ident(table)}
          WHERE {key_expr} IS NOT NULL AND {key_expr} <> ''
        )
        SELECT pk, keep_pk
        FROM ranked
        WHERE rn > 1
        """
    )


def _dedupe_properties_by_address(cur, *, apply: bool) -> None:
    property_table = _pick_existing_table(cur, ["property", "properties"])
    if not property_table:
        print("Property table not found (tried: property, properties). Skipping property address dedupe.")
        return

    cols = _columns(cur, property_table)
    if "id" not in cols or "Address" not in cols:
        print(f"Property address dedupe: `{property_table}` missing id/Address. Skipping.")
        return

    user_prefix = ""
    if "user_id" in cols:
        user_prefix = f"coalesce({_quote_ident('user_id')}::text,'') || '|' || "

    key_expr = user_prefix + _normalized_expr(_quote_ident("Address"))

    score_cols = [
        "Property_Name",
        "Location",
        "Address",
        "Carpet_Area",
        "Price_Starting_From",
        "Pricing",
        "Highlights",
        "Builder_Name",
        "Project_Status",
        "Possession_Date",
        "RERA_ID",
        "project_id",
        "created_at",
    ]
    score_cols_sql = [_quote_ident(name) for name in score_cols if name in cols]
    score_expr = _non_empty_score_expr(score_cols_sql)
    created_at_col = "created_at" if "created_at" in cols else None

    cur.execute(
        f"""
        WITH grouped AS (
          SELECT {key_expr} AS k, COUNT(*) AS c
          FROM {_quote_ident(property_table)}
          WHERE NULLIF(btrim(coalesce({_quote_ident('Address')}::text,'')), '') IS NOT NULL
          GROUP BY {key_expr}
        )
        SELECT COALESCE(SUM(CASE WHEN c > 1 THEN c - 1 ELSE 0 END), 0)::int
        FROM grouped
        """
    )
    dup_count = int(cur.fetchone()[0])
    print(f"Properties: found {dup_count} duplicate row(s) by normalized Address in `{property_table}`.")
    if not dup_count:
        return

    temp_name = "tmp_property_address_dedupe"
    _create_mapping_temp_table(cur, temp_name)
    _fill_mapping(
        cur,
        temp_name=temp_name,
        table=property_table,
        pk_col="id",
        key_expr=key_expr,
        score_expr=score_expr,
        created_at_col=created_at_col,
    )

    cur.execute(f"SELECT COUNT(*) FROM {temp_name}")
    mapping_rows = int(cur.fetchone()[0])
    print(f"Properties: would merge/delete {mapping_rows} row(s) (address-based).")
    if not apply or not mapping_rows:
        return

    # Update FK references to kept property ids.
    fk_tables = [
        ("enquiry", "property_id"),
        ("review", "property_id"),
        ("user_interaction", "property_id"),
        ("favorite", "property_id"),
    ]
    for fk_table, fk_column in fk_tables:
        if not _to_regclass(cur, fk_table):
            continue
        fk_cols = _columns(cur, fk_table)
        if fk_column not in fk_cols:
            continue
        _execute(
            cur,
            f"""
            UPDATE {_quote_ident(fk_table)} t
            SET {_quote_ident(fk_column)} = m.keep_id::int
            FROM {temp_name} m
            WHERE t.{_quote_ident(fk_column)}::text = m.dup_id
            """,
            f"Updated {fk_table}.{fk_column} to kept property (address dedupe)",
        )

    # Remove slug rows for duplicate properties (if present).
    slug_table = _pick_existing_table(cur, ["slug", "slugs"])
    if slug_table and {"target_type", "target_id"} <= _columns(cur, slug_table):
        _execute(
            cur,
            f"""
            DELETE FROM {_quote_ident(slug_table)} s
            USING {temp_name} m
            WHERE s.{_quote_ident('target_type')} = 'property'
              AND s.{_quote_ident('target_id')}::text = m.dup_id
            """,
            "Deleted slug rows for duplicate properties",
        )

    _execute(
        cur,
        f"""
        DELETE FROM {_quote_ident(property_table)} p
        USING {temp_name} m
        WHERE p.{_quote_ident('id')}::text = m.dup_id
        """,
        "Deleted duplicate properties (address-based)",
    )


@dataclass(frozen=True)
class BuilderRow:
    rera_id: str
    company_name: str
    location: str
    score: int


def _build_exclusion_predicate(cols: set[str], exclude_names: list[str]) -> tuple[str, list[str]]:
    """
    Returns (sql_predicate, params) that is TRUE when the builder SHOULD be excluded.
    """
    # NOTE: do not reference raw table columns here. The caller may apply this
    # predicate to a CTE that only exposes a subset of columns. Use `name_search`
    # (provided by `_select_builders_to_remove`) instead.
    predicates: list[str] = []
    params: list[str] = []
    for token in exclude_names:
        token = token.strip()
        if not token:
            continue
        predicates.append("name_search ILIKE %s")
        params.append(f"%{token}%")
    if not predicates:
        return "FALSE", []
    return "(" + " OR ".join(predicates) + ")", params


def _select_builders_to_remove(
    cur,
    *,
    builder_table: str,
    remove_count: int,
    exclude_names: list[str],
    group_by: str,
) -> list[BuilderRow]:
    cols = _columns(cur, builder_table)
    if "rera_id" not in cols:
        print(f"Builder prune: `{builder_table}` missing rera_id. Skipping builder removals.")
        return []

    display_name_col = None
    for candidate in ("company_name", "brand_name"):
        if candidate in cols:
            display_name_col = candidate
            break
    if not display_name_col:
        print(f"Builder prune: `{builder_table}` missing company_name/brand_name. Skipping builder removals.")
        return []

    def grouping_expr(group_choice: str) -> tuple[str, str, str] | None:
        """
        Returns (value_expr, norm_expr, label).
        """
        if group_choice == "location_bucket":
            if "location" not in cols:
                return None
            value_expr = f"split_part(coalesce({_quote_ident('location')}::text,''), ',', 1)"
            return value_expr, _normalized_expr(value_expr), "location(before comma)"
        if group_choice == "location_full":
            if "location" not in cols:
                return None
            value_expr = f"coalesce({_quote_ident('location')}::text,'')"
            return value_expr, _normalized_expr(_quote_ident("location")), "location(full)"
        if group_choice == "city":
            if "city" not in cols:
                return None
            value_expr = f"coalesce({_quote_ident('city')}::text,'')"
            return value_expr, _normalized_expr(_quote_ident("city")), "city"
        if group_choice == "state":
            if "state" not in cols:
                return None
            value_expr = f"coalesce({_quote_ident('state')}::text,'')"
            return value_expr, _normalized_expr(_quote_ident("state")), "state"
        return None

    chosen_group = group_by
    grouping = grouping_expr(chosen_group) if chosen_group != "auto" else None
    if chosen_group == "auto":
        grouping = grouping_expr("location_bucket") or grouping_expr("city") or grouping_expr("location_full")
        # Prefer location bucket if it actually yields duplicates, else try city, then full location.
        if grouping:
            for candidate in ("location_bucket", "city", "location_full"):
                cand = grouping_expr(candidate)
                if not cand:
                    continue
                value_expr, norm_expr, label = cand
                cur.execute(
                    f"""
                    SELECT COUNT(*)::int
                    FROM (
                      SELECT {norm_expr} AS k
                      FROM {_quote_ident(builder_table)}
                      WHERE {norm_expr} <> ''
                      GROUP BY {norm_expr}
                      HAVING COUNT(*) > 1
                    ) s
                    """
                )
                multi_groups = int(cur.fetchone()[0])
                if multi_groups > 0:
                    grouping = cand
                    chosen_group = candidate
                    break
            else:
                # None of the candidates yield duplicate groups
                grouping = grouping_expr("location_bucket") or grouping_expr("city") or grouping_expr("location_full")

    if not grouping:
        print(
            f"Builder prune: cannot group by {group_by!r} (required column missing). Skipping builder removals."
        )
        return []

    group_value_expr, group_norm_expr, group_label = grouping

    score_cols = [
        "company_name",
        "brand_name",
        "established_year",
        "builder_type",
        "city",
        "state",
        "contact_email",
        "contact_number",
        "website_url",
        "builder_logo",
        "cover_banner",
        "location",
        "short_description",
        "detailed_description",
    ]
    score_cols_sql = [_quote_ident(name) for name in score_cols if name in cols]
    score_expr = _non_empty_score_expr(score_cols_sql)

    excluded_pred, excluded_params = _build_exclusion_predicate(cols, exclude_names)

    search_parts = []
    for column_name in ("company_name", "brand_name"):
        if column_name in cols:
            search_parts.append(f"coalesce({_quote_ident(column_name)}::text,'')")
    name_search_expr = " || ' ' || ".join(search_parts) if search_parts else "''"

    # Find locations with >1 builder, then pick the "worst" non-excluded builder per location.
    cur.execute(
        f"""
        WITH base AS (
          SELECT
            {_quote_ident('rera_id')}::text AS rera_id,
            coalesce({_quote_ident(display_name_col)}::text, '') AS company_name,
            ({name_search_expr}) AS name_search,
            ({group_value_expr}) AS location,
            {group_norm_expr} AS location_norm,
            ({score_expr})::int AS score
          FROM {_quote_ident(builder_table)}
          WHERE NULLIF(btrim(coalesce(({group_value_expr})::text,'')), '') IS NOT NULL
        ),
        multi AS (
          SELECT location_norm
          FROM base
          WHERE location_norm <> ''
          GROUP BY location_norm
          HAVING COUNT(*) > 1
        ),
        candidates AS (
          SELECT b.*
          FROM base b
          JOIN multi m ON m.location_norm = b.location_norm
        ),
        protected AS (
          SELECT
            *,
            ({excluded_pred}) AS is_protected
          FROM candidates
        ),
        flagged AS (
          SELECT
            *,
            SUM(CASE WHEN is_protected THEN 1 ELSE 0 END) OVER (PARTITION BY location_norm) AS protected_count,
            COUNT(*) OVER (PARTITION BY location_norm) AS location_count,
            FIRST_VALUE(rera_id) OVER (
              PARTITION BY location_norm
              ORDER BY score DESC, rera_id ASC
            ) AS keep_best_id
          FROM protected
        ),
        removable AS (
          SELECT *
          FROM flagged
          WHERE NOT is_protected
            AND (
              protected_count > 0
              OR rera_id <> keep_best_id
            )
        )
        SELECT rera_id, company_name, location, score
        FROM removable
        ORDER BY score ASC, location_norm ASC, rera_id ASC
        LIMIT %s
        """,
        [*excluded_params, remove_count],
    )

    rows = cur.fetchall()
    selected = [
        BuilderRow(
            rera_id=str(r[0]),
            company_name=str(r[1] or ""),
            location=str(r[2] or ""),
            score=int(r[3] or 0),
        )
        for r in rows
    ]
    if selected:
        print(f"Builder prune: grouping mode = {chosen_group} ({group_label}).")
    return selected


def _delete_builders_and_dependents(cur, *, builders: list[BuilderRow]) -> None:
    if not builders:
        return

    builder_ids = [b.rera_id for b in builders]
    print(f"Deleting {len(builder_ids)} builder(s) + dependents...")

    # Find builder_project ids to delete.
    if not _to_regclass(cur, "builder_project"):
        print("builder_project table not found; deleting only builder rows.")
        builder_table = _pick_existing_table(cur, ["builder", "builders"])
        if builder_table and "rera_id" in _columns(cur, builder_table):
            _execute(
                cur,
                f"DELETE FROM {_quote_ident(builder_table)} WHERE {_quote_ident('rera_id')} = ANY(%s)",
                "Deleted builders",
                (builder_ids,),
            )
        return

    cur.execute(
        "SELECT id FROM builder_project WHERE builder_id = ANY(%s)",
        (builder_ids,),
    )
    project_ids = [int(row[0]) for row in cur.fetchall()]

    property_table = _pick_existing_table(cur, ["property", "properties"])
    property_ids: list[int] = []
    if property_table and _to_regclass(cur, property_table):
        prop_cols = _columns(cur, property_table)
        where_clauses: list[str] = []
        params: list[object] = []

        if "project_id" in prop_cols and "id" in prop_cols and project_ids:
            where_clauses.append(f"{_quote_ident('project_id')} = ANY(%s)")
            params.append(project_ids)

        if "Builder_Name" in prop_cols and builders:
            builder_name_norms = []
            for builder in builders:
                normalized = "".join(ch for ch in (builder.company_name or "").lower().strip() if ch.isalnum())
                if normalized:
                    builder_name_norms.append(normalized)
            if builder_name_norms:
                where_clauses.append(
                    f"{_normalized_expr(_quote_ident('Builder_Name'))} = ANY(%s)"
                )
                params.append(builder_name_norms)

        if where_clauses:
            cur.execute(
                f"""
                SELECT {_quote_ident('id')}
                FROM {_quote_ident(property_table)}
                WHERE {" OR ".join(where_clauses)}
                """,
                tuple(params),
            )
            property_ids = [int(row[0]) for row in cur.fetchall()]

    # Delete dependent rows for properties.
    if property_ids:
        for table_name, column_name in [
            ("enquiry", "property_id"),
            ("review", "property_id"),
            ("user_interaction", "property_id"),
            ("favorite", "property_id"),
        ]:
            if not _to_regclass(cur, table_name):
                continue
            if column_name not in _columns(cur, table_name):
                continue
            _execute(
                cur,
                f"""
                DELETE FROM {_quote_ident(table_name)}
                WHERE {_quote_ident(column_name)} = ANY(%s)
                """,
                f"Deleted {table_name} rows for removed properties",
                (property_ids,),
            )

        slug_table = _pick_existing_table(cur, ["slug", "slugs"])
        if slug_table and {"target_type", "target_id"} <= _columns(cur, slug_table):
            _execute(
                cur,
                f"""
                DELETE FROM {_quote_ident(slug_table)}
                WHERE {_quote_ident('target_type')} = 'property'
                  AND {_quote_ident('target_id')} = ANY(%s)
                """,
                "Deleted slug rows for removed properties",
                (property_ids,),
            )

        if property_table:
            _execute(
                cur,
                f"DELETE FROM {_quote_ident(property_table)} WHERE {_quote_ident('id')} = ANY(%s)",
                "Deleted properties for removed builders",
                (property_ids,),
            )

    # Delete unit_config / project_amenity explicitly (tables have ON DELETE CASCADE, but keep it clean).
    for dependent in ("unit_config", "project_amenity"):
        if _to_regclass(cur, dependent) and project_ids and "project_id" in _columns(cur, dependent):
            _execute(
                cur,
                f"DELETE FROM {_quote_ident(dependent)} WHERE {_quote_ident('project_id')} = ANY(%s)",
                f"Deleted {dependent} rows for removed builder projects",
                (project_ids,),
            )

    slug_table = _pick_existing_table(cur, ["slug", "slugs"])
    if slug_table and {"target_type", "target_id"} <= _columns(cur, slug_table) and project_ids:
        _execute(
            cur,
            f"""
            DELETE FROM {_quote_ident(slug_table)}
            WHERE {_quote_ident('target_id')} = ANY(%s)
              AND {_quote_ident('target_type')} IN ('project', 'builder_project')
            """,
            "Deleted slug rows for removed builder projects",
            (project_ids,),
        )

    if project_ids:
        _execute(
            cur,
            "DELETE FROM builder_project WHERE id = ANY(%s)",
            "Deleted builder projects for removed builders",
            (project_ids,),
        )

    builder_table = _pick_existing_table(cur, ["builder", "builders"])
    if builder_table and "rera_id" in _columns(cur, builder_table):
        _execute(
            cur,
            f"DELETE FROM {_quote_ident(builder_table)} WHERE {_quote_ident('rera_id')} = ANY(%s)",
            "Deleted builder rows",
            (builder_ids,),
        )


def _debug_builder_location_summary(cur, *, builder_table: str, exclude_names: list[str], group_by: str) -> None:
    cols = _columns(cur, builder_table)
    if "rera_id" not in cols:
        return

    search_parts = []
    for column_name in ("company_name", "brand_name"):
        if column_name in cols:
            search_parts.append(f"coalesce({_quote_ident(column_name)}::text,'')")
    name_search_expr = " || ' ' || ".join(search_parts) if search_parts else "''"
    excluded_pred, excluded_params = _build_exclusion_predicate(cols, exclude_names)

    group_choice = group_by
    if group_choice == "auto":
        # Prefer location bucket if possible, else city.
        group_choice = "location_bucket" if "location" in cols else "city"

    if group_choice == "location_bucket":
        if "location" not in cols:
            print("Builder summary: cannot group by location_bucket (no builder.location).")
            return
        group_value_expr = f"split_part(coalesce({_quote_ident('location')}::text,''), ',', 1)"
        group_norm_expr = _normalized_expr(group_value_expr)
        group_label = "location(before comma)"
    elif group_choice == "location_full":
        if "location" not in cols:
            print("Builder summary: cannot group by location_full (no builder.location).")
            return
        group_value_expr = f"coalesce({_quote_ident('location')}::text,'')"
        group_norm_expr = _normalized_expr(_quote_ident("location"))
        group_label = "location(full)"
    elif group_choice == "city":
        if "city" not in cols:
            print("Builder summary: cannot group by city (no builder.city).")
            return
        group_value_expr = f"coalesce({_quote_ident('city')}::text,'')"
        group_norm_expr = _normalized_expr(_quote_ident("city"))
        group_label = "city"
    elif group_choice == "state":
        if "state" not in cols:
            print("Builder summary: cannot group by state (no builder.state).")
            return
        group_value_expr = f"coalesce({_quote_ident('state')}::text,'')"
        group_norm_expr = _normalized_expr(_quote_ident("state"))
        group_label = "state"
    else:
        print(f"Builder summary: unknown grouping {group_by!r}.")
        return

    cur.execute(f"SELECT COUNT(*)::int FROM {_quote_ident(builder_table)}")
    total_builders = int(cur.fetchone()[0])

    cur.execute(
        f"""
        WITH base AS (
          SELECT
            {group_norm_expr} AS location_norm,
            ({name_search_expr}) AS name_search
          FROM {_quote_ident(builder_table)}
          WHERE NULLIF(btrim(coalesce(({group_value_expr})::text,'')), '') IS NOT NULL
        ),
        grouped AS (
          SELECT
            location_norm,
            COUNT(*) AS total,
            SUM(CASE WHEN ({excluded_pred}) THEN 1 ELSE 0 END) AS protected
          FROM base
          WHERE location_norm <> ''
          GROUP BY location_norm
        )
        SELECT location_norm, total, protected
        FROM grouped
        WHERE total > 1
        ORDER BY total DESC, location_norm ASC
        LIMIT 15
        """,
        tuple(excluded_params),
    )
    rows = cur.fetchall()
    if not rows:
        print(f"Builder summary: {total_builders} builders total; no {group_label} buckets with >1 builder.")
        return
    print(f"Builder summary (top multi-builder {group_label} buckets):")
    for location_norm, total, protected in rows:
        print(f"  - {location_norm}: total={int(total)} protected={int(protected)} removable≈{max(int(total) - max(int(protected), 1), 0)}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Cleanup builders/properties in Postgres (dry-run by default)."
    )
    parser.add_argument("db_url", nargs="?", default=None, help="Optional DATABASE_URL")
    parser.add_argument("--apply", action="store_true", help="Commit changes (default rollbacks)")
    parser.add_argument("--yes", action="store_true", help="Required with --apply (destructive)")
    parser.add_argument("--trellis-location", default="Koparkhairne")
    parser.add_argument("--skip-trellis-fix", action="store_true")
    parser.add_argument("--skip-address-dedupe", action="store_true")
    parser.add_argument("--remove-builders", type=int, default=5)
    parser.add_argument("--debug-builders", action="store_true", help="Print multi-builder location summary.")
    parser.add_argument(
        "--builder-group-by",
        default="auto",
        choices=["auto", "location_bucket", "location_full", "city", "state"],
        help="How to group builders when pruning duplicates by location.",
    )
    parser.add_argument(
        "--exclude-builders",
        action="append",
        default=["Maithili", "Hiranandani"],
        help="Builder name tokens to NEVER remove (can be repeated).",
    )
    args = parser.parse_args(argv)

    if args.apply and not args.yes:
        raise SystemExit("Refusing to run with --apply without also passing --yes.")

    db_url = _resolve_database_url(args.db_url)
    redacted = db_url
    if "@" in redacted:
        redacted = redacted[: redacted.index("@") + 1] + "***"
    print(f"Connecting to: {redacted}")

    conn, cur = _connect(db_url)
    try:
        print(f"Mode: {'APPLY (will commit)' if args.apply else 'DRY-RUN (will rollback)'}")

        builder_table = _pick_existing_table(cur, ["builder", "builders"])
        if builder_table and not args.skip_trellis_fix:
            _fix_trellis_location(cur, builder_table=builder_table, location_value=args.trellis_location)

        if not args.skip_address_dedupe:
            _dedupe_properties_by_address(cur, apply=args.apply)

        if args.debug_builders and builder_table:
            _debug_builder_location_summary(
                cur,
                builder_table=builder_table,
                exclude_names=list(dict.fromkeys(args.exclude_builders)),
                group_by=args.builder_group_by,
            )

        if args.remove_builders and builder_table:
            selected = _select_builders_to_remove(
                cur,
                builder_table=builder_table,
                remove_count=max(0, int(args.remove_builders)),
                exclude_names=list(dict.fromkeys(args.exclude_builders)),
                group_by=args.builder_group_by,
            )
            if selected:
                print("Selected builders to remove:")
                for idx, row in enumerate(selected, start=1):
                    print(
                        f"  {idx}. rera_id={row.rera_id} name={row.company_name!r} location={row.location!r} score={row.score}"
                    )
            else:
                print("Selected builders to remove: (none)")

            if args.apply and selected:
                _delete_builders_and_dependents(cur, builders=selected)

        if args.apply:
            conn.commit()
            print("Done: changes committed.")
        else:
            conn.rollback()
            print("Done: dry-run complete (rolled back).")
        return 0
    except Exception:
        conn.rollback()
        raise
    finally:
        try:
            cur.close()
        finally:
            conn.close()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
