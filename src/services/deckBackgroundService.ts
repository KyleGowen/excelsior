import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Service for managing deck background images
 * Provides caching for background image listings
 */
export class DeckBackgroundService {
  private readonly BACKGROUNDS_DIR = path.join(__dirname, '../resources/cards/images/backgrounds');
  private cachedBackgrounds: string[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  /**
   * Get list of available background images
   * Results are cached for 15 minutes
   */
  async getAvailableBackgrounds(): Promise<string[]> {
    const now = Date.now();
    
    // Return cached results if still valid
    if (this.cachedBackgrounds && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cachedBackgrounds;
    }

    try {
      const files = await fs.readdir(this.BACKGROUNDS_DIR);
      
      // Filter for PNG files and return relative paths
      this.cachedBackgrounds = files
        .filter(file => file.toLowerCase().endsWith('.png'))
        .map(file => `src/resources/cards/images/backgrounds/${file}`)
        .sort();
      
      this.cacheTimestamp = now;
      return this.cachedBackgrounds;
    } catch (error) {
      console.error('Error reading backgrounds directory:', error);
      return [];
    }
  }

  /**
   * Validate that a background image path exists
   * @param imagePath - Relative path from project root (e.g., "src/resources/cards/images/backgrounds/aesclepnotext.png")
   */
  async validateBackgroundPath(imagePath: string | null): Promise<boolean> {
    if (!imagePath) {
      return true; // NULL/null is valid (default background)
    }

    try {
      const projectRoot = path.join(__dirname, '../..'); // Go up from dist/services or src/services to project root
      const fullPath = path.join(projectRoot, imagePath); // Resolves "src/resources/..." from project root
      
      if (!imagePath.includes('backgrounds')) {
        console.warn('Background path validation: Path does not include "backgrounds" directory:', imagePath);
        return false;
      }

      await fs.access(fullPath, fs.constants.F_OK);
      console.log('Background path validation: Valid path:', fullPath);
      return true;
    } catch (error) {
      console.error('Background path validation failed:', imagePath, 'Resolved to:', path.join(__dirname, '../..', imagePath), error);
      return false;
    }
  }

  /**
   * Clear the cache (useful for testing or when backgrounds are added/removed)
   */
  clearCache(): void {
    this.cachedBackgrounds = null;
    this.cacheTimestamp = 0;
  }
}
