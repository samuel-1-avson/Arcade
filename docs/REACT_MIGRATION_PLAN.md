# Arcade Gaming Hub - React + Next.js + TypeScript Migration Plan

## Executive Summary

This document outlines the complete migration strategy for transforming the Arcade Gaming Hub from vanilla HTML/CSS/JS to a modern React + Next.js + TypeScript architecture. The games themselves remain untouched and will be integrated via a compatibility layer.

**Migration Timeline**: 6-8 weeks  
**Team Size**: 1-2 developers  
**Risk Level**: Medium (existing game compatibility)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 0: Analysis & Preparation](#2-phase-0-analysis--preparation)
3. [Phase 1: Project Setup](#3-phase-1-project-setup)
4. [Phase 2: Design System](#4-phase-2-design-system)
5. [Phase 3: Core Infrastructure](#5-phase-3-core-infrastructure)
6. [Phase 4: Feature Migration](#6-phase-4-feature-migration)
7. [Phase 5: Game Integration](#7-phase-5-game-integration)
8. [Phase 6: Testing & Optimization](#8-phase-6-testing--optimization)
9. [Phase 7: Deployment](#9-phase-7-deployment)
10. [Appendices](#10-appendices)

---

## 1. Architecture Overview

### 1.1 Target Architecture

```
arcade-hub-next/
├── app/                          # Next.js App Router
│   ├── (hub)/                    # Hub layout group
│   │   ├── layout.tsx            # Hub shell layout
│   │   ├── page.tsx              # Home/Dashboard
│   │   ├── games/
│   │   │   └── page.tsx          # Game library
│   │   ├── leaderboard/
│   │   │   └── page.tsx          # Leaderboards
│   │   ├── tournaments/
│   │   │   └── page.tsx          # Tournaments
│   │   ├── achievements/
│   │   │   └── page.tsx          # Achievements
│   │   └── shop/
│   │       └── page.tsx          # Item shop
│   ├── (game)/                   # Game layout group
│   │   ├── layout.tsx            # Game overlay layout
│   │   └── [gameId]/
│   │       └── page.tsx          # Individual game launcher
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── leaderboard/
│   │   └── games/
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # Design System components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Input/
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── PartyDrawer/
│   ├── game/                     # Game-related components
│   │   ├── GameCard/
│   │   ├── GameGrid/
│   │   └── GameOverlay/
│   └── features/                 # Feature components
│       ├── CommandPalette/
│       ├── Leaderboard/
│       ├── Party/
│       └── Friends/
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useGame.ts
│   ├── useParty.ts
│   └── ...
├── lib/                          # Core utilities
│   ├── firebase.ts               # Firebase config
│   ├── store/                    # Zustand stores
│   └── utils/
├── types/                        # TypeScript types
│   ├── game.ts
│   ├── user.ts
│   └── api.ts
├── public/
│   ├── games/                    # Games (untouched)
│   └── assets/
└── styles/
    └── globals.css
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 (App Router) | SSR, routing, API routes |
| UI Library | React 19 | Component architecture |
| Language | TypeScript 5.4 | Type safety |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Components | shadcn/ui | Base UI components |
| State | Zustand | Global state management |
| Auth | Firebase Auth | Authentication |
| Database | Firestore | Real-time data |
| Query | TanStack Query | Server state management |
| Forms | React Hook Form | Form handling |
| Validation | Zod | Schema validation |

### 1.3 Migration Strategy

**Approach**: Incremental migration with feature parity

1. **Parallel Development**: Build Next.js app alongside existing app
2. **Game Bridge**: Create iframe-based game integration layer
3. **Gradual Cutover**: Migrate features one by one
4. **Blue/Green Deployment**: Switch traffic once complete

---

## 2. Phase 0: Analysis & Preparation (Week 1)

### 2.1 Code Audit

```typescript
// Create inventory of existing features
interface FeatureAudit {
  name: string;
  files: string[];
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  migrationPriority: 1 | 2 | 3;
}

const features: FeatureAudit[] = [
  {
    name: 'Authentication',
    files: ['js/app/auth.js', 'js/services/UserAccountService.js'],
    complexity: 'medium',
    dependencies: ['Firebase Auth'],
    migrationPriority: 1
  },
  {
    name: 'Game Cards Grid',
    files: ['js/app/gameCards.js', 'js/components/Card.js'],
    complexity: 'low',
    dependencies: [],
    migrationPriority: 1
  },
  // ... audit all features
];
```

### 2.2 Data Model Design

```typescript
// types/user.ts
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  level: number;
  xp: number;
  totalScore: number;
  gamesPlayed: number;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'dark' | 'light';
}

// types/game.ts
export interface Game {
  id: string;
  name: string;
  description: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  path: string; // Path to vanilla game files
  highScore?: number;
  lastPlayed?: Date;
}

// types/party.ts
export interface Party {
  id: string;
  code: string;
  hostId: string;
  members: PartyMember[];
  status: 'waiting' | 'playing' | 'ended';
  createdAt: Date;
}

export interface PartyMember {
  userId: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'away' | 'playing';
  isHost: boolean;
}
```

### 2.3 Component Mapping

| Vanilla JS Component | React Component | Location |
|---------------------|-----------------|----------|
| `Card.js` | `GameCard.tsx` | `components/game/GameCard.tsx` |
| `FeaturedGames.js` | `FeaturedCarousel.tsx` | `components/game/FeaturedCarousel.tsx` |
| `Modal.js` | `Dialog` (shadcn) | `components/ui/dialog.tsx` |
| `Button.js` | `Button` (shadcn) | `components/ui/button.tsx` |
| `VirtualList.js` | `VirtualizedGrid` | `components/ui/virtualized-grid.tsx` |

### 2.4 Deliverables

- [ ] Feature audit document
- [ ] TypeScript type definitions
- [ ] Component mapping spreadsheet
- [ ] Risk assessment document

---

## 3. Phase 1: Project Setup (Week 1-2)

### 3.1 Initialize Next.js Project

```bash
# Create new Next.js project
npx create-next-app@latest arcade-hub-next \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*" \
  --no-turbopack

cd arcade-hub-next

# Install core dependencies
npm install zustand @tanstack/react-query @tanstack/react-query-nextjs-experimental
npm install firebase
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
npm install clsx tailwind-merge

# Initialize shadcn/ui
npx shadcn@latest init

# Install shadcn components
npx shadcn add button card dialog dropdown-menu input label
npx shadcn add scroll-area separator sheet skeleton
npx shadcn add tabs toast toggle tooltip
```

### 3.2 Project Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Static export for Vercel
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/games/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

```typescript
// tsconfig.json additions
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/hooks/*": ["./hooks/*"],
    }
  }
}
```

### 3.3 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Retro arcade palette
        background: '#000000',
        surface: '#0a0a0a',
        elevated: '#111111',
        accent: '#00e5ff',
        'accent-dim': 'rgba(0, 229, 255, 0.12)',
        'accent-border': 'rgba(0, 229, 255, 0.30)',
        success: '#39d98a',
        warning: '#f5a623',
        danger: '#e85555',
        violet: '#9d6fff',
        pink: '#e0508a',
      },
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-in-left': 'slideInLeft 0.3s ease',
        'slide-in-right': 'slideInRight 0.3s ease',
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 3.4 Folder Structure Setup

```bash
# Create directory structure
mkdir -p app/(hub)/{games,leaderboard,tournaments,achievements,shop}
mkdir -p app/(game)/[gameId]
mkdir -p app/api/{auth,leaderboard,games}
mkdir -p components/{ui,layout,game,features}
mkdir -p hooks
mkdir -p lib/{store,firebase,utils}
mkdir -p types
mkdir -p public/games  # Games will be copied here
mkdir -p public/assets
```

### 3.5 Deliverables

- [ ] Next.js project initialized
- [ ] All dependencies installed
- [ ] TypeScript configured
- [ ] Tailwind theme configured
- [ ] shadcn/ui components installed
- [ ] Folder structure created

---

## 4. Phase 2: Design System (Week 2-3)

### 4.1 Theme Provider

```typescript
// components/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### 4.2 Custom UI Components

```typescript
// components/ui/game-card.tsx
'use client';

import { Game } from '@/types/game';
import { cn } from '@/lib/utils';
import { Trophy, Users } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  className?: string;
}

export function GameCard({ game, onPlay, className }: GameCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-elevated border border-white/[0.06] overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-white/[0.12]',
        className
      )}
      onClick={() => onPlay(game)}
    >
      {/* Art area */}
      <div className="relative h-32 bg-surface flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        <span className="relative text-6xl transition-transform duration-300 group-hover:scale-110">
          {game.emoji}
        </span>
        
        {/* Difficulty badge */}
        <span className={cn(
          'absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
          'bg-black/70 border border-white/10',
          game.difficulty === 'easy' && 'text-success border-success/30',
          game.difficulty === 'medium' && 'text-warning border-warning/30',
          game.difficulty === 'hard' && 'text-danger border-danger/30',
        )}>
          {game.difficulty}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-primary truncate group-hover:text-accent transition-colors">
          {game.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {game.description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="w-3 h-3 text-warning" />
            <span>{game.highScore?.toLocaleString() ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          </div>
        </div>
      </div>

      {/* Play button (appears on hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-elevated to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-full py-2 bg-surface border border-white/[0.08] text-accent text-xs font-display uppercase tracking-wider hover:bg-accent-dim hover:border-accent-border transition-colors">
          Play Now
        </button>
      </div>
    </div>
  );
}
```

### 4.3 Layout Components

```typescript
// components/layout/sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, Trophy, Target, BarChart3, Award, 
  ShoppingCart, Settings, Gamepad2 
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Trophy, label: 'Tournaments', href: '/tournaments' },
  { icon: Target, label: 'Challenges', href: '/challenges' },
  { icon: BarChart3, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Award, label: 'Achievements', href: '/achievements' },
];

const secondaryNavItems = [
  { icon: ShoppingCart, label: 'Shop', href: '/shop' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-surface border-r border-accent/[0.08] z-50',
        'transition-all duration-300 ease-out',
        isExpanded ? 'w-[200px]' : 'w-16'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-white/[0.05]">
        <div className="w-8 h-8 bg-elevated border border-white/[0.08] flex items-center justify-center flex-shrink-0">
          <Gamepad2 className="w-5 h-5 text-accent" />
        </div>
        <h1 
          className={cn(
            'font-display text-sm font-bold uppercase tracking-wide text-primary whitespace-nowrap overflow-hidden',
            'transition-all duration-200',
            isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          )}
        >
          Arcade Hub
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
            isExpanded={isExpanded}
          />
        ))}
        
        <div className="flex-1" />
        
        {secondaryNavItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
            isExpanded={isExpanded}
          />
        ))}
      </nav>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
  isExpanded: boolean;
}

function NavItem({ icon: Icon, label, href, isActive, isExpanded }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-200',
        'hover:bg-elevated hover:text-primary',
        isActive 
          ? 'bg-elevated border-l-2 border-accent text-accent' 
          : 'text-muted-foreground border-l-2 border-transparent'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span 
        className={cn(
          'whitespace-nowrap overflow-hidden transition-all duration-200',
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'
        )}
      >
        {label}
      </span>
      {!isExpanded && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-elevated border border-white/[0.1] text-xs text-primary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {label}
        </span>
      )}
    </Link>
  );
}
```

### 4.4 Deliverables

- [ ] Theme provider implemented
- [ ] Design tokens configured in Tailwind
- [ ] Core UI components created
- [ ] Layout components (Sidebar, Header) implemented
- [ ] Animation utilities created
- [ ] Storybook stories (optional)

---

## 5. Phase 3: Core Infrastructure (Week 3-4)

### 5.1 State Management (Zustand)

```typescript
// lib/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      signOut: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      }),
      
      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

```typescript
// lib/store/game-store.ts
import { create } from 'zustand';
import { Game } from '@/types/game';

interface GameState {
  games: Game[];
  selectedGame: Game | null;
  filter: 'all' | 'easy' | 'medium' | 'hard';
  isPlaying: boolean;
  
  // Actions
  setGames: (games: Game[]) => void;
  selectGame: (game: Game | null) => void;
  setFilter: (filter: GameState['filter']) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  
  // Computed
  filteredGames: () => Game[];
}

export const useGameStore = create<GameState>()((set, get) => ({
  games: [],
  selectedGame: null,
  filter: 'all',
  isPlaying: false,
  
  setGames: (games) => set({ games }),
  selectGame: (game) => set({ selectedGame: game }),
  setFilter: (filter) => set({ filter }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  filteredGames: () => {
    const { games, filter } = get();
    if (filter === 'all') return games;
    return games.filter((g) => g.difficulty === filter);
  },
}));
```

```typescript
// lib/store/party-store.ts
import { create } from 'zustand';
import { Party, PartyMember } from '@/types/party';

interface PartyState {
  currentParty: Party | null;
  isInParty: boolean;
  messages: { id: string; userId: string; text: string; timestamp: Date }[];
  
  // Actions
  createParty: () => Promise<void>;
  joinParty: (code: string) => Promise<void>;
  leaveParty: () => void;
  sendMessage: (text: string) => void;
  addMember: (member: PartyMember) => void;
  removeMember: (userId: string) => void;
}

export const usePartyStore = create<PartyState>()((set, get) => ({
  currentParty: null,
  isInParty: false,
  messages: [],
  
  createParty: async () => {
    // Firebase integration
  },
  
  joinParty: async (code) => {
    // Firebase integration
  },
  
  leaveParty: () => {
    set({ currentParty: null, isInParty: false, messages: [] });
  },
  
  sendMessage: (text) => {
    const { currentParty } = get();
    if (!currentParty) return;
    // Send via Firebase
  },
  
  addMember: (member) => {
    set((state) => ({
      currentParty: state.currentParty
        ? { ...state.currentParty, members: [...state.currentParty.members, member] }
        : null,
    }));
  },
  
  removeMember: (userId) => {
    set((state) => ({
      currentParty: state.currentParty
        ? { ...state.currentParty, members: state.currentParty.members.filter((m) => m.userId !== userId) }
        : null,
    }));
  },
}));
```

### 5.2 Firebase Integration

```typescript
// lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (only in browser)
export const getFirebaseAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
```

```typescript
// lib/firebase/auth.ts
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from './config';
import { useAuthStore } from '@/lib/store/auth-store';
import { User } from '@/types/user';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  signInWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUser(result.user);
  },
  
  signInAsGuest: async () => {
    const result = await signInAnonymously(auth);
    return mapFirebaseUser(result.user);
  },
  
  signOut: () => firebaseSignOut(auth),
  
  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
    });
  },
};

function mapFirebaseUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || 'Guest',
    avatar: fbUser.photoURL || '/avatars/default.png',
    level: 1,
    xp: 0,
    totalScore: 0,
    gamesPlayed: 0,
    createdAt: new Date(fbUser.metadata.creationTime || Date.now()),
    preferences: {
      soundEnabled: true,
      musicEnabled: true,
      notificationsEnabled: true,
      theme: 'dark',
    },
  };
}
```

### 5.3 Custom Hooks

```typescript
// hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { authService } from '@/lib/firebase/auth';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, signOut } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = authService.onAuthChange((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  const signInWithGoogle = async () => {
    const user = await authService.signInWithGoogle();
    setUser(user);
  };

  const signInAsGuest = async () => {
    const user = await authService.signInAsGuest();
    setUser(user);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    signOut();
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signInAsGuest,
    signOut: handleSignOut,
  };
}
```

```typescript
// hooks/useGames.ts
import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/lib/store/game-store';
import { Game } from '@/types/game';

const GAMES: Game[] = [
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat food, grow longer, avoid walls',
    emoji: '🐍',
    difficulty: 'easy',
    category: 'classic',
    path: '/games/snake',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    description: 'Navigate mazes, eat dots, avoid ghosts',
    emoji: '👾',
    difficulty: 'medium',
    category: 'arcade',
    path: '/games/pacman',
  },
  // ... more games
];

export function useGames() {
  const { games, filter, setGames, setFilter } = useGameStore();

  useEffect(() => {
    // Load games from config
    setGames(GAMES);
  }, [setGames]);

  const filteredGames = useMemo(() => {
    if (filter === 'all') return games;
    return games.filter((g) => g.difficulty === filter);
  }, [games, filter]);

  return {
    games: filteredGames,
    allGames: games,
    filter,
    setFilter,
  };
}
```

### 5.4 Deliverables

- [ ] Zustand stores implemented (auth, game, party, friends, leaderboard)
- [ ] Firebase configuration complete
- [ ] Auth service implemented
- [ ] Firestore service layer created
- [ ] Custom hooks for data fetching
- [ ] React Query setup for server state

---

## 6. Phase 4: Feature Migration (Week 4-6)

### 6.1 Home Page / Dashboard

```typescript
// app/(hub)/page.tsx
import { Metadata } from 'next';
import { HeroSection } from '@/components/hero/hero-section';
import { QuickStats } from '@/components/dashboard/quick-stats';
import { GameGrid } from '@/components/game/game-grid';

export const metadata: Metadata = {
  title: 'Arcade Gaming Hub',
  description: 'Play classic arcade games online',
};

export default function HomePage() {
  return (
    <div className="space-y-8">
      <HeroSection />
      <QuickStats />
      <GameGrid />
    </div>
  );
}
```

```typescript
// components/hero/hero-section.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Game } from '@/types/game';
import { useGameStore } from '@/lib/store/game-store';

const FEATURED_GAMES: Game[] = [
  // Featured games rotation
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { selectGame, setIsPlaying } = useGameStore();

  const currentGame = FEATURED_GAMES[currentIndex];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % FEATURED_GAMES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + FEATURED_GAMES.length) % FEATURED_GAMES.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, []);

  const handlePlay = () => {
    selectGame(currentGame);
    setIsPlaying(true);
  };

  return (
    <section className="relative bg-elevated border border-white/[0.06] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      
      <div className="flex flex-col lg:flex-row">
        {/* Content */}
        <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGame.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent mb-4">
                <span className="w-1 h-1 bg-accent animate-pulse" />
                Featured
              </span>
              
              <h2 className="font-display text-3xl lg:text-4xl font-bold uppercase tracking-wide text-primary mb-4">
                {currentGame.name}
              </h2>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className={`uppercase text-xs font-semibold ${
                  currentGame.difficulty === 'easy' ? 'text-success' :
                  currentGame.difficulty === 'medium' ? 'text-warning' : 'text-danger'
                }`}>
                  {currentGame.difficulty}
                </span>
                <span>•</span>
                <span>1 Player</span>
                <span>•</span>
                <span>Arcade Classic</span>
              </div>
              
              <p className="text-muted-foreground max-w-md mb-8">
                {currentGame.description}
              </p>
              
              <button
                onClick={handlePlay}
                className="inline-flex items-center gap-3 px-8 py-4 border border-accent-border text-accent font-display text-sm uppercase tracking-widest hover:bg-accent-dim hover:border-accent transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Play Now
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Art */}
        <div className="relative lg:w-[45%] min-h-[280px] bg-surface flex items-center justify-center">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGame.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="relative text-[8rem] lg:text-[10rem] drop-shadow-[0_0_30px_rgba(0,229,255,0.2)]"
            >
              {currentGame.emoji}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={prevSlide}
              className="w-9 h-9 bg-elevated border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:border-accent-border hover:text-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="w-9 h-9 bg-elevated border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:border-accent-border hover:text-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {FEATURED_GAMES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 transition-all ${
                  idx === currentIndex 
                    ? 'w-5 bg-accent' 
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 6.2 Other Pages

```typescript
// app/(hub)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PartyFAB } from '@/components/party/party-fab';

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-16 lg:ml-0">
        <Header />
        <main className="pt-16">
          <div className="container max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      <PartyFAB />
    </div>
  );
}
```

### 6.3 Deliverables

- [ ] Home page with hero carousel
- [ ] Game library page with filtering
- [ ] Leaderboard page
- [ ] Achievements page
- [ ] Shop page
- [ ] Settings page
- [ ] Profile modal
- [ ] Auth modal

---

## 7. Phase 5: Game Integration Layer (Week 6-7)

### 7.1 Game Bridge Architecture

```typescript
// components/game/game-bridge.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/lib/store/game-store';
import { useAuthStore } from '@/lib/store/auth-store';

interface GameBridgeProps {
  gamePath: string;
  onScore: (score: number) => void;
  onExit: () => void;
}

export function GameBridge({ gamePath, onScore, onExit }: GameBridgeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuthStore();

  // Listen for messages from the vanilla game
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin in production
      
      switch (event.data.type) {
        case 'GAME_SCORE':
          onScore(event.data.score);
          break;
        case 'GAME_EXIT':
          onExit();
          break;
        case 'GAME_READY':
          // Send user data to game
          iframeRef.current?.contentWindow?.postMessage({
            type: 'INIT_GAME',
            userId: user?.id,
            username: user?.displayName,
          }, '*');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onScore, onExit, user]);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <button
          onClick={onExit}
          className="px-4 py-2 bg-elevated border border-white/[0.08] text-primary text-sm hover:bg-elevated/80 transition-colors"
        >
          ← Exit Game
        </button>
        <span className="text-muted-foreground text-sm">
          Press ESC to exit
        </span>
      </div>
      
      <iframe
        ref={iframeRef}
        src={gamePath}
        className="w-full h-full border-0"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
```

```typescript
// app/(game)/[gameId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { GameBridge } from '@/components/game/game-bridge';
import { useGames } from '@/hooks/useGames';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { allGames } = useGames();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const game = allGames.find((g) => g.id === params.gameId);

  if (!game) {
    return <div>Game not found</div>;
  }

  const handleScore = async (score: number) => {
    // Submit score to leaderboard
    try {
      await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          score,
          userId: user?.id,
        }),
      });
      
      toast({
        title: 'Score Submitted!',
        description: `You scored ${score.toLocaleString()} points!`,
      });
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <GameBridge
      gamePath={game.path}
      onScore={handleScore}
      onExit={handleExit}
    />
  );
}
```

### 7.2 Vanilla Game Wrapper

```html
<!-- public/games/snake/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Snake</title>
  <script>
    // Notify React parent that game is ready
    window.parent.postMessage({ type: 'GAME_READY' }, '*');
    
    // Listen for messages from React
    window.addEventListener('message', (e) => {
      if (e.data.type === 'INIT_GAME') {
        // Initialize game with user data
        window.gameUser = e.data;
      }
    });
    
    // Helper to submit score
    window.submitScore = (score) => {
      window.parent.postMessage({ type: 'GAME_SCORE', score }, '*');
    };
    
    // Helper to exit game
    window.exitGame = () => {
      window.parent.postMessage({ type: 'GAME_EXIT' }, '*');
    };
    
    // Handle ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.exitGame();
      }
    });
  </script>
</head>
<body>
  <!-- Existing game content -->
</body>
</html>
```

### 7.3 Deliverables

- [ ] Game Bridge component
- [ ] PostMessage protocol defined
- [ ] Game launcher page
- [ ] Score submission API
- [ ] Exit handling
- [ ] Games copied to public folder

---

## 8. Phase 6: Testing & Optimization (Week 7-8)

### 8.1 Testing Strategy

```typescript
// __tests__/components/GameCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from '@/components/ui/game-card';
import { Game } from '@/types/game';

const mockGame: Game = {
  id: 'snake',
  name: 'Snake',
  description: 'Test game',
  emoji: '🐍',
  difficulty: 'easy',
  category: 'classic',
  path: '/games/snake',
};

describe('GameCard', () => {
  it('renders game information correctly', () => {
    const onPlay = jest.fn();
    render(<GameCard game={mockGame} onPlay={onPlay} />);
    
    expect(screen.getByText('Snake')).toBeInTheDocument();
    expect(screen.getByText('Test game')).toBeInTheDocument();
    expect(screen.getByText('🐍')).toBeInTheDocument();
  });

  it('calls onPlay when clicked', () => {
    const onPlay = jest.fn();
    render(<GameCard game={mockGame} onPlay={onPlay} />);
    
    fireEvent.click(screen.getByText('Snake'));
    expect(onPlay).toHaveBeenCalledWith(mockGame);
  });
});
```

### 8.2 Performance Optimization

```typescript
// next.config.ts optimizations
const nextConfig = {
  // ... existing config
  
  // Image optimization
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  
  // Bundle optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  
  // Compression
  compress: true,
  
  // Static generation
  trailingSlash: true,
};
```

### 8.3 Deliverables

- [ ] Unit tests for components
- [ ] Integration tests for features
- [ ] E2E tests for critical paths
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Lighthouse score > 90

---

## 9. Phase 7: Deployment (Week 8)

### 9.1 Deployment Configuration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 9.2 Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=xxx
```

### 9.3 Migration Checklist

- [ ] Copy all games to `public/games/`
- [ ] Set up environment variables in Vercel
- [ ] Configure Firebase Auth domains
- [ ] Run final tests
- [ ] Deploy to production
- [ ] Update DNS (if using custom domain)
- [ ] Monitor error logs
- [ ] Performance monitoring

---

## 10. Appendices

### Appendix A: File Migration Mapping

| Old File | New Location | Status |
|----------|--------------|--------|
| `js/app.js` | `app/layout.tsx` | Migrated |
| `js/app/ArcadeHub.js` | `components/providers/app-provider.tsx` | Migrated |
| `js/app/auth.js` | `lib/firebase/auth.ts` + `hooks/useAuth.ts` | Migrated |
| `js/app/gameCards.js` | `components/game/game-grid.tsx` | Migrated |
| `js/components/FeaturedGames.js` | `components/hero/hero-section.tsx` | Migrated |
| `js/services/*` | `lib/store/*` + `lib/firebase/*` | Migrated |
| `css/*.css` | `tailwind.config.ts` + `globals.css` | Migrated |
| `games/*` | `public/games/*` | Copied as-is |

### Appendix B: Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "firebase": "^11.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.454.0",
    "framer-motion": "^11.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### Appendix C: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Game compatibility issues | High | Thorough testing with iframe bridge |
| Firebase data migration | Medium | Keep existing data structure |
| Performance regression | Medium | Code splitting, lazy loading |
| SEO impact | Low | Next.js SSR for meta pages |
| User session loss | High | Migrate localStorage to new format |

### Appendix D: Timeline Summary

| Phase | Duration | Week(s) |
|-------|----------|---------|
| Phase 0: Analysis | 3 days | 1 |
| Phase 1: Setup | 4 days | 1-2 |
| Phase 2: Design System | 5 days | 2-3 |
| Phase 3: Infrastructure | 5 days | 3-4 |
| Phase 4: Feature Migration | 10 days | 4-6 |
| Phase 5: Game Integration | 5 days | 6-7 |
| Phase 6: Testing | 5 days | 7-8 |
| Phase 7: Deployment | 2 days | 8 |
| **Total** | **39 days** | **~8 weeks** |

---

## Conclusion

This migration plan provides a comprehensive roadmap for transforming the Arcade Gaming Hub into a modern React + Next.js + TypeScript application while preserving the existing games and user data. The phased approach allows for incremental development and testing, reducing risk while ensuring feature parity with the existing implementation.

**Key Success Factors:**
1. Maintaining game compatibility via iframe bridge
2. Preserving Firebase data structure
3. Thorough testing at each phase
4. Performance monitoring throughout
5. Gradual rollout with rollback capability
