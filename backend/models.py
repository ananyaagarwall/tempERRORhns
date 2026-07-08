from datetime import datetime
from extensions import db
from sqlalchemy.orm import selectinload, joinedload
import json
def _safe_json_loads(value, default=None):
    if value is None:
        return default
    # If it's already a list/dict, return as-is
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except Exception:
        # Fallback: return original value or default so that
        # serialization never crashes the API.
        return default if default is not None else value

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    clerk_user_id = db.Column(db.String(100), unique=True, nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(15))
    role = db.Column(db.String(20))  # 'buyer', 'seller', 'admin', 'customer'
    is_active = db.Column(db.Boolean, default=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    properties = db.relationship('Property', backref='owner', lazy=True)
    enquiries = db.relationship('Enquiry', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    favorites = db.relationship('Favorite', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active if hasattr(self, 'is_active') else True,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def check_password(self, raw_password: str) -> bool:
        """
        Minimal password check for the local admin promotion endpoint.
        Current codebase stores the initial admin password as plain text.
        """
        if raw_password is None:
            return False
        return str(self.password) == str(raw_password)

class Agent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    agency_name = db.Column(db.String(100))
    license_number = db.Column(db.String(50))
    verified = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='agent_profile')

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Property_Name = db.Column(db.String(100), nullable=False)
    Location = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_source = db.Column(db.String(20), nullable=True)  # manual | geocoded | unknown
    Carpet_Area = db.Column(db.String(100))
    Price_Starting_From = db.Column(db.String(50))
    Pricing = db.Column(db.String(100))
    Highlights = db.Column(db.Text)  # JSON string for list of strings
    Extra_Charges = db.Column(db.String(100))
    Builder_Name = db.Column(db.String(100))
    Builder_Details = db.Column(db.Text)  # JSON string for object
    Existing_Configurations = db.Column(db.Text)  # JSON string for list of strings
    Built_up_Area = db.Column(db.String(100))
    Main_Door_Facing = db.Column(db.String(50))
    Ceiling_Height = db.Column(db.String(100))
    Kitchen = db.Column(db.String(100))
    Key_Highlights = db.Column(db.Text)  # JSON string for list of strings
    Address = db.Column(db.String(200))
    Flat_Details = db.Column(db.Text)  # JSON string for object
    Loan_Availability = db.Column(db.Text)  # JSON string for list of strings
    Approved_by_Authorities = db.Column(db.Text)  # JSON string for list of strings
    Project_Status = db.Column(db.String(50))
    Possession_Date = db.Column(db.String(50))
    RERA_ID = db.Column(db.String(50))
    Vastu_Compliant = db.Column(db.String(10))
    Parking = db.Column(db.String(50))
    Lift_Availability = db.Column(db.String(50))
    Security = db.Column(db.String(100))
    Connectivity = db.Column(db.Text)  # JSON string for list of strings
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('builder_project.id'), nullable=True, index=True)
    enquiries = db.relationship('Enquiry', backref='property', lazy=True)
    reviews = db.relationship('Review', backref='property', lazy=True)
    poi_cache = db.relationship(
        'PropertyPoiCache',
        backref='property',
        lazy=True,
        uselist=False,
        cascade='all, delete-orphan',
    )
    @classmethod
    def eager_query(cls):
        """Avoids per-row lazy load of self.project in to_dict()."""
        return cls.query.options(
        selectinload(cls.project)
     )


    def to_dict(self):
        # Get builder project image if available
        builder_project_image = None
        
        if self.project:
            # Get the first image from image_urls or use project_image
            if self.project.image_urls:
                try:
                    images = json.loads(self.project.image_urls)
                    if images and len(images) > 0:
                        builder_project_image = images[0]
                except:
                    # If JSON parsing fails, treat as single URL string
                    builder_project_image = self.project.image_urls
                
            if not builder_project_image and self.project.project_image:
                builder_project_image = self.project.project_image
                
            if builder_project_image:
                builder_project_image = str(builder_project_image).strip() or None
        
        return {
            'id': self.id,
            'Property_Name': self.Property_Name,
            'Location': self.Location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'location_source': self.location_source,
            'Carpet_Area': self.Carpet_Area,
            'Price_Starting_From': self.Price_Starting_From,
            'Pricing': self.Pricing,
            'Highlights': _safe_json_loads(self.Highlights),
            'Extra_Charges': self.Extra_Charges,
            'Builder_Name': self.Builder_Name,
            'Builder_Details': _safe_json_loads(self.Builder_Details),
            'Existing_Configurations': _safe_json_loads(self.Existing_Configurations, default=[]),
            'Built_up_Area': self.Built_up_Area,
            'Main_Door_Facing': self.Main_Door_Facing,
            'Ceiling_Height': self.Ceiling_Height,
            'Kitchen': self.Kitchen,
            'Key_Highlights': _safe_json_loads(self.Key_Highlights),
            'Address': self.Address,
            'Flat_Details': _safe_json_loads(self.Flat_Details),
            'Loan_Availability': _safe_json_loads(self.Loan_Availability),
            'Approved_by_Authorities': _safe_json_loads(self.Approved_by_Authorities),
            'Project_Status': self.Project_Status,
            'Possession_Date': self.Possession_Date,
            'RERA_ID': self.RERA_ID,
            'Vastu_Compliant': self.Vastu_Compliant,
            'Parking': self.Parking,
            'Lift_Availability': self.Lift_Availability,
            'Security': self.Security,
            'Connectivity': _safe_json_loads(self.Connectivity),
            'user_id': self.user_id,
            'project_id': self.project_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'builder_project_image': builder_project_image
        }


class PropertyPoiCache(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False, unique=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    radius_m = db.Column(db.Integer, default=2000)
    poi_types = db.Column(db.Text, nullable=True)  # JSON list
    data = db.Column(db.Text, nullable=True)  # JSON payload
    fetched_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Enquiry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)  
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)

class Builder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(100), nullable=False)
    brand_name = db.Column(db.String(100))
    established_year = db.Column(db.Integer)
    builder_type = db.Column(db.String(50))  # Residential, Commercial, Mixed
    rera_registered = db.Column(db.Boolean, default=False)
    corporate_address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pin_code = db.Column(db.String(10))
    contact_email = db.Column(db.String(120))
    contact_number = db.Column(db.String(15))
    website_url = db.Column(db.String(200))
    builder_logo = db.Column(db.String(200))  # URL to stored image
    cover_banner = db.Column(db.String(200))  # URL to stored image
    certificates = db.Column(db.Text)  # JSON string of certificate URLs
    location = db.Column(db.String(200))
    short_description = db.Column(db.Text)
    detailed_description = db.Column(db.Text)
    completed_projects = db.Column(db.Integer)
    ongoing_projects = db.Column(db.Integer)
    awards = db.Column(db.Text)  # JSON string of awards
    verified = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='builder_profiles')
    projects = db.relationship('BuilderProject', backref='builder', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'brand_name': self.brand_name,
            'established_year': self.established_year,
            'builder_type': self.builder_type,
            'rera_registered': self.rera_registered,
            'corporate_address': self.corporate_address,
            'city': self.city,
            'state': self.state,
            'pin_code': self.pin_code,
            'contact_email': self.contact_email,
            'contact_number': self.contact_number,
            'website_url': self.website_url,
            'builder_logo': self.builder_logo,
            'cover_banner': self.cover_banner,
            'certificates': self.certificates,
            'location': self.location,
            'short_description': self.short_description,
            'detailed_description': self.detailed_description,
            'completed_projects': self.completed_projects,
            'ongoing_projects': self.ongoing_projects,
            'awards': self.awards,
            'verified': self.verified
        }

class BuilderProject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    builder_id = db.Column(db.Integer, db.ForeignKey('builder.id'), nullable=False)
    builder_name = db.Column(db.String(100))  # Manually entered builder name
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200))
    total_units = db.Column(db.Integer)
    price_range = db.Column(db.String(100))
    completion_date = db.Column(db.Date)
    status = db.Column(db.String(50))  # 'Under Construction', 'Completed', 'Upcoming'
    image_urls = db.Column(db.Text)  # JSON string or comma-separated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    primary_slug = db.Column(db.String(150), unique=True, nullable=True)
    alias_slugs = db.Column(db.Text, nullable=True)  # JSON list of up to 5 alias slugs
    form_status = db.Column(db.String(20), default='draft')  # 'draft', 'in_progress', 'complete'

    # New fields for step 1
    property_type = db.Column(db.String(50))
    sub_type = db.Column(db.String(50))
    property_status = db.Column(db.String(20))
    possession_date = db.Column(db.Date)
    configuration = db.Column(db.Text) # JSON string for configuration details

    # New fields for step 2
    flat_number = db.Column(db.String(50))
    price_per_sqft = db.Column(db.Float)
    carpet_area_min = db.Column(db.Float)
    carpet_area_max = db.Column(db.Float)
    booking_amount = db.Column(db.Float)

    # New fields for step 3
    full_address = db.Column(db.Text)
    state = db.Column(db.String(100))
    city = db.Column(db.String(100))
    locality = db.Column(db.String(100))
    landmark = db.Column(db.String(200))
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_source = db.Column(db.String(20), nullable=True)  # manual | geocoded | unknown
    towers = db.Column(db.Integer)
    floors_per_tower = db.Column(db.Integer)
    construction_status = db.Column(db.Text)
    
    # New fields for step 4 (Construction Details)
    floor_plans = db.Column(db.Text)  # JSON string of floor plan image URLs
    
    # New fields for step 5 (Amenities)
    amenities = db.Column(db.Text)  # JSON string of amenities list (legacy blob; prefer ProjectAmenity rows)

    # New field for step 6 (Media)
    project_image = db.Column(db.String(300))  # URL to stored project image

    # ── Developer / Branding ─────────────────────────────────────────────────
    development_group = db.Column(db.String(150))  # e.g. "Maithili Group"

    # ── Structure / Elevation ────────────────────────────────────────────────
    elevation             = db.Column(db.String(100))  # e.g. "G+25 storey"
    structure_description = db.Column(db.Text)         # e.g. "Basement + Ground + 4 Podium + 21 Residential floors"

    # ── Combo / Jodi Options ─────────────────────────────────────────────────
    jodi_options = db.Column(db.Text)  # JSON list e.g. ["2+2 BHK (4BHK)", "2+3 BHK (5BHK)"]

    # ── Marketing Content ────────────────────────────────────────────────────
    usps       = db.Column(db.Text)  # JSON list of project USP bullet points
    highlights = db.Column(db.Text)  # JSON list of project highlight bullet points

    properties        = db.relationship('Property', backref='project', lazy=True)
    unit_configs      = db.relationship('UnitConfig', backref='project', lazy=True, cascade='all, delete-orphan')
    project_amenities = db.relationship('ProjectAmenity', backref='project', lazy=True, cascade='all, delete-orphan')

    @classmethod
    def eager_query(cls):
        """Use instead of BuilderProject.query for any list/bulk endpoint."""
        return cls.query.options(
            selectinload(cls.unit_configs),
            selectinload(cls.project_amenities),
            selectinload(cls.properties),
            joinedload(cls.builder),
        )

    def to_dict(self, resolve_missing_properties=True):
        primary_property = None
        property_ids = []
        try:
            sorted_properties = sorted(self.properties, key=lambda prop: prop.id or 0)

            if not sorted_properties and resolve_missing_properties:
                title_key = (self.title or "").strip().lower()
                location_key = (self.location or "").strip().lower()
                builder_label = self.builder_name or (self.builder.company_name if self.builder else None)
                builder_key = (builder_label or "").strip().lower()

                if title_key:
                    fallback_query = Property.query.filter(
                        db.func.lower(db.func.trim(Property.Property_Name)) == title_key
                    )
                    if builder_key:
                        fallback_query = fallback_query.filter(
                            db.func.lower(db.func.trim(Property.Builder_Name)) == builder_key
                        )
                    sorted_properties = fallback_query.order_by(Property.id.asc()).all()

                if not sorted_properties and title_key and location_key:
                    sorted_properties = (
                        Property.query
                        .filter(db.func.lower(db.func.trim(Property.Property_Name)) == title_key)
                        .filter(db.func.lower(db.func.trim(Property.Location)) == location_key)
                        .order_by(Property.id.asc())
                        .all()
                    )

                if not sorted_properties and self.builder_id and location_key:
                    sorted_properties = (
                        Property.query
                        .filter(db.func.lower(db.func.trim(Property.RERA_ID)) == str(self.builder_id).strip().lower())
                        .filter(db.func.lower(db.func.trim(Property.Location)) == location_key)
                        .order_by(Property.id.asc())
                        .all()
                    )
            property_ids = [prop.id for prop in sorted_properties]
            primary_property = sorted_properties[0].to_dict() if sorted_properties else None
        except Exception:
            primary_property = None
            property_ids = []

        return {
            'id': self.id,
            'property_id': property_ids[0] if property_ids else None,
            'property_ids': property_ids,
            'primary_property': primary_property,
            'builder_id': self.builder_id,
            'builder_name': self.builder_name,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'total_units': self.total_units,
            'price_range': self.price_range,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'status': self.status,
            'image_urls': self.image_urls,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'primary_slug': self.primary_slug,
            'alias_slugs': _safe_json_loads(self.alias_slugs, []),
            'form_status': self.form_status,
            'property_type': self.property_type,
            'sub_type': self.sub_type,
            'property_status': self.property_status,
            'possession_date': self.possession_date.isoformat() if self.possession_date else None,
            'configuration': _safe_json_loads(self.configuration),
            'flat_number': self.flat_number,
            'price_per_sqft': self.price_per_sqft,
            'carpet_area_min': self.carpet_area_min,
            'carpet_area_max': self.carpet_area_max,
            'booking_amount': self.booking_amount,
            'full_address': self.full_address,
            'state': self.state,
            'city': self.city,
            'locality': self.locality,
            'landmark': self.landmark,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'location_source': self.location_source,
            'towers': self.towers,
            'floors_per_tower': self.floors_per_tower,
            'construction_status': self.construction_status,
            'floor_plans': _safe_json_loads(self.floor_plans, []),
            'amenities': _safe_json_loads(self.amenities, []),
            'project_image': self.project_image,
            # ── New fields ──────────────────────────────────────────────────
            'development_group':    self.development_group,
            'elevation':            self.elevation,
            'structure_description': self.structure_description,
            'jodi_options':  _safe_json_loads(self.jodi_options, []),
            'usps':          _safe_json_loads(self.usps, []),
            'highlights':    _safe_json_loads(self.highlights, []),
            'unit_configs':       [uc.to_dict() for uc in self.unit_configs],
            'project_amenities':  [pa.to_dict() for pa in self.project_amenities],
        }

# =============================================================================
# UNIT CONFIG  — one row per BHK type per project
# Replaces / supplements the old `configuration` JSON blob on BuilderProject.
# =============================================================================

class UnitConfig(db.Model):
    """Structured unit configuration for a builder project (one row per BHK type)."""
    __tablename__ = 'unit_config'

    id         = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('builder_project.id'), nullable=False)

    bhk_type        = db.Column(db.String(20))   # '2 BHK', '3 BHK', etc.
    carpet_area_min = db.Column(db.Float)         # in area_unit
    carpet_area_max = db.Column(db.Float)         # in area_unit
    rera_carpet_area = db.Column(db.Float)        # explicit RERA carpet (may differ from saleable)
    deck_area       = db.Column(db.Float)         # additional deck/balcony area (e.g. 3 BHK)
    area_unit       = db.Column(db.String(10), default='sqft')  # 'sqft' | 'sq.mt' | 'sqm'
    price_from      = db.Column(db.Float)         # in Crores or absolute — your convention
    price_to        = db.Column(db.Float)         # upper bound (None if single price)
    price_label     = db.Column(db.String(50))   # e.g. 'All Inclusive', 'Base Price'

    # Extended fields
    unit_type             = db.Column(db.String(30))   # e.g. 'Type 1', 'Type 3A'
    wing                  = db.Column(db.String(20))   # e.g. 'Wing A', 'Tower R6'
    floor_range_raw       = db.Column(db.String(100))  # e.g. '3-29', '30-37,39'
    balcony_area          = db.Column(db.Float)
    enclosed_balcony_area = db.Column(db.Float)
    service_area          = db.Column(db.Float)
    ceiling_height        = db.Column(db.String(50))
    main_door_facing      = db.Column(db.String(50))
    modular_kitchen       = db.Column(db.Boolean)
    kitchen_type          = db.Column(db.String(50))
    is_combination        = db.Column(db.Boolean, default=False)

    room_details = db.relationship('UnitRoomDetail', backref='unit_config', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'bhk_type': self.bhk_type,
            'carpet_area_min': self.carpet_area_min,
            'carpet_area_max': self.carpet_area_max,
            'rera_carpet_area': self.rera_carpet_area,
            'deck_area': self.deck_area,
            'area_unit': self.area_unit,
            'price_from': self.price_from,
            'price_to': self.price_to,
            'price_label': self.price_label,
            'unit_type': self.unit_type,
            'wing': self.wing,
            'floor_range_raw': self.floor_range_raw,
            'balcony_area': self.balcony_area,
            'enclosed_balcony_area': self.enclosed_balcony_area,
            'service_area': self.service_area,
            'ceiling_height': self.ceiling_height,
            'main_door_facing': self.main_door_facing,
            'modular_kitchen': self.modular_kitchen,
            'kitchen_type': self.kitchen_type,
            'is_combination': self.is_combination,
            'room_details': [r.to_dict() for r in self.room_details],
        }


# =============================================================================
# UNIT ROOM DETAIL  — one row per room per unit_config
# =============================================================================

class UnitRoomDetail(db.Model):
    """Dimensions for each room in a unit configuration."""
    __tablename__ = 'unit_room_detail'

    id             = db.Column(db.Integer, primary_key=True)
    unit_config_id = db.Column(db.Integer, db.ForeignKey('unit_config.id', ondelete='CASCADE'), nullable=False)
    room_name      = db.Column(db.String(50), nullable=False)
    length         = db.Column(db.Float)
    width          = db.Column(db.Float)
    area_sqm       = db.Column(db.Float)
    area_unit      = db.Column(db.String(10), default='sqft')

    def to_dict(self):
        return {
            'id': self.id,
            'unit_config_id': self.unit_config_id,
            'room_name': self.room_name,
            'length': self.length,
            'width': self.width,
            'area_sqm': self.area_sqm,
            'area_unit': self.area_unit,
        }


# =============================================================================
# PROJECT AMENITY  — one row per amenity per project
# Enables filtering: "show all projects with swimming pool".
# =============================================================================

class ProjectAmenity(db.Model):
    """Normalised amenity attached to a builder project."""
    __tablename__ = 'project_amenity'

    id         = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('builder_project.id'), nullable=False)

    name     = db.Column(db.String(150), nullable=False)  # e.g. 'Swimming Pool'
    category = db.Column(db.String(100))                  # e.g. 'Recreation', 'Sports', 'Safety'
    icon_key = db.Column(db.String(100))                  # frontend icon identifier e.g. 'pool'

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'category': self.category,
            'icon_key': self.icon_key,
        }


class Blog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    intro_paragraph = db.Column(db.Text, nullable=False)
    subheading1 = db.Column(db.String(200))
    content1 = db.Column(db.Text)
    image1 = db.Column(db.String(300))  # file path or URL
    alt_text1 = db.Column(db.String(300))
    subheading2 = db.Column(db.String(200))
    content2 = db.Column(db.Text)
    image2 = db.Column(db.String(300))
    alt_text2 = db.Column(db.String(300))
    subheading3 = db.Column(db.String(200))
    content3 = db.Column(db.Text)
    image3 = db.Column(db.String(300))
    alt_text3 = db.Column(db.String(300))
    featured_image = db.Column(db.String(300))
    featured_image_alt = db.Column(db.String(300))
    interlinks = db.Column(db.Text)  # JSON list
    external_links = db.Column(db.Text)  # JSON list
    meta_description = db.Column(db.String(300))
    focus_keywords = db.Column(db.String(200))
    slug = db.Column(db.String(200), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'intro_paragraph': self.intro_paragraph,
            'subheading1': self.subheading1,
            'content1': self.content1,
            'image1': self.image1,
            'alt_text1': self.alt_text1,
            'subheading2': self.subheading2,
            'content2': self.content2,
            'image2': self.image2,
            'alt_text2': self.alt_text2,
            'subheading3': self.subheading3,
            'content3': self.content3,
            'image3': self.image3,
            'alt_text3': self.alt_text3,
            'featured_image': self.featured_image,
            'featured_image_alt': self.featured_image_alt,
            'interlinks': json.loads(self.interlinks) if self.interlinks else [],
            'external_links': json.loads(self.external_links) if self.external_links else [],
            'meta_description': self.meta_description,
            'focus_keywords': self.focus_keywords,
            'slug': self.slug,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Slug(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(200), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)  # e.g., 'property', 'project', 'blog'
    target_id = db.Column(db.Integer, nullable=False)
    is_primary = db.Column(db.Boolean, default=False)


# ── Media ─────────────────────────────────────────────────────────────────────

class Media(db.Model):
    """
    Central media table — one row per uploaded asset.

    entity_type : 'builder' | 'project' | 'property' | 'blog'
    entity_id   : rera_id (string) for builders, integer ID for everything else
    media_type  : 'logo' | 'cover' | 'gallery' | 'floor_plan' | 'certificate' | 'featured_image'
    is_featured : marks the primary display image for a given entity_type+media_type pair
    display_order: 0-based position in gallery listings
    """
    __tablename__ = 'media'

    id               = db.Column(db.Integer, primary_key=True)
    entity_type      = db.Column(db.String(50),  nullable=False)
    entity_id        = db.Column(db.String(200), nullable=False)
    blob_url         = db.Column(db.String(600), nullable=False)
    media_type       = db.Column(db.String(50),  nullable=False, default='gallery')
    is_featured      = db.Column(db.Boolean,     nullable=False, default=False)
    display_order    = db.Column(db.Integer,     nullable=False, default=0)
    alt_text         = db.Column(db.String(300), nullable=True)
    original_filename= db.Column(db.String(300), nullable=True)
    mime_type        = db.Column(db.String(100), nullable=True)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index('ix_media_entity',      'entity_type', 'entity_id'),
        db.Index('ix_media_entity_type', 'entity_type', 'entity_id', 'media_type'),
    )

    def to_dict(self):
        return {
            'id':                self.id,
            'entity_type':       self.entity_type,
            'entity_id':         self.entity_id,
            'blob_url':          self.blob_url,
            'media_type':        self.media_type,
            'is_featured':       self.is_featured,
            'display_order':     self.display_order,
            'alt_text':          self.alt_text,
            'original_filename': self.original_filename,
            'mime_type':         self.mime_type,
            'created_at':        self.created_at.isoformat() if self.created_at else None,
        }


# ============================================
# ADVANCED FEATURES - NEW MODELS
# ============================================

class ChatSession(db.Model):
    """Enhanced chat session with state machine"""
    __tablename__ = 'chat_session'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title = db.Column(db.String(100))
    
    # Existing fields
    status = db.Column(db.String(20), default='active')  # 'active', 'lead_generated', 'closed'
    summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # NEW: State machine fields
    state = db.Column(db.String(20), default='initial')  # 'initial', 'gathering', 'showing', 'drilling', 'closed'
    lead_quality = db.Column(db.String(20))  # 'hot', 'warm', 'cold'
    interested_property_ids = db.Column(db.Text)  # JSON list of property IDs
    last_state_change = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'status': self.status,
            'state': self.state,
            'lead_quality': self.lead_quality,
            'interested_property_ids': json.loads(self.interested_property_ids) if self.interested_property_ids else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_state_change': self.last_state_change.isoformat() if self.last_state_change else None
        }


class ChatMessage(db.Model):
    """Chat messages"""
    __tablename__ = 'chat_message'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserPreference(db.Model):
    """User preferences learned from conversations"""
    __tablename__ = 'user_preference'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Keys: 'location', 'budget', 'bhk', 'possession', etc.
    pref_key = db.Column(db.String(50), nullable=False)
    pref_value = db.Column(db.String(200), nullable=False)
    
    # Confidence score (0.0 to 1.0)
    confidence = db.Column(db.Float, default=1.0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'pref_key', name='unique_user_pref'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pref_key': self.pref_key,
            'pref_value': self.pref_value,
            'confidence': self.confidence,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class UserInteraction(db.Model):
    """Track user behavior for learning preferences"""
    __tablename__ = 'user_interaction'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    guest_id = db.Column(db.String(100), nullable=True) # UUID for anonymous sessions
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # 'viewed', 'saved', 'shared', 'clicked'
    duration_seconds = db.Column(db.Integer)  # How long they viewed
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id'))
    __table_args__ = (
        db.Index('ix_user_interaction_user_id', 'user_id'),
        db.Index('ix_user_interaction_guest_id', 'guest_id'),
        db.Index('ix_user_interaction_property_id', 'property_id'),
        db.Index('ix_user_interaction_session_id', 'session_id'),
    )
    
    # Relationships
    user = db.relationship('User', backref='interactions')
    property = db.relationship('Property', backref='interactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'action': self.action,
            'duration_seconds': self.duration_seconds,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'session_id': self.session_id
        }

class Favorite(db.Model):
    """Stores favorite properties for both users and guests"""
    __tablename__ = 'favorite'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    guest_id = db.Column(db.String(100), nullable=True) # UUID for anonymous users
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=True)
    # For guest sessions: store cart snapshot and change history in a single row
    cart_snapshot = db.Column(db.Text, nullable=True)  # JSON list of property IDs
    change_log = db.Column(db.Text, nullable=True)  # JSON list of change events
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # PostgreSQL-only partial unique indexes for session/item deduplication
    # are created in backend/app.py during schema compatibility checks.
    __table_args__ = (
        db.Index('ix_favorite_user_id', 'user_id'),
        db.Index('ix_favorite_guest_id', 'guest_id'),
        db.Index('ix_favorite_property_id', 'property_id'),
    )
    
    # Relationships
    property = db.relationship('Property', backref='favourited_by')
    
    def to_dict(self):
        def safe_list(raw):
            try:
                if not raw:
                    return []
                data = json.loads(raw)
                return data if isinstance(data, list) else []
            except Exception:
                return []

        return {
            'id': self.id,
            'user_id': self.user_id,
            'guest_id': self.guest_id,
            'property_id': self.property_id,
            'entry_type': 'session' if self.property_id is None else 'item',
            'cart_snapshot': safe_list(self.cart_snapshot),
            'change_log': safe_list(self.change_log),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }