/**
 * Breakout Game - Brick Types System
 * Defines different brick types with unique behaviors and properties
 */

// Simple text symbols for canvas rendering (SVG cannot be drawn with fillText)
const BRICK_SYMBOLS = {
    EXPLOSION: '💥',
    STAR: '★',
    SKULL: '☠',
    REFRESH: '↻'
};

// Brick type definitions
export const BRICK_TYPES = {
    NORMAL: {
        id: 'normal',
        name: 'Normal',
        hits: 1,
        points: 10,
        color: null, // Uses row color
        canDrop: true,
        description: 'Standard brick'
    },
    STRONG: {
        id: 'strong',
        name: 'Strong',
        hits: 2,
        points: 25,
        colors: ['#8888ff', '#4444aa'], // Changes color as damaged
        canDrop: true,
        description: 'Takes 2 hits to break'
    },
    REINFORCED: {
        id: 'reinforced',
        name: 'Reinforced',
        hits: 3,
        points: 50,
        colors: ['#ffcc00', '#cc9900', '#996600'],
        canDrop: true,
        description: 'Takes 3 hits to break'
    },
    EXPLOSIVE: {
        id: 'explosive',
        name: 'Explosive',
        hits: 1,
        points: 15,
        color: '#ff4400',
        symbol: BRICK_SYMBOLS.EXPLOSION,
        canDrop: true,
        explosionRadius: 1, // Destroys adjacent bricks
        description: 'Explodes and damages nearby bricks'
    },
    MOVING: {
        id: 'moving',
        name: 'Moving',
        hits: 1,
        points: 20,
        color: '#00ffaa',
        canDrop: true,
        speed: 30, // pixels per second
        description: 'Moves horizontally'
    },
    GOLD: {
        id: 'gold',
        name: 'Gold',
        hits: 1,
        points: 100,
        color: '#ffd700',
        symbol: BRICK_SYMBOLS.STAR,
        canDrop: true,
        guaranteedPowerup: true,
        description: 'Bonus points and guaranteed power-up'
    },
    INDESTRUCTIBLE: {
        id: 'indestructible',
        name: 'Indestructible',
        hits: Infinity,
        points: 0,
        color: '#444444',
        canDrop: false,
        description: 'Cannot be destroyed'
    },
    ICE: {
        id: 'ice',
        name: 'Ice',
        hits: 1,
        points: 15,
        color: '#88ddff',
        canDrop: true,
        slowsball: true,
        slowDuration: 3,
        description: 'Slows ball on contact'
    },
    REGENERATING: {
        id: 'regenerating',
        name: 'Regenerating',
        hits: 1,
        points: 12,
        color: '#88ff88',
        symbol: BRICK_SYMBOLS.REFRESH,
        canDrop: true,
        regenTime: 10000, // ms until respawn
        description: 'Respawns after 10 seconds'
    },
    GHOST: {
        id: 'ghost',
        name: 'Ghost',
        hits: 1,
        points: 20,
        color: 'rgba(200, 200, 255, 0.5)',
        canDrop: true,
        phasing: true, // Appears and disappears
        phaseInterval: 2000,
        description: 'Phases in and out of existence'
    },
    BOMB: {
        id: 'bomb',
        name: 'Bomb',
        hits: 1,
        points: -50, // Penalty
        color: '#000000',
        symbol: BRICK_SYMBOLS.SKULL,
        canDrop: false,
        dangerous: true, // Costs a life if hit
        description: 'Avoid! Costs a life if hit'
    },
    RAINBOW: {
        id: 'rainbow',
        name: 'Rainbow',
        hits: 1,
        points: 30,
        canDrop: true,
        rainbow: true, // Cycles through colors
        description: 'Bonus points, cycles colors'
    }
};

// Row colors for normal bricks (calm muted palette)
export const ROW_COLORS = [
    '#c47272', // Row 1 - Muted Rose
    '#c9a857', // Row 2 - Muted Gold  
    '#7dba84', // Row 3 - Muted Green
    '#6b8aad', // Row 4 - Muted Blue
    '#9b7cc4', // Row 5 - Muted Purple
    '#7ab8b8', // Row 6 - Muted Teal
    '#b8937a', // Row 7 - Muted Tan
    '#8a9eb8'  // Row 8 - Muted Slate
];

// World-specific brick themes (muted versions)
export const WORLD_BRICK_THEMES = {
    neon: {
        colors: ROW_COLORS,
        glow: true,
        glowIntensity: 4
    },
    ice: {
        colors: ['#a8c8d8', '#8fb8cc', '#75a8c0', '#5c98b4', '#4288a8', '#28789c'],
        glow: true,
        glowIntensity: 3,
        glowColor: '#6b8aad'
    },
    volcano: {
        colors: ['#c47272', '#c48a72', '#c9a857', '#c9b678', '#d4c898', '#e0dab8'],
        glow: true,
        glowIntensity: 4,
        glowColor: '#c47272'
    },
    space: {
        colors: ['#7a68a8', '#8a78b8', '#9b88c8', '#ab98d8', '#bba8e8', '#ccb8f8'],
        glow: true,
        glowIntensity: 5,
        glowColor: '#9b7cc4'
    },
    void: {
        colors: ['#3a3a42', '#4a4a52', '#5a5a62', '#6a6a72', '#7a7a82', '#8a8a92'],
        glow: true,
        glowIntensity: 2,
        glowColor: '#9aa0a6'
    }
};

/**
 * Brick class - represents a single brick in the game
 */
export class Brick {
    constructor(x, y, width, height, type = 'NORMAL', rowIndex = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = BRICK_TYPES[type] || BRICK_TYPES.NORMAL;
        this.typeId = type;
        this.rowIndex = rowIndex;
        
        // State
        this.hits = this.type.hits;
        this.maxHits = this.type.hits;
        this.alive = true;
        this.points = this.type.points;
        
        // Movement (for moving bricks)
        this.direction = 1;
        this.baseX = x;
        this.moveRange = 40;
        
        // Phasing (for ghost bricks)
        this.visible = true;
        this.phaseTimer = 0;
        
        // Regeneration
        this.regenTimer = 0;
        this.wasDestroyed = false;
        
        // Rainbow effect
        this.rainbowHue = 0;
        
        // Set color
        this.updateColor();
    }
    
    updateColor() {
        if (this.type.rainbow) {
            // Rainbow uses HSL
            this.color = `hsl(${this.rainbowHue}, 100%, 50%)`;
        } else if (this.type.colors) {
            // Multi-hit bricks change color
            const colorIndex = this.maxHits - this.hits;
            this.color = this.type.colors[Math.min(colorIndex, this.type.colors.length - 1)];
        } else if (this.type.color) {
            this.color = this.type.color;
        } else {
            // Use row color
            this.color = ROW_COLORS[this.rowIndex % ROW_COLORS.length];
        }
    }
    
    update(dt, bounds) {
        if (!this.alive) {
            // Handle regeneration
            if (this.wasDestroyed && this.type.regenTime) {
                this.regenTimer += dt * 1000;
                if (this.regenTimer >= this.type.regenTime) {
                    this.resurrect();
                }
            }
            return;
        }
        
        // Moving brick logic
        if (this.type.id === 'moving') {
            this.x += this.type.speed * this.direction * dt;
            
            // Bounce at edges
            if (this.x < this.baseX - this.moveRange) {
                this.x = this.baseX - this.moveRange;
                this.direction = 1;
            } else if (this.x > this.baseX + this.moveRange) {
                this.x = this.baseX + this.moveRange;
                this.direction = -1;
            }
        }
        
        // Ghost brick phasing
        if (this.type.phasing) {
            this.phaseTimer += dt * 1000;
            if (this.phaseTimer >= this.type.phaseInterval) {
                this.phaseTimer = 0;
                this.visible = !this.visible;
            }
        }
        
        // Rainbow color cycling
        if (this.type.rainbow) {
            this.rainbowHue = (this.rainbowHue + 120 * dt) % 360;
            this.updateColor();
        }
    }
    
    hit() {
        if (!this.alive || !this.visible) return null;
        if (this.type.id === 'indestructible') return { bounced: true, destroyed: false };
        
        this.hits--;
        this.updateColor();
        
        if (this.hits <= 0) {
            return this.destroy();
        }
        
        return { bounced: true, destroyed: false, brick: this };
    }
    
    destroy() {
        this.alive = false;
        this.wasDestroyed = true;
        this.regenTimer = 0;
        
        const result = {
            bounced: !this.type.id.includes('ghost'),
            destroyed: true,
            brick: this,
            points: this.points,
            explosive: this.type.id === 'explosive',
            explosionRadius: this.type.explosionRadius || 0,
            guaranteedPowerup: this.type.guaranteedPowerup || false,
            dangerous: this.type.dangerous || false,
            slowsBall: this.type.slowsball || false,
            slowDuration: this.type.slowDuration || 0
        };
        
        return result;
    }
    
    resurrect() {
        this.alive = true;
        this.wasDestroyed = false;
        this.hits = this.maxHits;
        this.regenTimer = 0;
        this.updateColor();
    }
    
    render(ctx, theme = null) {
        if (!this.alive) return;
        if (this.type.phasing && !this.visible) return;
        
        const glowIntensity = theme?.glowIntensity || 8;
        const glowColor = theme?.glowColor || this.color;
        
        // Glow effect
        if (theme?.glow !== false) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glowIntensity;
        }
        
        // Ghost brick transparency
        if (this.type.phasing) {
            ctx.globalAlpha = 0.6 + Math.sin(this.phaseTimer / 500) * 0.3;
        }
        
        // Main brick
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Subtle highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height / 3);
        
        // Draw symbol if exists
        if (this.type.symbol) {
            ctx.font = `${this.height * 0.7}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(this.type.symbol, this.x + this.width / 2, this.y + this.height / 2);
        }
        
        // Show hit count for multi-hit bricks
        if (this.maxHits > 1 && this.maxHits !== Infinity) {
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(this.hits.toString(), this.x + this.width / 2, this.y + this.height / 2);
        }
        
        // Reset
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

/**
 * Create a brick from level data
 */
export function createBrick(config, defaultWidth, defaultHeight) {
    return new Brick(
        config.x,
        config.y,
        config.width || defaultWidth,
        config.height || defaultHeight,
        config.type || 'NORMAL',
        config.row || 0
    );
}

/**
 * Get adjacent brick positions for explosions
 */
export function getAdjacentPositions(brick, allBricks, radius = 1) {
    const adjacent = [];
    const tolerance = 2;
    
    for (const other of allBricks) {
        if (other === brick || !other.alive) continue;
        
        // Check if adjacent (within radius)
        const dx = Math.abs((other.x + other.width / 2) - (brick.x + brick.width / 2));
        const dy = Math.abs((other.y + other.height / 2) - (brick.y + brick.height / 2));
        
        const maxDx = (brick.width + other.width) / 2 * (radius + 0.5);
        const maxDy = (brick.height + other.height) / 2 * (radius + 0.5);
        
        if (dx <= maxDx + tolerance && dy <= maxDy + tolerance) {
            adjacent.push(other);
        }
    }
    
    return adjacent;
}

export default { BRICK_TYPES, ROW_COLORS, WORLD_BRICK_THEMES, Brick, createBrick, getAdjacentPositions };
