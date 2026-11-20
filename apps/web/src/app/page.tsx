import Link from "next/link";
import { listScenarios } from "@/lib/scenarios";

export const dynamic = "force-dynamic";

export default function Home() {
  const scenarios = listScenarios();
  return (
    <>
      <h1>Draught Survey VR</h1>
      <p>Pilih skenario latihan.</p>
      <ul className="cards">
        {scenarios.map((s) => (
          <li key={s.id}>
            <Link href={`/skenario/${s.id.toLowerCase()}`}>
              <strong>{s.id}</strong> — {s.judul}
            </Link>
            {!s.validasi.smeValidated && <span className="badge">belum divalidasi SME</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
