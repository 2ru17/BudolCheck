import React, { Component, ErrorInfo, ReactNode, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Torus } from '@react-three/drei';
import type { Group } from 'three';
import { getDeviceProfile } from '../../lib/deviceCapability.ts';
import { ShoppingBagMascotSvg } from '../icons/SvgIcons.tsx';

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const BagMesh: React.FC = () => {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.9) * 0.22 + state.pointer.x * 0.25;
    groupRef.current.rotation.x = Math.cos(t * 0.7) * 0.06 - state.pointer.y * 0.12;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.18} floatIntensity={0.35}>
      <group ref={groupRef} position={[0, -0.15, 0]}>
        <RoundedBox args={[1.65, 1.85, 0.72]} radius={0.14} smoothness={4}>
          <meshStandardMaterial color="#FAD6B8" roughness={0.55} metalness={0.05} />
        </RoundedBox>

        <RoundedBox args={[1.7, 1.9, 0.75]} radius={0.15} smoothness={2}>
          <meshBasicMaterial color="#2C2623" wireframe transparent opacity={0.12} />
        </RoundedBox>

        <Torus args={[0.38, 0.055, 12, 32, Math.PI]} position={[0, 0.92, 0.12]}>
          <meshStandardMaterial color="#2C2623" roughness={0.4} />
        </Torus>
        <Torus args={[0.38, 0.055, 12, 32, Math.PI]} position={[0, 0.92, -0.12]}>
          <meshStandardMaterial color="#2C2623" roughness={0.4} />
        </Torus>

        <mesh position={[-0.36, 0.15, 0.38]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#2C2623" />
        </mesh>
        <mesh position={[0.36, 0.15, 0.38]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#2C2623" />
        </mesh>

        <mesh position={[-0.5, -0.02, 0.37]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color="#F09B8B" />
        </mesh>
        <mesh position={[0.5, -0.02, 0.37]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color="#F09B8B" />
        </mesh>

        <Torus
          args={[0.2, 0.038, 10, 24, Math.PI]}
          position={[0, -0.05, 0.38]}
          rotation={[0, 0, Math.PI]}
        >
          <meshStandardMaterial color="#2C2623" />
        </Torus>
      </group>
    </Float>
  );
};

export const ThreeShoppingBag: React.FC<{ size?: number }> = ({ size = 160 }) => {
  const [contextLost, setContextLost] = useState(false);
  const [profile] = useState(() => getDeviceProfile());

  useEffect(() => {
    return () => {
      setContextLost(false);
    };
  }, []);

  const svgFallback = (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center"
    >
      <ShoppingBagMascotSvg size={Math.round(size * 0.85)} />
    </div>
  );

  if (!profile.supportsWebGL || contextLost) {
    return svgFallback;
  }

  return (
    <WebGLErrorBoundary fallback={svgFallback}>
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center select-none"
        aria-label="Interactive 3D BudolCheck Shopping Bag Mascot"
      >
        <Canvas
          dpr={profile.maxDpr}
          camera={{ position: [0, 0.15, 3.3], fov: 42 }}
          gl={{
            powerPreference: profile.isMobileViewport ? 'low-power' : 'default',
            antialias: !profile.isLowEndHardware,
            alpha: true,
          }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const handleContextLost = (event: Event) => {
              event.preventDefault();
              setContextLost(true);
            };
            canvas.addEventListener('webglcontextlost', handleContextLost, false);
          }}
        >
          <ambientLight intensity={1.15} />
          <directionalLight position={[3, 4, 4]} intensity={1.1} />
          <directionalLight position={[-2, -2, 2]} intensity={0.4} color="#789668" />
          <BagMesh />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};

export default ThreeShoppingBag;
