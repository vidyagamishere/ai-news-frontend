# Local Development Setup with Railway PostgreSQL

This guide sets up a local development environment where:
- **Frontend**: Runs locally (localhost:5173) 
- **Backend**: Runs locally (localhost:8000)
- **Database**: Uses Railway PostgreSQL (production database)

## Prerequisites

1. **Railway Database Credentials**: Get your PostgreSQL connection string from Railway dashboard
2. **Google OAuth Client ID**: For authentication
3. **API Keys**: SendGrid, Anthropic (if testing scraping)

## Step 1: Backend Environment Setup

### 1.1 Get Railway Database URL
1. Go to your Railway project dashboard
2. Navigate to your PostgreSQL service
3. Copy the **DATABASE_URL** or **POSTGRES_URL** 
   - Format: `postgresql://username:password@host:port/database`

### 1.2 Create Backend Environment File
Create `/ai-news-backend/.env` with your Railway credentials:

```bash
# Railway PostgreSQL Database URL
DATABASE_URL=postgresql://username:password@host:port/database
POSTGRES_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET_KEY=your-jwt-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id

# Email Service  
SENDGRID_API_KEY=your-sendgrid-api-key

# AI Service
ANTHROPIC_API_KEY=your-anthropic-api-key

# Development Settings
DEBUG=true
LOG_LEVEL=DEBUG
SKIP_SCHEMA_INIT=true

# CORS Settings for Local Development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Admin Settings
ADMIN_API_KEY=admin-api-key-2024
```

### 1.3 Install Backend Dependencies
```bash
cd ai-news-backend
pip install -r requirements.txt
```

## Step 2: Frontend Environment Setup

### 2.1 Update Frontend Environment
Edit `/ai-news-frontend/.env.local` to point to local backend:

```bash
# Local Backend URL
VITE_API_BASE=http://localhost:8000

# Enable debug mode for development
VITE_DEBUG_MODE=true

# Development flags
VITE_ENABLE_ADMIN_FEATURES=true
VITE_ENABLE_BETA_FEATURES=true

# Google OAuth (use same as production)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 2.2 Install Frontend Dependencies
```bash
cd ai-news-frontend
npm install
```

## Step 3: Start Development Servers

### 3.1 Start Backend Server
```bash
cd ai-news-backend
python main.py
```
- Backend will run on: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

### 3.2 Start Frontend Server
```bash
cd ai-news-frontend
npm run dev
```
- Frontend will run on: `http://localhost:5173`

## Step 4: Test Admin Flow

### 4.1 Admin Login Options

**Option 1: Direct Admin Login**
1. Go to `http://localhost:5173/admin/login`
2. Use credentials:
   - Username: `admin@vidyagam.com`
   - Password: `Vidyagam@Success`

**Option 2: Regular Login (if admin user exists in database)**
1. Go to `http://localhost:5173/auth`
2. Sign in with `admin@vidyagam.com` using Google OAuth
3. Should auto-redirect to admin dashboard if user has `is_admin=true`

### 4.2 Expected Admin Features
- View and manage AI sources
- Initiate scraping with "Admin Scraping" button
- Validate RSS feeds
- Add/edit/delete sources

## Step 5: Verify Database Connection

### 5.1 Check Backend Health
```bash
curl http://localhost:8000/health
```

### 5.2 Test Admin Endpoints
```bash
# Test admin authentication (replace with actual JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/admin/sources
```

## Troubleshooting

### Common Issues

**1. Admin Login Not Working**
- Check if `admin@vidyagam.com` exists in Railway database with `is_admin=true`
- Verify credentials in AdminAuthContext.tsx
- Check browser console for authentication errors

**2. Database Connection Failed**
- Verify DATABASE_URL format and credentials
- Check Railway database is accessible
- Ensure `SKIP_SCHEMA_INIT=true` to avoid schema conflicts

**3. CORS Errors**
- Verify `ALLOWED_ORIGINS` includes `http://localhost:5173`
- Check frontend is pointing to `http://localhost:8000`

**4. Admin Scraping Not Working**
- Verify user has `is_admin=true` in database
- Check ANTHROPIC_API_KEY is valid
- Review backend logs for detailed errors

### Debug Commands

```bash
# Check backend logs
cd ai-news-backend && python main.py

# Check frontend in debug mode
cd ai-news-frontend && npm run dev

# Test specific endpoints
curl http://localhost:8000/health
curl http://localhost:8000/admin/sources  # (with auth)
```

## Database Admin User Setup

If `admin@vidyagam.com` doesn't exist with admin privileges:

### Option 1: Create via Backend Script
```python
# In ai-news-backend directory
python -c "
from db_service import get_database_service
db = get_database_service()
db.execute_query(
    'INSERT INTO users (email, is_admin, email_verified) VALUES (%s, %s, %s) ON CONFLICT (email) DO UPDATE SET is_admin = EXCLUDED.is_admin',
    ('admin@vidyagam.com', True, True)
)
print('Admin user created/updated')
"
```

### Option 2: Direct Database Update
Connect to Railway PostgreSQL and run:
```sql
UPDATE users SET is_admin = true WHERE email = 'admin@vidyagam.com';
-- Or insert if doesn't exist
INSERT INTO users (email, is_admin, email_verified) 
VALUES ('admin@vidyagam.com', true, true) 
ON CONFLICT (email) DO UPDATE SET is_admin = EXCLUDED.is_admin;
```

## Success Indicators

✅ **Backend Running**: Health endpoint returns 200  
✅ **Frontend Running**: Vite dev server accessible  
✅ **Database Connected**: No connection errors in backend logs  
✅ **Admin Login**: Can access admin dashboard  
✅ **Admin Scraping**: Can trigger scraping successfully  

Your local environment is now ready for testing admin and user flows!