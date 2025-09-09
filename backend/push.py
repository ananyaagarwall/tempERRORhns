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
import json
from datetime import datetime, date
from slugify import slugify

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hns.db')


AREAS = ["Thane", "Ghansoli", "Airoli", "Koparkharaine"]

BUILDERS = [
    {"name": "Shree Developers", "rera_id": "MH/RE/2024/000001"},
    {"name": "Omkar Constructions", "rera_id": "MH/RE/2024/000002"},
    {"name": "Rajdeep Realty", "rera_id": "MH/RE/2024/000003"},
    {"name": "Sai Infra", "rera_id": "MH/RE/2024/000004"},
    {"name": "Mahadev Builders", "rera_id": "MH/RE/2024/000005"},
    {"name": "Anand Group", "rera_id": "MH/RE/2024/000006"},
    {"name": "Suryodaya Estates", "rera_id": "MH/RE/2024/000007"},
    {"name": "Navkar Realty", "rera_id": "MH/RE/2024/000008"},
    {"name": "Krishna Constructions", "rera_id": "MH/RE/2024/000009"},
    {"name": "Pranav Developers", "rera_id": "MH/RE/2024/000010"},
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
    types = {
        "Residential": ["Apartment", "Villa", "Penthouse", "Studio"],
        "Commercial": ["Office", "Shop", "Retail", "Showroom"],
        "Mixed": ["Live-Work", "Retail-Residential", "Office-Retail"]
    }
    pt = random.choice(list(types.keys()))
    sub = random.choice(types[pt])
    return pt, sub

def random_date(start_year=2024, end_year=2027):
    month = random.randint(1, 12)
    day = random.randint(1, 28)  # Avoiding edge cases with month endings
    year = random.randint(start_year, end_year)
    return f"{year}-{month:02d}-{day:02d}"

def generate_amenities():
    all_amenities = [
        "Swimming Pool", "Gym", "Club House", "Children's Play Area", 
        "24x7 Security", "Power Backup", "Parking", "Garden",
        "Indoor Games", "Community Hall", "Temple", "Jogging Track",
        "Basketball Court", "Tennis Court", "Library", "Theatre"
    ]
    num_amenities = random.randint(5, 10)
    return random.sample(all_amenities, num_amenities)

def random_configuration():
    configs = []
    for bhk in [1, 2, 3, 4]:
        if random.random() > 0.5:
            configs.append({
                "type": f"{bhk}BHK",
                "size_range": f"{600 + bhk*200}-{800 + bhk*200} sq.ft",
                "price_range": f"₹{30 + bhk*20}L - ₹{40 + bhk*20}L"
            })
    return configs


def build_rows(n: int = 20):
    rows = []
    # Distribute roughly equally across areas
    per_area = max(1, n // len(AREAS))
    idx = 0
    for area in AREAS:
        for _ in range(per_area):
            idx += 1
            builder = random.choice(BUILDERS)
            builder_name = builder["name"]
            builder_id = builder["rera_id"]
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
            # Generate additional data
            total_units = random.randint(50, 500)
            towers = random.randint(1, 5)
            floors_per_tower = random.randint(10, 30)
            completion_date = datetime.strptime(random_date(2024, 2027), "%Y-%m-%d").date()
            possession_date = datetime.strptime(random_date(2024, 2027), "%Y-%m-%d").date()
            carpet_area_min = random.randint(400, 800)
            carpet_area_max = random.randint(carpet_area_min + 100, carpet_area_min + 500)
            price_per_sqft = random.randint(8000, 15000)
            booking_amount = random.randint(100000, 500000)
            
            rows.append({
                # Required / key fields
                "builder_id": builder_id,
                "builder_name": builder_name,
                "title": title,
                "description": description,
                "location": area,
                "price_range": price_range,
                "status": status,
                
                # Basic details
                "total_units": total_units,
                "completion_date": completion_date,
                "image_urls": None,  # Keeping null as requested
                "created_at": datetime.utcnow(),
                "primary_slug": f"{slugify(title)}-{builder_id[-6:]}",
                "alias_slugs": json.dumps([f"{slugify(title)}-{area.lower()}", f"{area.lower()}-{property_type.lower()}"]),
                "form_status": "complete",
                
                # Property details
                "property_type": property_type,
                "sub_type": sub_type,
                "property_status": status,
                "possession_date": possession_date,
                "configuration": json.dumps(random_configuration()),
                
                # Unit details
                "flat_number": f"Sample-{random.randint(1001, 9999)}",
                "price_per_sqft": price_per_sqft,
                "carpet_area_min": carpet_area_min,
                "carpet_area_max": carpet_area_max,
                "booking_amount": booking_amount,
                
                # Location details
                "full_address": full_address,
                "state": state,
                "city": city,
                "locality": locality,
                "landmark": f"Near {random.choice(['Metro Station', 'Mall', 'Hospital', 'Park', 'School'])}",
                
                # Building details
                "towers": towers,
                "floors_per_tower": floors_per_tower,
                "construction_status": json.dumps({
                    "foundation": random.choice(["Completed", "In Progress"]),
                    "structure": random.choice(["Completed", "In Progress", "Not Started"]),
                    "finishing": random.choice(["Completed", "In Progress", "Not Started"])
                }),
                
                # Additional details
                "floor_plans": None,  # Keeping null as requested
                "amenities": json.dumps(generate_amenities()),
                "project_image": None  # Keeping null as requested
            })
    # If we need more due to integer division rounding, pad randomly
    while len(rows) < n:
        rows.append(rows[-1].copy())
    return rows[:n]


def insert_rows(conn: sqlite3.Connection, rows: list[dict]):
    cols = [
        "builder_id", "builder_name", "title", "description", "location",
        "total_units", "price_range", "completion_date", "status", "image_urls",
        "created_at", "primary_slug", "alias_slugs", "form_status",
        "property_type", "sub_type", "property_status", "possession_date",
        "configuration", "flat_number", "price_per_sqft", "carpet_area_min",
        "carpet_area_max", "booking_amount", "full_address", "state", "city",
        "locality", "landmark", "towers", "floors_per_tower",
        "construction_status", "floor_plans", "amenities", "project_image"
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


