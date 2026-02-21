/**
 * Collision detection utilities
 */

/**
 * Check if a point is inside a rectangle
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} rx - Rect X
 * @param {number} ry - Rect Y
 * @param {number} rw - Rect Width
 * @param {number} rh - Rect Height
 * @returns {boolean}
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Check if a point is inside a circle
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} cx - Circle center X
 * @param {number} cy - Circle center Y
 * @param {number} radius - Circle radius
 * @returns {boolean}
 */
export function pointInCircle(px, py, cx, cy, radius) {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
}

/**
 * AABB (Axis-Aligned Bounding Box) collision
 * @param {Object} a - First rectangle { x, y, width, height }
 * @param {Object} b - Second rectangle { x, y, width, height }
 * @returns {boolean}
 */
export function rectRect(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Circle-Circle collision
 * @param {Object} a - First circle { x, y, radius }
 * @param {Object} b - Second circle { x, y, radius }
 * @returns {boolean}
 */
export function circleCircle(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distSquared = dx * dx + dy * dy;
    const radiusSum = a.radius + b.radius;
    return distSquared <= radiusSum * radiusSum;
}

/**
 * Circle-Rectangle collision
 * @param {Object} circle - Circle { x, y, radius }
 * @param {Object} rect - Rectangle { x, y, width, height }
 * @returns {boolean}
 */
export function circleRect(circle, rect) {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Check if that point is inside the circle
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
}

/**
 * Line-Line intersection
 * @param {number} x1 - Line 1 start X
 * @param {number} y1 - Line 1 start Y
 * @param {number} x2 - Line 1 end X
 * @param {number} y2 - Line 1 end Y
 * @param {number} x3 - Line 2 start X
 * @param {number} y3 - Line 2 start Y
 * @param {number} x4 - Line 2 end X
 * @param {number} y4 - Line 2 end Y
 * @returns {Object|null} Intersection point { x, y } or null
 */
export function lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    if (denominator === 0) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }

    return null;
}

/**
 * Line-Rectangle intersection
 * @param {number} x1 - Line start X
 * @param {number} y1 - Line start Y
 * @param {number} x2 - Line end X
 * @param {number} y2 - Line end Y
 * @param {Object} rect - Rectangle { x, y, width, height }
 * @returns {boolean}
 */
export function lineRect(x1, y1, x2, y2, rect) {
    const { x, y, width, height } = rect;

    // Check all four sides
    const left = lineLineIntersection(x1, y1, x2, y2, x, y, x, y + height);
    const right = lineLineIntersection(x1, y1, x2, y2, x + width, y, x + width, y + height);
    const top = lineLineIntersection(x1, y1, x2, y2, x, y, x + width, y);
    const bottom = lineLineIntersection(x1, y1, x2, y2, x, y + height, x + width, y + height);

    return !!(left || right || top || bottom);
}

/**
 * Check if point is on a line segment
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} x1 - Line start X
 * @param {number} y1 - Line start Y
 * @param {number} x2 - Line end X
 * @param {number} y2 - Line end Y
 * @param {number} [tolerance=1] - Distance tolerance
 * @returns {boolean}
 */
export function pointOnLine(px, py, x1, y1, x2, y2, tolerance = 1) {
    const d1 = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    const d2 = Math.sqrt((px - x2) ** 2 + (py - y2) ** 2);
    const lineLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return d1 + d2 >= lineLen - tolerance && d1 + d2 <= lineLen + tolerance;
}

/**
 * Get collision response for circle-rectangle
 * Returns the penetration vector to resolve the collision
 * @param {Object} circle - Circle { x, y, radius }
 * @param {Object} rect - Rectangle { x, y, width, height }
 * @returns {Object|null} Penetration vector { x, y } or null if no collision
 */
export function circleRectResponse(circle, rect) {
    if (!circleRect(circle, rect)) return null;

    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
        // Circle center is inside rectangle, push out the shortest way
        const halfWidth = rect.width / 2;
        const halfHeight = rect.height / 2;
        const centerX = rect.x + halfWidth;
        const centerY = rect.y + halfHeight;
        
        const overlapX = halfWidth + circle.radius - Math.abs(circle.x - centerX);
        const overlapY = halfHeight + circle.radius - Math.abs(circle.y - centerY);

        if (overlapX < overlapY) {
            return {
                x: (circle.x < centerX ? -overlapX : overlapX),
                y: 0
            };
        } else {
            return {
                x: 0,
                y: (circle.y < centerY ? -overlapY : overlapY)
            };
        }
    }

    const overlap = circle.radius - distance;
    return {
        x: (dx / distance) * overlap,
        y: (dy / distance) * overlap
    };
}

/**
 * Broad phase collision check using spatial grid
 */
export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = new Map();
    }

    clear() {
        this.cells.clear();
    }

    _getCellKey(col, row) {
        return `${col},${row}`;
    }

    insert(entity) {
        const startCol = Math.floor(entity.x / this.cellSize);
        const endCol = Math.floor((entity.x + (entity.width || entity.radius * 2 || 0)) / this.cellSize);
        const startRow = Math.floor(entity.y / this.cellSize);
        const endRow = Math.floor((entity.y + (entity.height || entity.radius * 2 || 0)) / this.cellSize);

        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const key = this._getCellKey(col, row);
                if (!this.cells.has(key)) {
                    this.cells.set(key, []);
                }
                this.cells.get(key).push(entity);
            }
        }
    }

    getNearby(entity) {
        const nearby = new Set();
        const startCol = Math.floor(entity.x / this.cellSize);
        const endCol = Math.floor((entity.x + (entity.width || entity.radius * 2 || 0)) / this.cellSize);
        const startRow = Math.floor(entity.y / this.cellSize);
        const endRow = Math.floor((entity.y + (entity.height || entity.radius * 2 || 0)) / this.cellSize);

        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const key = this._getCellKey(col, row);
                const cell = this.cells.get(key);
                if (cell) {
                    cell.forEach(e => {
                        if (e !== entity) nearby.add(e);
                    });
                }
            }
        }

        return [...nearby];
    }
}

export default {
    pointInRect,
    pointInCircle,
    rectRect,
    circleCircle,
    circleRect,
    lineLineIntersection,
    lineRect,
    pointOnLine,
    circleRectResponse,
    SpatialGrid
};
