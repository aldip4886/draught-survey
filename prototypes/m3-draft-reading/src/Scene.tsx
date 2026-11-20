import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { XROrigin, useXRSessionVisibilityState } from "@react-three/xr";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Params } from "./params";
import { waveHeight } from "./wave";
import { Water } from "./Water";

const HULL = { length: 180, depth: 18, halfBeam: 15 };
/** Rentang sarat yang digambar pada pelat tanda (m, dari lunas). */
const MARK_RANGE = { from: 8, to: 13 };
const CANVAS_PX_PER_M = 400;

export interface Lock {
  reading: number;
  trueDraught: number;
}

interface Props {
  params: React.MutableRefObject<Params>;
  markScale: number;
  lock: Lock | null;
  onLock: (reading: number) => void;
  onFps: (fps: number) => void;
  hudText: string;
}

function makeMarkTexture(scale: number): THREE.CanvasTexture {
  const h = (MARK_RANGE.to - MARK_RANGE.from) * CANVAS_PX_PER_M;
  const w = 480;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1c2b3a";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#f4f1e6";
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  const numeralPx = 0.1 * scale * CANVAS_PX_PER_M;
  g.font = `bold ${numeralPx * 1.3}px sans-serif`;
  // Angka diletakkan dengan sisi bawahnya tepat di nilai sarat, tiap 0,2 m.
  for (let v = Math.ceil(MARK_RANGE.from / 0.2) * 0.2; v < MARK_RANGE.to; v += 0.2) {
    const yPx = h - (v - MARK_RANGE.from) * CANVAS_PX_PER_M;
    g.fillText(v.toFixed(1), w / 2, yPx);
    g.fillRect(0, yPx - 1, 24, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Ship({ params, markScale, lock, onLock }: Pick<Props, "params" | "markScale" | "lock" | "onLock">) {
  const group = useRef<THREE.Group>(null);
  const hull = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => makeMarkTexture(markScale), [markScale]);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const p = params.current;
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    // Kapal besar: gerak heave, roll, dan pitch teredam.
    const heave = 0.35 * waveHeight(0, 0, t, p);
    const roll = (0.4 * (waveHeight(0, HULL.halfBeam, t, p) - waveHeight(0, -HULL.halfBeam, t, p))) / (2 * HULL.halfBeam);
    const pitch = (0.4 * (waveHeight(30, 0, t, p) - waveHeight(-30, 0, t, p))) / 60;
    g.position.set(0, -p.trueDraught + heave, 0);
    g.rotation.set(0, 0, 0);
    g.rotateX(roll);
    g.rotateZ(-pitch);
  });

  const plateH = MARK_RANGE.to - MARK_RANGE.from;
  const plateY = MARK_RANGE.from + plateH / 2;

  return (
    <group ref={group}>
      <mesh ref={hull} position={[0, HULL.depth / 2, 0]}>
        <boxGeometry args={[HULL.length, HULL.depth, HULL.halfBeam * 2]} />
        <meshStandardMaterial color="#8a2b26" flatShading />
      </mesh>
      {/* Pelat tanda sarat di lambung kanan, tepat di tengah kapal. */}
      <mesh
        position={[0, plateY, HULL.halfBeam + 0.02]}
        onClick={(e) => {
          if (e.delta > 6) return; // seret untuk menengok, bukan mengunci
          e.stopPropagation();
          const local = hull.current!.parent!.worldToLocal(e.point.clone());
          onLock(Math.round(local.y * 100) / 100);
        }}
      >
        <planeGeometry args={[1.2, plateH]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      {lock && (
        <mesh position={[0, lock.reading, HULL.halfBeam + 0.04]}>
          <planeGeometry args={[1.4, 0.015]} />
          <meshBasicMaterial color="#ff3b30" />
        </mesh>
      )}
    </group>
  );
}

function Boat({ params, onFps, hudText }: Pick<Props, "params" | "onFps" | "hudText">) {
  const boat = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const look = useRef({ yaw: 0, pitch: -0.14, fov: 45 });
  const visibility = useXRSessionVisibilityState();
  const fpsAcc = useRef({ frames: 0, since: performance.now() });

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    const down = () => (dragging = true);
    const up = () => (dragging = false);
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const f = (camera as THREE.PerspectiveCamera).fov / 45;
      look.current.yaw -= e.movementX * 0.003 * f;
      look.current.pitch = Math.max(-0.6, Math.min(0.6, look.current.pitch - e.movementY * 0.003 * f));
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      look.current.fov = Math.max(3, Math.min(60, look.current.fov * (e.deltaY > 0 ? 1.12 : 0.89)));
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    el.addEventListener("pointermove", move);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("wheel", wheel);
    };
  }, [camera, gl]);

  useFrame((state) => {
    const p = params.current;
    const t = state.clock.elapsedTime;
    const b = boat.current;
    if (b) {
      // Perahu kecil mengikuti permukaan air penuh: tinggi dan kemiringan dari fungsi gelombang yang sama.
      const x = 0;
      const z = HULL.halfBeam + p.boatDistance;
      const y = waveHeight(x, z, t, p);
      const slopeX = (waveHeight(x + 1.5, z, t, p) - waveHeight(x - 1.5, z, t, p)) / 3;
      const slopeZ = (waveHeight(x, z + 1.5, t, p) - waveHeight(x, z - 1.5, t, p)) / 3;
      b.position.set(x, y, z);
      b.rotation.set(Math.atan(slopeZ), 0, -Math.atan(slopeX));
    }
    if (visibility === undefined && b) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.position.set(b.position.x, b.position.y + 1.6, b.position.z);
      cam.rotation.set(look.current.pitch, look.current.yaw, 0, "YXZ");
      if (cam.fov !== look.current.fov) {
        cam.fov = look.current.fov;
        cam.updateProjectionMatrix();
      }
    }
    const acc = fpsAcc.current;
    acc.frames++;
    const now = performance.now();
    if (now - acc.since >= 500) {
      onFps((acc.frames * 1000) / (now - acc.since));
      acc.frames = 0;
      acc.since = now;
    }
  });

  return (
    <group ref={boat}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.6, 0.5, 3.4]} />
        <meshStandardMaterial color="#e9e4d4" flatShading />
      </mesh>
      {/* Titik berdiri peserta di headset; di desktop kamera dipasang di sini. */}
      <XROrigin position={[0, 0.5, 0]} />
      {/* Papan info di dalam dunia, terbaca di headset. */}
      <Text position={[-1.1, 0.9, -0.8]} rotation={[0, 0.6, 0]} fontSize={0.05} color="#ffffff" anchorX="left" outlineWidth={0.004}>
        {hudText}
      </Text>
    </group>
  );
}

export function Scene(props: Props) {
  return (
    <>
      <color attach="background" args={["#9fb8c8"]} />
      <fog attach="fog" args={["#9fb8c8", 120, 320]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[40, 80, 30]} intensity={1.8} />
      <Water params={props.params} />
      <Ship params={props.params} markScale={props.markScale} lock={props.lock} onLock={props.onLock} />
      <Boat params={props.params} onFps={props.onFps} hudText={props.hudText} />
    </>
  );
}
