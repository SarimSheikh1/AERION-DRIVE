import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitType } from "three-stdlib";

export type SceneProps = {
  color?: string;
  model?: string;
  wheels?: "aero" | "sport";
  environment?: "studio" | "night" | "desert";
  lighting?: boolean;
  angle?: "orbit" | "front" | "side" | "rear";
  resetKey?: number;
  zoom?: number;
  interactive?: boolean;
  hero?: boolean;
  scroll?: number;
};
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Body({
  color,
  model,
  lighting,
}: {
  color: string;
  model: string;
  lighting: boolean;
}) {
  const initialPaint = useRef(color);
  const suv = model.includes("horizon"),
    urban = model.includes("pulse"),
    hyper = model.includes("vortex"),
    gt = model.includes("stratos");
  const geometry = useMemo(() => {
    // Original sculpted shell: longitudinal cross sections, rounded shoulders and tapered nose.
    const sections = [
      [-2.65, 0.5, 0.4],
      [-2.38, 0.94, 0.56],
      [-1.65, 1.02, 0.69],
      [-0.65, 1.04, 0.72],
      [0.65, 1.02, 0.68],
      [1.7, 0.98, 0.6],
      [2.38, 0.89, 0.49],
      [2.65, 0.5, 0.41],
    ];
    const points: number[] = [],
      indices: number[] = [],
      segments = 32;
    sections.forEach(([x, width, top]) => {
      for (let j = 0; j <= segments; j++) {
        const a = (j / segments) * Math.PI * 2;
        points.push(
          x,
          0.64 + Math.sin(a) * (Math.sin(a) > 0 ? top : 0.24),
          Math.cos(a) * width,
        );
      }
    });
    for (let i = 0; i < sections.length - 1; i++)
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j,
          b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const canopy = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.35, 0);
    shape.lineTo(-0.58, suv ? 0.94 : 0.66);
    shape.quadraticCurveTo(-0.38, suv ? 1.08 : 0.83, 0.15, suv ? 1.04 : 0.79);
    shape.lineTo(0.65, suv ? 0.99 : 0.69);
    shape.lineTo(1.52, 0);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 1.52,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
  }, [suv]);
  useEffect(() => () => canopy.dispose(), [canopy]);
  return (
    <group
      scale={[
        urban ? 0.83 : gt ? 1.12 : 1,
        suv ? 1 : hyper ? 0.66 : urban ? 0.86 : 0.74,
        hyper ? 1.08 : 1,
      ]}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={initialPaint.current}
          metalness={0.78}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.13}
        />
      </mesh>
      <mesh geometry={canopy} position={[0, 1.22, -0.76]} castShadow>
        <meshPhysicalMaterial
          color="#15242f"
          metalness={0.62}
          roughness={0.1}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[-0.2, suv ? 2.24 : 2.02, 0]} scale={[1.05, 0.038, 1.58]}>
        <boxGeometry />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.25} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[-2.67, 0.88, side * 0.29]}>
            <boxGeometry args={[0.06, 0.045, 0.43]} />
            <meshStandardMaterial
              color={lighting ? "#f0f8ff" : "#4b5964"}
              emissive="#b6e3ff"
              emissiveIntensity={lighting ? 4 : 0}
            />
          </mesh>
          <mesh position={[2.67, 0.83, side * 0.29]}>
            <boxGeometry args={[0.06, 0.045, 0.43]} />
            <meshStandardMaterial
              color="#ff3f21"
              emissive="#ff2b14"
              emissiveIntensity={lighting ? 3 : 0}
            />
          </mesh>
          <mesh position={[0.05, 0.57, side * 1.01]}>
            <boxGeometry args={[3.7, 0.13, 0.04]} />
            <meshStandardMaterial color="#11151a" metalness={0.8} />
          </mesh>
          <mesh
            position={[-0.16, 1.27, side * 1.1]}
            rotation={[0, side * 0.2, 0]}
          >
            <boxGeometry args={[0.33, 0.1, 0.22]} />
            <meshStandardMaterial color={color} metalness={0.7} />
          </mesh>
          <mesh position={[0.65, 1.12, side * 1.02]}>
            <boxGeometry args={[0.23, 0.035, 0.025]} />
            <meshStandardMaterial
              color="#bac4ce"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[-2.53, 0.54, 0]}>
        <boxGeometry args={[0.12, 0.2, 1.32]} />
        <meshStandardMaterial color="#070b10" metalness={0.4} />
      </mesh>
      <mesh position={[2.55, 0.48, 0]}>
        <boxGeometry args={[0.16, 0.16, 1.4]} />
        <meshStandardMaterial color="#090c10" />
      </mesh>
      {hyper && (
        <mesh position={[2.04, 1.35, 0]}>
          <boxGeometry args={[0.38, 0.08, 2.12]} />
          <meshStandardMaterial color="#12191d" metalness={0.7} />
        </mesh>
      )}
      <mesh position={[-1.9, 1.27, 0]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[0.1, 0.025, 0.19]} />
        <meshStandardMaterial color="#ffb000" metalness={0.7} />
      </mesh>
    </group>
  );
}
function Wheel({
  position,
  design,
}: {
  position: [number, number, number];
  design: string;
}) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]} scale={0.8}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.43, 0.135, 12, 40]} />
        <meshStandardMaterial color="#101216" roughness={0.85} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.37, 0.37, 0.25, 40]} />
        <meshStandardMaterial
          color="#14191e"
          metalness={0.85}
          roughness={0.28}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.145, 0]}>
        <torusGeometry args={[0.35, 0.023, 6, 40]} />
        <meshStandardMaterial
          color="#b4bdc5"
          metalness={0.95}
          roughness={0.2}
        />
      </mesh>
      {Array.from({ length: design === "aero" ? 5 : 10 }, (_, i) => {
        const a = (i / (design === "aero" ? 5 : 10)) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.19, 0.155, Math.cos(a) * 0.19]}
            rotation={[0, a, 0]}
          >
            <boxGeometry
              args={[design === "aero" ? 0.09 : 0.035, 0.036, 0.36]}
            />
            <meshStandardMaterial
              color="#b4bec6"
              metalness={0.95}
              roughness={0.22}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 20]} />
        <meshStandardMaterial color="#ffb000" metalness={0.8} />
      </mesh>
    </group>
  );
}
function Car({
  color = "#a5b2bc",
  model = "aerion-a1",
  wheels = "aero",
  hero = false,
  scroll = 0,
  lighting = true,
}: SceneProps) {
  const ref = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Color(color), [color]);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.traverse((o) => {
      if (
        o instanceof THREE.Mesh &&
        o.material instanceof THREE.MeshPhysicalMaterial &&
        o.material.color.getHex() !== 0x15242f
      ) {
        const distance =
          Math.abs(o.material.color.r - target.r) +
          Math.abs(o.material.color.g - target.g) +
          Math.abs(o.material.color.b - target.b);
        if (distance > 0.001) {
          o.material.color.lerp(target, Math.min(delta * 5, 1));
          state.invalidate();
        } else o.material.color.copy(target);
      }
    });
    if (hero && !reduced())
      ref.current.rotation.y =
        -0.25 + Math.sin(state.clock.elapsedTime * 0.16) * 0.055 + scroll * 0.9;
  });
  const urban = model.includes("pulse"),
    suv = model.includes("horizon"),
    gt = model.includes("stratos");
  return (
    <group ref={ref} rotation={[0, -0.25, 0]}>
      <Body color={color} model={model} lighting={lighting} />
      {[-1.65, 1.68].flatMap((x) =>
        [-1, 1].map((s) => (
          <Wheel
            key={`${x}-${s}`}
            position={[
              x * (urban ? 0.83 : gt ? 1.12 : 1),
              0.45,
              s * (model.includes("vortex") ? 1.1 : 1.01),
            ]}
            design={wheels}
          />
        )),
      )}
      {suv && (
        <mesh position={[0, 2.08, 0]}>
          <boxGeometry args={[1.25, 0.02, 1.1]} />
          <meshStandardMaterial color="#111c24" />
        </mesh>
      )}
    </group>
  );
}
function Rig({
  angle = "orbit",
  resetKey = 0,
  interactive = true,
  hero = false,
  zoom = 0,
}: SceneProps) {
  const control = useRef<OrbitType>(null);
  const { camera } = useThree();
  useEffect(() => {
    const positions: Record<string, [number, number, number]> = {
      orbit: [-6, 3.1, 6.4],
      front: [-8, 1.5, 0],
      side: [0, 2, 8],
      rear: [8, 2, 0],
    };
    camera.position.set(...positions[angle]);
    control.current?.target.set(0, 0.7, 0);
    control.current?.update();
  }, [angle, resetKey, camera]);
  const previousZoom = useRef(zoom);
  useEffect(() => {
    const offset = camera.position.clone().sub(new THREE.Vector3(0, 0.7, 0));
    offset.multiplyScalar(Math.pow(0.82, zoom - previousZoom.current));
    offset.clampLength(4, 12);
    camera.position.copy(offset.add(new THREE.Vector3(0, 0.7, 0)));
    control.current?.update();
    previousZoom.current = zoom;
  }, [zoom, camera]);
  useFrame(({ pointer }, delta) => {
    if (hero && !reduced()) {
      camera.position.z = THREE.MathUtils.lerp(
        camera.position.z,
        6.4 + pointer.x * 0.3,
        delta * 2,
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        3.1 + pointer.y * 0.2,
        delta * 2,
      );
      camera.lookAt(0, 0.6, 0);
    }
  });
  return (
    <OrbitControls
      ref={control}
      enabled={interactive}
      enablePan={false}
      minDistance={4}
      maxDistance={12}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.025}
      target={[0, 0.7, 0]}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}
export default function CarScene(props: SceneProps) {
  const [ready, setReady] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[0].isIntersecting),
      { rootMargin: "100px" },
    );
    if (surface.current) observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  const onReady = useMemo(() => () => setReady(true), []);
  const background =
    props.environment === "desert"
      ? "#302821"
      : props.environment === "night"
        ? "#050a13"
        : "#10151b";
  return (
    <div
      ref={surface}
      className={`car-scene ${props.hero ? "hero-scene" : ""}`}
      role="img"
      aria-label={`Interactive original ${props.model || "Aerion A1"} concept car. Drag to rotate and pinch or scroll to zoom.`}
    >
      {!ready && (
        <div className="scene-loading">
          <span>AERION</span>
          <progress aria-label="Loading 3D studio" />
        </div>
      )}
      <Canvas
        frameloop={props.hero && visible && !reduced() ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ position: [-6, 3.1, 6.4], fov: 36 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        fallback={
          <div className="scene-fallback">
            Your browser cannot open the WebGL studio. Explore the vehicle
            illustrations in the collection.
          </div>
        }
      >
        <color attach="background" args={[background]} />
        <fog attach="fog" args={[background, 16, 35]} />
        <ambientLight intensity={props.lighting === false ? 0.3 : 0.8} />
        <hemisphereLight args={["#b0d0e9", "#15171c", 1.2]} />
        <directionalLight
          position={[-4, 7, 4]}
          intensity={props.lighting === false ? 1 : 4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight
          position={[5, 6, -4]}
          color="#a5d8ff"
          intensity={65}
          angle={0.6}
          penumbra={1}
        />
        <pointLight
          position={[-3, 2, -5]}
          color="#ffb000"
          intensity={props.environment === "night" ? 25 : 9}
        />
        <Suspense fallback={null}>
          <Car {...props} />
          <ContactShadows
            position={[0, -0.055, 0]}
            opacity={0.7}
            scale={18}
            blur={2.3}
            far={5}
            resolution={256}
          />
          <SceneReady onReady={onReady} />
        </Suspense>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.09, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial
            color={background}
            metalness={0.3}
            roughness={0.36}
          />
        </mesh>
        <Rig {...props} />
      </Canvas>
      {props.interactive !== false && (
        <span className="scene-hint">DRAG TO ORBIT · SCROLL TO ZOOM</span>
      )}
    </div>
  );
}
