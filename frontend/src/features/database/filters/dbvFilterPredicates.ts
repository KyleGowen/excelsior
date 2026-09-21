import type { CatalogCard, CatalogType } from '../../../lib/api/types';
import { compareAlphabetically } from '../../../lib/sort/alphabetical';
import type { CompareOp, DbvFilterState, FunctionIconField } from './dbvFilterTypes';

function matchesNumericCompare(actual: unknown, op: CompareOp, expected: number): boolean {
  const n = typeof actual === 'number' ? actual : Number(actual);
  if (Number.isNaN(n)) return false;
  if (op === 'eq') return n === expected;
  if (op === 'gte') return n >= expected;
  return n <= expected;
}

function matchesNumericConstraints(
  card: CatalogCard,
  constraints: DbvFilterState['numeric'],
  resolveValue: (card: CatalogCard, field: string) => unknown,
): boolean {
  return constraints.every((c) => matchesNumericCompare(resolveValue(card, c.field), c.op, c.value));
}

export function matchesIconsPowerTypeFilters(icons: unknown, selectedPowerTypes: string[]): boolean {
  if (!selectedPowerTypes.length) return true;
  const multiPowerSelected = selectedPowerTypes.includes('Multi-Power');
  const specificTypes = selectedPowerTypes.filter((t) => t !== 'Multi-Power');
  const iconList = Array.isArray(icons) ? icons : [];
  const matchesMultiPower = multiPowerSelected && iconList.length >= 2;
  const matchesSpecificType =
    specificTypes.length > 0 && iconList.some((icon) => specificTypes.includes(String(icon)));
  return matchesMultiPower || matchesSpecificType;
}

export function matchesFunctionIconFilters(
  card: CatalogCard,
  selectedFields: FunctionIconField[],
): boolean {
  if (!selectedFields.length) return true;
  return selectedFields.some((field) => Boolean(card[field]));
}

function powerTypeMatchesSel(sel: string, typeStr: string): boolean {
  const t = String(typeStr || '').trim();
  if (sel === 'Multi-Power' || sel === 'Multi Power') {
    return t === 'Multi Power' || t === 'Multi-Power';
  }
  return t === sel;
}

function teamworkPowerFromToUse(toUse: unknown): string {
  return String(toUse || '').trim().replace(/^\d+\s+/, '').trim();
}

function normalizePowerTypeForCard(cardPowerType: unknown): string {
  const t = String(cardPowerType || '').trim();
  if (t === 'Multi Power') return 'Multi-Power';
  return t;
}

function matchesPowerCardNumericConstraints(card: CatalogCard, constraints: DbvFilterState['numeric']): boolean {
  if (!constraints.length) return true;
  const cardType = normalizePowerTypeForCard(card.power_type);
  const cardValue = card.value;
  return constraints.some(
    (c) => cardType === c.field && matchesNumericCompare(cardValue, c.op, c.value),
  );
}

export function cardMatchesDbvFilters(
  card: CatalogCard,
  type: CatalogType,
  state: DbvFilterState,
): boolean {
  const hasNumeric = state.numeric.length > 0;
  const hasPower = state.powerTypes.length > 0;
  const hasFunction = state.functionIcons.length > 0;
  const hasMission = Boolean(state.missionSet);

  if (!hasNumeric && !hasPower && !hasFunction && !hasMission) {
    return true;
  }

  switch (type) {
    case 'characters':
      if (hasNumeric && !matchesNumericConstraints(card, state.numeric, (c, field) => c[field])) {
        return false;
      }
      break;
    case 'locations':
      if (hasNumeric && !matchesNumericConstraints(card, state.numeric, (c) => c.threat_level)) {
        return false;
      }
      break;
    case 'power-cards':
      if (hasNumeric && !matchesPowerCardNumericConstraints(card, state.numeric)) return false;
      break;
    case 'special-cards':
    case 'aspects':
      if (hasPower && !matchesIconsPowerTypeFilters(card.icons, state.powerTypes)) return false;
      if (hasFunction && !matchesFunctionIconFilters(card, state.functionIcons)) return false;
      break;
    case 'advanced-universe':
      if (hasFunction && !matchesFunctionIconFilters(card, state.functionIcons)) return false;
      break;
    case 'teamwork':
      if (hasPower) {
        const p = teamworkPowerFromToUse(card.to_use);
        if (!state.powerTypes.some((sel) => powerTypeMatchesSel(sel, p))) return false;
      }
      break;
    case 'ally-universe':
      if (hasPower) {
        const stat = String(card.stat_type_to_use || '').trim();
        const attack = String(card.attack_type || '').trim();
        if (!state.powerTypes.some((sel) => powerTypeMatchesSel(sel, stat) || powerTypeMatchesSel(sel, attack))) {
          return false;
        }
      }
      break;
    case 'training':
      if (hasPower) {
        if (
          !state.powerTypes.some(
            (sel) =>
              powerTypeMatchesSel(sel, String(card.type_1 || '')) ||
              powerTypeMatchesSel(sel, String(card.type_2 || '')),
          )
        ) {
          return false;
        }
      }
      break;
    case 'basic-universe':
      if (hasPower) {
        const t = String(card.type || '').trim();
        if (!state.powerTypes.some((sel) => powerTypeMatchesSel(sel, t))) return false;
      }
      break;
    case 'missions':
    case 'events':
      if (hasMission && String(card.mission_set ?? '') !== state.missionSet) return false;
      break;
    default:
      break;
  }

  return true;
}

export function collectMissionSetOptions(cards: CatalogCard[]): string[] {
  const sets = new Set<string>();
  for (const card of cards) {
    const ms = String(card.mission_set ?? '').trim();
    if (ms) sets.add(ms);
  }
  return [...sets].sort(compareAlphabetically);
}
