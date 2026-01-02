/**
 * Supabase Image Service
 * Fetches random images per category from Supabase to reduce backend data transfer costs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Category to image URL mapping cache
interface CategoryImageCache {
  [category: string]: {
    images: string[];
    lastFetched: number;
  };
}

class SupabaseImageService {
  private supabase: SupabaseClient | null = null;
  private imageCache: CategoryImageCache = {};
  private cacheExpiry = 60 * 60 * 1000; // 1 hour cache
  private enabled = false;

  // Category image counts - configure exactly how many images exist per category
  private categoryImageCounts: { [key: string]: number } = {
    'generative_ai': 10,
    'ai_applications': 9,
    'ai_infrastructure': 8,
    'ai_startups': 10,
    'ai_governance': 10,
    'quantum_ai': 5,  // Only 5 images
    'internet_of_things': 5,  // Only 5 images
    'robotics': 6,
    'ai_security': 10,
    'ai_ethics': 10
  };

  constructor() {
    // Initialize Supabase client only if credentials are available
    console.log('🔧 Initializing Supabase Image Service...');
    console.log('📍 SUPABASE_URL:', SUPABASE_URL || 'NOT SET');
    console.log('🔑 SUPABASE_KEY:', SUPABASE_PUBLISHABLE_KEY ? 'SET (hidden)' : 'NOT SET');
    
    if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        this.enabled = true;
        console.log('✅ Supabase Image Service initialized');
      } catch (error) {
        console.warn('⚠️ Supabase initialization failed:', error);
        this.enabled = false;
      }
    } else {
      console.warn('⚠️ Supabase credentials not found. Image service disabled.');
      this.enabled = false;
    }
  }

  /**
   * Check if Supabase service is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.supabase !== null;
  }

  /**
   * Fetch images for a specific category from Supabase
   */
  async fetchCategoryImages(category: string): Promise<string[]> {
    if (!this.isEnabled() || !this.supabase) {
      console.warn('Supabase not enabled, returning empty images');
      return [];
    }

    try {
      // Check cache first
      const cached = this.imageCache[category];
      if (cached && Date.now() - cached.lastFetched < this.cacheExpiry) {
        console.log(`🚀 Using cached images for category: ${category}`);
        return cached.images;
      }

      console.log(`📡 Fetching images for category: ${category} from Supabase...`);

      // Use category_label directly if provided (from backend ai_categories_master.category_label)
      // Otherwise convert category name with special cases
      // Special mappings for category names:
      let categorySlug: string;
      
      const categoryMappings: { [key: string]: string } = {
        'ai start ups': 'ai_startups',
        'ai startups': 'ai_startups',
        'quantum ai': 'quantum_ai',
        'quantam ai': 'quantum_ai', // Handle typo
        'internet of things': 'internet_of_things',
        'ai governance': 'ai_governance',
        'ai applications': 'ai_applications',
        'generative ai': 'generative_ai'
      };
      
      const categoryLower = category.toLowerCase();
      categorySlug = categoryMappings[categoryLower] || categoryLower.replace(/\s+/g, '_');
      
      const folderPath = `${categorySlug}/desktop`;
      
      console.log(`🔍 Category: "${category}" → Slug: "${categorySlug}"`);
      console.log(`🔍 Looking for images in: vidyagam/${folderPath}`);
      
      const { data: files, error } = await this.supabase.storage
        .from('vidyagam')
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`❌ Error fetching images for ${category}:`, error);
        console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
        return [];
      }

      console.log(`📂 Files found in ${folderPath}:`, files?.length || 0);
      console.log(`📋 File list:`, files);

      // If list returns empty but we know images exist, try direct file access
      // This handles cases where list permission might be restricted
      if (!files || files.length === 0) {
        // Get the exact count for this category, default to 10
        const imageCount = this.categoryImageCounts[categorySlug] || 10;
        console.log(`⚠️ List returned empty, trying direct file access (1.png - ${imageCount}.png)...`);
        
        const imageUrls: string[] = [];
        
        // Only try to fetch the exact number of images that exist
        for (let i = 1; i <= imageCount; i++) {
          const fileName = `${i}.png`;
          const filePath = `${folderPath}/${fileName}`;
          
          // Get public URL (bucket is now public)
          const { data } = this.supabase.storage
            .from('vidyagam')
            .getPublicUrl(filePath);
          
          if (data?.publicUrl) {
            imageUrls.push(data.publicUrl);
          }
        }
        
        if (imageUrls.length > 0) {
          console.log(`✅ Found ${imageUrls.length} images via direct access`);
          // Cache the images
          this.imageCache[category] = {
            images: imageUrls,
            lastFetched: Date.now()
          };
          return imageUrls;
        }
      }

      // If no files found in desktop folder, try mobile folder as fallback
      if (!files || files.length === 0) {
        console.log(`⚠️ No images in desktop folder, trying mobile folder...`);
        const mobileFolderPath = `${categorySlug}/mobile`;
        
        const { data: mobileFiles, error: mobileError } = await this.supabase.storage
          .from('vidyagam')
          .list(mobileFolderPath, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (!mobileError && mobileFiles && mobileFiles.length > 0) {
          console.log(`✅ Found ${mobileFiles.length} images in mobile folder`);
          const imageUrls = mobileFiles
            .filter(file => file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
            .map(file => {
              const { data } = this.supabase!.storage
                .from('vidyagam')
                .getPublicUrl(`${mobileFolderPath}/${file.name}`);
              console.log(`🖼️  Generated URL for ${file.name}:`, data.publicUrl);
              return data.publicUrl;
            });

          // Cache the images
          this.imageCache[category] = {
            images: imageUrls,
            lastFetched: Date.now()
          };

          return imageUrls;
        }

        console.warn(`⚠️ No images found for category: ${category} in desktop or mobile folders`);
        return [];
      }

      // Get public URLs for all images (numbered PNG files: 1.png, 2.png, etc.)
      const imageUrls = files
        .filter(file => file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .map(file => {
          // Get public URL (bucket is now public)
          const { data } = this.supabase!.storage
            .from('vidyagam')
            .getPublicUrl(`${folderPath}/${file.name}`);
          console.log(`🖼️  Generated public URL for ${file.name}:`, data.publicUrl);
          return data.publicUrl;
        });

      console.log(`✅ Found ${imageUrls.length} images for ${category}:`, imageUrls);

      // Cache the images
      this.imageCache[category] = {
        images: imageUrls,
        lastFetched: Date.now()
      };

      console.log(`✅ Fetched ${imageUrls.length} images for category: ${category}`);
      return imageUrls;

    } catch (error) {
      console.error(`❌ Failed to fetch images for ${category}:`, error);
      return [];
    }
  }

  /**
   * Get a random image for a category
   */
  async getRandomImageForCategory(category: string): Promise<string | null> {
    const images = await this.fetchCategoryImages(category);
    
    if (images.length === 0) {
      return null;
    }

    // Return random image from the category
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  /**
   * Preload images for multiple categories
   */
  async preloadCategories(categories: string[]): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    console.log(`🔄 Preloading images for ${categories.length} categories...`);
    
    // Fetch all category images in parallel
    await Promise.all(
      categories.map(category => this.fetchCategoryImages(category))
    );

    console.log('✅ Category images preloaded');
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache = {};
    console.log('🗑️ Image cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { categories: string[]; totalImages: number } {
    const categories = Object.keys(this.imageCache);
    const totalImages = categories.reduce((sum, cat) => {
      return sum + (this.imageCache[cat]?.images.length || 0);
    }, 0);

    return { categories, totalImages };
  }
}

// Export singleton instance
export const supabaseImageService = new SupabaseImageService();

// Export for testing/debugging
export default supabaseImageService;
