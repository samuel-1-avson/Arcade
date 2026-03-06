import { Metadata } from 'next';
import { QuickStats } from '@/components/dashboard/quick-stats';
import { HeroSection } from '@/components/hero/hero-section';
import { GameGrid } from '@/components/game/game-grid';

export const metadata: Metadata = {
  title: 'Arcade Gaming Hub',
  description: 'Play classic arcade games online',
};

export default function HubPage() {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <QuickStats />
      
      {/* Hero Section - Featured Games */}
      <HeroSection />
      
      {/* Games Grid */}
      <GameGrid />
    </div>
  );
}
