# Serah-terima pekerjaan (untuk melanjutkan di perangkat lain)

Diperbarui 2026-11-20. Dokumen ini ada di `main` supaya terbaca tanpa harus mengambil branch tertentu. Riwayat percakapan rinci ada di `docs/log-percakapan.md` pada branch `docs-log-sesi-2` (PR #32).

## Keadaan singkat

- `main` hanya berisi dokumen desain, spec, GLOSSARY, dan log awal. **Tidak ada kode di `main`.** Semua kode ada di branch dan PR yang belum di-merge.
- Fase 0 dan fase 1 selesai (engine, skema, data SKN-01, penilaian, validator aset, prototipe). Player 2D (#12) selesai. Persiapan uji #3 selesai.
- **#3 (uji perangkat): pengguna menyatakan "OK" pada 2026-11-20.** Data hasil ujinya tidak diberikan ke agen dan belum ditempel ke issue #3. Issue #3 masih terbuka; sebaiknya tempel keluaran `npm run analyze` dan parameter akhir di sana lalu tutup.
- Sedang dikerjakan: #13 + #14 (Player 3D baca enam titik sarat). Baru ada dependensi; belum ada kode adegan.

## Peta PR dan branch

Branch bertingkat: tiap baris bergantung pada baris di atasnya dalam rantainya. Merge **berurutan** dari atas ke bawah; GitHub mengarahkan ulang PR berikutnya ke `main` bila branch dasar dihapus saat merge.

Rantai engine dan Player:

| PR | Branch | Base | Issue | Isi |
|---|---|---|---|---|
| #28 | `issue-4-engine-koreksi-sarat` | `main` | #4 | koreksi sarat sampai QM, scaffolding survey-engine |
| #29 | `issue-5-engine-hidrostatik` | `issue-4-…` | #5 | hidrostatik, FTC, STC, koreksi densitas |
| #30 | `issue-6-engine-deductibles` | `issue-5-…` | #6 | deductibles, net displacement, muatan, `computeCargo` |
| #33 | `issue-10-engine-gelombang` | `issue-6-…` | #10 | fungsi gelombang, nilai puncak-lembah |
| #34 | `issue-9-scenario-skn-01` | `issue-10-…` | #9 | skema Zod, data SKN-01, kalibrasi tangki |
| #35 | `issue-11-engine-skor-rubrik` | `issue-9-…` | #11 | penilaian rubrik |
| #36 | `issue-26-loader-manifest-aset` | `issue-11-…` | #26 | paket `asset-contract` |
| #37 | `issue-12-player-tracer` | `issue-26-…` | #12 | Player 2D Next.js |
| — | `issue-13-14-player-baca-sarat` | `issue-12-…` | #13, #14 | **WIP, belum ada PR** |

Berdiri sendiri:

| PR | Branch | Base | Isi |
|---|---|---|---|
| #27 | `issue-7-adr-nilai-benar-di-klien` | `main` | ADR 0001, rapikan PRD (#7) |
| #31 | `issue-2-prototipe-sarat` | `main` | prototipe Vite + R3F (#2) |
| #38 | `issue-3-persiapan-uji-gerbang` | `issue-2-…` | mode uji buta, perekam fps, analisis, protokol (refs #3) |
| #32 | `docs-log-sesi-2` | `main` | log percakapan, sesi 2–5 |

## Melanjutkan di perangkat lain

```bash
git clone https://github.com/aldip4886/draught-survey.git
cd draught-survey
git fetch --all
git checkout issue-13-14-player-baca-sarat      # semua kode terbaru ada di rantai ini
```

`node_modules` tidak ikut repo. Pasang per paket, **mulai dari survey-engine** (paket lain menautkannya lewat `file:`):

```bash
(cd packages/survey-engine   && npm install)
(cd packages/scenario-schema && npm install)
(cd packages/asset-contract  && npm install)
(cd apps/web                 && npm install)
(cd prototypes/m3-draft-reading && npm install)
```

Menjalankan:

| Apa | Perintah |
|---|---|
| Tes engine (79) | `cd packages/survey-engine && npm test` |
| Tes skema + SKN-01 → 31.573,30 t (13) | `cd packages/scenario-schema && npm test` |
| Tes dan validator aset (20) | `cd packages/asset-contract && npm test && npm run validate` |
| Player | `cd apps/web && npm run dev` lalu buka `/skenario/skn-01` |
| Tes Player (20) | `cd apps/web && npm test` |
| Prototipe | `cd prototypes/m3-draft-reading && npm run dev` |
| Uji #3 lewat HTTPS | `cd prototypes/m3-draft-reading && npm run dev:https` lalu `?uji=1` |

Konvensi kerja: satu branch per issue, PR dengan `Closes #N`, commit diakhiri baris `Co-Authored-By`. Aturan proyek ada di `CLAUDE.md`. Catatan: Claude Code memperlakukan `git push origin main` sebagai tindakan yang perlu izin eksplisit.

## Rancangan #13 + #14 (belum dikerjakan)

Tujuan: peserta di perahu membaca enam titik sarat di adegan 3D, mencatat puncak dan lembah, dan rata-ratanya masuk lembar kerja.

- **Engine:** tambah `meanPeakTrough(peak, trough)` di `waves.ts` (rata-rata dibulatkan ke cm) beserta test. Rumus tidak boleh ada di Player.
- **Gelombang:** air di GPU harus memakai `waveComponents(p)` dari engine sebagai uniform (amplitudo, omega, k, arah, fase), bukan konstanta yang dicermin seperti di prototipe. Rumus jumlah sinus di GLSL tetap diulang (tidak bisa dibagi dengan JS).
- **Posisi dan geometri:** pelat tanda di enam titik dari `draughtMarkPlacements` (`packages/asset-contract`) atau `markPoint` (engine). Satu tekstur angka dipakai bersama. +x haluan, +z starboard, +y atas.
- **Sarat air tenang per titik:** `stillDraughtFor(nilaiBenar, x, z, ombak)` dari engine. Lambung kaku: miringkan statis (trim, list) dari selisih sarat, geser tiap pelat sebesar (sarat bidang − sarat target) supaya angka yang terbaca di garis air sama dengan nilai benar titik itu. Gerak dinamis memakai `hullVerticalOffset`.
- **UI pengukuran:** pilih titik (6 tombol); kunci dengan klik pada pelat sebagai "Puncak", "Lembah", atau "Bacaan langsung"; rata-rata dari engine; hasil menulis ke `form.draughts` (format Indonesia, "10,12"). Fase baru "pengukuran" antara briefing dan lembar kerja. Perahu dan kamera berpindah ke titik terpilih (sisi port: kamera menghadap +z).
- **Kamera:** seret untuk menengok, roda mouse untuk zoom (di desktop ±1 cm menuntut zoom; lihat protokol #3).
- Adegan dimuat dengan `next/dynamic` (`ssr: false`).
- Tes: logika pemetaan titik → form dan perataan; bukan render GPU.

## Keputusan dan asumsi yang masih terbuka

1. Sub-bobot rubrik 25 poin "urutan dan tanda koreksi" = 10/5/5/5 (asumsi; spec tidak merinci). Lulus = muatan dalam ±0,5%, terlepas dari skor total.
2. Koefisien muai bahan bakar 0,00065 dan suhu tangki di SKN-01 adalah asumsi; tabel hidrostatik SKN-01 linear. Perlu reviewer SME.
3. Rentang ukuran model di `content/assets/manifest.json` (`maxExtentMeters`) adalah taksiran.
4. Tafsiran kriteria #3 di `docs/tests/uji-gerbang-3.md` (fps rata-rata 30 s, rekaman terburuk, ≥ 2 pembaca × 5 percobaan, semua ≤ 1 cm).
5. Nilai benar terkirim ke klien (ADR 0001): teks yang tampil ke peserta tidak boleh memuat angka kunci (ada tes).

## Belum dikerjakan

- **#8 aset visual:** butuh pembuatan GLB sungguhan (model, tekstur, panorama). Saat ini semua entri manifest `file: null` (aset bawaan prosedural). Validator dan loader sudah siap (#26).
- **#15–#20** (foto buku saku, sampler, hydrometer, tangki, termometer), **#21** mode latihan/ujian, **#22** sesi lokal dan ekspor, **#23** Playwright, **#24** ponsel, **#25** WebXR.
- #21 dan #22 tidak bergantung pada 3D dan bisa dikerjakan kapan saja.

## Hal yang tidak boleh dilupakan

- Jaga repo tetap **private**: memuat katalog modus manipulasi (internal). SKN-01 tanpa anomali.
- Bila fungsi gelombang di engine (`WAVE_LAYOUT`) diubah, ubah juga prototipe dan shader Player bersamaan.
