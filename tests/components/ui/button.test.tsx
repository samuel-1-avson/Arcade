import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/tests/utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show loading state', () => {
    render(<Button isLoading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply different variants correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-elevated');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-danger');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-elevated');
  });

  it('should apply different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');
    
    rerender(<Button size="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
    
    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-9');
  });

  it('should forward ref correctly', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref as any}>Button with Ref</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should pass through additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom Button">Custom</Button>);
    
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    expect(screen.getByLabelText(/custom button/i)).toBeInTheDocument();
  });
});
