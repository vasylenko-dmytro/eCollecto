import { FirstDayIssueSchema } from '../../features/product/types/schemas/firstdayissue.schema';

const validFDC = {
  postmark_id: 'fdc-001',
  envelope_id: 'env-001',
  name: 'First Day Cover Test',
  description: 'A test first day cover',
  postmarkSKU: 2001,
  envelopeSKU: 2002,
  designer: 'FDC Designer',
  release: {
    year: 2024,
    date: '2024-01-15',
    printQuantity: 5000,
  },
  images: {
    envelope: 'https://example.com/env.jpg',
    postmark: 'https://example.com/pm.jpg',
  },
};

describe('FirstDayIssueSchema', () => {
  describe('valid data', () => {
    it('parses a fully populated first day cover', () => {
      const result = FirstDayIssueSchema.safeParse(validFDC);
      expect(result.success).toBe(true);
    });

    it('accepts all nullable fields as null', () => {
      const fdc = {
        ...validFDC,
        postmark_id: null,
        envelope_id: null,
        postmarkSKU: null,
        envelopeSKU: null,
        designer: null,
        images: { envelope: null, postmark: null },
      };
      const result = FirstDayIssueSchema.safeParse(fdc);
      expect(result.success).toBe(true);
    });

    it('parses an array of first day covers', () => {
      const result = FirstDayIssueSchema.array().safeParse([validFDC]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].name).toBe('First Day Cover Test');
      }
    });
  });

  describe('invalid data', () => {
    it('rejects missing name field', () => {
      const { name: _omitted, ...without } = validFDC;
      const result = FirstDayIssueSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects missing release object', () => {
      const { release: _omitted, ...without } = validFDC;
      const result = FirstDayIssueSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects wrong type for release.year (string instead of number)', () => {
      const fdc = {
        ...validFDC,
        release: { ...validFDC.release, year: '2024' },
      };
      const result = FirstDayIssueSchema.safeParse(fdc);
      expect(result.success).toBe(false);
    });

    it('rejects missing images object', () => {
      const { images: _omitted, ...without } = validFDC;
      const result = FirstDayIssueSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects completely empty object', () => {
      const result = FirstDayIssueSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects wrong type for postmarkSKU (string instead of number or null)', () => {
      const result = FirstDayIssueSchema.safeParse({ ...validFDC, postmarkSKU: 'not-a-number' });
      expect(result.success).toBe(false);
    });
  });
});


