import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Canvas } from '@react-three/fiber';
import { AbstractBackground } from '@/components/abstract-background';

export const metadata: Metadata = {
  title: 'Arcade Gaming Hub',
  description: 'Play classic arcade games online. Snake, Pac-Man, Tetris, and more!',
  keywords: ['arcade', 'games', 'snake', 'pacman', 'tetris', 'online games'],
  authors: [{ name: 'Arcade Hub' }],
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <div className="fixed inset-0 pointer-events-none z-0">
            <Canvas>
              <AbstractBackground />
            </Canvas>
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
