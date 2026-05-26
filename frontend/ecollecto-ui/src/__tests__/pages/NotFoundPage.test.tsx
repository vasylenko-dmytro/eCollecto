import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from '../../pages/NotFound/NotFoundPage';

describe('NotFoundPage', () => {
  const renderNotFound = () =>
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

  it('displays the 404 heading', () => {
    renderNotFound();
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument();
  });

  it('displays the error message text', () => {
    renderNotFound();
    expect(screen.getByText(/Oops, something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/we couldn't find your page/i)).toBeInTheDocument();
  });

  it('renders the "Back to Home" link pointing to /', () => {
    renderNotFound();
    const link = screen.getByRole('link', { name: /Back to Home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});


