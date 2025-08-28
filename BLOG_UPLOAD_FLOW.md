# Blog Upload Flow Documentation

## Overview

The blog upload flow now uses Flask as the backend for blog management. Blogs are created via the admin dashboard, stored in the local database, and served as SEO-friendly HTML pages.

## Architecture

```
React Frontend → Flask Backend (local DB)
     ↓              ↓
AdminBlog.jsx → /api/blogs → /blog/<slug>
```

## Components

### 1. React Frontend (`src/components/AdminBlog.jsx`)

- Sends blog data (title, content, meta, slug) to Flask backend.
- No WordPress API or credentials required.

### 2. Flask Backend (`backend/app.py`)

- `/api/blogs` (POST): Accepts blog data, generates slug if not provided, stores in DB.
- `/api/blogs` (GET): Lists all blogs for admin dashboard.
- `/blog/<slug>` (GET): Serves blog as HTML with SEO meta tags.

## Setup Instructions

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
pip install -r requirements.txt

# Frontend dependencies
cd ..
npm install
```

### 2. Start Services

```bash
# Start Flask backend
cd backend
python app.py

# Start React frontend (in another terminal)
npm run dev
```

## Testing

1. Navigate to the admin dashboard
2. Go to "Create Blog" section
3. Fill out the blog form
4. Submit and check for success/error messages
5. Visit `/blog/<slug>` to see the SEO-friendly blog page

## API Response Format

### Success Response (201)
```json
{
  "success": true,
  "blog": { /* Blog data */ }
}
```

### Error Response (400/500)
```json
{
  "error": "Error message"
}
``` 