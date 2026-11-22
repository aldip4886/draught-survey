# Skill pihak ketiga: Claude Design Skillstack

22 skill berikut disalin apa adanya dari
[freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills),
folder `.claude/skills/`, commit `1da73febff0c3e1dfefc07f8a5ef8f7d1dfdb6cd` (19 Nov 2025).

- `aframe-webxr`
- `animated-component-libraries`
- `animejs`
- `babylonjs-engine`
- `barba-js`
- `blender-web-pipeline`
- `gsap-scrolltrigger`
- `lightweight-3d-effects`
- `locomotive-scroll`
- `lottie-animations`
- `modern-web-design`
- `motion-framer`
- `pixijs-2d`
- `playcanvas-engine`
- `react-spring-physics`
- `react-three-fiber`
- `rive-interactive`
- `scroll-reveal-libraries`
- `spline-interactive`
- `substance-3d-texturing`
- `threejs-webgl`
- `web3d-integration-patterns`

## Yang tidak ikut disalin

- `skill-creator`: skill umum pembuat skill, bukan skill desain, dan sudah tersedia dari sumber lain.
- Arsip `*.zip` per skill (duplikat isi folder) dan `__pycache__`.

## Pemeriksaan keamanan

Sebelum disalin, isi folder diperiksa: tidak ada hook, `settings.json`, konfigurasi MCP,
atau skrip shell. Skrip Python di `scripts/` hanya pembuat kerangka/berkas dan validator
lokal; satu-satunya pemanggilan proses adalah `npm install` di
`barba-js/scripts/project_setup.py` (pada proyek baru yang dibuatnya). Tidak ada pemanggilan
jaringan, pembacaan variabel lingkungan, atau karakter tersembunyi di berkas Markdown.
Skrip tidak dijalankan otomatis; Claude hanya menjalankannya bila diminta.

## Lisensi

Berkas `LICENSE` repo sumber adalah MIT (di bawah). Catatan: `marketplace.json` repo yang sama
mencantumkan `Apache-2.0` per plugin; keduanya lisensi permisif, dan teks MIT di bawah
disertakan untuk memenuhi syarat atribusi.

    MIT License
    
    Copyright (c) 2025 Claude Skills Project
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
