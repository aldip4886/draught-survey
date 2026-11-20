# Spec: Player MVP, Skenario SKN-01 (browser-first)

Label triage: `ready-for-agent`. Diterbitkan sebagai https://github.com/aldip4886/draught-survey/issues/1.

## Problem Statement

Pegawai Bea Cukai jarang berkesempatan berlatih draught survey di kapal sungguhan, sehingga cenderung menerima hasil akhir laporan surveyor tanpa menguji komponennya. Mereka butuh cara berlatih membaca sarat, mengambil sampel densitas, menyounding tangki, dan menghitung muatan, tanpa harus memiliki headset VR atau memasang aplikasi. Saat ini belum ada kode sama sekali; yang ada hanya dokumen desain.

## Solution

Sebuah Player yang bisa dibuka lewat tautan di peramban desktop dan menjalankan SKN-01 (Final Survey Pertama) sampai peserta lulus, tanpa headset. Di ponsel, peserta memakai panorama 360° dan lembar kerja. Di headset WebXR, peserta mendapat pengalaman imersif yang isi dan penilaiannya sama. Prototipe pembacaan sarat di laut berombak dikerjakan lebih dulu untuk membuktikan fps dan keterbacaan sebelum Player dibangun penuh.

## User Stories

1. Sebagai peserta, saya ingin membuka skenario lewat tautan di peramban tanpa memasang aplikasi, agar saya bisa berlatih dengan perangkat kantor.
2. Sebagai peserta, saya ingin menyelesaikan SKN-01 sampai lulus tanpa headset, agar keterbatasan perangkat tidak menghalangi pelatihan.
3. Sebagai peserta, saya ingin membaca briefing singkat sebelum mulai, agar saya tahu kapal, kondisi, dan tugas saya.
4. Sebagai peserta, saya ingin berada di perahu di samping lambung kapal, agar saya dapat membaca tanda sarat seperti di lapangan.
5. Sebagai peserta, saya ingin melihat ombak dan swell yang diatur skenario, agar saya berlatih membaca sarat pada permukaan yang bergerak.
6. Sebagai peserta, saya ingin mengarahkan pointer ke tanda sarat di lambung dan mengunci bacaan, agar saya tidak perlu mengetik angka.
7. Sebagai peserta, saya ingin membaca enam titik sarat (haluan, tengah, buritan; kiri dan kanan), agar data saya lengkap untuk perhitungan.
8. Sebagai peserta, saya ingin mengambil nilai rata-rata puncak-lembah saat ombak, agar bacaan saya sesuai metode yang diajarkan.
9. Sebagai peserta, saya ingin memotret tanda sarat ke buku saku digital, agar bacaan saya punya bukti.
10. Sebagai peserta, saya ingin menurunkan sampler air ke tiga kedalaman, agar densitas saya mewakili kolom air.
11. Sebagai peserta, saya ingin membaca hydrometer lewat panel zoom, agar skala halus terbaca jelas.
12. Sebagai peserta, saya ingin memilih nilai bacaan dengan slider lalu mengunci, agar prosesnya sama di semua perangkat.
13. Sebagai peserta, saya ingin menyounding tangki dari enam kelompok (ballast, air tawar, HFO, MDO, pelumas, lainnya), agar deductibles saya terukur sendiri.
14. Sebagai peserta, saya ingin mengukur suhu bahan bakar dengan termometer, agar koreksi volume benar.
15. Sebagai peserta, saya ingin mencari volume di tabel kalibrasi tangki di lembar kerja, agar saya paham hubungan sounding dan volume.
16. Sebagai peserta, saya ingin berpindah ke dek lewat teleport atau klik, agar saya dapat mencapai tangki tanpa animasi naik kapal.
17. Sebagai peserta, saya ingin lembar kerja yang memuat semua bacaan saya, agar saya dapat menghitung muatan langkah demi langkah.
18. Sebagai peserta, saya ingin umpan balik per langkah pada mode latihan, agar saya tahu letak kesalahan saya.
19. Sebagai peserta, saya ingin mode ujian tanpa umpan balik, agar hasil saya mencerminkan kemampuan sendiri.
20. Sebagai peserta, saya ingin menyerahkan hasil dan melihat skor per kriteria rubrik, agar saya tahu bagian yang perlu diperbaiki.
21. Sebagai peserta, saya ingin melihat apakah muatan saya masuk rentang lulus ±0,5%, agar saya tahu lulus atau belum.
22. Sebagai peserta ponsel, saya ingin panorama 360° untuk membaca sarat dan alat, agar saya tetap bisa berlatih tanpa komputer.
23. Sebagai peserta ponsel, saya ingin lembar kerja yang nyaman di layar kecil, agar perhitungan tidak melelahkan.
24. Sebagai peserta VR, saya ingin teleport dan snap-turn sebagai default, agar saya tidak mabuk gerak.
25. Sebagai peserta VR, saya ingin gerak perahu bisa dikurangi, agar saya rentan mabuk gerak tetap bisa memakai headset.
26. Sebagai peserta VR, saya ingin panel lembar kerja di dalam headset, agar saya tidak perlu melepasnya.
27. Sebagai peserta, saya ingin angka dan tanggal tampil dengan koma desimal dan titik ribuan, agar sesuai kebiasaan Indonesia.
28. Sebagai peserta, saya ingin sesi saya tersimpan di perangkat dan bisa dilanjutkan setelah tab ditutup, agar kerja saya tidak hilang.
29. Sebagai peserta, saya ingin mengekspor hasil sesi ke berkas, agar saya dapat menyerahkannya kepada trainer.
30. Sebagai trainer, saya ingin berkas hasil peserta berversi, agar format lama tetap bisa dibaca setelah pembaruan.
31. Sebagai trainer, saya ingin skenario didefinisikan sebagai data, agar skenario baru tidak memerlukan perubahan kode Player.
32. Sebagai trainer, saya ingin nilai sebenarnya di skenario menjadi kunci jawaban, agar penilaian tidak tertanam di kode.
33. Sebagai reviewer SME, saya ingin data sintetis SKN-01 ditandai "belum divalidasi", agar tidak dianggap data kapal resmi.
34. Sebagai developer, saya ingin mesin hitung cocok dengan contoh rujukan L1 hingga 0,01 t, agar kunci jawaban dapat dipercaya.
35. Sebagai developer, saya ingin satu tes peramban yang memainkan alur penuh SKN-01, agar regresi di jalur tanpa headset terdeteksi.
36. Sebagai developer, saya ingin prototipe pembacaan sarat berdiri sendiri, agar risiko fps dan keterbacaan terjawab sebelum investasi besar.
37. Sebagai pengelola, saya ingin skenario memuat nilai benar yang bisa dibaca di klien dicatat sebagai risiko yang diterima, agar penutupan di V1 tidak terlupa.
38. Sebagai peserta, saya ingin tampilan tetap terbaca di laptop kantor standar dengan ≥50 fps, agar simulasi tidak tersendat.

## Implementation Decisions

- **Urutan kerja.** Prototipe pembacaan sarat (modul M3) dikerjakan dulu sebagai aplikasi Vite + React Three Fiber yang berdiri sendiri, tanpa Next.js dan tanpa monorepo. Monorepo dan Player dibangun setelah prototipe lulus. Hanya bagian yang terbukti dipindahkan.
- **Kriteria lulus prototipe.** ≥72 fps di Quest 3 dan di Quest 2 (batas bawah), ≥50 fps di peramban desktop, dan dua orang yang tidak terlibat membaca sarat dari tampilan dengan selisih ≤1 cm dari nilai sebenarnya pada ombak SKN-01. Jika gagal, ukuran tanda sarat dan amplitudo ombak diubah dulu sebelum stack dinyatakan gagal.
- **Akses.** Setiap skenario harus bisa diselesaikan sampai lulus di peramban tanpa headset. Desktop memakai 3D penuh; ponsel hanya panorama 360° dan lembar kerja; VR melalui WebXR sebagai pelengkap yang isi dan penilaiannya identik.
- **Alur MVP SKN-01.** Layar briefing → di perahu, baca enam titik sarat → sampling densitas → sounding enam kelompok tangki di dek → lembar kerja → serahkan. Naik kapal dan orientasi (M0–M2) ditunda ke V1.
- **Ombak.** Permukaan air memakai gelombang sinus bertumpuk dengan amplitudo dan periode dari skenario, tanpa simulasi fisika dan tanpa refleksi real-time. Perahu dan kapal bergerak mengikuti fungsi gelombang yang sama. Fungsi gelombang deterministik dan dapat dihitung ulang oleh mesin hitung untuk menentukan nilai puncak-lembah yang dianggap benar.
- **Pola interaksi tunggal.** Sarat: pointer ke tanda di lambung lalu kunci. Hydrometer, sounding, dan termometer: panel zoom 2D, pilih nilai dengan slider lalu kunci. Tidak ada input mengetik di headset. Di desktop pakai klik, di ponsel ketuk pada panorama.
- **Sumber kebenaran.** Nilai benar (sarat per titik, densitas, sounding per tangki) disimpan di berkas skenario. Player hanya merender dan mencatat bacaan. Tidak ada nilai benar yang tertanam di kode Player.
- **Penilaian.** Penilaian hanya di mesin hitung dan memakai rubrik SKN-01 (sarat 25, densitas 15, sounding 20, urutan dan tanda koreksi 25, hasil akhir 15) dengan toleransi sarat ±1 cm, densitas ±0,0005, dan deductibles ±0,5%. Mode latihan dan ujian memakai hasil yang sama; perbedaannya hanya apakah Player menampilkan umpan balik per langkah.
- **Data SKN-01.** Data sintetis, disusun agar menghasilkan tepat angka contoh rujukan L1, termasuk ombak, tabel kalibrasi tangki, sounding per tangki, dan tabel hidrostatik penuh. Ditandai "belum divalidasi SME" sampai reviewer ada.
- **Aset.** Model kapal low-poly buatan sendiri; hanya tanda sarat dan lokasi tangki yang detail.
- **Penyimpanan sesi.** MVP menyimpan sesi (bacaan, foto buku saku, catatan, hasil) di perangkat peserta dan menyediakan ekspor berkas hasil berversi. Server dan lanjut sesi lintas perangkat ada di V1.
- **Format angka.** Kode memakai titik desimal; tampilan memakai koma desimal dan titik ribuan.
- **Kerahasiaan.** SKN-01 tanpa anomali, jadi tidak ada konten katalog modus di aset publik. Nilai benar terbaca dari berkas skenario di klien adalah risiko yang diterima untuk MVP; penilaian di server menutupnya di V1 dan perlu dicatat sebagai ADR.

## Testing Decisions

- Tes yang baik hanya memeriksa perilaku yang terlihat dari luar (hasil hitung, skor, hasil akhir di layar), bukan detail internal seperti struktur state atau urutan pemanggilan fungsi.
- **Seam 1: mesin hitung (bacaan dan data skenario → hasil dan skor rubrik).** Data SKN-01 dengan bacaan benar harus menghasilkan muatan 31.573,30 t (±0,01 t). Bacaan di luar toleransi harus menurunkan skor sesuai rubrik. Setiap rumus Bagian A punya unit test.
- **Seam 2: Player di peramban desktop (Playwright).** Berkas skenario SKN-01 harus lolos validasi skema. Satu tes memainkan alur penuh dengan input yang dipalsukan dari briefing sampai hasil lulus.
- Fps, keterbacaan tanda sarat, ponsel, dan VR diuji manual di perangkat; Immersive Web Emulator hanya menangkap kerusakan fungsional.
- Prior art: belum ada kode di repo; contoh rujukan L1 di kerangka materi menjadi test fixture pertama.

## Out of Scope

- Naik kapal, orientasi, dan modul M0–M2.
- SKN-02 dan SKN-03, dialog NPC, dokumen kapal dan pabean, berita acara, dan anomali.
- Portal Trainer, Dashboard, Admin, SSO, server, basis data, dan lanjut sesi lintas perangkat.
- Mode offline, multiuser, dan replay.
- Penilaian di sisi server dan perlindungan nilai benar dari pembacaan di klien.
- Model kapal fotorealistik atau aset berbayar.

## Further Notes

- PRD §3.2 dan §3.3 menaruh kelas, hasil peserta, dan SSO di MVP (D-01, D-02, A-01), yang bertentangan dengan keputusan penyimpanan lokal di spec ini. Perlu dirapikan di PRD.
- Hosting, jenis dan jumlah headset, reviewer SME, dan format dokumen pabean masih terbuka (PRD §9) dan tidak menghalangi pekerjaan di spec ini.
