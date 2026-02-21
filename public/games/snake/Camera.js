/**
 * Snake Game - Camera System
 * Smooth following, cinematic effects, and transitions
 */

export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // Position
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // Zoom
        this.zoom = 1;
        this.targetZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        
        // Shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeDecay = 10;
        this.shakeOffset = { x: 0, y: 0 };
        
        // Smooth follow
        this.followSpeed = 5;
        this.followTarget = null;
        
        // Transitions
        this.transitioning = false;
        this.transitionType = null;
        this.transitionProgress = 0;
        this.transitionDuration = 0;
        this.transitionCallback = null;
        
        // Effects
        this.flash = { active: false, color: [1, 1, 1], alpha: 0, duration: 0 };
        this.slowMotion = { active: false, factor: 1, duration: 0 };
    }

    update(dt) {
        // Smooth follow
        if (this.followTarget) {
            this.targetX = this.followTarget.x - this.width / 2;
            this.targetY = this.followTarget.y - this.height / 2;
        }
        
        // Interpolate position
        this.x += (this.targetX - this.x) * this.followSpeed * dt;
        this.y += (this.targetY - this.y) * this.followSpeed * dt;
        
        // Interpolate zoom
        this.zoom += (this.targetZoom - this.zoom) * 5 * dt;
        
        // Update shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const intensity = this.shakeIntensity * (this.shakeDuration / (this.shakeDuration + dt));
            this.shakeOffset.x = (Math.random() - 0.5) * intensity * 2;
            this.shakeOffset.y = (Math.random() - 0.5) * intensity * 2;
            this.shakeIntensity *= Math.pow(0.1, dt * this.shakeDecay);
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
            this.shakeIntensity = 0;
        }
        
        // Update transitions
        if (this.transitioning) {
            this.transitionProgress += dt / this.transitionDuration;
            if (this.transitionProgress >= 1) {
                this.transitioning = false;
                this.transitionProgress = 1;
                if (this.transitionCallback) {
                    this.transitionCallback();
                    this.transitionCallback = null;
                }
            }
        }
        
        // Update flash
        if (this.flash.active) {
            this.flash.duration -= dt;
            if (this.flash.duration <= 0) {
                this.flash.active = false;
                this.flash.alpha = 0;
            } else {
                this.flash.alpha = this.flash.duration * 2;
            }
        }
        
        // Update slow motion
        if (this.slowMotion.active) {
            this.slowMotion.duration -= dt;
            if (this.slowMotion.duration <= 0) {
                this.slowMotion.active = false;
                this.slowMotion.factor = 1;
            }
        }
        
        return this.slowMotion.active ? dt * this.slowMotion.factor : dt;
    }

    // Apply camera transform to context
    apply(ctx) {
        ctx.save();
        
        // Center and zoom
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.width / 2, -this.height / 2);
        
        // Apply position and shake
        ctx.translate(-this.x + this.shakeOffset.x, -this.y + this.shakeOffset.y);
    }

    restore(ctx) {
        ctx.restore();
        
        // Draw screen effects
        this.drawEffects(ctx);
    }

    drawEffects(ctx) {
        // Flash effect
        if (this.flash.active && this.flash.alpha > 0) {
            ctx.fillStyle = `rgba(${this.flash.color[0] * 255}, ${this.flash.color[1] * 255}, ${this.flash.color[2] * 255}, ${this.flash.alpha})`;
            ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Transition effects
        if (this.transitioning) {
            this.drawTransition(ctx);
        }
    }

    drawTransition(ctx) {
        const t = this.transitionProgress;
        
        switch (this.transitionType) {
            case 'fade':
                const fadeAlpha = t < 0.5 ? t * 2 : (1 - t) * 2;
                ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
                ctx.fillRect(0, 0, this.width, this.height);
                break;
                
            case 'circle':
                const maxRadius = Math.sqrt(this.width * this.width + this.height * this.height) / 2;
                const radius = t < 0.5 
                    ? maxRadius * (1 - t * 2)
                    : maxRadius * ((t - 0.5) * 2);
                
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.rect(0, 0, this.width, this.height);
                ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2, true);
                ctx.fill('evenodd');
                break;
                
            case 'wipe':
                const wipeWidth = t < 0.5 
                    ? this.width * (t * 2)
                    : this.width * (1 - (t - 0.5) * 2);
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, wipeWidth, this.height);
                break;
                
            case 'pixelate':
                // Pixelation handled in post-processing
                break;
                
            case 'slide':
                const slideOffset = t < 0.5
                    ? this.width * (t * 2)
                    : this.width * (1 - (t - 0.5) * 2);
                ctx.fillStyle = '#000';
                ctx.fillRect(this.width - slideOffset, 0, slideOffset, this.height);
                break;
        }
    }

    // Camera actions
    follow(target) {
        this.followTarget = target;
    }

    stopFollow() {
        this.followTarget = null;
    }

    moveTo(x, y, instant = false) {
        this.targetX = x - this.width / 2;
        this.targetY = y - this.height / 2;
        if (instant) {
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }

    setZoom(zoom, instant = false) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        if (instant) {
            this.zoom = this.targetZoom;
        }
    }

    shake(intensity, duration = 0.3) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    doFlash(color = [1, 1, 1], duration = 0.2) {
        this.flash.active = true;
        this.flash.color = color;
        this.flash.alpha = 1;
        this.flash.duration = duration;
    }

    startSlowMotion(factor = 0.3, duration = 1) {
        this.slowMotion.active = true;
        this.slowMotion.factor = factor;
        this.slowMotion.duration = duration;
    }

    transition(type, duration, callback) {
        this.transitioning = true;
        this.transitionType = type;
        this.transitionDuration = duration;
        this.transitionProgress = 0;
        this.transitionCallback = callback;
    }

    // Get visible bounds for culling
    getVisibleBounds() {
        const invZoom = 1 / this.zoom;
        const halfWidth = (this.width / 2) * invZoom;
        const halfHeight = (this.height / 2) * invZoom;
        
        return {
            left: this.x + this.width / 2 - halfWidth,
            right: this.x + this.width / 2 + halfWidth,
            top: this.y + this.height / 2 - halfHeight,
            bottom: this.y + this.height / 2 + halfHeight
        };
    }

    // Convert screen to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.width / 2) / this.zoom + this.x + this.width / 2,
            y: (screenY - this.height / 2) / this.zoom + this.y + this.height / 2
        };
    }

    // Convert world to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x - this.width / 2) * this.zoom + this.width / 2,
            y: (worldY - this.y - this.height / 2) * this.zoom + this.height / 2
        };
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = { x: 0, y: 0 };
        this.followTarget = null;
        this.transitioning = false;
        this.flash.active = false;
        this.slowMotion.active = false;
    }
}

export default Camera;
