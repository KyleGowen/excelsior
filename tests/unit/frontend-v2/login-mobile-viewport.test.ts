import * as fs from 'fs';
import * as path from 'path';

describe('Login mobile viewport styling', () => {
  const css = fs.readFileSync(
    path.join(process.cwd(), 'frontend/src/features/login/LoginPage.css'),
    'utf8',
  );
  const pageSource = fs.readFileSync(
    path.join(process.cwd(), 'frontend/src/features/login/LoginPage.tsx'),
    'utf8',
  );

  const loginRule = css.match(/\.login\s*\{([^}]*)\}/)?.[1] ?? '';
  const mobileLoginRule = css.match(/\.layout-mobile \.login\s*\{([^}]*)\}/)?.[1] ?? '';

  it('sizes the login screen to the dynamic visible viewport', () => {
    expect(loginRule).toContain('min-height: 100vh');
    expect(loginRule).toContain('min-height: 100dvh');
    expect(mobileLoginRule).toContain('height: 100dvh');
    expect(mobileLoginRule).toContain('min-height: 100dvh');
  });

  it('keeps the logo visible and lets short mobile viewports scroll', () => {
    expect(mobileLoginRule).toContain('env(safe-area-inset-top, 0px)');
    expect(mobileLoginRule).toContain('env(safe-area-inset-bottom, 0px)');
    expect(mobileLoginRule).toContain('align-content: safe center');
    expect(mobileLoginRule).toContain('overflow-y: auto');
  });

  it('prioritizes Google sign-in on mobile without changing desktop order', () => {
    const responsiveOrder = pageSource.match(
      /\{isMobile \? \(\s*<>\s*([\s\S]*?)\s*<\/>\s*\) : \(\s*<>\s*([\s\S]*?)\s*<\/>\s*\)\}/,
    );

    expect(responsiveOrder?.[1]).toMatch(
      /\{googleButton\}[\s\S]*\{divider\}[\s\S]*\{credentialsForm\}/,
    );
    expect(responsiveOrder?.[2]).toMatch(
      /\{credentialsForm\}[\s\S]*\{divider\}[\s\S]*\{googleButton\}/,
    );
  });

  it('describes Excelsior as independently built for the Modern OverPower community', () => {
    expect(pageSource).toContain(
      'Excelsior is an independently developed and operated OverPower database and deck',
    );
    expect(pageSource).toContain('builder, built for the Modern OverPower community.&nbsp; Browse');
    expect(pageSource).not.toContain('single developer');
    expect(pageSource).not.toContain('independently owned');
  });
});
