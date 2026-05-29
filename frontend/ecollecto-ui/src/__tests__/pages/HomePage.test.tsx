import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../pages/Home/HomePage';

// Mock ProductCard so tests stay focused on page-level behaviour
// (ProductCard uses Redux + OIDC hooks that require extra providers)
vi.mock('../../features/product', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/product')>();
  return {
    ...actual,
    ProductCard: ({ product }: { product: { name: string } }) => (
      <div data-testid="product-card">{product.name}</div>
    ),
  };
});

// Mock formatStampValue so ProductCard doesn't need a fetch for tariffs
vi.mock('../../shared/utils/stampHelpers', () => ({
  formatStampValue: vi.fn().mockResolvedValue('12.00 UAH'),
}));

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  stamp_id: 'stamp-001',
  name: 'Ukrposhta 2024',
  description: 'A beautiful stamp',
  stampSKU: 1001,
  meta: {
    denomination: 'W',
    series: 'Nature',
    designer: 'Ivan Petrov',
    perforation: true,
    stampsPerPane: 25,
    themes: 'Flora',
    europa: false,
  },
  release: {
    year: 2024,
    date: '2024-03-15',
    printQuantity: 100000,
    isMassIssue: false,
    isAvailable: true,
  },
  images: {
    original: 'https://example.com/orig.jpg',
    small: 'https://example.com/small.jpg',
    pane: null,
  },
  ...overrides,
});

const renderHomePage = (searchTerm = '') =>
  render(
    <MemoryRouter>
      <HomePage searchTerm={searchTerm} />
    </MemoryRouter>,
  );

describe('HomePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('shows a loading indicator while fetching', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      renderHomePage();
      expect(screen.getByText(/Loading products/i)).toBeInTheDocument();
    });
  });

  describe('successful fetch', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([makeProduct()]),
        }),
      );
    });

    it('renders the product list after loading', async () => {
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText('Ukrposhta 2024')).toBeInTheDocument();
      });
    });

    it('renders a link to the product detail page', async () => {
      renderHomePage();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Ukrposhta 2024/i });
        expect(link).toHaveAttribute('href', '/stamps/stamp-001');
      });
    });

    it('does not show the loading indicator after data loads', async () => {
      renderHomePage();
      await waitFor(() => {
        expect(screen.queryByText(/Loading products/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('search filtering', () => {
    const products = [
      makeProduct({ stamp_id: 'stamp-001', name: 'Winter Landscape', stampSKU: 1001, release: { year: 2022, date: '2022-01-01', printQuantity: 10000, isMassIssue: false, isAvailable: true } }),
      makeProduct({ stamp_id: 'stamp-002', name: 'Spring Flowers', stampSKU: 2002, release: { year: 2023, date: '2023-04-01', printQuantity: 20000, isMassIssue: false, isAvailable: true } }),
    ];

    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(products),
        }),
      );
    });

    it('shows all products when search is empty', async () => {
      renderHomePage('');
      await waitFor(() => {
        expect(screen.getByText('Winter Landscape')).toBeInTheDocument();
        expect(screen.getByText('Spring Flowers')).toBeInTheDocument();
      });
    });

    it('filters by stamp name', async () => {
      renderHomePage('Winter');
      await waitFor(() => {
        expect(screen.getByText('Winter Landscape')).toBeInTheDocument();
        expect(screen.queryByText('Spring Flowers')).not.toBeInTheDocument();
      });
    });

    it('filters by year', async () => {
      renderHomePage('2023');
      await waitFor(() => {
        expect(screen.queryByText('Winter Landscape')).not.toBeInTheDocument();
        expect(screen.getByText('Spring Flowers')).toBeInTheDocument();
      });
    });

    it('filters by stampSKU', async () => {
      renderHomePage('2002');
      await waitFor(() => {
        expect(screen.queryByText('Winter Landscape')).not.toBeInTheDocument();
        expect(screen.getByText('Spring Flowers')).toBeInTheDocument();
      });
    });

    it('is case-insensitive when filtering by name', async () => {
      renderHomePage('winter');
      await waitFor(() => {
        expect(screen.getByText('Winter Landscape')).toBeInTheDocument();
      });
    });

    it('shows NoSearchResults message when no products match', async () => {
      renderHomePage('zzznomatch');
      await waitFor(() => {
        expect(screen.getByText(/No stamps match "zzznomatch"/i)).toBeInTheDocument();
      });
    });
  });

  describe('error states', () => {
    it('shows error message when API returns non-ok status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      );
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText(/HTTP 500/i)).toBeInTheDocument();
      });
    });

    it('shows error message on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText(/Network failure/i)).toBeInTheDocument();
      });
    });

    it('shows error on 503 response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) }),
      );
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText(/HTTP 503/i)).toBeInTheDocument();
      });
    });

    it('shows fallback error text when error is not an Error instance', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue('a plain string error'));
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText(/Failed to load products/i)).toBeInTheDocument();
      });
    });

    it('shows NoSearchResults when API returns an empty array', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }),
      );
      renderHomePage('');
      await waitFor(() => {
        expect(screen.getByText(/No stamps match ""/i)).toBeInTheDocument();
      });
    });
  });
});


