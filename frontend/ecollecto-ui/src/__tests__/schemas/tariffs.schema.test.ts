import { TariffsSchema } from '../../features/product/types/schemas/tariffs.schema';

const validTariff = {
  id: 'tariff-001',
  year: 2024,
  updatedAt: '2024-01-01T00:00:00.000Z',
  currencies: {
    UAH: { W: 12.0, F: 18.0, H: 22.0 },
    USD: { G: 1.5 },
  },
};

describe('TariffsSchema', () => {
  describe('valid data', () => {
    it('parses a valid tariff object', () => {
      const result = TariffsSchema.safeParse(validTariff);
      expect(result.success).toBe(true);
    });

    it('accepts an empty currencies map', () => {
      const result = TariffsSchema.safeParse({ ...validTariff, currencies: {} });
      expect(result.success).toBe(true);
    });

    it('parses an array of tariffs', () => {
      const result = TariffsSchema.array().safeParse([validTariff]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].year).toBe(2024);
      }
    });

    it('accepts multiple currencies', () => {
      const tariff = {
        ...validTariff,
        currencies: {
          UAH: { W: 12.0, F: 18.0 },
          USD: { W: 0.30, F: 0.45 },
          EUR: { W: 0.28 },
        },
      };
      const result = TariffsSchema.safeParse(tariff);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('rejects missing id', () => {
      const { id: _omitted, ...without } = validTariff;
      const result = TariffsSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects wrong type for year (string instead of number)', () => {
      const result = TariffsSchema.safeParse({ ...validTariff, year: '2024' });
      expect(result.success).toBe(false);
    });

    it('rejects missing currencies field', () => {
      const { currencies: _omitted, ...without } = validTariff;
      const result = TariffsSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects wrong value type in currencies (string instead of number)', () => {
      const result = TariffsSchema.safeParse({
        ...validTariff,
        currencies: { UAH: { W: 'twelve' } },
      });
      expect(result.success).toBe(false);
    });

    it('rejects completely empty object', () => {
      const result = TariffsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});


