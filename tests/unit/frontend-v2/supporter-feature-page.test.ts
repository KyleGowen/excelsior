import fs from 'fs';
import path from 'path';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(__dirname, '../../..', relativePath), 'utf8');

describe('Supporter feature page', () => {
  const router = read('frontend/src/app/router.tsx');
  const serverPages = read('src/routes/pages.routes.ts');
  const page = read('frontend/src/features/supporter/SupporterPage.tsx');
  const flow = read('frontend/src/features/supporter-flow/SupporterFlowProvider.tsx');
  const css = read('frontend/src/features/supporter/SupporterPage.css');

  it('registers a public, shareable route outside the protected shell', () => {
    expect(router).toContain("const SupporterPage = lazy(() => import('../features/supporter/SupporterPage'))");
    expect(router).toContain("path: '/supporter'");
    expect(serverPages).toContain("app.get('/supporter'");
    expect(serverPages).toMatch(/app\.get\('\/supporter',[\s\S]*?sendAppShell\(res\)/);
    expect(router).not.toContain("path: '/supporter-preview'");
    expect(page).toContain('supporter-page-shell--public');
    expect(page).toContain('<AppShell>{content}</AppShell>');
  });

  it('lets visitors explore both real Supporter feature captures', () => {
    expect(page).toContain('Thank you for your support.');
    expect(page).toContain("I'm just a dude who loves the OverPower CCG and building decks.");
    expect(page).toContain('Now I spend my nights and weekends creating new features for everyone and fighting');
    expect(page).toContain('Costs for hosting an application and its database do start to add up quickly.');
    expect(page).toContain("Think of it like you're buying me a coffee.. or half a pack of cards.");
    expect(css).toContain('.supporter-page__lead p + p');
    expect(flow).toContain('Start at $3.&nbsp; Or, if you really appreciate Excelsior');
    expect(flow).toContain('All supporters receive the same thank you features.');
    expect(flow).toContain('<MonthlyContributionInput');
    expect(page).not.toMatch(/<strong>\$3<\/strong>\s*<span>per month<\/span>/);
    expect(page).toMatch(/SUPPORTER FEATURES<\/span>\s*<h2>Thank you for your support\.<\/h2>/);
    expect(page).not.toContain('See the features before you decide.');
    expect(page).toContain("id: 'saved-views'");
    expect(page).toContain("id: 'draw-hand'");
    expect(page).toContain('saved-views-supporter.png');
    expect(page).toContain('saved-views-foil-multi-power.png');
    expect(page).toContain('saved-views-skybound-energy-teamworks.png');
    expect(page).toContain('(index + 1) % activeFeature.previews.length');
    expect(page).toContain('}, 3000);');
    expect(page).toContain("document.addEventListener('visibilitychange', syncCycling)");
    expect(page).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
    expect(page).toContain('supporter-page__preview-stack');
    expect(page).toContain('image.decode()');
    expect(page).toContain('!decodedFeatures[activeFeature.id]');
    expect(css).toContain('transition: opacity 360ms var(--ease-out)');
    expect(page).toContain('draw-hand-supporter.png');
    expect(page).toContain('draw-hand-venture-20-duplicate-1.png');
    expect(page).toContain('draw-hand-venture-35-duplicates-2.png');
    expect(page).toContain("imageClassName: 'supporter-page__preview-frame--raise-1'");
    expect(css).toContain('transform: translateY(-1px)');
    expect(page).toContain('role="tablist"');
    expect(page).toContain("id=\"future-tools\"");
    expect(page).toContain('More personal tools ahead.');
    expect(page).toContain('Open Help &amp; Feedback from the profile');
    expect(page).toContain('Request a feature or change to send it my way.');
    expect(page).not.toContain('Knowledge and data about the game will always be publicly available.');
    expect(css).not.toContain('supporter-page__future-promise');
    expect(page).not.toContain('Public data icon options');
    expect(page).not.toContain('Included as a thank-you with active Supporter access.');
    expect(css).not.toContain('supporter-page__feature-note');
    expect(page).not.toContain('supporter-page__feature-roadmap');
    expect(page).not.toContain('Open full preview');
    expect(css).not.toContain('supporter-page__zoom-label');
    expect(page).toContain('Open a larger preview of');
    expect(page).toContain('Venture total of 12');
    expect(page).not.toContain('Call out duplicate cards before they surprise you in play.');
    expect(page).toContain('More Hand analytics coming in the near future.\\u00a0 Use the feedback button if you’ve got ideas.');
    expect(css).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(css).toContain('width: min(96vw, 1600px)');
  });

  it('keeps the free-information promise central', () => {
    expect(page).toContain('Game knowledge and data will never be gated.');
    expect(page.match(/<IconBookOpen aria-hidden="true" \/>/g)).toHaveLength(1);
    expect(page).not.toContain('<IconUnlock aria-hidden="true" />');
    expect(page).not.toContain('WHAT YOUR SUPPORT MAKES POSSIBLE');
    expect(page).not.toContain('A small contribution with a practical purpose.');
    expect(page).not.toContain('Help keep Excelsior healthy and improving.');
    expect(page).not.toContain('$3 in monthly support.');
    expect(page).not.toContain('Preview the features');
    expect(page).not.toContain('See what support funds');
    expect(page).not.toContain('Explore Supporter features');
    expect(css).not.toContain('supporter-page__context-pill');
    expect(css).not.toContain('supporter-page__hero-actions');
    expect(page).toContain('<IconLeaf aria-hidden="true" />');
    expect(css).not.toContain('supporter-page__impact-grid');
    expect(css).not.toContain('supporter-page__impact-card');
    expect(css).not.toContain('supporter-page__closing');
    expect(page).not.toContain('Support without surprises.');
    expect(css).not.toContain('supporter-page__faq');
  });

  it('places the climate note inside the monthly-support card and the public-data promise before the feature tabs', () => {
    const climateIndex = page.indexOf('aria-label="Stripe Climate contribution"');
    const featureHeadingIndex = page.indexOf('Thank you for your support.');
    const publicPromiseIndex = page.indexOf('Game knowledge and data will never be gated.');
    const featureTabsIndex = page.indexOf('role="tablist"');

    expect(climateIndex).toBeGreaterThan(-1);
    expect(climateIndex).toBeLessThan(featureHeadingIndex);
    expect(featureHeadingIndex).toBeLessThan(publicPromiseIndex);
    expect(publicPromiseIndex).toBeLessThan(featureTabsIndex);
    expect(page.match(/aria-label="Stripe Climate contribution"/g)).toHaveLength(1);
    expect(page).toMatch(/<aside className="supporter-page__support-card"[\s\S]*?billingPanel[\s\S]*?aria-label="Stripe Climate contribution"[\s\S]*?<\/aside>/);
    expect(page).toContain('Excelsior contributes 1% of Supporter revenue to fund climate initiatives through');
    expect(page.match(/Game knowledge and data will never be gated\./g)).toHaveLength(1);
    expect(css).toMatch(/\.supporter-page__climate--card\s*\{[\s\S]*?border-width: 1px 0 0;[\s\S]*?background: transparent;/);
    expect(css).toMatch(/\.supporter-page__public-promise--features\s*\{[\s\S]*?margin-top: var\(--space-5\);[\s\S]*?border-top: 0;/);
  });

  it('renders the server-backed billing flow directly on the full page', () => {
    expect(page).toContain('useSupporterFlow');
    expect(page).toContain('billingPanel');
    expect(flow).toContain('Secure checkout by Stripe · Change or cancel anytime');
    expect(flow).not.toContain('<SlideOutPanel');
    expect(page).not.toContain('showSupportMock');
    expect(page).not.toContain('This is where Stripe Checkout would begin.');
  });

  it('adapts its action for supporters and administrators', () => {
    expect(page).toContain('isAdmin ? (');
    expect(page).toContain('statusResolved ? billingPanel');
    expect(page).toContain('Administrator preview — no support action is shown.');
  });

  it('includes responsive and reduced-motion treatments', () => {
    expect(css).toContain('.layout-mobile .supporter-page');
    expect(css).toContain('.supporter-page__section:last-child');
    expect(css).toContain('padding-bottom: calc(var(--space-16) + var(--space-8));');
    expect(css).toContain('.layout-mobile .supporter-page__section:last-child');
    expect(css).toContain('padding-bottom: calc(var(--space-16) + var(--space-4));');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
