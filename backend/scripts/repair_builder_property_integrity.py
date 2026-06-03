"""
Repair builder project/property integrity.

Default mode is a dry-run. Pass --apply to commit changes.

What this fixes:
  - duplicate builder_project rows for the same builder/title/location
  - duplicate property rows for the same property/builder/location/RERA
  - missing property.project_id links
  - dependent references pointing at deleted duplicate rows
"""

from __future__ import annotations

import argparse
import os
import re
import sqlite3
from collections import defaultdict


PROJECT_SCORE_COLUMNS = (
    "title",
    "description",
    "location",
    "total_units",
    "price_range",
    "status",
    "image_urls",
    "primary_slug",
    "property_type",
    "property_status",
    "configuration",
    "full_address",
    "project_image",
    "highlights",
)

PROPERTY_SCORE_COLUMNS = (
    "Property_Name",
    "Location",
    "Carpet_Area",
    "Price_Starting_From",
    "Pricing",
    "Highlights",
    "Extra_Charges",
    "Builder_Name",
    "Existing_Configurations",
    "Address",
    "Project_Status",
    "Possession_Date",
    "RERA_ID",
    "project_id",
)


def norm(value) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).lower()


def row_score(row: sqlite3.Row, columns: tuple[str, ...]) -> int:
    return sum(1 for col in columns if col in row.keys() and str(row[col] or "").strip())


def table_exists(cur: sqlite3.Cursor, table: str) -> bool:
    row = cur.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
        (table,),
    ).fetchone()
    return bool(row)


def columns(cur: sqlite3.Cursor, table: str) -> set[str]:
    if not table_exists(cur, table):
        return set()
    return {row[1] for row in cur.execute(f'PRAGMA table_info("{table}")')}


def pick_keep(rows: list[sqlite3.Row], score_columns: tuple[str, ...]) -> sqlite3.Row:
    return sorted(rows, key=lambda row: (-row_score(row, score_columns), int(row["id"])))[0]


def execute(cur: sqlite3.Cursor, apply: bool, sql: str, params=()) -> int:
    if not apply:
        return 0
    cur.execute(sql, params)
    return cur.rowcount if cur.rowcount != -1 else 0


def build_project_groups(cur: sqlite3.Cursor):
    rows = cur.execute("SELECT * FROM builder_project ORDER BY id").fetchall()
    groups = defaultdict(list)
    for row in rows:
        key = (norm(row["builder_id"]), norm(row["title"]), norm(row["location"]), norm(row["builder_name"]))
        groups[key].append(row)
    return groups


def build_property_groups(cur: sqlite3.Cursor):
    rows = cur.execute("SELECT * FROM property ORDER BY id").fetchall()
    groups = defaultdict(list)
    for row in rows:
        key = (
            norm(row["Property_Name"]),
            norm(row["Location"]),
            norm(row["Builder_Name"]),
            norm(row["RERA_ID"]),
        )
        groups[key].append(row)
    return groups


def dedupe_projects(cur: sqlite3.Cursor, apply: bool) -> dict[int, int]:
    groups = build_project_groups(cur)
    mapping: dict[int, int] = {}
    for rows in groups.values():
        if len(rows) <= 1:
            continue
        keep = pick_keep(rows, PROJECT_SCORE_COLUMNS)
        for row in rows:
            if row["id"] != keep["id"]:
                mapping[int(row["id"])] = int(keep["id"])

    print(f"builder_project duplicates to delete: {len(mapping)}")
    if not mapping:
        return mapping

    for dup_id, keep_id in mapping.items():
        if table_exists(cur, "property") and "project_id" in columns(cur, "property"):
            execute(cur, apply, "UPDATE property SET project_id=? WHERE project_id=?", (keep_id, dup_id))
        for table in ("unit_config", "project_amenity"):
            if table_exists(cur, table) and "project_id" in columns(cur, table):
                execute(cur, apply, f'UPDATE "{table}" SET project_id=? WHERE project_id=?', (keep_id, dup_id))
        if table_exists(cur, "slug"):
            execute(
                cur,
                apply,
                "UPDATE slug SET target_id=? WHERE target_type IN ('project', 'builder_project') AND target_id=?",
                (keep_id, dup_id),
            )
        if table_exists(cur, "media"):
            execute(
                cur,
                apply,
                "UPDATE media SET entity_id=? WHERE entity_type='project' AND entity_id=?",
                (str(keep_id), str(dup_id)),
            )
        execute(cur, apply, "DELETE FROM builder_project WHERE id=?", (dup_id,))

    return mapping


def link_properties_to_projects(cur: sqlite3.Cursor, apply: bool) -> int:
    projects = [row for rows in build_project_groups(cur).values() for row in rows]
    by_name_builder = defaultdict(list)
    by_name_location = defaultdict(list)
    by_rera_location = defaultdict(list)

    for project in projects:
        by_name_builder[(norm(project["title"]), norm(project["builder_name"]))].append(project)
        by_name_location[(norm(project["title"]), norm(project["location"]))].append(project)
        by_rera_location[(norm(project["builder_id"]), norm(project["location"]))].append(project)

    changed = 0
    properties = cur.execute("SELECT * FROM property ORDER BY id").fetchall()
    for prop in properties:
        candidates = by_name_builder.get((norm(prop["Property_Name"]), norm(prop["Builder_Name"])), [])
        if not candidates:
            candidates = by_name_location.get((norm(prop["Property_Name"]), norm(prop["Location"])), [])
        if not candidates:
            candidates = by_rera_location.get((norm(prop["RERA_ID"]), norm(prop["Location"])), [])

        if not candidates:
            continue

        keep_project = sorted(candidates, key=lambda row: int(row["id"]))[0]
        if prop["project_id"] != keep_project["id"]:
            changed += 1
            execute(cur, apply, "UPDATE property SET project_id=? WHERE id=?", (keep_project["id"], prop["id"]))

    print(f"properties to link/relink to projects: {changed}")
    return changed


def dedupe_properties(cur: sqlite3.Cursor, apply: bool) -> dict[int, int]:
    groups = build_property_groups(cur)
    mapping: dict[int, int] = {}
    for rows in groups.values():
        if len(rows) <= 1:
            continue
        keep = pick_keep(rows, PROPERTY_SCORE_COLUMNS)
        for row in rows:
            if row["id"] != keep["id"]:
                mapping[int(row["id"])] = int(keep["id"])

    print(f"property duplicates to delete: {len(mapping)}")
    if not mapping:
        return mapping

    for dup_id, keep_id in mapping.items():
        for table in ("enquiry", "review", "user_interaction", "favorite"):
            if table_exists(cur, table) and "property_id" in columns(cur, table):
                execute(cur, apply, f'UPDATE "{table}" SET property_id=? WHERE property_id=?', (keep_id, dup_id))
        if table_exists(cur, "property_poi_cache"):
            existing = cur.execute("SELECT id FROM property_poi_cache WHERE property_id=?", (keep_id,)).fetchone()
            if existing:
                execute(cur, apply, "DELETE FROM property_poi_cache WHERE property_id=?", (dup_id,))
            else:
                execute(cur, apply, "UPDATE property_poi_cache SET property_id=? WHERE property_id=?", (keep_id, dup_id))
        if table_exists(cur, "slug"):
            execute(
                cur,
                apply,
                "UPDATE slug SET target_id=? WHERE target_type='property' AND target_id=?",
                (keep_id, dup_id),
            )
        if table_exists(cur, "media"):
            execute(
                cur,
                apply,
                "UPDATE media SET entity_id=? WHERE entity_type='property' AND entity_id=?",
                (str(keep_id), str(dup_id)),
            )
        execute(cur, apply, "DELETE FROM property WHERE id=?", (dup_id,))

    return mapping


def normalize_text_fields(cur: sqlite3.Cursor, apply: bool) -> int:
    updates = 0
    for table, fields in (
        ("property", ("Property_Name", "Location", "Builder_Name", "RERA_ID")),
        ("builder_project", ("title", "location", "builder_name", "builder_id")),
    ):
        if not table_exists(cur, table):
            continue
        available = columns(cur, table)
        rows = cur.execute(f'SELECT * FROM "{table}" ORDER BY id').fetchall()
        for row in rows:
            assignments = []
            params = []
            for field in fields:
                if field not in available:
                    continue
                value = row[field]
                cleaned = re.sub(r"\s+", " ", str(value).strip()) if value is not None else None
                if value != cleaned:
                    assignments.append(f'"{field}"=?')
                    params.append(cleaned)
            if assignments:
                updates += 1
                params.append(row["id"])
                execute(cur, apply, f'UPDATE "{table}" SET {", ".join(assignments)} WHERE id=?', tuple(params))
    print(f"rows with whitespace normalization: {updates}")
    return updates


def print_remaining(cur: sqlite3.Cursor):
    project_dupes = cur.execute(
        """
        SELECT COUNT(*) FROM (
          SELECT 1 FROM builder_project
          GROUP BY lower(trim(builder_id)), lower(trim(title)), lower(trim(COALESCE(location,''))), lower(trim(COALESCE(builder_name,'')))
          HAVING COUNT(*) > 1
        )
        """
    ).fetchone()[0]
    property_dupes = cur.execute(
        """
        SELECT COUNT(*) FROM (
          SELECT 1 FROM property
          GROUP BY lower(trim("Property_Name")), lower(trim("Location")), lower(trim(COALESCE("Builder_Name",''))), lower(trim(COALESCE("RERA_ID",'')))
          HAVING COUNT(*) > 1
        )
        """
    ).fetchone()[0]
    unlinked = cur.execute(
        """
        SELECT COUNT(*)
        FROM property p
        LEFT JOIN builder_project bp ON bp.id = p.project_id
        WHERE p.project_id IS NULL OR bp.id IS NULL
        """
    ).fetchone()[0]
    print(f"remaining duplicate builder_project groups: {project_dupes}")
    print(f"remaining duplicate property groups: {property_dupes}")
    print(f"remaining unlinked/broken property.project_id rows: {unlinked}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=os.path.join("instance", "hns.db"))
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys=OFF")
    cur.execute("BEGIN")

    try:
        dedupe_projects(cur, args.apply)
        link_properties_to_projects(cur, args.apply)
        dedupe_properties(cur, args.apply)
        normalize_text_fields(cur, args.apply)
        if args.apply:
            conn.commit()
            print("changes committed")
        else:
            conn.rollback()
            print("dry-run only; no changes committed")
    except Exception:
        conn.rollback()
        raise
    finally:
        print_remaining(cur)
        conn.close()


if __name__ == "__main__":
    main()
