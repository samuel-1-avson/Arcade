# 🐍 Neon Snake Arena

A modern cyberpunk twist on the classic Snake game with neon aesthetics, power-ups, and multiple game modes.

## Features

### 🎮 Game Modes
- **Classic**: Traditional snake gameplay with walls
- **Time Attack**: 60 seconds to collect as many orbs as possible
- **Endless**: No walls - snake wraps around the screen

### ⚡ Power-ups
| Power-up | Effect | Duration |
|----------|--------|----------|
| Speed Boost | 2x movement speed | 5 seconds |
| Ghost Mode | Pass through walls | 3 seconds |
| Score Multiplier | Double points | 10 seconds |
| Shrink | Remove 5 tail segments | Instant |
| Magnet | Attract food from 5 cells | 8 seconds |

### ✨ Visual Effects
- Neon glow effects on snake and food
- Particle explosions
- Screen shake on collision
- Pulsing grid background
- Smooth animations

### 🔊 Audio
- Synthesized sound effects (Web Audio API)
- Eat sounds (different for normal/golden food)
- Power-up activation sounds
- Game over jingle
- High score celebration

## Controls

### Keyboard
- **WASD** or **Arrow Keys**: Move snake
- **P** or **ESC**: Pause game
- **R**: Restart (after game over)

### Touch/Swipe (Mobile)
- **Swipe**: Change direction
- **Tap**: Pause/resume

## Technical Details

### Architecture
```
js/
├── core/           # Game configuration and state
├── entities/       # Snake, food, power-ups, particles
├── systems/        # Input, renderer, audio
└── main.js         # Game controller
```

### Technologies
- HTML5 Canvas API
- Vanilla JavaScript (ES6+)
- Web Audio API
- CSS3 with animations

### Performance
- Object pooling for particles
- 60 FPS target
- Optimized rendering
- Responsive design

## Integration

The game integrates with the Arcade Hub via `game-bridge.js`:

```javascript
// Submit score
ArcadeHub.gameOver(score, { mode, segments, duration });

// Exit to hub
ArcadeHub.exitGame();
```

## Development

### Local Development
1. Open `index.html` in a browser
2. Or serve via local server: `npx serve .`

### Adding Features
1. Update `js/core/config.js` for new constants
2. Add logic in appropriate entity/system files
3. Update rendering in `js/systems/renderer.js`

## Credits

- **Font**: Orbitron (Google Fonts)
- **Color Scheme**: Cyberpunk Neon
- **Built for**: Arcade Gaming Hub

## License

MIT - Part of the Arcade Gaming Hub project
