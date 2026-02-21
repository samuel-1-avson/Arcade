'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Coins, Check, UserCircle, Bot, Palette, Star, Flame, Crown, Zap, Clover, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { shopService, ShopItem, UserInventory } from '@/lib/firebase/services/shop';
import { userStatsService, UserStats } from '@/lib/firebase/services/user-stats';

const iconMap: Record<string, React.ElementType> = {
  UserCircle,
  Bot,
  Palette,
  Star,
  Flame,
  Crown,
  Zap,
  Clover,
};

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'avatar', label: 'Avatars' },
  { id: 'theme', label: 'Themes' },
  { id: 'badge', label: 'Badges' },
  { id: 'powerup', label: 'Power-ups' },
];

const rarityStyles = {
  common: 'border-white/[0.08]',
  rare: 'border-accent-border',
  epic: 'border-violet/30',
  legendary: 'border-warning/30',
};

const rarityText = {
  common: 'text-muted-foreground',
  rare: 'text-accent',
  epic: 'text-violet',
  legendary: 'text-warning',
};

export default function ShopPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<UserInventory>({ items: [], equipped: {} });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const loadShopData = async () => {
      setIsLoading(true);
      try {
        // Load shop items
        const shopItems = await shopService.getShopItems();
        setItems(shopItems);

        if (user) {
          // Load user's inventory
          const userInventory = await shopService.getUserInventory(user.id);
          setInventory(userInventory);

          // Load user's coin balance
          const stats = await userStatsService.getUserStats(user.id);
          setUserStats(stats);
        }
      } catch (error) {
        // Error loading shop data - handled by UI
      } finally {
        setIsLoading(false);
      }
    };

    loadShopData();
  }, [user]);

  const handlePurchase = async (item: ShopItem) => {
    if (!user) return;

    setPurchasing(item.id);
    try {
      const result = await shopService.purchaseItem(user.id, item.id);
      if (result.success) {
        // Update local state
        setInventory(prev => ({
          ...prev,
          items: [...prev.items, item.id],
        }));
        
        // Update coin balance
        setUserStats(prev => prev ? {
          ...prev,
          coins: prev.coins - item.price,
        } : null);
      } else {
        alert(result.error || 'Purchase failed');
      }
    } catch (error) {
      // Error purchasing item - handled by UI
    } finally {
      setPurchasing(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    if (!user) return;

    try {
      const result = await shopService.equipItem(user.id, item.id);
      if (result.success) {
        setInventory(prev => ({
          ...prev,
          equipped: {
            ...prev.equipped,
            [item.category]: item.id,
          },
        }));
      }
    } catch (error) {
      // Error equipping item - handled by UI
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  const coins = userStats?.coins || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary">
          Item Shop
        </h1>
        <div className="p-8 text-center text-muted-foreground">
          Loading shop...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Item Shop
          </h1>
          <p className="text-muted-foreground text-sm">
            {user ? 'Customize your profile with exclusive items' : 'Sign in to purchase items'}
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
        {filteredItems.map((item) => {
          const ItemIcon = iconMap[item.icon] || UserCircle;
          const isOwned = inventory.items.includes(item.id);
          const isEquipped = inventory.equipped[item.category] === item.id;
          const canAfford = coins >= item.price;

          return (
            <div
              key={item.id}
              className={cn(
                'bg-elevated border p-4 transition-all',
                isEquipped
                  ? 'border-success/30 bg-success/5'
                  : isOwned
                    ? 'border-accent/30'
                    : rarityStyles[item.rarity]
              )}
            >
              {/* Icon & Status */}
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "w-16 h-16 border flex items-center justify-center",
                  isEquipped ? "bg-success/10 border-success/30" : "bg-surface border-white/[0.08]"
                )}>
                  <ItemIcon className={cn(
                    "w-8 h-8",
                    isEquipped ? "text-success" : rarityText[item.rarity]
                  )} />
                </div>
                <div className="text-right">
                  {isEquipped && (
                    <div className="flex items-center gap-1 text-success text-xs">
                      <Check className="w-3 h-3" />
                      <span>Equipped</span>
                    </div>
                  )}
                  {!isEquipped && isOwned && (
                    <span className="text-xs text-accent uppercase tracking-wider">
                      Owned
                    </span>
                  )}
                  <span className={cn('text-[10px] uppercase tracking-wider block mt-1', rarityText[item.rarity])}>
                    {item.rarity}
                  </span>
                </div>
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
                {isOwned ? (
                  isEquipped ? (
                    <span className="text-xs text-success uppercase tracking-wider">
                      Active
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEquip(item)}
                    >
                      Equip
                    </Button>
                  )
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-warning" />
                      <span className={cn(
                        'font-mono font-bold',
                        !canAfford ? 'text-danger' : 'text-primary'
                      )}>
                        {item.price}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      disabled={!user || !canAfford || purchasing === item.id}
                      onClick={() => handlePurchase(item)}
                    >
                      {purchasing === item.id ? '...' : 'Buy'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
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
            Level up your profile
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-accent rounded-full" />
            Unlock achievements
          </li>
        </ul>
      </div>
    </div>
  );
}
