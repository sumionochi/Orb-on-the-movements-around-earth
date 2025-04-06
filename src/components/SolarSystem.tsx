import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
  position: [number, number, number];
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  isHeliocentric: boolean;
  name: string;
  heliocentricDistance: { au: number; km: string };
  geocentricDistance?: { earthRadii: number; km: string };
}

interface OrbitRingProps {
  radius: number;
  color: string;
  isVisible: boolean;
  planetName: string;
  heliocentricDistance: { au: number; km: string };
  geocentricDistance?: { earthRadii: number; km: string };
  isHeliocentric: boolean;
}

const OrbitRing: React.FC<OrbitRingProps> = ({ radius, color, isVisible, planetName, heliocentricDistance, geocentricDistance, isHeliocentric }) => {
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
      <group>
        {/* Visible ring */}
        <mesh 
          ref={meshRef}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[radius, radius === 394.8 ? 0.2 : 0.05, 32, 100]} />
          <meshStandardMaterial
            color={color}
            opacity={radius === 394.8 ? 1 : 0.8}
            transparent={true}
            emissive={color}
            emissiveIntensity={isHovered ? 2 : (radius === 394.8 ? 1.2 : 0.6)}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        {/* Invisible hit box */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
          onClick={() => {
            const now = Date.now();
            if (now - lastClickTime > 200) { // Debounce clicks
              setIsSelected(!isSelected);
              setLastClickTime(now);
            }
          }}
        >
          <torusGeometry args={[radius, 0.5, 32, 100]} />
          <meshBasicMaterial
            transparent={true}
            opacity={0}
          />
        </mesh>
        {isHovered && (
          <meshBasicMaterial
            color={color}
            transparent={true}
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        )}
      </group>
      <Html position={[radius, 2, 0]}>
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
            display: isSelected ? 'block' : 'none'
          }}
        >
          {getHoverInfo()}
        </div>
      </Html>
    </group>
  );
};

const Planet: React.FC<PlanetProps> = ({ position, size, color, orbitRadius, orbitSpeed, isHeliocentric, name, heliocentricDistance, geocentricDistance }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [angle, setAngle] = useState(0);
  const [isSelected, setIsSelected] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  useFrame(() => {
    if (!meshRef.current || !glowRef.current) return;
    
    const newAngle = angle + orbitSpeed;
    setAngle(newAngle);

    // Update planet position
    if (isHeliocentric) {
      if (color === '#FFD700') {
        meshRef.current.position.x = 0;
        meshRef.current.position.z = 0;
        glowRef.current.position.x = 0;
        glowRef.current.position.z = 0;
      } else {
        meshRef.current.position.x = Math.cos(angle) * orbitRadius;
        meshRef.current.position.z = Math.sin(angle) * orbitRadius;
        glowRef.current.position.x = meshRef.current.position.x;
        glowRef.current.position.z = meshRef.current.position.z;
      }
    } else {
      if (color === '#4169E1') {
        meshRef.current.position.x = 0;
        meshRef.current.position.z = 0;
        glowRef.current.position.x = 0;
        glowRef.current.position.z = 0;
      } else if (color === '#FFD700') {
        meshRef.current.position.x = Math.cos(angle) * orbitRadius;
        meshRef.current.position.z = Math.sin(angle) * orbitRadius;
        glowRef.current.position.x = meshRef.current.position.x;
        glowRef.current.position.z = meshRef.current.position.z;
      } else {
        meshRef.current.position.x = Math.cos(angle) * orbitRadius;
        meshRef.current.position.z = Math.sin(angle) * orbitRadius;
        glowRef.current.position.x = meshRef.current.position.x;
        glowRef.current.position.z = meshRef.current.position.z;
      }
    }

    // Gentle rotation animation
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

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 200) { // Debounce clicks
      setIsSelected(!isSelected);
      setLastClickTime(now);
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh ref={glowRef} position={position} scale={[1.4, 1.4, 1.4]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Html position={[position[0], position[1] + size + 1, position[2]]}>
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
            display: isSelected ? 'block' : 'none'
          }}
        >
          {getHoverInfo()}
        </div>
      </Html>
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
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#FFF5E1" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#E8F6FF" />
        <Stars radius={300} depth={80} count={15000} factor={7} saturation={0.8} fade speed={1.2} />
        <fog attach="fog" args={["#000000", 400, 2000]} />
        <Stars radius={200} depth={60} count={8000} factor={5} saturation={0.3} fade />
        <Stars radius={200} depth={60} count={10000} factor={6} saturation={0.5} fade speed={1.5} />
        <fog attach="fog" args={["#080808", 400, 1600]} />
        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade />
        
        {/* Orbit Rings */}
        <OrbitRing 
          radius={3.9} 
          color="#A0522D" 
          isVisible={true} 
          planetName="Mercury"
          heliocentricDistance={{ au: 0.39, km: "~57.9 million km" }}
          geocentricDistance={{ earthRadii: 79, km: "~503,000 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing 
          radius={7.2} 
          color="#DEB887" 
          isVisible={true} 
          planetName="Venus"
          heliocentricDistance={{ au: 0.72, km: "~108.2 million km" }}
          geocentricDistance={{ earthRadii: 120, km: "~764,500 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing 
          radius={10} 
          color="#4169E1" 
          isVisible={true} 
          planetName="Earth"
          heliocentricDistance={{ au: 1.00, km: "~149.6 million km" }}
          geocentricDistance={{ earthRadii: 0, km: "0 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing 
          radius={15.2} 
          color="#FF4500" 
          isVisible={true} 
          planetName="Mars"
          heliocentricDistance={{ au: 1.52, km: "~227.9 million km" }}
          geocentricDistance={{ earthRadii: 1800, km: "~11,468,000 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing 
          radius={52} 
          color="#DEB887" 
          isVisible={true} 
          planetName="Jupiter"
          heliocentricDistance={{ au: 5.20, km: "~778.6 million km" }}
          geocentricDistance={{ earthRadii: 2400, km: "~15,290,000 km" }}
          isHeliocentric={isHeliocentric}
        />
        <OrbitRing 
          radius={95.8} 
          color="#FFE4B5" 
          isVisible={true} 
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
              isVisible={true} 
              planetName="Uranus"
              heliocentricDistance={{ au: 19.20, km: "~2.872 billion km" }}
              isHeliocentric={isHeliocentric}
            />
            <OrbitRing 
              radius={300.5} 
              color="#1E90FF" 
              isVisible={true} 
              planetName="Neptune"
              heliocentricDistance={{ au: 30.05, km: "~4.495 billion km" }}
              isHeliocentric={isHeliocentric}
            />
            <OrbitRing 
              radius={394.8} 
              color="#8B4513" 
              isVisible={true} 
              planetName="Pluto"
              heliocentricDistance={{ au: 39.48, km: "~5.906 billion km" }}
              isHeliocentric={isHeliocentric}
            />
          </>
        )}

        {/* Sun's orbit ring in geocentric mode */}
        {!isHeliocentric && (
          <OrbitRing 
            radius={120} 
            color="#FFD700" 
            isVisible={true} 
            planetName="Sun"
            heliocentricDistance={{ au: 0, km: "0 km" }}
            geocentricDistance={{ earthRadii: 1200, km: "~7,645,200 km" }}
            isHeliocentric={isHeliocentric}
          />
        )}

        {/* Sun */}
        <Planet
          position={[0, 0, 0]}
          size={4}
          color="#FFD700"
          orbitRadius={isHeliocentric ? 0 : 120}
          orbitSpeed={0.02}
          isHeliocentric={isHeliocentric}
          name="Sun"
          heliocentricDistance={{ au: 0, km: "0 km" }}
          geocentricDistance={{ earthRadii: 1200, km: "~7,645,200 km" }}
        />

        {/* Mercury */}
        {(isHeliocentric || !isHeliocentric) && (
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
        )}

        {/* Venus */}
        {(isHeliocentric || !isHeliocentric) && (
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
        )}

        {/* Earth */}
        <Planet
          position={isHeliocentric ? [10, 0, 0] : [0, 0, 0]}
          size={1}
          color="#4169E1"
          orbitRadius={10}
          orbitSpeed={0.029}
          isHeliocentric={isHeliocentric}
          name="Earth"
          heliocentricDistance={{ au: 1.00, km: "~149.6 million km" }}
          geocentricDistance={{ earthRadii: 0, km: "0 km" }}
        />

        {/* Mars */}
        {(isHeliocentric || !isHeliocentric) && (
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
        )}

        {/* Jupiter */}
        {(isHeliocentric || !isHeliocentric) && (
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
        )}

        {/* Saturn */}
        {(isHeliocentric || !isHeliocentric) && (
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
        )}

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

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} maxDistance={1000} />
      </Canvas>
    </div>
  );
};

export default SolarSystem;