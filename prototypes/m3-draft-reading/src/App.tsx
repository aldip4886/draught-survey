import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { useMemo, useRef, useState } from "react";
import { Scene, type Lock } from "./Scene";
import { DEFAULTS, LIMITS, paramsFromQuery, type Params } from "./params";

const store = createXRStore({ foveation: 0 });

function fmtCm(m: number): string {
  const cm = m * 100;
  return `${cm >= 0 ? "+" : "−"}${Math.abs(cm).toFixed(0)} cm`;
}

export function App() {
  const [params, setParams] = useState<Params>(() => paramsFromQuery(window.location.search));
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const [lock, setLock] = useState<Lock | null>(null);
  const [fps, setFps] = useState(0);

  const hudText = useMemo(() => {
    const lines = [`FPS ${fps.toFixed(0)}`, `Ombak ${params.amp.toFixed(2)} m / ${params.period.toFixed(1)} s`];
    if (lock) {
      lines.push(
        `Bacaan ${lock.reading.toFixed(2)} m`,
        `Sebenarnya ${lock.trueDraught.toFixed(2)} m`,
        `Selisih ${fmtCm(lock.reading - lock.trueDraught)}`,
      );
    } else lines.push("Arahkan ke tanda sarat lalu pilih");
    return lines.join("\n");
  }, [fps, params.amp, params.period, lock]);

  const onLock = (reading: number) => setLock({ reading, trueDraught: paramsRef.current.trueDraught });

  return (
    <>
      <Canvas camera={{ fov: 45, near: 0.1, far: 800 }} gl={{ antialias: true }}>
        <XR store={store}>
          <Scene
            params={paramsRef}
            markScale={params.markScale}
            lock={lock}
            onLock={onLock}
            onFps={setFps}
            hudText={hudText}
          />
        </XR>
      </Canvas>
      <div
        style={{
          position: "fixed", top: 8, left: 8, width: 270, padding: 10, borderRadius: 8,
          background: "rgba(10,20,32,0.82)", color: "#e8eef3", fontSize: 13, lineHeight: 1.4,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18 }}>{fps.toFixed(0)} fps</div>
        {(Object.keys(LIMITS) as (keyof Params)[]).map((k) => (
          <label key={k} style={{ display: "block", marginTop: 6 }}>
            {LIMITS[k].label}: <b>{params[k]}</b>
            <input
              type="range"
              min={LIMITS[k].min}
              max={LIMITS[k].max}
              step={LIMITS[k].step}
              value={params[k]}
              onChange={(e) => setParams({ ...params, [k]: Number(e.target.value) })}
              style={{ width: "100%" }}
            />
          </label>
        ))}
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <button onClick={() => setParams(DEFAULTS)}>Reset</button>
          <button onClick={() => setLock(null)}>Hapus kunci</button>
          <button onClick={() => store.enterVR()}>Masuk VR</button>
        </div>
        <div style={{ marginTop: 8, whiteSpace: "pre-line", fontVariantNumeric: "tabular-nums" }}>
          {lock
            ? `Bacaan: ${lock.reading.toFixed(2)} m\nSebenarnya: ${lock.trueDraught.toFixed(2)} m\nSelisih: ${fmtCm(lock.reading - lock.trueDraught)}`
            : "Klik tanda sarat di lambung untuk mengunci bacaan."}
        </div>
        <div style={{ marginTop: 6, opacity: 0.7 }}>Seret: menengok · Roda mouse: zoom</div>
      </div>
    </>
  );
}
