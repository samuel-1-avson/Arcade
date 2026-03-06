'use client';

import Link from 'next/link';

export default function GamesPage() {
  return (
    <div style={{ padding: '40px', color: 'white' }}>
      <h1 style={{ color: '#00e5ff', fontSize: '28px', marginBottom: '20px' }}>
        GAME LIBRARY - v2
      </h1>
      
      <p style={{ marginBottom: '30px', color: '#888' }}>1 game available</p>

      {/* Game Card */}
      <Link 
        href="/game/neon-snake/"
        style={{
          display: 'block',
          width: '300px',
          padding: '20px',
          background: '#1a1a1a',
          border: '2px solid #00e5ff',
          borderRadius: '8px',
          textDecoration: 'none',
          color: 'white',
        }}
      >
        <h2 style={{ color: '#00e5ff', marginBottom: '10px' }}>Neon Snake Arena</h2>
        <p style={{ fontSize: '14px', color: '#aaa' }}>
          A modern cyberpunk twist on the classic Snake game
        </p>
        <span style={{ 
          display: 'inline-block',
          marginTop: '15px',
          padding: '5px 10px',
          background: '#00e5ff33',
          color: '#00e5ff',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          EASY
        </span>
      </Link>

      {/* Direct link */}
      <div style={{ marginTop: '40px' }}>
        <a 
          href="/games/neon-snake/index.html"
          style={{ color: '#00e5ff', textDecoration: 'underline' }}
        >
          Direct Game Link →
        </a>
      </div>
    </div>
  );
}
