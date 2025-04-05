import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
  position: [number, number, number];
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  isHeliocentric: boolean;
}

const Planet: React.FC<PlanetProps> = ({ position, size, color, orbitRadius, orbitSpeed, isHeliocentric }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [angle, setAngle] = useState(0);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const newAngle = angle + orbitSpeed;
    setAngle(newAngle);

    if (isHeliocentric) {
      // Heliocentric: planets orbit around the sun (center)
      if (color === '#FFD700') { // Sun
        meshRef.current.position.x = 0;
        meshRef.current.position.z = 0;
      } else {
        meshRef.current.position.x = Math.cos(angle) * orbitRadius;
        meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      }
    } else {
      // Geocentric: planets orbit around the Earth
      if (color === '#4169E1') { // Earth
        meshRef.current.position.x = 0;
        meshRef.current.position.z = 0;
      } else if (color === '#FFD700') { // Sun
        meshRef.current.position.x = Math.cos(angle) * orbitRadius;
        meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      } else {
        // Other planets orbit relative to Earth's position
        meshRef.current.position.x = Math.cos(angle) * orbitRadius;
        meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const SolarSystem: React.FC = () => {
  const [isHeliocentric, setIsHeliocentric] = useState(true);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <button
        onClick={() => setIsHeliocentric(!isHeliocentric)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Toggle {isHeliocentric ? 'Geocentric' : 'Heliocentric'}
      </button>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '5px',
          maxWidth: '300px',
        }}
      >
        <h3>{isHeliocentric ? 'Heliocentric Model' : 'Geocentric Model'}</h3>
        <p>
          {isHeliocentric
            ? 'The Sun is at the center of the solar system, with all planets including Pluto and the Kuiper Belt.'
            : 'The Earth is at the center, showing planets up to Saturn as known in ancient times.'}
        </p>
      </div>
      <Canvas camera={{ position: [0, 30, 30], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade />
        
        {/* Sun */}
        <Planet
          position={[0, 0, 0]}
          size={2.5}
          color="#FFD700"
          orbitRadius={10}
          orbitSpeed={0.02}
          isHeliocentric={isHeliocentric}
        />

        {/* Mercury */}
        {(isHeliocentric || !isHeliocentric) && (
          <Planet
            position={[4.5, 0, 0]}
            size={0.4}
            color="#A0522D"
            orbitRadius={4.5}
            orbitSpeed={0.047}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Venus */}
        {(isHeliocentric || !isHeliocentric) && (
          <Planet
            position={[7, 0, 0]}
            size={0.9}
            color="#DEB887"
            orbitRadius={7}
            orbitSpeed={0.035}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Earth */}
        <Planet
          position={isHeliocentric ? [10, 0, 0] : [0, 0, 0]}
          size={1}
          color="#4169E1"
          orbitRadius={10}
          orbitSpeed={0.029}
          isHeliocentric={isHeliocentric}
        />

        {/* Mars */}
        {(isHeliocentric || !isHeliocentric) && (
          <Planet
            position={[13, 0, 0]}
            size={0.5}
            color="#FF4500"
            orbitRadius={13}
            orbitSpeed={0.024}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Jupiter */}
        {(isHeliocentric || !isHeliocentric) && (
          <Planet
            position={[17, 0, 0]}
            size={2}
            color="#DEB887"
            orbitRadius={17}
            orbitSpeed={0.013}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Saturn */}
        {(isHeliocentric || !isHeliocentric) && (
          <Planet
            position={[21, 0, 0]}
            size={1.8}
            color="#FFE4B5"
            orbitRadius={21}
            orbitSpeed={0.009}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Uranus - Only in Heliocentric */}
        {isHeliocentric && (
          <Planet
            position={[25, 0, 0]}
            size={1.4}
            color="#87CEEB"
            orbitRadius={25}
            orbitSpeed={0.006}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Neptune - Only in Heliocentric */}
        {isHeliocentric && (
          <Planet
            position={[28, 0, 0]}
            size={1.3}
            color="#1E90FF"
            orbitRadius={28}
            orbitSpeed={0.005}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Pluto - Only in Heliocentric */}
        {isHeliocentric && (
          <Planet
            position={[31, 0, 0]}
            size={0.3}
            color="#8B4513"
            orbitRadius={31}
            orbitSpeed={0.004}
            isHeliocentric={isHeliocentric}
          />
        )}

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

export default SolarSystem;