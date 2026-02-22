"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";

/* ─── Shared prop type ──────────────────────────────────────────────────── */
interface SceneProps {
  color: string;
}

/* ─── Window-level mouse tracker (works even with pointer-events-none) ──── */
function useMouseNDC() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return mouse;
}

/* ══════════════════════════════════════════════════════════════════════════
   1. CYBERPUNK (dark) — Neural Network
   Glowing nodes scattered in 3D space, connected by edges when close enough.
   The entire network pulses in size and slowly rotates.
   Mouse Y brightens/dims the edge web (scan-line effect).
   ══════════════════════════════════════════════════════════════════════════ */
function CyberpunkScene({ color }: SceneProps) {
  const group      = useRef<THREE.Group>(null);
  const matRef     = useRef<THREE.PointsMaterial>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const mouse      = useMouseNDC();
  const COUNT      = 80;
  const THRESH     = 6.5;

  const { nodeBuf, edgeBuf } = useMemo(() => {
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
    const mx = mouse.current.x;
    const my = mouse.current.y;
    group.current.rotation.y += 0.05 * (mx * 0.4 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-my * 0.3 - group.current.rotation.x);
    group.current.rotation.y += 0.002;
    if (matRef.current) {
      matRef.current.size = Math.sin(t * 1.8) * 0.035 + 0.12;
    }
    // Mouse Y brightens edge web
    if (edgeMatRef.current) {
      edgeMatRef.current.opacity = 0.14 + Math.abs(my) * 0.28;
    }
  });

  return (
    <group ref={group}>
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
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgeBuf, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={edgeMatRef}
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
   2. NEON PINK — Lissajous Light Sculpture
   800 particles trace a 3D Lissajous/spirograph parametric curve whose
   frequency ratios drift continuously, morphing through knots, stars,
   figure-8s, and pretzel forms. Mouse X/Y modulates the drift rate of
   two frequency axes, giving direct control over shape evolution speed.
   ══════════════════════════════════════════════════════════════════════════ */
function NeonPinkScene({ color }: SceneProps) {
  const group  = useRef<THREE.Group>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const mouse  = useMouseNDC();
  const COUNT  = 800;
  const freqs  = useRef({ a: 2.1, b: 3.0, c: 5.0, pa: 0, pb: 0.8, pc: 1.6 });
  const posArr = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame((_state, delta) => {
    if (!group.current || !geoRef.current) return;
    const mx = mouse.current.x;
    const my = mouse.current.y;

    group.current.rotation.y += 0.05 * (mx * 0.4 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-my * 0.3 - group.current.rotation.x);
    group.current.rotation.y += 0.003;

    const f = freqs.current;
    f.a  += delta * 0.018 * (1 + mx * 0.7);
    f.c  += delta * 0.012 * (1 + my * 0.5);
    f.pa += delta * 0.09;
    f.pb += delta * 0.07;
    f.pc += delta * 0.05;

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const u = (i / COUNT) * Math.PI * 2;
      pos.setXYZ(
        i,
        8.5 * Math.sin(f.a * u + f.pa),
        7.0 * Math.sin(f.b * u + f.pb),
        6.0 * Math.cos(f.c * u + f.pc),
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
          size={0.10}
          color={color}
          transparent
          opacity={0.82}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. RETRO 80S — Synthwave Horizon Grid + Wireframe Pyramids
   Mouse Y acts as a camera elevator — lifting the view above or below
   the grid floor. Pyramids also spin faster at high mouse X.
   ══════════════════════════════════════════════════════════════════════════ */
function Retro80sScene({ color }: SceneProps) {
  const group    = useRef<THREE.Group>(null);
  const coneRefs = useRef<(THREE.Mesh | null)[]>([]);
  const mouse    = useMouseNDC();

  const { gridBuf, cones } = useMemo(() => {
    const verts: number[] = [];
    for (let xi = -10; xi <= 10; xi += 1) {
      verts.push(xi, -3, -1, xi, -3, -32);
    }
    let z = -1;
    for (let hi = 0; hi < 20; hi++) {
      verts.push(-10, -3, z, 10, -3, z);
      z -= 0.5 + hi * 0.14;
    }
    const gridBuf = new Float32Array(verts);
    const seed = [0.13, 0.67, 0.34, 0.82, 0.22, 0.55, 0.91];
    const cones = seed.map((s, i) => ({
      x:      (s * 2 - 1) * 11,
      y:      -0.5 + seed[(i + 2) % 7] * 3,
      z:      -4 - seed[(i + 3) % 7] * 16,
      speedY: 0.005 + seed[(i + 1) % 7] * 0.007,
    }));
    return { gridBuf, cones };
  }, []);

  useFrame((_state) => {
    if (!group.current) return;
    const mx = mouse.current.x;
    const my = mouse.current.y;
    group.current.rotation.y += 0.05 * (mx * 0.2 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-my * 0.1 - group.current.rotation.x);
    // Camera elevator: mouse Y lifts/lowers the scene
    group.current.position.y += 0.04 * (my * 2.8 - group.current.position.y);
    // Pyramid rotation — spin faster at high |mouse.x|
    const spinBoost = 1 + Math.abs(mx) * 1.2;
    coneRefs.current.forEach((c, i) => {
      if (!c) return;
      c.rotation.y += cones[i].speedY * spinBoost;
    });
  });

  return (
    <group ref={group}>
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
   Mouse X drifts columns left/right. Mouse Y controls fall speed:
   top of screen = slow trickle, bottom = blizzard of digits.
   ══════════════════════════════════════════════════════════════════════════ */
function MatrixScene({ color }: SceneProps) {
  const group  = useRef<THREE.Group>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const mouse  = useMouseNDC();

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

  useFrame((_state, delta) => {
    if (!geoRef.current || !group.current) return;
    const mx = mouse.current.x;
    const my = mouse.current.y;
    // X drift
    group.current.position.x += 0.04 * (mx * 1.8 - group.current.position.x);
    // Mouse Y controls speed: top (my=+1) = slow, bottom (my=-1) = fast
    const speedMult = 0.4 + (1 - my) * 0.8;

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) - speeds[i] * speedMult * delta;
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
   Mouse distance from screen centre controls pulse speed:
   near centre = calm, corners = fast frantic pulse.
   ══════════════════════════════════════════════════════════════════════════ */
function SynthwaveScene({ color }: SceneProps) {
  const group    = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs  = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const mouse    = useMouseNDC();

  const RINGS  = 14;
  const MAX_R  = 18;
  const phases = useMemo(() =>
    Array.from({ length: RINGS }, (_, i) => i * (MAX_R / RINGS))
  , []);

  useFrame((state) => {
    if (!group.current) return;
    const t  = state.clock.elapsedTime;
    const mx = mouse.current.x;
    const my = mouse.current.y;
    group.current.rotation.y += 0.05 * (mx * 0.3 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-my * 0.3 - group.current.rotation.x);

    // Distance from screen centre controls pulse speed
    const dist      = Math.sqrt(mx * mx + my * my);
    const pulseMult = 1.0 + dist * 1.4;

    for (let i = 0; i < RINGS; i++) {
      const ring = ringRefs.current[i];
      const mat  = matRefs.current[i];
      if (!ring || !mat) continue;
      const r = ((t * 3.8 * pulseMult + phases[i]) % MAX_R);
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
   Mouse Y stretches/squashes the vortex funnel:
   mouse up = tall dramatic tornado, mouse down = flattened disk.
   ══════════════════════════════════════════════════════════════════════════ */
function DraculaScene({ color }: SceneProps) {
  const group       = useRef<THREE.Group>(null);
  const geoRef      = useRef<THREE.BufferGeometry>(null);
  const heightScale = useRef(1.0);
  const mouse       = useMouseNDC();
  const COUNT       = 1000;

  const { posArr, baseAngle, radius, baseHeight, angularSpeed } = useMemo(() => {
    const posArr       = new Float32Array(COUNT * 3);
    const baseAngle    = new Float32Array(COUNT);
    const radius       = new Float32Array(COUNT);
    const baseHeight   = new Float32Array(COUNT);
    const angularSpeed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const t  = i / COUNT;
      const a  = t * Math.PI * 14;
      const r  = t * 9.5 + 0.3 + (Math.random() - 0.5) * 1.0;
      const h  = (1 - t) * 8 - 4;
      baseAngle[i]    = a;
      radius[i]       = r;
      baseHeight[i]   = h + (Math.random() - 0.5) * 0.7;
      angularSpeed[i] = 0.45 / (1 + r * 0.18);
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
    const mx = mouse.current.x;
    const my = mouse.current.y;
    group.current.rotation.y += 0.05 * (mx * 0.4 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-my * 0.3 - group.current.rotation.x);

    // Mouse Y stretches/squashes vortex
    heightScale.current += 0.05 * ((1.0 + my * 0.55) - heightScale.current);

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      phases.current[i] += angularSpeed[i] * delta;
      const a = baseAngle[i] + phases.current[i];
      pos.setXYZ(
        i,
        Math.cos(a) * radius[i],
        baseHeight[i] * heightScale.current + Math.sin(t * 0.6 + i * 0.012) * 0.5,
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
   Mouse position creates a ripple on the surface that emanates outward
   from wherever the cursor is projected onto the ocean plane.
   ══════════════════════════════════════════════════════════════════════════ */
function OceanScene({ color }: SceneProps) {
  const group  = useRef<THREE.Group>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const mouse  = useMouseNDC();
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
    const mx = mouse.current.x;
    const my = mouse.current.y;
    group.current.rotation.y += 0.05 * (mx * 0.3  - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-0.35 - my * 0.12 - group.current.rotation.x);

    // Project mouse NDC to approximate world XY (ocean plane)
    const mwx = mx * 14;
    const mwz = -my * 8;

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const x = baseXZ[i * 2];
      const z = baseXZ[i * 2 + 1];
      const d = Math.sqrt(x * x + z * z);
      const y = Math.sin(x * 0.34 + t * 1.1) * 1.4
              + Math.sin(z * 0.28 + t * 0.85) * 0.95
              + Math.sin(d * 0.38 - t * 1.4) * 0.7;
      // Mouse ripple
      const d2     = Math.sqrt((x - mwx) ** 2 + (z - mwz) ** 2);
      const ripple = Math.sin(d2 * 0.9 - t * 2.5) * 0.55 * Math.exp(-d2 / 11);
      pos.setY(i, y + ripple);
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
   Mouse distance from screen centre controls heartbeat speed:
   cursor near centre = frantic fast pulse, edges = slow ominous throb.
   ══════════════════════════════════════════════════════════════════════════ */
function BloodMoonScene({ color }: SceneProps) {
  const group   = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const moonMat = useRef<THREE.MeshBasicMaterial>(null);
  const geoRef  = useRef<THREE.BufferGeometry>(null);
  const mouse   = useMouseNDC();
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
    const mx = mouse.current.x;
    const my = mouse.current.y;
    group.current.rotation.y += 0.05 * (mx * 0.35 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-my * 0.25 - group.current.rotation.x);

    // Mouse proximity to centre → heartbeat speed
    const mouseR     = Math.sqrt(mx * mx + my * my);
    const pulseSpeed = 1.2 + (1 - mouseR) * 1.8;

    if (moonRef.current && moonMat.current) {
      const pulse = Math.sin(t * pulseSpeed) * 0.14 + 1;
      moonRef.current.scale.setScalar(pulse);
      moonMat.current.opacity = 0.5 + Math.sin(t * pulseSpeed) * 0.2;
    }

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
   Mouse X controls galaxy rotation: left = reverse spin, right = faster.
   ══════════════════════════════════════════════════════════════════════════ */
function SolarGoldScene({ color }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const mouse = useMouseNDC();
  const ARMS    = 3;
  const PER_ARM = 420;
  const CORE    = 70;
  const COUNT   = ARMS * PER_ARM + CORE;

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    let idx = 0;
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

  useFrame((_state) => {
    if (!group.current) return;
    const mx = mouse.current.x;
    const my = mouse.current.y;
    group.current.rotation.y += 0.05 * (mx * 0.35 - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-0.22 - my * 0.1 - group.current.rotation.x);
    // Mouse X controls galaxy spin direction and rate
    group.current.rotation.y += 0.0035 + mx * 0.004;
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
   Mouse X drifts snow like wind. Mouse Y controls fall speed:
   top of screen = gentle drift, bottom = blizzard.
   ══════════════════════════════════════════════════════════════════════════ */
function ArcticScene({ color }: SceneProps) {
  const group     = useRef<THREE.Group>(null);
  const geoRef    = useRef<THREE.BufferGeometry>(null);
  const flakeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const mouse     = useMouseNDC();
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
      x:       (s * 2 - 1) * 18,
      y:       (seeds[(i + 3) % 8] * 2 - 1) * 14,
      z:       -10 + seeds[(i + 1) % 8] * 10,
      fallSpd: 0.5 + seeds[(i + 2) % 8] * 0.8,
      rotSpd:  (seeds[(i + 4) % 8] - 0.5) * 0.012,
      radius:  1.0 + seeds[(i + 5) % 8] * 1.8,
    }));
    return { posArr, fallSpeeds, flakeData };
  }, []);

  useFrame((_state, delta) => {
    if (!geoRef.current || !group.current) return;
    const mx = mouse.current.x;
    const my = mouse.current.y;
    // Wind drift
    group.current.position.x += 0.03 * (mx * 2.8 - group.current.position.x);
    // Mouse Y controls fall speed: top=gentle, bottom=blizzard
    const speedMult = 0.4 + (1 - my) * 1.3;

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) - fallSpeeds[i] * speedMult * delta * 8;
      if (y < -22) y = 22;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    flakeRefs.current.forEach((flake, i) => {
      if (!flake) return;
      flake.position.y -= flakeData[i].fallSpd * speedMult * delta * 1.2;
      flake.rotation.z  += flakeData[i].rotSpd;
      if (flake.position.y < -16) flake.position.y = 16;
    });
  });

  return (
    <group ref={group}>
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
