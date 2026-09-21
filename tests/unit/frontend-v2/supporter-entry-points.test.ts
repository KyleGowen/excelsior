import fs from 'fs';
import path from 'path';

const repoRoot = path.join(__dirname, '../../..');
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Supporter page entry points', () => {
  const home = read('frontend/src/features/home/HomePage.tsx');
  const database = read('frontend/src/features/database/DatabasePage.tsx');
  const appShell = read('frontend/src/components/AppShell/AppShell.tsx');
  const userMenu = read('frontend/src/components/UserMenu/UserMenu.tsx');
  const mobileNav = read('frontend/src/components/MobileBottomNav/MobileBottomNav.tsx');
  const invitation = read('frontend/src/components/SupporterInvitation/SupporterInvitation.tsx');
  const login = read('frontend/src/features/login/LoginPage.tsx');
  const root = read('frontend/src/app/RootLayout.tsx');
  const flow = read('frontend/src/features/supporter-flow/SupporterFlowProvider.tsx');

  it('links Home and Database invitations to the full Supporter page', () => {
    expect(root).toContain('<SupporterFlowProvider>');
    expect(home).toContain('<SupporterInvitation />');
    expect(database).toContain('<SupporterInvitation');
    expect(database).not.toContain('onOpen={openSupporter}');
    expect(invitation).toContain('<Link');
    expect(invitation).toContain('to="/supporter"');
    expect(flow).not.toContain('<SlideOutPanel');
    expect(appShell).not.toContain('top-nav__supporter');
  });

  it('lets only the Database invitation stay collapsed for the current browser session', () => {
    expect(database).toContain('sessionStorage.getItem(SUPPORTER_INVITATION_COLLAPSED_KEY)');
    expect(database).toContain('sessionStorage.setItem(SUPPORTER_INVITATION_COLLAPSED_KEY');
    expect(database).toContain('onCollapsedChange={setSupporterInvitationCollapsedForSession}');
    expect(home).not.toContain('onCollapsedChange=');
    expect(invitation).toContain('aria-label="Collapse supporter invitation"');
    expect(invitation).toContain('aria-label="Expand supporter invitation"');
  });

  it('closes desktop and mobile profile surfaces before navigating to the Supporter page', () => {
    expect(userMenu).toContain('setOpen(false)');
    expect(userMenu).toContain('openSupporter();');
    expect(mobileNav).toContain('setAccountOpen(false)');
    expect(mobileNav).toContain('openSupporter();');
    expect(userMenu).toContain('supporterLabel={profileLabel}');
    expect(mobileNav).toContain('supporterLabel={profileLabel}');
    expect(flow).toContain("navigate('/supporter')");
  });

  it('removes the obsolete Supporter slide-out implementation', () => {
    expect(fs.existsSync(path.join(repoRoot, 'frontend/src/components/SupporterPanel/SupporterPanel.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'frontend/src/components/SupporterPanel/SupporterPanel.css'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'frontend/src/components/SupporterPanel/index.ts'))).toBe(false);
  });

  it('resolves canonical status before showing an invitation and keeps local previews visible', () => {
    expect(flow).toContain('statusQuery.isSuccess');
    expect(flow).toContain('status?.billingAvailable || import.meta.env.DEV');
    expect(flow).toContain('!status?.isSupporter');
    expect(home).toContain('{showInvitation ? (');
    expect(database).toContain('{showInvitation ? (');
  });

  it('uses the customer-chosen contribution invitation copy', () => {
    expect(invitation).toContain('Keep Excelsior free. Support what comes next.');
    expect(invitation).toContain('Choose $3+/month · Same features at every amount · Change or cancel anytime');
    expect(invitation).toContain('Become a Supporter');
  });

  it('renders Stripe billing on the full page instead of in a drawer', () => {
    expect(flow).toContain('billingPanel');
    expect(flow).toContain('supporter-flow--embedded');
    expect(flow).not.toContain('supporter-flow-panel');
    expect(flow).not.toContain("side={isMobile ? 'bottom' : 'right'}");
    expect(login).toContain("'/supporter?supporter=open'");
  });
});
