/**
 * Snake Game - Physics System
 * Smooth movement, momentum, and enhanced physics
 */

export class PhysicsSystem {
    constructor(gridSize, cellSize) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        
        // Movement interpolation
        this.visualPositions = [];
        this.moveProgress = 0;
        this.previousPositions = [];
        
        // Momentum
        this.momentum = 0;
        this.maxMomentum = 1;
        this.momentumDecay = 0.95;
        this.momentumGain = 0.1;
        
        // Food physics
        this.foodPhysics = {
            x: 0, y: 0,
            vx: 0, vy: 0,
            targetX: 0, targetY: 0,
            bounceHeight: 0,
            bouncePhase: 0
        };
        
        // Environmental effects
        this.gravity = 0;
        this.friction = 0.98;
        this.bounciness = 0.7;
    }

    // Initialize visual positions from snake array
    initializeFromSnake(snake) {
        this.visualPositions = snake.map(seg => ({
            x: seg.x * this.cellSize + this.cellSize / 2,
            y: seg.y * this.cellSize + this.cellSize / 2,
            targetX: seg.x * this.cellSize + this.cellSize / 2,
            targetY: seg.y * this.cellSize + this.cellSize / 2
        }));
        
        this.previousPositions = snake.map(seg => ({
            x: seg.x,
            y: seg.y
        }));
    }

    // Update visual positions with smooth interpolation
    updateVisualPositions(snake, dt, moveProgress) {
        // Ensure we have enough visual positions
        while (this.visualPositions.length < snake.length) {
            const lastSeg = snake[this.visualPositions.length] || snake[snake.length - 1];
            this.visualPositions.push({
                x: lastSeg.x * this.cellSize + this.cellSize / 2,
                y: lastSeg.y * this.cellSize + this.cellSize / 2,
                targetX: lastSeg.x * this.cellSize + this.cellSize / 2,
                targetY: lastSeg.y * this.cellSize + this.cellSize / 2
            });
        }
        
        // Trim excess positions
        while (this.visualPositions.length > snake.length) {
            this.visualPositions.pop();
        }

        // Update each segment
        for (let i = 0; i < snake.length; i++) {
            const seg = snake[i];
            const vis = this.visualPositions[i];
            
            // Calculate target position in pixels
            const targetX = seg.x * this.cellSize + this.cellSize / 2;
            const targetY = seg.y * this.cellSize + this.cellSize / 2;
            
            vis.targetX = targetX;
            vis.targetY = targetY;
            
            // Smooth interpolation
            const smoothing = i === 0 ? 15 : 12 - (i * 0.5); // Head moves faster
            vis.x += (targetX - vis.x) * smoothing * dt;
            vis.y += (targetY - vis.y) * smoothing * dt;
        }
        
        return this.visualPositions;
    }

    // Get interpolated position for rendering
    getInterpolatedPosition(index, t) {
        if (index >= this.visualPositions.length) return null;
        
        const vis = this.visualPositions[index];
        return {
            x: vis.x,
            y: vis.y
        };
    }

    // Update momentum based on continuous movement
    updateMomentum(isMoving, dt) {
        if (isMoving) {
            this.momentum = Math.min(this.maxMomentum, this.momentum + this.momentumGain * dt);
        } else {
            this.momentum *= this.momentumDecay;
        }
        return this.momentum;
    }

    // Get turn radius modifier based on momentum
    getTurnRadiusModifier() {
        // Higher momentum = wider turns (harder to turn sharply)
        return 1 + this.momentum * 0.5;
    }

    // Update food physics (floating/bouncing animation)
    updateFoodPhysics(food, dt) {
        const fp = this.foodPhysics;
        
        // Set target position
        fp.targetX = food.x * this.cellSize + this.cellSize / 2;
        fp.targetY = food.y * this.cellSize + this.cellSize / 2;
        
        // Smooth follow
        fp.x += (fp.targetX - fp.x) * 10 * dt;
        fp.y += (fp.targetY - fp.y) * 10 * dt;
        
        // Bouncing animation
        fp.bouncePhase += dt * 3;
        fp.bounceHeight = Math.sin(fp.bouncePhase) * 3;
        
        return {
            x: fp.x,
            y: fp.y + fp.bounceHeight
        };
    }

    // Wall bounce calculation (for bounce power-up)
    calculateWallBounce(position, velocity, bounds) {
        const result = {
            position: { ...position },
            velocity: { ...velocity },
            bounced: false
        };
        
        // Left/Right walls
        if (position.x < 0) {
            result.position.x = 0;
            result.velocity.x = Math.abs(velocity.x) * this.bounciness;
            result.bounced = true;
        } else if (position.x >= bounds.width) {
            result.position.x = bounds.width - 1;
            result.velocity.x = -Math.abs(velocity.x) * this.bounciness;
            result.bounced = true;
        }
        
        // Top/Bottom walls
        if (position.y < 0) {
            result.position.y = 0;
            result.velocity.y = Math.abs(velocity.y) * this.bounciness;
            result.bounced = true;
        } else if (position.y >= bounds.height) {
            result.position.y = bounds.height - 1;
            result.velocity.y = -Math.abs(velocity.y) * this.bounciness;
            result.bounced = true;
        }
        
        return result;
    }

    // Calculate wiggle effect for snake body
    calculateWiggle(index, time, totalLength) {
        const wiggleAmount = 2;
        const wiggleSpeed = 5;
        const wiggleDelay = 0.1;
        
        // Wiggle propagates from head to tail
        const phase = time * wiggleSpeed - index * wiggleDelay;
        const amplitude = wiggleAmount * (1 - index / totalLength * 0.5);
        
        return {
            x: Math.sin(phase) * amplitude,
            y: Math.cos(phase * 0.7) * amplitude * 0.5
        };
    }

    // Calculate stretch/squash on direction change
    calculateStretchSquash(index, direction, prevDirection, progress) {
        if (index !== 0 || direction === prevDirection) {
            return { scaleX: 1, scaleY: 1 };
        }
        
        // Stretch in movement direction, squash perpendicular
        const stretchAmount = 1 + (1 - progress) * 0.2;
        const squashAmount = 1 - (1 - progress) * 0.1;
        
        if (direction === 'LEFT' || direction === 'RIGHT') {
            return { scaleX: stretchAmount, scaleY: squashAmount };
        } else {
            return { scaleX: squashAmount, scaleY: stretchAmount };
        }
    }

    // Moving obstacle physics
    updateMovingObstacle(obstacle, dt) {
        if (!obstacle.path || obstacle.path.length < 2) return obstacle;
        
        obstacle.pathProgress = (obstacle.pathProgress || 0) + obstacle.speed * dt;
        
        if (obstacle.pathProgress >= 1) {
            obstacle.pathProgress = 0;
            obstacle.pathIndex = ((obstacle.pathIndex || 0) + 1) % obstacle.path.length;
        }
        
        const current = obstacle.path[obstacle.pathIndex || 0];
        const next = obstacle.path[(obstacle.pathIndex + 1) % obstacle.path.length];
        
        // Linear interpolation between path points
        obstacle.x = current.x + (next.x - current.x) * obstacle.pathProgress;
        obstacle.y = current.y + (next.y - current.y) * obstacle.pathProgress;
        
        return obstacle;
    }

    // Rotating obstacle physics
    updateRotatingObstacle(obstacle, dt) {
        obstacle.angle = (obstacle.angle || 0) + obstacle.speed * dt;
        
        // Calculate position on circle
        obstacle.x = obstacle.center.x + Math.cos(obstacle.angle) * obstacle.radius;
        obstacle.y = obstacle.center.y + Math.sin(obstacle.angle) * obstacle.radius;
        
        return obstacle;
    }

    // Falling hazard physics
    updateFallingHazard(hazard, dt) {
        if (!hazard.active) {
            hazard.timer = (hazard.timer || 0) + dt;
            if (hazard.timer >= hazard.interval) {
                hazard.active = true;
                hazard.timer = 0;
                hazard.y = 0;
                hazard.vy = 0;
            }
            return hazard;
        }
        
        // Apply gravity
        hazard.vy += this.gravity * dt;
        hazard.y += hazard.vy * dt;
        
        // Check ground collision
        if (hazard.y >= this.gridSize) {
            hazard.active = false;
            hazard.y = hazard.originalY;
        }
        
        return hazard;
    }

    // Conveyor belt effect
    applyConveyorEffect(snake, conveyors) {
        const head = snake[0];
        
        for (const conveyor of conveyors) {
            if (head.x === conveyor.x && head.y === conveyor.y) {
                return conveyor.direction; // Return forced direction
            }
        }
        
        return null;
    }

    // Calculate bezier curve for smooth snake body
    calculateBezierPoint(p0, p1, p2, p3, t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        
        return {
            x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        };
    }

    // Generate smooth snake body curve
    generateSnakeCurve(visualPositions, segmentCount = 3) {
        if (visualPositions.length < 2) return visualPositions;
        
        const curve = [];
        
        for (let i = 0; i < visualPositions.length - 1; i++) {
            const p0 = visualPositions[Math.max(0, i - 1)];
            const p1 = visualPositions[i];
            const p2 = visualPositions[i + 1];
            const p3 = visualPositions[Math.min(visualPositions.length - 1, i + 2)];
            
            for (let j = 0; j < segmentCount; j++) {
                const t = j / segmentCount;
                curve.push(this.calculateBezierPoint(p0, p1, p2, p3, t));
            }
        }
        
        // Add final point
        curve.push(visualPositions[visualPositions.length - 1]);
        
        return curve;
    }

    reset() {
        this.visualPositions = [];
        this.previousPositions = [];
        this.momentum = 0;
        this.foodPhysics = {
            x: 0, y: 0,
            vx: 0, vy: 0,
            targetX: 0, targetY: 0,
            bounceHeight: 0,
            bouncePhase: 0
        };
    }
}

export default PhysicsSystem;
