# Upload Endpoint Fix - Supabase Storage Integration

## Problem
The `/api/upload` endpoint was returning a 500 error on Vercel because it used `multer.diskStorage()` to save files locally. **Vercel's serverless environment doesn't support persistent file system writes** - files written to disk during function execution are deleted immediately after.

## Solution
Migrated to **Supabase Storage** for cloud-based file uploads.

## Setup Instructions

### 1. Create Supabase Project (if not already done)
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Navigate to **Storage** section
- Create a new bucket named `portfolio-uploads`
- Set the bucket to **Public** so files are accessible

### 2. Get Supabase Credentials
In your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy:
   - `Project URL` (SUPABASE_URL)
   - `anon` public key (SUPABASE_ANON_KEY)

### 3. Configure Vercel Environment Variables
In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_BUCKET=portfolio-uploads
```

### 4. Local Testing
Create or update your `.env` file in `backend/`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_BUCKET=portfolio-uploads
```

Then run:
```bash
npm install  # Ensure @supabase/supabase-js is installed
npm run dev
```

### 5. Redeploy
Push changes to GitHub and Vercel will redeploy automatically:
```bash
git add .
git commit -m "Fix: migrate file uploads to Supabase Storage"
git push
```

## Changes Made
- ✅ Replaced `multer.diskStorage()` with `multer.memoryStorage()`
- ✅ Added Supabase client initialization
- ✅ Updated `/api/upload` to upload files to Supabase Storage
- ✅ Files now stored with public URLs that work on production

## Testing the Upload
Use any API client (Postman, curl, etc.):
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

Expected response:
```json
{
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/portfolio-uploads/portfolio/1234567890-image.jpg"
}
```
