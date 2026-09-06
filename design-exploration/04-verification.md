# Pemeriksaan artifact

Dijalankan 6 September 2026 menggunakan browser Chromium melalui Playwright. Fokus pemeriksaan adalah artifact HTML; tidak menjalankan build/test aplikasi karena kode aplikasi tidak berubah.

## Hasil

| Pemeriksaan | Cakupan | Hasil |
| --- | --- | --- |
| Responsive layout | A/B/C × light/dark × 320, 390, 768, 1024, 1440 px | 30 kombinasi; tidak ada overflow horizontal dokumen |
| Gambar | Semua kombinasi di atas | Tidak ada gambar rusak; avatar data URI tampil |
| Target interaksi default | Tombol, link, summary yang terlihat, pada 30 kombinasi | Tidak ada target di bawah 44 × 44 px; skip link tersembunyi dikecualikan dari pengukuran |
| Runtime JavaScript | Render 30 kombinasi | Tidak ada `pageerror` |
| Kategori | Projects, Experience, Writing, About pada A/B/C, lebar 390 px | Panel sesuai kategori; empty state pengalaman tampil |
| Detail proyek | Mailriz pada A/B/C; ketiga pilihan pada C | Judul, isi, dan tautan repositori sesuai; detail mengikuti pilihan C terbaru |
| Kontak dan CV | A/B/C, 390 px | Kanal GitHub/LinkedIn dan CV contoh tampil |
| Dialog | Native modal, tombol tutup, Escape, fokus setelah tutup | Berfungsi; fokus kembali ke pembuka |
| Tulisan | A/B/C | Body “Small systems, good habits.” terbuka |
| Panel penjelasan | A/B/C | Bisa dibuka/ditutup |
| Tema manual | A/B/C | Pilihan bertahan setelah reload |
| Panggung C | Mailriz, Cloud drive, Agent relay | Selector dan detail berganti sesuai pilihan |
| Simulasi email C | Pesan masuk dan reset | Jumlah pesan 3 → 4 → 3; pesan baru tampil lalu hilang |
| Halaman perbandingan | Empat tab, iframe, tema, selector lebar | Berfungsi; tema iframe mengikuti kontrol pembanding; lebar mode mobile 390 px saat ruang cukup |
| Keyboard tab pembanding | ArrowLeft dari C ke B | Fokus dan pilihan berpindah bersama |
| Responsive pembanding | 320, 390, 768, 1440 px | Tanpa overflow atau thumbnail rusak |
| HTML dari disk | A/B/C dan index melalui `file://` | Berfungsi tanpa server di Chromium yang diuji |
| Google Fonts tidak tersedia | Permintaan Google Fonts sengaja diblokir pada tes dari disk | Font fallback, avatar, dialog, dan simulasi C tetap berfungsi; error jaringan yang disengaja hanya untuk font |

Satu percobaan awal tes interaksi C memilih tombol kontak header yang memang disembunyikan pada mobile. Selector tes diperbaiki agar memilih tombol yang terlihat; pengujian ulang ketiga arah lulus. Tidak memaksa klik pada elemen tersembunyi.

## Pemeriksaan visual dan kontras

Screenshot ditinjau untuk baseline desktop, A mobile, B desktop terang/gelap, C desktop/mobile, dan pembanding desktop. Revisi setelah review: hilangkan penanda skill yang tidak konsisten di B; tambahkan lebar minimum 44 px pada navigasi; gunakan favicon inline agar mockup tidak meminta aset aplikasi.

Rasio dihitung dari luminansi relatif sRGB, dibulatkan dua desimal:

| Pasangan teks/latar | Rasio |
| --- | --- |
| Asli muted `#727983` / putih | 4,39:1 |
| Asli muted / soft `#f5f6f8` | 4,06:1 |
| A/B muted `#626b77` / putih | 5,40:1 |
| A/B muted / soft `#f5f6f8` | 4,99:1 |
| A/B dark muted `#a8b0bc` / soft `#292d33` | 6,33:1 |
| A/B accent `#4b6c9d` / background `#f8f9fb` | 5,07:1 |
| C muted `#55677e` / stage `#e0ebf8` | 4,80:1 |
| C dark muted `#a9bcd3` / stage `#203b5d` | 5,86:1 |
| Status `#42684b` / putih | 6,34:1 |
| Storage illustration `#3f5945` / `#edf1eb` | 6,74:1 |

Ini pemeriksaan pasangan penting, bukan audit otomatis semua piksel/state atau klaim sertifikasi WCAG.

## Isi screenshot

- `screenshots/current-{desktop,mobile}-{light,dark}.png`: empat tangkapan asli route `/` dengan konten terbit lokal; viewport desktop 1440 × 1080 dan mobile 390 × 844. Screenshot full-page dapat lebih tinggi dari viewport.
- `screenshots/direction-{a,b,c}-{desktop,mobile}-{light,dark}.png`: dua belas tangkapan mockup setelah perbaikan.
- `screenshots/comparison-{desktop,mobile}.png`: halaman pembanding.
- `screenshots/profile-source`: JPEG avatar dari media publik lokal, sumber data URI. Tidak diperlukan saat membuka HTML yang sudah dihasilkan.
- `build-mockups.py`: generator lokal untuk ketiga HTML dari CSS, interaksi, dan avatar yang ditanam. Bukan dependensi runtime. Bila generator dijalankan ulang setelah revisi, screenshot harus ditangkap ulang agar tetap sesuai.

## Batas hasil

Belum dilakukan user testing, pemeriksaan pembaca layar menyeluruh, uji lintas browser, zoom 200% aktual, pengukuran performa produksi, atau pengujian konten CMS arbitrer. Screenshot memakai data eksplorasi, sehingga tidak membuktikan peningkatan konversi. Dialog detail pada mockup tidak menggantikan kebutuhan routing dan SEO pada implementasi aplikasi.

Pemeriksaan Git akhir memastikan hanya `design-exploration/` yang menjadi tambahan pada working tree; tidak ada perubahan tracked file aplikasi.
