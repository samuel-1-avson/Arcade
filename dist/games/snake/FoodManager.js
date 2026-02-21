export class FoodManager {
    constructor(scene, gridSize) {
        this.scene = scene;
        this.gridSize = gridSize || 50; // Total size (-25 to 25)
        this.foodMesh = null;
        this.particles = [];
        this.foodPosition = new THREE.Vector3(0, 0, 0);
        
        this.initFoodMesh();
        this.spawn();
    }

    initFoodMesh() {
        const geometry = new THREE.IcosahedronGeometry(0.8, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff3333,
            emissive: 0xaa0000,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.8
        });
        
        this.foodMesh = new THREE.Mesh(geometry, material);
        this.foodMesh.castShadow = true;
        
        // Add a point light to the food for glow
        const light = new THREE.PointLight(0xff0000, 1, 10);
        this.foodMesh.add(light);
        
        this.scene.add(this.foodMesh);
    }

    spawn(snakeSegments = []) {
        let validPosition = false;
        const halfGrid = 20; // Keep it slightly away from edges (50/2 - buffer)
        
        while (!validPosition) {
            // Random position
            const x = Math.floor((Math.random() - 0.5) * halfGrid * 2);
            const z = Math.floor((Math.random() - 0.5) * halfGrid * 2);
            
            this.foodPosition.set(x, 0.5, z);
            
            // Check if inside snake
            // Simple distance check against all segments
            validPosition = true;
            for (const segment of snakeSegments) {
                if (segment.position.distanceTo(this.foodPosition) < 2) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        this.foodMesh.position.copy(this.foodPosition);
        
        // Reset animation
        this.foodMesh.scale.set(0, 0, 0);
    }

    update(deltaTime) {
        // Rotate food
        if (this.foodMesh) {
            this.foodMesh.rotation.y += 2 * deltaTime;
            this.foodMesh.rotation.z += 1 * deltaTime;
            
            // Bobbing animation
            this.foodMesh.position.y = 0.5 + Math.sin(performance.now() * 0.005) * 0.2;
            
            // Spawn pop-in animation
            this.foodMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 10 * deltaTime);
        }
    }

    getPosition() {
        return this.foodPosition;
    }
}
