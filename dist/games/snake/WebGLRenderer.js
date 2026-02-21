/**
 * Snake Game - WebGL Renderer
 * Advanced graphics with shaders, particles, and effects
 */

export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!this.gl) {
            console.warn('WebGL not supported, falling back to 2D');
            return null;
        }

        this.programs = {};
        this.buffers = {};
        this.textures = {};
        this.particles = [];
        this.time = 0;
        
        // Lighting
        this.lights = [
            { pos: [0.5, 0.5], color: [0, 1, 0.5], intensity: 1.0 }
        ];
        
        this.init();
    }

    init() {
        const gl = this.gl;
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Create shader programs
        this.programs.main = this.createProgram(MAIN_VERT, MAIN_FRAG);
        this.programs.particle = this.createProgram(PARTICLE_VERT, PARTICLE_FRAG);
        this.programs.postprocess = this.createProgram(QUAD_VERT, POSTPROCESS_FRAG);
        this.programs.background = this.createProgram(QUAD_VERT, BACKGROUND_FRAG);
        
        // Create geometry buffers
        this.createBuffers();
        
        // Create framebuffer for post-processing
        this.createFramebuffer();
    }

    createProgram(vertSrc, fragSrc) {
        const gl = this.gl;
        
        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertSrc);
        gl.compileShader(vert);
        
        if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
            console.error('Vertex shader error:', gl.getShaderInfoLog(vert));
        }
        
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragSrc);
        gl.compileShader(frag);
        
        if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
            console.error('Fragment shader error:', gl.getShaderInfoLog(frag));
        }
        
        const program = gl.createProgram();
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
        }
        
        // Cache uniform locations
        program.uniforms = {};
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            program.uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        // Cache attribute locations
        program.attributes = {};
        const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; i++) {
            const info = gl.getActiveAttrib(program, i);
            program.attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        return program;
    }

    createBuffers() {
        const gl = this.gl;
        
        // Quad buffer for sprites and tiles
        const quadVerts = new Float32Array([
            -0.5, -0.5, 0, 0,
             0.5, -0.5, 1, 0,
             0.5,  0.5, 1, 1,
            -0.5,  0.5, 0, 1
        ]);
        const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        
        this.buffers.quad = {
            verts: this.createBuffer(quadVerts, gl.ARRAY_BUFFER),
            indices: this.createBuffer(quadIndices, gl.ELEMENT_ARRAY_BUFFER),
            count: 6
        };
        
        // Full-screen quad for post-processing
        const fsQuadVerts = new Float32Array([
            -1, -1, 0, 0,
             1, -1, 1, 0,
             1,  1, 1, 1,
            -1,  1, 0, 1
        ]);
        
        this.buffers.fullscreenQuad = {
            verts: this.createBuffer(fsQuadVerts, gl.ARRAY_BUFFER),
            indices: this.createBuffer(quadIndices, gl.ELEMENT_ARRAY_BUFFER),
            count: 6
        };
        
        // Particle instance buffer (will be updated each frame)
        this.buffers.particles = {
            data: gl.createBuffer(),
            maxCount: 1000
        };
    }

    createBuffer(data, type) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        return buffer;
    }

    createFramebuffer() {
        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Main render target
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        
        // Color texture
        this.renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);
        
        // Bloom texture (smaller for blur)
        this.bloomTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.bloomTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width / 2, height / 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // Main render function
    render(gameState, dt) {
        const gl = this.gl;
        this.time += dt;
        
        // Render to framebuffer first
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Render layers
        this.renderBackground(gameState.theme);
        this.renderGrid(gameState);
        this.renderObstacles(gameState.obstacles, gameState.theme);
        this.renderFood(gameState.food, gameState.foodType);
        this.renderSnake(gameState.snake, gameState.theme, gameState.direction);
        this.renderParticles(dt);
        
        // Post-processing pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.renderPostProcess(gameState);
    }

    renderBackground(theme) {
        const gl = this.gl;
        const prog = this.programs.background;
        
        gl.useProgram(prog);
        
        // Set uniforms
        gl.uniform1f(prog.uniforms.u_time, this.time);
        gl.uniform3fv(prog.uniforms.u_color1, this.hexToRgb(theme.bg));
        gl.uniform3fv(prog.uniforms.u_color2, this.hexToRgb(theme.grid));
        gl.uniform2f(prog.uniforms.u_resolution, this.canvas.width, this.canvas.height);
        
        this.drawFullscreenQuad(prog);
    }

    renderGrid(gameState) {
        const gl = this.gl;
        const prog = this.programs.main;
        const gridSize = gameState.gridSize || 30;
        const cellSize = 1.0 / gridSize;
        
        gl.useProgram(prog);
        
        // Draw grid lines with glow
        for (let i = 0; i <= gridSize; i++) {
            const pos = i * cellSize * 2 - 1;
            // Vertical and horizontal lines rendered as thin quads
            this.drawLine(pos, -1, pos, 1, gameState.theme.grid, 0.002);
            this.drawLine(-1, pos, 1, pos, gameState.theme.grid, 0.002);
        }
    }

    renderSnake(snake, theme, direction) {
        const gl = this.gl;
        const prog = this.programs.main;
        const gridSize = 30;
        const cellSize = 2.0 / gridSize;
        
        gl.useProgram(prog);
        
        // Render from tail to head for proper z-order
        for (let i = snake.length - 1; i >= 0; i--) {
            const seg = snake[i];
            const x = (seg.x / gridSize) * 2 - 1 + cellSize / 2;
            const y = -((seg.y / gridSize) * 2 - 1 + cellSize / 2);
            
            // Calculate segment properties
            const t = i / snake.length;
            const scale = cellSize * (1 - t * 0.2);
            const alpha = 1 - t * 0.3;
            
            // Glow intensity higher for head
            const glowIntensity = i === 0 ? 1.5 : 0.5;
            
            // Get color with gradient
            const color = this.hexToRgb(theme.snake);
            
            // Set uniforms
            gl.uniform2f(prog.uniforms.u_position, x, y);
            gl.uniform2f(prog.uniforms.u_scale, scale, scale);
            gl.uniform4f(prog.uniforms.u_color, color[0], color[1], color[2], alpha);
            gl.uniform1f(prog.uniforms.u_glow, glowIntensity);
            gl.uniform1f(prog.uniforms.u_time, this.time);
            gl.uniform1i(prog.uniforms.u_isHead, i === 0 ? 1 : 0);
            
            this.drawQuad(prog);
            
            // Draw eyes on head
            if (i === 0) {
                this.renderEyes(x, y, scale, direction);
            }
        }
    }

    renderEyes(x, y, scale, direction) {
        const gl = this.gl;
        const prog = this.programs.main;
        const eyeSize = scale * 0.15;
        const eyeOffset = scale * 0.2;
        
        let leftEye, rightEye;
        switch (direction) {
            case 'UP':
                leftEye = { x: x - eyeOffset, y: y + eyeOffset };
                rightEye = { x: x + eyeOffset, y: y + eyeOffset };
                break;
            case 'DOWN':
                leftEye = { x: x - eyeOffset, y: y - eyeOffset };
                rightEye = { x: x + eyeOffset, y: y - eyeOffset };
                break;
            case 'LEFT':
                leftEye = { x: x - eyeOffset, y: y + eyeOffset };
                rightEye = { x: x - eyeOffset, y: y - eyeOffset };
                break;
            default: // RIGHT
                leftEye = { x: x + eyeOffset, y: y + eyeOffset };
                rightEye = { x: x + eyeOffset, y: y - eyeOffset };
        }
        
        // Draw white eye backgrounds
        gl.uniform4f(prog.uniforms.u_color, 1, 1, 1, 1);
        gl.uniform1f(prog.uniforms.u_glow, 0);
        
        gl.uniform2f(prog.uniforms.u_position, leftEye.x, leftEye.y);
        gl.uniform2f(prog.uniforms.u_scale, eyeSize, eyeSize);
        this.drawQuad(prog);
        
        gl.uniform2f(prog.uniforms.u_position, rightEye.x, rightEye.y);
        this.drawQuad(prog);
        
        // Draw black pupils
        gl.uniform4f(prog.uniforms.u_color, 0, 0, 0, 1);
        gl.uniform2f(prog.uniforms.u_scale, eyeSize * 0.5, eyeSize * 0.5);
        
        gl.uniform2f(prog.uniforms.u_position, leftEye.x, leftEye.y);
        this.drawQuad(prog);
        
        gl.uniform2f(prog.uniforms.u_position, rightEye.x, rightEye.y);
        this.drawQuad(prog);
    }

    renderFood(food, foodType) {
        const gl = this.gl;
        const prog = this.programs.main;
        const gridSize = 30;
        const cellSize = 2.0 / gridSize;
        
        const x = (food.x / gridSize) * 2 - 1 + cellSize / 2;
        const y = -((food.y / gridSize) * 2 - 1 + cellSize / 2);
        
        // Pulsing animation
        const pulse = 1 + Math.sin(this.time * 5) * 0.15;
        const scale = cellSize * 0.8 * pulse;
        
        const color = this.hexToRgb(foodType.color);
        
        gl.useProgram(prog);
        gl.uniform2f(prog.uniforms.u_position, x, y);
        gl.uniform2f(prog.uniforms.u_scale, scale, scale);
        gl.uniform4f(prog.uniforms.u_color, color[0], color[1], color[2], 1);
        gl.uniform1f(prog.uniforms.u_glow, 2.0);
        gl.uniform1f(prog.uniforms.u_time, this.time);
        
        this.drawQuad(prog);
    }

    renderObstacles(obstacles, theme) {
        const gl = this.gl;
        const prog = this.programs.main;
        const gridSize = 30;
        const cellSize = 2.0 / gridSize;
        
        gl.useProgram(prog);
        
        for (const obs of obstacles) {
            const x = (obs.x / gridSize) * 2 - 1 + cellSize / 2;
            const y = -((obs.y / gridSize) * 2 - 1 + cellSize / 2);
            
            const color = this.hexToRgb(theme.wall || '#444');
            
            gl.uniform2f(prog.uniforms.u_position, x, y);
            gl.uniform2f(prog.uniforms.u_scale, cellSize * 0.9, cellSize * 0.9);
            gl.uniform4f(prog.uniforms.u_color, color[0], color[1], color[2], 1);
            gl.uniform1f(prog.uniforms.u_glow, 0.3);
            
            this.drawQuad(prog);
        }
    }

    renderParticles(dt) {
        const gl = this.gl;
        const prog = this.programs.particle;
        
        // Update and render particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.98;
            p.vy *= 0.98;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            const alpha = p.life / p.maxLife;
            const scale = p.size * alpha * 0.02;
            
            gl.useProgram(prog);
            gl.uniform2f(prog.uniforms.u_position, p.x, p.y);
            gl.uniform2f(prog.uniforms.u_scale, scale, scale);
            gl.uniform4f(prog.uniforms.u_color, p.color[0], p.color[1], p.color[2], alpha);
            
            this.drawQuad(prog);
        }
    }

    renderPostProcess(gameState) {
        const gl = this.gl;
        const prog = this.programs.postprocess;
        
        gl.useProgram(prog);
        
        // Bind render texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.uniform1i(prog.uniforms.u_texture, 0);
        
        // Post-process settings
        gl.uniform1f(prog.uniforms.u_time, this.time);
        gl.uniform2f(prog.uniforms.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(prog.uniforms.u_bloomIntensity, 0.3);
        gl.uniform1f(prog.uniforms.u_vignetteIntensity, 0.4);
        gl.uniform1f(prog.uniforms.u_screenShake, gameState.screenShake || 0);
        
        this.drawFullscreenQuad(prog);
    }

    // Particle spawning
    spawnParticles(x, y, color, count = 8) {
        const gridSize = 30;
        const normX = (x / gridSize) * 2 - 1;
        const normY = -((y / gridSize) * 2 - 1);
        const rgbColor = typeof color === 'string' ? this.hexToRgb(color) : color;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 0.5 + Math.random() * 0.5;
            
            this.particles.push({
                x: normX,
                y: normY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                size: 3 + Math.random() * 3,
                color: rgbColor
            });
        }
    }

    // Helper methods
    drawQuad(prog) {
        const gl = this.gl;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad.verts);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.quad.indices);
        
        const posLoc = prog.attributes.a_position;
        const uvLoc = prog.attributes.a_uv;
        
        if (posLoc !== undefined && posLoc !== -1) {
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
        }
        if (uvLoc !== undefined && uvLoc !== -1) {
            gl.enableVertexAttribArray(uvLoc);
            gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
        }
        
        gl.drawElements(gl.TRIANGLES, this.buffers.quad.count, gl.UNSIGNED_SHORT, 0);
    }

    drawFullscreenQuad(prog) {
        const gl = this.gl;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.fullscreenQuad.verts);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.fullscreenQuad.indices);
        
        const posLoc = prog.attributes.a_position;
        const uvLoc = prog.attributes.a_uv;
        
        if (posLoc !== undefined && posLoc !== -1) {
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
        }
        if (uvLoc !== undefined && uvLoc !== -1) {
            gl.enableVertexAttribArray(uvLoc);
            gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
        }
        
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    drawLine(x1, y1, x2, y2, color, thickness) {
        // Line rendered as thin quad - simplified for grid
    }

    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return [0.5, 0.5, 0.5];
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [0.5, 0.5, 0.5];
    }

    destroy() {
        const gl = this.gl;
        
        // Clean up WebGL resources
        Object.values(this.programs).forEach(prog => gl.deleteProgram(prog));
        Object.values(this.buffers).forEach(buf => {
            if (buf.verts) gl.deleteBuffer(buf.verts);
            if (buf.indices) gl.deleteBuffer(buf.indices);
            if (buf.data) gl.deleteBuffer(buf.data);
        });
        
        if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
        if (this.renderTexture) gl.deleteTexture(this.renderTexture);
        if (this.bloomTexture) gl.deleteTexture(this.bloomTexture);
    }
}

// ============ GLSL SHADERS ============

const MAIN_VERT = `
attribute vec2 a_position;
attribute vec2 a_uv;

uniform vec2 u_position;
uniform vec2 u_scale;

varying vec2 v_uv;

void main() {
    vec2 pos = a_position * u_scale + u_position;
    gl_Position = vec4(pos, 0.0, 1.0);
    v_uv = a_uv;
}
`;

const MAIN_FRAG = `
precision mediump float;

uniform vec4 u_color;
uniform float u_glow;
uniform float u_time;
uniform int u_isHead;

varying vec2 v_uv;

void main() {
    vec2 center = v_uv - 0.5;
    float dist = length(center);
    
    // Rounded rectangle shape
    float radius = 0.4;
    float edge = 0.05;
    float alpha = 1.0 - smoothstep(radius - edge, radius + edge, dist);
    
    // Glow effect
    float glowRadius = 0.6;
    float glow = (1.0 - smoothstep(0.0, glowRadius, dist)) * u_glow * 0.3;
    
    vec3 color = u_color.rgb + vec3(glow);
    
    // Head pulse
    if (u_isHead == 1) {
        float pulse = 0.1 * sin(u_time * 3.0) + 1.0;
        color *= pulse;
    }
    
    gl_FragColor = vec4(color, alpha * u_color.a);
}
`;

const PARTICLE_VERT = `
attribute vec2 a_position;
attribute vec2 a_uv;

uniform vec2 u_position;
uniform vec2 u_scale;

varying vec2 v_uv;

void main() {
    vec2 pos = a_position * u_scale + u_position;
    gl_Position = vec4(pos, 0.0, 1.0);
    v_uv = a_uv;
}
`;

const PARTICLE_FRAG = `
precision mediump float;

uniform vec4 u_color;

varying vec2 v_uv;

void main() {
    vec2 center = v_uv - 0.5;
    float dist = length(center);
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    gl_FragColor = vec4(u_color.rgb, alpha * u_color.a);
}
`;

const QUAD_VERT = `
attribute vec2 a_position;
attribute vec2 a_uv;

varying vec2 v_uv;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = a_uv;
}
`;

const BACKGROUND_FRAG = `
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color1;
uniform vec3 u_color2;

varying vec2 v_uv;

void main() {
    // Animated gradient background
    float t = sin(u_time * 0.2) * 0.5 + 0.5;
    vec3 color = mix(u_color1, u_color2, v_uv.y * 0.5);
    
    // Subtle grid pattern
    vec2 grid = fract(v_uv * 30.0);
    float line = step(0.95, grid.x) + step(0.95, grid.y);
    color += vec3(line * 0.03);
    
    // Vignette
    vec2 center = v_uv - 0.5;
    float vignette = 1.0 - length(center) * 0.5;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

const POSTPROCESS_FRAG = `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_bloomIntensity;
uniform float u_vignetteIntensity;
uniform float u_screenShake;

varying vec2 v_uv;

void main() {
    // Screen shake
    vec2 uv = v_uv;
    if (u_screenShake > 0.0) {
        uv.x += sin(u_time * 50.0) * u_screenShake * 0.01;
        uv.y += cos(u_time * 50.0) * u_screenShake * 0.01;
    }
    
    vec4 color = texture2D(u_texture, uv);
    
    // Simple bloom (sample surrounding pixels)
    vec2 texelSize = 1.0 / u_resolution;
    vec4 bloom = vec4(0.0);
    for (float x = -2.0; x <= 2.0; x++) {
        for (float y = -2.0; y <= 2.0; y++) {
            bloom += texture2D(u_texture, uv + vec2(x, y) * texelSize * 2.0);
        }
    }
    bloom /= 25.0;
    color.rgb += bloom.rgb * u_bloomIntensity;
    
    // Vignette
    vec2 center = v_uv - 0.5;
    float vignette = 1.0 - length(center) * u_vignetteIntensity;
    color.rgb *= vignette;
    
    // Chromatic aberration (subtle)
    float aberration = 0.002;
    color.r = texture2D(u_texture, uv + vec2(aberration, 0.0)).r;
    color.b = texture2D(u_texture, uv - vec2(aberration, 0.0)).b;
    
    gl_FragColor = color;
}
`;

export default WebGLRenderer;
