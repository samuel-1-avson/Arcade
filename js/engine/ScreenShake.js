/**
 * ScreenShake - Universal screen shake effects for AAA juice
 * Drop-in module for any game extending GameEngine
 */

class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.timer = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.decay = 0.9;
        this.frequency = 30; // Shake frequency in Hz
    }

    /**
     * Trigger a screen shake
     * @param {number} intensity - Shake magnitude in pixels (2-20 recommended)
     * @param {number} duration - Duration in seconds
     */
    shake(intensity = 5, duration = 0.2) {
        // Allow stacking but cap intensity
        this.intensity = Math.min(this.intensity + intensity, 30);
        this.duration = Math.max(this.duration, duration);
        this.timer = this.duration;
    }

    /**
     * Trigger preset shake effects
     */
    light() { this.shake(3, 0.1); }
    medium() { this.shake(8, 0.2); }
    heavy() { this.shake(15, 0.3); }
    explosion() { this.shake(20, 0.4); }

    /**
     * Update shake state
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.timer <= 0) {
            this.offsetX = 0;
            this.offsetY = 0;
            this.intensity = 0;
            return;
        }

        this.timer -= dt;

        // Decay intensity over time
        const progress = this.timer / this.duration;
        const currentIntensity = this.intensity * progress;

        // Generate offset with randomness
        const angle = Math.random() * Math.PI * 2;
        this.offsetX = Math.cos(angle) * currentIntensity * (Math.random() * 0.5 + 0.5);
        this.offsetY = Math.sin(angle) * currentIntensity * (Math.random() * 0.5 + 0.5);
    }

    /**
     * Apply shake transform to canvas context
     * Call before rendering
     * @param {CanvasRenderingContext2D} ctx
     */
    apply(ctx) {
        if (this.intensity > 0) {
            ctx.translate(this.offsetX, this.offsetY);
        }
    }

    /**
     * Reset shake transform
     * Call after rendering
     * @param {CanvasRenderingContext2D} ctx
     */
    reset(ctx) {
        if (this.intensity > 0) {
            ctx.translate(-this.offsetX, -this.offsetY);
        }
    }

    /**
     * Check if currently shaking
     * @returns {boolean}
     */
    get isShaking() {
        return this.timer > 0;
    }

    /**
     * Clear all shaking
     */
    clear() {
        this.timer = 0;
        this.intensity = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}

export { ScreenShake };
export default ScreenShake;
