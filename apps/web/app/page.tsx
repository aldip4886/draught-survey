import Link from "next/link";
import { loadScenarios } from "@/lib/scenarios";

export const dynamic = "force-dynamic";

export default async function Beranda() {
  const scenarios = await loadScenarios();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pilih skenario</h1>
      <ul className="space-y-3">
        {scenarios.map((s) => (
          <li key={s.id}>
            <Link
              href={`/skenario/${s.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-sky-500"
            >
              <div className="text-sm text-slate-500">{s.id}</div>
              <div className="font-medium">{s.judul}</div>
              <div className="text-sm text-slate-600">{s.kapal.nama}</div>
            </Link>
          </li>
        ))}
      </ul>
      {scenarios.length === 0 && <p>Belum ada skenario yang lolos validasi.</p>}
    </div>
  );
}
