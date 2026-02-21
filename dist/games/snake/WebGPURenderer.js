/**
 * Snake Game - WebGPU Renderer
 * Modern GPU-accelerated rendering with WGSL shaders for optimal performance
 */

export class WebGPURenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.device = null;
        this.context = null;
        this.format = null;
        this.pipeline = null;
        this.initialized = false;
        
        // Buffers
        this.vertexBuffer = null;
        this.uniformBuffer = null;
        this.instanceBuffer = null;
        
        // Bind groups
        this.uniformBindGroup = null;
        
        // Render data
        this.instances = [];
        this.maxInstances = 2000;
        
        // Effects
        this.time = 0;
        this.screenShake = { x: 0, y: 0 };
        this.flashColor = [0, 0, 0, 0];
        
        // Post-processing
        this.bloomEnabled = true;
        this.vignetteEnabled = true;
        
        this.init();
    }
    
    async init() {
        // Check WebGPU support
        if (!navigator.gpu) {
            console.warn('WebGPU not supported, falling back to Canvas 2D');
            return false;
        }
        
        try {
            // Request adapter
            const adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance'
            });
            
            if (!adapter) {
                console.warn('No WebGPU adapter found');
                return false;
            }
            
            // Request device
            this.device = await adapter.requestDevice({
                requiredFeatures: [],
                requiredLimits: {}
            });
            
            // Get canvas context
            this.context = this.canvas.getContext('webgpu');
            if (!this.context) {
                console.warn('Could not get WebGPU context');
                return false;
            }
            
            // Configure canvas
            this.format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: 'premultiplied',
            });
            
            // Create shaders and pipelines
            await this.createShaders();
            await this.createBuffers();
            await this.createPipeline();
            
            this.initialized = true;
            console.log('WebGPU initialized successfully');
            return true;
            
        } catch (error) {
            console.error('WebGPU initialization failed:', error);
            return false;
        }
    }
    
    async createShaders() {
        // Vertex and Fragment shader in WGSL
        this.shaderModule = this.device.createShaderModule({
            label: 'Snake Game Shader',
            code: `
                // Uniforms
                struct Uniforms {
                    resolution: vec2f,
                    time: f32,
                    shake: vec2f,
                    flash: vec4f,
                    gridSize: f32,
                    cellSize: f32,
                    padding: f32,
                }
                
                @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                
                // Instance data for each rendered object
                struct Instance {
                    position: vec2f,
                    size: vec2f,
                    color: vec4f,
                    type: f32,      // 0=rect, 1=circle, 2=gradient, 3=glow
                    rotation: f32,
                    extra1: f32,
                    extra2: f32,
                }
                
                struct InstanceData {
                    instances: array<Instance>,
                }
                
                @group(0) @binding(1) var<storage, read> instanceData: InstanceData;
                
                struct VertexOutput {
                    @builtin(position) position: vec4f,
                    @location(0) uv: vec2f,
                    @location(1) color: vec4f,
                    @location(2) @interpolate(flat) instanceType: u32,
                    @location(3) localPos: vec2f,
                }
                
                @vertex
                fn vertexMain(
                    @builtin(vertex_index) vertexIndex: u32,
                    @builtin(instance_index) instanceIndex: u32
                ) -> VertexOutput {
                    let instance = instanceData.instances[instanceIndex];
                    
                    // Quad vertices (2 triangles)
                    var positions = array<vec2f, 6>(
                        vec2f(0.0, 0.0),
                        vec2f(1.0, 0.0),
                        vec2f(0.0, 1.0),
                        vec2f(1.0, 0.0),
                        vec2f(1.0, 1.0),
                        vec2f(0.0, 1.0)
                    );
                    
                    let localPos = positions[vertexIndex];
                    
                    // Apply instance transform
                    var worldPos = instance.position + localPos * instance.size;
                    
                    // Apply rotation if needed
                    if (instance.rotation != 0.0) {
                        let center = instance.position + instance.size * 0.5;
                        let offset = worldPos - center;
                        let c = cos(instance.rotation);
                        let s = sin(instance.rotation);
                        worldPos = center + vec2f(
                            offset.x * c - offset.y * s,
                            offset.x * s + offset.y * c
                        );
                    }
                    
                    // Apply screen shake
                    worldPos += uniforms.shake;
                    
                    // Convert to clip space (-1 to 1)
                    let clipPos = (worldPos / uniforms.resolution) * 2.0 - 1.0;
                    
                    var output: VertexOutput;
                    output.position = vec4f(clipPos.x, -clipPos.y, 0.0, 1.0);
                    output.uv = localPos;
                    output.color = instance.color;
                    output.instanceType = u32(instance.type);
                    output.localPos = localPos - 0.5; // Center for circle calculations
                    
                    return output;
                }
                
                @fragment
                fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
                    var color = input.color;
                    
                    // Different rendering based on type
                    switch (input.instanceType) {
                        case 0u: {
                            // Rectangle - solid color
                            // Add subtle border
                            let border = 0.02;
                            let edge = smoothstep(0.0, border, input.uv.x) * 
                                       smoothstep(0.0, border, input.uv.y) *
                                       smoothstep(0.0, border, 1.0 - input.uv.x) *
                                       smoothstep(0.0, border, 1.0 - input.uv.y);
                            color = mix(color * 0.7, color, edge);
                        }
                        case 1u: {
                            // Circle
                            let dist = length(input.localPos);
                            if (dist > 0.5) {
                                discard;
                            }
                            // Smooth edge
                            let alpha = 1.0 - smoothstep(0.4, 0.5, dist);
                            color.a *= alpha;
                        }
                        case 2u: {
                            // Gradient (radial)
                            let dist = length(input.localPos);
                            let gradient = 1.0 - smoothstep(0.0, 0.5, dist);
                            color.a *= gradient;
                        }
                        case 3u: {
                            // Glow effect
                            let dist = length(input.localPos);
                            let glow = exp(-dist * 4.0);
                            color.a *= glow;
                        }
                        case 4u: {
                            // Snake segment with inner glow
                            let dist = length(input.localPos);
                            if (dist > 0.45) {
                                discard;
                            }
                            let innerGlow = 1.0 - smoothstep(0.0, 0.45, dist);
                            let highlight = smoothstep(0.3, 0.0, dist) * 0.3;
                            color.rgb = color.rgb * (0.7 + innerGlow * 0.3) + highlight;
                            color.a *= smoothstep(0.45, 0.35, dist);
                        }
                        case 5u: {
                            // Food with pulsing glow
                            let dist = length(input.localPos);
                            let pulse = sin(uniforms.time * 5.0) * 0.1 + 0.9;
                            if (dist > 0.4 * pulse) {
                                // Outer glow
                                let glowDist = dist - 0.4 * pulse;
                                let glow = exp(-glowDist * 8.0) * 0.5;
                                color.a = glow;
                            } else {
                                let highlight = smoothstep(0.3, 0.0, dist) * 0.4;
                                color.rgb += highlight;
                            }
                        }
                        default: {
                            // Default solid
                        }
                    }
                    
                    // Apply flash overlay
                    if (uniforms.flash.a > 0.0) {
                        color.rgb = mix(color.rgb, uniforms.flash.rgb, uniforms.flash.a * 0.5);
                    }
                    
                    return color;
                }
            `
        });
    }
    
    async createBuffers() {
        // Uniform buffer
        this.uniformBuffer = this.device.createBuffer({
            label: 'Uniforms',
            size: 48, // vec2 + f32 + vec2 + vec4 + f32 + f32 + f32 = 48 bytes (aligned)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Instance buffer (storage buffer for instanced rendering)
        const instanceSize = 48; // 2*4 + 2*4 + 4*4 + 4*4 = 48 bytes per instance
        this.instanceBuffer = this.device.createBuffer({
            label: 'Instances',
            size: instanceSize * this.maxInstances,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
    }
    
    async createPipeline() {
        // Bind group layout
        const bindGroupLayout = this.device.createBindGroupLayout({
            label: 'Bind Group Layout',
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'read-only-storage' }
                }
            ]
        });
        
        // Pipeline layout
        const pipelineLayout = this.device.createPipelineLayout({
            label: 'Pipeline Layout',
            bindGroupLayouts: [bindGroupLayout]
        });
        
        // Create render pipeline
        this.pipeline = this.device.createRenderPipeline({
            label: 'Snake Render Pipeline',
            layout: pipelineLayout,
            vertex: {
                module: this.shaderModule,
                entryPoint: 'vertexMain'
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: 'fragmentMain',
                targets: [{
                    format: this.format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add'
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add'
                        }
                    }
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none'
            }
        });
        
        // Create bind group
        this.uniformBindGroup = this.device.createBindGroup({
            label: 'Uniform Bind Group',
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.instanceBuffer } }
            ]
        });
    }
    
    // Clear instances for new frame
    beginFrame() {
        this.instances = [];
    }
    
    // Add a rectangle instance
    addRect(x, y, width, height, color, rotation = 0) {
        this.instances.push({
            position: [x, y],
            size: [width, height],
            color: this.parseColor(color),
            type: 0,
            rotation,
            extra1: 0,
            extra2: 0
        });
    }
    
    // Add a circle instance
    addCircle(x, y, radius, color) {
        this.instances.push({
            position: [x - radius, y - radius],
            size: [radius * 2, radius * 2],
            color: this.parseColor(color),
            type: 1,
            rotation: 0,
            extra1: 0,
            extra2: 0
        });
    }
    
    // Add a glow effect
    addGlow(x, y, radius, color) {
        this.instances.push({
            position: [x - radius, y - radius],
            size: [radius * 2, radius * 2],
            color: this.parseColor(color),
            type: 3,
            rotation: 0,
            extra1: 0,
            extra2: 0
        });
    }
    
    // Add snake segment
    addSnakeSegment(x, y, size, color, isHead = false) {
        this.instances.push({
            position: [x, y],
            size: [size, size],
            color: this.parseColor(color),
            type: 4,
            rotation: 0,
            extra1: isHead ? 1 : 0,
            extra2: 0
        });
    }
    
    // Add food
    addFood(x, y, size, color) {
        this.instances.push({
            position: [x, y],
            size: [size, size],
            color: this.parseColor(color),
            type: 5,
            rotation: 0,
            extra1: 0,
            extra2: 0
        });
    }
    
    // Add gradient circle
    addGradient(x, y, radius, color) {
        this.instances.push({
            position: [x - radius, y - radius],
            size: [radius * 2, radius * 2],
            color: this.parseColor(color),
            type: 2,
            rotation: 0,
            extra1: 0,
            extra2: 0
        });
    }
    
    // Parse color to RGBA array
    parseColor(color) {
        if (Array.isArray(color)) {
            return color.length === 4 ? color : [...color, 1];
        }
        
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                const hex = color.slice(1);
                const r = parseInt(hex.substr(0, 2), 16) / 255;
                const g = parseInt(hex.substr(2, 2), 16) / 255;
                const b = parseInt(hex.substr(4, 2), 16) / 255;
                const a = hex.length > 6 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
                return [r, g, b, a];
            }
            if (color.startsWith('rgb')) {
                const match = color.match(/[\d.]+/g);
                if (match) {
                    const [r, g, b, a = 1] = match.map(Number);
                    return [r / 255, g / 255, b / 255, a];
                }
            }
        }
        
        return [1, 1, 1, 1]; // Default white
    }
    
    // Set screen shake
    setShake(x, y) {
        this.screenShake = { x, y };
    }
    
    // Set flash overlay
    setFlash(r, g, b, a) {
        this.flashColor = [r, g, b, a];
    }
    
    // Render frame
    render(game) {
        if (!this.initialized || !this.device) return;
        
        this.time += 0.016; // Approximate 60fps
        
        // Update uniform buffer
        const uniformData = new Float32Array([
            this.canvas.width, this.canvas.height,  // resolution
            this.time,                              // time
            0,                                      // padding
            this.screenShake.x, this.screenShake.y, // shake
            0, 0,                                   // padding
            ...this.flashColor,                     // flash
            game?.gridSize || 30,                   // gridSize
            game?.cellSize || 20,                   // cellSize
            0, 0                                    // padding
        ]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
        
        // Update instance buffer
        if (this.instances.length > 0) {
            const instanceData = new Float32Array(this.instances.length * 12);
            for (let i = 0; i < this.instances.length; i++) {
                const inst = this.instances[i];
                const offset = i * 12;
                instanceData[offset + 0] = inst.position[0];
                instanceData[offset + 1] = inst.position[1];
                instanceData[offset + 2] = inst.size[0];
                instanceData[offset + 3] = inst.size[1];
                instanceData[offset + 4] = inst.color[0];
                instanceData[offset + 5] = inst.color[1];
                instanceData[offset + 6] = inst.color[2];
                instanceData[offset + 7] = inst.color[3];
                instanceData[offset + 8] = inst.type;
                instanceData[offset + 9] = inst.rotation;
                instanceData[offset + 10] = inst.extra1;
                instanceData[offset + 11] = inst.extra2;
            }
            this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
        }
        
        // Get current texture
        const textureView = this.context.getCurrentTexture().createView();
        
        // Create command encoder
        const commandEncoder = this.device.createCommandEncoder();
        
        // Render pass
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.02, g: 0.05, b: 0.02, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });
        
        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.uniformBindGroup);
        renderPass.draw(6, this.instances.length);
        renderPass.end();
        
        // Submit commands
        this.device.queue.submit([commandEncoder.finish()]);
    }
    
    // Render the complete game scene
    renderScene(game) {
        if (!this.initialized) return;
        
        this.beginFrame();
        
        // Draw background grid
        this.renderGrid(game);
        
        // Draw obstacles
        this.renderObstacles(game);
        
        // Draw food
        this.renderFood(game);
        
        // Draw snake
        this.renderSnake(game);
        
        // Draw particles (simplified)
        this.renderParticles(game);
        
        // Submit frame
        this.render(game);
    }
    
    renderGrid(game) {
        const { gridSize, cellSize, theme } = game;
        const color = this.parseColor(theme?.grid || 'rgba(0,255,100,0.05)');
        
        // Draw grid lines as thin rectangles
        for (let i = 0; i <= gridSize; i++) {
            const pos = i * cellSize;
            // Vertical line
            this.addRect(pos, 0, 1, gridSize * cellSize, color);
            // Horizontal line
            this.addRect(0, pos, gridSize * cellSize, 1, color);
        }
    }
    
    renderObstacles(game) {
        if (!game.obstacles) return;
        
        const { cellSize, theme } = game;
        const color = theme?.wall || '#ff4444';
        
        for (const obs of game.obstacles) {
            const x = obs.x * cellSize;
            const y = obs.y * cellSize;
            this.addRect(x + 2, y + 2, cellSize - 4, cellSize - 4, color);
        }
    }
    
    renderFood(game) {
        if (!game.food) return;
        
        const { cellSize, foodType } = game;
        const x = game.food.x * cellSize + cellSize / 2;
        const y = game.food.y * cellSize + cellSize / 2;
        const color = foodType?.color || '#ff4444';
        
        // Add glow
        this.addGlow(x, y, cellSize, color);
        // Add food
        this.addFood(x - cellSize / 2, y - cellSize / 2, cellSize, color);
    }
    
    renderSnake(game) {
        if (!game.snake || game.snake.length === 0) return;
        
        const { cellSize, theme, activePowerUps } = game;
        let snakeColor = theme?.snake || '#00ff88';
        
        // Power-up color modifications
        if (activePowerUps?.invincible) snakeColor = '#ffd700';
        if (activePowerUps?.ghost) snakeColor = 'rgba(0, 255, 136, 0.5)';
        if (activePowerUps?.fire) snakeColor = '#ff4400';
        
        // Draw snake segments
        for (let i = game.snake.length - 1; i >= 0; i--) {
            const segment = game.snake[i];
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;
            const isHead = i === 0;
            
            // Add glow for head
            if (isHead) {
                this.addGlow(x + cellSize / 2, y + cellSize / 2, cellSize, snakeColor);
            }
            
            this.addSnakeSegment(x + 2, y + 2, cellSize - 4, snakeColor, isHead);
        }
    }
    
    renderParticles(game) {
        if (!game.particleSystem?.particles) return;
        
        for (const p of game.particleSystem.particles) {
            if (!p.active) continue;
            
            const color = p.color ? [...p.color, p.alpha || 1] : [1, 1, 1, p.alpha || 1];
            const size = p.size || 4;
            
            this.addGradient(p.x, p.y, size, color);
        }
    }
    
    // Cleanup
    destroy() {
        if (this.uniformBuffer) this.uniformBuffer.destroy();
        if (this.instanceBuffer) this.instanceBuffer.destroy();
        this.device = null;
        this.context = null;
        this.initialized = false;
    }
    
    // Check if WebGPU is available
    static async isSupported() {
        if (!navigator.gpu) return false;
        try {
            const adapter = await navigator.gpu.requestAdapter();
            return adapter !== null;
        } catch {
            return false;
        }
    }
}
