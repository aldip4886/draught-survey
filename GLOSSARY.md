# Draught Survey VR

Platform simulasi untuk melatih pegawai Bea Cukai menghitung berat muatan kapal curah dari pembacaan sarat, densitas, dan tangki, serta menemukan manipulasi yang tertanam di dalamnya.

## Language

### Pengukuran kapal

**Draught / sarat**:
Kedalaman lambung yang terbenam, dibaca pada tanda sarat di enam titik: haluan, tengah, dan buritan, masing-masing sisi kiri dan kanan.
_Avoid_: Kedalaman air, draft

**FP / AP**:
Garis tegak haluan (FP) dan garis tegak buritan (AP) yang menjadi acuan panjang kapal.
_Avoid_: Ujung haluan, ujung buritan

**LBP**:
Panjang kapal antara FP dan AP.
_Avoid_: Panjang kapal, LOA

**LBM**:
Jarak antara tanda sarat haluan dan tanda sarat buritan, dipakai untuk mengoreksi sarat ke garis tegak.
_Avoid_: Panjang antar tanda

**Trim**:
Selisih sarat buritan dan sarat haluan.
_Avoid_: Kemiringan memanjang

**List**:
Kemiringan kapal ke kiri atau ke kanan.
_Avoid_: Heel, kemiringan melintang

**Hogging / sagging**:
Lambung melengkung ke atas (hogging) atau ke bawah (sagging) di bagian tengah.
_Avoid_: Bengkok lambung

**Tanda sarat**:
Angka yang tercetak di lambung untuk membaca sarat.
_Avoid_: Draught mark, skala sarat

### Perhitungan

**Displacement**:
Berat total kapal, sama dengan berat air yang dipindahkannya.
_Avoid_: Bobot kapal

**Net displacement**:
Displacement setelah dikurangi deductibles; hasil ini yang dibandingkan antara survey initial dan survey final.
_Avoid_: Displacement bersih

**TPC**:
Ton per cm: tambahan berat yang menambah sarat 1 cm.
_Avoid_: Tonnes per centimetre

**LCF**:
Titik berat bidang air, diukur dari midship.
_Avoid_: Pusat apung

**MTC**:
Momen yang mengubah trim sebesar 1 cm.
_Avoid_: Momen trim

**FTC**:
Koreksi displacement akibat trim, dihitung dari TPC dan LCF.
_Avoid_: Koreksi trim pertama

**STC**:
Koreksi displacement tahap kedua akibat trim, dihitung dari selisih MTC.
_Avoid_: Koreksi trim kedua

**QM**:
Sarat rata-rata dari rata-rata tiga titik (haluan, tengah, buritan) yang sudah dikoreksi, dipakai untuk membaca tabel hidrostatik.
_Avoid_: Sarat rata-rata sederhana

**Deductibles**:
Berat non-muatan yang dikurangkan dari displacement: ballast, bahan bakar, air tawar, pelumas, dan lainnya.
_Avoid_: Pengurang, potongan

**Lightship**:
Berat kapal kosong menurut dokumen galangan.
_Avoid_: Berat kosong

**Constant**:
Berat tak teridentifikasi di kapal kosong.
_Avoid_: Konstanta kapal

**Muatan**:
Hasil akhir draught survey: selisih net displacement antara survey bermuatan dan survey kosong, dikurangi constant bila diperhitungkan.
_Avoid_: Kargo, berat barang

### Pengukuran cairan

**Sounding / ullage**:
Kedalaman cairan (sounding) atau ruang kosong di atas cairan (ullage) dalam tangki.
_Avoid_: Pengukuran tangki

**Hydrometer**:
Alat pembaca densitas air sampel.
_Avoid_: Pengukur massa jenis

**Densitas**:
Massa jenis air tempat kapal mengapung, diukur dari sampel pada beberapa kedalaman.
_Avoid_: Berat jenis

### Survey

**Survey initial**:
Draught survey sebelum muat (atau pada kapal bermuatan sebelum bongkar), sebagai titik awal.
_Avoid_: Survey awal

**Survey final**:
Draught survey sesudah muat (atau pada kapal kosong sesudah bongkar), sebagai titik akhir.
_Avoid_: Survey akhir

**Contoh rujukan**:
Perhitungan lengkap muatan 31.573,30 t pada Lampiran L1 kerangka materi, dipakai sebagai kebenaran untuk menguji mesin hitung.
_Avoid_: Contoh soal, sample

### Skenario dan penilaian

**Skenario**:
Satu latihan lengkap dengan kapal, kondisi lingkungan, data, anomali, dan rubriknya.
_Avoid_: Kasus, soal

**Nilai sebenarnya**:
Nilai yang benar-benar terjadi dan akan diukur peserta.
_Avoid_: Nilai asli, true value

**Nilai dilaporkan**:
Nilai yang disodorkan dokumen, kru, atau surveyor, yang bisa berbeda dari nilai sebenarnya.
_Avoid_: Nilai klaim

**Anomali**:
Penyimpangan yang sengaja ditanam di skenario antara nilai sebenarnya dan nilai dilaporkan, kuantitatif (berdampak dalam ton) atau kualitatif.
_Avoid_: Kesalahan, error, bug

**Modus manipulasi**:
Jenis penyimpangan dalam katalog internal yang menjadi dasar anomali.
_Avoid_: Trik, celah

**Dampak**:
Selisih muatan dalam ton akibat satu anomali, dihitung mesin hitung.
_Avoid_: Kerugian

**Rubrik**:
Kriteria penilaian skenario beserta bobot dan ambang lulus.
_Avoid_: Kunci nilai

**Mode latihan / mode ujian**:
Dua cara menjalankan skenario yang sama: latihan memberi umpan balik per langkah, ujian tidak.
_Avoid_: Mode belajar, mode tes

### Peran dan alat peserta

**Peserta**:
Pegawai yang menjalankan skenario untuk berlatih atau diuji.
_Avoid_: Siswa, user

**Trainer**:
Widyaiswara atau instruktur yang membuat skenario dan menyusun kelas.
_Avoid_: Author, pengajar

**Reviewer SME**:
Pemeriksa senior atau surveyor bersertifikat yang menyetujui skenario sebelum terbit.
_Avoid_: Validator, penguji

**Lembar kerja**:
Formulir perhitungan tempat peserta memasukkan bacaan dan langkah hitung.
_Avoid_: Kalkulator, worksheet

**Buku saku digital**:
Catatan peserta yang menyimpan bacaan, foto, dan catatan sebagai bukti.
_Avoid_: Notebook, jurnal

**Berita acara**:
Dokumen hasil temuan dan rekomendasi yang disusun peserta dari bukti yang terkumpul.
_Avoid_: Laporan akhir
