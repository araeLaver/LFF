import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../components/ui/Button';

describe('Button', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe('variants', () => {
    it('should apply primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-600');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-600');
    });

    it('should apply outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-blue-600');
    });

    it('should apply ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-gray-600');
    });

    it('should apply danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-600');
    });
  });

  describe('sizes', () => {
    it('should apply medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-4 py-2');
    });

    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-3 py-1.5');
    });

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-6 py-3');
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Loading...');
    });

    it('should be disabled when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not show loading indicator when isLoading is false', () => {
      render(<Button isLoading={false}>Submit</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Submit');
      expect(screen.getByRole('button')).not.toHaveTextContent('Loading...');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
