# Arcade Gaming Hub - UI Integration Guide

This guide explains how to integrate the new UI with the existing ArcadeHub application.

## Overview

The new UI is designed to be:
- **Progressive**: Can be enabled gradually
- **Reversible**: Can rollback to old UI if needed
- **Compatible**: Works with existing services
- **Non-breaking**: Doesn't affect game functionality

## Quick Start

### Option 1: Standalone New UI (Recommended for Testing)

```bash
# Open the new UI directly
open index-new-ui.html
```

This loads only the new UI with mock data.

### Option 2: Integrated with Existing App

```javascript
// In your existing app initialization
import { migrateToNewUI } from './js-new/integration/index.js';

// After ArcadeHub initializes
await migrateToNewUI();
```

## File Structure

```
js-new/
├── components/          # UI components
├── utils/              # Utilities
├── integration/        # Bridge to existing app
│   ├── Bridge.js       # Main integration bridge
│   ├── Migrator.js     # UI migration helper
│   └── index.js        # Integration exports
├── App.js              # New UI app class
└── index.js            # Entry point
```

## Integration Methods

### Method 1: Automatic Migration (Recommended)

```javascript
import { migrateToNewUI } from './js-new/integration/index.js';

// Call after your app is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for existing ArcadeHub
  await waitForArcadeHub();
  
  // Migrate to new UI
  await migrateToNewUI();
});
```

**What this does:**
1. Hides old UI elements
2. Initializes new UI components
3. Transfers data from old to new
4. Connects event handlers
5. Sets up keyboard shortcuts

### Method 2: Manual Bridge

For more control, use the bridge directly:

```javascript
import { bridge } from './js-new/integration/Bridge.js';
import { app } from './js-new/App.js';

// Initialize bridge with existing ArcadeHub
await bridge.init();

// Now you can use both UIs
// Old UI: window.arcadeHub
// New UI: app

// Customize behavior
bridge.onGameLaunch = (gameId) => {
  // Your custom launch logic
};
```

### Method 3: Hybrid (Selective Components)

Use only specific new components:

```javascript
import { TopBar, NavigationPills } from './js-new/components/index.js';

// Replace just the top bar
const topbar = new TopBar('.topbar');

// Keep old sidebar but use new navigation
const nav = new NavigationPills('.nav-pills');
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Existing ArcadeHub                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Games   │  │   User   │  │ Settings │                  │
│  │  Data    │  │   Data   │  │          │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │             │             │                        │
│       └─────────────┴─────────────┘                        │
│                     │                                       │
│            ┌────────┴────────┐                             │
│            │  Bridge Layer   │                             │
│            │  (Transforms)   │                             │
│            └────────┬────────┘                             │
│                     │                                       │
│       ┌─────────────┼─────────────┐                        │
│       │             │             │                        │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐                 │
│  │  Games   │  │   User   │  │ Settings │                  │
│  │  Grid    │  │  Profile │  │  Panel   │                  │
│  │ (New UI) │  │ (New UI) │  │ (New UI) │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                           │
│                    New UI Components                        │
└─────────────────────────────────────────────────────────────┘
```

## Event Mapping

| Old Event | New Event | Bridge Action |
|-----------|-----------|---------------|
| `game:launch` | `app:game:launch` | Launch via gameLoaderService |
| `userSignedIn` | `app:user:update` | Update user avatar/name |
| `HIGHSCORE_UPDATE` | `app:game:score` | Update card high score |
| `syncStatusChanged` | - | Update sync indicator |

## API Reference

### Bridge Methods

```javascript
// Initialize
await bridge.init();

// Launch game
bridge.launchGame('snake');

// Update user
bridge.setUser({ name: 'Player', xp: 1000 });

// Update settings
bridge.updateSetting('sound-toggle', true);

// Show auth modal
bridge.showAuth();

// Hide auth modal
bridge.hideAuth();
```

### App Methods

```javascript
// Access the new UI app
import { app } from './js-new/App.js';

// Navigation
app.navigateTo('games');
app.openPanel('social');
app.closePanel();

// Notifications
app.showToast('Message', 'success'); // types: success, error, info

// Events
app.on('game:play', ({ gameId }) => {
  console.log('Playing', gameId);
});
```

## Customization

### Theming

```css
/* Override CSS variables */
:root {
  --accent-primary: #ff0055; /* Change primary color */
  --topbar-height: 56px;     /* Change header height */
}
```

### Component Overrides

```javascript
// Extend a component
class MyTopBar extends TopBar {
  bindEvents() {
    super.bindEvents();
    // Add custom events
    this.on(this.element, 'custom-event', () => {
      // Handle it
    });
  }
}
```

## Rollback

If you need to revert to the old UI:

```javascript
import { migrator } from './js-new/integration/Migrator.js';

// Rollback to old UI
migrator.rollback();
```

## Troubleshooting

### Games not loading

Check that `gameLoaderService` is available:

```javascript
if (window.gameLoaderService) {
  bridge.launchGame(gameId);
}
```

### User data not syncing

Ensure eventBus is properly connected:

```javascript
eventBus.on('userSignedIn', (user) => {
  app.setUser(user);
});
```

### Styles conflicting

The new UI uses `css-new/` prefix. If there are conflicts:

```css
/* Scope new UI styles */
[data-new-ui] .component {
  /* styles */
}
```

## Performance

### Lazy Loading

Components are loaded on-demand:

```javascript
// Only load when needed
const { SocialPanel } = await import('./js-new/components/SlidePanel.js');
```

### Bundle Size

| Module | Size (gzipped) |
|--------|---------------|
| Full UI | ~25KB |
| Components only | ~15KB |
| Utils only | ~5KB |

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## Migration Checklist

- [ ] Backup existing code
- [ ] Test with mock data first
- [ ] Verify all games launch correctly
- [ ] Check auth flow
- [ ] Test on mobile devices
- [ ] Verify accessibility
- [ ] Performance test
- [ ] User acceptance testing

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all dependencies are loaded
3. Test with `index-new-ui.html` standalone
4. Review integration bridge logs
