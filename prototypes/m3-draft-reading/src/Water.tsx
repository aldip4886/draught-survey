import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Params } from "./params";

/** Konstanta harus sama dengan WAVE_LAYOUT di wave.ts. */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uPeriod;
  varying vec3 vNormal;
  varying vec3 vWorld;
  const float G = 9.81;
  const float TAU = 6.28318530718;

  void addWave(float ampMul, float periodMul, vec2 dir, float phase, vec2 p, inout float h, inout vec2 grad) {
    float omega = TAU / (uPeriod * periodMul);
    float k = omega * omega / G;
    vec2 d = normalize(dir);
    float a = uAmp * ampMul;
    float arg = k * dot(d, p) - omega * uTime + phase;
    h += a * sin(arg);
    grad += a * k * cos(arg) * d;
  }

  void main() {
    vec2 p = position.xz;
    float h = 0.0;
    vec2 grad = vec2(0.0);
    addWave(1.0, 1.0, vec2(0.3, 1.0), 0.0, p, h, grad);
    addWave(0.5, 1.7, vec2(-0.5, 1.0), 1.3, p, h, grad);
    vec3 pos = vec3(position.x, h, position.z);
    vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));
    vWorld = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 light = normalize(vec3(0.4, 0.8, 0.3));
    float diff = clamp(dot(n, light), 0.0, 1.0);
    vec3 deep = vec3(0.03, 0.17, 0.28);
    vec3 shallow = vec3(0.10, 0.38, 0.48);
    vec3 col = mix(deep, shallow, diff);
    float fogT = clamp(length(vWorld.xz) / 260.0, 0.0, 1.0);
    col = mix(col, vec3(0.62, 0.74, 0.82), fogT * fogT);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Water({ params }: { params: React.MutableRefObject<Params> }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(500, 500, 160, 160);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmp: { value: 0 }, uPeriod: { value: 6 } }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uAmp.value = params.current.amp;
    uniforms.uPeriod.value = params.current.period;
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} />
    </mesh>
  );
}
