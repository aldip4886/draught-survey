# Draught Survey VR — panduan agen

Platform simulasi WebXR untuk pelatihan draught survey bagi pegawai Bea Cukai. Baca `docs/02-prd/prd-platform-simulasi-draught-survey.md` sebelum mengubah arsitektur, dan `docs/01-kerangka-materi/kerangka-materi-dan-learning-path-vr.md` sebelum menyentuh rumus atau skenario.

## Aturan inti

- **Rumus hanya di `packages/survey-engine`.** Player, Portal Trainer, dan penilaian memanggil paket ini; jangan menyalin rumus ke tempat lain.
- **Contoh rujukan wajib lolos.** Lampiran L1 kerangka materi (muatan 31.573,30 t) adalah test fixture. Hasil mesin hitung harus cocok hingga 0,01 t.
- **Skenario adalah data.** Skenario baru ditambahkan sebagai file di `content/scenarios/` yang lolos `packages/scenario-schema`, bukan sebagai kode.
- **Bahasa.** UI dan konten dalam Bahasa Indonesia. Istilah teknis maritim (trim, list, TPC, LCF, MTC, deductibles, constant) tetap dalam bahasa Inggris.
- **Angka desimal.** Kode memakai titik desimal; tampilan untuk pengguna memakai format Indonesia (koma desimal, titik ribuan).
- **Kerahasiaan.** Katalog modus manipulasi bersifat internal. Jangan menaruh konten ini di aset publik, demo publik, atau log.

## Glosarium

Lihat Lampiran L3 kerangka materi.

## Agent skills

### Issue tracker

Issue dan spec dicatat di GitHub Issues repo aldip4886/draught-survey (lewat `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Lima label bawaan: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: satu `GLOSSARY.md` + `docs/adr/` di root repo. See `docs/agents/domain.md`.
