"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type Props = { values: number[]; rollId: number; onSettled: () => void };
type Roller = { roll: (values: number[]) => void };

const dots: Record<number, number[][]> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
  5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]],
  6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]],
};

// Opposite faces add up to seven. The corresponding normal faces up at rest.
const faces = [
  { value: 1, normal: new THREE.Vector3(0, 1, 0) },
  { value: 6, normal: new THREE.Vector3(0, -1, 0) },
  { value: 2, normal: new THREE.Vector3(0, 0, 1) },
  { value: 5, normal: new THREE.Vector3(0, 0, -1) },
  { value: 3, normal: new THREE.Vector3(1, 0, 0) },
  { value: 4, normal: new THREE.Vector3(-1, 0, 0) },
];

function restingRotation(value: number, yaw: number) {
  const face = faces.find(face => face.value === value)!;
  const align = new THREE.Quaternion().setFromUnitVectors(face.normal, new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(align);
}

export default function DiceScene({ values, rollId, onSettled }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const roller = useRef<Roller | null>(null);
  const latest = useRef({ values, onSettled });
  latest.current = { values, onSettled };
  const [unavailable, setUnavailable] = useState(false);
  const count = values.length;

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
    const target = new THREE.Vector3(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xfff5de, 0x18362b, 3));
    const light = new THREE.DirectionalLight(0xffe5b3, 4);
    light.position.set(-3, 8, 4);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -7;
    light.shadow.camera.right = 7;
    light.shadow.camera.top = 7;
    light.shadow.camera.bottom = -7;
    light.shadow.normalBias = 0.03;
    scene.add(light);
    const fill = new THREE.DirectionalLight(0xb9dfd0, 2);
    fill.position.set(4, 3, -3);
    scene.add(fill);

    const bodyGeometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.09);
    const pipGeometry = new THREE.SphereGeometry(0.075, 16, 12);
    const ivory = new THREE.MeshStandardMaterial({ color: 0xfff0d6, roughness: 0.28, metalness: 0.05 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe8b762, roughness: 0.3, metalness: 0.22 });
    const ink = new THREE.MeshStandardMaterial({ color: 0x15271e, roughness: 0.65 });
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const columns = Math.min(count, 3);
    const rows = Math.ceil(count / columns);
    const dice = Array.from({ length: count }, (_, index) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(bodyGeometry, index % 2 ? gold : ivory);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);
      faces.forEach(face => {
        const faceGroup = new THREE.Group();
        faceGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
        dots[face.value].forEach(([x, y]) => {
          const pip = new THREE.Mesh(pipGeometry, ink);
          pip.scale.z = 0.25;
          pip.position.set(x * 0.23, y * 0.23, 0.501);
          faceGroup.add(pip);
        });
        group.add(faceGroup);
      });
      const row = Math.floor(index / columns);
      const rowCount = Math.min(columns, count - row * columns);
      const position = new THREE.Vector3((index % columns - (rowCount - 1) / 2) * 1.8, 0.5, (row - (rows - 1) / 2) * 1.9);
      group.position.copy(position);
      group.quaternion.copy(restingRotation(latest.current.values[index], index * 0.35 - 0.2));
      scene.add(group);
      return { group, position, start: group.quaternion.clone(), finish: group.quaternion.clone(), spin: new THREE.Vector3(), offset: new THREE.Vector3() };
    });

    function resize() {
      const width = Math.max(host!.clientWidth, 1);
      const height = Math.max(host!.clientHeight, 1);
      camera.aspect = width / height;
      // Fit the full tray, including six dice, on narrow screens.
      const verticalSpan = Math.max(5, 6.2 / camera.aspect);
      const distance = verticalSpan / (2 * Math.tan(THREE.MathUtils.degToRad(17.5)));
      camera.position.set(0, distance * 0.84, distance * 0.54);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    let startedAt = 0;
    let duration = 1600;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const temporaryRotation = new THREE.Quaternion();
    const spinEuler = new THREE.Euler();

    function animate(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      dice.forEach((die, index) => {
        if (reducedMotion.matches) {
          die.group.quaternion.slerpQuaternions(die.start, die.finish, progress);
        } else {
          const eased = 1 - Math.pow(1 - progress, 3);
          spinEuler.set(die.spin.x * eased, die.spin.y * eased, die.spin.z * eased);
          temporaryRotation.setFromEuler(spinEuler);
          die.group.quaternion.copy(die.start).multiply(temporaryRotation);
          if (progress > 0.7) die.group.quaternion.slerp(die.finish, (progress - 0.7) / 0.3);
          const bounce = Math.abs(Math.sin(progress * Math.PI * (3 + index % 2))) * (1 - progress);
          die.group.position.set(
            die.position.x + Math.sin(progress * Math.PI * 2) * die.offset.x * (1 - progress),
            die.position.y + bounce * 2.2,
            die.position.z + Math.sin(progress * Math.PI * 2) * die.offset.z * (1 - progress),
          );
        }
        if (progress === 1) {
          die.group.position.copy(die.position);
          die.group.quaternion.copy(die.finish);
        }
      });
      renderer.render(scene, camera);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else { frame = 0; latest.current.onSettled(); }
    }

    const controller: Roller = { roll(nextValues) {
      cancelAnimationFrame(frame);
      dice.forEach((die, index) => {
        die.start.copy(die.group.quaternion);
        die.finish.copy(restingRotation(nextValues[index], Math.random() * Math.PI * 2));
        die.spin.set((3 + Math.random() * 2) * Math.PI * 2, (2 + Math.random() * 2) * Math.PI * 2, (2 + Math.random() * 2) * Math.PI * 2);
        die.offset.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
      });
      duration = reducedMotion.matches ? 160 : 1600;
      startedAt = performance.now();
      frame = requestAnimationFrame(animate);
    } };
    roller.current = controller;

    function contextLost(event: Event) {
      event.preventDefault();
      cancelAnimationFrame(frame);
      roller.current = null;
      setUnavailable(true);
      latest.current.onSettled();
    }
    function contextRestored() {
      dice.forEach((die, index) => {
        die.group.position.copy(die.position);
        die.group.quaternion.copy(restingRotation(latest.current.values[index], index * 0.35 - 0.2));
      });
      roller.current = controller;
      setUnavailable(false);
      resize();
    }
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    renderer.domElement.addEventListener("webglcontextrestored", contextRestored);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      roller.current = null;
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
      bodyGeometry.dispose();
      pipGeometry.dispose();
      ivory.dispose(); gold.dispose(); ink.dispose();
      floorGeometry.dispose(); floorMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [count]);

  useEffect(() => {
    if (!rollId) return;
    if (roller.current) { roller.current.roll(values); return; }
    const timeout = window.setTimeout(() => latest.current.onSettled(), 200);
    return () => window.clearTimeout(timeout);
  }, [rollId, values]);

  return <div className="dice-scene" ref={container} role="img" aria-label={`${count} ลูกเต๋า 3D${rollId ? " แสดงผลทอยด้านบน" : " พร้อมทอย"}`}>
    {unavailable && <div className="dice-fallback"><p>อุปกรณ์นี้แสดงโมเดล 3D ไม่ได้ แต่ยังทอยลูกเต๋าได้</p><div>{values.map((value, i) => <span key={i}>{["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][value - 1]}</span>)}</div></div>}
  </div>;
}
