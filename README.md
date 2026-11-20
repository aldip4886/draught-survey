# Draught Survey VR

Platform simulasi imersif untuk melatih pegawai Bea Cukai melakukan dan menguji draught survey (pengukuran muatan curah di atas kapal). Platform ini berjalan di headset VR (WebXR), desktop, tablet, dan ponsel. Trainer dapat membuat skenario baru tanpa bantuan developer.

> **Internal.** Repositori ini memuat katalog modus manipulasi berat muatan. Jaga repositori tetap **private**.

## Dokumen

| Dokumen | Isi |
| --- | --- |
| [Kerangka materi & learning path VR](docs/01-kerangka-materi/kerangka-materi-dan-learning-path-vr.md) | Tahapan survey, rumus koreksi, titik rawan dan modus, 9 modul VR, contoh hitung |
| [PRD platform simulasi](docs/02-prd/prd-platform-simulasi-draught-survey.md) | Peran, kebutuhan fungsional, authoring skenario, arsitektur, rencana rilis, 3 skenario |

## Struktur folder

```
draught_survey/
├── .claude/skills/        # Skill agen untuk project ini
├── docs/                  # Dokumen desain (kerangka materi, PRD, ADR)
├── apps/web/              # Aplikasi Next.js: Player, Portal Trainer, Dashboard, Admin
├── packages/
│   ├── survey-engine/     # Mesin hitung draught survey (TypeScript murni)
│   └── scenario-schema/   # Skema Zod untuk file skenario
├── content/
│   ├── scenarios/         # File skenario (JSON)
│   ├── dialogs/           # Dialog NPC (ink)
│   └── ship-templates/    # Data kapal: hidrostatik, tangki, posisi tanda sarat
├── assets/                # Model 3D, tekstur, file sumber Blender
└── prototypes/            # Prototipe sekali pakai (Fase 0)
```

## Skill agen di project ini

Terpasang di `.claude/skills/` dan aktif otomatis saat Claude Code dibuka di folder ini.

| Sumber | Skill | Cara update |
| --- | --- | --- |
| [mattpocock/skills](https://github.com/mattpocock/skills) (engineering + productivity) | 27 skill, a.l. `grill-with-docs`, `tdd`, `prototype`, `domain-modeling`, `to-spec`, `setup-matt-pocock-skills` | `npx skills@latest update -p` (tercatat di `skills-lock.json`) |
| [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/threejs-skills) | `threejs-skills` | Salin ulang manual dari repo sumber |
| [claude-code-templates](https://www.aitmpl.com/component/skills/creative-design/3d-web-experience) | `3d-web-experience` | `npx claude-code-templates@latest --skill creative-design/3d-web-experience` |

Langkah pertama yang disarankan: jalankan `/setup-matt-pocock-skills` sekali untuk mengatur issue tracker dan lokasi dokumen.

## Menjalankan

```
pnpm install
pnpm dev          # Player di http://localhost:3000
pnpm test         # semua paket (Turborepo)
pnpm typecheck
```

Prototipe di `prototypes/` berdiri sendiri (npm), di luar workspace.

## Tech stack (ringkas)

TypeScript · pnpm workspaces + Turborepo · Next.js · three.js + React Three Fiber + @react-three/xr · Zustand · XState · inkjs · PostgreSQL + Drizzle · MinIO · Keycloak · Vitest + Playwright. Rincian di PRD bagian 5.

## Langkah berikutnya

Fase 0 (prototipe, 4–6 minggu):

1. `packages/survey-engine` dengan unit test terhadap contoh hitung 31.573,30 t (Lampiran L1 kerangka materi).
2. Prototipe M3 (membaca sarat di laut berombak) di `prototypes/m3-draft-reading`.
