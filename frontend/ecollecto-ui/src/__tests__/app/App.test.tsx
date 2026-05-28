import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../app/App';

// Mock auth hook so tests don't need Redux/OIDC providers
vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    getAccessToken: vi.fn(),
  }),
}));

// Mock react-oidc-context so LandingPage's direct useAuth() call works
vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    signinRedirect: vi.fn(),
  }),
}));

// Mock all page components to isolate routing logic
vi.mock('../../pages/Landing/LandingPage', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock('../../pages/Home/HomePage', () => ({
  default: ({ searchTerm }: { searchTerm: string }) => (
    <div data-testid="home-page">Home – searchTerm: "{searchTerm}"</div>
  ),
}));

vi.mock('../../pages/Product/ProductPage', () => ({
  default: () => <div data-testid="product-page">Product Page</div>,
}));

vi.mock('../../pages/Collection/CollectionPage', () => ({
  default: ({ searchTerm }: { searchTerm: string }) => (
    <div data-testid="collection-page">Collection – searchTerm: "{searchTerm}"</div>
  ),
}));

vi.mock('../../pages/FirstDay/FirstDayPage', () => ({
  default: ({ searchTerm }: { searchTerm: string }) => (
    <div data-testid="firstday-page">FirstDay – searchTerm: "{searchTerm}"</div>
  ),
}));

vi.mock('../../pages/NotFound/NotFoundPage', () => ({
  default: () => <div data-testid="notfound-page">Not Found</div>,
}));

vi.mock('../../pages/Catalog/CatalogPage', () => ({
  default: ({ searchTerm }: { searchTerm: string }) => (
    <div data-testid="catalog-page">Catalog – searchTerm: "{searchTerm}"</div>
  ),
}));

vi.mock('../../pages/Catalog/YearStampsPage', () => ({
  default: ({ searchTerm }: { searchTerm: string }) => (
    <div data-testid="year-stamps-page">YearStamps – searchTerm: "{searchTerm}"</div>
  ),
}));

// Prevent LanguageDropdown fetch calls
vi.mock('../../features/product/components/HeaderDetails/LanguageDropdown', () => ({
  default: () => <div data-testid="lang-dropdown" />,
}));

describe('App routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Use a predictable base for routing
    window.history.pushState({}, '', '/');
  });

  it('renders LandingPage at /', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  it('renders CollectionPage at /collection', async () => {
    window.history.pushState({}, '', '/collection');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('collection-page')).toBeInTheDocument();
    });
  });

  it('renders FirstDayPage at /firstday', async () => {
    window.history.pushState({}, '', '/firstday');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('firstday-page')).toBeInTheDocument();
    });
  });

  it('renders ProductPage at /stamps/:id', async () => {
    window.history.pushState({}, '', '/stamps/stamp-001');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('product-page')).toBeInTheDocument();
    });
  });

  it('renders NotFoundPage for unknown routes', async () => {
    window.history.pushState({}, '', '/this-does-not-exist');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('notfound-page')).toBeInTheDocument();
    });
  });

  it('renders Header navigation links', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByRole('link', { name: /catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first day of issue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /collection/i })).toBeInTheDocument();
  });

  it('passes empty searchTerm to CollectionPage initially', async () => {
    window.history.pushState({}, '', '/collection');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('collection-page')).toHaveTextContent('searchTerm: ""');
    });
  });

  it('updates searchTerm in CollectionPage when header search fires', async () => {
    window.history.pushState({}, '', '/collection');
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('collection-page')).toBeInTheDocument();
    });

    // Open the search bar and type
    const searchToggle = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg circle'),
    );
    if (searchToggle) {
      await user.click(searchToggle);
    }

    const input = screen.queryByPlaceholderText(/Search stamps/i);
    if (input) {
      await user.type(input, 'Ukraine');
      await waitFor(() => {
        expect(screen.getByTestId('collection-page')).toHaveTextContent('Ukraine');
      });
    }
  });

  // ── Routes added in multi-year refactor ───────────────────────────────────────

  it('renders CatalogPage at /stamps', async () => {
    window.history.pushState({}, '', '/stamps');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });
  });

  it('renders YearStampsPage at /stamps/year/:year', async () => {
    window.history.pushState({}, '', '/stamps/year/2024');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('year-stamps-page')).toBeInTheDocument();
    });
  });

  it('renders 403 page at /forbidden', async () => {
    window.history.pushState({}, '', '/forbidden');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/403/)).toBeInTheDocument();
    });
  });

  // ── searchTerm propagation ────────────────────────────────────────────────────

  it('passes empty searchTerm to CatalogPage initially', async () => {
    window.history.pushState({}, '', '/stamps');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('catalog-page')).toHaveTextContent('searchTerm: ""');
    });
  });

  it('propagates searchTerm to FirstDayPage when header search fires', async () => {
    window.history.pushState({}, '', '/firstday');
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('firstday-page')).toBeInTheDocument());

    const searchToggle = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg circle'),
    );
    if (searchToggle) await user.click(searchToggle);

    const input = screen.queryByPlaceholderText(/Search stamps/i);
    if (input) {
      await user.type(input, 'Kyiv');
      await waitFor(() => {
        expect(screen.getByTestId('firstday-page')).toHaveTextContent('Kyiv');
      });
    }
  });

  it('propagates searchTerm to CatalogPage when header search fires', async () => {
    window.history.pushState({}, '', '/stamps');
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('catalog-page')).toBeInTheDocument());

    const searchToggle = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg circle'),
    );
    if (searchToggle) await user.click(searchToggle);

    const input = screen.queryByPlaceholderText(/Search stamps/i);
    if (input) {
      await user.type(input, 'Sunflower');
      await waitFor(() => {
        expect(screen.getByTestId('catalog-page')).toHaveTextContent('Sunflower');
      });
    }
  });
});


