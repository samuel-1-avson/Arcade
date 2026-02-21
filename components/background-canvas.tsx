'use client';

import { Canvas } from '@react-three/fiber';
import { AbstractBackground } from './abstract-background';

export function BackgroundCanvas() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
        <AbstractBackground />
      </Canvas>
    </div>
  );
}
