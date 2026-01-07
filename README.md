# 🎮 Arcade Gaming Hub

> A retro-futuristic arcade experience built with modern web technologies.

![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 📖 Overview

**Arcade Gaming Hub** is a Single Page Application (SPA) that brings the nostalgia of classic arcade gaming into a modern, sleek web environment. Designed with a "Retro-Futuristic" aesthetic, it features a collection of 13+ fully playable games, a robust user progression system, real-time social features, and a high-performance engine.

Whether you're looking to challenge your reflexes in *Snake 3D*, strategize in *Tower Defense*, or relax in *Zen Mode*, the Arcade Hub provides a seamless and immersive experience across desktop and mobile devices.

---

## ✨ Key Features

### 🕹️ Game Experience
-   **Diverse Library**: A curated collection of classic and modern games.
-   **Instant Play**: Zero load times between games thanks to SPA architecture.
-   **Responsive Design**: Optimized controls for both Keyboard/Mouse and Touch interfaces.
-   **Zen Mode**: A distraction-free mode for relaxed gameplay.

### 👤 User Progression
-   **Profile System**: Custom avatars, titles, and XP-based leveling.
-   **Global Leaderboards**: Real-time ranking against players worldwide.
-   **Achievements**: Unlockable badges and rewards for mastering specific challenges.
-   **Stats Tracking**: Comprehensive tracking of play time, games played, and high scores.

### 🌐 Social & Online
-   **Authentication**: Seamless Google Sign-In and Guest mode support.
-   **Party System**: Real-time chat and lobby system for grouping up with friends.
-   **Tournaments**: Create and join bracket-style tournaments (4, 8, or 16 players).
-   **Live Events**: Time-limited challenges and global community events.

### 🛠️ Technical
-   **PWA Support**: Installable on mobile and desktop for a native app-like experience.
-   **Offline Capable**: Service Worker integration for offline asset caching.
-   **Cloud Sync**: Real-time data synchronization using Firebase Firestore.

---

## 🎮 Game Library

| Game | Genre | Description |
|------|-------|-------------|
| **🐍 Snake** | Classic | Eat food, grow longer, and avoid collisions. Includes a modern 3D mode. |
| **👻 Pac-Man** | Arcade | Navigate mazes, eat pellets, and avoid the ghosts. |
| **☄️ Asteroids** | Shooter | Survive in deep space by blasting asteroids and UFOs. |
| **🧱 Breakout** | Arcade | Smash bricks with a bouncing ball and paddle. |
| **🧩 Tetris** | Puzzle | Stack falling blocks to clear lines. |
| **💣 Minesweeper** | Logic | Clear the minefield without detonating any hidden mines. |
| **🏰 Tower Defense** | Strategy | Build defenses to stop waves of incoming enemies. |
| **🏃 Platformer** | Action | Jump, run, and collect items in this side-scrolling adventure. |
| **🎵 Rhythm** | Music | Hit notes in time with the beat. |
| **⚔️ Roguelike** | RPG | Explore dungeons, fight monsters, and collect loot. |
| **👽 Space Invaders** | Shooter | Defend Earth from waves of alien invaders. |
| **🔫 Toon Shooter** | FPS | A 3D shooter set in a cartoon arena. |
| **🔢 2048** | Puzzle | Combine tiles to reach the 2048 tile. |

---

## 💻 Tech Stack

### Frontend
-   **Core**: Vanilla JavaScript (ES Modules), HTML5, CSS3.
-   **Architecture**: Custom SPA framework (Router, EventBus, Component system).
-   **Styling**: Native CSS Variables, Flexbox, Grid, Glassmorphism effects.
-   **3D Graphics**: [Three.js](https://threejs.org/) (v0.182.0) for Toon Shooter and 3D elements.
-   **Audio**: Web Audio API for immersive soundscapes.

### Backend & Services
-   **Authentication**: Firebase Authentication (Google Provider).
-   **Database**: Firebase Firestore (NoSQL) & Realtime Database.
-   **Hosting**: Vercel / Firebase Hosting.
-   **Serverless**: Firebase Cloud Functions.

### Development Tools
-   **Linter**: ESLint.
-   **Formatter**: Prettier.
-   **Local Server**: `serve` package.

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
-   **Node.js**: v18.0.0 or higher.
-   **npm**: v9.0.0 or higher.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/arcade-hub.git
    cd arcade-hub
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    -   Ensure you have a `firebase.json` configured if deploying to Firebase.
    -   Local development typically does not require complex env setup for the frontend-only features, but Firebase features require a valid configuration object in `js/config/firebase-config.js` (or similar).

### Running Locally

To start the development server:

```bash
npm run dev
```

This will launch a local server (usually at `http://localhost:3000` or `http://localhost:5000`).

---

## 📂 Project Structure

```
arcade-hub/
├── 📁 css/                 # Global styles and themes
│   ├── hub.css            # Main Hub UI styles
│   ├── style.css          # Base styles and variables
│   └── ...
├── 📁 games/               # Game modules
│   ├── 📁 snake/          # Snake game source
│   ├── 📁 pacman/         # Pac-Man game source
│   └── ...
├── 📁 js/                  # Core application logic
│   ├── 📁 components/     # Reusable UI components
│   ├── 📁 engine/         # Core engines (EventBus, Storage, Sync)
│   ├── 📁 services/       # Business logic (Auth, Chat, Friends)
│   └── app.js             # Main entry point
├── 📁 docs/                # Documentation
├── 📄 index.html           # Main entry HTML file
├── 📄 package.json         # Project metadata and scripts
├── 📄 sw.js                # Service Worker for PWA
└── 📄 vercel.json          # Vercel deployment config
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

Please ensure your code follows the existing style guidelines and passes the linter.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<center>Built with ❤️ by Antigravity</center>
