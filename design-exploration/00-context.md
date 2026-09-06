# Konteks produk

Eksplorasi 6 September 2026, berdasarkan codebase dan aplikasi lokal, tanpa mengubah kode aplikasi atau konten CMS.

## Produk dan pengguna

Rizki Portfolio & Personal Studio adalah portfolio pribadi berbahasa Inggris milik **Achmad Rizki Ramadhan**, dengan CMS privat untuk mengelola profil, proyek, pengalaman, tulisan, sertifikasi, media, CV, SEO, dan urutan bagian. Fokus pemilik: fullstack development, cloud & DevOps, dan AI-assisted building. Lokasi pada konten terbit: Yogyakarta, Indonesia.

Pengunjung yang diasumsikan paling penting adalah calon klien, perekrut, dan sesama pengembang. Mereka perlu memahami spesialisasi, menilai karya, lalu membuka repositori, CV, atau kontak. Persona ini merupakan inferensi dari isi profil dan aksi yang tersedia; belum didukung wawancara atau data analitik.

Pengguna kedua adalah pemilik portfolio. Alur CMS: pilih bagian → tambah/edit → save draft → preview → publish. Draft dan konten terbit terpisah. Eksplorasi tidak mencakup redesain CMS karena alur pengunjung lebih langsung memengaruhi penilaian portfolio.

## Peta halaman

| Route | Fungsi |
| --- | --- |
| `/` | Profil dan proyek; kategori utama saat masuk |
| `/projects` | Redirect 301 ke `/` |
| `/experience`, `/writing`, `/about` | Kategori portfolio dengan profil bersama |
| `/post/$slug` | Detail proyek/tulisan, body Markdown, repositori/demo bila tersedia |
| `/preview` | Pratinjau privat dari draft tersimpan |
| `/admin/*` | CMS profil, konten, media, statistik, pengaturan, trash |

Area terpilih: **profil → proyek → detail → kontak/CV**. Semua arah mengerjakan alur yang sama agar perubahan dapat dibandingkan. Kategori lain tetap bisa dibuka dalam mockup, termasuk empty state pengalaman.

## Bukti yang dibaca

- [README](../README.md): tujuan, model publikasi, platform, dan bahasa produk.
- [PublicView](../src/components/public-view.tsx): struktur profil/feed, detail, dan dialog.
- [PublicPage](../src/components/public-page.tsx), [tabs](../src/lib/tabs.ts), serta `src/routes/`: navigasi publik dan admin.
- [Styles](../src/styles.css), [theme toggle](../src/components/theme-toggle.tsx): token, breakpoint, preferensi sistem, tema tersimpan.
- [Visual](../src/components/visual.tsx): konsep Mailriz, R2 × macOS, notifikasi agent.
- [CMS schema](../src/lib/cms.ts): field yang benar-benar tersedia.
- [Default words](../src/lib/default-words.ts), [admin overview](../src/admin/overview.tsx), [admin navigation](../src/admin/nav.ts), dan `src/admin/admin.css`.
- Read-only `GET /api/public` dan render route `/` di `http://localhost:3004/`.

## Identitas dan token

DM Sans adalah font utama. Monogram `ar.` memakai titik biru keabu-abuan. Karakter desain: tenang, personal, outline lembut, ilustrasi teknis sederhana, tanpa animasi besar.

| Token | Terang | Gelap |
| --- | --- | --- |
| Background | `#f8f9fb` | `#17191c` |
| Paper | `#ffffff` | `#202327` |
| Ink | `#282d34` | `#e3e6eb` |
| Muted | `#727983` | `#9aa1ac` |
| Line | `#e9ebef` | `#34383f` |
| Soft | `#f5f6f8` | `#292d33` |
| Accent | `#4b6c9d` | `#a3bfe5` |
| Button | `#303640` | `#e1e6ed` |

Layout asli: kartu 680 px, radius 20 px, profil padding 32 px, tab kategori, feed satu kolom, dialog native. Tema mengikuti sistem, dengan pilihan manual tersimpan. A/B mempertahankan basis ini, dengan perubahan muted dan border untuk keterbacaan. C memperluas warna biru dengan alasan yang dicatat di dokumen arah.

## Konten nyata, dummy, dan batas asumsi

Konten terbit lokal memiliki **satu proyek, Mailriz**, dan tulisan contoh “Small systems, good habits.” Pengalaman belum diisi. Email/WhatsApp kosong; GitHub dan LinkedIn tersedia. Karena itu dialog kontak hanya menawarkan kedua kanal yang benar-benar ada.

Nama, handle, lokasi, avatar, bio, dan tautan publik mengikuti konten lokal. Avatar ditanam sebagai data URI di setiap HTML. Mailriz didasarkan pada ringkasan yang tersedia; tidak ditambahkan angka penggunaan, hasil bisnis, riwayat kerja, atau klaim kontribusi yang belum diketahui.

Cloud drive for macOS dan Agent relay adalah **data dummy berlabel Concept project**, diturunkan dari ilustrasi bawaan repo. Tujuannya menguji hierarki saat portfolio bertambah. Pesan inbox C sepenuhnya simulasi. CV berupa pratinjau HTML contoh; bukan salinan atau pengganti PDF resmi. Tulisan contoh menggunakan body yang sudah terbit lokal.

Perbandingan baseline dan mockup tidak memiliki jumlah proyek yang sama. Jangan menganggap tambahan konten sebagai manfaat redesign. Untuk user testing terkontrol, samakan set konten menjadi Mailriz saja atau tiga proyek yang telah diverifikasi.

## Artifact dan pembatasan

Tiga HTML mandiri memiliki CSS/JS inline. Satu-satunya permintaan eksternal saat membuka mockup adalah Google Fonts; font sistem menjadi fallback offline. Tautan GitHub/LinkedIn dibuka hanya melalui aksi pengunjung. `index.html` menggunakan screenshot relatif dan iframe lokal; pertahankan struktur folder saat membagikannya.

Detail proyek dan kategori disimulasikan di halaman yang sama untuk memudahkan peninjauan. Implementasi aplikasi perlu mempertahankan URL publik, browser Back, SEO, dan rendering server yang sudah ada. Tidak ada integrasi CMS atau publikasi baru dalam hasil ini.
