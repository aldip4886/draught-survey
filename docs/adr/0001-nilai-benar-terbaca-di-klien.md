# 0001. Nilai benar terbaca di klien diterima sebagai risiko MVP

Status: diterima (2026-11-20)

## Konteks

MVP Player berjalan sepenuhnya di peramban dan menyimpan sesi di perangkat peserta (lihat `docs/specs/player-mvp-skn-01.md`). Berkas skenario, termasuk nilai benar (sarat, tangki, densitas, constant), harus dimuat ke klien agar simulasi dan umpan balik mode latihan bisa berjalan tanpa server. Akibatnya peserta yang membuka alat pengembang peramban dapat membaca nilai benar sebelum menjawab.

Tidak ada server, basis data, atau SSO di MVP, jadi penilaian tidak bisa dipindahkan keluar dari klien tanpa mengubah cakupan MVP.

## Keputusan

- Untuk MVP, nilai benar yang terbaca dari berkas skenario di klien adalah **risiko yang diterima**.
- Penilaian di sisi server menutup risiko ini di V1: nilai benar tidak lagi dikirim ke klien, dan hasil dinilai di server.
- Rumus tetap hanya ada di `packages/survey-engine`, sehingga penilaian server nanti memanggil paket yang sama.
- Skenario SKN-01 tidak memuat anomali, jadi tidak ada konten katalog modus manipulasi (internal) yang terbuka lewat risiko ini. Skenario beranomali (SKN-02, SKN-03) tidak boleh dirilis publik sebelum penilaian server aktif.

## Konsekuensi

- Hasil MVP tidak boleh dipakai sebagai penilaian resmi atau ujian berstandar tinggi; cocok untuk latihan dan uji coba terkendali.
- Ekspor hasil berversi bersifat tidak tepercaya; kelas, hasil peserta, dan SSO (D-01, D-02, A-01) dipindah ke V1 bersama server.
- Ketika V1 dikerjakan, format berkas skenario perlu dipisah menjadi bagian yang dikirim ke klien dan bagian kunci jawaban yang hanya ada di server.
