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

// Mock all page components to isolate routing logic
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

  it('renders HomePage at /', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
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
    expect(screen.getByRole('link', { name: /stamps/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first day of issue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /collection/i })).toBeInTheDocument();
  });

  it('passes empty searchTerm to HomePage initially', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toHaveTextContent('searchTerm: ""');
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
});


