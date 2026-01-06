export class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.target = new THREE.Vector3(0, 0, 0);
        
        // Settings
        this.distance = 15;
        this.height = 12;
        this.smoothness = 0.1; // Lower is smoother/slower
        this.lookAhead = 2.0;

        // Initial Position
        this.camera.position.set(0, this.height, this.distance);
        this.camera.lookAt(this.target);
    }

    update(deltaTime, targetPosition) {
        if (!targetPosition) return;

        // Desired Position (Third Person styling)
        // We want the camera to be behind and above the target.
        // For a simple start, we'll keep a fixed offset but smooth the transition.
        
        // Ideally, we'd base this on the snake's direction, but for "free movement" foundation
        // we will start with a fixed world-space offset, then evolve to direction-based.
        
        const desiredX = targetPosition.x;
        const desiredY = targetPosition.y + this.height;
        const desiredZ = targetPosition.z + this.distance;

        // Smoothly interpolate current camera position to desired position
        this.camera.position.x += (desiredX - this.camera.position.x) * (this.smoothness * 60 * deltaTime);
        this.camera.position.y += (desiredY - this.camera.position.y) * (this.smoothness * 60 * deltaTime);
        this.camera.position.z += (desiredZ - this.camera.position.z) * (this.smoothness * 60 * deltaTime);

        // Look at target
        this.camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
    }
}
