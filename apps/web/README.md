# apps/web

Aplikasi Next.js (App Router): Player 3D/VR, Portal Trainer, Dashboard kelas, Admin. Lihat PRD bagian 3 dan 5.

Saat ini berisi **Player tracer** (#12): daftar skenario → briefing → lembar kerja (input manual) → serahkan → skor per kriteria rubrik.

```
pnpm install            # di root repo
pnpm dev                # http://localhost:3000
pnpm --filter @draught-survey/web test
```

- Skenario dibaca dari `content/scenarios/*.json` dan divalidasi `scenario-schema`. Skenario baru cukup ditambah sebagai berkas. Lokasi lain bisa diatur lewat `SCENARIO_DIR`.
- Peserta hanya menerima `toPublicScenario` (tanpa nilai benar). Penilaian berjalan di server action dan memanggil `scoreSubmission` dari `survey-engine`. Tidak ada rumus di aplikasi ini.
- Bacaan sarat, densitas, dan sounding masih diisi manual; modul baca di 3D menyusul (#13–#20).
