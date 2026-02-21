import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a custom render function that includes providers
export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  avatar: '/avatars/default.png',
  level: 5,
  xp: 1250,
  totalScore: 50000,
  gamesPlayed: 25,
  createdAt: new Date(),
  preferences: {
    soundEnabled: true,
    musicEnabled: true,
    notificationsEnabled: true,
    theme: 'dark' as const,
  },
  ...overrides,
});

export const createMockGame = (overrides = {}) => ({
  id: 'snake',
  name: 'Snake',
  description: 'Classic snake game',
  icon: 'Gamepad2' as const,
  difficulty: 'easy' as const,
  category: 'arcade',
  path: '/games/snake/',
  highScore: 1000,
  lastPlayed: new Date(),
  ...overrides,
});

export const createMockParty = (overrides = {}) => ({
  id: 'party-123',
  code: 'ABC123',
  leaderId: 'user-123',
  leaderName: 'Test User',
  members: [
    {
      userId: 'user-123',
      displayName: 'Test User',
      isReady: false,
      joinedAt: new Date(),
    },
  ],
  memberIds: ['user-123'],
  status: 'waiting' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockLeaderboardEntry = (overrides = {}) => ({
  rank: 1,
  userId: 'user-123',
  displayName: 'Test User',
  avatar: 'User',
  score: 10000,
  timestamp: new Date(),
  ...overrides,
});

// Firebase mock utilities
export const createMockFirestoreDoc = (data: any) => ({
  exists: () => true,
  id: 'doc-id',
  data: () => data,
  ...data,
});

export const createMockFirestoreQuery = (docs: any[]) => ({
  docs: docs.map((data, i) => ({
    id: `doc-${i}`,
    exists: () => true,
    data: () => data,
    ...data,
  })),
  empty: docs.length === 0,
  size: docs.length,
});

// Async utilities
export const waitForAsync = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Re-export testing library utilities
export * from '@testing-library/react';
export { vi } from 'vitest';
