# Skenario

Satu file JSON per skenario, divalidasi oleh `packages/scenario-schema`. Rancangan awal: SKN-01, SKN-02, SKN-03 (PRD bagian 8).

## Menambah skenario

Taruh berkas `skn-NN.json` di folder ini. Tes di `packages/scenario-schema/test/scenarios.test.ts` memvalidasi semua berkas `*.json` di sini, jadi skenario baru tidak butuh perubahan kode.

## Isi

- `validasi.smeValidated` wajib ada. `false` berarti data sintetis belum divalidasi SME.
- Nilai benar (sarat per titik, densitas, sounding per tangki) hanya ada di berkas ini (spec Player MVP, "Sumber kebenaran").
- Nilai dilaporkan dan anomali belum ada di skema; ditambahkan saat SKN-02.

## SKN-01

Data sintetis: tabel hidrostatik linear 9,0–12,0 m, tabel kalibrasi tangki, dan sounding yang menghasilkan deductibles 1.480,00 t. Dengan bacaan benar, mesin hitung menghasilkan muatan 31.573,30 t (contoh L1).
