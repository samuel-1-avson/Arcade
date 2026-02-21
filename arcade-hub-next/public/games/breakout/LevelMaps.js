/**
 * Breakout Game - Level Maps System
 * 10 Unique maps with geometric patterns, moving elements, and special mechanics
 */

import { ICONS } from './Icons.js';
import { BRICK_TYPES, Brick } from './BrickTypes.js';

// Map configuration constants
const CONFIG = {
    canvasWidth: 640,
    canvasHeight: 600,
    brickWidth: 44,
    brickHeight: 18,
    brickPadding: 4,
    offsetTop: 50,
    offsetLeft: 8, // (640 - (13*(44+4)-4))/2 = (640 - 620)/2 = 10? No. 13*48 = 624. 640-624=16. 8 is correct for 13 full columns.
    cols: 13,
    maxRows: 12
};

/**
 * Map Definitions - 10 Unique Levels
 */
export const LEVEL_MAPS = [
    // ===== MAP 1: CLASSIC (Updated for 13 cols) =====
    {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional layout with a rainbow twist',
        difficulty: 1,
        parTime: 90,
        thumbnail: ICONS.GAMEPAD,
        generate: () => {
            const bricks = [];
            // Row 0: Rainbow
            for (let col = 0; col < 13; col++) {
                bricks.push({ row: 0, col, type: 'RAINBOW', movement: null });
            }
            // Rows 1-5: Classic
            for (let row = 1; row < 6; row++) {
                for (let col = 0; col < 13; col++) {
                    bricks.push({
                        row, col,
                        type: row < 3 ? 'STRONG' : 'NORMAL',
                        movement: null
                    });
                }
            }
            return bricks;
        }
    },

    // ===== MAP 2: DIAMOND (Hollow Center) =====
    {
        id: 'diamond',
        name: 'Diamond',
        description: 'Hollow diamond with explosive tips',
        difficulty: 2,
        parTime: 120,
        thumbnail: ICONS.DIAMOND,
        generate: () => {
            const bricks = [];
            const mid = 6; // Center column (0-12)
            const rows = 11;
            
            for (let row = 0; row < rows; row++) {
                // Width of diamond at this row
                // Row 0: width 0 (center only)
                // Row 5: max width
                // Row 10: width 0
                const spread = row <= 5 ? row : 10 - row;
                
                // Left and right edges
                const left = mid - spread;
                const right = mid + spread;
                
                // Add bricks at edges
                if (left >= 0 && right < 13) {
                    const isTip = row === 0 || row === 10;
                    const isCorner = row === 5 && (left === 0 || right === 12);
                    
                    bricks.push({ row, col: left, type: isTip ? 'EXPLOSIVE' : (isCorner ? 'GOLD' : 'NORMAL'), movement: null });
                    if (left !== right) {
                        bricks.push({ row, col: right, type: isTip ? 'EXPLOSIVE' : (isCorner ? 'GOLD' : 'NORMAL'), movement: null });
                    }
                    
                    // Fill center with glass/ice sometimes
                    if (spread > 2 && spread < 5) {
                         bricks.push({ row, col: mid, type: 'ICE', movement: null });
                    }
                }
            }
            return bricks;
        }
    },

    // ===== MAP 3: INVADERS (Space Invaders) =====
    {
        id: 'invaders',
        name: 'Invaders',
        description: 'Hostile alien fleet approaching!',
        difficulty: 3,
        parTime: 150,
        thumbnail: ICONS.SKULL,
        generate: () => {
            const bricks = [];
            // 3 Rows of invaders
            for (let r = 0; r < 3; r++) {
               const startY = 2 + r * 3;
               // Invader shape (approximate)
               // Row 1:  X X X 
               // Row 2: X X X X X
               // Row 3: X O X O X
               
               for (let i = 0; i < 3; i++) { // 3 invaders per row
                   const baseX = 1 + i * 4;
                   
                   // Body
                   for(let w = 0; w < 3; w++) {
                       bricks.push({ row: startY, col: baseX + w, type: 'MOVING', movement: { type: 'oscillate', speed: 20 + r*10, range: 30 } });
                       bricks.push({ row: startY+1, col: baseX + w - (w===1?0:1), type: 'MOVING', movement: { type: 'oscillate', speed: 20 + r*10, range: 30 } });
                   }
                   // Eyes/Legs
                   bricks.push({ row: startY+2, col: baseX, type: 'MOVING', movement: { type: 'oscillate', speed: 20 + r*10, range: 30 } });
                   bricks.push({ row: startY+2, col: baseX+2, type: 'MOVING', movement: { type: 'oscillate', speed: 20 + r*10, range: 30 } });
               }
            }
            // UFO at top
            bricks.push({ row: 0, col: 6, type: 'GOLD', movement: { type: 'bounce', speed: 100, range: 200 } });
            
            return bricks;
        }
    },

    // ===== MAP 4: DNA (Double Helix) =====
    {
        id: 'dna',
        name: 'DNA Sequence',
        description: 'Intertwined strands of reinforced blocks',
        difficulty: 4,
        parTime: 180,
        thumbnail: ICONS.INFINITY, // Use infinity symbol for helix
        generate: () => {
            const bricks = [];
            const height = 12;
            
            for (let row = 0; row < height; row++) {
                // Sine waves
                const phase = row * 0.5;
                const center1 = 6 + Math.sin(phase) * 5;
                const center2 = 6 + Math.sin(phase + Math.PI) * 5; // Opposite phase
                
                const c1 = Math.round(center1);
                const c2 = Math.round(center2);
                
                if (c1 >= 0 && c1 < 13) bricks.push({ row, col: c1, type: 'REINFORCED', movement: null });
                if (c2 >= 0 && c2 < 13) bricks.push({ row, col: c2, type: 'STRONG', movement: null });
                
                // Connecting rungs
                if (Math.abs(c1 - c2) > 1 && row % 2 === 0) {
                    const start = Math.min(c1, c2);
                    const end = Math.max(c1, c2);
                    const mid = Math.round((start + end) / 2);
                    bricks.push({ row, col: mid, type: 'Rainbow', movement: null });
                }
            }
            return bricks;
        }
    },

    // ===== MAP 5: CITYSCAPE (Skyscrapers) =====
    {
        id: 'cityscape',
        name: 'Metropolis',
        description: 'Towering structures with strong foundations',
        difficulty: 3,
        parTime: 160,
        thumbnail: ICONS.BOX,
        generate: () => {
            const bricks = [];
            const cols = 13;
            // Generate 4-5 buildings
            const buildings = [2, 4, 6, 8, 10]; // Centers
            
            buildings.forEach(center => {
                const height = 4 + Math.floor(Math.random() * 6);
                const width = 1 + Math.floor(Math.random() * 2); // Radius
                
                for (let h = 0; h < height; h++) {
                    const row = 11 - h; // Start from bottom
                    for (let w = -width + 1; w < width; w++) {
                         const col = center + w;
                         if (col >= 0 && col < 13) {
                             let type = 'NORMAL';
                             if (h < 2) type = 'INDESTRUCTIBLE'; // Foundation (needs bombs or powerups? Or just super strong?)
                             // Wait, indestructible might be too mean if they block ball. 
                             // Let's use REINFORCED for foundation.
                             if (h === 0) type = 'REINFORCED';
                             else if (h === height - 1) type = 'GOLD'; // Roof treasure
                             else if (w === 0) type = 'STRONG'; // Core
                             
                             bricks.push({ row, col, type, movement: null });
                         }
                    }
                }
            });
            return bricks;
        }
    },

    // ===== MAP 6: PINBALL (Bumpers) =====
    {
        id: 'pinball',
        name: 'Pinball',
        description: 'Bouncers and bumpers everywhere',
        difficulty: 4,
        parTime: 140,
        thumbnail: ICONS.EXPLOSION,
        generate: () => {
            const bricks = [];
            // Angled walls (approximated)
            const pattern = [
                {r:0, c:0}, {r:1, c:1}, {r:2, c:2}, // Left ramp
                {r:0, c:12}, {r:1, c:11}, {r:2, c:10}, // Right ramp
                {r:5, c:3}, {r:5, c:9}, // Bumpers
                {r:8, c:6} // Center bumper
            ];
            
            // Add ramps
            for(let i=0; i<3; i++) {
                 bricks.push({ row: i, col: i, type: 'INDESTRUCTIBLE', movement: null });
                 bricks.push({ row: i, col: 12-i, type: 'INDESTRUCTIBLE', movement: null });
            }
            
            // Add bumpers (Clusters of explosives/strong)
            [3, 9].forEach(c => {
                 bricks.push({ row: 5, col: c, type: 'EXPLOSIVE', movement: null });
                 bricks.push({ row: 4, col: c, type: 'STRONG', movement: null });
                 bricks.push({ row: 6, col: c, type: 'STRONG', movement: null });
                 bricks.push({ row: 5, col: c-1, type: 'STRONG', movement: null });
                 bricks.push({ row: 5, col: c+1, type: 'STRONG', movement: null });
            });
            
            // Center target
            bricks.push({ row: 8, col: 6, type: 'GOLD', movement: { type: 'spin', speed: 0, range: 0 } }); // Rotate?
            
            return bricks;
        }
    },

    // ===== MAP 7: BOSS (Face) =====
    {
        id: 'boss',
        name: 'The Guardian',
        description: 'Defeat the giant brick face!',
        difficulty: 5,
        parTime: 200,
        thumbnail: ICONS.HEART, // Using heart as face/life icon
        generate: () => {
             const bricks = [];
             
             // 13 cols. Center is 6.
             // Eyes
             bricks.push({ row: 3, col: 4, type: 'REINFORCED', movement: null });
             bricks.push({ row: 3, col: 8, type: 'REINFORCED', movement: null });
             
             // Pupils (Gold inside)
             bricks.push({ row: 3, col: 4, type: 'GOLD', movement: null }); 
             // Wait can't stack. 
             // Let's make pupils gold
             
             // Nose
             bricks.push({ row: 5, col: 6, type: 'STRONG', movement: null });
             bricks.push({ row: 6, col: 6, type: 'STRONG', movement: null });
             
             // Mouth (Smile)
             const mouth = [
                 {r:8, c:3}, {r:9, c:4}, {r:9, c:5}, {r:9, c:6}, {r:9, c:7}, {r:9, c:8}, {r:8, c:9}
             ];
             mouth.forEach(p => bricks.push({ row: p.r, col: p.c, type: 'EXPLOSIVE', movement: null }));
             
             // Outline/Head
             for (let c = 2; c <= 10; c++) bricks.push({ row: 1, col: c, type: 'STRONG', movement: null }); // Top
             for (let c = 2; c <= 10; c++) bricks.push({ row: 10, col: c, type: 'STRONG', movement: null }); // Chin
             for (let r = 1; r <= 10; r++) {
                 bricks.push({ row: r, col: 2, type: 'STRONG', movement: null });
                 bricks.push({ row: r, col: 10, type: 'STRONG', movement: null });
             }
             
             return bricks;
        }
    },
    
    // ===== MAP 8: RAIN (Falling) =====
    {
        id: 'rain',
        name: 'Digital Rain',
        description: 'Matrix-style falling pillars',
        difficulty: 4,
        parTime: 170,
        thumbnail: ICONS.REFRESH,
        generate: () => {
             const bricks = [];
             for (let c = 0; c < 13; c+=2) { // Every other column
                 const len = 3 + Math.floor(Math.random() * 8);
                 const speed = 10 + Math.random() * 20;
                 for (let r = 0; r < len; r++) {
                     bricks.push({ 
                         row: r, col: c, 
                         type: 'MOVING', 
                         movement: { type: 'bounce', speed: speed, range: 0, axis: 'y' } // Vertical bounce? Need to impl axis. 
                     });
                     // Current movement only supports X axis in updateBrickMovement. 
                     // We'll stick to static columns that look like rain for now, or just basic types.
                     // Or hack standard movement. 
                 }
             }
             // Actually, let's just make static "rain" patterns of diff lengths
             for (let c = 0; c < 13; c++) {
                 if (Math.random() > 0.3) {
                     const len = 2 + Math.floor(Math.random() * 8);
                     for (let r = 0; r < len; r++) {
                         bricks.push({ row: r, col: c, type: Math.random()>0.8?'GOLD':'NORMAL', movement: null });
                     }
                 }
             }
             return bricks;
        }
    },

    // ===== MAP 9: ORBIT (Enhanced) =====
    {
        id: 'orbit',
        name: 'Solar System',
        description: 'Planetary orbits around a burning sun',
        difficulty: 5,
        parTime: 200,
        thumbnail: ICONS.INFINITY, // Use infinity for orbit
        generate: () => {
            const bricks = [];
            const centerX = 6;
            const centerY = 5;
            
            // Sun (2x2 Gold)
            bricks.push({ row: 5, col: 6, type: 'GOLD', movement: null });
            bricks.push({ row: 4, col: 6, type: 'GOLD', movement: null });
            bricks.push({ row: 5, col: 5, type: 'GOLD', movement: null });
            bricks.push({ row: 4, col: 5, type: 'GOLD', movement: null });
            bricks.push({ row: 5, col: 7, type: 'GOLD', movement: null });
            bricks.push({ row: 4, col: 7, type: 'GOLD', movement: null });

            // Orbits
            // We use the existing 'orbit' movement type which assumes center indices.
            // Center is now 6 (col 6) and 5 (row 5).
            
            // Inner
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                bricks.push({
                    row: 0, col: 0, // Placeholder, pos set by movement
                    type: 'MOVING',
                    movement: { type: 'orbit', centerX: 6, centerY: 5, radius: 2.5, speed: 0.8, startAngle: angle }
                });
            }
            
            // Outer
             for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                bricks.push({
                    row: 0, col: 0,
                    type: 'STRONG',
                    movement: { type: 'orbit', centerX: 6, centerY: 5, radius: 4.5, speed: 0.4, startAngle: angle }
                });
            }
            
            return bricks;
        }
    },

    // ===== MAP 10: CHAOS (Random) =====
    {
        id: 'chaos',
        name: 'Entropy',
        description: 'Absolute mayhem - everything moves and explodes!',
        difficulty: 5,
        parTime: 180,
        thumbnail: ICONS.EXPLOSION,
        generate: () => {
            const bricks = [];
            const types = ['NORMAL', 'STRONG', 'EXPLOSIVE', 'MOVING', 'GOLD', 'ICE'];
            
            // Random scattered pattern
            for (let row = 0; row < 12; row++) {
                for (let col = 0; col < 13; col++) {
                    // ~60% chance of brick
                    if (Math.random() < 0.6) {
                        const typeIndex = Math.floor(Math.random() * types.length);
                        const type = types[typeIndex];
                        
                        let movement = null;
                        if (Math.random() < 0.2) {
                            const moveTypes = ['oscillate', 'bounce', 'random'];
                            movement = {
                                type: moveTypes[Math.floor(Math.random() * moveTypes.length)],
                                speed: 15 + Math.random() * 30,
                                range: 20 + Math.random() * 20
                            };
                        }
                        
                        bricks.push({ row, col, type, movement });
                    }
                }
            }
            return bricks;
        }
    }
];

/**
 * LevelMapManager - Handles map selection and generation
 */
export class LevelMapManager {
    constructor(game) {
        this.game = game;
        this.currentMapIndex = 0;
        this.currentMap = null;
        this.orbitingBricks = []; // Track bricks with orbit movement
    }
    
    getMap(id) {
        return LEVEL_MAPS.find(m => m.id === id);
    }
    
    getMapByIndex(index) {
        return LEVEL_MAPS[index] || LEVEL_MAPS[0];
    }
    
    getAllMaps() {
        return LEVEL_MAPS;
    }
    
    loadMap(mapIdOrIndex) {
        let map;
        if (typeof mapIdOrIndex === 'number') {
            map = this.getMapByIndex(mapIdOrIndex);
            this.currentMapIndex = mapIdOrIndex;
        } else {
            map = this.getMap(mapIdOrIndex);
            this.currentMapIndex = LEVEL_MAPS.findIndex(m => m.id === mapIdOrIndex);
        }
        
        if (!map) {
            console.error('Map not found:', mapIdOrIndex);
            return [];
        }
        
        this.currentMap = map;
        const brickData = map.generate();
        
        return this.createBricks(brickData);
    }
    
    createBricks(brickData) {
        const bricks = [];
        this.orbitingBricks = [];
        
        for (const data of brickData) {
            const x = CONFIG.offsetLeft + data.col * (CONFIG.brickWidth + CONFIG.brickPadding);
            const y = CONFIG.offsetTop + data.row * (CONFIG.brickHeight + CONFIG.brickPadding);
            
            // Create Brick instance
            const brick = new Brick(
                x, y,
                CONFIG.brickWidth,
                CONFIG.brickHeight,
                data.type,
                data.row
            );

            // Assign extra properties
            brick.col = data.col;
            brick.movement = data.movement;
            brick.angle = data.movement?.startAngle || 0;
            brick.randomTarget = null;
            
            // Set color (Brick constructor sets basic color, but we might overlap)
            this.updateBrickColor(brick);
            
            bricks.push(brick);
            
            if (data.movement?.type === 'orbit') {
                this.orbitingBricks.push(brick);
            }
        }
        
        return bricks;
    }
    
    updateBrickColor(brick) {
        const type = brick.type;
        if (type.rainbow) {
            brick.color = `hsl(${brick.rainbowHue}, 70%, 55%)`;
        } else if (type.colors) {
            const colorIndex = brick.maxHits - brick.hits;
            brick.color = type.colors[Math.min(colorIndex, type.colors.length - 1)];
        } else if (type.color) {
            brick.color = type.color;
        } else {
            // Use row-based calm colors
            const CALM_COLORS = ['#c47272', '#c9a857', '#7dba84', '#6b8aad', '#9b7cc4', '#7ab8b8', '#b8937a', '#8a9eb8'];
            brick.color = CALM_COLORS[brick.row % CALM_COLORS.length];
        }
    }
    
    updateBrickMovement(brick, dt) {
        if (!brick.movement || !brick.alive) return;
        
        const move = brick.movement;
        
        switch (move.type) {
            case 'oscillate':
                brick.x = brick.baseX + Math.sin(Date.now() / 1000 * move.speed / 20) * move.range;
                break;
                
            case 'bounce':
                brick.x += move.speed * brick.direction * dt;
                if (brick.x < brick.baseX - move.range) {
                    brick.x = brick.baseX - move.range;
                    brick.direction = 1;
                } else if (brick.x > brick.baseX + move.range) {
                    brick.x = brick.baseX + move.range;
                    brick.direction = -1;
                }
                break;
                
            case 'orbit':
                brick.angle += move.speed * dt;
                const centerPixelX = CONFIG.offsetLeft + move.centerX * (CONFIG.brickWidth + CONFIG.brickPadding);
                const centerPixelY = CONFIG.offsetTop + move.centerY * (CONFIG.brickHeight + CONFIG.brickPadding);
                const radiusPixelX = move.radius * (CONFIG.brickWidth + CONFIG.brickPadding);
                const radiusPixelY = move.radius * (CONFIG.brickHeight + CONFIG.brickPadding);
                
                brick.x = centerPixelX + Math.cos(brick.angle) * radiusPixelX;
                brick.y = centerPixelY + Math.sin(brick.angle) * radiusPixelY;
                break;
                
            case 'random':
                if (!brick.randomTarget || Math.random() < 0.01) {
                    brick.randomTarget = {
                        x: brick.baseX + (Math.random() - 0.5) * move.range * 2,
                        y: brick.baseY + (Math.random() - 0.5) * move.range
                    };
                }
                brick.x += (brick.randomTarget.x - brick.x) * 0.02;
                brick.y += (brick.randomTarget.y - brick.y) * 0.02;
                break;
        }
    }
    
    // Show map selection UI
    showMapSelect(callback) {
        const overlay = document.createElement('div');
        overlay.id = 'map-select-overlay';
        overlay.className = 'fullscreen-overlay';
        
        // Remove old style injection if it exists
        // (Previously injected style element is no longer needed as CSS is in breakout.css)
        
        let html = `
            <h2 class="map-select-header">Select Map</h2>
            <div class="grid-select-container">
        `;
        
        for (let i = 0; i < LEVEL_MAPS.length; i++) {
            const map = LEVEL_MAPS[i];
            
            html += `
                <div class="select-card" data-index="${i}">
                    <div class="card-thumbnail">${map.thumbnail}</div>
                    <h3 class="map-card-name">${map.name}</h3>
                    <p class="map-card-desc">${map.description}</p>
                    <div class="map-card-stats-row">
                        <span class="map-difficulty-badge">
                            <span style="width: 14px; margin-right: 2px;">${ICONS.STAR}</span> ${map.difficulty}
                        </span>
                        <span class="map-par-time">${map.parTime}s par</span>
                    </div>
                </div>
            `;
        }
        
        html += `</div>
            <button id="close-map-select" class="btn btn-ghost map-select-actions">Cancel</button>
        `;
        
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        
        // Event listeners (no need for dynamic style injection anymore)
        
        // Event listeners
        overlay.querySelectorAll('.select-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                overlay.remove();
                if (callback) callback(index);
            });
        });
        
        document.getElementById('close-map-select').addEventListener('click', () => {
            overlay.remove();
        });
    }
}

export default { LEVEL_MAPS, LevelMapManager };
