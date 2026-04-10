import os
import re
import json
import pandas as pd
from datetime import datetime
from app import app
from extensions import db
from models import Builder, BuilderProject, Property
def safe_json(val):
    try:
        if pd.isna(val) or val is None or str(val).strip() == '':
            return None
        if isinstance(val, str):
            if val.startswith('[') or val.startswith('{'):
                return val
            items = [x.strip() for x in val.split(',')]
            return json.dumps(items, ensure_ascii=False)
        return json.dumps(val, ensure_ascii=False)
    except Exception:
        return None


def safe_unicode(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, bytes):
        return val.decode('utf-8', errors='replace')
    return str(val)


def read_csv_auto(path):
    try:
        return pd.read_csv(path, encoding="utf-8-sig", dtype=str, on_bad_lines="skip")
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="cp1252", dtype=str, on_bad_lines="skip")


def format_carpet_area(val):
    if not val or pd.isna(val):
        return None
    text = str(val).strip().lower()
    text = re.sub(r"\s*to\s*", " - ", text, flags=re.IGNORECASE)
    text = re.sub(r"sq\s*\.?\s*ft", "sq.ft", text)
    text = re.sub(r"(\d+\.?\d*)", r"INR \1", text)
    return text


def format_price(val):
    if not val or pd.isna(val):
        return None
    text = str(val).strip()
    text = re.sub(r"\s*to\s*", " - ", text, flags=re.IGNORECASE)
    text = re.sub(r"(\d+\.?\d*)", r"INR \1", text)
    return text


def format_bhk(val):
    if not val or pd.isna(val):
        return None
    text = str(val).lower().replace(' ', '')
    parts = text.split('/')
    clean_parts = []
    for p in parts:
        clean = p.replace('bhk', '')
        if clean.isdigit():
            clean_parts.append(clean)
    return json.dumps(clean_parts, ensure_ascii=False)


def parse_date(date_str):
    if not date_str or pd.isna(date_str):
        return None
    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%b %Y', '%B %Y', '%Y'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except:
            continue
    return None


def import_builders(csv_path):
    df = read_csv_auto(csv_path)
    for _, row in df.iterrows():
        builder = Builder.query.get(row.get('rera_id'))
        if not builder:
            builder = Builder(rera_id=row.get('rera_id'))
            db.session.add(builder)  # add only new instance

        builder.user_id = 1  # Adjust as needed
        builder.company_name = safe_unicode(row.get('company_name'))
        builder.brand_name = safe_unicode(row.get('brand_name'))
        established_year = row.get('established_year')
        builder.established_year = int(established_year) if established_year and established_year.isdigit() else None
        builder.builder_type = safe_unicode(row.get('builder_type'))
        builder.rera_registered = (str(row.get('rera_registered')).strip().lower() == 'yes')
        builder.corporate_address = safe_unicode(row.get('corporate_address'))
        builder.city = safe_unicode(row.get('city'))
        builder.state = safe_unicode(row.get('state'))
        builder.pin_code = safe_unicode(row.get('pin_code'))
        builder.contact_email = safe_unicode(row.get('contact_email'))
        builder.contact_number = safe_unicode(row.get('contact_number'))
        builder.website_url = safe_unicode(row.get('website_url'))
        builder.builder_logo = safe_unicode(row.get('builder_logo'))
        builder.cover_banner = safe_unicode(row.get('cover_banner'))
        builder.certificates = safe_json(row.get('certificates'))
        builder.location = safe_unicode(row.get('location'))
        builder.short_description = safe_unicode(row.get('short_description'))
        builder.detailed_description = safe_unicode(row.get('detailed_description'))
        builder.completed_projects = int(row.get('completed_projects')) if row.get('completed_projects') and row.get('completed_projects').isdigit() else None
        builder.ongoing_projects = int(row.get('ongoing_projects')) if row.get('ongoing_projects') and row.get('ongoing_projects').isdigit() else None
        builder.awards = safe_json(row.get('awards'))
        builder.verified = (str(row.get('verified')).strip().lower() == 'yes')

    db.session.commit()


def import_builder_projects(csv_path):
    df = read_csv_auto(csv_path)
    for _, row in df.iterrows():
        project = BuilderProject.query.filter_by(title=row.get('title'), builder_id=None).first()
        if not project:
            project = BuilderProject()

        builder_name = row.get('builder_name')
        builder = Builder.query.filter_by(company_name=builder_name).first()
        if not builder:
            print(f"Skipping project '{row.get('title')}' because builder '{builder_name}' not found")
            continue
        project.builder_id = builder.rera_id

        project.builder_name = builder_name
        project.title = safe_unicode(row.get('title'))
        project.description = safe_unicode(row.get('description'))
        project.location = safe_unicode(row.get('location'))

        total_units_val = row.get('total_units')
        project.total_units = int(total_units_val) if total_units_val and total_units_val.isdigit() else None

        project.price_range = safe_unicode(row.get('price_range'))
        project.completion_date = parse_date(row.get('completion_date'))
        project.status = safe_unicode(row.get('status'))
        project.image_urls = row.get('image_urls')  


        created_at = row.get('created_at')
        if isinstance(created_at, str) and created_at.strip():
            try:
                project.created_at = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                project.created_at = datetime.utcnow()
        else:
            project.created_at = datetime.utcnow()

        project.primary_slug = safe_unicode(row.get('primary_slug'))
        project.alias_slugs = safe_json(row.get('alias_slugs'))
        project.form_status = safe_unicode(row.get('form_status'))
        project.property_type = safe_unicode(row.get('property_type'))
        project.sub_type = safe_unicode(row.get('sub_type'))
        project.property_status = safe_unicode(row.get('property_status'))
        project.possession_date = parse_date(row.get('possession_date'))
        project.configuration = safe_json(row.get('configuration'))
        project.flat_number = safe_unicode(row.get('flat_number'))

        price_per_sqft_val = row.get('price_per_sqft')
        project.price_per_sqft = float(price_per_sqft_val) if price_per_sqft_val and not pd.isna(price_per_sqft_val) else None

        carpet_area_min_val = row.get('carpet_area_min')
        project.carpet_area_min = float(carpet_area_min_val) if carpet_area_min_val and not pd.isna(carpet_area_min_val) else None

        carpet_area_max_val = row.get('carpet_area_max')
        project.carpet_area_max = float(carpet_area_max_val) if carpet_area_max_val and not pd.isna(carpet_area_max_val) else None

        booking_amount_val = row.get('booking_amount')
        project.booking_amount = float(booking_amount_val) if booking_amount_val and not pd.isna(booking_amount_val) else None

        project.full_address = safe_unicode(row.get('full_address'))
        project.state = safe_unicode(row.get('state'))
        project.city = safe_unicode(row.get('city'))
        project.locality = safe_unicode(row.get('locality'))
        project.landmark = safe_unicode(row.get('landmark'))

        towers_val = row.get('towers')
        project.towers = int(towers_val) if towers_val and towers_val.isdigit() else None

        floors_per_tower_val = row.get('floors_per_tower')
        if floors_per_tower_val is not None and not pd.isna(floors_per_tower_val):
            project.floors_per_tower = int(float(floors_per_tower_val))
        else:
            project.floors_per_tower = None

        project.construction_status = safe_unicode(row.get('construction_status'))
        project.floor_plans = safe_json(row.get('floor_plans'))
        project.amenities = safe_json(row.get('amenities'))
        project.project_image = safe_unicode(row.get('project_image'))

        db.session.add(project)
    db.session.commit()


def import_properties(csv_path):
    df = read_csv_auto(csv_path)
    for _, row in df.iterrows():
        prop = Property()
        prop.Property_Name = safe_unicode(row.get('Property_Name'))
        prop.Location = safe_unicode(row.get('Location'))
        prop.Carpet_Area = format_carpet_area(row.get('Carpet_Area'))
        prop.Price_Starting_From = format_price(row.get('Price_Starting_From'))
        prop.Pricing = format_price(row.get('Pricing'))
        prop.Highlights = safe_json(row.get('Highlights'))
        prop.Extra_Charges = safe_unicode(row.get('Extra_Charges'))
        prop.Builder_Name = safe_unicode(row.get('Builder_Name'))
        prop.Builder_Details = safe_json(row.get('Builder_Details'))
        prop.Existing_Configurations = safe_json(row.get('Existing_Configurations'))
        prop.Built_up_Area = safe_unicode(row.get('Built_up_Area'))
        prop.Main_Door_Facing = safe_unicode(row.get('Main_Door_Facing'))
        prop.Ceiling_Height = safe_unicode(row.get('Ceiling_Height'))
        prop.Kitchen = safe_unicode(row.get('Kitchen'))
        prop.Key_Highlights = safe_json(row.get('Key_Highlights'))
        prop.Address = safe_unicode(row.get('Address'))
        prop.Flat_Details = safe_json(row.get('Flat_Details'))
        prop.Loan_Availability = safe_json(row.get('Loan_Availability'))
        prop.Approved_by_Authorities = safe_json(row.get('Approved_by_Authorities'))
        prop.Project_Status = safe_unicode(row.get('Project_Status'))
        prop.Possession_Date = safe_unicode(row.get('Possession_Date'))
        prop.RERA_ID = safe_unicode(row.get('RERA_ID'))
        prop.Vastu_Compliant = safe_unicode(row.get('Vastu_Compliant'))
        prop.Parking = safe_unicode(row.get('Parking'))
        prop.Lift_Availability = safe_unicode(row.get('Lift_Availability'))
        prop.Security = safe_unicode(row.get('Security'))
        prop.Connectivity = safe_json(row.get('Connectivity'))
        prop.user_id = 1  # Adjust as needed

        db.session.add(prop)
    db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

        import_builders('Builders.csv')
        import_builder_projects('BuilderProjects.csv')
        import_properties('Properties.csv')

        print("Data imported successfully.")
