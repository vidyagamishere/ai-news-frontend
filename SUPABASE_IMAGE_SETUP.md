# Supabase Image Service Setup Guide

## Overview
This service fetches random category images from Supabase storage instead of transferring images through the backend, reducing data transfer costs and improving performance.

## Architecture

```
Frontend (React) → Supabase Storage → Category Images
                ↓
         Article Objects with Images
```

**Benefits:**
- ✅ Reduced backend data transfer costs
- ✅ Faster image loading (CDN-based)
- ✅ Random images per article for variety
- ✅ Category-based image organization
- ✅ Image caching for performance

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project or use existing one
3. **npm package installed**: `@supabase/supabase-js` (already installed)

## Setup Steps

### 1. Create Supabase Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** → **Buckets**
3. Create a new public bucket named: `category-images`
4. Set it as **Public** (for direct frontend access)

### 2. Upload Category Images

Organize images in the bucket with this structure:

```
category-images/
├── generative-ai/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── image3.jpg
├── ai-applications/
│   ├── image1.jpg
│   └── image2.jpg
├── ai-startups/
│   ├── image1.jpg
│   └── image2.jpg
├── machine-learning/
│   └── image1.jpg
└── ...other categories
```

**Category folder names** should match your article categories (lowercase, hyphenated).

### 3. Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Configure Environment Variables

Update your `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

### 5. Restart Frontend Development Server

```bash
npm run dev
```

## How It Works

### Image Mapping Flow

1. **API Request**: Frontend fetches articles from backend
2. **Category Detection**: Service identifies article category
3. **Supabase Query**: Fetches random image from category folder
4. **Image Assignment**: Maps image URL to article object
5. **Caching**: Caches images per category (1-hour TTL)

### Code Example

```typescript
// Automatic - happens in api.ts
const articles = await apiService.getDigest();

// Each article now has:
{
  id: 1,
  title: "...",
  category: "Generative AI",
  image: "https://xxxxx.supabase.co/storage/v1/object/public/category-images/generative-ai/image1.jpg"
}
```

## Category Naming Convention

| Article Category | Folder Name | Example |
|-----------------|-------------|---------|
| Generative AI | `generative-ai` | `/generative-ai/gpt-image.jpg` |
| AI Applications | `ai-applications` | `/ai-applications/app-image.jpg` |
| AI Startups | `ai-startups` | `/ai-startups/startup-logo.jpg` |
| Machine Learning | `machine-learning` | `/machine-learning/ml-graph.jpg` |
| Natural Language Processing | `natural-language-processing` | `/natural-language-processing/nlp.jpg` |
| Computer Vision | `computer-vision` | `/computer-vision/cv-image.jpg` |
| AI Ethics | `ai-ethics` | `/ai-ethics/ethics.jpg` |
| AI Research | `ai-research` | `/ai-research/research.jpg` |
| AI Hardware | `ai-hardware` | `/ai-hardware/chip.jpg` |
| AI Tools | `ai-tools` | `/ai-tools/tools.jpg` |

**Note**: Categories are automatically converted to lowercase with spaces replaced by hyphens.

## Image Requirements

- **Format**: JPG, PNG, WebP, or GIF
- **Size**: Recommended 800x600px or higher
- **Aspect Ratio**: 16:9 or 4:3 preferred
- **File Size**: < 500KB for optimal loading
- **Naming**: Any name (e.g., `image1.jpg`, `openai-logo.png`)

## Testing

### Check if Service is Enabled

```typescript
import { supabaseImageService } from './services/supabaseImageService';

console.log('Supabase enabled:', supabaseImageService.isEnabled());
```

### Get Cache Statistics

```typescript
const stats = supabaseImageService.getCacheStats();
console.log('Cached categories:', stats.categories);
console.log('Total images:', stats.totalImages);
```

### Clear Cache (if needed)

```typescript
supabaseImageService.clearCache();
```

## Fallback Behavior

If Supabase is not configured or images are missing:

1. Service gracefully disables itself
2. Falls back to placeholder: `/placeholder-article.jpg`
3. No errors thrown - continues operation

## Performance Optimization

### Preloading Categories

```typescript
// Preload images for common categories on app startup
const commonCategories = [
  'Generative AI',
  'AI Applications', 
  'AI Startups'
];

await supabaseImageService.preloadCategories(commonCategories);
```

### Caching Strategy

- **1-hour cache**: Images cached per category
- **Random selection**: Different image each time
- **Parallel loading**: All categories load simultaneously

## Troubleshooting

### Issue: No images showing

**Check:**
1. ✅ Supabase credentials in `.env`
2. ✅ Bucket is public (not private)
3. ✅ Folder names match categories (lowercase, hyphenated)
4. ✅ Images exist in correct folders
5. ✅ Frontend dev server restarted after `.env` changes

### Issue: Console warnings

**"Supabase not enabled"**
- Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`
- Check `.env` file and restart server

**"No images found for category"**
- Category folder doesn't exist in Supabase
- Check folder naming (lowercase, hyphenated)

### Debug Mode

Enable detailed logging:

```typescript
// In browser console
localStorage.setItem('debug', 'supabase:*');
```

## Cost Analysis

### Before (Backend Image Transfer)
- Images stored in PostgreSQL/Railway
- Transferred through backend API
- ~500KB per image × 100 articles = ~50MB per request
- High backend bandwidth costs

### After (Supabase Direct Access)
- Images served from Supabase CDN
- Direct frontend → Supabase connection
- Only article metadata through backend (~50KB)
- **~99% reduction in backend data transfer**

## Security

- ✅ Public bucket (safe for article images)
- ✅ Anon key (public read-only access)
- ✅ No sensitive data exposed
- ✅ Rate limiting via Supabase CDN

## Production Deployment

### Vercel/Netlify

Add environment variables in deployment settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Railway Frontend

```bash
# Set via Railway CLI or dashboard
railway variables set VITE_SUPABASE_URL=https://xxxxx.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=eyJhbG...
```

## Maintenance

### Adding New Categories

1. Create folder in Supabase: `/new-category/`
2. Upload 5-10 images
3. No code changes needed - automatic detection

### Updating Images

1. Upload new images to category folder
2. Clear cache: `supabaseImageService.clearCache()`
3. New images appear on next load

## Support

For issues or questions:
- Check browser console for error messages
- Review Supabase dashboard for bucket permissions
- Verify `.env` configuration
- Test with `supabaseImageService.isEnabled()`

---

**Last Updated**: December 22, 2025
