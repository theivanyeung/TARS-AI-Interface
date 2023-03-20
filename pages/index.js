import { useRef, useState, useMemo, useEffect } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { ShaderMaterial } from "three";
import * as THREE from "three";

import UpperRing from "../components/UpperRing";
import OuterRing from "../components/OuterRing";
import InnerRing from "../components/InnerRing";
import CenterRing from "../components/CenterRing";

const Singularity = ({
  radius,
  tube,
  position,
  rotationSpeed,
  glowIntensity,
}) => {
  const ringRef = useRef();

  const glowTexture = useTexture("/glowtexture.png");

  const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

  const fragmentShader = `
  uniform sampler2D glowTexture;
  uniform vec3 color;
  uniform float intensity;

  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(glowTexture, vUv);
    vec3 finalColor = color * texColor.rgb * intensity;
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

  const glowMaterial = new ShaderMaterial({
    uniforms: {
      glowTexture: { value: glowTexture },
      color: { value: new THREE.Color("#7BFFFF") },
      intensity: { value: glowIntensity },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
  });

  useFrame((state, delta) => {
    ringRef.current && (ringRef.current.rotation.x += delta * rotationSpeed);
    ringRef.current && (ringRef.current.rotation.y += delta * rotationSpeed);
    ringRef.current && (ringRef.current.rotation.z += delta * rotationSpeed);
  });

  const geometry = useMemo(
    () => new THREE.TorusKnotGeometry(radius, tube, 300, 20, 5, 15),
    [radius, tube]
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#00FFFF",
        emissive: "#00FFFF",
        emissiveIntensity: glowIntensity / 10,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
    [glowIntensity]
  );

  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        position={position}
        ref={ringRef}
      />
      <sprite
        material={glowMaterial}
        position={[position[0], position[1], position[2] + 0.5]}
        scale={[radius * 15, radius * 15, radius * 15]} // Adjust the scale as needed
      />
    </>
  );
};

export default function Home() {
  const [glowIntensity, setGlowIntensity] = useState(5);
  const [rotationSpeeds, setRotationSpeeds] = useState([
    0.05, 0.02, 0.1, 0.25, 0.5,
  ]);
  const isFirstRender = useRef(true);
  const groupRef = useRef();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const initialSpeeds = rotationSpeeds.map((speed) => speed * 100);
      setRotationSpeeds(initialSpeeds);

      const transitionDuration = 1000; // 1000 ms = 1 second
      const startTime = performance.now();

      const animateTransition = () => {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / transitionDuration, 1);

        const newSpeeds = initialSpeeds.map((initialSpeed, index) => {
          const normalSpeed = initialSpeed / 100;
          return initialSpeed + (normalSpeed - initialSpeed) * progress;
        });

        setRotationSpeeds(newSpeeds);

        if (progress < 1) {
          requestAnimationFrame(animateTransition);
        }
      };

      requestAnimationFrame(animateTransition);
    }
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;

    const maxRotationAngle = Math.PI / 8; // Limit rotation angle to 22.5 degrees
    const angleY = (x / centerX) * maxRotationAngle;
    const angleX = -(y / centerY) * maxRotationAngle;

    if (groupRef.current) {
      groupRef.current.rotation.y = angleY;
      groupRef.current.rotation.x = groupRef.current.rotation && -angleX;
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#2F2F2F",
        background:
          "radial-gradient(70.97% 70.97% at 50% 50%, #5F8D9D 0%, rgba(59, 71, 75, 0) 100%)",
      }}
    >
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 0, 10]} />
        <group ref={groupRef}>
          <UpperRing
            radius={1.75}
            tube={0.02}
            position={[0, 0, 1.25]}
            rotationSpeed={rotationSpeeds[0]}
            glowIntensity={glowIntensity}
          />
          <OuterRing
            radius={2.25}
            tube={0.0025}
            position={[0, 0, 0.75]}
            rotationSpeed={rotationSpeeds[1]}
            glowIntensity={glowIntensity}
          />
          <InnerRing
            radius={1.5}
            tube={0.02}
            position={[0, 0, -0.25]}
            rotationSpeed={rotationSpeeds[2]}
            glowIntensity={glowIntensity}
          />
          <CenterRing
            radius={1}
            tube={0.01}
            position={[0, 0, -1]}
            rotationSpeed={rotationSpeeds[3]}
            glowIntensity={glowIntensity}
          />
          <Singularity
            radius={0.25}
            tube={0.025}
            position={[0, 0, -1.25]}
            rotationSpeed={rotationSpeeds[4]}
            glowIntensity={glowIntensity}
          />
        </group>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

