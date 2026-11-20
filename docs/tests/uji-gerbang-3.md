# Protokol uji gerbang prototipe (issue #3)

Menjawab satu pertanyaan: apakah stack Vite + React Three Fiber cukup untuk membaca sarat di laut berombak? Hasilnya menentukan apakah Player 3D (#13–#20), aset visual (#8), dan WebXR (#25) boleh dibangun di atas stack ini.

## Kriteria lulus (dari issue #3)

| Kriteria | Ambang |
|---|---|
| fps Quest 3 | ≥ 72 |
| fps Quest 2 (batas bawah) | ≥ 72 |
| fps peramban desktop, laptop kantor standar | ≥ 50 |
| Pembacaan sarat oleh dua orang yang tidak terlibat | selisih ≤ 1 cm dari nilai sebenarnya, ombak SKN-01 |

Jika gagal: ubah ukuran tanda sarat dan amplitudo ombak **dulu**, ulangi uji, baru nyatakan stack gagal.

### Tafsiran yang dipakai alat analisis (mohon dikonfirmasi)

Issue tidak merinci hal-hal ini. Alat analisis memakai tafsiran berikut; ubah `src/uji.ts` bila Anda tidak setuju.

1. **fps** = rata-rata selama rekaman 30 detik. Rekaman terburuk menentukan; 1% low dan minimum dilaporkan sebagai pelengkap, bukan syarat.
2. **Quest** hanya dihitung bila direkam di dalam sesi VR.
3. **Dua pembaca** = minimal dua kode pembaca, masing-masing ≥ 5 percobaan, dan **semua** percobaan dalam ±1 cm (bukan rata-rata).
4. **Parameter bawaan mode uji** = ombak SKN-01 (amplitudo 0,15 m, periode 5 s), tanda sarat ×1. Ini sama dengan data `content/scenarios/skn-01.json`.

## Peralatan

- Quest 3 dan Quest 2, keduanya terisi baterai dan terhubung ke Wi-Fi yang sama dengan laptop penyaji.
- Laptop kantor standar (catat: model, CPU, ada/tidaknya GPU terpisah, Chrome atau Edge). Pakai laptop yang memang dipakai pegawai, bukan mesin pengembang.
- Dua pembaca yang tidak ikut membuat prototipe dan belum pernah melihat nilai sebenarnya. Pembaca yang sama boleh dipakai di perangkat berbeda, tetapi satu pembaca tidak boleh sekaligus menjadi fasilitator.
- Satu fasilitator yang mengoperasikan, mencatat, dan **tidak membantu** pembaca membaca.

## Persiapan (fasilitator)

```
cd prototypes/m3-draft-reading
npm install
npm run dev:https        # https://<ip-laptop>:5173, sertifikat self-signed
```

- **Desktop:** buka `http://localhost:5173/?uji=1`.
- **Quest:** WebXR butuh konteks aman. Dua jalan:
  - HTTPS: buka `https://<ip-laptop>:5173/?uji=1` di peramban Quest, lanjutkan melewati peringatan sertifikat.
  - USB: `adb reverse tcp:5173 tcp:5173`, lalu buka `http://localhost:5173/?uji=1` di peramban Quest.
- Tutup tab lain di Quest. Pastikan peramban Quest terbaru.
- Mode uji (`?uji=1`) menyembunyikan sarat sebenarnya dan selisih. Hasil disimpan di perangkat (localStorage), jadi tetap ada setelah keluar dari VR.
- Papan teks 3D memakai font dari CDN: perangkat butuh internet.

## Prosedur per perangkat

Lakukan di Quest 3, Quest 2, dan laptop desktop.

1. Buka alamat uji. Pilih **Perangkat** yang benar di panel kiri atas (Quest 3 / Quest 2 / Desktop). Isi **Catatan perangkat**.
2. **Rekam fps (30 detik).** Di desktop tekan "Rekam fps 30 s". Di Quest masuk VR dulu ("Masuk VR"), lalu tekan tombol "Rekam fps 30 s" di papan dalam dunia. Selama 30 detik pembaca tetap melihat lambung dan tanda sarat seperti saat membaca (jangan menutup pandangan ke air). Ulangi dua kali; rekaman terburuk yang dihitung.
3. **Sesi baca.** Beri tahu pembaca skrip di bawah, lalu minta pembaca membaca lima percobaan:
   1. Isi **Kode pembaca** (R1, R2, …).
   2. Tekan "Percobaan baru" (di VR: tombol "Percobaan baru" di papan). Sarat sebenarnya diacak dan tersembunyi.
   3. Pembaca mengamati ombak, menentukan nilai **rata-rata puncak-lembah** garis air pada tanda sarat, mengarahkan pointer ke nilai itu, dan mengunci. Boleh mengunci ulang sebelum percobaan baru; yang tersimpan adalah kunci terakhir.
   4. Fasilitator **tidak** menyebut hasil. Ulangi sampai 5 percobaan per pembaca.
4. Keluar dari VR, tekan **Unduh hasil**. Beri nama berkas sesuai perangkat (mis. `hasil-quest3.json`). Di Quest, berkas ada di folder Downloads; salin lewat kabel USB atau kirim ke diri sendiri.

### Skrip untuk pembaca

> Anda berada di perahu kecil di samping lambung kapal. Di lambung ada pelat tanda sarat dengan angka dalam meter; sisi bawah tiap angka menunjukkan nilai itu. Air bergelombang, jadi garis air naik turun. Amati beberapa gelombang, perkirakan titik tengah antara puncak dan lembah garis air pada pelat, arahkan pointer ke sana, lalu kunci. Anda boleh memperbesar (roda mouse di desktop). Tidak ada waktu batas. Kami tidak akan memberi tahu seberapa tepat bacaan Anda sampai sesi selesai.

### Catatan ketelitian pointer

Di desktop dengan layar 1568 px dan jarak perahu 8 m, 1 piksel pada zoom awal ≈ 0,9 cm di pelat. Artinya ±1 cm berada di batas resolusi pointer tanpa zoom. Pembaca perlu memakai zoom (roda mouse); ini bagian dari yang diuji. Di VR belum ada zoom: bila Quest gagal di keterbacaan, uji dulu ukuran tanda sarat ×1,5 dan ×2 (`&scale=1.5`) atau jarak perahu lebih dekat (`&dist=6`).

Pemetaan klik → bacaan sudah dicek pada air tenang (`&amp=0`): klik di garis air memberi bacaan dalam 1 piksel dari sarat sebenarnya. Pemeriksaan itu di peramban tanpa GPU dan 1 fps, jadi bukan bukti fps atau keterbacaan di ombak.

## Analisis

```
cd prototypes/m3-draft-reading
npm run analyze -- hasil-quest3.json hasil-quest2.json hasil-desktop.json
```

Skrip menggabungkan semua berkas, mencetak tabel Markdown (fps per perangkat, selisih per pembaca, keputusan), dan keluar dengan kode 0 bila lolos, 1 bila tidak. Tempel keluarannya ke issue #3.

## Bila gagal

Ubah satu hal per putaran, ulangi uji perangkat yang gagal, dan catat parameter akhir.

| Gejala | Langkah, berurutan |
|---|---|
| fps rendah | kurangi amplitudo (`&amp=`), perkecil kerapatan mesh air (`Water.tsx`, 160×160), matikan antialias, turunkan `foveation` ke tingkat lebih tinggi |
| bacaan meleset | perbesar tanda sarat (`&scale=1.5`, lalu `2`), dekatkan perahu (`&dist=6`), kurangi amplitudo |
| keduanya | kembali ke tim: stack dinyatakan gagal hanya setelah dua putaran penyesuaian |

## Laporan di issue #3

Tempel keluaran `npm run analyze`, lalu tambahkan:

- Spesifikasi laptop, versi peramban Quest, tanggal uji.
- Parameter akhir: ukuran tanda sarat, amplitudo, periode, jarak perahu.
- Keputusan: **lolos** atau **gagal**, dan tindak lanjut (mis. "lanjut #8, #13", atau "ulang setelah mengubah …").

## Daftar periksa fasilitator

- [ ] `npm run dev:https` berjalan; alamat bisa dibuka dari Quest
- [ ] Perangkat dipilih benar di panel; kode pembaca terisi
- [ ] Dua rekaman fps per perangkat (Quest di dalam VR)
- [ ] ≥ 2 pembaca × ≥ 5 percobaan, buta
- [ ] Berkas hasil diunduh per perangkat dan dianalisis
- [ ] Hasil ditempel ke issue #3 dengan parameter akhir dan keputusan
