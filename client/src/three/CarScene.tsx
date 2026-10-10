import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import * as THREE from "three";
import RealCar from "./RealCar";
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
      aria-label={`Interactive Ferrari 458 Italia reference model. Drag to rotate and pinch or scroll to zoom.`}
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
            photographs in the collection.
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
          <Environment resolution={128} frames={1}>
            <Lightformer
              intensity={4}
              position={[0, 5, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[10, 3, 1]}
            />
            <Lightformer
              intensity={3}
              position={[-5, 2, 0]}
              rotation={[0, Math.PI / 2, 0]}
              scale={[8, 2, 1]}
            />
            <Lightformer
              intensity={2}
              position={[5, 2, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              scale={[8, 2, 1]}
            />
          </Environment>
          <RealCar {...props} />
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
