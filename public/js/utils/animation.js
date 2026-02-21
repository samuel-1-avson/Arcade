/**
 * Animation and easing utilities
 */

/**
 * Easing functions
 */
export const Easing = {
    // Linear
    linear: t => t,

    // Quadratic
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    // Cubic
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    // Quartic
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

    // Quintic
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

    // Sine
    easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: t => Math.sin(t * Math.PI / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

    // Exponential
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => {
        if (t === 0 || t === 1) return t;
        return t < 0.5
            ? Math.pow(2, 20 * t - 10) / 2
            : (2 - Math.pow(2, -20 * t + 10)) / 2;
    },

    // Circular
    easeInCirc: t => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: t => Math.sqrt(1 - (--t) * t),
    easeInOutCirc: t => t < 0.5
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

    // Back (overshoot)
    easeInBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },

    // Elastic
    easeInElastic: t => {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
    },
    easeOutElastic: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    easeInOutElastic: t => {
        if (t === 0 || t === 1) return t;
        return t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2 + 1;
    },

    // Bounce
    easeOutBounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
    easeInOutBounce: t => t < 0.5
        ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
        : (1 + Easing.easeOutBounce(2 * t - 1)) / 2
};

/**
 * Tween class for animating values over time
 */
export class Tween {
    constructor(target, properties, duration, options = {}) {
        this.target = target;
        this.properties = {};
        this.duration = duration;
        this.elapsed = 0;
        this.isComplete = false;
        this.isPaused = false;

        this.ease = options.ease || Easing.linear;
        this.delay = options.delay || 0;
        this.onUpdate = options.onUpdate || null;
        this.onComplete = options.onComplete || null;
        this.loop = options.loop || false;
        this.yoyo = options.yoyo || false;

        this._direction = 1;
        this._delayRemaining = this.delay;

        // Store start and end values
        for (const [key, value] of Object.entries(properties)) {
            this.properties[key] = {
                start: target[key],
                end: value,
                delta: value - target[key]
            };
        }
    }

    update(dt) {
        if (this.isComplete || this.isPaused) return false;

        // Handle delay
        if (this._delayRemaining > 0) {
            this._delayRemaining -= dt;
            return true;
        }

        this.elapsed += dt * this._direction;

        // Calculate progress
        let progress = Math.min(Math.max(this.elapsed / this.duration, 0), 1);
        const easedProgress = this.ease(progress);

        // Update all properties
        for (const [key, prop] of Object.entries(this.properties)) {
            this.target[key] = prop.start + prop.delta * easedProgress;
        }

        if (this.onUpdate) {
            this.onUpdate(this.target, progress);
        }

        // Check completion
        if (progress >= 1) {
            if (this.yoyo) {
                this._direction = -1;
                this.elapsed = this.duration;
            } else if (this.loop) {
                this.elapsed = 0;
            } else {
                this.isComplete = true;
                if (this.onComplete) {
                    this.onComplete(this.target);
                }
                return false;
            }
        } else if (progress <= 0 && this._direction === -1) {
            if (this.loop) {
                this._direction = 1;
            } else {
                this.isComplete = true;
                if (this.onComplete) {
                    this.onComplete(this.target);
                }
                return false;
            }
        }

        return true;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stop() {
        this.isComplete = true;
    }

    reset() {
        this.elapsed = 0;
        this.isComplete = false;
        this._direction = 1;
        this._delayRemaining = this.delay;

        for (const [key, prop] of Object.entries(this.properties)) {
            this.target[key] = prop.start;
        }
    }
}

/**
 * Tween manager for handling multiple tweens
 */
export class TweenManager {
    constructor() {
        this.tweens = [];
    }

    create(target, properties, duration, options = {}) {
        const tween = new Tween(target, properties, duration, options);
        this.tweens.push(tween);
        return tween;
    }

    update(dt) {
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            const tween = this.tweens[i];
            const active = tween.update(dt);
            if (!active) {
                this.tweens.splice(i, 1);
            }
        }
    }

    clear() {
        this.tweens = [];
    }

    pauseAll() {
        this.tweens.forEach(t => t.pause());
    }

    resumeAll() {
        this.tweens.forEach(t => t.resume());
    }
}

/**
 * Sprite animation helper
 */
export class SpriteAnimation {
    constructor(frames, frameDuration = 0.1) {
        this.frames = frames;
        this.frameDuration = frameDuration;
        this.currentFrame = 0;
        this.elapsed = 0;
        this.isPlaying = true;
        this.loop = true;
    }

    update(dt) {
        if (!this.isPlaying) return;

        this.elapsed += dt;
        if (this.elapsed >= this.frameDuration) {
            this.elapsed = 0;
            this.currentFrame++;

            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.isPlaying = false;
                }
            }
        }
    }

    getFrame() {
        return this.frames[this.currentFrame];
    }

    reset() {
        this.currentFrame = 0;
        this.elapsed = 0;
        this.isPlaying = true;
    }

    play() {
        this.isPlaying = true;
    }

    pause() {
        this.isPlaying = false;
    }
}

// Create singleton tween manager
export const tweenManager = new TweenManager();

export default {
    Easing,
    Tween,
    TweenManager,
    SpriteAnimation,
    tweenManager
};
