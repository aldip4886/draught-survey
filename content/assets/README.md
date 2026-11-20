# Aset visual

Aset buatan-sendiri (prosedural, low-poly) dapat diganti dengan aset lain tanpa mengubah kode Player. Player membaca `manifest.json`, bukan nama berkas.

## Cara mengganti satu aset

1. Taruh berkas GLB di `content/assets/models/` (tekstur di `textures/`, panorama di `panoramas/`).
2. Isi `file` pada entri yang bersangkutan di `manifest.json` (mis. `"file": "models/ship-hull.glb"`), dan perbarui `license`.
3. Jalankan `npm run validate` di `packages/asset-contract`. Ia gagal bila kontrak di bawah dilanggar.
4. `file: null` mengembalikan aset buatan-sendiri.

Aset boleh diganti satu per satu; yang lain tetap memakai aset bawaan.

## Kontrak model

- Format glTF 2.0 biner (`.glb`). Satuan meter, sumbu atas +Y, haluan ke -Z.
- Origin lambung ada di garis dasar (baseline) pada keel, titik tengah (midship). Pembacaan sarat bergantung pada ini: tinggi tanda sarat dan garis air dihitung dari baseline.
- **Titik jangkar.** Interaksi Player (teleport, sounding, kursi pandang, tali sampler) menempel pada node kosong bernama `anchor_*` yang tercantum di `anchors` pada manifest. Aset pengganti wajib memuat node dengan nama itu di posisi yang masuk akal. Geometri di sekitarnya bebas.
- **Tanda sarat tidak dibawa model.** Angka dan garis tanda sarat digambar Player dari data template kapal dan skenario pada ketinggian yang benar, lalu ditempel ke lambung. Model pengganti tidak perlu memuat tanda sarat, tetapi permukaan lambung di enam titik harus cukup datar dan terbuka agar tanda terbaca.
- Anggaran poligon per aset ada di `polyBudget`. Tekstur dikompres (KTX2 atau WebP), maksimum 2048 px untuk lambung dan 1024 px untuk lainnya.
- Lisensi wajib dicatat. Tanpa aset berbayar tanpa izin redistribusi; CC0 atau buatan sendiri diutamakan.

## Perilaku Player

- `file: null` atau berkas gagal dimuat: pakai aset bawaan dan tulis peringatan di konsol. Sesi tidak gagal.
- Jangkar wajib hilang: validator gagal (di CI dan lokal); di runtime Player pakai aset bawaan untuk model itu.
- Tidak ada konten katalog modus manipulasi di aset publik.

## Manifest: bidang validasi

Selain `file`, `anchors`, `polyBudget`, dan `license`, tiap model dapat memuat:

- `maxExtentMeters: [min, maks]`: rentang sisi terpanjang model dalam meter. Menangkap model yang diekspor dalam cm atau inci.
- `lengthAxis`: sumbu tempat sisi terpanjang harus berada (`"z"` untuk kapal dan perahu, karena haluan ke −Z). Menangkap orientasi yang salah.
- `baselineOrigin`: sisi bawah model harus di y = 0 (lambung).

Skala node akar pada GLB diperhitungkan, jadi model cm yang diskalakan 0,01 lolos. Batas validator: hanya membaca JSON glTF (nama node, jumlah segitiga, kotak batas dari POSITION); animasi dan skin diabaikan, dan ukuran tekstur belum diperiksa.
