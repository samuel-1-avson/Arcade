'use client';

import Link from 'next/link';

// Minimal game definition
const GAME = {
  id: 'neon-snake',
  name: 'Neon Snake Arena',
  description: 'A modern cyberpunk snake game.',
  difficulty: 'easy' as const,
};

export default function GamesPage() {
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Game Library</h1>
      
      {/* Simple game card */}
      <Link 
        href={`/game/${GAME.id}/`}
        style={{
          display: 'block',
          padding: '20px',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          textDecoration: 'none',
          color: 'white',
          maxWidth: '300px',
        }}
      >
        <h2 style={{ color: '#00e5ff', marginBottom: '10px' }}>{GAME.name}</h2>
        <p style={{ color: '#888', fontSize: '14px' }}>{GAME.description}</p>
        <span style={{ 
          display: 'inline-block',
          marginTop: '10px',
          padding: '4px 8px',
          background: '#00e5ff22',
          color: '#00e5ff',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          {GAME.difficulty.toUpperCase()}
        </span>
      </Link>

      {/* Direct link fallback */}
      <div style={{ marginTop: '30px' }}>
        <p style={{ color: '#666', marginBottom: '10px' }}>Or use direct link:</p>
        <a 
          href="/game/neon-snake/"
          style={{ color: '#00e5ff', textDecoration: 'underline' }}
        >
          Play Neon Snake Arena →
        </a>
      </div>
    </div>
  );
}
