import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils';
import { GameCard } from '@/components/game/game-card';
import { Game } from '@/types/game';

describe('GameCard', () => {
  const mockGame: Game = {
    id: 'snake',
    name: 'Snake',
    description: 'Classic snake game where you eat food and grow longer',
    icon: 'Gamepad2',
    difficulty: 'easy',
    category: 'arcade',
    path: '/games/snake/',
    highScore: 1500,
    lastPlayed: new Date(),
  };

  it('should render game information correctly', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('Snake')).toBeInTheDocument();
    expect(screen.getByText(/classic snake game/i)).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('should display high score when available', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('should show dash when no high score', () => {
    const gameWithoutScore = { ...mockGame, highScore: undefined };
    render(<GameCard game={gameWithoutScore} />);
    
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should apply correct difficulty styling', () => {
    const { rerender } = render(<GameCard game={mockGame} />);
    const easyBadge = screen.getByText('Easy');
    expect(easyBadge).toHaveClass('text-success');
    
    const mediumGame = { ...mockGame, difficulty: 'medium' as const };
    rerender(<GameCard game={mediumGame} />);
    const mediumBadge = screen.getByText('Medium');
    expect(mediumBadge).toHaveClass('text-warning');
    
    const hardGame = { ...mockGame, difficulty: 'hard' as const };
    rerender(<GameCard game={hardGame} />);
    const hardBadge = screen.getByText('Hard');
    expect(hardBadge).toHaveClass('text-danger');
  });

  it('should apply custom className', () => {
    render(<GameCard game={mockGame} className="custom-class" />);
    
    expect(screen.getByRole('link').firstChild).toHaveClass('custom-class');
  });
});
