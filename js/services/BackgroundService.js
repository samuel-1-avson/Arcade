/**
 * BackgroundService - Dynamic AAA Background System
 * Uses Three.js to render an interactive particle void with cyber-aesthetics
 */
class BackgroundService {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.grid = null;
        this.canvas = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.paused = false;
        this.isZooming = false;
        this.initialized = false;
        
        // Color Palette (Cyberpunk/Neon)
        this.colors = {
            bg: 0x050510,
            grid: 0x00ff88,
            particles: [0x00ffff, 0xff00ff, 0x00ff88]
        };

        // Bind loop to conserve context
        this.animate = this.animate.bind(this);
    }

    async init() {
        if (this.initialized) return;

        // Create canvas container
        const container = document.createElement('div');
        container.id = 'webgl-background';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '-1';
        container.style.pointerEvents = 'none'; // Let clicks pass through
        container.style.background = 'radial-gradient(circle at center, #1a1a2e 0%, #050510 100%)'; // Fallback / Blend
        container.style.opacity = '0'; // Fade in
        container.style.transition = 'opacity 2.5s ease-out';
        document.body.prepend(container);

        // Wait for Three.js to be available
        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded yet, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
            if (typeof THREE === 'undefined') {
                console.error('Three.js failed to load. Ensure the script is included in index.html');
                return;
            }
        }

        // Setup Scene
        this.scene = new THREE.Scene();
        // Add deep fog for boundless feel
        this.scene.fog = new THREE.FogExp2(this.colors.bg, 0.0015);

        // Setup Camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.z = 400;
        this.camera.position.y = 100;

        // Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);
        this.canvas = this.renderer.domElement;

        // Create Visual Elements
        this.createStarfield();
        this.createCyberGrid();
        this.createFloatingGeometry();

        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('mousemove', (e) => this.onDocumentMouseMove(e), false);

        // Performance: Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            this.setPaused(document.hidden);
        });

        // Start Loop
        this.initialized = true;
        this.animate();

        // Reveal
        setTimeout(() => {
            container.style.opacity = '1';
        }, 100);

        console.log('BackgroundService initialized with AAA visuals');
    }

    createStarfield() {
        const geometry = new THREE.BufferGeometry();
        const count = 3000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Spread far and wide
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

            // Pick a random cyber color
            const colorHex = this.colors.particles[Math.floor(Math.random() * this.colors.particles.length)];
            const color = new THREE.Color(colorHex);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Random size
            sizes[i] = Math.random() * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            map: this.createGlowTexture(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createCyberGrid() {
        const size = 2000;
        const divisions = 40;
        
        // Custom Grid
        const geometry = new THREE.BufferGeometry();
        const points = [];

        // Create a moving potential grid floor
        const gridHelper = new THREE.GridHelper(size, divisions, this.colors.grid, 0x222244);
        gridHelper.position.y = -200;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.15;
        this.grid = gridHelper;
        this.scene.add(this.grid);
        
        // Setup a simplified "Ceiling" grid for depth
        const gridCeil = new THREE.GridHelper(size, divisions, this.colors.grid, 0x222244);
        gridCeil.position.y = 400;
        gridCeil.material.transparent = true;
        gridCeil.material.opacity = 0.05;
        this.scene.add(gridCeil);
    }

    createFloatingGeometry() {
        // Add some floating icosahedrons for "Data Structure" feel
        const geometry = new THREE.IcosahedronGeometry(10, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.colors.grid, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.1 
        });

        this.floaters = [];
        for(let i = 0; i < 5; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 600
            );
            mesh.userData = {
                rotSpeed: (Math.random() * 0.002) + 0.001,
                floatSpeed: (Math.random() * 0.05) + 0.01,
                yOffset: Math.random() * Math.PI * 2
            };
            // Scale randomizer
            const scale = 1 + Math.random() * 3;
            mesh.scale.set(scale, scale, scale);
            
            this.scene.add(mesh);
            this.floaters.push(mesh);
        }
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onDocumentMouseMove(event) {
        this.mouseX = (event.clientX - window.innerWidth / 2);
        this.mouseY = (event.clientY - window.innerHeight / 2);
    }

    animate() {
        if (this.paused) return;
        requestAnimationFrame(this.animate);

        // Smooth camera movement
        this.targetX = this.mouseX * 0.05;
        this.targetY = this.mouseY * 0.05;

        // Lerp camera position
        this.camera.position.x += (this.targetX - this.camera.position.x) * 0.02;
        this.camera.position.y += (-this.targetY + 100 - this.camera.position.y) * 0.02;
        this.camera.lookAt(this.scene.position);

        // Rotate scene elements
        if (this.particles) {
            this.particles.rotation.y += 0.0003;
        }

        if (this.grid) {
            // Endless scrolling grid illusion
            this.grid.position.z = (Date.now() * 0.02) % 100;
        }

        // Animate floating geometry
        if (this.floaters) {
            this.floaters.forEach(mesh => {
                mesh.rotation.x += mesh.userData.rotSpeed;
                mesh.rotation.y += mesh.userData.rotSpeed;
                // Bobbing motion
                mesh.position.y += Math.sin(Date.now() * 0.001 + mesh.userData.yOffset) * 0.2;
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    setPaused(isPaused) {
        if (this.paused === isPaused) return;
        this.paused = isPaused;
        
        if (!isPaused) {
            this.animate();
        }
    }

    /**
     * Change background theme based on game
     * @param {string} gameId 
     */
    setTheme(gameId) {
        const themes = {
            'snake': { grid: 0x00ff88, particles: [0x00ff88, 0x004422], fog: 0x051005 },
            'tetris': { grid: 0x0088ff, particles: [0x0088ff, 0x00ffff], fog: 0x050510 },
            'pacman': { grid: 0xffd700, particles: [0xffd700, 0xffaa00], fog: 0x101000 },
            'breakout': { grid: 0xff4444, particles: [0xff4444, 0xff0044], fog: 0x100505 },
            'asteroids': { grid: 0xcccccc, particles: [0xeeeeee, 0x888888], fog: 0x050505 },
            'tower-defense': { grid: 0xffaa00, particles: [0xffaa00, 0xff4400], fog: 0x100a00 },
            'default': { grid: 0x00ff88, particles: [0x00ffff, 0xff00ff, 0x00ff88], fog: 0x050510 }
        };

        const theme = themes[gameId] || themes.default;
        
        // Smoothly transition colors
        this._transitionToTheme(theme);
    }

    _transitionToTheme(theme) {
        if (!this.initialized) return;

        // Transition Grid Color
        if (this.grid) {
            this.grid.material.color.setHex(theme.grid);
        }

        // Transition Fog
        if (this.scene.fog) {
            this.scene.fog.color.setHex(theme.fog);
        }

        // Transition Particles (Update attribute)
        if (this.particles) {
            const colors = this.particles.geometry.attributes.color.array;
            const targetColor = new THREE.Color(theme.particles[0]);
            
            for (let i = 0; i < colors.length; i += 3) {
                // Random variation from theme colors
                const c = new THREE.Color(theme.particles[Math.floor(Math.random() * theme.particles.length)]);
                colors[i] = c.r;
                colors[i + 1] = c.g;
                colors[i + 2] = c.b;
            }
            this.particles.geometry.attributes.color.needsUpdate = true;
        }

        // Transition floaters
        if (this.floaters) {
            this.floaters.forEach(mesh => {
                mesh.material.color.setHex(theme.grid);
            });
        }
    }

    zoomIn() {
        this.isZooming = true;
        // Tween camera Z to 0 (fly into grid)
        const startZ = this.camera.position.z;
        const startTime = Date.now();
        const duration = 1500;

        const animateZoom = () => {
            if (!this.isZooming) return;
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease in out cubic
            const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            this.camera.position.z = startZ - (startZ * ease) + 50; // Stop at z=50

            if (progress < 1) {
                requestAnimationFrame(animateZoom);
            }
        };
        animateZoom();
    }

    zoomOut() {
        this.isZooming = false;
        // Tween back to original 400
        const startZ = this.camera.position.z;
        const targetZ = 400;
        const startTime = Date.now();
        const duration = 1000;

        const animateZoom = () => {
            if (this.isZooming) return; // Interrupted
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Cubic out
            
            this.camera.position.z = startZ + (targetZ - startZ) * ease;

            if (progress < 1) {
                requestAnimationFrame(animateZoom);
            }
        };
        animateZoom();
    }
}

export const backgroundService = new BackgroundService();
export default BackgroundService;
