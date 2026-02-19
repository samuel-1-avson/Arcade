/**
 * Component Library Index
 * Reusable UI components for Arcade Hub
 */

// Core Components
export { Button, BUTTON_VARIANTS, BUTTON_SIZES } from './Button.js';
export { Card, CARD_VARIANTS, createGameCard, createStatsCard } from './Card.js';
export { Modal, MODAL_SIZES, alert, confirm } from './Modal.js';
export { LoadingSpinner, SkeletonLoader, ProgressBar } from './Loading.js';
export { ErrorBoundary, safeAsync, withRetry } from './ErrorBoundary.js';

// Re-export all for convenience
export * from './Button.js';
export * from './Card.js';
export * from './Modal.js';
export * from './Loading.js';
export * from './ErrorBoundary.js';

// Default export with all components
export default {
    Button,
    BUTTON_VARIANTS,
    BUTTON_SIZES,
    Card,
    CARD_VARIANTS,
    Modal,
    MODAL_SIZES,
    LoadingSpinner,
    SkeletonLoader,
    ProgressBar,
    ErrorBoundary,
    safeAsync,
    withRetry
};

import { Button, BUTTON_VARIANTS, BUTTON_SIZES } from './Button.js';
import { Card, CARD_VARIANTS } from './Card.js';
import { Modal, MODAL_SIZES } from './Modal.js';
import { LoadingSpinner, SkeletonLoader, ProgressBar } from './Loading.js';
import { ErrorBoundary, safeAsync, withRetry } from './ErrorBoundary.js';
