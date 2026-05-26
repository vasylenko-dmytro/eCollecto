import { render, screen } from '@testing-library/react';
import NoSearchResults from '../../features/product/components/NoSearchResults';

describe('NoSearchResults', () => {
  it('renders the search term in the message', () => {
    render(<NoSearchResults searchTerm="Ukraine 2024" />);
    expect(screen.getByText(/No stamps match "Ukraine 2024"/i)).toBeInTheDocument();
  });

  it('renders with an empty string search term', () => {
    render(<NoSearchResults searchTerm="" />);
    expect(screen.getByText(/No stamps match ""/i)).toBeInTheDocument();
  });

  it('renders with special characters in search term', () => {
    render(<NoSearchResults searchTerm='<script>alert("xss")</script>' />);
    // The content should be text-rendered, not executed
    expect(screen.getByText(/No stamps match/i)).toBeInTheDocument();
  });
});


