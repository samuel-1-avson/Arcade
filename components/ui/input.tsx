import * as React from 'react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/a11y';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    helperText, 
    id: providedId,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    disabled,
    required,
    ...props 
  }, ref) => {
    // Generate unique ID for accessibility
    const [uniqueId, setUniqueId] = React.useState<string>('');
    React.useEffect(() => {
      setUniqueId(generateId('input'));
    }, []);
    
    const id = providedId || uniqueId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    
    // Build aria-describedby
    const describedByIds = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
      ariaDescribedBy,
    ].filter(Boolean).join(' ') || undefined;

    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id}
            className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2"
          >
            {label}
            {required && (
              <span className="text-danger ml-1" aria-hidden="true">*</span>
            )}
            {required && (
              <span className="sr-only"> (required)</span>
            )}
          </label>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            'flex w-full bg-elevated border border-white/[0.08] px-3 py-2 text-sm text-primary',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            'transition-colors',
            hasError && 'border-danger focus:border-danger focus:ring-danger/50',
            className
          )}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-label={!label ? ariaLabel : undefined}
          aria-describedby={describedByIds}
          aria-invalid={hasError}
          aria-required={required}
          aria-disabled={disabled}
          {...props}
        />
        {error && (
          <p 
            id={errorId} 
            className="mt-1.5 text-xs text-danger flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

// Accessible TextArea component
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, id: providedId, disabled, required, ...props }, ref) => {
    const [uniqueId, setUniqueId] = React.useState<string>('');
    React.useEffect(() => {
      setUniqueId(generateId('textarea'));
    }, []);
    
    const id = providedId || uniqueId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    
    const describedByIds = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id}
            className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
            {required && <span className="sr-only"> (required)</span>}
          </label>
        )}
        <textarea
          id={id}
          className={cn(
            'flex w-full bg-elevated border border-white/[0.08] px-3 py-2 text-sm text-primary',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            'transition-colors resize-y min-h-[80px]',
            error && 'border-danger focus:border-danger focus:ring-danger/50',
            className
          )}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-describedby={describedByIds}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
