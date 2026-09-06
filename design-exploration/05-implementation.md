# Implementasi arah B

Arah B diterapkan ke aplikasi setelah eksplorasi disetujui. Dokumen 00–04 dan mockup tetap menjadi catatan tahap eksplorasi.

## Perubahan

- Profil menjadi kolom kiri pada desktop dan kembali di atas karya pada mobile.
- Proyek pinned pertama menjadi karya utama; bila tidak ada pinned, proyek pertama memperoleh ruang utama tanpa diberi klaim “Featured project”. Proyek lainnya mengikuti urutan CMS dalam grid responsif.
- Identitas penulis tidak lagi diulang pada setiap kartu. Tipografi, kontras teks sekunder, target sentuh, dan ilustrasi disesuaikan dengan arah B.
- Tulisan terbaru tampil di bawah proyek hanya jika kategori Writing diaktifkan. Label demo mengikuti data CMS.
- Kategori kosong memiliki penjelasan. Tautan kembali ke proyek hanya muncul jika bagian proyek terlihat dan berisi konten.
- Copy baru tersedia otomatis pada bagian Interface text di CMS melalui `defaultWords`; tidak membutuhkan migrasi database.
- Detail mempertahankan route `/post/$slug`, Markdown, repositori, dan demo asli. Kontak memakai kanal yang tersedia dan CV memakai media PDF terbit.
- Dialog mempertahankan Escape dan mengembalikan fokus ke pembukanya. Klik pada ruang di dalam dialog tidak dianggap klik backdrop.
- Pratinjau draft memakai komponen publik yang sama. Tidak menambahkan proyek contoh ke database.
- Token kontras baru dibatasi pada `.public-site`; token CMS admin tetap sama.

## File aplikasi

- `src/components/public-view.tsx`: susunan profil/karya, media, kategori, tulisan terbaru, dan dialog.
- `src/styles.css`: layout B, tipografi, ilustrasi, responsive, dan light/dark.
- `src/lib/default-words.ts`: copy default yang dapat diedit dari CMS.
- `tests/public-view.test.ts`: regresi rendering untuk konten tunggal, urutan pinned, visibilitas bagian, tulisan terbaru, dan copy/aksi opsional.

## Validasi

- `npm run typecheck`: lulus.
- `npm run test`: 33 test lulus. Test Miniflare dijalankan di luar sandbox karena memerlukan port lokal.
- `npm run build`: lulus. Build tetap memberi peringatan ukuran chunk editor admin di atas 500 kB.
- Prettier pada file yang berubah dan `git diff --check`: lulus.
- Browser: 320, 390, 768, 1024, 1440 px dalam light/dark; tanpa overflow horizontal, gambar rusak, atau target kontrol publik di bawah 44 × 44 px pada halaman utama yang diperiksa.
- Browser: navigasi detail dan kategori, native dialog, fokus setelah Escape, PDF/CV, serta preview draft desktop/mobile berfungsi.
- Stress test browser memakai respons preview sementara berisi empat proyek, cover image, judul/nama panjang, dan tag tanpa spasi; tidak mengubah D1. Semua lima ukuran layar tetap tanpa overflow horizontal.
- Halaman admin tetap dapat dibuka; token muted terang tetap `#727983`.

Screenshot aplikasi setelah implementasi:

- [Desktop terang](screenshots/implemented-b-desktop-light.png)
- [Desktop gelap](screenshots/implemented-b-desktop-dark.png)
- [Mobile terang](screenshots/implemented-b-mobile-light.png)
- [Mobile gelap](screenshots/implemented-b-mobile-dark.png)

Screenshot memakai konten terbit lokal asli. Karena baru satu proyek yang terbit, grid proyek tambahan belum muncul pada halaman aktual.
