import React from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Medal, Crown, Star, Target, Zap,
    Gamepad2, Sparkles, Gem, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Achievement, UserAchievement } from '@/lib/firebase/services/achievements';

// Map icon strings to actual lucide-react components
const iconMap: Record<string, React.ElementType> = {
    'Trophy': Trophy,
    'Medal': Medal,
    'Crown': Crown,
    'Star': Star,
    'Target': Target,
    'Zap': Zap,
    'Gamepad2': Gamepad2,
    'Sparkles': Sparkles,
    'Gem': Gem,
    'Award': Award,
};

const rarityColors = {
    common: 'from-zinc-400 to-zinc-500 border-zinc-500/30 text-zinc-300',
    rare: 'from-blue-400 to-blue-600 border-blue-500/30 text-blue-200',
    epic: 'from-purple-400 to-purple-600 border-purple-500/30 text-purple-200',
    legendary: 'from-amber-400 to-orange-600 border-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]',
};

const bgColors = {
    common: 'bg-zinc-500/10',
    rare: 'bg-blue-500/10',
    epic: 'bg-purple-500/10',
    legendary: 'bg-amber-500/10',
};

interface AchievementsGalleryProps {
    achievements: Achievement[];
    userProgress: UserAchievement[];
    isLoading?: boolean;
}

export function AchievementsGallery({ achievements, userProgress, isLoading = false }: AchievementsGalleryProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/[0.02] border border-white/[0.05] rounded-xl" />
                ))}
            </div>
        );
    }

    // Create a map of user progress for O(1) lookups
    const progressMap = new Map(userProgress.map(p => [p.achievementId, p]));

    // Sort achievements: unlocked first (legendary -> common), then locked (by progress desc)
    const sortedAchievements = [...achievements].sort((a, b) => {
        const pA = progressMap.get(a.id);
        const pB = progressMap.get(b.id);

        const isUnlockedA = pA?.unlocked || false;
        const isUnlockedB = pB?.unlocked || false;

        if (isUnlockedA && !isUnlockedB) return -1;
        if (!isUnlockedA && isUnlockedB) return 1;

        if (isUnlockedA && isUnlockedB) {
            // Both unlocked, sort by rarity
            const rarities = ['legendary', 'epic', 'rare', 'common'];
            return rarities.indexOf(a.rarity) - rarities.indexOf(b.rarity);
        }

        // Both locked, sort by progress percentage
        const progA = ((pA?.progress || 0) / a.maxProgress) * 100;
        const progB = ((pB?.progress || 0) / b.maxProgress) * 100;

        return progB - progA;
    });

    const UnlockedCount = Array.from(progressMap.values()).filter(p => p.unlocked).length;

    return (
        <section className="bg-elevated border border-white/[0.06] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                <div>
                    <h2 className="font-display text-lg font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-accent" />
                        Achievement Badges
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Displaying your collected accolades
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-accent">
                        {UnlockedCount} <span className="text-muted-foreground text-sm font-sans font-normal">/ {achievements.length}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Unlocked</div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedAchievements.map((achievement, index) => {
                        const progress = progressMap.get(achievement.id);
                        const isUnlocked = progress?.unlocked || false;
                        const currentProgress = progress?.progress || 0;
                        const progressPercent = Math.min(100, Math.round((currentProgress / achievement.maxProgress) * 100));

                        const IconComponent = iconMap[achievement.icon] || Trophy;

                        return (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className={cn(
                                    "relative group overflow-hidden border p-4 flex flex-col items-center text-center transition-all duration-300",
                                    isUnlocked
                                        ? `bg-surface border-white/[0.1] hover:border-white/[0.2] hover:-translate-y-1 ${bgColors[achievement.rarity]}`
                                        : "bg-surface/50 border-white/[0.02] opacity-70 hover:opacity-100 grayscale hover:grayscale-0"
                                )}
                            >
                                {/* Background Rarity Glow */}
                                {isUnlocked && (
                                    <div className={cn(
                                        "absolute inset-0 bg-gradient-to-br opacity-5",
                                        rarityColors[achievement.rarity].split(' ')[0] // Get just the 'from-X' class
                                    )} />
                                )}

                                {/* Badge Icon */}
                                <div className={cn(
                                    "w-16 h-16 rounded-full mb-3 flex items-center justify-center border relative z-10 transition-transform duration-500 group-hover:scale-110",
                                    isUnlocked ? rarityColors[achievement.rarity] : "border-white/10 bg-white/5 text-muted-foreground",
                                    isUnlocked ? "bg-gradient-to-br" : ""
                                )}>
                                    <IconComponent className={cn("w-8 h-8", isUnlocked ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" : "")} />
                                </div>

                                {/* Info */}
                                <h3 className="font-display text-sm font-bold text-primary mb-1 line-clamp-1 relative z-10">
                                    {achievement.name}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 h-8 relative z-10">
                                    {achievement.description}
                                </p>

                                {/* Rarity & Rewards (Unlocked only) */}
                                {isUnlocked ? (
                                    <div className="mt-3 flex gap-2 text-[10px] font-bold uppercase tracking-wider relative z-10">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-sm border",
                                            rarityColors[achievement.rarity]
                                        )}>
                                            {achievement.rarity}
                                        </span>
                                    </div>
                                ) : (
                                    /* Progress Bar (Locked only) */
                                    <div className="w-full mt-3 relative z-10">
                                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                            <span>{currentProgress}</span>
                                            <span>{achievement.maxProgress}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 overflow-hidden rounded-full">
                                            <div
                                                className="h-full bg-accent/50 transition-all duration-1000 ease-out"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Timestamp tooltip equivalent */}
                                {isUnlocked && progress?.unlockedAt && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] text-muted-foreground">
                                            {progress.unlockedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
