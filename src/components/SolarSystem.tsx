import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';
import CameraTransition from './CameraTransition';

interface InfoData {
  title: string;
  summary: string;
  opengraphLink: string;
  opengraphImage: string;
}

interface PlanetProps {
  position: [number, number, number]; // For fixed (non-orbiting) bodies
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  isHeliocentric: boolean;
  name: string;
  heliocentricDistance: { au: number; km: string };
  geocentricDistance?: { earthRadii: number; km: string };
  children?: React.ReactNode;
  onSelect?: (info: InfoData | null) => void; // Updated type
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
  onSelect?: (info: InfoData | null) => void; // Updated type
}

// --- Retrograde Orbit Ring -------------------------------------------------
// This custom curve builds a retrograde (epicyclic) loop.
// For the ring we exaggerate the epicycle with amplitudeFactor=0.1 and speedMultiplier=2.
class RetrogradeCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  amplitudeFactor: number;
  speedMultiplier: number;
  constructor(radius: number, amplitudeFactor = 0.1, speedMultiplier = 2) {
    super();
    this.radius = radius;
    this.amplitudeFactor = amplitudeFactor;
    this.speedMultiplier = speedMultiplier;
  }
  getPoint(t: number): THREE.Vector3 {
    const angle = t * Math.PI * 2;
    // Deferent: main circular orbit.
    const deferentX = Math.cos(angle) * this.radius;
    const deferentZ = Math.sin(angle) * this.radius;
    // Epicycle: exaggerated loop.
    const epicycleRadius = this.radius * this.amplitudeFactor;
    const epicycleAngle = -this.speedMultiplier * angle;
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

  const getHoverInfo = (): InfoData => {
    // Custom info for Mercury:
    if (planetName === "Mercury") {
      return {
        title: "Mercury: The Extreme Innermost Planet",
        summary:
        `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Mercury is the smallest and innermost planet in the solar system.\n" +
          "- It experiences extreme temperature variations: scorching up to 700 K in sunlight and plunging to 100 K in darkness due to its lack of atmosphere.\n" +
          "- It orbits the Sun rapidly with a unique spin–orbit resonance (three rotations every two Mercury years), resulting in a solar day of 176 Earth days.\n" +
          "- Mercury is believed to have an iron–nickel core that occupies about 55% of its volume, likely molten, which contributes to its weak magnetic field.\n" +
          "- Its orbital precession, once a mystery, was accurately explained by Einstein’s general theory of relativity.",
        opengraphLink:
          "https://www.youtube.com/watch?v=4D5a4drU3Cw&list=PLybg94GvOJ9E9BcCODbTNw2xU4b1cWSi6&index=15",
        opengraphImage: "https://img.youtube.com/vi/4D5a4drU3Cw/maxresdefault.jpg",
      };
    }
    if (planetName === "Venus") {
      return {
        title: "Venus: The Hostile Sister Planet",
        summary:
        `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Venus is the second planet from the Sun, with an average orbital radius of 108 million kilometers and remarkably similar in size to Earth.\n" +
          "- Its dense atmosphere consists of 96% carbon dioxide, creating surface pressures 100 times greater than Earth's and trapping extreme heat.\n" +
          "- Surface temperatures reach around 735 K, making it the hottest planet, while thick sulfuric acid clouds obscure its terrain.\n" +
          "- Radar mapping reveals highland regions like Ishtar Terra and Aphrodite Terra, with evidence of recent volcanic activity.\n" +
          "- Venus rotates slowly in a retrograde direction, taking 243 Earth days per rotation and 117 Earth days per solar day.",
        opengraphLink:
          "https://www.youtube.com/watch?v=iEg-XgdoJPU&list=PLybg94GvOJ9E9BcCODbTNw2xU4b1cWSi6&index=16",
        opengraphImage: "https://img.youtube.com/vi/iEg-XgdoJPU/maxresdefault.jpg",
      };
    }
    if (planetName === "Earth") {
      return {
        title: "Earth: Our Life-Sustaining Blue Planet",
        summary:
          `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Earth is the third rocky planet, known as our home, with a diameter of about 13,000 km.\n" +
          "- It formed from a molten protoplanetary disk, cooled to form a crust, and built an atmosphere and oceans via volcanic outgassing and comet impacts.\n" +
          "- Earth's interior comprises a solid inner core, liquid outer core, and silicate mantle, with density-driven differentiation.\n" +
          "- Tectonic plates drive continental drift, forming mountains and shaping landscapes.\n" +
          "- A giant impact likely formed the Moon, influencing tides and early life.\n" +
          "- The robust magnetic field generated by core convection effectively shields Earth from harmful cosmic radiation.",
        opengraphLink: "https://youtu.be/Ll_2i_PmP6M?si=mSBkqRLb_yLgsgIY",
        opengraphImage: "https://img.youtube.com/vi/Ll_2i_PmP6M/maxresdefault.jpg",
      };
    }    
    if (planetName === "Mars") {
      return {
        title: "Mars: The Red Planet of Contrasts",
        summary:
          `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Mars glows with a faint red hue and is named after the Roman god of war.\n" +
          "- It is the most Earth-like of the terrestrial planets, with half the diameter and one-tenth the mass of Earth.\n" +
          "- Early speculations of canals and life gave way to a barren, cold, and dead landscape.\n" +
          "- Its thin atmosphere (95% CO₂) and frequent dust storms create a unique pink haze.\n" +
          "- Notable features include Valles Marineris and Olympus Mons, the tallest volcano in the solar system.\n" +
          "- Mars has two small, irregular moons, Phobos and Deimos, likely captured asteroids.",
        opengraphLink: "https://youtu.be/KlKIcr-CsLE?si=7XRtV9uPeLfDU185",
        opengraphImage: "https://img.youtube.com/vi/KlKIcr-CsLE/maxresdefault.jpg",
      };
    }
    if (planetName === "Jupiter") {
      return {
        title: "Jupiter: The King of the Gas Giants",
        summary:
          `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Jupiter is the largest planet, with a diameter ten times that of Earth and more mass than all other planets combined.\n" +
          "- It is composed mostly of hydrogen and helium, with a thick layer of liquid hydrogen above a solid core of iron, rock, and water.\n" +
          "- Rapid rotation (once every 10 hours) drives high-speed winds and colossal storms like the Great Red Spot.\n" +
          "- Jupiter has a thin ring system and over 69 moons, including the Galilean moons: Ganymede, Callisto, Io, and Europa.\n" +
          "- Its powerful magnetic field, generated by liquid metallic hydrogen, is about 20,000 times stronger than Earth’s.",
        opengraphLink: "https://youtu.be/p-Tz3N7jN98?si=syx6CvEdwYDsuFhm",
        opengraphImage: "https://img.youtube.com/vi/p-Tz3N7jN98/maxresdefault.jpg",
      };
    }
    if (planetName === "Saturn") {
      return {
        title: "Saturn: The Ringed Wonder of the Solar System",
        summary:
          `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Saturn is the sixth planet from the Sun, nearly 10 AU away, almost twice as far as Jupiter.\n" +
          "- It is nearly as large as Jupiter but is less dense than water, meaning it could float in an ocean.\n" +
          "- Composed mainly of hydrogen and helium, it has a small core of iron, rock, and water.\n" +
          "- Its striking, thin ring system extends over twice its radius, made of icy particles.\n" +
          "- Saturn hosts at least 62 moons, including Titan with a nitrogen atmosphere and Enceladus with active water geysers.",
        opengraphLink: "https://youtu.be/POW8YfeI00o?si=YHy3xpK10BPmj1UZ",
        opengraphImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/960px-Saturn_during_Equinox.jpg",
      };
    }
    if (planetName === "Uranus") {
      return {
        title: "Uranus: The Tilted Ice Giant",
        summary:
          `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Uranus is the seventh planet, nearly 20 AU from the Sun, discovered in the 18th century.\n" +
          "- Named after the primordial sky god, it has a diameter about four times that of Earth.\n" +
          "- Its hydrogen and methane-rich atmosphere gives it a distinctive deep blue color.\n" +
          "- The interior features layers of water, methane, and ammonia around an iron-rock core, lacking metallic hydrogen.\n" +
          "- Uranus hosts a thin ring system and 27 moons, with major ones named after Shakespearean and Alexander Pope characters.\n" +
          "- Its extreme axial tilt results in unusual seasonal variations, with hemispheres alternating between prolonged daylight and darkness.",
        opengraphLink: "https://youtu.be/gU9fFlM8m6M?si=0ZaCxI9XiNnZrrwA",
        opengraphImage: "https://img.youtube.com/vi/gU9fFlM8m6M/maxresdefault.jpg",
      };
    }
    if (planetName === "Neptune") {
      return {
        title: "Neptune: The Distant Blue World",
        summary:
          `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- Neptune is the farthest planet at about 30 AU, similar in size and mass to Uranus.\n" +
          "- Its deep blue color arises from methane in its hydrogen-rich atmosphere.\n" +
          "- Distinct cloud belts and transient dark spots hint at active convection, with winds reaching up to 2200 km/h.\n" +
          "- It features narrow rings and a complex moon system of 14 satellites, including the captured, retrograde Triton.",
        opengraphLink: "https://youtu.be/0hTi8TmOqRc?si=Cf5yzLwPx_xEYJow",
        opengraphImage: "https://img.youtube.com/vi/0hTi8TmOqRc/maxresdefault.jpg",
      };
    }
    if (planetName === "Pluto") {
      return {
        title: "Pluto: , Comets, Asteroids, and the Kuiper Belt",
        summary:
          `- Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})\n` +
          "- The solar system comprises terrestrial planets (Mercury, Venus, Earth, Mars) and gas giants (Jupiter, Saturn, Uranus, Neptune).\n" +
          "- Beyond the planets lie countless small objects: dwarf planets like Pluto and Eris in the Kuiper Belt (30–50 AU) and scattered disk (up to 100 AU).\n" +
          "- The distant Oort Cloud, tens of thousands of AU away, is the source of icy comets.\n" +
          "- The asteroid belt between Mars and Jupiter, along with Trojan asteroids, adds to the rocky remnants.\n" +
          "- Meteors, meteorites, and occasional large impacts have significantly shaped Earth’s history.",
        opengraphLink: "https://youtu.be/MD7Zt2cGXRc?si=jFpAshJ93JUSifur",
        opengraphImage: "https://img.youtube.com/vi/MD7Zt2cGXRc/maxresdefault.jpg",
      };
    }
    if (planetName === "Sun") {
      return {
        title: "Sun: The Formation of the Solar System",
        summary:
      "- The Sun, a typical G-type main-sequence star of 1 solar mass, formed 4.6 billion years ago from a protoplanetary disk enriched by ancient supernovae.\n" +
      "- Planets emerged from the accretion of dust and gas into inner rocky worlds and outer gas giants, with countless smaller objects (asteroids, comets, and dwarf planets) remaining.\n" +
      "- Our solar system resides in the Orion arm of the Milky Way, a tiny fraction of our vast galaxy.\n" +
      "- Solar structure includes a hot core, radiative and convection zones, and a dynamic outer atmosphere (chromosphere and corona) that drives the solar wind.\n" +
      "- All heavy elements in our bodies were forged in stars, affirming that we are indeed 'star stuff.'",
    opengraphLink: "https://youtu.be/gxKCDjnWabk?si=54Ogl0kAOQ0Vjo8c",
    opengraphImage: "https://t2.gstatic.com/licensed-image?q=tbn:ANd9GcSC-tzajqpca4dchoeTCp8ChzFqdXnSnKtpkbx_5arltgIZQDdV4ALDa2ojaIHmI0GE",
      };
    }
    if (isHeliocentric) {
      return {
        title: planetName,
        summary: `Distance from Sun: ${heliocentricDistance.au} AU (${heliocentricDistance.km})`,
        opengraphLink: "",
        opengraphImage: "",
      };
    } else if (geocentricDistance) {
      return {
        title: planetName,
        summary: `Distance from Earth: ${geocentricDistance.earthRadii} Earth radii (${geocentricDistance.km})`,
        opengraphLink: "",
        opengraphImage: "",
      };
    }
    return { title: planetName, summary: planetName, opengraphLink: "", opengraphImage: "" };
  };

  // In geocentric mode, outer bodies (not Earth/Moon) show retrograde motion.
  const isRetrograde = !isHeliocentric && (planetName !== "Earth" && planetName !== "Moon");

  const retroTubeGeometry = useMemo(() => {
    if (isRetrograde) {
      const curve = new RetrogradeCurve(radius, 0.1, 2);
      // Use a thin tube for the visible ring.
      const tubeRadius = radius === 394.8 ? 0.2 : 0.05;
      return new THREE.TubeGeometry(curve, 100, tubeRadius, 8, true);
    }
    return null;
  }, [isRetrograde, radius]);

  const hitboxTubeGeometry = useMemo(() => {
    if (isRetrograde) {
      const curve = new RetrogradeCurve(radius, 0.1, 2);
      return new THREE.TubeGeometry(curve, 100, 0.5, 8, true);
    }
    return null;
  }, [isRetrograde, radius]);

  return (
    <group>
      {isRetrograde ? (
        <>
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

const Planet: React.FC<PlanetProps> = ({
  position,
  size,
  color,
  orbitRadius,
  orbitSpeed,
  isHeliocentric,
  name,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [angle, setAngle] = useState(0);

  useFrame(() => {
    if (!groupRef.current || !meshRef.current || !glowRef.current) return;
    const newAngle = angle + orbitSpeed;
    setAngle(newAngle);
    if (orbitRadius > 0) {
      if (isHeliocentric || name === "Earth" || name === "Moon") {
        groupRef.current.position.x = Math.cos(newAngle) * orbitRadius;
        groupRef.current.position.z = Math.sin(newAngle) * orbitRadius;
      } else {
        const deferentX = Math.cos(newAngle) * orbitRadius;
        const deferentZ = Math.sin(newAngle) * orbitRadius;
        const epicycleRadius = orbitRadius * 0.05;
        const epicycleAngle = -newAngle * 1.5;
        const epiX = Math.cos(epicycleAngle) * epicycleRadius;
        const epiZ = Math.sin(epicycleAngle) * epicycleRadius;
        groupRef.current.position.x = deferentX + epiX;
        groupRef.current.position.z = deferentZ + epiZ;
      }
    } else {
      groupRef.current.position.set(...position);
    }
    meshRef.current.rotation.y += 0.005;
    glowRef.current.rotation.y += 0.005;
  });

  const content = (
    <group ref={groupRef} position={orbitRadius > 0 ? [orbitRadius, 0, 0] : position}>
      <mesh ref={meshRef}>
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
      {children}
    </group>
  );

  if (!isHeliocentric && name !== "Earth" && name !== "Moon") {
    return (
      <Trail local width={2} length={100} decay={1} attenuation={(t) => t} color={color}>
        {content}
      </Trail>
    );
  }
  return content;
};

const SolarSystem: React.FC = () => {
  const [isHeliocentric, setIsHeliocentric] = useState(true);
  const [selectedObjectInfo, setSelectedObjectInfo] = useState<InfoData | null>(null);
// This will flip each time user toggles, forcing a new camera animation
const [animTrigger, setAnimTrigger] = useState(false)

// Example camera positions:
const heliocentricPos = useMemo(() => new THREE.Vector3(0, 500, 500), [])
const geocentricPos = useMemo(() => new THREE.Vector3(0, 400, 400), [])

// Decide final camera pos based on isHeliocentric
const targetPos = isHeliocentric ? heliocentricPos : geocentricPos

  // Prevent scrolling on the main page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {selectedObjectInfo && (
        <div
          style={{
            position: 'fixed',
            left: '20px',
            top: '20px',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '300px',
            whiteSpace: 'pre-line',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'start',
            textAlign: 'left',
          }}
        >
          {/* Content container for scrolling */}
          <div style={{ overflowY: 'scroll', maxHeight: '48rem' }}>
            <h2 style={{ margin: '0 0 5px', color: 'yellow' }}>
              {selectedObjectInfo.title.split(' ')[0]}
            </h2>
            <p style={{ margin: '0 0 10px', whiteSpace: 'pre-wrap', fontSize: '16px' }}>
              {selectedObjectInfo.summary}
            </p>
            {selectedObjectInfo.opengraphLink && (
              <a
                href={selectedObjectInfo.opengraphLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  marginTop: '10px',
                  border: '1px solid #4CAF50',
                  borderRadius: '5px',
                  padding: '5px',
                  textAlign: 'center',
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                <img
                  src={selectedObjectInfo.opengraphImage}
                  alt={selectedObjectInfo.title}
                  style={{ width: '100%', maxWidth: '300px', cursor: 'pointer' }}
                />
                <p style={{ color: 'yellow' }}>
                  Watch this Professor Dave's video on : {selectedObjectInfo.title}
                </p>
              </a>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => {
          setIsHeliocentric(!isHeliocentric);
          // Flip our animTrigger so camera resets
          setAnimTrigger((prev) => !prev)
          setSelectedObjectInfo(null);
        }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '22px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: 'black',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          opacity: 0.8,
        }}        
      >
        Toggle {isHeliocentric ? 'to Geocentric' : 'to Heliocentric'}
      </button>
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          zIndex: 1000,
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          borderRadius: '5px',
          maxWidth: '300px',
        }}
      >
        <h3>{isHeliocentric ? 'Heliocentric Model' : 'Geocentric Model'}</h3>
        <p>
        {isHeliocentric
            ? `The Sun is the center of the solar system, simplifying planetary motion by showing retrograde motion as a perspective effect of Earth's orbit. with all planets including Pluto and the Kuiper Belt.`
            : `Earth is the universes center, with complex epicycles devised to explain the apparent retrograde motions of planets.`}
            <a
            href="https://youtu.be/ZGr1nHdzLyk?si=GqCkHerRFvZw63QQ"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', cursor: 'pointer', marginTop: '10px', border: '1px solid #4CAF50', borderRadius: '5px', padding: '5px'  }}
          >
            <img
              src="https://img.youtube.com/vi/ZGr1nHdzLyk/maxresdefault.jpg"
              alt="Medieval Retrograde Explanation Video"
              style={{ width: '100%', maxWidth: '300px', cursor: 'pointer' }}
            />
            <h5 style={{color:'white'}}>Real world references from Orb</h5>
            <p style={{ color: "yellow", textAlign: 'center', margin: '0px 0 0' }}>
              History of Astronomy Part 3: Copernicus and Heliocentrism <br/> (the idea orb challenges : 4:54 min)
            </p>
          </a>
          <a
            href="https://youtube.com/playlist?list=PLybg94GvOJ9E9BcCODbTNw2xU4b1cWSi6&si=BUI5z12KL6b0E9gi"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              marginTop: '10px',
              border: '1px solid #4CAF50',
              borderRadius: '5px',
              padding: '5px'
            }}
          >
            <img
              src="https://i.ytimg.com/vi/i8U9ZjRXClI/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLAn5cDUQC58G8iff1vXE-EOLQxTew"
              alt="Astronomy/Astrophysics"
              style={{ width: '100%', maxWidth: '300px', height: '50px', objectFit: 'cover' , cursor: 'pointer' }}
            />
            <p style={{ color: "yellow", textAlign: 'center', margin: '5px 0 0' }}>
              <span style={{ color: 'white' }}>(Playlist)</span> Professor Dave Explains : Astronomy/Astrophysics
            </p>
          </a>
        </p>
      </div>
      <div style={{position:'absolute', top:'20', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection: 'column', gap:'0px'}}>
        <h2 className="glowText">Orb: On the movement around earth</h2>
      </div>
      <h4 style={{position:'absolute', top:'40px', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection: 'column', gap:'0px'}}>click on orbital paths to know more ...</h4>
      <Canvas camera={{ position: [0, 200, 500], fov: 45 }}>
      <CameraTransition 
          targetPos={targetPos}
          triggerAnimation={animTrigger}
        />
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

        {/* Orbit Rings */}
        {!isHeliocentric && (
          <OrbitRing
            radius={30}
            color="pink"
            isVisible
            planetName="Sun"
            heliocentricDistance={{ au: 0, km: "0 km" }}
            geocentricDistance={{ earthRadii: 1200, km: "~7,645,200 km" }}
            isHeliocentric={isHeliocentric}
            onSelect={setSelectedObjectInfo}
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
          onSelect={setSelectedObjectInfo}
        />
        <OrbitRing
          radius={7.2}
          color="#DEB887"
          isVisible
          planetName="Venus"
          heliocentricDistance={{ au: 0.72, km: "~108.2 million km" }}
          geocentricDistance={{ earthRadii: 120, km: "~764,500 km" }}
          isHeliocentric={isHeliocentric}
          onSelect={setSelectedObjectInfo}
        />
        {isHeliocentric && (
          <OrbitRing
            radius={10}
            color="#4169E1"
            isVisible
            planetName="Earth"
            heliocentricDistance={{ au: 1.0, km: "~149.6 million km" }}
            geocentricDistance={{ earthRadii: 0, km: "0 km" }}
            isHeliocentric={isHeliocentric}
            onSelect={setSelectedObjectInfo}
          />
        )}
        <OrbitRing
          radius={40.2}
          color="#FF4500"
          isVisible
          planetName="Mars"
          heliocentricDistance={{ au: 1.52, km: "~227.9 million km" }}
          geocentricDistance={{ earthRadii: 1800, km: "~11,468,000 km" }}
          isHeliocentric={isHeliocentric}
          onSelect={setSelectedObjectInfo}
        />
        <OrbitRing
          radius={52}
          color="#DEB887"
          isVisible
          planetName="Jupiter"
          heliocentricDistance={{ au: 5.20, km: "~778.6 million km" }}
          geocentricDistance={{ earthRadii: 2400, km: "~15,290,000 km" }}
          isHeliocentric={isHeliocentric}
          onSelect={setSelectedObjectInfo}
        />
        <OrbitRing
          radius={95.8}
          color="#FFE4B5"
          isVisible
          planetName="Saturn"
          heliocentricDistance={{ au: 9.58, km: "~1.433 billion km" }}
          geocentricDistance={{ earthRadii: 3600, km: "~22,935,600 km" }}
          isHeliocentric={isHeliocentric}
          onSelect={setSelectedObjectInfo}
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
              onSelect={setSelectedObjectInfo}
            />
            <OrbitRing
              radius={300.5}
              color="#1E90FF"
              isVisible
              planetName="Neptune"
              heliocentricDistance={{ au: 30.05, km: "~4.495 billion km" }}
              isHeliocentric={isHeliocentric}
              onSelect={setSelectedObjectInfo}
            />
            <OrbitRing
              radius={394.8}
              color="#8B4513"
              isVisible
              planetName="Pluto"
              heliocentricDistance={{ au: 39.48, km: "~5.906 billion km" }}
              isHeliocentric={isHeliocentric}
              onSelect={setSelectedObjectInfo}
            />
          </>
        )}

        {/* Sun */}
        {!isHeliocentric ? (
          <Trail local width={0.3} length={100} decay={1} attenuation={(t) => t} color="#FFD700">
            <Planet
              position={[0, 0, 0]}
              onSelect={setSelectedObjectInfo}
              size={2}
              color="#FFD700"
              orbitRadius={30}
              orbitSpeed={0.02}
              isHeliocentric={isHeliocentric}
              name="Sun"
              heliocentricDistance={{ au: 0, km: "0 km" }}
              geocentricDistance={{ earthRadii: 1200, km: "~7,645,200 km" }}
            />
          </Trail>
        ) : (
          <Planet
            position={[0, 0, 0]}
            onSelect={setSelectedObjectInfo}
            size={2}
            color="#FFD700"
            orbitRadius={0}
            orbitSpeed={0.02}
            isHeliocentric={isHeliocentric}
            name="Sun"
            heliocentricDistance={{ au: 0, km: "0 km" }}
            geocentricDistance={{ earthRadii: 1200, km: "~7,645,200 km" }}
          />
        )}

        {/* Mercury */}
        {!isHeliocentric ? (
          <Trail local width={0.15} length={100} decay={1} attenuation={(t) => t} color="#A0522D">
            <Planet
              position={[3.9, 0, 0]}
              onSelect={setSelectedObjectInfo}
              size={0.4}
              color="#A0522D"
              orbitRadius={3.9}
              orbitSpeed={0.047}
              isHeliocentric={isHeliocentric}
              name="Mercury"
              heliocentricDistance={{ au: 0.39, km: "~57.9 million km" }}
              geocentricDistance={{ earthRadii: 79, km: "~503,000 km" }}
            />
          </Trail>
        ) : (
          <Planet
            position={[3.9, 0, 0]}
            onSelect={setSelectedObjectInfo}
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
        {!isHeliocentric ? (
          <Trail local width={0.15} length={100} decay={1} attenuation={(t) => t} color="#DEB887">
            <Planet
              position={[7.2, 0, 0]}
              onSelect={setSelectedObjectInfo}
              size={0.9}
              color="#DEB887"
              orbitRadius={7.2}
              orbitSpeed={0.035}
              isHeliocentric={isHeliocentric}
              name="Venus"
              heliocentricDistance={{ au: 0.72, km: "~108.2 million km" }}
              geocentricDistance={{ earthRadii: 120, km: "~764,500 km" }}
            />
          </Trail>
        ) : (
          <Planet
            position={[7.2, 0, 0]}
            onSelect={setSelectedObjectInfo}
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

        {/* Earth with nested Moon */}
        <Planet
          position={isHeliocentric ? [10, 0, 0] : [0, 0, 0]}
          onSelect={setSelectedObjectInfo}
          size={1}
          color="#4169E1"
          orbitRadius={isHeliocentric ? 10 : 0}
          orbitSpeed={0.029}
          isHeliocentric={isHeliocentric}
          name="Earth"
          heliocentricDistance={{ au: 1.0, km: "~149.6 million km" }}
          geocentricDistance={{ earthRadii: 0, km: "0 km" }}
        >
          <Planet
            position={[0, 0, 0]}
            onSelect={setSelectedObjectInfo}
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
            onSelect={setSelectedObjectInfo}
          />
        </Planet>

        {/* Mars */}
        {!isHeliocentric ? (
          <Trail local width={0.15} length={100} decay={1} attenuation={(t) => t} color="#FF4500">
            <Planet
              position={[35.2, 0, 0]}
              onSelect={setSelectedObjectInfo}
              size={0.5}
              color="#FF4500"
              orbitRadius={40.2}
              orbitSpeed={0.024}
              isHeliocentric={isHeliocentric}
              name="Mars"
              heliocentricDistance={{ au: 1.52, km: "~227.9 million km" }}
              geocentricDistance={{ earthRadii: 1800, km: "~11,468,000 km" }}
            />
          </Trail>
        ) : (
          <Planet
            position={[15.2, 0, 0]}
            onSelect={setSelectedObjectInfo}
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
        {!isHeliocentric ? (
          <Trail local width={2} length={100} decay={1} attenuation={(t) => t} color="#DEB887">
            <Planet
              position={[52, 0, 0]}
              onSelect={setSelectedObjectInfo}
              size={2}
              color="#DEB887"
              orbitRadius={52}
              orbitSpeed={0.013}
              isHeliocentric={isHeliocentric}
              name="Jupiter"
              heliocentricDistance={{ au: 5.20, km: "~778.6 million km" }}
              geocentricDistance={{ earthRadii: 2400, km: "~15,290,000 km" }}
            />
          </Trail>
        ) : (
          <Planet
            position={[52, 0, 0]}
            onSelect={setSelectedObjectInfo}
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
        {!isHeliocentric ? (
          <Trail local width={2} length={100} decay={1} attenuation={(t) => t} color="#FFE4B5">
            <Planet
              position={[95.8, 0, 0]}
              onSelect={setSelectedObjectInfo}
              size={1.8}
              color="#FFE4B5"
              orbitRadius={95.8}
              orbitSpeed={0.009}
              isHeliocentric={isHeliocentric}
              name="Saturn"
              heliocentricDistance={{ au: 9.58, km: "~1.433 billion km" }}
              geocentricDistance={{ earthRadii: 3600, km: "~22,935,600 km" }}
            />
          </Trail>
        ) : (
          <Planet
            position={[95.8, 0, 0]}
            onSelect={setSelectedObjectInfo}
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
            onSelect={setSelectedObjectInfo}
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
            onSelect={setSelectedObjectInfo}
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
            onSelect={setSelectedObjectInfo}
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
        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade />
      </Canvas>
      <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',          // space between links
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px 20px',
        borderRadius: '8px',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{display: 'flex', flexDirection: 'row', gap: '1rem'}}>
      <a
        href="https://github.com/sumionochi/Orb-on-the-movements-around-earth"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'white', textDecoration: 'none' }}
      >
        GitHub
      </a>
      <a
        href="https://www.linkedin.com/in/aaditya-srivastava-connect/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'white', textDecoration: 'none' }}
      >
        LinkedIn
      </a>
      <a
        href="https://www.instagram.com/mito.wins.uncensored/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'white', textDecoration: 'none' }}
      >
        Instagram
      </a>
      <a
        href="https://x.com/sumionochi"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'white', textDecoration: 'none' }}
      >
        Twitter
      </a>
      </div>
      <div>
      <a
        href="https://youtube.com/YourUsername"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'white', textDecoration: 'none' }}
      >
        Special Thanks for all the Interesting Knowledge by Professor Dave.
      </a>
      </div>
      </div>
    </div>
  );
};

export default SolarSystem;
