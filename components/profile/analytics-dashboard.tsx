import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { Activity, TrendingUp, Target, Gamepad2 } from 'lucide-react';

interface ScoreDoc {
    gameId: string;
    score: number;
    timestamp: Date;
}

interface AnalyticsDashboardProps {
    userId: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899'];

// Helper to format game IDs beautifully (e.g., 'snake' -> 'Snake')
const formatGameName = (id: string) => {
    return id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ');
};

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
    const [scores, setScores] = useState<ScoreDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentScores = async () => {
            try {
                const db = await getFirebaseDb();
                if (!db) return;

                const scoresRef = collection(db, 'scores');
                const q = query(
                    scoresRef,
                    where('userId', '==', userId),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    gameId: doc.data().gameId,
                    score: doc.data().score,
                    timestamp: doc.data().timestamp?.toDate?.() || new Date(),
                })).reverse(); // Reverse so chronological order for line chart

                setScores(data);
            } catch (error) {
                // Fallback or ignore
            } finally {
                setLoading(false);
            }
        };

        fetchRecentScores();
    }, [userId]);

    if (loading) {
        return (
            <section className="bg-elevated border border-white/[0.06] p-8 mt-6">
                <div className="animate-pulse h-6 w-48 bg-white/10 mb-6 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-white/5 rounded-xl border border-white/[0.05]" />
                    <div className="h-64 bg-white/5 rounded-xl border border-white/[0.05]" />
                </div>
            </section>
        );
    }

    if (scores.length === 0) {
        return (
            <section className="bg-elevated border border-white/[0.06] mt-6">
                <div className="px-4 py-3 border-b border-white/[0.05]">
                    <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Player Analytics
                    </h2>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No analytics data yet</p>
                    <p className="text-xs mt-1">Play some games to generate your dashboard!</p>
                </div>
            </section>
        );
    }

    // --- Process Data for Charts ---

    // 1. Score Trend (Timeline line chart)
    const trendData = scores.map(s => ({
        date: s.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: s.score,
        game: formatGameName(s.gameId),
    }));

    // 2. Game Distribution (Pie chart)
    const gameCounts: Record<string, number> = {};
    scores.forEach(s => {
        gameCounts[s.gameId] = (gameCounts[s.gameId] || 0) + 1;
    });

    const distributionData = Object.entries(gameCounts)
        .map(([gameId, count]) => ({
            name: formatGameName(gameId),
            value: count,
        }))
        .sort((a, b) => b.value - a.value);

    const topGame = distributionData[0]?.name || 'Unknown';
    const highestRecentScore = Math.max(...scores.map(s => s.score));

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-elevated border border-white/[0.06] mt-6 overflow-hidden"
        >
            <div className="px-6 py-4 border-b border-white/[0.05] flex justify-between items-center">
                <div>
                    <h2 className="font-display text-lg font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent" />
                        Player Analytics
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Based on your last {scores.length} game sessions
                    </p>
                </div>

                {/* Highlights */}
                <div className="hidden sm:flex gap-6 text-right">
                    <div>
                        <div className="text-sm font-bold text-primary">{topGame}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-end gap-1">
                            <Gamepad2 className="w-3 h-3" /> Most Played
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-mono font-bold text-warning">{highestRecentScore.toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" /> Peak Score
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.05]">
                {/* Trend Chart */}
                <div className="p-6 bg-surface/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Score Progression
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="date"
                                    stroke="#ffffff20"
                                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#ffffff20"
                                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontFamily: 'monospace'
                                    }}
                                    itemStyle={{ color: '#a78bfa' }}
                                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    name="Score"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#18181b', strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: '#a78bfa', stroke: '#18181b' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="p-6 bg-surface/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Games Played Distribution
                    </h3>
                    <div className="h-64 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#a1a1aa' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Custom Legend */}
                        <div className="w-32 flex flex-col gap-2">
                            {distributionData.slice(0, 5).map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-xs">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-muted-foreground flex-1 truncate">{entry.name}</span>
                                    <span className="font-mono font-bold text-primary">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
