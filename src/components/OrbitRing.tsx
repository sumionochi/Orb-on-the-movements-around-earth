import { useState, useMemo } from 'react';
import * as THREE from 'three';

interface OrbitRingProps {
    radius: number;
    size?: number;
    color: string;
    isVisible: boolean;
    planetName: string;
    heliocentricDistance: { au: number; km: string };
    geocentricDistance?: { earthRadii: number; km: string };
    isHeliocentric: boolean;
    onSelect?: (info: string | null) => void;
}
// Custom curve to compute the retrograde (epicycle) path
class RetrogradeCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  constructor(radius: number) {
    super();
    this.radius = radius;
  }
  getPoint(t: number): THREE.Vector3 {
    const angle = t * Math.PI * 2;
    // Deferent: main circle; Epicycle: 10% of orbit radius, rotating in reverse at double speed.
    const deferentX = Math.cos(angle) * this.radius;
    const deferentZ = Math.sin(angle) * this.radius;
    const epicycleRadius = this.radius * 0.1;
    const epicycleAngle = -2 * angle;
    const epiX = Math.cos(epicycleAngle) * epicycleRadius;
    const epiZ = Math.sin(epicycleAngle) * epicycleRadius;
    return new THREE.Vector3(deferentX + epiX, 0, deferentZ + epiZ);
  }
}

const OrbitRing: React.FC<OrbitRingProps> = ({
  radius,
  color,
  isVisible,
  planetName,
  heliocentricDistance,
  geocentricDistance,
  isHeliocentric,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
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

  // Determine if we should show the retrograde path.
  // In our simulation, retrograde motion applies in geocentric mode for outer planets (not Earth or Moon).
  const isRetrograde = !isHeliocentric && (planetName !== "Earth" && planetName !== "Moon");

  // If retrograde, build a tube geometry along the retrograde curve.
  const retroTubeGeometry = useMemo(() => {
    if (isRetrograde) {
      const curve = new RetrogradeCurve(radius);
      // Use the same tube radius as the visible path (0.05, or 0.2 for Pluto)
      const tubeRadius = radius === 394.8 ? 0.2 : 0.05;
      return new THREE.TubeGeometry(curve, 100, tubeRadius, 8, true);
    }
    return null;
  }, [isRetrograde, radius]);

  // Also create a thicker tube for the invisible hitbox.
  const hitboxTubeGeometry = useMemo(() => {
    if (isRetrograde) {
      const curve = new RetrogradeCurve(radius);
      return new THREE.TubeGeometry(curve, 100, 0.5, 8, true);
    }
    return null;
  }, [isRetrograde, radius]);

  return (
    <group>
      {isRetrograde ? (
        <>
          {/* Visible retrograde path */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <primitive object={retroTubeGeometry!} attach="geometry" />
            <meshStandardMaterial
              color={color}
              opacity={1}
              transparent
              emissive={color}
              emissiveIntensity={isHovered ? 2 : 1}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Invisible hitbox following the same retrograde path */}
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
            onClick={() => {
              const now = Date.now();
              if (now - lastClickTime > 200) {
                const newSelected = !isSelected;
                setIsSelected(newSelected);
                setLastClickTime(now);
                if (onSelect) {
                  onSelect(newSelected ? getHoverInfo() : null);
                }
              }
            }}
          >
            <primitive object={hitboxTubeGeometry!} attach="geometry" />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </>
      ) : (
        <>
          {/* For non-retrograde cases, show the regular torus ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
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
                const newSelected = !isSelected;
                setIsSelected(newSelected);
                setLastClickTime(now);
                if (onSelect) {
                  onSelect(newSelected ? getHoverInfo() : null);
                }
              }
            }}
          >
            <torusGeometry args={[radius, 0.5, 32, 100]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </>
      )}
    </group>
  );
};

export default OrbitRing;
