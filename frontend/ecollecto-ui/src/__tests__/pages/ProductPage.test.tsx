import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductPage from '../../pages/Product/ProductPage';

// Mock heavy child components so tests stay focused on page-level behaviour
vi.mock('../../features/product/components/StampContainer', () => ({
  default: ({ product }: { product: { name: string } }) => (
    <div data-testid="stamp-container">{product.name}</div>
  ),
}));

vi.mock('../../features/product/components/ProductSpecDetails/InformationSection', () => ({
  default: ({ product }: { product: { description: string } }) => (
    <div data-testid="information-section">{product.description}</div>
  ),
}));

const validProduct = {
  stamp_id: 'stamp-abc',
  name: 'Test Stamp ABC',
  description: 'A stamp for testing',
  stampSKU: 9001,
  meta: {
    denomination: 'W',
    series: 'Test Series',
    designer: 'Test Designer',
    perforation: true,
    stampsPerPane: 25,
    themes: 'History',
    europa: false,
  },
  release: {
    year: 2024,
    date: '2024-06-01',
    printQuantity: 75000,
    isMassIssue: false,
    isAvailable: true,
  },
  images: {
    original: 'https://example.com/orig.jpg',
    small: 'https://example.com/small.jpg',
    pane: null,
  },
};

const renderProductPage = (stampId: string) =>
  render(
    <MemoryRouter initialEntries={[`/stamps/${stampId}`]}>
      <Routes>
        <Route path="/stamps/:id" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProductPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      renderProductPage('stamp-abc');
      expect(screen.getByText(/Loading product/i)).toBeInTheDocument();
    });
  });

  describe('successful fetch', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(validProduct),
        }),
      );
    });

    it('renders the stamp container and information section', async () => {
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(screen.getByTestId('stamp-container')).toBeInTheDocument();
        expect(screen.getByTestId('information-section')).toBeInTheDocument();
      });
    });

    it('passes the product name to StampContainer', async () => {
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(screen.getByTestId('stamp-container')).toHaveTextContent('Test Stamp ABC');
      });
    });

    it('does not show loading state after data loads', async () => {
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(screen.queryByText(/Loading product/i)).not.toBeInTheDocument();
      });
    });

    it('fetches using the id from the URL param', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validProduct),
      });
      vi.stubGlobal('fetch', fetchMock);
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/stamp/stamp-abc', expect.any(Object));
      });
    });
  });

  describe('not found (404)', () => {
    it('shows the NotFoundPage when API returns 404', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }),
      );
      renderProductPage('nonexistent-id');
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument();
      });
    });
  });

  describe('error states', () => {
    it('shows error message when API returns 500', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      );
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(screen.getByText(/HTTP 500/i)).toBeInTheDocument();
      });
    });

    it('shows error message on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection lost')));
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
      });
    });

    it('shows fallback error text when rejection is not an Error object', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue('oops'));
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(screen.getByText(/Failed to load product/i)).toBeInTheDocument();
      });
    });

    it('shows error on 503 service unavailable', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) }),
      );
      renderProductPage('stamp-abc');
      await waitFor(() => {
        expect(screen.getByText(/HTTP 503/i)).toBeInTheDocument();
      });
    });
  });
});


