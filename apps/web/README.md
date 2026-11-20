# apps/web

Aplikasi Next.js (App Router): Player, kelak Portal Trainer, Dashboard kelas, dan Admin (PRD bagian 3 dan 5).

## Player tracer (#12)

Irisan tipis tanpa 3D: briefing → lembar kerja (input manual) → serahkan → skor per kriteria dan status lulus.

```
npm install
npm run dev      # http://localhost:3000
npm test         # format Indonesia dan lembar kerja → penilaian
```

- Skenario dibaca dari `content/scenarios/*.json` dan divalidasi `packages/scenario-schema`. Skenario baru = berkas baru, tanpa perubahan kode.
- Penilaian hanya di `packages/survey-engine`; Player tidak punya rumus atau nilai benar.
- Angka ditampilkan dengan format Indonesia (koma desimal, titik ribuan); input menerima "10,12", "31.573,30", atau titik desimal polos.
- Penanda "belum divalidasi SME" tampil bila skenario bertanda demikian.
- Nilai benar ikut terkirim ke klien (risiko MVP yang diterima, ADR 0001). Teks yang tampil ke peserta tidak boleh memuat angka kunci; ada tes untuk itu.

Belum ada: 3D, mode latihan/ujian, penyimpanan sesi (tiket berikutnya).
