/**
 * Unit tests for tab title branding verification
 * Ensures all HTML pages display "Excelsior Deckbuilder" in their tab titles
 */

import fs from 'fs';
import path from 'path';

describe('Tab Title Branding Tests', () => {
  const htmlFiles = [
    'public/index.html',
    'public/deck-builder.html', 
    'public/database-view.html',
    'src/public/deck-editor.html',
    'src/public/deckbuilder.html',
    'src/public/index.html'
  ];

  describe('HTML Page Titles', () => {
    htmlFiles.forEach(filePath => {
      it(`should have "Excelsior Deckbuilder" in title for ${filePath}`, () => {
        const fullPath = path.join(process.cwd(), filePath);
        
        // Check if file exists
        expect(fs.existsSync(fullPath)).toBe(true);
        
        // Read file content
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Extract title tag content
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        expect(titleMatch).toBeTruthy();
        
        const title = titleMatch![1];
        
        // Verify title contains "Excelsior Deckbuilder"
        expect(title).toContain('Excelsior Deckbuilder');
        
        // Verify title does NOT contain old branding
        expect(title).not.toContain('Overpower Deckbuilder');
      });
    });
  });

  describe('Logo Alt Text', () => {
    const filesWithLogos = [
      'public/index.html',
      'public/deck-builder.html',
      'public/components/globalNav.html'
    ];

    filesWithLogos.forEach(filePath => {
      it(`should have "Excelsior Deckbuilder" in logo alt text for ${filePath}`, () => {
        const fullPath = path.join(process.cwd(), filePath);
        
        // Check if file exists
        expect(fs.existsSync(fullPath)).toBe(true);
        
        // Read file content
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Find logo img tags with alt text
        const logoMatches = content.match(/<img[^>]*alt="([^"]*)"[^>]*>/gi);
        expect(logoMatches).toBeTruthy();
        
        // Check if any logo has the correct alt text
        const hasCorrectAltText = logoMatches!.some(match => 
          match.includes('alt="Excelsior Deckbuilder"')
        );
        
        expect(hasCorrectAltText).toBe(true);
        
        // Verify no old branding in alt text
        const hasOldBranding = logoMatches!.some(match => 
          match.includes('alt="Overpower Deckbuilder"')
        );
        
        expect(hasOldBranding).toBe(false);
      });
    });
  });

  describe('Header Text Content', () => {
    it('should have "Excelsior Deckbuilder" in main header text', () => {
      const filePath = path.join(process.cwd(), 'src/public/index.html');
      
      // Check if file exists
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for header text
      expect(content).toContain('🏰 Excelsior Deckbuilder');
      expect(content).not.toContain('🏰 Overpower Deckbuilder');
    });
  });

  describe('Server Console Message', () => {
    it('should have "Excelsior Deckbuilder" in server startup message', () => {
      const filePath = path.join(process.cwd(), 'src/index.ts');
      
      // Check if file exists
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for server console message
      expect(content).toContain('🚀 Excelsior Deckbuilder server running on port');
      expect(content).not.toContain('🚀 Overpower Deckbuilder server running on port');
    });
  });

  describe('Test Expectations', () => {
    it('should have updated test expectations for new branding', () => {
      const filePath = path.join(process.cwd(), 'tests/integration/deckEditabilityBrowser.test.ts');
      
      // Check if file exists
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for updated test expectation
      expect(content).toContain('Excelsior Deckbuilder');
      expect(content).not.toContain('Overpower Deckbuilder');
    });
  });
});
