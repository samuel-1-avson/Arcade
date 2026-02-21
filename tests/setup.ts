import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = () => {};
  disconnect = () => {};
  unobserve = () => {};
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = () => {};
  disconnect = () => {};
  unobserve = () => {};
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out React 18 act() warnings
  if (typeof args[0] === 'string' && args[0].includes('act')) {
    return;
  }
  originalConsoleError(...args);
};
