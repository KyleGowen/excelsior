// Live local editor regression cases. Reuse the shared evidence helpers; never run on production.
import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
const role = (tab, kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
export async function runMilestone3Deck({ tab, target, fixture, evidenceDir }) {
  check(target?.verified && target.environment === 'local', 'Verified local target required');
  const origin = new URL(target.frontendUrl).origin;
  check(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname), 'Local loopback only');
  check(fixture?.ownedFixture === true && fixture.deckUrl, 'Owned fictional fixture required');
  const report = { schema: 1, kind: 'browser', environment: 'local', sourceRevision: target.sourceRevision,
    inputFingerprint: target.sourceTreeFingerprint, method: 'CUA live browser automation', theme: 'fixed dark',
    scenarios: [], acceptance: 'automated only; Kyle acceptance pending', cleanup: { applicationRecords: 'pending', browser: 'pending' },
    gaps: ['light theme unavailable', 'real Google OAuth unavailable', 'independent module harness not yet available'] };
  report.dimensions = await tab.playwright.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const showType = async prefix => {
    if (await tab.playwright.getByRole('tablist', { name: 'Deck card types', exact: true }).count()) {
      await tab.playwright.getByRole('tab', { name: new RegExp('^' + prefix + ' ') }).click();
    }
  };
  let active = 'server-metrics-baseline';
  const capture = name => captureBrowserEvidence(tab, evidenceDir, name);
  const expectCount = n => wait(tab.playwright.getByText(`${n} cards`, { exact: true }));
  const expectMetric = (name, value) => wait(tab.playwright.locator(`[title="${name}: ${value}"]`));
  const record = async observed => report.scenarios.push({ id: active, status: 'passed', observed, evidence: await capture(active) });
  try {
    await tab.goto(origin + fixture.deckUrl);
    await expectCount(8); await expectMetric('Character max — Combat', 7); await expectMetric('Icon total — Combat', 5);
    check((await tab.playwright.domSnapshot()).includes('Threat: 18'), 'Threat baseline differs');
    await wait(role(tab, 'button', 'Limited')); await record({ drawPile: 8, threat: 18, maximumCombat: 7, combatIcons: 5, limited: true });
    active = 'limited-raw-legality';
    await role(tab, 'button', 'Limited').click(); await wait(role(tab, 'button', 'Not Legal'));
    await expectCount(8); await record({ limited: false, rawLegality: false });
    await role(tab, 'button', 'Not Legal').click(); await wait(role(tab, 'button', 'Limited'));
    active = 'reserve-and-ko';
    await showType('Characters');
    await role(tab, 'button', 'Select Lancelot as reserve').click(); await expectCount(8);
    await role(tab, 'button', 'KO character: Lancelot').click(); await expectMetric('Character max — Combat', 0);
    check((await tab.playwright.domSnapshot()).includes('Threat: 18'), 'KO changed editor threat');
    await record({ onlyCharacterKO: true, maximumCombat: 0, threat: 18 });
    await role(tab, 'button', 'Un-KO character: Lancelot').click(); await expectMetric('Character max — Combat', 7);
    // Reload discards the unsaved reserve edit and resets the simulation.
    await tab.reload(); await expectCount(8); await wait(role(tab, 'button', 'Select Lancelot as reserve'));
    active = 'preplacement-save-reload';
    await showType('Special');
    await role(tab, 'button', 'View Sword and Shield').nth(0).click(); await wait(role(tab, 'dialog', 'Sword and Shield details'));
    await role(tab, 'button', 'Pre-Placed').click(); await role(tab, 'button', 'Close panel').click();
    await expectCount(7); await expectMetric('Icon total — Combat', 5);
    check(await role(tab, 'button', 'Draw Hand').isEnabled(), 'Pre-placement incorrectly removed physical draw capability');
    await role(tab, 'button', 'Save').click(); await wait(role(tab, 'button', 'Saved'));
    await tab.reload(); await expectCount(7); await expectMetric('Icon total — Combat', 5);
    await record({ drawPile: 7, physicalPlayable: 8, combatIcons: 5, savedAndReloaded: true });
    await showType('Special');
    await role(tab, 'button', 'View Sword and Shield').nth(0).click(); await wait(role(tab, 'dialog', 'Sword and Shield details'));
    await role(tab, 'button', 'Pre-Placed').click(); await role(tab, 'button', 'Close panel').click();
    await expectCount(8); await role(tab, 'button', 'Save').click(); await wait(role(tab, 'button', 'Saved'));
    active = 'rapid-unsaved-edits';
    await showType('Power');
    await role(tab, 'button', 'Remove 5 - Combat').nth(0).click();
    await role(tab, 'button', 'Remove 5 - Combat').nth(0).click();
    await expectCount(6); await expectMetric('Icon total — Combat', 3);
    check(await role(tab, 'button', 'Save').isEnabled(), 'Unsaved input lost'); await record({ drawPile: 6, combatIcons: 3, unsaved: true });
    await tab.reload(); await expectCount(8); await expectMetric('Icon total — Combat', 5); await wait(role(tab, 'button', 'Limited'));
    report.cleanup.applicationRecords = 'Original cards, pre-placement, reserve and Limited restored; fictional account/deck retained for Kyle';
    report.cleanup.browser = 'owned fixture with original saved data'; report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.scenarios.push({ id: active, status: 'failed', reason: error.message, evidence: await capture('failure-' + active).catch(() => null) });
    report.cleanup.applicationRecords = 'BLOCKED: inspect and restore only owned fixture from private manifest';
  }
  report.counts = Object.fromEntries(['passed', 'failed', 'skipped', 'blocked'].map(status => [status, report.scenarios.filter(s => s.status === status).length]));
  report.browserErrorCount = (await tab.dev.logs({ levels: ['error'], limit: 50 })).length;
  report.reportPath = await writeBrowserReport(evidenceDir, report); return report;
}

/** Read only visible metric text and geometry; no network interception or app state injection. */
export async function readMetricPresentation(tab) {
  return tab.playwright.evaluate(() => {
    const selectors = ['.deck-editor__stats-panel', '.deck-editor__chip', '.deck-editor__threat-stat'];
    return {
      dimensions: { width: window.innerWidth, height: window.innerHeight },
      regions: selectors.map(selector => {
        const element = document.querySelector(selector);
        if (!element) return { selector, missing: true };
        const rect = element.getBoundingClientRect();
        return { selector, text: element.textContent, x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          icons: [...element.querySelectorAll('img')].map(img => ({ source: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })) };
      }),
      evaluatingPlaceholder: Boolean([...document.querySelectorAll('[role="status"]')].find(e => e.textContent.includes('Evaluating deck'))),
    };
  });
}

export async function captureMetricContinuity({ tab, evidenceDir, name, baseline }) {
  const observed = await readMetricPresentation(tab);
  check(!observed.evaluatingPlaceholder, 'Stats were replaced by an evaluating placeholder');
  if (baseline) {
    check(JSON.stringify(observed.dimensions) === JSON.stringify(baseline.dimensions), 'Viewport changed during comparison');
    for (let i = 0; i < baseline.regions.length; i++) {
      const previous = baseline.regions[i], current = observed.regions[i];
      check(!previous.missing && !current.missing, 'A metric region disappeared');
      check(current.text === previous.text, 'Previous totals changed before a response arrived');
      for (const key of ['x', 'y', 'width', 'height']) check(Math.abs(current[key] - previous[key]) < 0.1, `Metric ${key} moved during evaluation`);
      check(JSON.stringify(current.icons) === JSON.stringify(previous.icons), 'Stat icons disappeared or changed');
    }
  }
  return { observed, evidence: await captureBrowserEvidence(tab, evidenceDir, name) };
}

export async function readDeckControlPresentation(tab) {
  return tab.playwright.evaluate(() => {
    const elements = [document.querySelector('.deck-editor__chip'), document.querySelector('.deck-editor__legality-toggle'),
      document.querySelector('.deck-editor__visibility-toggle'), [...document.querySelectorAll('.deck-editor__actions button')].find(e => e.textContent.trim() === 'Draw Hand')];
    return elements.map(element => {
      if (!element) return { missing: true };
      const r = element.getBoundingClientRect(), style = window.getComputedStyle(element);
      return { text: element.textContent, x: r.x, y: r.y, width: r.width, height: r.height,
        color: style.color, background: style.backgroundColor, border: style.borderColor, opacity: style.opacity,
        disabled: element.hasAttribute('disabled'), busy: element.getAttribute('aria-busy') };
    });
  });
}

export async function captureDeckControlContinuity({ tab, evidenceDir, name, baseline, pending = false }) {
  const observed = await readDeckControlPresentation(tab);
  if (baseline) {
    for (let i = 0; i < baseline.length; i++) {
      const previous = baseline[i], current = observed[i];
      check(!previous.missing && !current.missing, 'A deck control disappeared');
      for (const key of ['text', 'color', 'background', 'border', 'opacity']) check(current[key] === previous[key], `Deck control ${i} ${key} blinked`);
      for (const key of ['x', 'y', 'width', 'height']) check(Math.abs(current[key] - previous[key]) < 0.1, `Deck control ${i} ${key} moved`);
    }
  }
  if (pending) {
    check(observed[1].busy === 'true', 'Previous legality was not marked busy');
    check(observed[3].disabled && observed[3].busy === 'true', 'Drawing was allowed from an old evaluation');
  }
  return { observed, evidence: await captureBrowserEvidence(tab, evidenceDir, name) };
}
