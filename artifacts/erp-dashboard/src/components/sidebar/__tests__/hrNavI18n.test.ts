import { describe, it, expect } from 'vitest';
import uzNav from '@/locales/uz/navigation.json';
import ruNav from '@/locales/ru/navigation.json';
import {
  HR_NAV_SECTION_KEYS,
  HR_NAV_URL_KEYS,
  translateHrModule,
} from '../hrNavI18n';
import { menuGroups } from '../constants';

type NavBundle = Record<string, string>;

const uz = uzNav as NavBundle;
const ru = ruNav as NavBundle;

describe('HR sidebar i18n (Phase 3 / T3.3)', () => {
  it('every section key resolves in UZ and RU navigation bundles', () => {
    const sectionKeys = Object.values(HR_NAV_SECTION_KEYS);
    for (const key of sectionKeys) {
      expect(uz[key], `uz/navigation missing ${key}`).toBeTypeOf('string');
      expect(ru[key], `ru/navigation missing ${key}`).toBeTypeOf('string');
      expect((uz[key] ?? '').length).toBeGreaterThan(0);
      expect((ru[key] ?? '').length).toBeGreaterThan(0);
    }
  });

  it('every HR url key resolves in UZ and RU navigation bundles', () => {
    const urlKeys = Object.values(HR_NAV_URL_KEYS);
    for (const key of urlKeys) {
      expect(uz[key], `uz/navigation missing ${key}`).toBeTypeOf('string');
      expect(ru[key], `ru/navigation missing ${key}`).toBeTypeOf('string');
    }
  });

  it('hrModuleTitle, hrDisciplineV2 exist in both languages', () => {
    expect(uz.hrModuleTitle).toBeTypeOf('string');
    expect(ru.hrModuleTitle).toBeTypeOf('string');
    expect(uz.hrDisciplineV2).toBeTypeOf('string');
    expect(ru.hrDisciplineV2).toBeTypeOf('string');
  });

  it('every tz11 (HR) item is covered by HR_NAV_SECTION_KEYS or HR_NAV_URL_KEYS', () => {
    const hr = menuGroups.tz11;
    expect(hr).toBeDefined();
    const uncovered: string[] = [];
    for (const item of hr.items) {
      if (item.separator) {
        if (!HR_NAV_SECTION_KEYS[item.title]) uncovered.push(`SEP:${item.title}`);
      } else {
        const knownDuplicateV2 = item.title === 'Intizom V2' && item.url === 'discipline';
        if (knownDuplicateV2) continue;
        if (!HR_NAV_URL_KEYS[item.url]) uncovered.push(`URL:${item.url}`);
      }
    }
    expect(uncovered, `Uncovered HR sidebar items: ${uncovered.join(', ')}`).toHaveLength(0);
  });

  it('translateHrModule returns translated UZ title for HR Dashboard', () => {
    const tUz = (k: string) => uz[k] ?? k;
    const out = translateHrModule(tUz, menuGroups.tz11);
    const dashboard = out.items.find((i) => i.url === 'hr-dashboard');
    expect(dashboard?.title).toBe(uz.hrDashboard);
  });

  it('translateHrModule returns translated RU title for HR Dashboard', () => {
    const tRu = (k: string) => ru[k] ?? k;
    const out = translateHrModule(tRu, menuGroups.tz11);
    const dashboard = out.items.find((i) => i.url === 'hr-dashboard');
    expect(dashboard?.title).toBe(ru.hrDashboard);
  });

  it('translateHrModule falls back to UZ original when key missing', () => {
    const tMissing = (k: string) => k; // simulates missing translation
    const out = translateHrModule(tMissing, menuGroups.tz11);
    const dashboard = out.items.find((i) => i.url === 'hr-dashboard');
    // original title in menuGroups.tz11
    expect(dashboard?.title).toBe('HR Dashboard');
  });

  // SKIP: "Intizom V2" item was removed from HR sidebar in session 2026-05-27 cleanup.
  // The disambiguation key (hrDisciplineV2) still exists in navigation.json but the
  // duplicate sidebar item no longer exists, so translateHrModule never produces it.
  it.skip('disambiguates duplicate "discipline" url to hrDisciplineV2 when title is "Intizom V2"', () => {
    const tRu = (k: string) => ru[k] ?? k;
    const out = translateHrModule(tRu, menuGroups.tz11);
    const v2 = out.items.find((i) => i.title === ru.hrDisciplineV2);
    expect(v2).toBeDefined();
  });
});
