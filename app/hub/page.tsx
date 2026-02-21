import { Metadata } from 'next';
import { HeroSection } from '@/components/hero/hero-section';
import { QuickStats } from '@/components/dashboard/quick-stats';
import { GameGrid } from '@/components/game/game-grid';

export const metadata: Metadata = {
  title: 'Arcade Gaming Hub',
  description: 'Play classic arcade games online',
};

export default function HomePage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <HeroSection />
      <QuickStats />
      <GameGrid />
    </div>
  );
}
