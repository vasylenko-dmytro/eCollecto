import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CollectionPage from '../../pages/Collection/CollectionPage';
import { fetchStampYears, fetchStampsByYear } from '../../shared/api/stampsApi';

// Mock the heavy gallery component to keep tests focused on page behaviour
vi.mock(
  '../../features/product/components/CollectionDetails/StampImageCollectionGallery',
  () => ({
    default: ({ product }: { product: { name: string } }) => (
      <div data-testid="gallery-item">{product.name}</div>
    ),
  }),
);

// Mock the API layer so tests are not coupled to fetch internals
vi.mock('../../shared/api/stampsApi', () => ({
  fetchStampYears: vi.fn(),
  fetchStampsByYear: vi.fn(),
}));

const mockFetchStampYears = vi.mocked(fetchStampYears);
const mockFetchStampsByYear = vi.mocked(fetchStampsByYear);

const YEARS = [{ year: 2024, count: 1 }];
const MULTI_YEARS = [
  { year: 2024, count: 5 },
  { year: 2023, count: 10 },
  { year: 2022, count: 3 },
];

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
    vi.clearAllMocks();
    // Default: years fetch never resolves — keeps the loading state visible
    mockFetchStampYears.mockReturnValue(new Promise(() => {}));
    mockFetchStampsByYear.mockResolvedValue([]);
  });

  // ── Loading states ────────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows loading indicator while fetching years', () => {
      renderCollectionPage();
      expect(screen.getByText(/Loading collection/i)).toBeInTheDocument();
    });

    it('shows per-year loading indicator while stamps are fetching', async () => {
      mockFetchStampYears.mockResolvedValue(YEARS);
      mockFetchStampsByYear.mockReturnValue(new Promise(() => {})); // stamps never resolve
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Loading 2024 stamps/i)).toBeInTheDocument();
      });
    });
  });

  // ── Year selector ─────────────────────────────────────────────────────────────

  describe('year selector', () => {
    beforeEach(() => {
      mockFetchStampYears.mockResolvedValue(MULTI_YEARS);
      mockFetchStampsByYear.mockResolvedValue([makeProduct()]);
    });

    it('renders a button for each available year', async () => {
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /2024/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /2023/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /2022/ })).toBeInTheDocument();
      });
    });

    it('displays stamp count alongside each year', async () => {
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /2024.*5/s })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /2023.*10/s })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /2022.*3/s })).toBeInTheDocument();
      });
    });

    it('auto-selects the first (most recent) year and fetches its stamps', async () => {
      renderCollectionPage();
      await waitFor(() => {
        expect(mockFetchStampsByYear).toHaveBeenCalledWith(
          MULTI_YEARS[0].year,
          expect.any(AbortSignal),
        );
      });
    });

    it('fetches stamps for the clicked year and re-renders the gallery', async () => {
      mockFetchStampsByYear
        .mockResolvedValueOnce([makeProduct({ stamp_id: 'a-01', name: '2024 Stamp' })])
        .mockResolvedValueOnce([makeProduct({ stamp_id: 'b-01', name: '2023 Stamp' })]);

      const user = userEvent.setup();
      renderCollectionPage();

      await waitFor(() => expect(screen.getByText('2024 Stamp')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /2023/ }));

      await waitFor(() => {
        expect(mockFetchStampsByYear).toHaveBeenCalledWith(2023, expect.any(AbortSignal));
        expect(screen.getByText('2023 Stamp')).toBeInTheDocument();
        expect(screen.queryByText('2024 Stamp')).not.toBeInTheDocument();
      });
    });
  });

  // ── Successful fetch ──────────────────────────────────────────────────────────

  describe('successful fetch', () => {
    beforeEach(() => {
      mockFetchStampYears.mockResolvedValue(YEARS);
      mockFetchStampsByYear.mockResolvedValue([makeProduct()]);
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

  // ── Search filtering ──────────────────────────────────────────────────────────

  describe('search filtering', () => {
    const products = [
      makeProduct({ stamp_id: 'p-1', name: 'Autumn Leaves', stampSKU: 1001, release: { year: 2022, date: '2022-10-01', printQuantity: 10000, isMassIssue: false, isAvailable: true } }),
      makeProduct({ stamp_id: 'p-2', name: 'Spring Birds',  stampSKU: 2002, release: { year: 2023, date: '2023-04-01', printQuantity: 20000, isMassIssue: false, isAvailable: true } }),
    ];

    beforeEach(() => {
      mockFetchStampYears.mockResolvedValue(YEARS);
      mockFetchStampsByYear.mockResolvedValue(products);
    });

    it('shows all items when search term is empty', async () => {
      renderCollectionPage('');
      await waitFor(() => {
        expect(screen.getAllByTestId('gallery-item')).toHaveLength(2);
      });
    });

    it('filters by name (case-insensitive)', async () => {
      renderCollectionPage('autumn');
      await waitFor(() => {
        const items = screen.getAllByTestId('gallery-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Autumn Leaves');
      });
    });

    it('filters by release year', async () => {
      renderCollectionPage('2023');
      await waitFor(() => {
        const items = screen.getAllByTestId('gallery-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Spring Birds');
      });
    });

    it('filters by SKU number', async () => {
      renderCollectionPage('1001');
      await waitFor(() => {
        const items = screen.getAllByTestId('gallery-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Autumn Leaves');
      });
    });

    it('shows NoSearchResults when no items match', async () => {
      renderCollectionPage('xyznotfound');
      await waitFor(() => {
        expect(screen.getByText(/No stamps match "xyznotfound"/i)).toBeInTheDocument();
      });
    });
  });

  // ── Empty years list ──────────────────────────────────────────────────────────

  describe('empty years list', () => {
    beforeEach(() => {
      mockFetchStampYears.mockResolvedValue([]);
    });

    it('renders no year buttons when the API returns an empty list', async () => {
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.queryByText(/Loading collection/i)).not.toBeInTheDocument();
      });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('never calls fetchStampsByYear when years list is empty', async () => {
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.queryByText(/Loading collection/i)).not.toBeInTheDocument();
      });
      expect(mockFetchStampsByYear).not.toHaveBeenCalled();
    });
  });

  // ── Error states — years fetch ────────────────────────────────────────────────

  describe('error states — years fetch', () => {
    it('shows error message when years API returns an HTTP error', async () => {
      mockFetchStampYears.mockRejectedValue(new Error('HTTP 500'));
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/HTTP 500/i)).toBeInTheDocument();
      });
    });

    it('shows error message on network failure during years fetch', async () => {
      mockFetchStampYears.mockRejectedValue(new Error('Connection refused'));
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Connection refused/i)).toBeInTheDocument();
      });
    });

    it('shows fallback message when years rejection is not an Error instance', async () => {
      mockFetchStampYears.mockRejectedValue(null);
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Failed to load years/i)).toBeInTheDocument();
      });
    });
  });

  // ── Error states — stamps fetch ───────────────────────────────────────────────

  describe('error states — stamps fetch', () => {
    it('shows error message when stamps API fails after years load', async () => {
      mockFetchStampYears.mockResolvedValue(YEARS);
      mockFetchStampsByYear.mockRejectedValue(new Error('Stamps unavailable'));
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Stamps unavailable/i)).toBeInTheDocument();
      });
    });

    it('shows fallback message when stamps rejection is not an Error instance', async () => {
      mockFetchStampYears.mockResolvedValue(YEARS);
      mockFetchStampsByYear.mockRejectedValue(null);
      renderCollectionPage();
      await waitFor(() => {
        expect(screen.getByText(/Failed to load stamps/i)).toBeInTheDocument();
      });
    });
  });
});
