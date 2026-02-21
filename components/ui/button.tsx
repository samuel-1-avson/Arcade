import * as React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    isLoading = false, 
    asChild = false,
    children, 
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    const variants = {
      default: 'bg-accent-dim border border-accent-border text-accent hover:bg-accent/20 hover:border-accent',
      primary: 'bg-accent text-background hover:bg-accent/90 border border-accent',
      secondary: 'bg-elevated border border-white/[0.08] text-primary hover:bg-raised hover:border-white/[0.12]',
      ghost: 'hover:bg-elevated hover:text-primary text-muted-foreground',
      danger: 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 hover:border-danger/50',
      outline: 'border border-white/[0.08] bg-transparent hover:bg-elevated hover:text-primary',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-11 px-8 text-base',
      icon: 'h-9 w-9',
    };

    // Generate loading label if not provided
    const loadingLabel = isLoading && !ariaLabel ? 'Loading...' : ariaLabel;

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium uppercase tracking-wider',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          isLoading && 'opacity-70 cursor-wait',
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={loadingLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button };

// Icon Button component for better accessibility
interface IconButtonProps extends Omit<ButtonProps, 'size' | 'children'> {
  icon: React.ReactNode;
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, ...props }, ref) => (
    <Button
      ref={ref}
      size="icon"
      aria-label={label}
      className={className}
      {...props}
    >
      {icon}
    </Button>
  )
);
IconButton.displayName = 'IconButton';
