import sqlite3


DB_PATH = "instance/hns.db"


def print_rows(label, rows):
    print(label)
    if not rows:
        print("  (none)")
        return
    for row in rows:
        print(" ", ascii(dict(row)))


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print_rows(
        "Hiranandani Estate property rows",
        cur.execute(
            """
            SELECT id, Property_Name, Location, Carpet_Area, Price_Starting_From,
                   Pricing, Extra_Charges, Builder_Name, Project_Status,
                   Possession_Date, RERA_ID, project_id
            FROM property
            WHERE lower(Property_Name) LIKE '%hiranandani estate%'
            ORDER BY id
            """
        ).fetchall(),
    )

    print_rows(
        "Hiranandani Estate builder_project rows",
        cur.execute(
            """
            SELECT id, builder_id, builder_name, title, location, price_range,
                   status, property_status, carpet_area_min, carpet_area_max,
                   completion_date, possession_date
            FROM builder_project
            WHERE lower(title) LIKE '%hiranandani estate%'
            ORDER BY id
            """
        ).fetchall(),
    )

    print_rows(
        "Builder projects without linked property rows",
        cur.execute(
            """
            SELECT bp.id, bp.builder_id, bp.builder_name, bp.title, bp.status,
                   COUNT(p.id) AS linked_property_count
            FROM builder_project bp
            LEFT JOIN property p ON p.project_id = bp.id
            GROUP BY bp.id
            HAVING COUNT(p.id) = 0
            ORDER BY bp.builder_id, bp.id
            """
        ).fetchall(),
    )

    print_rows(
        "Duplicate-ish property groups",
        cur.execute(
            """
            SELECT lower(trim(Property_Name)) AS property_name,
                   lower(trim(Location)) AS location,
                   lower(trim(COALESCE(Builder_Name, ''))) AS builder_name,
                   COUNT(*) AS row_count,
                   GROUP_CONCAT(id) AS property_ids,
                   GROUP_CONCAT(COALESCE(project_id, 'NULL')) AS project_ids
            FROM property
            GROUP BY lower(trim(Property_Name)), lower(trim(Location)), lower(trim(COALESCE(Builder_Name, '')))
            HAVING COUNT(*) > 1
            ORDER BY row_count DESC, property_name
            """
        ).fetchall(),
    )

    print_rows(
        "Builder project duplicate-ish groups",
        cur.execute(
            """
            SELECT lower(trim(title)) AS title,
                   lower(trim(COALESCE(location, ''))) AS location,
                   lower(trim(COALESCE(builder_name, ''))) AS builder_name,
                   COUNT(*) AS row_count,
                   GROUP_CONCAT(id) AS project_ids
            FROM builder_project
            GROUP BY lower(trim(title)), lower(trim(COALESCE(location, ''))), lower(trim(COALESCE(builder_name, '')))
            HAVING COUNT(*) > 1
            ORDER BY row_count DESC, title
            """
        ).fetchall(),
    )

    print_rows(
        "Endpoint-style unique builder projects with resolved property ids",
        cur.execute(
            """
            WITH ranked_projects AS (
                SELECT bp.*,
                       lower(trim(bp.title)) AS title_key,
                       lower(trim(COALESCE(bp.location, ''))) AS location_key,
                       lower(trim(COALESCE(bp.builder_name, ''))) AS builder_key,
                       ROW_NUMBER() OVER (
                           PARTITION BY lower(trim(bp.title)),
                                        lower(trim(COALESCE(bp.location, ''))),
                                        lower(trim(COALESCE(bp.builder_name, '')))
                           ORDER BY bp.id
                       ) AS rn
                FROM builder_project bp
            )
            SELECT rp.id AS project_id,
                   rp.builder_id,
                   rp.title,
                   rp.location,
                   (
                       SELECT GROUP_CONCAT(p.id)
                       FROM property p
                       WHERE lower(trim(p.Property_Name)) = rp.title_key
                         AND lower(trim(COALESCE(p.Builder_Name, ''))) = rp.builder_key
                   ) AS exact_name_builder_property_ids,
                   (
                       SELECT GROUP_CONCAT(p.id)
                       FROM property p
                       WHERE lower(trim(p.RERA_ID)) = lower(trim(rp.builder_id))
                         AND lower(trim(p.Location)) = rp.location_key
                   ) AS rera_location_property_ids
            FROM ranked_projects rp
            WHERE rp.rn = 1
            ORDER BY rp.builder_id, rp.id
            """
        ).fetchall(),
    )


if __name__ == "__main__":
    main()
