import fs from 'fs';
import path from 'path';

describe('public/index.html script includes', () => {
  it('includes alphabetization.js before other card database scripts so sorting rules apply in production', () => {
    const indexPath = path.join(__dirname, '../../public/index.html');
    const html = fs.readFileSync(indexPath, 'utf8');

    const alphaIdx = html.indexOf('/js/alphabetization.js');
    expect(alphaIdx).toBeGreaterThan(-1);

    // Ensure it loads before major consumers (card database / search sorting).
    const cardDisplayIdx = html.indexOf('/js/card-display.js');
    const allCardsIdx = html.indexOf('/js/all-cards-display.js');
    const searchServiceIdx = html.indexOf('/js/services/CardSearchService.js');

    expect(alphaIdx).toBeLessThan(cardDisplayIdx);
    expect(alphaIdx).toBeLessThan(allCardsIdx);
    expect(alphaIdx).toBeLessThan(searchServiceIdx);
  });
});

