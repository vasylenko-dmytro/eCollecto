import { ProductSchema } from '../../features/product/types/schemas/product.schema';

const validProduct = {
  stamp_id: 'stamp-001',
  name: 'Test Stamp',
  description: 'A test description',
  stampSKU: 1001,
  meta: {
    denomination: 'W',
    series: 'Test Series',
    designer: 'Test Designer',
    perforation: true,
    stampsPerPane: 25,
    themes: 'Nature',
    europa: false,
  },
  release: {
    year: 2024,
    date: '2024-01-15',
    printQuantity: 100000,
    isMassIssue: false,
    isAvailable: true,
  },
  images: {
    original: 'https://example.com/orig.jpg',
    small: 'https://example.com/small.jpg',
    pane: null,
  },
};

describe('ProductSchema', () => {
  describe('valid data', () => {
    it('parses a fully populated product', () => {
      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('accepts nullable series, designer, themes, stampsPerPane, and pane', () => {
      const product = {
        ...validProduct,
        meta: {
          ...validProduct.meta,
          series: null,
          designer: null,
          stampsPerPane: null,
          themes: null,
        },
        images: { ...validProduct.images, pane: null },
      };
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);
    });

    it('parses an array of products', () => {
      const result = ProductSchema.array().safeParse([validProduct]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].stamp_id).toBe('stamp-001');
      }
    });
  });

  describe('invalid data', () => {
    it('rejects missing stamp_id', () => {
      const { stamp_id: _omitted, ...without } = validProduct;
      const result = ProductSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects wrong type for stampSKU (string instead of number)', () => {
      const result = ProductSchema.safeParse({ ...validProduct, stampSKU: 'not-a-number' });
      expect(result.success).toBe(false);
    });

    it('rejects missing release.year', () => {
      const product = {
        ...validProduct,
        release: { date: '2024-01-15', printQuantity: 100000, isMassIssue: false, isAvailable: true },
      };
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it('rejects wrong type for meta.perforation (string instead of boolean)', () => {
      const product = {
        ...validProduct,
        meta: { ...validProduct.meta, perforation: 'yes' },
      };
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it('rejects missing images object entirely', () => {
      const { images: _omitted, ...without } = validProduct;
      const result = ProductSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects null for non-nullable denomination', () => {
      const product = {
        ...validProduct,
        meta: { ...validProduct.meta, denomination: null },
      };
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it('rejects completely empty object', () => {
      const result = ProductSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});


