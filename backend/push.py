"""
Seed 20 dummy rows into builder_project for testing similarity.py.

Constraints:
  - title: Indian project style
  - location: only from {Thane, Ghansoli, Airoli, Koparkharaine}
  - full_address: detailed variant of location
  - state: Maharashtra
  - city: Mumbai
  - locality: same set as location (respective)

Run:
  python backend/push.py
"""

import os
import sqlite3
import random
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hns.db')


AREAS = ["Thane", "Ghansoli", "Airoli", "Koparkharaine"]

BUILDER_NAMES = [
    "Shree Developers", "Omkar Constructions", "Rajdeep Realty", "Sai Infra",
    "Mahadev Builders", "Anand Group", "Suryodaya Estates", "Navkar Realty",
    "Krishna Constructions", "Pranav Developers",
]

TITLE_PREFIXES = [
    "Heights", "Residency", "Enclave", "Greens", "Meadows", "Orchid",
    "Imperial", "Serene", "Avenue", "Majestic", "Gardenia", "Celestia",
]


def ensure_connection() -> sqlite3.Connection:
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    # Write rows as dict-like when needed
    conn.row_factory = sqlite3.Row
    # Disable FK enforcement to avoid requiring a pre-existing builder
    conn.execute("PRAGMA foreign_keys = OFF;")
    return conn


def make_title(area: str) -> str:
    return f"{area} {random.choice(TITLE_PREFIXES)}"


def make_full_address(area: str, idx: int) -> str:
    blocks = ["Sector", "Phase", "Block", "Plot", "Road"]
    block = random.choice(blocks)
    return f"Flat No. {100+idx}, {block} {random.randint(1, 25)}, {area}, Mumbai, Maharashtra - 400{random.randint(600, 999)}"


def random_status() -> str:
    return random.choice(["Under Construction", "Completed", "Upcoming"]) 


def random_property_type() -> tuple[str, str]:
    pt = random.choice(["Residential", "Commercial", "Mixed"])
    sub = random.choice(["Apartment", "Villa", "Office", "Shop"])
    return pt, sub


def build_rows(n: int = 20):
    rows = []
    # Distribute roughly equally across areas
    per_area = max(1, n // len(AREAS))
    idx = 0
    for area in AREAS:
        for _ in range(per_area):
            idx += 1
            builder_name = random.choice(BUILDER_NAMES)
            title = make_title(area)
            full_address = make_full_address(area, idx)
            state = "Maharashtra"
            city = "Mumbai"
            locality = area
            status = random_status()
            property_type, sub_type = random_property_type()
            price_range = random.choice([
                "₹ 75L - 1.2Cr", "₹ 50L - 90L", "₹ 1.1Cr - 1.8Cr", "₹ 80L - 1.4Cr"
            ])
            description = f"Premium {sub_type.lower()} project by {builder_name} in {area}, offering modern amenities and connectivity."
            rows.append({
                # Required / key fields
                "builder_id": "MH/RE/2024/000001",  # dummy RERA ref
                "builder_name": builder_name,
                "title": title,
                "description": description,
                "location": area,
                "price_range": price_range,
                "status": status,
                # Location details
                "full_address": full_address,
                "state": state,
                "city": city,
                "locality": locality,
                # Types
                "property_type": property_type,
                "sub_type": sub_type,
                # Optional helpful fields
                "form_status": "in_progress",
            })
    # If we need more due to integer division rounding, pad randomly
    while len(rows) < n:
        rows.append(rows[-1].copy())
    return rows[:n]


def insert_rows(conn: sqlite3.Connection, rows: list[dict]):
    cols = [
        "builder_id", "builder_name", "title", "description", "location",
        "price_range", "status", "full_address", "state", "city", "locality",
        "property_type", "sub_type", "form_status"
    ]
    placeholders = ",".join([":" + c for c in cols])
    sql = f"""
        INSERT INTO builder_project
        ({', '.join(cols)})
        VALUES ({placeholders})
    """
    cur = conn.cursor()
    inserted = 0
    for row in rows:
        try:
            cur.execute(sql, row)
            inserted += 1
        except sqlite3.IntegrityError as e:
            # Skip duplicates or constraint violations
            print(f"[skip] {e}")
            continue
    conn.commit()
    return inserted


def main():
    conn = ensure_connection()
    try:
        rows = build_rows(20)
        inserted = insert_rows(conn, rows)
        print(f"Inserted {inserted} rows into builder_project.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()


