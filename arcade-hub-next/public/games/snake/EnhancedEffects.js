/**
 * Snake Game - Enhanced Visual Effects
 * Advanced trail system, lighting enhancements, screen effects, and 3D isometric rendering
 */

// Trail System for snake movement
export class TrailSystem {
    constructor(maxTrails = 50) {
        this.trails = [];
        this.maxTrails = maxTrails;
    }
    
    addTrailPoint(x, y, color, size = 1) {
        this.trails.push({
            x, y,
            color,
            size,
            alpha: 1,
            life: 1,
            startTime: performance.now()
        });
        
        while (this.trails.length > this.maxTrails) {
            this.trails.shift();
        }
    }
    
    update(dt) {
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.life -= dt * 2;
            trail.alpha = trail.life;
            trail.size *= 0.98;
            
            if (trail.life <= 0) {
                this.trails.splice(i, 1);
            }
        }
    }
    
    render(ctx, cellSize) {
        ctx.save();
        
        for (const trail of this.trails) {
            const gradient = ctx.createRadialGradient(
                trail.x * cellSize + cellSize / 2,
                trail.y * cellSize + cellSize / 2,
                0,
                trail.x * cellSize + cellSize / 2,
                trail.y * cellSize + cellSize / 2,
                cellSize * trail.size
            );
            
            const color = trail.color || '#00ff88';
            gradient.addColorStop(0, `${color}${Math.floor(trail.alpha * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                trail.x * cellSize - cellSize * trail.size,
                trail.y * cellSize - cellSize * trail.size,
                cellSize * trail.size * 3,
                cellSize * trail.size * 3
            );
        }
        
        ctx.restore();
    }
    
    clear() {
        this.trails = [];
    }
}

// Enhanced Lighting System
export class LightingSystem {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.lights = [];
        this.ambientColor = [0.1, 0.1, 0.15];
        this.globalBrightness = 1;
        
        // Dynamic lighting effects
        this.torchFlicker = 0;
        this.pulseTime = 0;
    }
    
    addLight(x, y, radius, color, intensity = 1, type = 'point') {
        this.lights.push({
            x, y,
            radius,
            color,
            intensity,
            type, // point, spot, pulse, torch
            angle: 0, // for spot lights
            flicker: type === 'torch' ? Math.random() : 0
        });
        return this.lights.length - 1;
    }
    
    updateLight(index, props) {
        if (this.lights[index]) {
            Object.assign(this.lights[index], props);
        }
    }
    
    removeLight(index) {
        if (index >= 0 && index < this.lights.length) {
            this.lights.splice(index, 1);
        }
    }
    
    update(dt) {
        this.pulseTime += dt;
        this.torchFlicker = Math.sin(this.pulseTime * 15) * 0.1 + 
                           Math.sin(this.pulseTime * 23) * 0.05;
        
        // Update torch lights
        for (const light of this.lights) {
            if (light.type === 'torch') {
                light.flicker = Math.sin(this.pulseTime * 10 + light.x) * 0.15;
            } else if (light.type === 'pulse') {
                light.radius = light.baseRadius * (1 + Math.sin(this.pulseTime * 3) * 0.2);
            }
        }
    }
    
    renderLightMap(ctx, cellSize) {
        // Create off-screen canvas for light map
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = this.width;
        lightCanvas.height = this.height;
        const lightCtx = lightCanvas.getContext('2d');
        
        // Fill with ambient color
        lightCtx.fillStyle = `rgb(${this.ambientColor[0] * 255}, ${this.ambientColor[1] * 255}, ${this.ambientColor[2] * 255})`;
        lightCtx.fillRect(0, 0, this.width, this.height);
        
        // Draw each light additively
        lightCtx.globalCompositeOperation = 'lighter';
        
        for (const light of this.lights) {
            const x = light.x * cellSize + cellSize / 2;
            const y = light.y * cellSize + cellSize / 2;
            const radius = light.radius * cellSize * (1 + light.flicker);
            const intensity = light.intensity * this.globalBrightness;
            
            const gradient = lightCtx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(${light.color[0] * 255 * intensity}, ${light.color[1] * 255 * intensity}, ${light.color[2] * 255 * intensity}, 1)`);
            gradient.addColorStop(0.5, `rgba(${light.color[0] * 255 * intensity * 0.5}, ${light.color[1] * 255 * intensity * 0.5}, ${light.color[2] * 255 * intensity * 0.5}, 0.5)`);
            gradient.addColorStop(1, 'transparent');
            
            lightCtx.fillStyle = gradient;
            lightCtx.beginPath();
            lightCtx.arc(x, y, radius, 0, Math.PI * 2);
            lightCtx.fill();
        }
        
        // Apply light map to main canvas
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(lightCanvas, 0, 0);
        ctx.restore();
    }
    
    setAmbient(r, g, b) {
        this.ambientColor = [r, g, b];
    }
    
    clear() {
        this.lights = [];
    }
}

// Screen Effects System
export class ScreenEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.effects = [];
        
        // Effect states
        this.scanlines = false;
        this.crt = false;
        this.glitch = 0;
        this.colorShift = 0;
        this.pixelate = 0;
        this.blur = 0;
        this.invert = 0;
        this.hueRotate = 0;
        this.saturation = 1;
        this.contrast = 1;
    }
    
    // Add timed effect
    addEffect(type, intensity, duration) {
        this.effects.push({
            type,
            intensity,
            duration,
            elapsed: 0
        });
    }
    
    update(dt) {
        // Update timed effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.elapsed += dt;
            
            const progress = effect.elapsed / effect.duration;
            const fade = 1 - progress;
            
            // Apply effect
            switch (effect.type) {
                case 'glitch':
                    this.glitch = effect.intensity * fade;
                    break;
                case 'color_shift':
                    this.colorShift = effect.intensity * fade;
                    break;
                case 'pixelate':
                    this.pixelate = effect.intensity * fade;
                    break;
                case 'blur':
                    this.blur = effect.intensity * fade;
                    break;
                case 'invert':
                    this.invert = effect.intensity * fade;
                    break;
            }
            
            if (progress >= 1) {
                this.effects.splice(i, 1);
                // Reset the effect value
                this[effect.type] = 0;
            }
        }
    }
    
    applyToCanvas() {
        const filters = [];
        
        if (this.blur > 0) {
            filters.push(`blur(${this.blur}px)`);
        }
        if (this.hueRotate !== 0) {
            filters.push(`hue-rotate(${this.hueRotate}deg)`);
        }
        if (this.saturation !== 1) {
            filters.push(`saturate(${this.saturation})`);
        }
        if (this.contrast !== 1) {
            filters.push(`contrast(${this.contrast})`);
        }
        if (this.invert > 0) {
            filters.push(`invert(${this.invert})`);
        }
        
        this.canvas.style.filter = filters.length > 0 ? filters.join(' ') : 'none';
    }
    
    renderOverlay(ctx) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Scanlines
        if (this.scanlines) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for (let y = 0; y < height; y += 3) {
                ctx.fillRect(0, y, width, 1);
            }
            ctx.restore();
        }
        
        // CRT curvature simulation
        if (this.crt) {
            ctx.save();
            const gradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, width * 0.7
            );
            gradient.addColorStop(0.8, 'transparent');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
        
        // Glitch effect
        if (this.glitch > 0) {
            ctx.save();
            
            // Random horizontal slices
            const sliceCount = Math.floor(this.glitch * 10);
            for (let i = 0; i < sliceCount; i++) {
                const y = Math.random() * height;
                const sliceHeight = 5 + Math.random() * 20;
                const offset = (Math.random() - 0.5) * this.glitch * 50;
                
                // Copy and offset a slice
                const imageData = ctx.getImageData(0, y, width, sliceHeight);
                ctx.putImageData(imageData, offset, y);
            }
            
            // Color channel separation
            if (this.glitch > 0.3) {
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = this.glitch * 0.3;
                ctx.drawImage(this.canvas, this.glitch * 5, 0);
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
            }
            
            ctx.restore();
        }
        
        // Color shift
        if (this.colorShift > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'exclusion';
            ctx.globalAlpha = this.colorShift;
            ctx.fillStyle = `hsl(${(performance.now() / 10) % 360}, 100%, 50%)`;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }
    }
    
    // Presets
    setDamageEffect() {
        this.addEffect('glitch', 0.5, 0.3);
        this.addEffect('color_shift', 0.3, 0.2);
    }
    
    setBossEntranceEffect() {
        this.addEffect('glitch', 0.8, 1);
        this.addEffect('color_shift', 0.5, 1.5);
    }
    
    setDeathEffect() {
        this.addEffect('blur', 3, 1);
        this.addEffect('invert', 0.5, 0.5);
    }
    
    setVictoryEffect() {
        this.saturation = 1.3;
        this.contrast = 1.1;
    }
}

// Isometric 3D Renderer
export class IsometricRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Isometric projection angles
        this.angleX = Math.PI / 6; // 30 degrees
        this.angleY = Math.PI / 6;
        
        this.tileWidth = 24;
        this.tileHeight = 12;
        this.tileDepth = 10;
        
        this.offsetX = canvas.width / 2;
        this.offsetY = 100;
        
        this.heightMap = {};
    }
    
    // Convert grid position to isometric screen position
    toIso(x, y, z = 0) {
        const isoX = (x - y) * this.tileWidth / 2 + this.offsetX;
        const isoY = (x + y) * this.tileHeight / 2 - z * this.tileDepth + this.offsetY;
        return { x: isoX, y: isoY };
    }
    
    // Set height at a grid position
    setHeight(x, y, height) {
        this.heightMap[`${x},${y}`] = height;
    }
    
    getHeight(x, y) {
        return this.heightMap[`${x},${y}`] || 0;
    }
    
    renderTile(x, y, z, color, topColor = null) {
        const ctx = this.ctx;
        const pos = this.toIso(x, y, z);
        
        const tw = this.tileWidth;
        const th = this.tileHeight;
        const td = this.tileDepth * (z > 0 ? z : 1);
        
        // Top face
        ctx.fillStyle = topColor || color;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + tw / 2, pos.y + th / 2);
        ctx.lineTo(pos.x, pos.y + th);
        ctx.lineTo(pos.x - tw / 2, pos.y + th / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();
        
        // Left face (darker)
        const leftColor = this.darkenColor(color, 0.7);
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.moveTo(pos.x - tw / 2, pos.y + th / 2);
        ctx.lineTo(pos.x, pos.y + th);
        ctx.lineTo(pos.x, pos.y + th + td);
        ctx.lineTo(pos.x - tw / 2, pos.y + th / 2 + td);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Right face (slightly darker)
        const rightColor = this.darkenColor(color, 0.85);
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y + th);
        ctx.lineTo(pos.x + tw / 2, pos.y + th / 2);
        ctx.lineTo(pos.x + tw / 2, pos.y + th / 2 + td);
        ctx.lineTo(pos.x, pos.y + th + td);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    renderSnakeSegment(x, y, z, color, isHead = false, direction = 'RIGHT') {
        const ctx = this.ctx;
        const pos = this.toIso(x, y, z);
        
        const tw = this.tileWidth * 0.8;
        const th = this.tileHeight * 0.8;
        const height = isHead ? this.tileDepth * 1.5 : this.tileDepth;
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = isHead ? 15 : 8;
        
        // Body (rounded appearance using ellipse on top)
        this.renderTile(x, y, z, color);
        
        // Eyes for head
        if (isHead) {
            ctx.shadowBlur = 0;
            
            const eyeOffset = 4;
            let leftEye, rightEye;
            
            switch (direction) {
                case 'UP':
                    leftEye = { x: pos.x - eyeOffset, y: pos.y - 2 };
                    rightEye = { x: pos.x + eyeOffset, y: pos.y - 2 };
                    break;
                case 'DOWN':
                    leftEye = { x: pos.x - eyeOffset, y: pos.y + 6 };
                    rightEye = { x: pos.x + eyeOffset, y: pos.y + 6 };
                    break;
                case 'LEFT':
                    leftEye = { x: pos.x - tw / 3, y: pos.y };
                    rightEye = { x: pos.x - tw / 3, y: pos.y + 4 };
                    break;
                default: // RIGHT
                    leftEye = { x: pos.x + tw / 3, y: pos.y };
                    rightEye = { x: pos.x + tw / 3, y: pos.y + 4 };
            }
            
            // White of eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(leftEye.x, leftEye.y, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rightEye.x, rightEye.y, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(leftEye.x + 0.5, leftEye.y + 0.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEye.x + 0.5, rightEye.y + 0.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
    }
    
    renderFood(x, y, z, color) {
        const ctx = this.ctx;
        const pos = this.toIso(x, y, z);
        
        // Floating animation
        const bounce = Math.sin(performance.now() / 200) * 3;
        
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        // Render as glowing orb
        const gradient = ctx.createRadialGradient(
            pos.x, pos.y - bounce - 5, 0,
            pos.x, pos.y - bounce - 5, 10
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, this.darkenColor(color, 0.7));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - bounce - 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(pos.x - 3, pos.y - bounce - 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
    
    renderObstacle(x, y, height, color) {
        this.renderTile(x, y, height, color, this.darkenColor(color, 1.2));
    }
    
    renderGrid(gridSize, gridColor) {
        const ctx = this.ctx;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= gridSize; x++) {
            for (let y = 0; y <= gridSize; y++) {
                const pos = this.toIso(x, y, 0);
                
                // Draw tile outline
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x + this.tileWidth / 2, pos.y + this.tileHeight / 2);
                ctx.lineTo(pos.x, pos.y + this.tileHeight);
                ctx.lineTo(pos.x - this.tileWidth / 2, pos.y + this.tileHeight / 2);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }
    
    darkenColor(color, factor) {
        // Parse color and darken
        let r, g, b;
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else if (color.startsWith('rgb')) {
            [r, g, b] = color.match(/\d+/g).map(Number);
        } else {
            return color;
        }
        
        r = Math.floor(r * factor);
        g = Math.floor(g * factor);
        b = Math.floor(b * factor);
        
        return `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
    }
}

// Enhanced Particle Presets
export const ENHANCED_PARTICLES = {
    // Power-up collection
    powerupCollect: {
        count: 25,
        radial: true,
        speed: 200,
        life: 0.8,
        size: 6,
        endSize: 0,
        drag: 0.92,
        type: 'star'
    },
    
    // Combo multiplier
    comboFlare: {
        count: 15,
        direction: -Math.PI / 2,
        angleSpread: 0.8,
        speed: 150,
        life: 0.6,
        size: 4,
        color: [1, 0.8, 0],
        endColor: [1, 0.3, 0],
        drag: 0.9
    },
    
    // Death explosion
    deathExplosion: {
        count: 50,
        radial: true,
        speed: 300,
        life: 1.2,
        size: 8,
        endSize: 2,
        color: [1, 0, 0],
        endColor: [0.3, 0, 0],
        drag: 0.95,
        ay: 100
    },
    
    // Portal swirl
    portalSwirl: {
        count: 30,
        radial: true,
        speed: 50,
        life: 1,
        size: 3,
        color: [0.5, 0, 1],
        endColor: [0, 0.5, 1],
        drag: 0.99,
        type: 'circle'
    },
    
    // Level complete celebration
    celebration: {
        count: 100,
        radial: true,
        speed: 400,
        life: 2,
        size: 5,
        endSize: 1,
        drag: 0.97,
        ay: 200,
        type: 'star'
    },
    
    // Boss damage
    bossDamage: {
        count: 40,
        radial: true,
        speed: 250,
        life: 1,
        size: 10,
        endSize: 0,
        color: [1, 0.3, 0],
        drag: 0.93
    },
    
    // Electric spark
    electricSpark: {
        count: 8,
        radial: true,
        speed: 400,
        life: 0.2,
        size: 2,
        color: [0.5, 0.8, 1],
        drag: 0.7
    },
    
    // Magic dust
    magicDust: {
        count: 20,
        spread: 30,
        direction: -Math.PI / 2,
        angleSpread: 1,
        speed: 30,
        life: 1.5,
        size: 3,
        endSize: 0,
        color: [1, 0.9, 0.5],
        drag: 0.98,
        ay: -20
    }
};
