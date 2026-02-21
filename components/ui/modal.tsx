'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useFocusTrap, generateId } from '@/lib/a11y';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  showCloseButton = true,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  // Generate unique IDs for ARIA attributes
  const [titleId, setTitleId] = React.useState<string>('');
  const [descriptionId, setDescriptionId] = React.useState<string>('');
  
  React.useEffect(() => {
    setTitleId(generateId('modal-title'));
    setDescriptionId(generateId('modal-desc'));
  }, []);

  // Focus trap
  const focusTrapRef = useFocusTrap(isOpen);
  
  // Store previous active element for focus restoration
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // Close on ESC key and handle focus
  React.useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        document.removeEventListener('keydown', handleEsc);
        
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        
        // Restore focus
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (typeof window === 'undefined') return null;

  const modalLabelId = ariaLabelledBy || (title ? titleId : undefined);
  const modalDescId = ariaDescribedBy || (description ? descriptionId : undefined);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={focusTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              aria-labelledby={modalLabelId}
              aria-describedby={modalDescId}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'relative bg-surface border border-white/[0.08] w-full pointer-events-auto',
                'shadow-2xl outline-none focus:ring-2 focus:ring-accent/50',
                sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              {/* Accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" aria-hidden="true" />
              
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
                  <div>
                    {title && (
                      <h2 
                        id={titleId}
                        className="font-display text-sm font-bold uppercase tracking-wider text-primary"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id={descriptionId} className="text-xs text-muted-foreground mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-8 w-8"
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-4">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/[0.05]', className)}>
      {children}
    </div>
  );
}

// Alert Dialog for important confirmations
interface AlertDialogProps extends Omit<ModalProps, 'children'> {
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'warning',
  size = 'sm',
}: AlertDialogProps) {
  const variantStyles = {
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-accent',
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      showCloseButton={false}
      aria-label={title}
    >
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button 
          variant={variant === 'danger' ? 'danger' : 'default'}
          onClick={handleConfirm}
          className={variantStyles[variant]}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export { Modal as default };
