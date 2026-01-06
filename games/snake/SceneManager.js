import { CameraController } from './CameraController.js';

export class SceneManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f0a); // Dark background
        this.scene.fog = new THREE.FogExp2(0x0a0f0a, 0.02);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.cameraController = new CameraController(this.camera);

        this.setupLights();
        this.setupEnvironment();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // Add some colored lights for "cyber" feel
        const purpleLight = new THREE.PointLight(0xaa00ff, 0.5, 20);
        purpleLight.position.set(-10, 5, -10);
        this.scene.add(purpleLight);

        const blueLight = new THREE.PointLight(0x00aaff, 0.5, 20);
        blueLight.position.set(10, 5, 10);
        this.scene.add(blueLight);
    }

    setupEnvironment() {
        // Grid Floor
        const gridHelper = new THREE.GridHelper(50, 50, 0x00ff88, 0x1a3a1a);
        this.scene.add(gridHelper);

        // Floor Plane (invisible but receives shadows)
        const planeGeometry = new THREE.PlaneGeometry(500, 500);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.1;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }

    onWindowResize() {
        // Handle resizing if the container changes size (not implemented fully for fixed canvas yet)
        // keeping mostly static for now as per existing canvas logic, 
        // but robust implementation would go here.
    }

    update(deltaTime, targetPosition) {
        this.cameraController.update(deltaTime, targetPosition);
        this.renderer.render(this.scene, this.camera);
    }
}
