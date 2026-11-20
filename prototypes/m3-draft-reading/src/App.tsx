import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scene, type Lock } from "./Scene";
import { DEFAULTS, LIMITS, paramsFromQuery, type Params } from "./params";
import {
  DEVICE_LABELS,
  MIN_FPS_SECONDS,
  completeTrial,
  fpsStats,
  randomTrueDraught,
  type DeviceClass,
  type FpsRun,
  type Trial,
  type UjiExport,
} from "./uji";

const store = createXRStore({ foveation: 0 });
const STORAGE_KEY = "m3-uji-v1";

/** Mode uji (#3): ?uji=1. Nilai sebenarnya dan selisih disembunyikan dari pembaca. */
const UJI = new URLSearchParams(window.location.search).get("uji") === "1";
/** Parameter ombak SKN-01 (data/skn-01.json) dipakai di mode uji bila tidak ditimpa query string. */
const SKN01_WAVE = { amp: 0.15, period: 5 };

function initialParams(): Params {
  const p = paramsFromQuery(window.location.search);
  if (!UJI) return p;
  const q = new URLSearchParams(window.location.search);
  return {
    ...p,
    amp: q.has("amp") ? p.amp : SKN01_WAVE.amp,
    period: q.has("period") ? p.period : SKN01_WAVE.period,
  };
}

function fmtCm(m: number): string {
  const cm = m * 100;
  return `${cm >= 0 ? "+" : "−"}${Math.abs(cm).toFixed(0)} cm`;
}

interface Saved {
  deviceClass: DeviceClass;
  deviceLabel: string;
  reader: string;
  trials: Trial[];
  fpsRuns: FpsRun[];
}

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* abaikan */
  }
  return { deviceClass: "desktop", deviceLabel: "", reader: "R1", trials: [], fpsRuns: [] };
}

export function App() {
  const [params, setParams] = useState<Params>(initialParams);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const [lock, setLock] = useState<Lock | null>(null);
  const [fps, setFps] = useState(0);

  // --- mode uji ---
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const update = useCallback((patch: Partial<Saved>) => {
    const next = { ...savedRef.current, ...patch };
    savedRef.current = next;
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* penyimpanan penuh atau diblokir; data tetap ada di memori */
    }
  }, []);

  const rec = useRef<{ on: boolean; dts: number[]; elapsed: number; inXR: boolean }>({
    on: false, dts: [], elapsed: 0, inXR: false,
  });
  const [recording, setRecording] = useState<{ on: boolean; elapsed: number }>({ on: false, elapsed: 0 });
  const lastShown = useRef(0);

  const stopRecording = useCallback(() => {
    const r = rec.current;
    if (!r.on) return;
    r.on = false;
    const s = fpsStats(r.dts);
    const run: FpsRun = {
      deviceClass: savedRef.current.deviceClass,
      inXR: r.inXR,
      seconds: s.seconds,
      frames: s.frames,
      avg: s.avg,
      p1Low: s.p1Low,
      min: s.min,
      at: new Date().toISOString(),
    };
    update({ fpsRuns: [...savedRef.current.fpsRuns, run] });
    setRecording({ on: false, elapsed: s.seconds });
  }, [update]);

  const onFrame = useCallback(
    (dt: number) => {
      const r = rec.current;
      if (!r.on) return;
      r.dts.push(dt);
      r.elapsed += dt;
      if (r.elapsed - lastShown.current >= 0.5) {
        lastShown.current = r.elapsed;
        setRecording({ on: true, elapsed: r.elapsed });
      }
      if (r.elapsed >= MIN_FPS_SECONDS) stopRecording();
    },
    [stopRecording],
  );

  const toggleRecording = useCallback(() => {
    if (rec.current.on) {
      stopRecording();
      return;
    }
    rec.current = { on: true, dts: [], elapsed: 0, inXR: store.getState().session != null };
    lastShown.current = 0;
    setRecording({ on: true, elapsed: 0 });
  }, [stopRecording]);

  const newTrial = useCallback(() => {
    const s = savedRef.current;
    const trueDraught = randomTrueDraught();
    setParams((p) => ({ ...p, trueDraught }));
    paramsRef.current = { ...paramsRef.current, trueDraught };
    setLock(null);
    const t: Trial = {
      id: s.trials.length + 1,
      reader: s.reader || "R?",
      trueDraught,
      reading: null,
      diff: null,
      amp: paramsRef.current.amp,
      period: paramsRef.current.period,
      markScale: paramsRef.current.markScale,
      at: new Date().toISOString(),
    };
    update({ trials: [...s.trials, t] });
  }, [update]);

  const onLock = (reading: number) => {
    setLock({ reading, trueDraught: paramsRef.current.trueDraught });
    if (!UJI) return;
    const s = savedRef.current;
    const last = s.trials[s.trials.length - 1];
    if (!last) return; // belum ada percobaan: tekan "Percobaan baru" dulu
    update({ trials: [...s.trials.slice(0, -1), completeTrial(last, reading)] });
  };

  const exportJson = () => {
    const s = savedRef.current;
    const data: UjiExport = {
      version: 1,
      deviceClass: s.deviceClass,
      deviceLabel: s.deviceLabel,
      userAgent: navigator.userAgent,
      exportedAt: new Date().toISOString(),
      trials: s.trials,
      fpsRuns: s.fpsRuns,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hasil-${s.deviceClass}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (window.confirm("Hapus semua percobaan dan rekaman fps di perangkat ini?")) {
      update({ trials: [], fpsRuns: [] });
      setLock(null);
    }
  };

  useEffect(() => {
    // Mode uji: tanpa percobaan aktif, mulai satu agar sarat sebenarnya tidak tetap bawaan.
    if (UJI && savedRef.current.trials.length === 0) newTrial();
  }, [newTrial]);

  const current = saved.trials[saved.trials.length - 1];
  const hudText = useMemo(() => {
    const lines = [`FPS ${fps.toFixed(0)}`];
    if (UJI) {
      lines.push(
        `Percobaan ${current?.id ?? "-"} (${saved.reader})`,
        current?.reading != null ? "Bacaan terkunci" : "Arahkan ke tanda sarat lalu pilih",
      );
      if (recording.on) lines.push(`Merekam fps ${recording.elapsed.toFixed(0)}/${MIN_FPS_SECONDS} s`);
      return lines.join("\n");
    }
    lines.push(`Ombak ${params.amp.toFixed(2)} m / ${params.period.toFixed(1)} s`);
    if (lock) {
      lines.push(
        `Bacaan ${lock.reading.toFixed(2)} m`,
        `Sebenarnya ${lock.trueDraught.toFixed(2)} m`,
        `Selisih ${fmtCm(lock.reading - lock.trueDraught)}`,
      );
    } else lines.push("Arahkan ke tanda sarat lalu pilih");
    return lines.join("\n");
  }, [fps, params.amp, params.period, lock, current, saved.reader, recording]);

  const panel: React.CSSProperties = {
    position: "fixed", top: 8, left: 8, width: 290, padding: 10, borderRadius: 8,
    background: "rgba(10,20,32,0.86)", color: "#e8eef3", fontSize: 13, lineHeight: 1.4,
    maxHeight: "calc(100vh - 16px)", overflow: "auto",
  };

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
            onFrame={onFrame}
            hudText={hudText}
            ujiButtons={
              UJI
                ? {
                    onNewTrial: newTrial,
                    onToggleRecord: toggleRecording,
                    recordLabel: recording.on ? `Merekam ${recording.elapsed.toFixed(0)} s` : "Rekam fps 30 s",
                  }
                : undefined
            }
          />
        </XR>
      </Canvas>
      <div style={panel}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{fps.toFixed(0)} fps</div>
        {UJI ? (
          <>
            <div style={{ fontWeight: 600, marginTop: 4 }}>Mode uji gerbang #3</div>
            <label style={{ display: "block", marginTop: 6 }}>
              Perangkat
              <select
                value={saved.deviceClass}
                onChange={(e) => update({ deviceClass: e.target.value as DeviceClass })}
                style={{ width: "100%" }}
              >
                {(Object.keys(DEVICE_LABELS) as DeviceClass[]).map((k) => (
                  <option key={k} value={k}>{DEVICE_LABELS[k]}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "block", marginTop: 6 }}>
              Catatan perangkat (model, peramban)
              <input style={{ width: "100%" }} value={saved.deviceLabel} onChange={(e) => update({ deviceLabel: e.target.value })} />
            </label>
            <label style={{ display: "block", marginTop: 6 }}>
              Kode pembaca (mis. R1, R2)
              <input style={{ width: "100%" }} value={saved.reader} onChange={(e) => update({ reader: e.target.value.trim() })} />
            </label>
            <div style={{ marginTop: 8 }}>
              Ombak {params.amp} m / {params.period} s · tanda ×{params.markScale}
            </div>
            <div style={{ marginTop: 6 }}>
              Percobaan {current?.id ?? "-"}: {current?.reading != null ? "bacaan terkunci" : "belum dikunci"}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={newTrial}>Percobaan baru</button>
              <button onClick={toggleRecording}>
                {recording.on ? `Merekam ${recording.elapsed.toFixed(0)}/${MIN_FPS_SECONDS} s` : "Rekam fps 30 s"}
              </button>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => store.enterVR()}>Masuk VR</button>
              <button onClick={exportJson}>Unduh hasil</button>
              <button onClick={clearData}>Hapus data</button>
            </div>
            <div style={{ marginTop: 8, opacity: 0.85 }}>
              Tersimpan: {saved.trials.filter((t) => t.reading !== null).length} percobaan terkunci,{" "}
              {saved.fpsRuns.length} rekaman fps.
              {saved.fpsRuns.slice(-1).map((r) => (
                <div key={r.at}>
                  Rekaman terakhir: {r.avg} fps rata-rata, {r.p1Low} (1% low), {r.min} (min){r.inXR ? ", VR" : ""}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 6, opacity: 0.7 }}>Seret: menengok · Roda mouse: zoom</div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </>
  );
}
