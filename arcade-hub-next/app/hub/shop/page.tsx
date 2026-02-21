'use client';

import { useState } from 'react';
import { ShoppingCart, Coins, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  price: number;
  category: 'title' | 'avatar' | 'frame';
  owned: boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'title-gamer',
    name: 'Gamer',
    description: 'Show your gaming pride',
    emoji: '🎮',
    price: 100,
    category: 'title',
    owned: false,
  },
  {
    id: 'title-pro',
    name: 'Pro Player',
    description: 'For serious competitors',
    emoji: '🏆',
    price: 500,
    category: 'title',
    owned: false,
  },
  {
    id: 'title-legend',
    name: 'Legend',
    description: 'Only for the elite',
    emoji: '👑',
    price: 2000,
    category: 'title',
    owned: false,
  },
  {
    id: 'avatar-ninja',
    name: 'Ninja Avatar',
    description: 'Silent but deadly',
    emoji: '🥷',
    price: 300,
    category: 'avatar',
    owned: false,
  },
  {
    id: 'avatar-robot',
    name: 'Robot Avatar',
    description: 'Beep boop',
    emoji: '🤖',
    price: 300,
    category: 'avatar',
    owned: false,
  },
  {
    id: 'avatar-alien',
    name: 'Alien Avatar',
    description: 'Out of this world',
    emoji: '👽',
    price: 400,
    category: 'avatar',
    owned: false,
  },
  {
    id: 'frame-gold',
    name: 'Gold Frame',
    description: 'Shine bright',
    emoji: '🖼️',
    price: 1000,
    category: 'frame',
    owned: false,
  },
  {
    id: 'frame-neon',
    name: 'Neon Frame',
    description: 'Cyberpunk style',
    emoji: '🟦',
    price: 800,
    category: 'frame',
    owned: false,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'title', label: 'Titles' },
  { id: 'avatar', label: 'Avatars' },
  { id: 'frame', label: 'Frames' },
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [coins] = useState(0); // TODO: Get from user store

  const filteredItems = selectedCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.category === selectedCategory);

  const handlePurchase = (item: ShopItem) => {
    // TODO: Implement purchase logic
    console.log('Purchasing:', item.name);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Item Shop
          </h1>
          <p className="text-muted-foreground text-sm">
            Customize your profile with exclusive items
          </p>
        </div>

        {/* Coin Balance */}
        <div className="flex items-center gap-3 bg-elevated border border-white/[0.08] px-4 py-2">
          <Coins className="w-5 h-5 text-warning" />
          <div>
            <p className="font-mono font-bold text-primary">{coins.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coins</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'px-4 py-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors',
              selectedCategory === category.id
                ? 'bg-elevated border border-accent-border text-accent'
                : 'bg-transparent border border-transparent text-muted-foreground hover:text-primary'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'bg-elevated border p-4 transition-all',
              item.owned
                ? 'border-success/30 bg-success/5'
                : 'border-white/[0.06] hover:border-white/[0.12]'
            )}
          >
            {/* Emoji & Status */}
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{item.emoji}</span>
              {item.owned && (
                <div className="flex items-center gap-1 text-success text-xs">
                  <Check className="w-3 h-3" />
                  <span>Owned</span>
                </div>
              )}
            </div>

            {/* Info */}
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-primary mb-1">
              {item.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {item.description}
            </p>

            {/* Price & Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-warning" />
                <span className={cn(
                  'font-mono font-bold',
                  coins < item.price ? 'text-danger' : 'text-primary'
                )}>
                  {item.price}
                </span>
              </div>

              {item.owned ? (
                <span className="text-xs text-success uppercase tracking-wider">
                  Equipped
                </span>
              ) : (
                <Button
                  size="sm"
                  disabled={coins < item.price}
                  onClick={() => handlePurchase(item)}
                >
                  Buy
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* How to Earn */}
      <div className="bg-elevated border border-white/[0.06] p-4 mt-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-primary mb-2">
          How to Earn Coins
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-accent rounded-full" />
            Play games and achieve high scores
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-accent rounded-full" />
            Complete daily challenges
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-accent rounded-full" />
            Win tournaments
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-accent rounded-full" />
            Maintain daily streaks
          </li>
        </ul>
      </div>
    </div>
  );
}
