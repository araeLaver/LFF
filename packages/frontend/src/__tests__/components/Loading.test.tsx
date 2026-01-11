import { render, screen } from '@testing-library/react';
import Loading, { LoadingPage, LoadingOverlay } from '../../components/ui/Loading';

describe('Loading', () => {
  it('should render spinner', () => {
    render(<Loading />);
    // Check for SVG spinner
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  describe('sizes', () => {
    it('should apply medium size by default', () => {
      render(<Loading />);
      const svg = document.querySelector('svg');
      const classList = svg?.getAttribute('class') || '';
      expect(classList).toContain('h-8');
      expect(classList).toContain('w-8');
    });

    it('should apply small size', () => {
      render(<Loading size="sm" />);
      const svg = document.querySelector('svg');
      const classList = svg?.getAttribute('class') || '';
      expect(classList).toContain('h-4');
      expect(classList).toContain('w-4');
    });

    it('should apply large size', () => {
      render(<Loading size="lg" />);
      const svg = document.querySelector('svg');
      const classList = svg?.getAttribute('class') || '';
      expect(classList).toContain('h-12');
      expect(classList).toContain('w-12');
    });
  });

  describe('text', () => {
    it('should not render text when not provided', () => {
      render(<Loading />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should render text when provided', () => {
      render(<Loading text="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });
  });

  describe('fullScreen', () => {
    it('should not be fullscreen by default', () => {
      const { container } = render(<Loading />);
      expect(container.querySelector('.fixed')).not.toBeInTheDocument();
    });

    it('should render fullscreen overlay when fullScreen is true', () => {
      const { container } = render(<Loading fullScreen />);
      const overlay = container.querySelector('.fixed');
      expect(overlay).toBeInTheDocument();
      expect(overlay?.className).toContain('inset-0');
      expect(overlay?.className).toContain('z-50');
    });
  });
});

describe('LoadingPage', () => {
  it('should render full page loading', () => {
    const { container } = render(<LoadingPage />);
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should use large spinner', () => {
    render(<LoadingPage />);
    const svg = document.querySelector('svg');
    const classList = svg?.getAttribute('class') || '';
    expect(classList).toContain('h-12');
    expect(classList).toContain('w-12');
  });
});

describe('LoadingOverlay', () => {
  it('should render fullscreen overlay', () => {
    const { container } = render(<LoadingOverlay />);
    expect(container.querySelector('.fixed')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<LoadingOverlay text="Saving..." />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should use large spinner', () => {
    render(<LoadingOverlay />);
    const svg = document.querySelector('svg');
    const classList = svg?.getAttribute('class') || '';
    expect(classList).toContain('h-12');
    expect(classList).toContain('w-12');
  });
});
