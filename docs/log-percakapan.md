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
