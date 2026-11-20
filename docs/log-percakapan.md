# Log percakapan pengerjaan

Catatan kumulatif percakapan antara pengguna dan agen. Setiap sesi diberi timestamp (WIB, UTC+7).

**Aturan pembaruan:** di akhir pengerjaan setiap issue, tambahkan sesi baru di bagian bawah yang merangkum percakapan yang belum terekam. Jangan menulis ulang sesi lama.

**Catatan timestamp:** waktu per giliran tidak tersimpan di percakapan. Timestamp sesi adalah waktu pencatatan, bukan waktu tiap giliran. Satu-satunya jangkar waktu lain adalah waktu pembuatan issue di GitHub (26 issue dibuat 2026-11-20 antara 13:59 dan 14:33 WIB).

---

## Sesi 1 — 2026-11-20, dicatat 14:41 WIB

**Konteks:** branch `main`, 2 commit awal (`616ed8d`, `f4a897d`). Belum ada kode implementasi.

### 1. Cek progres project
- Status: masih tahap perencanaan.
- Sudah ada: kerangka materi, PRD, struktur monorepo (`packages/survey-engine`, `packages/scenario-schema`, `apps/web`, `content/*`), skill agen, spec Player MVP SKN-01, `GLOSSARY.md`, folder `prototypes/m3-draft-reading/`.
- Issue GitHub: 26 terbuka, 0 selesai. Semua `ready-for-agent`, kecuali #3 (`ready-for-human`).
- Perubahan yang belum ter-commit saat itu: revisi PRD, `GLOSSARY.md`, `content/assets/`, `docs/specs/`.

### 2. Commit
- Commit `06f3699` di `main`: "Tambah spec Player MVP SKN-01, GLOSSARY, aset awal, dan revisi PRD".
- Isi: 5 file (revisi PRD, `GLOSSARY.md`, `content/assets/README.md`, `content/assets/manifest.json`, `docs/specs/player-mvp-skn-01.md`).

### 3. Push
- `git push origin main`, hasil `f4a897d..06f3699`. Langsung ke `main`, tanpa PR.

### 4. Apakah ticket sudah berbentuk PR?
- Belum. Tidak ada PR, hanya branch `main`. Semua ticket masih GitHub Issues.
- Alur yang disarankan: satu branch per issue (mis. `issue-4-engine-koreksi-sarat`), PR dengan `Closes #N`.

### 5. Rekomendasi urutan pengerjaan
Cek isi 26 issue: tidak ada yang menyatakan dependensi eksplisit ("blocked by" dan sejenisnya). **Urutan di bawah disimpulkan dari judul issue dan aturan di `CLAUDE.md`, bukan dari dependensi yang tercatat.**

| Fase | Issue | Alasan |
|---|---|---|
| 0 (paralel) | #7 ADR dan rapikan PRD | Kecil; memutuskan risiko nilai benar di klien sebelum arsitektur dikunci |
| 0 | #4 → #5 → #6 engine rumus | Rumus hanya di `survey-engine`; fixture L1 (31.573,30 t, toleransi 0,01 t) menjadi pagar pengaman |
| 0 | #2 prototipe pembacaan sarat → #3 gerbang uji fps di perangkat | Risiko teknis terbesar (fps dan keterbacaan VR). #3 butuh pengguna di perangkat nyata, jadi jalankan #2 lebih awal |
| 1 | #9 scenario-schema dan data SKN-01 | Skenario adalah data; Player membutuhkannya |
| 1 | #10 fungsi gelombang | Dibutuhkan enam titik sarat dan nilai puncak-lembah |
| 1 | #26 loader manifest aset | Dibutuhkan sebelum aset dimuat Player |
| 1 | #8 aset visual | Mulai setelah #3 lolos, supaya aset tidak dibuat untuk pendekatan yang gagal |
| 1 | #11 skor rubrik | Setelah #6, #9, #10 |
| 2 | #12 tracer Player (briefing → lembar kerja → serahkan → skor) | Irisan tipis end-to-end; menguji semua paket sekaligus |
| 2 | #13 → #14 → #15 | Sarat: satu titik, enam titik, foto ke buku saku |
| 2 | #16, #17 | Sampler air dan hydrometer (salinitas/densitas) |
| 2 | #18 → #19 → #20 | Tangki: sounding satu tangki, lima kelompok, termometer |
| 3 | #21 mode latihan/ujian, #22 sesi lokal dan ekspor, #23 tes Playwright | Setelah alur lengkap ada |
| 4 | #24 ponsel, #25 WebXR | Terakhir; browser-first |

### 6. Permintaan dokumentasi
- Pengguna meminta percakapan didokumentasikan dalam file `.md`, dengan timestamp per sesi, dan diakumulasikan di akhir pengerjaan tiap issue.
- Hasilnya adalah file ini.

---

## Sesi 2 — 2026-11-20, dicatat sesudah fase 0 selesai (WIB)

**Konteks:** pengguna meminta "Commit log ini dan langsung mulai dengan fase 0". Fase 0 = #7, #4→#5→#6, #2 (dan #3 yang butuh pengguna).

### 1. Commit log dan kendala push
- Log dicommit lokal: `0a329ea`.
- `git push origin main` **ditolak oleh pengaman otomatis** Claude Code. Tidak dicoba ulang dengan cara lain. Semua pekerjaan fase 0 tinggal di branch lokal; belum ada yang di-push dan belum ada PR.

### 2. Branch dan commit (lokal)

| Issue | Branch | Commit | Catatan |
|---|---|---|---|
| #7 | `issue-7-adr-nilai-benar-di-klien` | `f90dd8a` | ADR `docs/adr/0001-nilai-benar-terbaca-di-klien.md`; D-01, D-02, A-01 dipindah ke V1; baris rilis MVP/V1 di PRD §7 disesuaikan |
| #4 | `issue-4-engine-koreksi-sarat` | `fc7f001` | `correctDraughts`; scaffolding paket (vitest + TypeScript) |
| #5 | `issue-5-engine-hidrostatik` (bertingkat di atas #4) | `566d823` | interpolasi tabel, FTC, STC, koreksi densitas |
| #6 | `issue-6-engine-deductibles` (bertingkat di atas #5) | `9272960` | deductibles, net displacement, constant, muatan, `computeCargo` |
| #2 | `issue-2-prototipe-sarat` (dari main) | `61919a4` | Vite + R3F, ombak sinus, kunci bacaan, tombol VR |

### 3. Keputusan teknis penting
- **Pembulatan mengikuti L1.** Contoh L1 membulatkan sarat terkoreksi ke mm, FTC dan STC ke 0,01 t, sebelum dijumlahkan. Tanpa itu hasil menyimpang sekitar 0,01 t di displacement dan QM (10,3375 vs 10,338). Pembulatan ada di `roundTo` dan dipakai di tiap langkah.
- **Fixture L1 satu sumber** di `packages/survey-engine/test/fixtures/l1.ts`; semua test mengimpor dari sana. `computeCargo` menghasilkan 31.573,30 t (±0,01 t). 39 test lulus, typecheck bersih.
- **Koefisien muai bahan bakar tidak ditebak.** Kerangka materi hanya menyebut "koreksi suhu". `fuelWeight` memakai ρ_t = ρ15 × (1 − α(t − 15)) dengan α wajib diberikan pemanggil. **Perlu dikonfirmasi reviewer SME** formula dan koefisien yang dipakai kelas.
- **MTC untuk STC.** L1 memberi MTC pada QM ±0,5 m langsung (541,0 dan 503,0), bukan dari tabel; engine menerimanya sebagai input.
- **Prototipe:** air digambar di GPU (GLSL) dan gerak perahu/kapal di JS memakai rumus gelombang yang sama (konstanta dicermin). Fungsi gelombang deterministik untuk engine tetap tugas #10.

### 4. Verifikasi prototipe
- Dibuka di Chrome (localhost): adegan tampil, klik tanda sarat mengunci bacaan, garis merah dan selisih muncul, tanpa error konsol. Peringatan "Multiple instances of Three.js" diperbaiki dengan `resolve.dedupe`; papan teks 3D diperkecil; sudut pandang awal diturunkan agar garis air terlihat.
- **Tidak terverifikasi:** fps (lingkungan tanpa GPU, terbaca 1 fps), keterbacaan ±1 cm, WebXR di Quest. Itu cakupan #3 dan butuh pengguna di perangkat.

### 5. Kendala alat
- Beberapa perintah shell panjang berisi heredoc gagal di tahap parsing; file ditulis ulang dengan alat Write. Tidak ada efek pada hasil.

### 6. Status
- #2, #4, #5, #6, #7 selesai secara lokal (belum di-push, belum PR, issue belum tertutup di GitHub).
- #3 menunggu pengguna menguji prototipe di perangkat.

---

## Sesi 3 — 2026-11-20, dicatat sesudah fase 1 (WIB)

**Konteks:** pengguna meminta mendorong semua branch dan membuka PR (dilakukan: PR #27–#32), menjalankan preview prototipe lalu menghentikannya, dan "lanjutkan ke fase berikutnya". Fase 1 = #9, #10, #26, #11; #8 (aset visual) **ditahan** sampai #3 lulus, agar aset tidak dibuat untuk pendekatan yang gagal.

### 1. PR fase 0
- Enam PR dibuka: #27 (#7), #28 (#4), #29 (#5, base `issue-4`), #30 (#6, base `issue-5`), #31 (#2), #32 (log). Urutan merge rantai engine: #28 → #29 → #30.
- Push `main` yang sempat ditolak pengaman otomatis berhasil setelah pengguna memerintahkannya secara eksplisit.

### 2. Preview prototipe
- Dev server dijalankan di `localhost:5173` dan alamat Wi-Fi, lalu dihentikan atas permintaan. WebXR di Quest butuh HTTPS atau `localhost` (via `adb reverse`).

### 3. Fase 1 (branch lokal, bertingkat; belum di-push)

| Issue | Branch | Commit | Isi |
|---|---|---|---|
| #10 | `issue-10-engine-gelombang` (di atas #6) | `e2973f2` | `waves.ts`: gelombang, gerak lambung, `peakTroughBias`, `markPoint`; 52 test engine |
| #9 | `issue-9-scenario-skn-01` (di atas #10) | `0b7ffb9` | skema Zod, `content/scenarios/skn-01.json`, kalibrasi tangki di engine, MTC diinterpolasi dari tabel |
| #11 | `issue-11-engine-skor-rubrik` (di atas #9) | `25804ab` | `scoring.ts`; 79 test engine, 12 test schema |
| #26 | `issue-26-loader-manifest-aset` (di atas #11) | `95c65cf` | paket `asset-contract`: validator GLB, loader dengan fallback, tata letak tanda sarat; 20 test |

### 4. Temuan dan keputusan
- **Bug prototipe (#2) ditemukan dan diperbaiki:** roll dan pitch kapal bertanda terbalik (lambung miring menjauhi ombak). Perbaikan di commit `2e49e2a` pada branch `issue-2`; PR #31 ikut ter-update.
- **Konvensi sumbu** kini tertulis di engine: +x haluan, +z starboard, +y atas.
- **Nilai puncak-lembah:** bias garis air (rata-rata maks+min relatif sarat air tenang) dihitung engine; di SKN-01 (amp 0,15 m, periode 5 s) bias ≤ 1 cm di keenam titik. Data SKN-01 menyimpan nilai benar yang dibaca peserta (angka L1); sarat air tenang diturunkan lewat `stillDraughtFor`.
- **Data SKN-01 sintetis:** tabel hidrostatik linear 9,0–12,0 m (baris 10,3 dan 10,4 sama dengan L1; MTC linear sehingga MTC QM±0,5 = 541,0/503,0), enam tangki dengan volume yang menghasilkan 350/180/820/95/25/10 t. HFO dan MDO memakai suhu 45 °C dan 30 °C dengan α = 0,00065 (**asumsi, perlu SME**). Ditandai `smeValidated: false`.
- **Asumsi sub-bobot rubrik (perlu keputusan):** spec hanya memberi 25 poin untuk "urutan dan tanda koreksi". Dipakai 10 (urutan) + 5 (tanda perpendikular) + 5 (FTC) + 5 (STC). Lulus = muatan dalam ±0,5% (31.415,43–31.731,17 t), terlepas dari skor total.
- **Validator aset:** manifest diperluas dengan `maxExtentMeters`, `lengthAxis`, `baselineOrigin`; angka rentang ukuran model (mis. lambung 100–300 m) adalah taksiran. Ukuran tekstur belum diperiksa; model diperiksa dari JSON glTF saja.

### 5. Kendala
- Tidak ada GLB sungguhan di repo; tes memakai GLB sintetis (JSON saja). Loader belum tersambung ke Player karena Player belum ada.

### 6. Status
- #7, #4, #5, #6, #2 punya PR (#27–#31). #10, #9, #11, #26 selesai lokal, belum di-push.
- Menunggu: #3 (uji perangkat oleh pengguna), lalu #8.

---

## Sesi 4 — 2026-11-20, dicatat sesudah #12 (WIB)

**Konteks:** pengguna meminta "lakukan semua langkah berikutnya": push dan PR fase 1, #3, dan fase 2.

### 1. PR fase 1
- Dibuka #33 (#10), #34 (#9), #35 (#11), #36 (#26); log (PR #32) ter-update. Rantai merge: #28 → #29 → #30 → #33 → #34 → #35 → #36 → #37.

### 2. #3 tidak dikerjakan
- Gerbang uji fps dan keterbacaan butuh pengguna dengan Quest 2/3, laptop kantor, dan dua pembaca independen. Tidak dapat dilakukan agen; tetap `ready-for-human`.

### 3. #12 Player tracer (branch `issue-12-player-tracer`, commit `66bf60e`, PR #37)
- `apps/web`: Next.js, briefing → lembar kerja → serahkan → skor. Skor dari survey-engine; format angka Indonesia; penanda "belum divalidasi SME".
- Diuji di Chrome: alur penuh menghasilkan Lulus 100/100.
- **Kebocoran kunci ditemukan dan diperbaiki:** `validasi.catatan` SKN-01 memuat "31.573,30" dan tampil ke peserta. Dihapus dari data; tes regresi menolak angka kunci di teks yang tampil.
- **Bug state:** klik beruntun saling menimpa karena `setForm` memakai state basi; diganti pembaruan fungsional.
- Keterbatasan: input manual (belum ada pengukuran 3D), tanpa mode latihan/ujian, tanpa penyimpanan sesi.

### 4. Fase 2 dihentikan di sini
- #13–#20 (Player 3D) bergantung pada stack R3F yang baru dinyatakan layak oleh #3 (spec: "Hanya bagian yang terbukti dipindahkan"). Tidak dimulai.
- Yang tidak bergantung pada 3D dan bisa dilanjutkan: #21 (mode latihan/ujian), #22 (sesi lokal dan ekspor).
- #8 (aset visual) juga menunggu #3.

---

## Sesi 5 — 2026-11-20, dicatat sesudah persiapan #3 (WIB)

**Konteks:** pengguna meminta "siapkan pengujian langkah #3". #3 sendiri tidak ditutup: uji dilakukan manusia di perangkat.

### 1. Yang disiapkan (branch `issue-3-persiapan-uji-gerbang`, PR #38, base `issue-2`)
- **Mode uji buta** di prototipe (`?uji=1`): sarat sebenarnya diacak per percobaan dan disembunyikan; tombol di dalam dunia untuk headset; hasil tersimpan di localStorage dan diunduh sebagai JSON.
- **Perekam fps** 30 detik: rata-rata, 1% low, minimum; flag apakah direkam di dalam sesi VR.
- **`npm run analyze`**: menggabungkan berkas hasil, mencetak laporan Markdown, kode keluar 0/1.
- **`npm run dev:https`** untuk WebXR di Quest lewat jaringan.
- **Protokol** `docs/tests/uji-gerbang-3.md`: peralatan, prosedur per perangkat, skrip pembaca, langkah bila gagal, templat laporan, daftar periksa.
- 16 test untuk logika penilaian (`src/uji.ts`).

### 2. Temuan
- **`vite --https` tidak dikenal di Vite 8**; ketahuan karena perintahnya dicoba, bukan diasumsikan. Diganti file konfigurasi terpisah, dan kini terbukti HTTPS 200.
- **Resolusi pointer:** di desktop (1568 px, perahu 8 m) 1 piksel ≈ 0,9 cm pada zoom awal, jadi ±1 cm menuntut zoom. Klik di garis air pada air tenang memberi bacaan 10,58 m untuk sarat sebenarnya 10,57 m. Di VR belum ada zoom; protokol menyebut ukuran tanda ×1,5/×2 dan jarak perahu 6 m sebagai penyesuaian pertama.
- **Browser uji hanya 1 fps** (tanpa GPU), jadi tidak ada angka fps nyata dari sesi pengembangan.

### 3. Tafsiran yang perlu dikonfirmasi pengguna
fps = rata-rata 30 s dan rekaman terburuk menentukan; Quest dihitung hanya di dalam VR; "dua orang" = ≥ 2 pembaca × ≥ 5 percobaan dengan semua percobaan dalam ±1 cm; parameter uji = ombak SKN-01 (0,15 m / 5 s), tanda ×1.

### 4. Status
- #3 tetap `ready-for-human`. Menunggu: Quest 3, Quest 2, laptop kantor standar, dua pembaca independen.

---

## Sesi 6 — 2026-11-20, serah-terima (WIB)

- Pengguna menjalankan uji #3 dan menyatakan "#3 OK" **tanpa menyerahkan data**; tercatat sebagai pernyataan pengguna, bukan hasil terverifikasi agen. Issue #3 belum ditutup dan belum diberi hasil.
- `npm run dev:https` dijalankan atas permintaan (HTTPS 200, alamat Wi-Fi tersedia), lalu dihentikan.
- #13 + #14 dimulai di `issue-13-14-player-baca-sarat` (di atas `issue-12`); baru dependensi three dan R3F (WIP, di-push). Rancangan lengkap di `docs/HANDOFF.md`.
- Atas permintaan "push ke main, catat progress agar bisa dilanjutkan di perangkat lain": `docs/HANDOFF.md` di-push ke `main` (`5aa9bdf`). Hanya dokumen; PR berkode belum di-merge.
