import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FirstDayPage from '../../pages/FirstDay/FirstDayPage';

// Mock the heavy FirstDayCollection component
vi.mock('../../features/product/components/FirstDayIssue/FirstDayCollection', () => ({
  default: ({ product }: { product: { name: string } }) => (
    <div data-testid="fdc-item">{product.name}</div>
  ),
}));

const makeFDC = (overrides: Record<string, unknown> = {}) => ({
  postmark_id: 'fdc-001',
  envelope_id: 'env-001',
  name: 'First Day of Ukraine',
  description: 'An iconic first day cover',
  postmarkSKU: 2001,
  envelopeSKU: 2002,
  designer: 'FDC Designer',
  release: { year: 2024, date: '2024-01-24', printQuantity: 5000 },
  images: {
    envelope: 'https://example.com/env.jpg',
    postmark: 'https://example.com/pm.jpg',
  },
  ...overrides,
});

const renderFirstDayPage = (searchTerm = '') =>
  render(
    <MemoryRouter>
      <FirstDayPage searchTerm={searchTerm} />
    </MemoryRouter>,
  );

describe('FirstDayPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      renderFirstDayPage();
      expect(screen.getByText(/Loading first day covers/i)).toBeInTheDocument();
    });
  });

  describe('successful fetch', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([makeFDC()]),
        }),
      );
    });

    it('renders FDC items after loading', async () => {
      renderFirstDayPage();
      await waitFor(() => {
        expect(screen.getByTestId('fdc-item')).toBeInTheDocument();
        expect(screen.getByText('First Day of Ukraine')).toBeInTheDocument();
      });
    });

    it('does not show loading indicator once loaded', async () => {
      renderFirstDayPage();
      await waitFor(() => {
        expect(screen.queryByText(/Loading first day covers/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('search filtering', () => {
    const fdcList = [
      makeFDC({ postmark_id: 'fdc-1', name: 'Anniversary Cover', release: { year: 2022, date: '2022-08-24', printQuantity: 3000 } }),
      makeFDC({ postmark_id: 'fdc-2', name: 'Victory Cover', release: { year: 2023, date: '2023-05-09', printQuantity: 4000 } }),
    ];

    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(fdcList) }),
      );
    });

    it('shows all items when search is empty', async () => {
      renderFirstDayPage('');
      await waitFor(() => {
        expect(screen.getAllByTestId('fdc-item')).toHaveLength(2);
      });
    });

    it('filters by name', async () => {
      renderFirstDayPage('Anniversary');
      await waitFor(() => {
        const items = screen.getAllByTestId('fdc-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Anniversary Cover');
      });
    });

    it('filters by year', async () => {
      renderFirstDayPage('2023');
      await waitFor(() => {
        const items = screen.getAllByTestId('fdc-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Victory Cover');
      });
    });

    it('is case-insensitive when filtering', async () => {
      renderFirstDayPage('victory');
      await waitFor(() => {
        expect(screen.getByText('Victory Cover')).toBeInTheDocument();
      });
    });

    it('shows NoSearchResults when no items match the filter', async () => {
      renderFirstDayPage('nothing_will_match');
      await waitFor(() => {
        expect(screen.getByText(/No stamps match "nothing_will_match"/i)).toBeInTheDocument();
      });
    });
  });

  describe('error states', () => {
    it('shows error message when API returns 404', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }),
      );
      renderFirstDayPage();
      await waitFor(() => {
        expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();
      });
    });

    it('shows error on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Timeout')));
      renderFirstDayPage();
      await waitFor(() => {
        expect(screen.getByText(/Timeout/i)).toBeInTheDocument();
      });
    });

    it('shows fallback message when non-Error is thrown', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(undefined));
      renderFirstDayPage();
      await waitFor(() => {
        expect(screen.getByText(/Failed to load first day covers/i)).toBeInTheDocument();
      });
    });
  });
});


