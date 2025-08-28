from flask import Flask, request, jsonify, send_from_directory, redirect, make_response
#flash
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import sqlite3
from werkzeug.utils import secure_filename
import json
from flask_migrate import Migrate
import requests
import base64
import sys
from slugify import slugify

# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]}})

# Configure Flask to use UTF-8
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hns.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy first
db = SQLAlchemy(app)

# Then initialize Flask-Migrate
migrate = Migrate(app, db)

# Add these configurations
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

#---------------------------------------------MODELS ---------------------------------------------


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(15))
    role = db.Column(db.String(20))  # 'buyer', 'seller', 'admin'
    is_active = db.Column(db.Boolean, default=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    properties = db.relationship('Property', backref='owner', lazy=True)
    enquiries = db.relationship('Enquiry', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active if hasattr(self, 'is_active') else True,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Agent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    agency_name = db.Column(db.String(100))
    license_number = db.Column(db.String(50))
    verified = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='agent_profile')

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    bedrooms = db.Column(db.Integer, nullable=False)
    bathrooms = db.Column(db.Integer, nullable=False)
    area_sqft = db.Column(db.Float, nullable=False)
    furnishing = db.Column(db.String(50))  # 'Furnished', 'Semi-Furnished', etc.
    property_type = db.Column(db.String(50))  # 'Apartment', 'Villa', etc.
    property_status = db.Column(db.String(20))  # 'For Sale', 'For Rent'
    availability_date = db.Column(db.Date)
    image_urls = db.Column(db.Text)  # JSON string or comma-separated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    primary_slug = db.Column(db.String(150), unique=True, nullable=False)
    alias_slugs = db.Column(db.Text)  # JSON list of up to 5 alias slugs

    project_id = db.Column(db.Integer, db.ForeignKey('builder_project.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    enquiries = db.relationship('Enquiry', backref='property', lazy=True)
    reviews = db.relationship('Review', backref='property', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'location': self.location,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'area_sqft': self.area_sqft,
            'furnishing': self.furnishing,
            'property_type': self.property_type,
            'property_status': self.property_status,
            'availability_date': self.availability_date.isoformat() if self.availability_date else None,
            'image_urls': self.image_urls,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id,
            'project_id': self.project_id
        }

class Enquiry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)  # 1 to 5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)

class Builder(db.Model):
    rera_id = db.Column(db.String(50), primary_key=True)
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='builder_profiles')
    projects = db.relationship('BuilderProject', backref='builder', lazy=True)

    def to_dict(self):
        return {
            'rera_id': self.rera_id,
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
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class BuilderProject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    builder_id = db.Column(db.String(50), db.ForeignKey('builder.rera_id'), nullable=False)
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
    towers = db.Column(db.Integer)
    floors_per_tower = db.Column(db.Integer)
    construction_status = db.Column(db.Text)
    
    # New fields for step 4 (Construction Details)
    floor_plans = db.Column(db.Text)  # JSON string of floor plan image URLs
    
    # New fields for step 5 (Amenities)
    amenities = db.Column(db.Text)  # JSON string of amenities list
    
    # New field for step 6 (Media)
    project_image = db.Column(db.String(300))  # URL to stored project image

    properties = db.relationship('Property', backref='project', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
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
            'alias_slugs': json.loads(self.alias_slugs) if self.alias_slugs else [],
            'form_status': self.form_status,
            'property_type': self.property_type,
            'sub_type': self.sub_type,
            'property_status': self.property_status,
            'possession_date': self.possession_date.isoformat() if self.possession_date else None,
            'configuration': json.loads(self.configuration) if self.configuration else None,
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
            'towers': self.towers,
            'floors_per_tower': self.floors_per_tower,
            'construction_status': self.construction_status,
            'floor_plans': json.loads(self.floor_plans) if self.floor_plans else [],
            'amenities': json.loads(self.amenities) if self.amenities else [],
            'project_image': self.project_image
        }

# Expanded Blog model for full content structure
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
    slug = db.Column(db.String(200), nullable=False)  # Removed unique=True
    target_type = db.Column(db.String(50), nullable=False)  # e.g., 'property', 'project', 'blog'
    target_id = db.Column(db.Integer, nullable=False)
    is_primary = db.Column(db.Boolean, default=False)

#---------------------------------------------END OF MODELS ---------------------------------------------

with app.app_context():
    try:
        # Create tables if they don't exist
        db.create_all()
        
        # Check if admin exists
        admin = User.query.filter_by(email='admin@gmail.com').first()
        if not admin:
            # Create admin user
            admin = User(
                username='admin',
                email='admin@gmail.com',
                password='admin',  # Plain text password
                role='admin',
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin created successfully!")
    except Exception as e:
        print(f"Error during database initialization: {str(e)}")
        db.session.rollback()

#--------------------------------------------- AUTH ROUTES ---------------------------------------------
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=data['password'],  # Plain text password
        phone=data.get('phone'),
        role=data.get('role', 'buyer')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': new_user.to_dict()
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    user = User.query.filter_by(email=data['email']).first()
    if not user or user.password != data['password']:  # Direct password comparison
        return jsonify({'message': 'Invalid email or password'}), 401
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    }), 200

#--------------------------------------------- ROUTERS AND API ENDPOINTS ---------------------------------------------

@app.route('/api/properties', methods=['GET'])
def get_properties():
    properties = Property.query.all()
    return jsonify([property.to_dict() for property in properties])

@app.route('/api/properties/<int:id>', methods=['GET'])
def get_property(id):
    property = Property.query.get_or_404(id)
    return jsonify(property.to_dict())

# 2. Update property creation logic to use slugify for slugs
@app.route('/api/properties', methods=['POST'])
def create_property():
    data = request.json
    title = data['title']
    location = data['location']
    project_id = data.get('project_id')
    # Extract fields for slug patterns
    bhk = str(data.get('bedrooms', ''))
    property_type = str(data.get('property_type', ''))
    locality = str(data.get('locality', ''))
    builder = str(data.get('builder_name', ''))
    city = str(data.get('city', ''))
    price_range = str(data.get('price_range', ''))
    property_type_variant = str(data.get('sub_type', property_type))
    bhk_as_text = f"{bhk}-bedroom" if bhk else ''
    # id will be set after commit, so use a placeholder for now
    temp_id = 'id'
    # Generate slugs with placeholders
    primary_slug_pattern = f"/property/{bhk}-{property_type}-in-{locality}-{builder}-{temp_id}"
    alias_patterns = [
        f"/property/{bhk}-{locality}-{property_type}-{temp_id}",
        f"/property/{locality}-{bhk}-{property_type_variant}-{builder}",
        f"/property/{bhk_as_text}-{property_type}-{city}",
        f"/property/{bhk}-in-{locality}-under-{price_range}",
        f"/property/{locality}-{property_type}-{bhk}-{builder}-{temp_id}"
    ]
    # Use slugify for all slugs
    primary_slug = slugify(primary_slug_pattern)
    alias_slugs = [slugify(p) for p in alias_patterns]
    new_property = Property(
        title=title,
        description=data['description'],
        price=data['price'],
        location=location,
        city=city,
        state=data.get('state'),
        pincode=data.get('pincode'),
        bedrooms=data['bedrooms'],
        bathrooms=data['bathrooms'],
        area_sqft=data['area_sqft'],
        furnishing=data.get('furnishing'),
        property_type=property_type,
        property_status=data.get('property_status'),
        availability_date=datetime.strptime(data['availability_date'], '%Y-%m-%d').date() if data.get('availability_date') else None,
        image_urls=data.get('image_urls'),
        user_id=data['user_id'],
        project_id=project_id,
        primary_slug=primary_slug,
        alias_slugs=json.dumps(alias_slugs)
    )
    db.session.add(new_property)
    db.session.commit()
    # Now update slugs with the real property id
    real_id = new_property.id
    primary_slug = slugify(f"/property/{bhk}-{property_type}-in-{locality}-{builder}-{real_id}")
    alias_slugs = [
        slugify(f"/property/{bhk}-{locality}-{property_type}-{real_id}"),
        slugify(f"/property/{locality}-{bhk}-{property_type_variant}-{builder}"),
        slugify(f"/property/{bhk_as_text}-{property_type}-{city}"),
        slugify(f"/property/{bhk}-in-{locality}-under-{price_range}"),
        slugify(f"/property/{locality}-{property_type}-{bhk}-{builder}-{real_id}")
    ]
    new_property.primary_slug = primary_slug
    new_property.alias_slugs = json.dumps(alias_slugs)
    db.session.commit()
    # Insert slugs into Slug table
    db.session.add(Slug(slug=primary_slug, target_type='property', target_id=new_property.id, is_primary=True))
    for alias in alias_slugs:
        db.session.add(Slug(slug=alias, target_type='property', target_id=new_property.id, is_primary=False))
    db.session.commit()
    return jsonify(new_property.to_dict()), 201

@app.route('/api/builders', methods=['GET'])
def get_builders():
    try:
        # Get the token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401

        token = auth_header.split(' ')[1]
        # You might want to verify the token here if you're using JWT

        print("Fetching builders...")  # Debug log
        builders = Builder.query.all()
        print(f"Found {len(builders)} builders")  # Debug log
        
        builders_data = [builder.to_dict() for builder in builders]
        return jsonify(builders_data)
    except Exception as e:
        print(f"Error in get_builders: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders/<rera_id>', methods=['GET'])
def get_builder(rera_id):
    try:
        builder = Builder.query.get_or_404(rera_id)
        return jsonify(builder.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders', methods=['POST'])
def create_builder():
    try:
        # Get user_id and rera_id from form data
        user_id = request.form.get('user_id')
        rera_id = request.form.get('reraId')
        
        if not user_id:
            return jsonify({'message': 'User ID is required'}), 400
        if not rera_id:
            return jsonify({'message': 'RERA ID is required'}), 400

        # Check if builder with this RERA ID already exists
        existing_builder = Builder.query.filter_by(rera_id=rera_id).first()
        if existing_builder:
            return jsonify({'message': 'Builder with this RERA ID already exists'}), 400

        # Get the user to check if they are admin
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Handle file uploads
        builder_logo = request.files.get('builderLogo')
        cover_banner = request.files.get('coverBanner')
        certificates = request.files.getlist('certificates')
    
        # Save builder logo
        logo_path = None
        if builder_logo and allowed_file(builder_logo.filename):
            filename = secure_filename(f"logo_{rera_id}_{builder_logo.filename}")
            logo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            builder_logo.save(logo_path)

        # Save cover banner
        banner_path = None
        if cover_banner and allowed_file(cover_banner.filename):
            filename = secure_filename(f"banner_{rera_id}_{cover_banner.filename}")
            banner_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            cover_banner.save(banner_path)

        # Save certificates
        certificate_paths = []
        for cert in certificates:
            if cert and allowed_file(cert.filename):
                filename = secure_filename(f"cert_{rera_id}_{cert.filename}")
                cert_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                cert.save(cert_path)
                certificate_paths.append(cert_path)

        # Create new builder
        new_builder = Builder(
            rera_id=rera_id,
            user_id=user_id,
            company_name=request.form.get('companyName'),
            brand_name=request.form.get('brandName'),
            established_year=request.form.get('establishedYear'),
            builder_type=request.form.get('builderType'),
            rera_registered=request.form.get('reraRegistered') == 'true',
            corporate_address=request.form.get('corporateAddress'),
            city=request.form.get('city'),
            state=request.form.get('state'),
            pin_code=request.form.get('pinCode'),
            contact_email=request.form.get('contactEmail'),
            contact_number=request.form.get('contactNumber'),
            website_url=request.form.get('websiteUrl'),
            builder_logo=logo_path,
            cover_banner=banner_path,
            certificates=json.dumps(certificate_paths),
            location=request.form.get('location'),
            short_description=request.form.get('shortDescription'),
            detailed_description=request.form.get('detailedDescription'),
            completed_projects=request.form.get('completedProjects'),
            ongoing_projects=request.form.get('ongoingProjects'),
            awards=request.form.get('awards'),
            verified=False
        )
    
        db.session.add(new_builder)
        db.session.commit()
    
        return jsonify({
            'message': 'Builder profile created successfully',
            'builder': new_builder.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating builder: {str(e)}")
        return jsonify({'message': f'Error creating builder profile: {str(e)}'}), 500

@app.route('/api/builders/<rera_id>', methods=['PUT'])
def update_builder(rera_id):
    try:
        builder = Builder.query.get_or_404(rera_id)
        data = request.get_json()

        # Update builder fields
        for field in ['company_name', 'brand_name', 'established_year', 'builder_type',
                     'rera_registered', 'corporate_address', 'city', 'state',
                     'pin_code', 'contact_email', 'contact_number', 'website_url',
                     'location', 'short_description', 'detailed_description',
                     'completed_projects', 'ongoing_projects', 'verified']:
            if field in data:
                setattr(builder, field, data[field])

        db.session.commit()
        return jsonify({'message': 'Builder updated successfully', 'builder': builder.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

import re
@app.route('/api/builders/<rera_id>', methods=['DELETE'])
def delete_builder(rera_id):
    try:
        builder = Builder.query.get_or_404(rera_id)
        db.session.delete(builder)
        db.session.commit()
        return jsonify({'message': 'Builder deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/builders/<rera_id>/projects', methods=['GET'])
def get_builder_projects(rera_id):
    try:
        projects = BuilderProject.query.filter_by(builder_id=rera_id).all()
        return jsonify([project.to_dict() for project in projects])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#-----------------STEP 1 ROUTING FETCHING DETAILS FROM FRONTEND AND PUSHING TO DATABASE------------------------
@app.route('/api/builders/<rera_id>/projects/step1', methods=['POST'])
def create_project_step1(rera_id):
    data = request.json
    title = data['title']
    location = data['location']
    builder_name = data.get('builder_name')
    if not builder_name:
        builder = Builder.query.filter_by(rera_id=rera_id).first()
        builder_name = builder.company_name if builder else None
    new_project = BuilderProject(
        builder_id=rera_id,
        builder_name=builder_name,
        title=title,
        description=data.get('description'),
        location=location,
        property_type=data.get('property_type'),
        sub_type=data.get('sub_type'),
        property_status=data.get('property_status'),
        possession_date=None, # handled elsewhere
        configuration=json.dumps(data.get('configuration')) if data.get('configuration') else None,
        total_units=data.get('total_units'),
        price_range=data.get('price_range'),
        completion_date=None, # handled elsewhere
        status=data.get('status'),
        image_urls=data.get('image_urls'),
        form_status=data.get('form_status', 'draft'),
        full_address=data.get('full_address'),
        state=data.get('state'),
        city=data.get('city'),
        locality=data.get('locality'),
        landmark=data.get('landmark'),
        towers=data.get('towers'),
        floors_per_tower=data.get('floors_per_tower'),
        construction_status=data.get('construction_status')
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify(new_project.to_dict()), 201

@app.route('/api/builders/<rera_id>/projects/step2', methods=['POST'])
def create_project_step2(rera_id):
    data = request.json
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    project = BuilderProject.query.filter_by(id=project_id, builder_id=rera_id).first_or_404()
    # Update fields for step 2
    project.total_units = data.get('totalUnits')
    project.price_range = f"{data.get('priceMin', '')} - {data.get('priceMax', '')}"
    project.price_per_sqft = data.get('pricePerSqft')
    project.carpet_area_min = data.get('carpetAreaMin')
    project.carpet_area_max = data.get('carpetAreaMax')
    project.booking_amount = data.get('bookingAmount')
    project.flat_number = data.get('flat_number')
    project.form_status = 'step2_complete'
    db.session.commit()
    return jsonify(project.to_dict()), 200

@app.route('/api/builders/<rera_id>/projects/step4', methods=['POST'])
def create_project_step4(rera_id):
    # Handle both form data and JSON data
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
    else:
        data = request.json
    
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    
    # Allow updating any project, not just from the current builder
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    
    # Handle file uploads for floor plans
    floor_plan_urls = []
    if 'floor_plans' in request.files:
        files = request.files.getlist('floor_plans')
        for file in files:
            if file and allowed_file(file.filename):
                filename = save_image(file)
                if filename:
                    floor_plan_urls.append(f'/uploads/{filename}')
    
    # Update fields for step 4
    project.towers = int(data.get('towers')) if data.get('towers') else None
    project.floors_per_tower = int(data.get('floors_per_tower')) if data.get('floors_per_tower') else None
    project.construction_status = data.get('construction_status')
    project.floor_plans = json.dumps(floor_plan_urls)
    project.form_status = 'step4_complete'
    
    db.session.commit()
    return jsonify(project.to_dict()), 200

@app.route('/api/builders/<rera_id>/projects/step5', methods=['POST'])
def create_project_step5(rera_id):
    data = request.json
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    
    # Allow updating any project, not just from the current builder
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    
    # Update fields for step 5
    project.amenities = json.dumps(data.get('amenities', []))
    project.form_status = 'step5_complete'
    
    db.session.commit()
    return jsonify(project.to_dict()), 200

def generate_slug_with_perplexity(project, api_key):
    """
    Calls Perplexity AI to generate a slug for a builder project.
    Fallbacks to slugify if the API call fails.
    """
    import requests
#-----------------------------------------PROMPTING WITH AI-----------------------------------------------
    
    prompt = (
        f"Generate a short, SEO-friendly, unique URL slug for a real estate project. "
        f"Only return the slug, no extra text. "
        f"Builder: {project.builder_name}\n"
        f"Project Title: {project.title}\n"
        f"Description: {project.description}\n"
        f"Property Type: {project.property_type}\n"
        f"Sub Type: {project.sub_type}\n"
        f"Locality: {project.locality}\n"
        f"City: {project.city}\n"
        f"Price Range: {project.price_range}\n"
        f"Configuration: {project.configuration}"
    )
    url = "https://api.perplexity.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "pplx-70b-online",  
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 20,
        "temperature": 0.2
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        slug = response.json()['choices'][0]['message']['content'].strip()
        # Sanitize slug: lowercase, replace spaces/underscores with hyphens, remove non-url chars
        slug = slug.lower()
        slug = re.sub(r'[^a-z0-9\- ]', '', slug)
        slug = slug.replace(' ', '-').replace('_', '-')
        slug = re.sub(r'-+', '-', slug).strip('-')
        return slug
    except Exception as e:
        # Fallback to slugify
        return slugify(f"{project.title}-{project.locality}-{project.city}")

@app.route('/api/builders/<rera_id>/projects/<int:project_id>', methods=['PATCH'])
def update_project_step(rera_id, project_id):
    try:
        data = request.json
        project = BuilderProject.query.filter_by(id=project_id, builder_id=rera_id).first_or_404()
        # Update only provided fields
        for key, value in data.items():
            if key == 'floor_plans':
                # Always save as JSON array
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if not isinstance(parsed, list):
                            parsed = [parsed]
                        value = json.dumps(parsed)
                    except Exception:
                        value = json.dumps([value])
                elif isinstance(value, list):
                    value = json.dumps(value)
                setattr(project, key, value)
            elif key == 'amenities':
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if not isinstance(parsed, list):
                            parsed = [parsed]
                        value = json.dumps(parsed)
                    except Exception:
                        value = json.dumps([value])
                elif isinstance(value, list):
                    value = json.dumps(value)
                setattr(project, key, value)
            elif hasattr(project, key):
                setattr(project, key, value)
        # Optionally update form_status
        if 'form_status' in data:
            project.form_status = data['form_status']
        db.session.commit()
        # After step 3, generate slugs if all required fields are present
        required_fields = [project.configuration, project.property_type, project.locality, project.builder_name, project.city, project.price_range]
        if all(required_fields):
            # Use Perplexity AI to generate the primary slug
            api_key = os.getenv('PERPLEXITY_API_KEY')
            primary_slug = generate_slug_with_perplexity(project, api_key)
            # Optionally, generate alias slugs using variations (fallback to slugify for aliases)
            try:
                config = json.loads(project.configuration) if project.configuration else []
            except Exception:
                config = []
            bhk = str(config[0]) if config else ''
            property_type = str(project.property_type or '')
            locality = str(project.locality or '')
            builder = str(project.builder_name or '')
            city = str(project.city or '')
            price_range = str(project.price_range or '')
            property_type_variant = str(project.sub_type or property_type)
            bhk_as_text = f"{bhk}-bedroom" if bhk else ''
            alias_slugs = [
                slugify(f"/project/{bhk}-{locality}-{property_type}"),
                slugify(f"/project/{locality}-{bhk}-{property_type_variant}-{builder}"),
                slugify(f"/project/{bhk_as_text}-{property_type}-in-{city}"),
                slugify(f"/project/{bhk}-in-{locality}-under-{price_range}"),
                slugify(f"/project/{locality}-{property_type}-{bhk}-{builder}")
            ]
            project.primary_slug = primary_slug
            project.alias_slugs = json.dumps(alias_slugs)
            db.session.commit()
            # Remove old slugs for this project
            Slug.query.filter_by(target_type='project', target_id=project.id).delete()
            db.session.commit()
            db.session.add(Slug(slug=primary_slug, target_type='project', target_id=project.id, is_primary=True))
            for alias in alias_slugs:
                db.session.add(Slug(slug=alias, target_type='project', target_id=project.id, is_primary=False))
            db.session.commit()
            # Return slugs in response
            result = project.to_dict()
            result['primary_slug'] = primary_slug
            result['alias_slugs'] = alias_slugs
            return jsonify(result), 200
        return jsonify(project.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    project = BuilderProject.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted successfully'})

#--------------------------------------------- ADMIN ROUTES ---------------------------------------------
#--------------------------------------------- DONT EVEN THINK TO TOUCH THIS  ---------------------------------------------
#----------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------
@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    try:
        print("Starting to fetch admin stats...")  # Debug log
        
        # Get total users
        total_users = User.query.count()
        print(f"Total users: {total_users}")  # Debug log
        
        # Get total properties
        total_properties = Property.query.count()
        print(f"Total properties: {total_properties}")  # Debug log
        
        # Get total enquiries
        total_enquiries = Enquiry.query.count()
        print(f"Total enquiries: {total_enquiries}")  # Debug log
        
        # Get total reviews
        total_reviews = Review.query.count()
        print(f"Total reviews: {total_reviews}")  # Debug log
        
        # Get recent activities
        print("Fetching recent activities...")  # Debug log
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_properties = Property.query.order_by(Property.created_at.desc()).limit(5).all()
        recent_enquiries = Enquiry.query.order_by(Enquiry.timestamp.desc()).limit(5).all()
        
        # Combine and sort activities
        activities = []
        
        for user in recent_users:
            activities.append({
                'type': 'user',
                'title': user.username,
                'description': 'New user registered',
                'timestamp': user.created_at.isoformat() if user.created_at else None
            })
            
        for property in recent_properties:
            activities.append({
                'type': 'property',
                'title': property.title,
                'description': 'New property listed',
                'timestamp': property.created_at.isoformat() if property.created_at else None
            })
            
        for enquiry in recent_enquiries:
            activities.append({
                'type': 'enquiry',
                'title': f'Enquiry for Property #{enquiry.property_id}',
                'description': 'New enquiry received',
                'timestamp': enquiry.timestamp.isoformat() if enquiry.timestamp else None
            })
        
        # Sort activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        # Take only the 5 most recent activities
        recent_activities = activities[:5]
        print(f"Recent activities count: {len(recent_activities)}")  # Debug log
        
        response_data = {
            'totalUsers': total_users,
            'totalProperties': total_properties,
            'totalEnquiries': total_enquiries,
            'totalReviews': total_reviews,
            'recentActivities': recent_activities
        }
        print("Successfully prepared response data")  # Debug log
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in get_admin_stats: {str(e)}")  # Debug log
        import traceback
        print(traceback.format_exc())  # Print full stack trace
        return jsonify({'error': str(e)}), 500

#--------------------------------------------- USER MANAGEMENT ROUTES ---------------------------------------------
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        # Get the token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401

        # Get all users
        users = User.query.all()
        users_data = [{
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active if hasattr(user, 'is_active') else True,
            'created_at': user.created_at.isoformat() if user.created_at else None
        } for user in users]
        
        return jsonify(users_data)
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['GET'])
def get_user(id):
    try:
        user = User.query.get_or_404(id)
        return jsonify({
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active if hasattr(user, 'is_active') else True,
            'created_at': user.created_at.isoformat() if user.created_at else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['PUT'])
def update_user(id):
    try:
        user = User.query.get_or_404(id)
        data = request.get_json()

        # Update user fields
        if 'name' in data:
            user.username = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'role' in data:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = data['is_active']
        # Add more fields as needed

        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'name': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active if hasattr(user, 'is_active') else True,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    try:
        user = User.query.get_or_404(id)
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Utility to generate slug from title
import re
from unicodedata import normalize

def generate_slug(title):
    slug = normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', slug).lower()
    slug = re.sub(r'\s+', '-', slug).strip('-')
    return slug

# Utility to save uploaded images
def save_image(file):
    if file and allowed_file(file.filename):
        # Check file size (5MB limit per image)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 5 * 1024 * 1024:  # 5MB limit
            return None  # File too large
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return filename  # Only return the filename, not the full path
    return None

# API to create a blog (multipart/form-data)
@app.route('/api/blogs', methods=['POST'])
def create_blog():
    try:
        data = request.form
        files = request.files
        title = data.get('title')
        intro_paragraph1 = data.get('introParagraph')
        subheading1 = data.get('subheading1')
        content1 = data.get('content1')
        subheading2 = data.get('subheading2')
        content2 = data.get('content2')
        subheading3 = data.get('subheading3')
        content3 = data.get('content3')
        meta_description = data.get('metaDescription')
        focus_keywords = data.get('focusKeywords')
        slug = data.get('slug') or generate_slug(title)
        featured_image_alt = data.get('featuredImageAlt')
        alt_text1 = data.get('altText1')
        alt_text2 = data.get('altText2')
        alt_text3 = data.get('altText3')
        interlinks = data.get('interlinks')  # JSON string
        external_links = data.get('externalLinks')  # JSON string

        # Save images
        featured_image = save_image(files.get('featuredImage'))
        image1 = save_image(files.get('image1'))
        image2 = save_image(files.get('image2'))
        image3 = save_image(files.get('image3'))

        # Ensure slug is unique
        if Blog.query.filter_by(slug=slug).first():
            return jsonify({'error': 'Slug already exists'}), 400

        blog = Blog(
            title=title,
            intro_paragraph=intro_paragraph1,
            subheading1=subheading1,
            content1=content1,
            image1=image1,
            alt_text1=alt_text1,
            subheading2=subheading2,
            content2=content2,
            image2=image2,
            alt_text2=alt_text2,
            subheading3=subheading3,
            content3=content3,
            image3=image3,
            alt_text3=alt_text3,
            featured_image=featured_image,
            featured_image_alt=featured_image_alt,
            interlinks=interlinks,
            external_links=external_links,
            meta_description=meta_description,
            focus_keywords=focus_keywords,
            slug=slug
        )
        db.session.add(blog)
        db.session.commit()
        return jsonify({'success': True, 'blog': blog.to_dict()}), 201
    except Exception as e:
        return jsonify({'error': f'Blog creation failed: {str(e)}'}), 500

# API to list all blogs (for admin dashboard)
@app.route('/api/blogs', methods=['GET'])
def list_blogs():
    blogs = Blog.query.order_by(Blog.created_at.desc()).all()
    print(f"Found {len(blogs)} blogs")
    for blog in blogs:
        print(f"Blog: {blog.title} - Slug: {blog.slug}")
    return jsonify([b.to_dict() for b in blogs])

# Get a single blog by ID
@app.route('/api/blogs/<int:blog_id>', methods=['GET'])
def get_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    return jsonify(blog.to_dict())

# Get a single blog by slug
@app.route('/api/blogs/slug/<slug>', methods=['GET'])
def get_blog_by_slug(slug):
    print(f"Fetching blog with slug: {slug}")
    blog = Blog.query.filter_by(slug=slug).first()
    if not blog:
        print(f"Blog not found for slug: {slug}")
        return jsonify({'error': 'Blog not found'}), 404
    print(f"Blog found: {blog.title}")
    return jsonify(blog.to_dict())

# Update a blog by ID (multipart/form-data for images)
@app.route('/api/blogs/<int:blog_id>', methods=['PUT'])
def update_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    data = request.form
    files = request.files
    blog.title = data.get('title', blog.title)
    blog.intro_paragraph = data.get('introParagraph', blog.intro_paragraph)
    blog.subheading1 = data.get('subheading1', blog.subheading1)
    blog.content1 = data.get('content1', blog.content1)
    blog.subheading2 = data.get('subheading2', blog.subheading2)
    blog.content2 = data.get('content2', blog.content2)
    blog.subheading3 = data.get('subheading3', blog.subheading3)
    blog.content3 = data.get('content3', blog.content3)
    blog.meta_description = data.get('metaDescription', blog.meta_description)
    blog.focus_keywords = data.get('focusKeywords', blog.focus_keywords)
    blog.slug = data.get('slug', blog.slug)
    blog.featured_image_alt = data.get('featuredImageAlt', blog.featured_image_alt)
    blog.alt_text1 = data.get('altText1', blog.alt_text1)
    blog.alt_text2 = data.get('altText2', blog.alt_text2)
    blog.alt_text3 = data.get('altText3', blog.alt_text3)
    blog.interlinks = data.get('interlinks', blog.interlinks)
    blog.external_links = data.get('externalLinks', blog.external_links)
    # Update images if new files are uploaded
    if files.get('featuredImage'):
        blog.featured_image = save_image(files.get('featuredImage'))
    if files.get('image1'):
        blog.image1 = save_image(files.get('image1'))
    if files.get('image2'):
        blog.image2 = save_image(files.get('image2'))
    if files.get('image3'):
        blog.image3 = save_image(files.get('image3'))
    db.session.commit()
    return jsonify({'success': True, 'blog': blog.to_dict()})

# Delete a blog by ID (and its images)
@app.route('/api/blogs/<int:blog_id>', methods=['DELETE'])
def delete_blog(blog_id):
    blog = Blog.query.get_or_404(blog_id)
    # Optionally, delete image files from disk
    for img_field in ['featured_image', 'image1', 'image2', 'image3']:
        img = getattr(blog, img_field)
        if img:
            img_path = os.path.join(app.config['UPLOAD_FOLDER'], img)
            if os.path.exists(img_path):
                try:
                    os.remove(img_path)
                except Exception:
                    pass
    db.session.delete(blog)
    db.session.commit()
    return jsonify({'success': True})

# Serve SEO-friendly blog page
from flask import render_template_string
@app.route('/blog/<slug>', methods=['GET'])
def serve_blog(slug):
    blog = Blog.query.filter_by(slug=slug).first_or_404()
    # Render interlinks and external links
    interlinks_html = ''
    if blog.interlinks:
        links = json.loads(blog.interlinks)
        if links:
            interlinks_html = '<h3>Related Articles</h3><ul>' + ''.join(f'<li><a href="{l}">{l}</a></li>' for l in links) + '</ul>'
    external_links_html = ''
    if blog.external_links:
        links = json.loads(blog.external_links)
        if links:
            external_links_html = '<h3>External Resources</h3><ul>' + ''.join(f'<li><a href="{l}" target="_blank" rel="noopener noreferrer">{l}</a></li>' for l in links) + '</ul>'
    html = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{blog.title}</title>
        <meta name="description" content="{blog.meta_description or ''}">
        <meta property="og:title" content="{blog.title}">
        <meta property="og:description" content="{blog.meta_description or ''}">
        <meta property="og:type" content="article">
        <meta property="og:url" content="{{request.url}}">
        <meta name="keywords" content="{blog.focus_keywords or ''}">
    </head>
    <body>
        <h1>{blog.title}</h1>
        <p>{blog.intro_paragraph}</p>
        {'<img src="/' + blog.featured_image + '" alt="' + (blog.featured_image_alt or '') + '" style="max-width:400px;">' if blog.featured_image else ''}
        <h2>{blog.subheading1 or ''}</h2>
        <p>{blog.content1 or ''}</p>
        {'<img src="/' + blog.image1 + '" alt="' + (blog.alt_text1 or '') + '" style="max-width:400px;">' if blog.image1 else ''}
        <h2>{blog.subheading2 or ''}</h2>
        <p>{blog.content2 or ''}</p>
        {'<img src="/' + blog.image2 + '" alt="' + (blog.alt_text2 or '') + '" style="max-width:400px;">' if blog.image2 else ''}
        <h2>{blog.subheading3 or ''}</h2>
        <p>{blog.content3 or ''}</p>
        {'<img src="/' + blog.image3 + '" alt="' + (blog.alt_text3 or '') + '" style="max-width:400px;">' if blog.image3 else ''}
        {interlinks_html}
        {external_links_html}
    </body>
    </html>
    '''
    return render_template_string(html)

# Serve uploaded images
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Remove this endpoint since we're using the existing /uploads/<filename> endpoint

# Update /api/projects/slug/<slug> to handle BuilderProject slugs
@app.route('/api/projects/slug/<slug>', methods=['GET'])
def get_project_by_slug(slug):
    slug_entry = Slug.query.filter_by(slug=slug, target_type='project').first()
    if not slug_entry:
        return jsonify({'error': 'Project not found'}), 404
    project = BuilderProject.query.get(slug_entry.target_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if not slug_entry.is_primary:
        primary_entry = Slug.query.filter_by(target_type='project', target_id=project.id, is_primary=True).first()
        if primary_entry:
            return redirect(f"/api/projects/slug/{primary_entry.slug}", code=301)
    return jsonify(project.to_dict())

# 3. Redirect alias slugs to primary in /api/properties/slug/<slug>
@app.route('/api/properties/slug/<slug>', methods=['GET'])
def get_property_by_slug(slug):
    slug_entry = Slug.query.filter_by(slug=slug, target_type='property').first()
    if not slug_entry:
        return jsonify({'error': 'Property not found'}), 404
    property = Property.query.get(slug_entry.target_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    if not slug_entry.is_primary:
        # Redirect to canonical slug
        primary_entry = Slug.query.filter_by(target_type='property', target_id=property.id, is_primary=True).first()
        if primary_entry:
            return redirect(f"/api/properties/slug/{primary_entry.slug}", code=301)
    return jsonify(property.to_dict())

@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    projects = BuilderProject.query.all()
    return jsonify([p.to_dict() for p in projects])

@app.route('/api/builders/<rera_id>/projects/upload-image', methods=['POST'])
def upload_project_image(rera_id):
    print(f"Upload project image called with rera_id: {rera_id}")
    print(f"Request form data: {request.form}")
    print(f"Request files: {request.files}")
    
    # Accepts multipart/form-data with project_id and project_image
    project_id = request.form.get('project_id')
    print(f"Project ID from form: {project_id}")
    
    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400
    if 'project_image' not in request.files:
        return jsonify({'error': 'project_image file is required'}), 400
    
    file = request.files['project_image']
    print(f"File received: {file.filename}")
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Save the image file to uploads folder
    filename = save_image(file)
    print(f"Saved filename: {filename}")
    
    if not filename:
        return jsonify({'error': 'Failed to save image'}), 500
    
    # Update the project
    project = BuilderProject.query.filter_by(id=project_id).first_or_404()
    print(f"Found project: {project.title}")
    
    # Store the image URL in the project_image field
    project.project_image = f'/uploads/{filename}'
    print(f"Setting project_image to: {project.project_image}")
    
    db.session.commit()
    print(f"Database updated successfully")
    
    return jsonify(project.to_dict()), 200

if __name__ == '__main__':
    app.run(debug=True) 