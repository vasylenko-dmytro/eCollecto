// Helper to build a mock tariff fetch response
const mockTariffFetch = (currencies: Record<string, Record<string, number>>) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve([
        { id: 'tariff-1', year: 2024, updatedAt: '2024-01-01T00:00:00Z', currencies },
      ]),
  });

// Each group resets modules so the module-level cache is cleared between scenarios.

describe('formatStampValue — with UAH tariffs', () => {
  let formatStampValue: (d: string | number | null | undefined) => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      mockTariffFetch({ UAH: { W: 12.0, F: 18.0, H: 22.0 } }),
    );
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
  });

  it('resolves a known UAH letter key (W → 12.00 UAH)', async () => {
    expect(await formatStampValue('W')).toBe('12.00 UAH');
  });

  it('resolves lowercase letter (f → 18.00 UAH)', async () => {
    expect(await formatStampValue('f')).toBe('18.00 UAH');
  });

  it('resolves letter + surcharge (F+8.00 → 26.00 UAH)', async () => {
    expect(await formatStampValue('F+8.00')).toBe('26.00 UAH');
  });

  it('resolves letter + surcharge with decimal precision', async () => {
    expect(await formatStampValue('H+5.50')).toBe('27.50 UAH');
  });

  it('resolves numeric string with UAH suffix (60.00 грн → 60.00 UAH)', async () => {
    expect(await formatStampValue('60.00 грн')).toBe('60.00 UAH');
  });

  it('resolves plain numeric string (45 → 45.00 UAH)', async () => {
    expect(await formatStampValue('45')).toBe('45.00 UAH');
  });

  it('resolves numeric value as number type (30.5 → 30.50 UAH)', async () => {
    expect(await formatStampValue(30.5)).toBe('30.50 UAH');
  });

  it('resolves "0" as 0.00 UAH', async () => {
    expect(await formatStampValue('0')).toBe('0.00 UAH');
  });
});

describe('formatStampValue — with USD tariffs', () => {
  let formatStampValue: (d: string | number | null | undefined) => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      mockTariffFetch({ USD: { G: 1.5, D: 2.0 } }),
    );
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
  });

  it('resolves a known USD letter key (G → 1.50 USD)', async () => {
    expect(await formatStampValue('G')).toBe('1.50 USD');
  });

  it('resolves USD letter + surcharge (D+0.50 → 2.50 USD)', async () => {
    expect(await formatStampValue('D+0.50')).toBe('2.50 USD');
  });
});

describe('formatStampValue — null / undefined / empty inputs', () => {
  let formatStampValue: (d: string | number | null | undefined) => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockTariffFetch({ UAH: { W: 12.0 } }));
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
  });

  it('returns N/A for null', async () => {
    expect(await formatStampValue(null)).toBe('N/A');
  });

  it('returns N/A for undefined', async () => {
    expect(await formatStampValue(undefined)).toBe('N/A');
  });
});

describe('formatStampValue — fallback when key not in tariffs', () => {
  let formatStampValue: (d: string | number | null | undefined) => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockTariffFetch({ UAH: { W: 12.0 } }));
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
  });

  it('returns N/A for an unknown letter key (Z)', async () => {
    expect(await formatStampValue('Z')).toBe('N/A');
  });

  it('returns N/A for letter+surcharge with unknown base letter (Z+5.00)', async () => {
    expect(await formatStampValue('Z+5.00')).toBe('N/A');
  });
});

describe('formatStampValue — fetch failure scenarios', () => {
  let formatStampValue: (d: string | number | null | undefined) => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
  });

  it('returns N/A for letter key when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
    expect(await formatStampValue('W')).toBe('N/A');
  });

  it('returns numeric UAH value for plain number even when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
    expect(await formatStampValue('60.00')).toBe('60.00 UAH');
  });

  it('returns N/A for letter key when API returns non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve(null) }),
    );
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
    expect(await formatStampValue('W')).toBe('N/A');
  });

  it('returns N/A for letter key when API returns invalid Zod data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }]), // invalid shape
      }),
    );
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
    expect(await formatStampValue('W')).toBe('N/A');
  });

  it('returns N/A for letter key when API returns empty array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
    expect(await formatStampValue('W')).toBe('N/A');
  });
});

describe('formatStampValue — picks latest year when multiple tariffs exist', () => {
  let formatStampValue: (d: string | number | null | undefined) => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 't-2022', year: 2022, updatedAt: '2022-01-01T00:00:00Z', currencies: { UAH: { W: 8.0 } } },
            { id: 't-2024', year: 2024, updatedAt: '2024-01-01T00:00:00Z', currencies: { UAH: { W: 12.0 } } },
            { id: 't-2023', year: 2023, updatedAt: '2023-01-01T00:00:00Z', currencies: { UAH: { W: 10.0 } } },
          ]),
      }),
    );
    const mod = await import('../../shared/utils/stampHelpers');
    formatStampValue = mod.formatStampValue;
  });

  it('uses the latest year tariff (2024: W → 12.00 UAH)', async () => {
    expect(await formatStampValue('W')).toBe('12.00 UAH');
  });
});


