# Prototipe M3: pembacaan sarat di laut berombak

Aplikasi Vite + React Three Fiber yang berdiri sendiri (tanpa Next.js, tanpa monorepo) untuk membuktikan fps dan keterbacaan pembacaan sarat. Tiket #2; hasil ujinya dinilai di tiket gerbang #3.

## Menjalankan

```
npm install
npm run dev        # http://localhost:5173, juga terbuka di jaringan lokal (--host)
npm run build
```

Di Quest: buka alamat jaringan lokal dari peramban headset (WebXR butuh HTTPS atau `localhost`; untuk uji di headset pakai `adb reverse tcp:5173 tcp:5173` atau terowongan HTTPS), lalu tekan "Masuk VR".

## Kontrol

- Seret mouse: menengok dari perahu. Roda mouse: zoom (sempitkan FOV).
- Klik tanda sarat di lambung: mengunci bacaan. Garis merah dan selisih dari nilai sebenarnya muncul.
- Slider di kiri atas mengubah amplitudo, periode, ukuran tanda, sarat sebenarnya, dan jarak perahu tanpa build ulang.
- Query string untuk headset (tanpa slider): `?amp=0.6&period=6&scale=1.5&draught=10.33&dist=8`.
- Di VR: arahkan pointer controller ke tanda lalu tekan trigger. Papan teks 3D di samping perahu menampilkan fps dan hasil kunci.

## Yang dibuktikan

- Air (GLSL) dan gerak perahu/kapal (JS) memakai fungsi gelombang yang sama (`src/wave.ts`, konstanta cermin di `src/Water.tsx`): dua sinus bertumpuk (ombak + swell, air dalam).
- Perahu mengikuti permukaan air penuh; kapal bergerak teredam (heave, roll, pitch).
- Angka tanda sarat tingginya 10 cm (diskalakan slider), sisi bawah angka tepat di nilai sarat.

## Belum diuji

- fps di perangkat nyata (Quest 2/3, desktop acuan). Lingkungan pengembangan tidak punya GPU, jadi angka fps di sini tidak bermakna.
- Keterbacaan oleh pembaca yang tidak terlibat (kriteria ±1 cm).
- Jalan di peramban Quest lewat WebXR: `XROrigin` di dalam perahu yang bergerak dan pointer controller belum dicoba di headset.

Papan teks 3D memakai font bawaan drei yang diambil dari CDN saat dijalankan, jadi butuh internet.
