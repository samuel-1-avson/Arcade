"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";

/* ─── Shared prop type ──────────────────────────────────────────────────── */
interface SceneProps {
  color: string;
}

/* ══════════════════════════════════════════════════════════════════════════
   1. CYBERPUNK (dark) — Neural Network
   Glowing nodes scattered in 3D space, connected by edges when close enough.
   The entire network pulses in size and slowly rotates.
   ══════════════════════════════════════════════════════════════════════════ */
function CyberpunkScene({ color }: SceneProps) {
  const group   = useRef<THREE.Group>(null);
  const matRef  = useRef<THREE.PointsMaterial>(null);
  const COUNT   = 80;
  const THRESH  = 6.5;

  const { nodeBuf, edgeBuf } = useMemo(() => {
    // Generate node positions
    const nodes: [number, number, number][] = [];
    const nodeBuf = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r     = 12 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      nodeBuf[i * 3]     = x;
      nodeBuf[i * 3 + 1] = y;
      nodeBuf[i * 3 + 2] = z;
      nodes.push([x, y, z]);
    }
    // Build edge buffer (all pairs within threshold → 1 draw call)
    const edges: number[] = [];
    for (let a = 0; a < COUNT; a++) {
      for (let b = a + 1; b < COUNT; b++) {
        const dx = nodes[a][0] - nodes[b][0];
        const dy = nodes[a][1] - nodes[b][1];
        const dz = nodes[a][2] - nodes[b][2];
        if (dx * dx + dy * dy + dz * dz < THRESH * THRESH) {
          edges.push(...nodes[a], ...nodes[b]);
        }
      }
    }
    return { nodeBuf, edgeBuf: new Float32Array(edges) };
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t  = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;
    // Mouse parallax
    group.current.rotation.y += 0.05 * (px * 0.4 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-py * 0.3 - group.current.rotation.x);
    // Slow drift
    group.current.rotation.y += 0.002;
    // Node size pulse (all nodes together)
    if (matRef.current) {
      matRef.current.size = Math.sin(t * 1.8) * 0.035 + 0.12;
    }
  });

  return (
    <group ref={group}>
      {/* Nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodeBuf, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.12}
          color={color}
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {/* Edges — single draw call */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgeBuf, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. NEON PINK — Orbiting Torus Rings
   12 thin torus rings tilted at unique angles, each spinning at its own
   speed on two axes. The overall group drifts with mouse parallax.
   ══════════════════════════════════════════════════════════════════════════ */
function NeonPinkScene({ color }: SceneProps) {
  const group    = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const rings = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      radius:  2.5 + i * 0.9,
      tube:    Math.max(0.015, 0.038 - i * 0.002),
      speedZ:  (0.004 + i * 0.0016) * (i % 2 === 0 ? 1 : -1),
      speedX:  (0.002 + (i % 3) * 0.001),
      tiltX:   (i * 37.3 * Math.PI) / 180,
      tiltZ:   (i * 61.7 * Math.PI) / 180,
      opacity: 0.18 + (i % 4) * 0.12,
    }))
  , []);

  useFrame((state) => {
    if (!group.current) return;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += 0.05 * (px * 0.3 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-py * 0.25 - group.current.rotation.x);
    meshRefs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z += rings[i].speedZ;
      m.rotation.x += rings[i].speedX;
    });
  });

  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el; }}
          rotation={[r.tiltX, 0, r.tiltZ]}
        >
          <torusGeometry args={[r.radius, r.tube, 6, 90]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={r.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. RETRO 80S — Synthwave Horizon Grid + Wireframe Pyramids
   A classic perspective grid receding to a horizon point, combined with
   7 neon wireframe 4-sided pyramids floating in the mid-scene.
   ══════════════════════════════════════════════════════════════════════════ */
function Retro80sScene({ color }: SceneProps) {
  const group    = useRef<THREE.Group>(null);
  const coneRefs = useRef<(THREE.Mesh | null)[]>([]);

  const { gridBuf, cones } = useMemo(() => {
    const verts: number[] = [];
    // Vertical depth lines (run away from camera)
    for (let xi = -10; xi <= 10; xi += 1) {
      verts.push(xi, -3, -1, xi, -3, -32);
    }
    // Horizontal lines with increasing gap toward horizon
    let z = -1;
    for (let hi = 0; hi < 20; hi++) {
      verts.push(-10, -3, z, 10, -3, z);
      z -= 0.5 + hi * 0.14;
    }
    const gridBuf = new Float32Array(verts);

    // Seeded pyramid data
    const seed = [0.13, 0.67, 0.34, 0.82, 0.22, 0.55, 0.91];
    const cones = seed.map((s, i) => ({
      x:      (s * 2 - 1) * 11,
      y:      -0.5 + seed[(i + 2) % 7] * 3,
      z:      -4 - seed[(i + 3) % 7] * 16,
      speedY: 0.005 + seed[(i + 1) % 7] * 0.007,
    }));
    return { gridBuf, cones };
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t  = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += 0.05 * (px * 0.2 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-py * 0.1 - group.current.rotation.x);
    // Gentle vertical bob
    group.current.position.y = Math.sin(t * 0.25) * 0.4;
    // Pyramid rotation
    coneRefs.current.forEach((c, i) => {
      if (!c) return;
      c.rotation.y += cones[i].speedY;
    });
  });

  return (
    <group ref={group}>
      {/* Horizon grid */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gridBuf, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      {/* Wireframe pyramids */}
      {cones.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => { coneRefs.current[i] = el; }}
          position={[c.x, c.y, c.z]}
        >
          <coneGeometry args={[1.4, 2.6, 4]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. MATRIX — Digital Rain
   60 vertical columns of 20 particles each. Particles fall continuously
   top→bottom and loop. Only X-axis pointer drift is applied so the
   vertical rain illusion is preserved.
   ══════════════════════════════════════════════════════════════════════════ */
function MatrixScene({ color }: SceneProps) {
  const group  = useRef<THREE.Group>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);

  const COLS    = 60;
  const PER_COL = 20;
  const COUNT   = COLS * PER_COL;
  const TOTAL_H = 44;

  const { posArr, speeds } = useMemo(() => {
    const posArr = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let c = 0; c < COLS; c++) {
      const x = -20 + c * (40 / (COLS - 1));
      for (let p = 0; p < PER_COL; p++) {
        const i = c * PER_COL + p;
        posArr[i * 3]     = x + (Math.random() - 0.5) * 0.25;
        posArr[i * 3 + 1] = -TOTAL_H / 2 + (p / PER_COL) * TOTAL_H;
        posArr[i * 3 + 2] = -6 + Math.random() * 4;
        speeds[i]          = 2.8 + Math.random() * 4.0;
      }
    }
    return { posArr, speeds };
  }, []);

  useFrame((state, delta) => {
    if (!geoRef.current || !group.current) return;
    // Only X drift — preserves rain illusion
    group.current.position.x +=
      0.04 * (state.pointer.x * 1.8 - group.current.position.x);

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) - speeds[i] * delta;
      if (y < -TOTAL_H / 2) y += TOTAL_H;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute attach="attributes-position" args={[posArr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.11}
          color={color}
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. SYNTHWAVE — Concentric Ring Pulses
   14 rings expand outward from the centre like a sonar ping, fading as
   they grow. Rings are staggered in phase so they appear as a continuous
   outward pulse.
   ══════════════════════════════════════════════════════════════════════════ */
function SynthwaveScene({ color }: SceneProps) {
  const group    = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs  = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const RINGS  = 14;
  const MAX_R  = 18;
  const phases = useMemo(() =>
    Array.from({ length: RINGS }, (_, i) => i * (MAX_R / RINGS))
  , []);

  useFrame((state) => {
    if (!group.current) return;
    const t  = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += 0.05 * (px * 0.3 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-py * 0.3 - group.current.rotation.x);

    for (let i = 0; i < RINGS; i++) {
      const ring = ringRefs.current[i];
      const mat  = matRefs.current[i];
      if (!ring || !mat) continue;
      const r = ((t * 3.8 + phases[i]) % MAX_R);
      ring.scale.setScalar(r);
      mat.opacity = (1 - r / MAX_R) * 0.7;
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }}>
          <ringGeometry args={[1, 1.045, 128]} />
          <meshBasicMaterial
            ref={(el) => { matRefs.current[i] = el; }}
            color={color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. DRACULA — Spiral Vortex / Tornado
   1000 particles arranged in a 3D spiral funnel. Inner particles orbit
   faster than outer ones (differential rotation). Particles breathe
   gently up and down creating a living tornado effect.
   ══════════════════════════════════════════════════════════════════════════ */
function DraculaScene({ color }: SceneProps) {
  const group  = useRef<THREE.Group>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const COUNT  = 1000;

  const { posArr, baseAngle, radius, baseHeight, angularSpeed } = useMemo(() => {
    const posArr       = new Float32Array(COUNT * 3);
    const baseAngle    = new Float32Array(COUNT);
    const radius       = new Float32Array(COUNT);
    const baseHeight   = new Float32Array(COUNT);
    const angularSpeed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const t  = i / COUNT;
      const a  = t * Math.PI * 14;           // 7 full spiral turns
      const r  = t * 9.5 + 0.3 + (Math.random() - 0.5) * 1.0;
      const h  = (1 - t) * 8 - 4;           // tall at top, flat at base
      baseAngle[i]    = a;
      radius[i]       = r;
      baseHeight[i]   = h + (Math.random() - 0.5) * 0.7;
      angularSpeed[i] = 0.45 / (1 + r * 0.18);  // faster at centre
      posArr[i * 3]     = Math.cos(a) * r;
      posArr[i * 3 + 1] = h;
      posArr[i * 3 + 2] = Math.sin(a) * r;
    }
    return { posArr, baseAngle, radius, baseHeight, angularSpeed };
  }, []);

  const phases = useRef(new Float32Array(COUNT));

  useFrame((state, delta) => {
    if (!geoRef.current || !group.current) return;
    const t  = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += 0.05 * (px * 0.4 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-py * 0.3 - group.current.rotation.x);

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      phases.current[i] += angularSpeed[i] * delta;
      const a = baseAngle[i] + phases.current[i];
      pos.setXYZ(
        i,
        Math.cos(a) * radius[i],
        baseHeight[i] + Math.sin(t * 0.6 + i * 0.012) * 0.5,
        Math.sin(a) * radius[i],
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute attach="attributes-position" args={[posArr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          color={color}
          transparent
          opacity={0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   7. OCEAN DEEP — Wave Particle Grid
   A 32×32 flat grid of 1024 particles. Each frame, the Y position of
   every particle is displaced by three overlapping sine waves — creating
   a rolling, living ocean surface viewed from a slight overhead angle.
   ══════════════════════════════════════════════════════════════════════════ */
function OceanScene({ color }: SceneProps) {
  const group  = useRef<THREE.Group>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const RES    = 32;
  const COUNT  = RES * RES;

  const { posArr, baseXZ } = useMemo(() => {
    const posArr = new Float32Array(COUNT * 3);
    const baseXZ = new Float32Array(COUNT * 2);
    for (let row = 0; row < RES; row++) {
      for (let col = 0; col < RES; col++) {
        const i = row * RES + col;
        const x = -15 + col * (30 / (RES - 1));
        const z = -15 + row * (30 / (RES - 1));
        posArr[i * 3]     = x;
        posArr[i * 3 + 1] = 0;
        posArr[i * 3 + 2] = z;
        baseXZ[i * 2]     = x;
        baseXZ[i * 2 + 1] = z;
      }
    }
    return { posArr, baseXZ };
  }, []);

  useFrame((state) => {
    if (!geoRef.current || !group.current) return;
    const t  = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;
    // Keep the ocean tilted so we see the surface from above
    group.current.rotation.y += 0.05 * (px * 0.3  - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-0.35 - py * 0.12 - group.current.rotation.x);

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const x = baseXZ[i * 2];
      const z = baseXZ[i * 2 + 1];
      const d = Math.sqrt(x * x + z * z);
      const y = Math.sin(x * 0.34 + t * 1.1) * 1.4
              + Math.sin(z * 0.28 + t * 0.85) * 0.95
              + Math.sin(d * 0.38 - t * 1.4) * 0.7;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute attach="attributes-position" args={[posArr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color={color}
          transparent
          opacity={0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   8. BLOOD MOON — Central Sphere + Orbiting Asteroid Belt
   A large wireframe sphere at the centre pulses its scale and opacity like
   a heartbeat. 500 particles orbit around it in a tilted disk plane, each
   at its own orbital speed.
   ══════════════════════════════════════════════════════════════════════════ */
function BloodMoonScene({ color }: SceneProps) {
  const group   = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const moonMat = useRef<THREE.MeshBasicMaterial>(null);
  const geoRef  = useRef<THREE.BufferGeometry>(null);
  const COUNT   = 500;

  const { posArr, radii, orbitSpeeds, heights } = useMemo(() => {
    const posArr      = new Float32Array(COUNT * 3);
    const radii       = new Float32Array(COUNT);
    const orbitSpeeds = new Float32Array(COUNT);
    const heights     = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r     = 7 + (Math.random() - 0.5) * 3.6;
      const angle = (i / COUNT) * Math.PI * 2;
      const h     = (Math.random() - 0.5) * 0.9;
      radii[i]       = r;
      heights[i]     = h;
      orbitSpeeds[i] = (0.22 + Math.random() * 0.18) * (Math.random() > 0.5 ? 1 : -1);
      posArr[i * 3]     = Math.cos(angle) * r;
      posArr[i * 3 + 1] = h;
      posArr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return { posArr, radii, orbitSpeeds, heights };
  }, []);

  const phases = useRef<Float32Array>(
    (() => {
      const p = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) p[i] = (i / COUNT) * Math.PI * 2;
      return p;
    })()
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const t  = state.clock.elapsedTime;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += 0.05 * (px * 0.35 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-py * 0.25 - group.current.rotation.x);

    // Moon pulse
    if (moonRef.current && moonMat.current) {
      const pulse = Math.sin(t * 1.2) * 0.14 + 1;
      moonRef.current.scale.setScalar(pulse);
      moonMat.current.opacity = 0.5 + Math.sin(t * 1.2) * 0.2;
    }

    // Asteroid orbit
    if (geoRef.current) {
      const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        phases.current[i] += orbitSpeeds[i] * delta;
        pos.setXYZ(
          i,
          Math.cos(phases.current[i]) * radii[i],
          heights[i],
          Math.sin(phases.current[i]) * radii[i],
        );
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* Central moon */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial
          ref={moonMat}
          color={color}
          transparent
          opacity={0.55}
          wireframe
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Asteroid belt in a tilted disk */}
      <group rotation={[0.5, 0, 0]}>
        <points>
          <bufferGeometry ref={geoRef}>
            <bufferAttribute attach="attributes-position" args={[posArr, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.09}
            color={color}
            transparent
            opacity={0.75}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   9. SOLAR GOLD — Spiral Galaxy
   Three spiral arms of 400 particles each fan out from a bright galactic
   core cluster. The entire galaxy slowly rotates on Y with a slight tilt
   so the spiral arms are clearly visible. No per-frame buffer updates —
   just a single group rotation.
   ══════════════════════════════════════════════════════════════════════════ */
function SolarGoldScene({ color }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const ARMS  = 3;
  const PER_ARM = 420;
  const CORE    = 70;
  const COUNT   = ARMS * PER_ARM + CORE;

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    let idx = 0;
    // Spiral arms
    for (let arm = 0; arm < ARMS; arm++) {
      const baseAngle = arm * ((Math.PI * 2) / ARMS);
      for (let p = 0; p < PER_ARM; p++) {
        const t       = p / PER_ARM;
        const r       = t * 13 + 0.5;
        const a       = baseAngle + t * Math.PI * 4.2 + (Math.random() - 0.5) * 0.5;
        const scatter = (Math.random() - 0.5) * (t * 2.0);
        pos[idx * 3]     = Math.cos(a) * (r + scatter);
        pos[idx * 3 + 1] = (Math.random() - 0.5) * 0.7;
        pos[idx * 3 + 2] = Math.sin(a) * (r + scatter);
        idx++;
      }
    }
    // Bright galactic core cluster
    for (let i = 0; i < CORE; i++) {
      const r = Math.random() * 1.3;
      const a = Math.random() * Math.PI * 2;
      pos[idx * 3]     = Math.cos(a) * r;
      pos[idx * 3 + 1] = (Math.random() - 0.5) * 0.35;
      pos[idx * 3 + 2] = Math.sin(a) * r;
      idx++;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += 0.05 * (px * 0.35 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-0.22 - py * 0.1 - group.current.rotation.x);
    group.current.rotation.y += 0.0035; // galaxy spin
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color={color}
          transparent
          opacity={0.75}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   10. ARCTIC — Snowfall + Hexagonal Snowflakes
   1000 small particles fall gently from top to bottom in a wide volume,
   looping when they reach the bottom. 8 large hexagonal wireframe discs
   drift and rotate at different depths. Pointer moves the whole scene
   horizontally like a gust of wind.
   ══════════════════════════════════════════════════════════════════════════ */
function ArcticScene({ color }: SceneProps) {
  const group     = useRef<THREE.Group>(null);
  const geoRef    = useRef<THREE.BufferGeometry>(null);
  const flakeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const COUNT     = 1000;

  const { posArr, fallSpeeds, flakeData } = useMemo(() => {
    const posArr     = new Float32Array(COUNT * 3);
    const fallSpeeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      posArr[i * 3]     = (Math.random() - 0.5) * 42;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 44;
      posArr[i * 3 + 2] = -8 + Math.random() * 14;
      fallSpeeds[i]     = 0.5 + Math.random() * 1.0;
    }
    const seeds = [0.15, 0.72, 0.38, 0.90, 0.25, 0.60, 0.48, 0.83];
    const flakeData = seeds.map((s, i) => ({
      x:      (s * 2 - 1) * 18,
      y:      (seeds[(i + 3) % 8] * 2 - 1) * 14,
      z:      -10 + seeds[(i + 1) % 8] * 10,
      fallSpd: 0.5 + seeds[(i + 2) % 8] * 0.8,
      rotSpd:  (seeds[(i + 4) % 8] - 0.5) * 0.012,
      radius:  1.0 + seeds[(i + 5) % 8] * 1.8,
    }));
    return { posArr, fallSpeeds, flakeData };
  }, []);

  useFrame((state, delta) => {
    if (!geoRef.current || !group.current) return;
    // Wind drift: only X position, not rotation
    group.current.position.x +=
      0.03 * (state.pointer.x * 2.8 - group.current.position.x);

    // Snowfall
    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) - fallSpeeds[i] * delta * 8;
      if (y < -22) y = 22;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    // Snowflake drift
    flakeRefs.current.forEach((flake, i) => {
      if (!flake) return;
      flake.position.y -= flakeData[i].fallSpd * delta * 1.2;
      flake.rotation.z  += flakeData[i].rotSpd;
      if (flake.position.y < -16) flake.position.y = 16;
    });
  });

  return (
    <group ref={group}>
      {/* Snow particle field */}
      <points>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute attach="attributes-position" args={[posArr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color={color}
          transparent
          opacity={0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {/* Hexagonal wireframe snowflakes */}
      {flakeData.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => { flakeRefs.current[i] = el; }}
          position={[f.x, f.y, f.z]}
        >
          <cylinderGeometry args={[f.radius, f.radius, 0.04, 6]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.42}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ROUTER — AbstractBackground (exported, consumed by background-canvas.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
const COLOR_MAP: Record<string, string> = {
  "dark":        "#00e5ff",
  "neon-pink":   "#ff007f",
  "retro-80s":   "#ff4d00",
  "matrix":      "#00ff41",
  "synthwave":   "#e040fb",
  "dracula":     "#bd93f9",
  "ocean":       "#00b4d8",
  "blood-moon":  "#ff1744",
  "solar-gold":  "#ffc107",
  "arctic":      "#80deea",
};

export function AbstractBackground() {
  const { theme } = useTheme();
  const color = COLOR_MAP[theme ?? "dark"] ?? "#00e5ff";

  const renderScene = () => {
    switch (theme) {
      case "neon-pink":   return <NeonPinkScene   color={color} />;
      case "retro-80s":  return <Retro80sScene   color={color} />;
      case "matrix":     return <MatrixScene     color={color} />;
      case "synthwave":  return <SynthwaveScene  color={color} />;
      case "dracula":    return <DraculaScene    color={color} />;
      case "ocean":      return <OceanScene      color={color} />;
      case "blood-moon": return <BloodMoonScene  color={color} />;
      case "solar-gold": return <SolarGoldScene  color={color} />;
      case "arctic":     return <ArcticScene     color={color} />;
      case "dark":
      default:           return <CyberpunkScene  color={color} />;
    }
  };

  return (
    <group>
      <ambientLight intensity={0.2} />
      {renderScene()}
    </group>
  );
}
