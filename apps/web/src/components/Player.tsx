"use client";

import { useMemo, useState } from "react";
import type { Scenario } from "@draught-survey/scenario-schema";
import { scenarioToScoringKey } from "@draught-survey/scenario-schema";
import {
  netDisplacementInitial,
  scoreSubmission,
  STEP_ORDER,
  type ScoreReport,
  type Sign,
  type StepId,
} from "@draught-survey/survey-engine";
import { formatDateTime, formatNumber } from "@/lib/format";
import { buildSubmission, emptyForm, type WorksheetForm } from "@/lib/worksheet";

const STEP_LABELS: Record<StepId, string> = {
  "read-draughts": "Baca sarat enam titik",
  "perpendicular-correction": "Koreksi sarat ke FP, AP, dan midship",
  "true-trim": "Hitung trim sejati",
  "quarter-mean": "Hitung quarter mean (QM)",
  hydrostatics: "Interpolasi tabel hidrostatik (displacement, TPC, LCF)",
  ftc: "Koreksi trim pertama (FTC)",
  stc: "Koreksi trim kedua (STC)",
  "density-correction": "Koreksi densitas",
  deductibles: "Jumlahkan deductibles dari sounding tangki",
  "net-displacement": "Hitung net displacement final",
  cargo: "Hitung muatan",
};

const CRITERION_LABELS: Record<string, string> = {
  draught: "Pembacaan sarat",
  density: "Densitas",
  sounding: "Sounding tangki",
  worksheet: "Urutan dan tanda koreksi",
  result: "Hasil akhir",
};

type Phase = "briefing" | "worksheet" | "result";

export function Player({ scenario }: { scenario: Scenario }) {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [form, setForm] = useState<WorksheetForm>(() => emptyForm(scenario));
  const [missing, setMissing] = useState<string[]>([]);
  const [report, setReport] = useState<ScoreReport | null>(null);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  const tankIds = useMemo(() => scenario.final.tangki.map((t) => t.id), [scenario]);

  function submit() {
    const built = buildSubmission(form, tankIds);
    if (!built.ok) {
      setMissing(built.missing);
      return;
    }
    setMissing([]);
    // Penilaian sepenuhnya di survey-engine; Player hanya menyerahkan isian.
    setReport(scoreSubmission(scenarioToScoringKey(scenario), built.submission));
    setSubmittedAt(new Date());
    setPhase("result");
  }

  function restart() {
    setForm(emptyForm(scenario));
    setReport(null);
    setMissing([]);
    setPhase("briefing");
  }

  return (
    <>
      <h1>
        {scenario.id} — {scenario.judul}
      </h1>
      {!scenario.validasi.smeValidated && (
        <div className="notice" role="note">
          <strong>Belum divalidasi SME.</strong> {scenario.validasi.catatan}
        </div>
      )}
      {phase === "briefing" && <Briefing scenario={scenario} onStart={() => setPhase("worksheet")} />}
      {phase === "worksheet" && (
        <Worksheet scenario={scenario} form={form} setForm={setForm} missing={missing} onSubmit={submit} />
      )}
      {phase === "result" && report && (
        <Result report={report} submittedAt={submittedAt} onRestart={restart} />
      )}
    </>
  );
}

function Briefing({ scenario, onStart }: { scenario: Scenario; onStart: () => void }) {
  const k = scenario.kapal;
  return (
    <>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Briefing</h2>
        <p>
          Anda melakukan <strong>final survey</strong> ({scenario.kegiatan}) di <strong>{k.nama}</strong>. Baca sarat di
          enam titik, ambil densitas air, sounding semua tangki, lalu hitung muatan di lembar kerja dan serahkan.
        </p>
        <table>
          <tbody>
            <tr>
              <th>LBP</th>
              <td className="num">{formatNumber(k.lbp, 1)} m</td>
            </tr>
            <tr>
              <th>Tanda sarat haluan di belakang FP</th>
              <td className="num">{formatNumber(k.tanda.haluanDiBelakangFp, 1)} m</td>
            </tr>
            <tr>
              <th>Tanda sarat buritan di depan AP</th>
              <td className="num">{formatNumber(k.tanda.buritanDiDepanAp, 1)} m</td>
            </tr>
            <tr>
              <th>Tanda sarat tengah di belakang midship</th>
              <td className="num">{formatNumber(k.tanda.tengahDiBelakangMidship, 1)} m</td>
            </tr>
          </tbody>
        </table>
        <p>Lulus bila muatan Anda dalam ±0,5% dari muatan sebenarnya.</p>
      </div>
      <button onClick={onStart}>Mulai</button>
    </>
  );
}

function SignPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Sign | null;
  onChange: (s: Sign) => void;
}) {
  const opts: [Sign, string][] = [
    [-1, "−"],
    [0, "0"],
    [1, "+"],
  ];
  return (
    <div>
      <label>{label}</label>
      <div className="signs" role="group" aria-label={label}>
        {opts.map(([s, text]) => (
          <button key={s} type="button" aria-pressed={value === s} onClick={() => onChange(s)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Worksheet({
  scenario,
  form,
  setForm,
  missing,
  onSubmit,
}: {
  scenario: Scenario;
  form: WorksheetForm;
  setForm: (f: WorksheetForm | ((prev: WorksheetForm) => WorksheetForm)) => void;
  missing: string[];
  onSubmit: () => void;
}) {
  // Pembaruan fungsional: klik atau ketikan beruntun tidak saling menimpa.
  const set = (patch: (f: WorksheetForm) => Partial<WorksheetForm>) => setForm((f) => ({ ...f, ...patch(f) }));
  const initial = netDisplacementInitial(scenario.kapal.lightship, scenario.initial.constant);

  const toggleStep = (id: StepId) =>
    set((f) => ({ stepOrder: f.stepOrder.includes(id) ? f.stepOrder.filter((s) => s !== id) : [...f.stepOrder, id] }));

  const draughtField = (p: "forward" | "mid" | "aft", side: "port" | "starboard", label: string) => (
    <div key={`${p}${side}`}>
      <label htmlFor={`d-${p}-${side}`}>{label} (m)</label>
      <input
        id={`d-${p}-${side}`}
        type="text"
        inputMode="decimal"
        value={form.draughts[p][side]}
        onChange={(e) => { const v = e.target.value; set((f) => ({ draughts: { ...f.draughts, [p]: { ...f.draughts[p], [side]: v } } })); }}
      />
    </div>
  );

  return (
    <>
      <h2>Data acuan</h2>
      <div className="panel">
        <table>
          <tbody>
            <tr>
              <th>Lightship</th>
              <td className="num">{formatNumber(scenario.kapal.lightship, 2)} t</td>
            </tr>
            <tr>
              <th>Net displacement initial</th>
              <td className="num">{formatNumber(initial, 2)} t</td>
            </tr>
            <tr>
              <th>Densitas air pada tabel hidrostatik</th>
              <td className="num">{formatNumber(scenario.hidrostatik.densitasTabel, 3)} t/m³</td>
            </tr>
          </tbody>
        </table>
        <details>
          <summary>Tabel hidrostatik</summary>
          <table>
            <thead>
              <tr>
                <th className="num">Sarat (m)</th>
                <th className="num">Displacement (t)</th>
                <th className="num">TPC</th>
                <th className="num">LCF (m)</th>
                <th className="num">MTC</th>
              </tr>
            </thead>
            <tbody>
              {scenario.hidrostatik.baris.map((r) => (
                <tr key={r.sarat}>
                  <td className="num">{formatNumber(r.sarat, 2)}</td>
                  <td className="num">{formatNumber(r.displacement, 2)}</td>
                  <td className="num">{formatNumber(r.tpc, 3)}</td>
                  <td className="num">{formatNumber(r.lcf, 3)}</td>
                  <td className="num">{formatNumber(r.mtc, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        {scenario.final.tangki.map((t) => (
          <details key={t.id}>
            <summary>Tabel kalibrasi tangki {t.id}</summary>
            <table>
              <thead>
                <tr>
                  <th className="num">Sounding (m)</th>
                  <th className="num">Volume (m³)</th>
                </tr>
              </thead>
              <tbody>
                {t.kalibrasi.map((r) => (
                  <tr key={r.sounding}>
                    <td className="num">{formatNumber(r.sounding, 2)}</td>
                    <td className="num">{formatNumber(r.volume, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>

      <h2>Pembacaan</h2>
      <div className="grid">
        {draughtField("forward", "port", "Sarat haluan kiri")}
        {draughtField("forward", "starboard", "Sarat haluan kanan")}
        {draughtField("mid", "port", "Sarat tengah kiri")}
        {draughtField("mid", "starboard", "Sarat tengah kanan")}
        {draughtField("aft", "port", "Sarat buritan kiri")}
        {draughtField("aft", "starboard", "Sarat buritan kanan")}
        <div>
          <label htmlFor="density">Densitas air (t/m³)</label>
          <input
            id="density"
            type="text"
            inputMode="decimal"
            value={form.density}
            onChange={(e) => { const v = e.target.value; set(() => ({ density: v })); }}
          />
        </div>
      </div>
      <h2>Sounding tangki</h2>
      <div className="grid">
        {scenario.final.tangki.map((t) => (
          <div key={t.id}>
            <label htmlFor={`s-${t.id}`}>Sounding {t.id} (m)</label>
            <input
              id={`s-${t.id}`}
              type="text"
              inputMode="decimal"
              value={form.soundings[t.id] ?? ""}
              onChange={(e) => { const v = e.target.value; set((f) => ({ soundings: { ...f.soundings, [t.id]: v } })); }}
            />
          </div>
        ))}
      </div>

      <h2>Tanda koreksi</h2>
      <div className="grid">
        <SignPicker label="Koreksi sarat haluan (FP)" value={form.signs.forward} onChange={(s) => set((f) => ({ signs: { ...f.signs, forward: s } }))} />
        <SignPicker label="Koreksi sarat tengah (midship)" value={form.signs.mid} onChange={(s) => set((f) => ({ signs: { ...f.signs, mid: s } }))} />
        <SignPicker label="Koreksi sarat buritan (AP)" value={form.signs.aft} onChange={(s) => set((f) => ({ signs: { ...f.signs, aft: s } }))} />
        <SignPicker label="FTC" value={form.signs.ftc} onChange={(s) => set((f) => ({ signs: { ...f.signs, ftc: s } }))} />
        <SignPicker label="STC" value={form.signs.stc} onChange={(s) => set((f) => ({ signs: { ...f.signs, stc: s } }))} />
      </div>

      <h2>Urutan pengerjaan</h2>
      <p>Tandai tiap langkah saat Anda selesai mengerjakannya, sesuai urutan Anda.</p>
      <ol className="steps">
        {STEP_ORDER.map((id) => {
          const n = form.stepOrder.indexOf(id);
          return (
            <li key={id} className={n >= 0 ? "done" : ""}>
              <span>{STEP_LABELS[id]}</span>
              <button type="button" className="secondary" onClick={() => toggleStep(id)}>
                {n >= 0 ? `Selesai (${n + 1}) — batalkan` : "Tandai selesai"}
              </button>
            </li>
          );
        })}
      </ol>

      <h2>Hasil</h2>
      <div className="grid">
        <div>
          <label htmlFor="cargo">Muatan (t)</label>
          <input id="cargo" type="text" inputMode="decimal" value={form.cargo} onChange={(e) => { const v = e.target.value; set(() => ({ cargo: v })); }} />
        </div>
      </div>
      {missing.length > 0 && (
        <p className="error" role="alert">
          Lengkapi dulu: {missing.join(", ")}.
        </p>
      )}
      <p>
        <button onClick={onSubmit}>Serahkan</button>
      </p>
    </>
  );
}

function Result({
  report,
  submittedAt,
  onRestart,
}: {
  report: ScoreReport;
  submittedAt: Date | null;
  onRestart: () => void;
}) {
  return (
    <>
      <h2>Hasil</h2>
      <p className={`verdict ${report.passed ? "pass" : "fail"}`} role="status">
        {report.passed ? "Lulus" : "Belum lulus"}
      </p>
      <p>
        Skor {formatNumber(report.total, 2)} dari {formatNumber(report.max, 0)}. Rentang lulus muatan:{" "}
        {formatNumber(report.cargoRange.min, 2)}–{formatNumber(report.cargoRange.max, 2)} t.
        {submittedAt && <> Diserahkan {formatDateTime(submittedAt)}.</>}
      </p>
      <table>
        <thead>
          <tr>
            <th>Kriteria</th>
            <th className="num">Skor</th>
            <th className="num">Maks</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {report.criteria.map((c) => (
            <tr key={c.id}>
              <td>{CRITERION_LABELS[c.id] ?? c.id}</td>
              <td className="num">{formatNumber(c.score, 2)}</td>
              <td className="num">{formatNumber(c.max, 0)}</td>
              <td>{c.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <button onClick={onRestart}>Ulangi</button>
      </p>
    </>
  );
}
