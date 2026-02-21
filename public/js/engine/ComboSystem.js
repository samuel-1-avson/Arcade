/**
 * ComboSystem - Universal combo multiplier for AAA scoring
 * Drop-in module for any game extending GameEngine
 */

class ComboSystem {
    constructor(options = {}) {
        // Configuration
        this.decayTime = options.decayTime || 2.0;    // Seconds before combo resets
        this.maxMultiplier = options.maxMultiplier || 10;
        this.hitsPerLevel = options.hitsPerLevel || 3; // Hits needed per multiplier level

        // State
        this.combo = 0;
        this.multiplier = 1;
        this.timer = 0;
        this.highestCombo = 0;
        this.totalBonus = 0;

        // Callbacks
        this.onComboIncrease = null;
        this.onMultiplierChange = null;
        this.onComboBreak = null;
    }

    /**
     * Register a hit to increase combo
     * @param {number} basePoints - Base points before multiplier
     * @returns {number} Points after multiplier
     */
    hit(basePoints = 100) {
        this.combo++;
        this.timer = this.decayTime;

        // Calculate new multiplier
        const newMultiplier = Math.min(
            Math.floor(this.combo / this.hitsPerLevel) + 1,
            this.maxMultiplier
        );

        // Track multiplier changes
        if (newMultiplier > this.multiplier) {
            this.multiplier = newMultiplier;
            if (this.onMultiplierChange) {
                this.onMultiplierChange(this.multiplier, this.combo);
            }
        }

        // Track highest combo
        if (this.combo > this.highestCombo) {
            this.highestCombo = this.combo;
        }

        // Calculate bonus
        const multipliedPoints = Math.floor(basePoints * this.multiplier);
        const bonusPoints = multipliedPoints - basePoints;
        this.totalBonus += bonusPoints;

        if (this.onComboIncrease) {
            this.onComboIncrease(this.combo, this.multiplier, multipliedPoints);
        }

        return multipliedPoints;
    }

    /**
     * Update combo timer
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.combo > 0) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.break();
            }
        }
    }

    /**
     * Break the combo
     */
    break() {
        if (this.combo > 0) {
            const brokenCombo = this.combo;
            const brokenMultiplier = this.multiplier;
            
            this.combo = 0;
            this.multiplier = 1;
            this.timer = 0;

            if (this.onComboBreak) {
                this.onComboBreak(brokenCombo, brokenMultiplier);
            }
        }
    }

    /**
     * Reset combo system
     */
    reset() {
        this.combo = 0;
        this.multiplier = 1;
        this.timer = 0;
        this.highestCombo = 0;
        this.totalBonus = 0;
    }

    /**
     * Get remaining time as percentage
     * @returns {number} 0-1
     */
    get timerProgress() {
        return this.timer / this.decayTime;
    }

    /**
     * Get progress to next multiplier
     * @returns {number} 0-1
     */
    get nextMultiplierProgress() {
        const comboInLevel = this.combo % this.hitsPerLevel;
        return comboInLevel / this.hitsPerLevel;
    }

    /**
     * Check if combo is active
     * @returns {boolean}
     */
    get isActive() {
        return this.combo > 0;
    }

    /**
     * Get combo stats for display
     * @returns {Object}
     */
    getStats() {
        return {
            combo: this.combo,
            multiplier: this.multiplier,
            timerProgress: this.timerProgress,
            highestCombo: this.highestCombo,
            totalBonus: this.totalBonus
        };
    }
}

export { ComboSystem };
export default ComboSystem;
