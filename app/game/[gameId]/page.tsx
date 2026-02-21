import { Metadata } from 'next';
import { GameClient } from './game-client';

// Generate static params for all games
export function generateStaticParams() {
  return [
    { gameId: 'snake' },
    { gameId: 'pacman' },
    { gameId: 'tetris' },
    { gameId: 'breakout' },
    { gameId: 'asteroids' },
    { gameId: 'minesweeper' },
    { gameId: '2048' },
    { gameId: 'tictactoe' },
    { gameId: 'rhythm' },
    { gameId: 'roguelike' },
    { gameId: 'toonshooter' },
    { gameId: 'tower-defense' },
  ];
}

export const metadata: Metadata = {
  title: 'Play Game | Arcade Hub',
};

export default function GamePage({ params }: { params: { gameId: string } }) {
  return <GameClient gameId={params.gameId} />;
}
