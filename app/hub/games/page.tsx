'use client';

import Link from 'next/link';

export default function GamesPage() {
  return (
    <div style={{ padding: 40, color: 'white' }}>
      <h1 style={{ color: '#00e5ff', fontSize: 28, marginBottom: 20 }}>
        GAME LIBRARY
      </h1>
      
      <Link 
        href="/game/neon-snake"
        style={{
          display: 'block',
          width: 300,
          padding: 20,
          background: '#1a1a1a',
          border: '2px solid #00e5ff',
          borderRadius: 8,
          textDecoration: 'none',
          color: 'white',
        }}
      >
        <h2 style={{ color: '#00e5ff' }}>Neon Snake Arena</h2>
        <p style={{ fontSize: 14, color: '#aaa', marginTop: 10 }}>
          A modern cyberpunk snake game
        </p>
        <span style={{ 
          display: 'inline-block',
          marginTop: 15,
          padding: '5px 10px',
          background: '#00e5ff33',
          color: '#00e5ff',
          borderRadius: 4,
          fontSize: 12,
        }}>
          EASY
        </span>
      </Link>
    </div>
  );
}
