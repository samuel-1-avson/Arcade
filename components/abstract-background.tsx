"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { Float } from "@react-three/drei";

export function AbstractBackground() {
  const { theme } = useTheme();
  
  // Resolve current accent color based on theme
  const accentColor = useMemo(() => {
    switch (theme) {
      case "neon-pink":
        return "#ff007f";
      case "retro-80s":
        return "#ff4d00";
      case "matrix":
        return "#00ff00";
      case "dark":
      default:
        return "#00e5ff"; // Cyberpunk default
    }
  }, [theme]);

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Abstract floating group */}
      <Float
        speed={1.5} 
        rotationIntensity={0.5} 
        floatIntensity={1}
      >
        <ParticleSystem color={accentColor} />
      </Float>
    </group>
  );
}

function ParticleSystem({ color }: { color: string }) {
  const count = 1500;
  const points = useRef<THREE.Points>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Generate random positions and sizes for particles
  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Create a nice abstract shape (spherical distribution)
      const r = 20 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      sizes[i] = Math.random() * 0.15 + 0.05;
    }
    return [positions, sizes];
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    
    // Slow continuous rotation
    points.current.rotation.y = state.clock.elapsedTime * 0.05;
    points.current.rotation.x = state.clock.elapsedTime * 0.02;

    // Subtle parallax effect based on mouse (assuming we track window pointer elsewhere, or we can use state.pointer)
    // state.pointer runs from -1 to 1 based on canvas
    const targetX = (state.pointer.x * Math.PI) / 8;
    const targetY = (state.pointer.y * Math.PI) / 8;
    
    points.current.rotation.y += 0.05 * (targetX - points.current.rotation.y);
    points.current.rotation.x += 0.05 * (targetY - points.current.rotation.x);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
