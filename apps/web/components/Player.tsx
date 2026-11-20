"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { PublicScenario } from "@draught-survey/scenario-schema";
import type { ScoreReport, StepId } from "@draught-survey/survey-engine";
import { serahkan } from "@/app/skenario/[id]/actions";
import { formatAngka, formatTanggal, parseAngka } from "@/lib/angka";
import { LABEL_KRITERIA, labelTangki } from "@/lib/label";
import { buildSteps, stepComplete, toSubmission, updateOrder, type FieldDef, type Values } from "@/lib/worksheet";
import { DokumenKapal } from "./DokumenKapal";

type Fase = "briefing" | "lembar-kerja" | "skor";

export function Player({ scenario }: { scenario: PublicScenario }) {
  const tanks = useMemo(() => scenario.tangki.map((t) => ({ id: t.id, label: labelTangki(t.id, t.kelompok) })), [scenario]);
  const steps = useMemo(() => buildSteps(tanks), [tanks]);
  const [fase, setFase] = useState<Fase>("briefing");
  const [values, setValues] = useState<Values>({});
  const [order, setOrder] = useState<StepId[]>([]);
  const [report, setReport] = useState<ScoreReport | null>(null);
  const [cargo, setCargo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const tanggal = useMemo(() => formatTanggal(new Date()), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [fase]);

  const setValue = (id: string, v: string) => {
    const next = { ...values, [id]: v };
    setValues(next);
    setOrder((o) => updateOrder(o, steps, next));
  };

  const { submission, kurang } = toSubmission(steps, values, order, tanks);

  const kirim = () => {
    if (!submission) return;
    setError(null);
    startTransition(async () => {
      try {
        setReport(await serahkan(scenario.id, submission));
        setCargo(submission.cargo);
        setFase("skor");
      } catch {
        setError("Penyerahan gagal. Periksa isian lalu coba lagi.");
      }
    });
  };

  const ulangi = () => {
    setValues({});
    setOrder([]);
    setReport(null);
    setFase("briefing");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-sm text-slate-500">
          {scenario.id} · {tanggal}
        </div>
        <h1 className="text-2xl font-semibold">{scenario.judul}</h1>
        {!scenario.validasi.smeValidated && (
          <p role="note" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>Data latihan.</strong> {scenario.validasi.catatan}
          </p>
        )}
      </header>

      {fase === "briefing" && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Briefing</h2>
          {scenario.briefing ? (
            <>
              <p>{scenario.briefing.ringkasan}</p>
              <p>
                <span className="font-medium">Kondisi: </span>
                {scenario.briefing.kondisi} Ombak {formatAngka(scenario.lingkungan.ombak.amplitudo, 1)} m, periode{" "}
                {formatAngka(scenario.lingkungan.ombak.periode, 0)} detik.
              </p>
              <div>
                <div className="font-medium">Tugas</div>
                <ol className="list-decimal pl-6">
                  {scenario.briefing.tugas.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <p>
              {scenario.kapal.nama}. Lakukan survey sesuai prosedur lalu serahkan berat muatan.
            </p>
          )}
          <button
            onClick={() => setFase("lembar-kerja")}
            className="rounded bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800"
          >
            Mulai
          </button>
        </section>
      )}

      {fase === "lembar-kerja" && (
        <>
          <DokumenKapal scenario={scenario} />
          <p className="text-sm text-slate-600">
            Sementara, bacaan sarat, densitas, dan sounding diisi manual. Angka boleh memakai koma desimal (10,12) atau
            titik desimal (10.12); periksa “terbaca” di bawah tiap isian.
          </p>
          <ol className="space-y-4">
            {steps.map((step, i) => {
              const done = stepComplete(step, values);
              return (
                <li key={step.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">
                      {i + 1}. {step.judul}
                    </h3>
                    {done && <span className="text-sm text-emerald-700">lengkap</span>}
                  </div>
                  <p className="mb-3 text-sm text-slate-600">{step.petunjuk}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {step.fields.map((f) => (
                      <Field key={f.id} field={f} value={values[f.id] ?? ""} onChange={(v) => setValue(f.id, v)} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            {kurang.length > 0 && (
              <p className="text-sm text-slate-600">Belum terisi: {kurang.join(", ")}.</p>
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              onClick={kirim}
              disabled={!submission || pending}
              className="rounded bg-sky-700 px-4 py-2 font-medium text-white enabled:hover:bg-sky-800 disabled:opacity-40"
            >
              {pending ? "Menilai…" : "Serahkan"}
            </button>
          </div>
        </>
      )}

      {fase === "skor" && report && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Hasil</h2>
          <p
            className={`rounded px-3 py-2 font-semibold ${report.passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
          >
            {report.passed ? "LULUS" : "BELUM LULUS"} · muatan Anda {cargo !== null ? formatAngka(cargo) : "–"} t
          </p>
          <p className="text-sm text-slate-600">
            Rentang lulus: {formatAngka(report.cargoRange.min)} – {formatAngka(report.cargoRange.max)} t (±0,5%).
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Kriteria</th>
                <th className="py-1 text-right">Skor</th>
                <th className="py-1 pl-4">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {report.criteria.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="py-1">{LABEL_KRITERIA[c.id]}</td>
                  <td className="py-1 text-right tabular-nums">
                    {formatAngka(c.score)} / {formatAngka(c.max, 0)}
                  </td>
                  <td className="py-1 pl-4 text-slate-600">{c.detail}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 font-semibold">
                <td className="py-1">Total</td>
                <td className="py-1 text-right tabular-nums">
                  {formatAngka(report.total)} / {formatAngka(report.max, 0)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
          <button onClick={ulangi} className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
            Ulangi
          </button>
        </section>
      )}
    </div>
  );
}

function Field({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const id = `f-${field.id}`;
  if (field.kind === "tanda") {
    return (
      <label htmlFor={id} className="block text-sm">
        <span className="text-slate-700">{field.label}</span>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="">Pilih…</option>
          <option value="1">+ (ditambah)</option>
          <option value="-1">− (dikurangi)</option>
          <option value="0">0 (tanpa koreksi)</option>
        </select>
      </label>
    );
  }
  const parsed = parseAngka(value);
  const invalid = value.trim() !== "" && parsed === null;
  return (
    <label htmlFor={id} className="block text-sm">
      <span className="text-slate-700">
        {field.label}
        {field.satuan && <span className="text-slate-400"> ({field.satuan})</span>}
      </span>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className={`mt-1 block w-full rounded border px-2 py-1.5 tabular-nums ${invalid ? "border-red-500" : "border-slate-300"}`}
      />
      <span className={`text-xs ${invalid ? "text-red-700" : "text-slate-400"}`}>
        {invalid ? "Angka tidak terbaca" : parsed !== null ? `terbaca: ${formatAngka(parsed, decimals(value))}` : " "}
      </span>
    </label>
  );
}

/** Jumlah digit desimal yang diketik, agar "terbaca" tidak membulatkan isian peserta. */
function decimals(raw: string): number {
  const s = raw.trim();
  const sep = s.includes(",") ? "," : (s.match(/\./g) ?? []).length === 1 ? "." : null;
  if (!sep) return 0;
  return Math.min(s.length - s.lastIndexOf(sep) - 1, 6);
}
