# 🐍 Neon Snake Arena - Detailed Implementation Plan

> **Game ID:** `neon-snake`  
> **Version:** 1.0.0  
> **Status:** Ready for Development  
> **Estimated Development Time:** 4-5 days

---

## 📑 Table of Contents

1. [Game Overview](#game-overview)
2. [Database Schema](#database-schema)
3. [API Specifications](#api-specifications)
4. [Core Features](#core-features)
5. [Technical Architecture](#technical-architecture)
6. [File Structure](#file-structure)
7. [Implementation Phases](#implementation-phases)
8. [Testing Plan](#testing-plan)

---

## Game Overview

### Concept
Neon Snake Arena is a modern reimagining of the classic Snake game with a cyberpunk neon aesthetic. The game features a glowing snake that leaves light trails as it moves through a grid-based arena, collecting energy orbs and avoiding collisions.

### Unique Selling Points
- **Neon Glow Effects:** Real-time canvas glow effects using shadow blur
- **Dynamic Power-ups:** 5 unique power-ups that change gameplay
- **Multiple Game Modes:** Classic, Time Attack, and Endless modes
- **Progressive Difficulty:** Speed increases as score grows
- **Particle Effects:** Explosive visual feedback on actions

### Target Metrics
| Metric | Target |
|--------|--------|
| Average Session | 3-5 minutes |
| Load Time | < 2 seconds |
| Frame Rate | 60 FPS |
| First Input Delay | < 100ms |

---

## Database Schema

### Firestore Collections

#### 1. Game Configuration Collection
```typescript
// Collection: game_configs
// Document ID: neon-snake

interface NeonSnakeConfig {
  gameId: 'neon-snake';
  version: string;
  
  // Game Balance Settings
  settings: {
    baseSpeed: number;           // 150 ms per move (lower = faster)
    speedIncrement: number;      // 5 ms faster per level
    minSpeed: number;            // 50 ms (max speed cap)
    
    // Grid Settings
    gridWidth: number;           // 40 cells
    gridHeight: number;          // 30 cells
    cellSize: number;            // 20 pixels
    
    // Scoring
    baseFoodValue: number;       // 10 points
    goldenFoodValue: number;     // 50 points
    powerUpValue: number;        // 25 points
    segmentBonusThreshold: number; // Every N segments
    segmentBonusValue: number;   // 100 points
    
    // Power-up Settings
    powerUps: {
      speedBoost: {
        multiplier: number;      // 2x speed
        duration: number;        // 5000 ms
        spawnChance: number;     // 0.15 (15%)
      };
      ghostMode: {
        duration: number;        // 3000 ms
        spawnChance: number;     // 0.08 (8%)
      };
      scoreMultiplier: {
        multiplier: number;      // 2x
        duration: number;        // 10000 ms
        spawnChance: number;     // 0.10 (10%)
      };
      shrink: {
        segmentsRemoved: number; // 5 segments
        spawnChance: number;     // 0.12 (12%)
      };
      magnet: {
        radius: number;          // 5 cells
        duration: number;        // 8000 ms
        spawnChance: number;     // 0.08 (8%)
      };
    };
    
    // Food Spawn Rates
    foodSpawnRate: number;       // 3000 ms
    goldenFoodChance: number;    // 0.10 (10%)
    maxFoodItems: number;        // 3 on screen at once
  };
  
  // Feature Flags
  features: {
    powerUpsEnabled: boolean;
    particleEffects: boolean;
    screenShake: boolean;
    soundEffects: boolean;
  };
  
  updatedAt: Timestamp;
}
```

#### 2. Player Statistics Collection
```typescript
// Collection: player_stats
// Document ID: {userId}_{gameId} (e.g., "user123_neon-snake")

interface NeonSnakePlayerStats {
  userId: string;
  gameId: 'neon-snake';
  
  // Overall Stats
  totalGamesPlayed: number;
  totalPlayTime: number;         // in seconds
  
  // High Scores per Mode
  highScores: {
    classic: {
      score: number;
      achievedAt: Timestamp;
      segments: number;
      duration: number;          // game duration in seconds
    };
    timeAttack: {
      score: number;
      achievedAt: Timestamp;
      orbsCollected: number;
    };
    endless: {
      score: number;
      achievedAt: Timestamp;
      distance: number;          // in cells traveled
    };
  };
  
  // Cumulative Stats
  cumulative: {
    totalScore: number;
    totalOrbsCollected: number;
    totalPowerUpsCollected: number;
    totalSegmentsGrown: number;
    longestSnake: number;        // max segments
    fastestGame: number;         // shortest time to game over
    longestGame: number;         // longest survival time
  };
  
  // Power-up Stats
  powerUpStats: {
    speedBoost: { collected: number; totalDuration: number; };
    ghostMode: { collected: number; totalDuration: number; };
    scoreMultiplier: { collected: number; totalDuration: number; };
    shrink: { collected: number; totalSegmentsRemoved: number; };
    magnet: { collected: number; totalOrbsAttracted: number; };
  };
  
  // Achievements Progress
  achievements: {
    firstBlood: boolean;         // Play first game
    snakeCharmer: boolean;       // Reach 50 segments
    speedDemon: boolean;         // Use speed boost 10 times
    ghostWalker: boolean;        // Pass through 20 walls with ghost mode
    orbCollector: boolean;       // Collect 1000 orbs total
    marathonRunner: boolean;     // Survive 5 minutes in one game
    perfectGame: boolean;        // No power-ups, score 500+
    powerHungry: boolean;        // Collect all 5 power-ups in one game
  };
  
  lastPlayedAt: Timestamp;
  createdAt: Timestamp;
}
```

#### 3. Game Sessions Collection (Real-time)
```typescript
// Collection: game_sessions
// Document ID: auto-generated
// TTL: 24 hours (automatic cleanup)

interface NeonSnakeSession {
  sessionId: string;
  userId: string;
  gameId: 'neon-snake';
  mode: 'classic' | 'timeAttack' | 'endless';
  
  // Session State
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  startedAt: Timestamp;
  endedAt?: Timestamp;
  duration?: number;             // in seconds
  
  // Current Game State (for resume functionality)
  gameState?: {
    score: number;
    segments: Position[];        // Snake body positions
    direction: 'up' | 'down' | 'left' | 'right';
    foodItems: FoodItem[];
    activePowerUps: ActivePowerUp[];
    speed: number;
  };
  
  // Final Results
  finalScore?: number;
  finalStats?: {
    segments: number;
    orbsCollected: number;
    powerUpsCollected: number;
    causeOfDeath: 'wall' | 'self' | 'timeout';
  };
}

interface Position {
  x: number;
  y: number;
}

interface FoodItem {
  id: string;
  position: Position;
  type: 'normal' | 'golden';
  spawnedAt: Timestamp;
}

interface ActivePowerUp {
  type: PowerUpType;
  startedAt: Timestamp;
  expiresAt: Timestamp;
}
```

#### 4. Leaderboard Collection
```typescript
// Collection: leaderboards
// Document ID: neon-snake_{mode}_{period}
// Examples: "neon-snake_classic_daily", "neon-snake_classic_allTime"

interface NeonSnakeLeaderboard {
  gameId: 'neon-snake';
  mode: 'classic' | 'timeAttack' | 'endless';
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  
  entries: LeaderboardEntry[];
  lastUpdated: Timestamp;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  achievedAt: Timestamp;
  metadata: {
    segments?: number;
    duration?: number;
    orbsCollected?: number;
  };
}
```

### Database Security Rules

```javascript
// firestore.rules - Neon Snake specific
match /game_configs/neon-snake {
  allow read: if true;  // Public config
  allow write: if request.auth != null && 
    request.auth.token.admin == true;
}

match /player_stats/{document} {
  allow read: if request.auth != null && 
    document.matches(request.auth.uid + '_neon-snake');
  allow write: if request.auth != null && 
    document.matches(request.auth.uid + '_neon-snake');
}

match /game_sessions/{sessionId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}

match /leaderboards/neon-snake_{mode}_{period} {
  allow read: if true;  // Public leaderboards
  allow write: if request.auth != null && 
    request.auth.token.admin == true;
}
```

---

## API Specifications

### 1. Game Configuration API

#### Get Game Config
```typescript
// GET /api/games/neon-snake/config
// Cached for 5 minutes

interface GetGameConfigResponse {
  success: boolean;
  data: NeonSnakeConfig;
}

// Error Responses
// 404: Game config not found
// 500: Server error
```

#### Update Game Config (Admin Only)
```typescript
// PATCH /api/games/neon-snake/config
// Requires admin authentication

interface UpdateGameConfigRequest {
  settings?: Partial<NeonSnakeConfig['settings']>;
  features?: Partial<NeonSnakeConfig['features']>;
}

interface UpdateGameConfigResponse {
  success: boolean;
  data: NeonSnakeConfig;
}
```

### 2. Player Stats API

#### Get Player Stats
```typescript
// GET /api/games/neon-snake/stats
// Authentication required

interface GetPlayerStatsResponse {
  success: boolean;
  data: NeonSnakePlayerStats;
}
```

#### Update Stats After Game
```typescript
// POST /api/games/neon-snake/stats/update
// Authentication required
// Called automatically by game bridge

interface UpdateStatsRequest {
  mode: 'classic' | 'timeAttack' | 'endless';
  score: number;
  stats: {
    duration: number;
    orbsCollected: number;
    powerUpsCollected: number;
    segments: number;
    longestSnake: number;
    causeOfDeath: 'wall' | 'self' | 'timeout';
  };
  powerUpStats: {
    [key in PowerUpType]: {
      collected: number;
      duration?: number;
      segmentsRemoved?: number;
      orbsAttracted?: number;
    };
  };
}

interface UpdateStatsResponse {
  success: boolean;
  data: {
    newHighScore: boolean;
    previousRank?: number;
    newRank?: number;
    unlockedAchievements: string[];
    updatedStats: NeonSnakePlayerStats;
  };
}
```

### 3. Game Session API

#### Create Session
```typescript
// POST /api/games/neon-snake/sessions
// Authentication required

interface CreateSessionRequest {
  mode: 'classic' | 'timeAttack' | 'endless';
}

interface CreateSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    startedAt: string;
  };
}
```

#### Save Session State (Auto-save)
```typescript
// PATCH /api/games/neon-snake/sessions/:sessionId
// Authentication required
// Called periodically during gameplay

interface SaveSessionRequest {
  gameState: {
    score: number;
    segments: Position[];
    direction: string;
    foodItems: FoodItem[];
    activePowerUps: ActivePowerUp[];
    speed: number;
  };
}

interface SaveSessionResponse {
  success: boolean;
}
```

#### Complete Session
```typescript
// POST /api/games/neon-snake/sessions/:sessionId/complete
// Authentication required

interface CompleteSessionRequest {
  finalScore: number;
  finalStats: {
    segments: number;
    orbsCollected: number;
    powerUpsCollected: number;
    causeOfDeath: string;
  };
}

interface CompleteSessionResponse {
  success: boolean;
  data: {
    rank: number;
    isHighScore: boolean;
    xpEarned: number;
    coinsEarned: number;
  };
}
```

### 4. Leaderboard API

#### Get Leaderboard
```typescript
// GET /api/games/neon-snake/leaderboard?mode=classic&period=daily&limit=50
// Public endpoint

interface GetLeaderboardResponse {
  success: boolean;
  data: {
    entries: LeaderboardEntry[];
    totalEntries: number;
    playerRank?: number;  // Only if authenticated
    playerEntry?: LeaderboardEntry;
  };
}
```

#### Get Player Rank
```typescript
// GET /api/games/neon-snake/leaderboard/rank?mode=classic&period=daily
// Authentication required

interface GetPlayerRankResponse {
  success: boolean;
  data: {
    rank: number;
    score: number;
    percentile: number;
  };
}
```

### 5. Real-time Updates (WebSocket/Firebase)

```typescript
// Subscribe to leaderboard updates
const leaderboardRef = doc(db, 'leaderboards', 'neon-snake_classic_daily');
onSnapshot(leaderboardRef, (snapshot) => {
  const data = snapshot.data();
  updateLeaderboardUI(data.entries);
});

// Subscribe to personal stats updates
const statsRef = doc(db, 'player_stats', `${userId}_neon-snake`);
onSnapshot(statsRef, (snapshot) => {
  const data = snapshot.data();
  updateStatsUI(data);
});
```

---

## Core Features

### 1. Game Modes

#### Classic Mode
- Traditional Snake gameplay
- 3 lives system (optional)
- Progressive speed increase
- Wall collision = Game Over

#### Time Attack Mode
- 60-second timer
- Collect as many orbs as possible
- Golden orbs worth more
- No lives, timer-based only

#### Endless Mode
- No walls - snake wraps around screen
- Speed continuously increases
- Survive as long as possible
- Track distance traveled

### 2. Power-up System

| Power-up | Visual | Behavior | Implementation |
|----------|--------|----------|----------------|
| **Speed Boost** | Yellow lightning bolt | 2x movement speed for 5s | Modify game loop interval |
| **Ghost Mode** | Blue ghost icon | Pass through walls for 3s | Disable collision detection |
| **Score Multiplier** | Green "x2" | Double points for 10s | Multiply score additions |
| **Shrink** | Red compress arrows | Remove 5 tail segments | Pop from segments array |
| **Magnet** | Purple magnet | Attract food from 5 cells | Calculate distance to food |

### 3. Visual Effects

#### Glow System
```javascript
// Canvas shadow settings for neon glow
ctx.shadowBlur = 20;
ctx.shadowColor = '#00e5ff';
ctx.fillStyle = '#00e5ff';
```

#### Particle Effects
- **Food Collection:** 10-15 particles burst outward
- **Power-up Activation:** Color-coded particle ring
- **Game Over:** Explosion effect at collision point
- **Screen Shake:** 5px random offset for 200ms on impact

### 4. Audio System

| Event | Sound | Implementation |
|-------|-------|----------------|
| Move Tick | Subtle click (every move) | Web Audio API oscillator |
| Eat Food | Pleasant chime | Preloaded WAV file |
| Power-up | Distinct per type | Synthesized tones |
| Game Over | Descending beep sequence | Oscillator frequency sweep |
| High Score | Victory fanfare | Preloaded MP3 |

### 5. Input Handling

```typescript
interface InputConfig {
  // Keyboard
  up: ['ArrowUp', 'w', 'W'];
  down: ['ArrowDown', 's', 'S'];
  left: ['ArrowLeft', 'a', 'A'];
  right: ['ArrowRight', 'd', 'D'];
  pause: ['Escape', 'p', 'P'];
  
  // Touch (mobile)
  swipeThreshold: 50; // pixels
  tapToPause: true;
}
```

### 6. Achievement System

| Achievement | Condition | Reward |
|-------------|-----------|--------|
| **First Blood** | Complete first game | 50 XP |
| **Snake Charmer** | Reach 50 segments | 200 XP, Avatar Frame |
| **Speed Demon** | Use Speed Boost 10 times | 150 XP |
| **Ghost Walker** | Pass through 20 walls | 200 XP |
| **Orb Collector** | Collect 1000 orbs total | 500 XP, Title |
| **Marathon Runner** | Survive 5 minutes | 300 XP |
| **Perfect Game** | Score 500+ without power-ups | 1000 XP, Badge |
| **Power Hungry** | Collect all 5 power-ups in one game | 400 XP |

---

## Technical Architecture

### Game Loop Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Game Loop                             │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │  Input   │───▶│  Update  │───▶│  Render  │───▶│  RAF   │ │
│  │ Handling │    │  Logic   │    │  Frame   │    │Callback│ │
│  └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│        │              │                │                     │
│        ▼              ▼                ▼                     │
│  ┌──────────────────────────────────────────┐               │
│  │           State Management                │               │
│  │  - Snake position, direction              │               │
│  │  - Food items array                       │               │
│  │  - Active power-ups with timers           │               │
│  │  - Score, game mode, status               │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Module Dependencies

```
index.html
    ├── styles.css (Neon theme, animations)
    ├── js/
    │   ├── config.js (Game constants, settings)
    │   ├── state.js (Game state management)
    │   ├── input.js (Keyboard/touch handlers)
    │   ├── snake.js (Snake entity logic)
    │   ├── food.js (Food spawn, types)
    │   ├── powerup.js (Power-up system)
    │   ├── particles.js (Visual effects)
    │   ├── renderer.js (Canvas drawing)
    │   ├── audio.js (Sound management)
    │   ├── api.js (Backend communication)
    │   └── game.js (Main game controller)
    └── assets/
        ├── audio/
        └── sprites/
```

### Performance Optimizations

1. **Object Pooling:** Reuse particle objects
2. **Spatial Hashing:** Quick collision detection
3. **Dirty Rectangle Rendering:** Only redraw changed areas
4. **RequestAnimationFrame:** Sync with display refresh
5. **Debounced API Calls:** Batch stats updates

---

## File Structure

```
public/games/neon-snake/
├── index.html                    # Game entry point
├── styles.css                    # Game styles & animations
├── README.md                     # Game documentation
├── js/
│   ├── core/
│   │   ├── config.js            # Game constants & settings
│   │   ├── state.js             # State management class
│   │   ├── event-emitter.js     # Pub/sub for decoupling
│   │   └── logger.js            # Debug logging
│   │
│   ├── entities/
│   │   ├── snake.js             # Snake entity
│   │   ├── food.js              # Food spawner & types
│   │   ├── power-up.js          # Power-up definitions
│   │   └── particle.js          # Particle system
│   │
│   ├── systems/
│   │   ├── input.js             # Input handling
│   │   ├── renderer.js          # Canvas rendering
│   │   ├── audio.js             # Audio management
│   │   ├── collision.js         # Collision detection
│   │   └── storage.js           # Local storage wrapper
│   │
│   ├── ui/
│   │   ├── hud.js               # Heads-up display
│   │   ├── menus.js             # Menu screens
│   │   └── effects.js           # Screen effects (shake, flash)
│   │
│   ├── api/
│   │   ├── client.js            # API client
│   │   ├── endpoints.js         # API endpoint definitions
│   │   └── retry.js             # Retry logic with backoff
│   │
│   ├── modes/
│   │   ├── classic.js           # Classic mode logic
│   │   ├── time-attack.js       # Time attack mode
│   │   └── endless.js           # Endless mode
│   │
│   └── main.js                  # Game initialization & loop
│
└── assets/
    ├── audio/
    │   ├── eat.mp3
    │   ├── powerup-speed.mp3
    │   ├── powerup-ghost.mp3
    │   ├── powerup-multiplier.mp3
    │   ├── powerup-shrink.mp3
    │   ├── powerup-magnet.mp3
    │   ├── gameover.mp3
    │   ├── highscore.mp3
    │   └── move-tick.mp3
    │
    └── sprites/
        ├── snake-head.svg
        ├── snake-body.svg
        ├── snake-tail.svg
        ├── food-normal.svg
        ├── food-golden.svg
        ├── powerup-speed.svg
        ├── powerup-ghost.svg
        ├── powerup-multiplier.svg
        ├── powerup-shrink.svg
        ├── powerup-magnet.svg
        └── logo.png
```

---

## Implementation Phases

### Phase 1: Core Foundation (Day 1)
- [ ] Set up file structure
- [ ] Implement game loop with RAF
- [ ] Create base Snake class
- [ ] Implement grid rendering
- [ ] Add basic input handling
- [ ] Implement food spawning
- [ ] Basic collision detection

**Deliverable:** Playable basic Snake (no visuals, just functional)

### Phase 2: Visual Polish (Day 2)
- [ ] Neon glow effects
- [ ] Snake head/body/tail graphics
- [ ] Food sprites
- [ ] Particle system
- [ ] Screen shake effect
- [ ] Grid background with pulse
- [ ] HUD design

**Deliverable:** Visually appealing basic game

### Phase 3: Features (Day 3)
- [ ] Power-up system (all 5 types)
- [ ] Game modes (Classic, Time Attack, Endless)
- [ ] Score tracking
- [ ] High score persistence
- [ ] Menu system
- [ ] Pause functionality

**Deliverable:** Full feature set, single-player complete

### Phase 4: Audio & API (Day 4)
- [ ] Audio system implementation
- [ ] All sound effects
- [ ] API client setup
- [ ] Stats tracking
- [ ] Leaderboard integration
- [ ] Achievement system

**Deliverable:** Connected game with backend

### Phase 5: Integration & Testing (Day 5)
- [ ] Game bridge integration
- [ ] Hub compatibility testing
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Final polish

**Deliverable:** Production-ready game in hub

---

## Testing Plan

### Unit Tests

```typescript
// snake.test.js
describe('Snake', () => {
  test('should move in current direction', () => {
    const snake = new Snake({ x: 10, y: 10 });
    snake.direction = { x: 1, y: 0 };
    snake.move();
    expect(snake.head.x).toBe(11);
  });

  test('should grow when fed', () => {
    const snake = new Snake({ x: 10, y: 10 });
    const initialLength = snake.segments.length;
    snake.grow(3);
    expect(snake.segments.length).toBe(initialLength + 3);
  });

  test('should detect self collision', () => {
    const snake = new Snake({ x: 5, y: 5 });
    snake.segments = [
      { x: 5, y: 5 },   // head
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },   // loop back
      { x: 5, y: 4 }
    ];
    expect(snake.checkSelfCollision()).toBe(false); // Not touching yet
    
    snake.direction = { x: 0, y: -1 }; // Move up into segment
    snake.move();
    expect(snake.checkSelfCollision()).toBe(true);
  });
});

// powerup.test.js
describe('PowerUps', () => {
  test('speed boost should increase speed', () => {
    const game = new Game();
    const initialSpeed = game.speed;
    
    game.activatePowerUp('speedBoost');
    expect(game.speed).toBe(initialSpeed / 2); // 2x speed = half interval
    
    jest.advanceTimersByTime(5000);
    expect(game.speed).toBe(initialSpeed);
  });

  test('ghost mode should disable wall collision', () => {
    const game = new Game();
    game.snake.position = { x: 0, y: 5 };
    game.snake.direction = { x: -1, y: 0 }; // Moving into wall
    
    game.activatePowerUp('ghostMode');
    expect(game.checkWallCollision()).toBe(false);
    
    jest.advanceTimersByTime(3000);
    expect(game.checkWallCollision()).toBe(true);
  });
});
```

### Integration Tests

1. **Game Flow Test**
   - Start game → Play → Score → Game Over → Submit score
   
2. **API Integration Test**
   - Create session → Save state → Complete → Update stats
   
3. **Power-up Interactions**
   - Multiple power-ups active simultaneously
   - Power-up stacking rules
   
4. **Mode Switching**
   - Switch between game modes
   - Mode-specific behaviors

### Performance Tests

| Test | Target | Method |
|------|--------|--------|
| Frame Rate | 60 FPS | Chrome DevTools FPS meter |
| Memory Leaks | < 10MB growth | Heap snapshots over 5 min |
| Load Time | < 2s | Lighthouse performance audit |
| Input Latency | < 16ms | Input timing API |

### Browser Testing Matrix

| Browser | Desktop | Mobile | Priority |
|---------|---------|--------|----------|
| Chrome | ✅ | ✅ | P0 |
| Firefox | ✅ | ✅ | P1 |
| Safari | ✅ | ✅ | P1 |
| Edge | ✅ | - | P2 |

---

## Appendix

### Color Palette

```css
:root {
  /* Primary Colors */
  --neon-cyan: #00e5ff;
  --neon-pink: #ff00ff;
  --neon-purple: #b300ff;
  --neon-green: #00ff88;
  --neon-yellow: #ffee00;
  --neon-red: #ff0055;
  
  /* Background */
  --bg-black: #000000;
  --bg-dark: #0a0a0a;
  --bg-elevated: #121212;
  
  /* Grid */
  --grid-line: rgba(0, 229, 255, 0.1);
  --grid-glow: rgba(0, 229, 255, 0.3);
}
```

### Animation Curves

```css
:root {
  --ease-snake-move: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-powerup-pop: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-game-over: cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-menu-slide: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Event System

```javascript
// Custom events for decoupling
const GAME_EVENTS = {
  SNAKE_MOVE: 'snake:move',
  FOOD_EATEN: 'food:eaten',
  POWERUP_COLLECTED: 'powerup:collected',
  POWERUP_EXPIRED: 'powerup:expired',
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  SCORE_CHANGE: 'score:change',
  HIGH_SCORE: 'score:high'
};
```

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-03-06 | Initial detailed plan | AI Assistant |

---

**Next Steps:**
1. Review and approve plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Daily check-ins for progress tracking
