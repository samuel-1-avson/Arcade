export class SnakeController {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.pathHistory = []; // Stores {position, rotation}
        this.speed = 12;
        this.turnSpeed = 4.0;
        this.direction = new THREE.Vector3(1, 0, 0); 
        this.position = new THREE.Vector3(0, 0.5, 0);
        this.segmentSpacing = 5; // How many history frames behind is the next segment
        this.isDead = false;

        // Input State
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            s: false,
            a: false,
            d: false
        };

        this.initSnake();
        this.setupInput();
    }

    initSnake() {
        // Create Head
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff88,
            emissive: 0x003311,
            roughness: 0.2,
            metalness: 0.5
        });
        
        this.head = new THREE.Mesh(geometry, material);
        this.head.castShadow = true;
        this.head.receiveShadow = true;
        this.head.position.copy(this.position);
        
        this.scene.add(this.head);
        this.segments.push(this.head);

        // Add Eyes
        this.addEyes();
        
        // Initial growth
        this.grow();
        this.grow();
    }

    addEyes() {
        const eyeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(0.3, 0.2, 0.45); 
        this.head.add(leftEye); 

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.3, 0.2, -0.45);
        this.head.add(rightEye);
    }

    grow() {
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00cc66,
            roughness: 0.3,
            metalness: 0.4
        });
        
        const segment = new THREE.Mesh(geometry, material);
        segment.castShadow = true;
        segment.receiveShadow = true;
        
        // Start position at the last segment's position (or head)
        const lastParams = this.segments[this.segments.length - 1];
        segment.position.copy(lastParams.position);
        
        this.scene.add(segment);
        this.segments.push(segment);
    }

    setupInput() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    handleInput(deltaTime) {
        if (this.isDead) return;
        const turnAmount = this.turnSpeed * deltaTime;

        // Left/Right turning
        if (this.keys.ArrowLeft || this.keys.a) {
            this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), turnAmount);
        }
        if (this.keys.ArrowRight || this.keys.d) {
            this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -turnAmount);
        }
    }

    update(deltaTime) {
        if (this.isDead) return;
        
        this.handleInput(deltaTime);

        // Move Head
        const moveDistance = this.speed * deltaTime;
        const velocity = this.direction.clone().multiplyScalar(moveDistance);
        this.position.add(velocity);
        this.head.position.copy(this.position);
        this.head.lookAt(this.position.clone().add(this.direction));

        // Record History
        // We push to the front of the array
        this.pathHistory.unshift({
            position: this.position.clone(),
            rotation: this.head.quaternion.clone()
        });

        // Limit history size to save memory
        // Size needs to cover all segments: numSegments * spacing
        const maxHistory = this.segments.length * this.segmentSpacing + 10;
        if (this.pathHistory.length > maxHistory) {
            this.pathHistory.length = maxHistory;
        }

        // Update Body Segments
        for (let i = 1; i < this.segments.length; i++) {
            const historyIndex = i * this.segmentSpacing;
            
            if (historyIndex < this.pathHistory.length) {
                const point = this.pathHistory[historyIndex];
                const segment = this.segments[i];
                
                segment.position.copy(point.position);
                segment.quaternion.copy(point.rotation);
            }
        }
    }

    checkCollision(bounds) {
        if (this.isDead) return false;

        // 1. Wall Collision
        if (Math.abs(this.position.x) > bounds || Math.abs(this.position.z) > bounds) {
            this.die();
            return true;
        }

        // 2. Self Collision
        // Ignore the first few segments (head + neck)
        for (let i = 4; i < this.segments.length; i++) {
            if (this.position.distanceTo(this.segments[i].position) < 1.0) {
                this.die();
                return true;
            }
        }
        
        return false;
    }

    die() {
        this.isDead = true;
        // Visual effect: turn red
        this.head.material.color.setHex(0xff0000);
        this.head.material.emissive.setHex(0xff0000);
    }

    getPosition() {
        return this.position;
    }
}
