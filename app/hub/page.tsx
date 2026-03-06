import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Arcade Gaming Hub',
  description: 'Play classic arcade games online',
};

export default function HomePage() {
  return (
    <div style={{ padding: 40, color: 'white' }}>
      <h1 style={{ color: '#00e5ff', fontSize: 32, marginBottom: 30 }}>
        Arcade Gaming Hub
      </h1>
      
      <Link 
        href="/hub/games"
        style={{
          display: 'inline-block',
          padding: '15px 30px',
          background: '#00e5ff',
          color: 'black',
          textDecoration: 'none',
          borderRadius: 8,
          fontWeight: 'bold',
        }}
      >
        Browse Games →
      </Link>
    </div>
  );
}
