# #!/usr/bin/env python3
# """
# Generate dummy data for all ORDERED_AREAS locations.
# This script appends new properties, builders, and projects to the existing CSV files.
# removed data is - rabale, juinagar, khandeshwar, Khargar  

# """

# import csv
# import random

# # Locations that need data (missing from current CSVs)
# NEW_LOCATIONS = [
#     "Turbhe", "Nerul", "Seawoods",
#     "Belapur", "Mansarovar", "Panvel"
# ]

# # Builder templates for each location
# BUILDER_TEMPLATES = {
#     # "Rabale": [("Rabale Developers", "P51700007001"), ("Sigma Realty", "P51700007002")],
#     "Turbhe": [("Turbhe Constructions", "P51700007003"), ("Metro Builders", "P51700007004")],
#     "Juinagar": [("Juinagar Homes", "P51700007005"), ("Sunrise Developers", "P51700007006")],
#     "Nerul": [("Nerul Heights", "P51700007007"), ("Coastal Builders", "P51700007008")],
#     "Seawoods": [("Seawoods Realty", "P51700007009"), ("Ocean View Developers", "P51700007010")],
#     "Belapur": [("Belapur Constructions", "P51700007011"), ("CBD Developers", "P51700007012")],
#     "Kharghar": [("Kharghar Builders", "P51700007013"), ("Hillside Realty", "P51700007014")],
#     "Mansarovar": [("Mansarovar Homes", "P51700007015"), ("Lake View Developers", "P51700007016")],
#     "Khandeshwar": [("Khandeshwar Realty", "P51700007017"), ("Green Valley Builders", "P51700007018")],
#     "Panvel": [("Panvel Developers", "P51700007019"), ("Gateway Realty", "P51700007020")]
# }

# # Property name prefixes
# PROPERTY_PREFIXES = ["Royal", "Imperial", "Grand", "Elite", "Prime", "Luxe", "Vista", "Heights", "Gardens", "Residency"]

# # Configuration options
# CONFIGS = ["1/2 BHK", "2/3 BHK", "1/2/3 BHK", "2/3/4 BHK"]
# STATUSES = ["Ongoing", "Completed", "Ready to Move", "Ongoing/Ready"]
# FACING = ["East-West", "North-South", "South-East", "West-North", "North-East"]
# KITCHENS = ["Modular Kitchen with Granite Platform", "L-Shaped Modular Kitchen", "Open Kitchen with Dining Extension", "Compact Modular Kitchen", "Designer Modular Kitchen with Utility"]
# SECURITIES = ["24x7 security", "cctv security", "manned security", "access control", "multi-tier security"]
# PARKINGS = ["Basement Parking", "Stilt Parking", "Podium Parking", "Open Parking", "Multi-level Parking"]

# def generate_rera_id(base):
#     return f"P517000{base:05d}"

# def generate_builders_csv():
#     rows = []
#     for loc, builders in BUILDER_TEMPLATES.items():
#         for builder_name, rera_id in builders:
#             row = {
#                 "company_name": builder_name,
#                 "brand_name": builder_name,
#                 "established_year": random.randint(1995, 2015),
#                 "builder_type": "Residential & Commercial Developer",
#                 "rera_registered": "Yes",
#                 "corporate_address": f"{loc}, Navi Mumbai – 400{random.randint(600, 750)}",
#                 "city": "Navi Mumbai",
#                 "state": "Maharashtra",
#                 "pin_code": f"400{random.randint(600, 750)}",
#                 "contact_email": "N/A",
#                 "contact_number": "N/A",
#                 "website_url": "NA",
#                 "builder_logo": "N/A",
#                 "cover_banner": "N/A",
#                 "certificates": "RERA Certified",
#                 "location": "N/A",
#                 "short_description": f"Trusted {loc} developer with quality residential projects.",
#                 "detailed_description": f"A reputed {loc}-based developer known for delivering quality residential projects with modern amenities and timely possession.",
#                 "completed_projects": random.randint(10, 25),
#                 "ongoing_projects": random.randint(3, 10),
#                 "awards": "Realty Excellence Award",
#                 "verified": "Yes",
#                 "rera_id": rera_id
#             }
#             rows.append(row)
#     return rows

# def generate_properties_csv():
#     rows = []
#     prop_id = 7001
#     for loc in NEW_LOCATIONS:
#         builders = BUILDER_TEMPLATES[loc]
#         for i in range(10):
#             builder_name = builders[i % 2][0]
#             prefix = PROPERTY_PREFIXES[i % len(PROPERTY_PREFIXES)]
#             carpet_min = random.randint(350, 600)
#             carpet_max = carpet_min + random.randint(200, 600)
#             price_min = random.randint(30, 70)
#             price_max = price_min + random.randint(20, 80)
            
#             row = {
#                 "Property_Name": f"{prefix} {loc} {i+1}",
#                 "Location": loc,
#                 "Carpet_Area": f"{carpet_min} to {carpet_max} sq.ft.",
#                 "Price_Starting_From": f"{price_min} L to {price_max/10:.1f} Cr",
#                 "Pricing": f"{price_min} L",
#                 "Highlights": random.choice(["Premium developer", "Value housing", "Mid-segment", "Affordable options", "Luxury amenities"]),
#                 "Extra_Charges": f"₹{random.randint(3, 10)}–{random.randint(8, 15)} Lakh",
#                 "Builder_Name": builder_name,
#                 "Builder_Details": "Regional developer",
#                 "Existing_Configurations": random.choice(CONFIGS),
#                 "Built_up_Area": f"{carpet_min+100}–{carpet_max+200} sq.ft.",
#                 "Main_Door_Facing": random.choice(FACING),
#                 "Ceiling_Height": f"{random.choice(['9.0', '9.5', '10.0'])} – {random.choice(['9.5', '10.0', '10.5'])} ft",
#                 "Kitchen": random.choice(KITCHENS),
#                 "Key_Highlights": "Good connectivity",
#                 "Address": f"{loc}, Navi Mumbai",
#                 "Flat_Details": f"1 & 2 BHK – {carpet_min}–{carpet_max} sq.ft.",
#                 "Loan_Availability": "Available from HDFC, ICICI, SBI",
#                 "Approved_by_Authorities": "MahaRERA",
#                 "Project_Status": random.choice(STATUSES),
#                 "Possession_Date": f"{random.choice(['Jan', 'Mar', 'Jun', 'Sep', 'Dec'])} 202{random.randint(5, 7)}",
#                 "RERA_ID": generate_rera_id(prop_id),
#                 "Vastu_Compliant": random.choice(["Yes", "No"]),
#                 "Parking": random.choice(PARKINGS),
#                 "Lift_Availability": "Yes",
#                 "Security": random.choice(SECURITIES),
#                 "Connectivity": f"Near {loc} Railway Station & Palm Beach Road",
#                 "city": "Navi Mumbai",
#                 "locality": loc
#             }
#             rows.append(row)
#             prop_id += 1
#     return rows

# def generate_projects_csv():
#     rows = []
#     for loc in NEW_LOCATIONS:
#         builders = BUILDER_TEMPLATES[loc]
#         for i in range(10):
#             builder_name = builders[i % 2][0]
#             prefix = PROPERTY_PREFIXES[i % len(PROPERTY_PREFIXES)]
#             carpet_min = random.randint(350, 600)
#             carpet_max = carpet_min + random.randint(200, 600)
#             price_min = random.randint(30, 70)
#             price_max = price_min + random.randint(20, 80)
#             status = random.choice(STATUSES)
            
#             row = {
#                 "builder_name": builder_name,
#                 "title": f"{prefix} {loc} {i+1}",
#                 "description": random.choice(["Premium developer", "Value housing", "Mid-segment", "Affordable options"]),
#                 "location": loc,
#                 "total_units": random.randint(100, 400),
#                 "price_range": f"₹{price_min} L - ₹{price_max/10:.1f} Cr",
#                 "completion_date": f"Dec-2{random.randint(5, 8)}",
#                 "status": status,
#                 "image_urls": f"https://via.placeholder.com/400x300?text={loc}+Project+{i+1}",
#                 "created_at": "",
#                 "primary_slug": "",
#                 "alias_slugs": "",
#                 "form_status": "",
#                 "property_type": "Residential",
#                 "sub_type": "Apartment",
#                 "property_status": status,
#                 "possession_date": f"Dec-2{random.randint(5, 8)}",
#                 "configuration": random.choice(CONFIGS),
#                 "flat_number": str(random.randint(100, 400)),
#                 "price_per_sqft": random.randint(9000, 18000),
#                 "carpet_area_min": carpet_min,
#                 "carpet_area_max": carpet_max,
#                 "booking_amount": random.randint(400000, 1000000),
#                 "full_address": f"{loc}, Navi Mumbai",
#                 "state": "Maharashtra",
#                 "city": "Navi Mumbai",
#                 "locality": loc,
#                 "landmark": "",
#                 "towers": random.randint(1, 5),
#                 "floors_per_tower": "",
#                 "construction_status": status,
#                 "floor_plans": str(random.randint(3, 8)),
#                 "amenities": "swimming pool, gym, clubhouse, kids play area, jogging track, landscaped garden",
#                 "project_image": ""
#             }
#             rows.append(row)
#     return rows

# def append_to_csv(filename, new_rows, fieldnames=None):
#     """Append rows to existing CSV file."""
#     if not new_rows:
#         return
    
#     if fieldnames is None:
#         fieldnames = list(new_rows[0].keys())
    
#     with open(filename, 'a', newline='', encoding='utf-8-sig') as f:
#         writer = csv.DictWriter(f, fieldnames=fieldnames)
#         for row in new_rows:
#             writer.writerow(row)
#     print(f"Appended {len(new_rows)} rows to {filename}")

# if __name__ == "__main__":
#     # Generate and append builders
#     builders = generate_builders_csv()
#     builder_fields = ["company_name", "brand_name", "established_year", "builder_type", "rera_registered",
#                      "corporate_address", "city", "state", "pin_code", "contact_email", "contact_number",
#                      "website_url", "builder_logo", "cover_banner", "certificates", "location",
#                      "short_description", "detailed_description", "completed_projects", "ongoing_projects",
#                      "awards", "verified", "rera_id"]
#     append_to_csv("Builders.csv", builders, builder_fields)
    
#     # Generate and append properties
#     properties = generate_properties_csv()
#     prop_fields = ["Property_Name", "Location", "Carpet_Area", "Price_Starting_From", "Pricing",
#                   "Highlights", "Extra_Charges", "Builder_Name", "Builder_Details", "Existing_Configurations",
#                   "Built_up_Area", "Main_Door_Facing", "Ceiling_Height", "Kitchen", "Key_Highlights",
#                   "Address", "Flat_Details", "Loan_Availability", "Approved_by_Authorities",
#                   "Project_Status", "Possession_Date", "RERA_ID", "Vastu_Compliant", "Parking",
#                   "Lift_Availability", "Security", "Connectivity", "city", "locality"]
#     append_to_csv("Properties.csv", properties, prop_fields)
    
#     # Generate and append projects
#     projects = generate_projects_csv()
#     project_fields = ["builder_name", "title", "description", "location", "total_units", "price_range",
#                      "completion_date", "status", "image_urls", "created_at", "primary_slug", "alias_slugs",
#                      "form_status", "property_type", "sub_type", "property_status", "possession_date",
#                      "configuration", "flat_number", "price_per_sqft", "carpet_area_min", "carpet_area_max",
#                      "booking_amount", "full_address", "state", "city", "locality", "landmark",
#                      "towers", "floors_per_tower", "construction_status", "floor_plans", "amenities", "project_image"]
#     append_to_csv("BuilderProjects.csv", projects, project_fields)
    
#     print("\nDummy data generation complete!")
#     print(f"Added {len(builders)} builders, {len(properties)} properties, {len(projects)} projects")
