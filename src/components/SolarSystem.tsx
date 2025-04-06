import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
  position: [number, number, number]; // Used only for fixed (non-orbiting) bodies
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  isHeliocentric: boolean;
  name: string;
  heliocentricDistance: { au: number; km: string };
  geocentricDistance?: { earthRadii: number; km: string };
  children?: React.ReactNode;
}

interface OrbitRingProps {
  radius: number;
  size?: number;
  color: string;
  isVisible: boolean;
  planetName: string;
  heliocentricDistance: { au: number; km: string };
  geocentricDistance?: { earthRadii: number; km: string };
  isHeliocentric: boolean;
}

const OrbitRing: React.FC<OrbitRingProps> = ({
  radius,
  color,
  isVisible,
  planetName,
  heliocentricDistance,
  geocentricDistance,
  isHeliocentric,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  if (!isVisible) return null;

  const getHoverInfo = () => {
    if (isHeliocentric) {
      return `${planetName}\nDistance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})`;
    } else if (geocentricDistance) {
      return `${planetName}\nDistance from Earth: ${geocentricDistance.earthRadii} Earth radii (${geocentricDistance.km})`;
    }
    return planetName;
  };

  return (
    <group>
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, radius === 394.8 ? 0.2 : 0.05, 32, 100]} />
        <meshStandardMaterial
          color={color}
          opacity={radius === 394.8 ? 1 : 0.8}
          transparent
          emissive={color}
          emissiveIntensity={isHovered ? 2 : (radius === 394.8 ? 1.2 : 0.6)}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onClick={() => {
          const now = Date.now();
          if (now - lastClickTime > 200) {
            setIsSelected(!isSelected);
            setLastClickTime(now);
          }
        }}
      >
        <torusGeometry args={[radius, 0.5, 32, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {isHovered && (
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      )}
      <Html position={[0, 2, 0]}>
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            whiteSpace: 'pre-line',
            fontSize: '14px',
            pointerEvents: 'none',
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            display: isSelected ? 'block' : 'none',
          }}
        >
          {getHoverInfo()}
        </div>
      </Html>
    </group>
  );
};

const Planet: React.FC<PlanetProps> = ({
  position,
  size,
  color,
  orbitRadius,
  orbitSpeed,
  isHeliocentric,
  name,
  heliocentricDistance,
  geocentricDistance,
  children,
}) => {
  // Use a group for the orbiting body so that its transform is relative
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [angle, setAngle] = useState(0);
  const [isSelected, setIsSelected] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 200) {
      setIsSelected(!isSelected);
      setLastClickTime(now);
    }
  };

  useFrame(() => {
    if (!groupRef.current || !meshRef.current || !glowRef.current) return;
    const newAngle = angle + orbitSpeed;
    setAngle(newAngle);
    // If orbitRadius > 0, update the group’s position (the orbit center is the parent's origin)
    if (orbitRadius > 0) {
      groupRef.current.position.x = Math.cos(newAngle) * orbitRadius;
      groupRef.current.position.z = Math.sin(newAngle) * orbitRadius;
    } else {
      // For bodies that don't orbit (like a fixed Sun in heliocentric mode)
      groupRef.current.position.set(...position);
    }
    // Rotate the actual mesh for a subtle spin effect
    meshRef.current.rotation.y += 0.005;
    glowRef.current.rotation.y += 0.005;
  });

  const getHoverInfo = () => {
    if (isHeliocentric) {
      return `${name}\nDistance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})`;
    } else if (geocentricDistance) {
      return `${name}\nDistance from Earth: ${geocentricDistance.earthRadii} Earth radii (${geocentricDistance.km})`;
    }
    return name;
  };

  return (
    // The group here represents the pivot for the orbit.
    // For orbiting bodies (orbitRadius > 0) the initial position is set to [orbitRadius, 0, 0].
    // For fixed bodies (like the Sun in heliocentric mode), use the provided position.
    <group ref={groupRef} position={orbitRadius > 0 ? [orbitRadius, 0, 0] : position}>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh ref={glowRef} scale={[1.4, 1.4, 1.4]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Html position={[0, size + 1, 0]}>
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            whiteSpace: 'pre-line',
            fontSize: '14px',
            pointerEvents: 'none',
            opacity: isSelected ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            display: isSelected ? 'block' : 'none',
          }}
        >
          {getHoverInfo()}
        </div>
      </Html>
      {children}
    </group>
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
      <Canvas camera={{ position: [0, 800, 800], fov: 45 }}>
        <ambientLight intensity={0.15} />
        <pointLight position={[10, 10, 10]} intensity={1.0} color="#E6F3FF" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#F0F8FF" />
        <Stars radius={400} depth={100} count={25000} factor={8} saturation={0.8} fade speed={1.5} />
        <fog attach="fog" args={['#000B1E', 500, 2500]} />
        <Stars radius={300} depth={80} count={20000} factor={7} saturation={0.6} fade speed={1.2} />
        <Stars radius={200} depth={60} count={15000} factor={6} saturation={0.4} fade speed={0.8} />
        <fog attach="fog" args={['#000B2E', 400, 2000]} />
        <Stars radius={150} depth={50} count={10000} factor={5} saturation={0.3} fade speed={0.5} />
        <fog attach="fog" args={['#000B1E', 400, 2000]} />
        <Stars radius={200} depth={60} count={8000} factor={5} saturation={0.3} fade />
        <Stars radius={200} depth={60} count={10000} factor={6} saturation={0.5} fade speed={1.5} />
        <fog attach="fog" args={['#000B2E', 400, 1600]} />
        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade />

        {/* Orbit Rings for the planets */}
        {!isHeliocentric && (
          <OrbitRing
            radius={120}
            color="#FFD700"
            isVisible
            planetName="Sun"
            heliocentricDistance={{ au: 0, km: "0 km" }}
            geocentricDistance={{ earthRadii: 1200, km: "~7,645,200 km" }}
            isHeliocentric={isHeliocentric}
          />
        )}
        <OrbitRing
          radius={3.9}
          color="#A0522D"
          isVisible
          planetName="Mercury"
          heliocentricDistance={{ au: 0.39, km: "~57.9 million km" }}
          geocentricDistance={{ earthRadii: 79, km: "~503,000 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing
          radius={7.2}
          color="#DEB887"
          isVisible
          planetName="Venus"
          heliocentricDistance={{ au: 0.72, km: "~108.2 million km" }}
          geocentricDistance={{ earthRadii: 120, km: "~764,500 km" }}
          isHeliocentric={isHeliocentric}
        />
        {isHeliocentric && (
            <OrbitRing
            radius={10}
            color="#4169E1"
            isVisible
            planetName="Earth"
            heliocentricDistance={{ au: 1.00, km: "~149.6 million km" }}
            geocentricDistance={{ earthRadii: 0, km: "0 km" }}
            isHeliocentric={isHeliocentric}
          />
        )}
        <OrbitRing
          radius={15.2}
          color="#FF4500"
          isVisible
          planetName="Mars"
          heliocentricDistance={{ au: 1.52, km: "~227.9 million km" }}
          geocentricDistance={{ earthRadii: 1800, km: "~11,468,000 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing
          radius={52}
          color="#DEB887"
          isVisible
          planetName="Jupiter"
          heliocentricDistance={{ au: 5.20, km: "~778.6 million km" }}
          geocentricDistance={{ earthRadii: 2400, km: "~15,290,000 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing
          radius={95.8}
          color="#FFE4B5"
          isVisible
          planetName="Saturn"
          heliocentricDistance={{ au: 9.58, km: "~1.433 billion km" }}
          geocentricDistance={{ earthRadii: 3600, km: "~22,935,600 km" }}
          isHeliocentric={isHeliocentric}
        />
        {isHeliocentric && (
          <>
            <OrbitRing
              radius={192}
              color="#87CEEB"
              isVisible
              planetName="Uranus"
              heliocentricDistance={{ au: 19.20, km: "~2.872 billion km" }}
              isHeliocentric={isHeliocentric}
            />
            <OrbitRing
              radius={300.5}
              color="#1E90FF"
              isVisible
              planetName="Neptune"
              heliocentricDistance={{ au: 30.05, km: "~4.495 billion km" }}
              isHeliocentric={isHeliocentric}
            />
            <OrbitRing
              radius={394.8}
              color="#8B4513"
              isVisible
              planetName="Pluto"
              heliocentricDistance={{ au: 39.48, km: "~5.906 billion km" }}
              isHeliocentric={isHeliocentric}
            />
          </>
        )}

        {/* Sun */}
        <Planet
          position={[0, 0, 0]}
          size={2}
          color="#FFD700"
          orbitRadius={isHeliocentric ? 0 : 120}
          orbitSpeed={0.02}
          isHeliocentric={isHeliocentric}
          name="Sun"
          heliocentricDistance={{ au: 0, km: "0 km" }}
          geocentricDistance={{ earthRadii: 1200, km: "~7,645,200 km" }}
        />

        {/* Mercury */}
        <Planet
          position={[3.9, 0, 0]}
          size={0.4}
          color="#A0522D"
          orbitRadius={3.9}
          orbitSpeed={0.047}
          isHeliocentric={isHeliocentric}
          name="Mercury"
          heliocentricDistance={{ au: 0.39, km: "~57.9 million km" }}
          geocentricDistance={{ earthRadii: 79, km: "~503,000 km" }}
        />

        {/* Venus */}
        <Planet
          position={[7.2, 0, 0]}
          size={0.9}
          color="#DEB887"
          orbitRadius={7.2}
          orbitSpeed={0.035}
          isHeliocentric={isHeliocentric}
          name="Venus"
          heliocentricDistance={{ au: 0.72, km: "~108.2 million km" }}
          geocentricDistance={{ earthRadii: 120, km: "~764,500 km" }}
        />

        {/* Earth with nested Moon */}
        <Planet
          // In heliocentric mode, Earth’s orbit is computed using orbitRadius (10).
          // In geocentric mode, Earth is fixed at the center.
          position={isHeliocentric ? [10, 0, 0] : [0, 0, 0]}
          size={1}
          color="#4169E1"
          orbitRadius={isHeliocentric ? 10 : 0}
          orbitSpeed={0.029}
          isHeliocentric={isHeliocentric}
          name="Earth"
          heliocentricDistance={{ au: 1.0, km: "~149.6 million km" }}
          geocentricDistance={{ earthRadii: 0, km: "0 km" }}
        >
          {/* Nest the Moon as a child of Earth so its orbit is relative to Earth */}
          <Planet
            position={[0, 0, 0]} // starts at Earth's center
            size={0.27}
            color="#FFFFFF"
            orbitRadius={2}
            orbitSpeed={0.07}
            isHeliocentric={isHeliocentric}
            name="Moon"
            heliocentricDistance={{ au: 1.0, km: "~149.6 million km" }}
            geocentricDistance={{ earthRadii: 60.3, km: "~384,400 km" }}
          />
          <OrbitRing
            radius={2}
            color="#FFFFFF"
            isVisible
            planetName="Moon"
            heliocentricDistance={{ au: 1.0, km: "~149.6 million km" }}
            geocentricDistance={{ earthRadii: 60.3, km: "~384,400 km" }}
            isHeliocentric={isHeliocentric}
          />
        </Planet>

        {/* Mars */}
        <Planet
          position={[15.2, 0, 0]}
          size={0.5}
          color="#FF4500"
          orbitRadius={15.2}
          orbitSpeed={0.024}
          isHeliocentric={isHeliocentric}
          name="Mars"
          heliocentricDistance={{ au: 1.52, km: "~227.9 million km" }}
          geocentricDistance={{ earthRadii: 1800, km: "~11,468,000 km" }}
        />

        {/* Jupiter */}
        <Planet
          position={[52, 0, 0]}
          size={2}
          color="#DEB887"
          orbitRadius={52}
          orbitSpeed={0.013}
          isHeliocentric={isHeliocentric}
          name="Jupiter"
          heliocentricDistance={{ au: 5.20, km: "~778.6 million km" }}
          geocentricDistance={{ earthRadii: 2400, km: "~15,290,000 km" }}
        />

        {/* Saturn */}
        <Planet
          position={[95.8, 0, 0]}
          size={1.8}
          color="#FFE4B5"
          orbitRadius={95.8}
          orbitSpeed={0.009}
          isHeliocentric={isHeliocentric}
          name="Saturn"
          heliocentricDistance={{ au: 9.58, km: "~1.433 billion km" }}
          geocentricDistance={{ earthRadii: 3600, km: "~22,935,600 km" }}
        />

        {/* Uranus - Only in Heliocentric */}
        {isHeliocentric && (
          <Planet
            position={[192, 0, 0]}
            size={1.4}
            color="#87CEEB"
            orbitRadius={192}
            orbitSpeed={0.006}
            isHeliocentric={isHeliocentric}
            name="Uranus"
            heliocentricDistance={{ au: 19.20, km: "~2.872 billion km" }}
          />
        )}

        {/* Neptune - Only in Heliocentric */}
        {isHeliocentric && (
          <Planet
            position={[300.5, 0, 0]}
            size={1.3}
            color="#1E90FF"
            orbitRadius={300.5}
            orbitSpeed={0.005}
            isHeliocentric={isHeliocentric}
            name="Neptune"
            heliocentricDistance={{ au: 30.05, km: "~4.495 billion km" }}
          />
        )}

        {/* Pluto - Only in Heliocentric */}
        {isHeliocentric && (
          <Planet
            position={[394.8, 0, 0]}
            size={2}
            color="#8B4513"
            orbitRadius={394.8}
            orbitSpeed={0.004}
            isHeliocentric={isHeliocentric}
            name="Pluto"
            heliocentricDistance={{ au: 39.48, km: "~5.906 billion km" }}
          />
        )}

        <OrbitControls enablePan enableZoom enableRotate maxDistance={1000} />
      </Canvas>
    </div>
  );
};

export default SolarSystem;
