import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CollectionPage from '../../pages/Collection/CollectionPage';

// Mock the heavy gallery component to keep tests focused on page behaviour
vi.mock(
  '../../features/product/components/CollectionDetails/StampImageCollectionGallery',
  () => ({
    default: ({ product }: { product: { name: string } }) => (
      <div data-testid="gallery-item">{product.name}</div>
    ),
  }),
);

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  stamp_id: 'stamp-001',
  name: 'Ukraine Flowers',
  description: 'Colorful stamps',
  stampSKU: 3001,
  meta: {
    denomination: 'W',
    series: 'Flora',
    designer: 'O. Koval',
    perforation: true,
    stampsPerPane: 25,
    themes: 'Nature',
    europa: false,
  },
  release: {
    year: 2024,
    date: '2024-05-01',
    printQuantity: 50000,
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

const renderCollectionPage = (searchTerm = '') =>
  render(
    <MemoryRouter>
      <CollectionPage searchTerm={searchTerm} />
    </MemoryRouter>,
  );

describe('CollectionPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      renderCollectionPage();
      expect(screen.getByText(/Loading collection/i)).toBeInTheDocument();
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

    it('renders the gallery items after loading', async () => {
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByTestId('gallery-item')).toBeInTheDocument();
        expect(screen.getByText('Ukraine Flowers')).toBeInTheDocument();
      });
    });

    it('wraps each item in a link to the product page', async () => {
      renderCollectionPage();
      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/stamps/stamp-001');
      });
    });
  });

  describe('search filtering', () => {
    const products = [
      makeProduct({ stamp_id: 'p-1', name: 'Autumn Leaves', stampSKU: 1001, release: { year: 2022, date: '2022-10-01', printQuantity: 10000, isMassIssue: false, isAvailable: true } }),
      makeProduct({ stamp_id: 'p-2', name: 'Spring Birds', stampSKU: 2002, release: { year: 2023, date: '2023-04-01', printQuantity: 20000, isMassIssue: false, isAvailable: true } }),
    ];

    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(products) }),
      );
    });

    it('shows all items when search term is empty', async () => {
      renderCollectionPage('');
      await waitFor(() => {
        expect(screen.getAllByTestId('gallery-item')).toHaveLength(2);
      });
    });

    it('filters by name', async () => {
      renderCollectionPage('Autumn');
      await waitFor(() => {
        const items = screen.getAllByTestId('gallery-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Autumn Leaves');
      });
    });

    it('filters by year', async () => {
      renderCollectionPage('2023');
      await waitFor(() => {
        const items = screen.getAllByTestId('gallery-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Spring Birds');
      });
    });

    it('shows NoSearchResults when no items match', async () => {
      renderCollectionPage('xyznotfound');
      await waitFor(() => {
        expect(screen.getByText(/No stamps match "xyznotfound"/i)).toBeInTheDocument();
      });
    });
  });

  describe('error states', () => {
    it('shows error when API returns 500', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      );
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Failed to load collection \(500\)/i)).toBeInTheDocument();
      });
    });

    it('shows error on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Connection refused/i)).toBeInTheDocument();
      });
    });

    it('shows fallback error when rejection is not an Error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(null));
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Failed to load collection/i)).toBeInTheDocument();
      });
    });
  });
});


