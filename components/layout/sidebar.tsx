'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, Trophy, Target, BarChart3, Award, 
  ShoppingCart, Settings, Gamepad2, Users
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/hub/' },
  { icon: Trophy, label: 'Tournaments', href: '/hub/tournaments/' },
  { icon: Target, label: 'Challenges', href: '/hub/challenges/' },
  { icon: BarChart3, label: 'Leaderboard', href: '/hub/leaderboard/' },
  { icon: Award, label: 'Achievements', href: '/hub/achievements/' },
  { icon: Users, label: 'Friends', href: '/hub/friends/' },
];

const secondaryNavItems = [
  { icon: ShoppingCart, label: 'Shop', href: '/hub/shop/' },
  { icon: Settings, label: 'Settings', href: '/hub/settings/' },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-surface border-r border-accent/[0.08] z-50',
        'transition-all duration-300 ease-out',
        isExpanded ? 'w-[200px]' : 'w-16'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-white/[0.05]">
        <div className="w-8 h-8 bg-elevated border border-white/[0.08] flex items-center justify-center flex-shrink-0">
          <Gamepad2 className="w-5 h-5 text-accent" />
        </div>
        <h1 
          className={cn(
            'font-display text-sm font-bold uppercase tracking-wide text-primary whitespace-nowrap overflow-hidden',
            'transition-all duration-200',
            isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          )}
        >
          Arcade Hub
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
            isExpanded={isExpanded}
          />
        ))}
        
        <div className="flex-1 min-h-[100px]" />
        
        {secondaryNavItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
            isExpanded={isExpanded}
          />
        ))}
      </nav>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
  isExpanded: boolean;
}

function NavItem({ icon: Icon, label, href, isActive, isExpanded }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-200 relative group',
        'hover:bg-elevated hover:text-primary',
        isActive 
          ? 'bg-elevated border-l-2 border-accent text-accent' 
          : 'text-muted-foreground border-l-2 border-transparent'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span 
        className={cn(
          'whitespace-nowrap overflow-hidden transition-all duration-200',
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'
        )}
      >
        {label}
      </span>
      
      {/* Tooltip for collapsed state */}
      {!isExpanded && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-elevated border border-white/[0.1] text-xs text-primary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 rounded">
          {label}
        </span>
      )}
    </Link>
  );
}
