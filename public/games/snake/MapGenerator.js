/**
 * Snake Game - Map Generator & Portal System
 * Handles procedural map generation, portals, and dynamic obstacles
 */

// Portal pair definitions
export class Portal {
    constructor(entry, exit, color = '#ff00ff') {
        this.entry = entry;
        this.exit = exit;
        this.color = color;
        this.cooldown = 0;
        this.animationTime = 0;
    }
    
    update(dt) {
        this.animationTime += dt;
        if (this.cooldown > 0) this.cooldown -= dt;
    }
    
    canTeleport() {
        return this.cooldown <= 0;
    }
    
    teleport(position) {
        // Check if position matches entry
        if (Math.abs(position.x - this.entry.x) < 0.5 && 
            Math.abs(position.y - this.entry.y) < 0.5) {
            this.cooldown = 1; // 1 second cooldown
            return { x: this.exit.x, y: this.exit.y };
        }
        // Check if position matches exit (bidirectional)
        if (Math.abs(position.x - this.exit.x) < 0.5 && 
            Math.abs(position.y - this.exit.y) < 0.5) {
            this.cooldown = 1;
            return { x: this.entry.x, y: this.entry.y };
        }
        return null;
    }
    
    render(ctx, cellSize) {
        const pulse = 1 + Math.sin(this.animationTime * 4) * 0.2;
        const radius = (cellSize / 2) * pulse;
        
        // Draw entry portal
        this.drawPortalEffect(ctx, this.entry.x * cellSize + cellSize/2, 
                              this.entry.y * cellSize + cellSize/2, radius);
        
        // Draw exit portal
        this.drawPortalEffect(ctx, this.exit.x * cellSize + cellSize/2, 
                              this.exit.y * cellSize + cellSize/2, radius);
    }
    
    drawPortalEffect(ctx, x, y, radius) {
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        
        // Spinning effect
        const rotation = this.animationTime * 2;
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Draw spiral
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const innerRadius = radius * 0.3;
            ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.stroke();
        
        // Center
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Map templates for procedural generation
const MAP_TEMPLATES = {
    empty: {
        weight: 0.1,
        generate: (gridSize) => []
    },
    
    corners: {
        weight: 0.2,
        generate: (gridSize) => {
            const obstacles = [];
            const size = 3;
            // Four corners
            for (let dx = 0; dx < size; dx++) {
                for (let dy = 0; dy < size; dy++) {
                    obstacles.push({ x: dx + 1, y: dy + 1, type: 'static' });
                    obstacles.push({ x: gridSize - 2 - dx, y: dy + 1, type: 'static' });
                    obstacles.push({ x: dx + 1, y: gridSize - 2 - dy, type: 'static' });
                    obstacles.push({ x: gridSize - 2 - dx, y: gridSize - 2 - dy, type: 'static' });
                }
            }
            return obstacles;
        }
    },
    
    cross: {
        weight: 0.15,
        generate: (gridSize) => {
            const obstacles = [];
            const center = Math.floor(gridSize / 2);
            const armLength = 6;
            
            // Horizontal arm
            for (let i = 3; i < armLength; i++) {
                obstacles.push({ x: center - i, y: center, type: 'static' });
                obstacles.push({ x: center + i, y: center, type: 'static' });
            }
            // Vertical arm
            for (let i = 3; i < armLength; i++) {
                obstacles.push({ x: center, y: center - i, type: 'static' });
                obstacles.push({ x: center, y: center + i, type: 'static' });
            }
            return obstacles;
        }
    },
    
    maze: {
        weight: 0.15,
        generate: (gridSize) => {
            const obstacles = [];
            // Generate random maze-like walls
            const numWalls = 5 + Math.floor(Math.random() * 5);
            
            for (let w = 0; w < numWalls; w++) {
                const horizontal = Math.random() > 0.5;
                const length = 3 + Math.floor(Math.random() * 5);
                let x = Math.floor(Math.random() * (gridSize - length - 4)) + 2;
                let y = Math.floor(Math.random() * (gridSize - length - 4)) + 2;
                
                // Avoid center spawn area
                if (Math.abs(x - gridSize/2) < 5 && Math.abs(y - gridSize/2) < 5) continue;
                
                for (let i = 0; i < length; i++) {
                    const ox = horizontal ? x + i : x;
                    const oy = horizontal ? y : y + i;
                    obstacles.push({ x: ox, y: oy, type: 'static' });
                }
            }
            return obstacles;
        }
    },
    
    scattered: {
        weight: 0.2,
        generate: (gridSize) => {
            const obstacles = [];
            const count = 10 + Math.floor(Math.random() * 15);
            
            for (let i = 0; i < count; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * (gridSize - 4)) + 2;
                    y = Math.floor(Math.random() * (gridSize - 4)) + 2;
                } while (Math.abs(x - gridSize/2) < 4 && Math.abs(y - gridSize/2) < 4);
                
                obstacles.push({ x, y, type: 'static' });
            }
            return obstacles;
        }
    },
    
    moving_patrol: {
        weight: 0.1,
        generate: (gridSize) => {
            const obstacles = [];
            const numPatrols = 3 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < numPatrols; i++) {
                const isHorizontal = Math.random() > 0.5;
                const start = 3 + Math.floor(Math.random() * (gridSize - 10));
                const fixed = 3 + Math.floor(Math.random() * (gridSize - 6));
                const length = 5 + Math.floor(Math.random() * 10);
                
                obstacles.push({
                    type: 'moving',
                    x: isHorizontal ? start : fixed,
                    y: isHorizontal ? fixed : start,
                    path: [
                        { x: isHorizontal ? start : fixed, y: isHorizontal ? fixed : start },
                        { x: isHorizontal ? start + length : fixed, y: isHorizontal ? fixed : start + length }
                    ],
                    speed: 2 + Math.random() * 3,
                    pathIndex: 0,
                    pathProgress: 0
                });
            }
            return obstacles;
        }
    },
    
    rotating_hazards: {
        weight: 0.1,
        generate: (gridSize) => {
            const obstacles = [];
            const numRotators = 2 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < numRotators; i++) {
                const cx = 5 + Math.floor(Math.random() * (gridSize - 10));
                const cy = 5 + Math.floor(Math.random() * (gridSize - 10));
                
                // Avoid center
                if (Math.abs(cx - gridSize/2) < 6 && Math.abs(cy - gridSize/2) < 6) continue;
                
                obstacles.push({
                    type: 'rotating',
                    center: { x: cx, y: cy },
                    radius: 3 + Math.floor(Math.random() * 3),
                    angle: 0,
                    speed: 0.5 + Math.random(),
                    x: cx,
                    y: cy
                });
            }
            return obstacles;
        }
    }
};

export class MapGenerator {
    constructor(gridSize) {
        this.gridSize = gridSize;
    }
    
    // Generate a completely random map
    generateRandom(difficulty = 0.5) {
        // Select template based on weights
        const templates = Object.entries(MAP_TEMPLATES);
        const totalWeight = templates.reduce((sum, [, t]) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        let selectedTemplate = templates[0][1];
        for (const [, template] of templates) {
            random -= template.weight;
            if (random <= 0) {
                selectedTemplate = template;
                break;
            }
        }
        
        const obstacles = selectedTemplate.generate(this.gridSize);
        
        // Add more obstacles based on difficulty
        const extraCount = Math.floor(difficulty * 10);
        for (let i = 0; i < extraCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
            } while (Math.abs(x - this.gridSize/2) < 4 && Math.abs(y - this.gridSize/2) < 4);
            
            obstacles.push({ x, y, type: 'static' });
        }
        
        return obstacles;
    }
    
    // Generate portals for a map
    generatePortals(count = 1) {
        const portals = [];
        const usedPositions = new Set();
        
        for (let i = 0; i < count; i++) {
            let entry, exit;
            
            // Find entry position
            do {
                entry = {
                    x: Math.floor(Math.random() * (this.gridSize - 4)) + 2,
                    y: Math.floor(Math.random() * (this.gridSize - 4)) + 2
                };
            } while (
                usedPositions.has(`${entry.x},${entry.y}`) ||
                (Math.abs(entry.x - this.gridSize/2) < 4 && Math.abs(entry.y - this.gridSize/2) < 4)
            );
            usedPositions.add(`${entry.x},${entry.y}`);
            
            // Find exit position (opposite side of map)
            do {
                exit = {
                    x: this.gridSize - 1 - entry.x + Math.floor(Math.random() * 6 - 3),
                    y: this.gridSize - 1 - entry.y + Math.floor(Math.random() * 6 - 3)
                };
                exit.x = Math.max(2, Math.min(this.gridSize - 3, exit.x));
                exit.y = Math.max(2, Math.min(this.gridSize - 3, exit.y));
            } while (usedPositions.has(`${exit.x},${exit.y}`));
            usedPositions.add(`${exit.x},${exit.y}`);
            
            // Random portal color
            const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff8800', '#00ff88'];
            const color = colors[i % colors.length];
            
            portals.push(new Portal(entry, exit, color));
        }
        
        return portals;
    }
    
    // Generate a themed map based on world
    generateThemed(worldId, levelIndex) {
        const obstacles = [];
        const difficulty = levelIndex / 10;
        
        switch (worldId) {
            case 'garden':
                // Organic, scattered tree-like obstacles
                return this.generateScattered(5 + levelIndex * 2);
                
            case 'ice':
                // Crystal formations - clustered obstacles
                return this.generateCrystalFormations(3 + Math.floor(levelIndex / 2));
                
            case 'volcano':
                // Lava pools and rock formations
                return this.generateLavaPools(2 + Math.floor(levelIndex / 3));
                
            case 'cyber':
                // Grid-like digital patterns
                return this.generateDigitalGrid(levelIndex);
                
            case 'void':
                // Chaotic, random with moving elements
                return this.generateChaos(difficulty);
                
            default:
                return this.generateRandom(difficulty);
        }
    }
    
    generateScattered(count) {
        const obstacles = [];
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
            } while (Math.abs(x - this.gridSize/2) < 4 && Math.abs(y - this.gridSize/2) < 4);
            obstacles.push({ x, y, type: 'static' });
        }
        return obstacles;
    }
    
    generateCrystalFormations(count) {
        const obstacles = [];
        for (let c = 0; c < count; c++) {
            const cx = 5 + Math.floor(Math.random() * (this.gridSize - 10));
            const cy = 5 + Math.floor(Math.random() * (this.gridSize - 10));
            
            if (Math.abs(cx - this.gridSize/2) < 5 && Math.abs(cy - this.gridSize/2) < 5) continue;
            
            // Create crystal cluster
            const size = 2 + Math.floor(Math.random() * 3);
            for (let dx = -size; dx <= size; dx++) {
                for (let dy = -size; dy <= size; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) <= size && Math.random() > 0.3) {
                        obstacles.push({ x: cx + dx, y: cy + dy, type: 'static' });
                    }
                }
            }
        }
        return obstacles;
    }
    
    generateLavaPools(count) {
        const obstacles = [];
        for (let p = 0; p < count; p++) {
            const cx = 5 + Math.floor(Math.random() * (this.gridSize - 10));
            const cy = 5 + Math.floor(Math.random() * (this.gridSize - 10));
            
            if (Math.abs(cx - this.gridSize/2) < 5 && Math.abs(cy - this.gridSize/2) < 5) continue;
            
            // Create irregular pool shape
            const radius = 2 + Math.floor(Math.random() * 2);
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (dx*dx + dy*dy <= radius*radius + Math.random() * 2) {
                        obstacles.push({ x: cx + dx, y: cy + dy, type: 'hazard', subtype: 'lava' });
                    }
                }
            }
        }
        return obstacles;
    }
    
    generateDigitalGrid(levelIndex) {
        const obstacles = [];
        const spacing = Math.max(4, 8 - levelIndex);
        
        for (let x = spacing; x < this.gridSize - spacing; x += spacing) {
            for (let y = spacing; y < this.gridSize - spacing; y += spacing) {
                if (Math.abs(x - this.gridSize/2) < 4 && Math.abs(y - this.gridSize/2) < 4) continue;
                obstacles.push({ x, y, type: 'static' });
            }
        }
        return obstacles;
    }
    
    generateChaos(difficulty) {
        const obstacles = [];
        
        // Static obstacles
        const staticCount = Math.floor(10 * difficulty);
        for (let i = 0; i < staticCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
            } while (Math.abs(x - this.gridSize/2) < 4 && Math.abs(y - this.gridSize/2) < 4);
            obstacles.push({ x, y, type: 'static' });
        }
        
        // Moving obstacles
        const movingCount = Math.floor(3 * difficulty);
        for (let i = 0; i < movingCount; i++) {
            const start = { 
                x: Math.floor(Math.random() * this.gridSize), 
                y: Math.floor(Math.random() * this.gridSize) 
            };
            const end = { 
                x: Math.floor(Math.random() * this.gridSize), 
                y: Math.floor(Math.random() * this.gridSize) 
            };
            
            obstacles.push({
                type: 'moving',
                x: start.x,
                y: start.y,
                path: [start, end],
                speed: 2 + Math.random() * 4,
                pathIndex: 0,
                pathProgress: 0
            });
        }
        
        return obstacles;
    }
}
