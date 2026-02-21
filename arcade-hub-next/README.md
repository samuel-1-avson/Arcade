# Arcade Gaming Hub - Next.js

A modern React + Next.js + TypeScript rebuild of the Arcade Gaming Hub.

## 🎮 Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Firebase** for authentication and data
- **Framer Motion** for animations
- **Retro arcade aesthetic** with scanlines and neon accents

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd arcade-hub-next
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Build for Production

```bash
npm run build
```

The static output will be in the `dist/` directory.

## 📁 Project Structure

```
app/                    # Next.js app router
├── hub/               # Hub pages (home, games, leaderboard, etc.)
├── game/[gameId]/     # Game launcher
├── layout.tsx         # Root layout
└── globals.css        # Global styles

components/
├── ui/                # UI components (Button, Modal, etc.)
├── layout/            # Layout components (Sidebar, Header)
├── game/              # Game-related components
├── features/          # Feature components (Auth, CommandPalette)
└── providers.tsx      # App providers

lib/
├── store/             # Zustand stores
├── firebase/          # Firebase configuration
└── utils.ts           # Utility functions

hooks/                 # Custom React hooks

types/                 # TypeScript types

public/games/          # Game files (HTML/CSS/JS)
```

## 🎨 Design System

- **Primary Color**: Cyan (#00e5ff)
- **Background**: Black (#000000)
- **Surface**: Dark gray (#0a0a0a)
- **Font Display**: Orbitron
- **Font Body**: Space Mono

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Google and Anonymous)
3. Create a Firestore database
4. Copy your Firebase config to `.env.local`

### Adding New Games

1. Copy game files to `public/games/[game-name]/`
2. Add game to `hooks/useGames.ts`
3. Ensure game uses postMessage for score submission:

```javascript
// In your game
window.parent.postMessage({ type: 'GAME_SCORE', score: 1000 }, '*');
window.parent.postMessage({ type: 'GAME_EXIT' }, '*');
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase analytics ID (optional) |

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Static Hosting

```bash
npm run build
# Deploy dist/ folder to any static host
```

## 🐛 Troubleshooting

### Games not loading
- Check that game files are in `public/games/`
- Ensure games use correct paths
- Check browser console for errors

### Firebase auth not working
- Verify environment variables are set
- Check Firebase console for authorized domains
- Enable Anonymous and Google sign-in methods

### Styling issues
- Ensure Tailwind CSS is compiled
- Check for CSS conflicts
- Verify fonts are loading

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.
