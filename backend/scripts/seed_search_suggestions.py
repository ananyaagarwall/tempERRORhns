"""
Seed the search_suggestions table from real DB data + static real-estate terms.
Safe to re-run — skips phrases already present.

Usage:
    cd backend
    python scripts/seed_search_suggestions.py
"""

import os, sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

from app import app, db
from models import Builder, BuilderProject, Property, ProjectAmenity, SearchSuggestion

def _add(phrases: list[str]):
    added = 0
    for raw in phrases:
        phrase = str(raw or '').strip()
        if not phrase or len(phrase) < 2:
            continue
        if not SearchSuggestion.query.filter_by(phrase=phrase).first():
            db.session.add(SearchSuggestion(phrase=phrase))
            added += 1
    return added

def seed():
    total = 0
    with app.app_context():

        # 1. Locations from Property rows
        locs = db.session.execute(
            db.text("SELECT DISTINCT \"Location\" FROM property WHERE \"Location\" IS NOT NULL")
        ).fetchall()
        total += _add([r[0] for r in locs])

        # 2. Locations from BuilderProject rows
        proj_locs = db.session.execute(
            db.text("SELECT DISTINCT location FROM builder_project WHERE location IS NOT NULL")
        ).fetchall()
        total += _add([r[0] for r in proj_locs])

        # 3. Builder company names
        builders = Builder.query.with_entities(Builder.company_name, Builder.brand_name).all()
        for b in builders:
            total += _add([b.company_name, b.brand_name])

        # 4. Project titles
        projects = BuilderProject.query.with_entities(BuilderProject.title).all()
        total += _add([p.title for p in projects])

        # 5. Amenity names
        amenities = ProjectAmenity.query.with_entities(ProjectAmenity.name).distinct().all()
        total += _add([a.name for a in amenities])

        # 6. Static real-estate terms (Navi Mumbai focused)
        static = [
            # Nodes / areas
            "Vashi", "Koparkhairane", "Ghansoli", "Airoli", "Nerul",
            "Belapur", "Kharghar", "Ulwe", "Sanpada", "Seawoods",
            "Panvel", "Thane", "Kalyan", "Dombivli", "Mumbai",
            "Navi Mumbai", "CBD Belapur", "Turbhe", "Juinagar",
            # BHK configs
            "1 BHK", "2 BHK", "3 BHK", "4 BHK", "Studio",
            "1.5 BHK", "2.5 BHK", "Penthouse", "Duplex",
            # Property types
            "Apartment", "Villa", "Row House", "Bungalow", "Flat",
            "Commercial", "Shop", "Office Space",
            # Status
            "Ready to Move", "Under Construction", "New Launch", "Pre-Launch",
            # Common amenities
            "Parking", "Lift", "Swimming Pool", "Gym", "Clubhouse",
            "24/7 Security", "CCTV", "Power Backup", "Garden",
            "Children Play Area", "Jogging Track", "Balcony",
            # Price keywords
            "All Inclusive", "RERA Verified",
        ]
        total += _add(static)

        db.session.commit()
        print(f"Seeded {total} new phrase(s) into search_suggestions.")
        print(f"Total in table: {SearchSuggestion.query.count()}")

if __name__ == '__main__':
    seed()
