import { render, screen } from '@testing-library/react';
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/Card';

describe('Card', () => {
  it('should render children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  describe('variants', () => {
    it('should apply default variant', () => {
      render(<Card data-testid="card">Default</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-white');
    });

    it('should apply bordered variant', () => {
      render(<Card variant="bordered" data-testid="card">Bordered</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('border');
      expect(card.className).toContain('border-gray-200');
    });

    it('should apply elevated variant', () => {
      render(<Card variant="elevated" data-testid="card">Elevated</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('shadow-lg');
    });
  });

  describe('padding', () => {
    it('should apply medium padding by default', () => {
      render(<Card data-testid="card">Padded</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('p-4');
    });

    it('should apply no padding', () => {
      render(<Card padding="none" data-testid="card">No padding</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).not.toContain('p-3');
      expect(card.className).not.toContain('p-4');
      expect(card.className).not.toContain('p-6');
    });

    it('should apply small padding', () => {
      render(<Card padding="sm" data-testid="card">Small padding</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('p-3');
    });

    it('should apply large padding', () => {
      render(<Card padding="lg" data-testid="card">Large padding</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('p-6');
    });
  });

  it('should apply custom className', () => {
    render(<Card className="custom-class" data-testid="card">Custom</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('custom-class');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Ref Card</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('should apply margin bottom', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header.className).toContain('mb-4');
  });
});

describe('CardTitle', () => {
  it('should render as h3 heading', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
  });

  it('should apply title styles', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title.className).toContain('text-lg');
    expect(title.className).toContain('font-semibold');
  });
});

describe('CardDescription', () => {
  it('should render description text', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should apply description styles', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc.className).toContain('text-sm');
    expect(desc.className).toContain('text-gray-500');
  });
});

describe('CardContent', () => {
  it('should render content', () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('should render footer content', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should apply border and margin styles', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('mt-4');
    expect(footer.className).toContain('pt-4');
    expect(footer.className).toContain('border-t');
  });
});

describe('Card composition', () => {
  it('should render complete card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });
});
