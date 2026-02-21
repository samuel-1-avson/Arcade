import { Metadata } from 'next';
import { GameClient } from './game-client';

// Generate static params for all games
export function generateStaticParams() {
  return [
    // Games will be added here
  ];
}

export const metadata: Metadata = {
  title: 'Play Game | Arcade Hub',
};

export default function GamePage({ params }: { params: { gameId: string } }) {
  return <GameClient gameId={params.gameId} />;
}
