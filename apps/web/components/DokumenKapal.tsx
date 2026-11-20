import type { PublicScenario } from "@draught-survey/scenario-schema";
import { formatAngka } from "@/lib/angka";
import { labelTangki } from "@/lib/label";

/** Dokumen kapal yang dipakai peserta untuk menghitung. Tidak memuat nilai benar. */
export function DokumenKapal({ scenario: s }: { scenario: PublicScenario }) {
  const k = s.kapal;
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <h2 className="text-base font-semibold">Dokumen kapal</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        <Item label="LBP" value={`${formatAngka(k.lbp, 1)} m`} />
        <Item label="Tanda haluan di belakang FP (d_F)" value={`${formatAngka(k.tanda.haluanDiBelakangFp, 1)} m`} />
        <Item label="Tanda buritan di depan AP (d_A)" value={`${formatAngka(k.tanda.buritanDiDepanAp, 1)} m`} />
        <Item label="Tanda tengah di belakang midship (d_M)" value={`${formatAngka(k.tanda.tengahDiBelakangMidship, 1)} m`} />
        <Item label="Lightship" value={`${formatAngka(k.lightship)} t`} />
        <Item label="Constant (initial survey)" value={`${formatAngka(s.initial.constant)} t`} />
        <Item label="Densitas dasar tabel" value={`${formatAngka(s.hidrostatik.densitasTabel, 3)} t/m³`} />
      </dl>

      <details>
        <summary className="cursor-pointer font-medium">Tabel hidrostatik ({s.hidrostatik.baris.length} baris)</summary>
        <div className="mt-2 max-h-80 overflow-auto">
          <table className="w-full text-right tabular-nums">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Sarat (m)</th>
                <th>Displacement (t)</th>
                <th>TPC</th>
                <th>LCF (m)</th>
                <th>MTC</th>
              </tr>
            </thead>
            <tbody>
              {s.hidrostatik.baris.map((r) => (
                <tr key={r.sarat} className="border-t border-slate-100">
                  <td>{formatAngka(r.sarat)}</td>
                  <td>{formatAngka(r.displacement)}</td>
                  <td>{formatAngka(r.tpc, 1)}</td>
                  <td>{formatAngka(r.lcf, 2)}</td>
                  <td>{formatAngka(r.mtc, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-slate-500">LCF negatif = di belakang midship.</p>
        </div>
      </details>

      <details>
        <summary className="cursor-pointer font-medium">Tabel kalibrasi tangki</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {s.tangki.map((t) => (
            <div key={t.id} className="rounded border border-slate-100 p-2">
              <div className="font-medium">{labelTangki(t.id, t.kelompok)}</div>
              <div className="text-slate-600">
                {t.fluida.jenis === "cairan"
                  ? `Densitas ${formatAngka(t.fluida.densitas, 3)} t/m³`
                  : `Densitas 15 °C ${formatAngka(t.fluida.densitas15, 4)} t/m³ · suhu ${formatAngka(t.fluida.suhu, 1)} °C · koefisien muai ${formatAngka(t.fluida.koefisienMuai, 5)}/°C`}
              </div>
              <table className="mt-1 w-full text-right tabular-nums">
                <thead>
                  <tr>
                    <th>Sounding (m)</th>
                    <th>Volume (m³)</th>
                  </tr>
                </thead>
                <tbody>
                  {t.kalibrasi.map((r) => (
                    <tr key={r.sounding}>
                      <td>{formatAngka(r.sounding)}</td>
                      <td>{formatAngka(r.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-1 text-slate-500">Suhu bahan bakar sementara diberikan; pengukuran dengan termometer menyusul.</p>
      </details>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
