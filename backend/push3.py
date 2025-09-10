import os
import json
from app import *

# DB path
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hns.db')

def seed_properties():
    dummy_properties = []
    for i in range(1, 11):
        prop = Property(
            Property_Name=f"Sample Property {i}",
            Location=f"Location {i}, City {i}",
            Carpet_Area=f"{800 + i*10} sq.ft",
            Price_Starting_From=f"{50 + i} Lakhs",
            Pricing=f"{55 + i} Lakhs onwards",
            Highlights=json.dumps([f"Highlight {i}a", f"Highlight {i}b"]),
            Extra_Charges="Registration, GST",
            Builder_Name=f"Builder {i}",
            Builder_Details=json.dumps({
                "experience": f"{5+i} years",
                "projects": f"{10+i} completed"
            }),
            Existing_Configurations=json.dumps(["1BHK", "2BHK", "3BHK"]),
            Built_up_Area=f"{900 + i*15} sq.ft",
            Main_Door_Facing="East",
            Ceiling_Height="10 ft",
            Kitchen="Modular Kitchen",
            Key_Highlights=json.dumps([f"Key Point {i}", f"USP {i}"]),
            Address=f"Address line {i}, Area {i}",
            Flat_Details=json.dumps({"flats": 100+i, "towers": 5}),
            Loan_Availability=json.dumps(["HDFC", "SBI", "ICICI"]),
            Approved_by_Authorities=json.dumps(["RERA", "Municipal"]),
            Project_Status="Under Construction" if i % 2 == 0 else "Ready to Move",
            Possession_Date="Dec 2025",
            RERA_ID=f"RERA{i:04d}",
            Vastu_Compliant="Yes",
            Parking="Covered Parking",
            Lift_Availability="Yes",
            Security="24x7 Security",
            Connectivity=json.dumps(["Metro", "Highway", "Airport"]),
            user_id=1,       # ⚠️ ensure user with id=1 exists
            project_id=None  # you can link to builder_project if needed
        )
        dummy_properties.append(prop)

    db.session.add_all(dummy_properties)
    db.session.commit()
    print("✅ 10 dummy properties inserted successfully.")

if __name__ == "__main__":
    seed_properties()
