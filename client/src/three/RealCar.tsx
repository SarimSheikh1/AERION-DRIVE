import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { SceneProps } from "./CarScene";

export default function RealCar({
  color = "#b8c3cc",
  wheels = "aero",
  hero = false,
  scroll = 0,
}: SceneProps) {
  const gltf = useGLTF("/models/ferrari.glb", "/models/draco/");
  const ref = useRef<THREE.Group>(null);
  const { object, materials, paint } = useMemo(() => {
    const object = gltf.scene.clone(true);
    const materials: THREE.Material[] = [];
    let paint: THREE.MeshPhysicalMaterial | undefined;
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.name === "body") {
        paint = new THREE.MeshPhysicalMaterial({
          color: "#b8c3cc",
          metalness: 0.85,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
        });
        node.material = paint;
      } else {
        node.material = Array.isArray(node.material)
          ? node.material.map((material) => material.clone())
          : node.material.clone();
      }
      materials.push(
        ...(Array.isArray(node.material) ? node.material : [node.material]),
      );
    });
    // Align the imported vehicle to the existing front/side/rear camera convention.
    object.rotation.y = Math.PI / 2;
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const scale = 5.2 / Math.max(size.x, size.z);
    object.scale.setScalar(scale);
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    const center = bounds.getCenter(new THREE.Vector3());
    object.position.set(-center.x, -bounds.min.y + 0.015, -center.z);
    return { object, materials, paint };
  }, [gltf.scene]);
  useEffect(
    () => () => {
      materials.forEach((material) => material.dispose());
    },
    [materials],
  );
  const target = useMemo(() => new THREE.Color(color), [color]);
  useEffect(() => {
    object.traverse((node) => {
      if (node instanceof THREE.Mesh && node.name.startsWith("rim_")) {
        const material = node.material as THREE.MeshStandardMaterial;
        material.color.set(wheels === "sport" ? "#d2d6db" : "#343b44");
        material.metalness = 0.9;
        material.roughness = 0.24;
      }
    });
  }, [object, wheels]);
  useFrame((state, delta) => {
    if (paint && !paint.color.equals(target)) {
      paint.color.lerp(target, Math.min(delta * 6, 1));
      if (
        Math.abs(paint.color.r - target.r) +
          Math.abs(paint.color.g - target.g) +
          Math.abs(paint.color.b - target.b) <
        0.001
      )
        paint.color.copy(target);
      state.invalidate();
    }
    if (
      ref.current &&
      hero &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      ref.current.rotation.y =
        -0.25 + Math.sin(state.clock.elapsedTime * 0.16) * 0.055 + scroll * 0.9;
  });
  return (
    <group ref={ref} rotation={[0, -0.25, 0]}>
      <primitive object={object} dispose={null} />
    </group>
  );
}
