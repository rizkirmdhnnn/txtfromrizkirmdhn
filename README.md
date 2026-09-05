# Rizki Portfolio & Personal Studio

Portofolio TanStack Start dengan CMS pribadi di Cloudflare Workers, D1, R2, dan Access. Desain publik mengikuti profil Threads; dashboard mengelola profil, proyek, pengalaman, tulisan, sertifikasi, media, CV, SEO, urutan bagian, dan teks website.

## Lokal

Node.js 22.12+; implementasi diuji pada Node 24.

```sh
npm install
cp .dev.vars.example .dev.vars
# Isi CMS_ENCRYPTION_KEY dengan 32 byte acak dalam base64.
npm run cf:typegen
npm run db:migrate
npm run dev
```

Di terminal lain:

```sh
# Sesuaikan port jika Vite menggunakan 3001.
CMS_ORIGIN=http://localhost:3000 npm run db:seed
```

- Dashboard: `/admin`.
- Preview draft privat: `/preview`.
- Website publik: `/` (menampilkan halaman sementara sampai profil dipublikasikan).

`db:seed` mengimpor tujuh dokumen dan dua file demo dari `content/` serta `seed-assets/`. Impor idempotent dan tidak menimpa edit yang sudah ada. Konten baru selalu draft. File Markdown lama kini menjadi seed, bukan sumber konten runtime.

Akses otomatis lokal hanya aktif pada build development untuk hostname localhost/127.0.0.1. Build produksi selalu memerlukan JWT Cloudflare Access pada hostname admin. Jangan mengekspos dev server ke internet.

## Mengelola konten

Pilih menu → Tambah/edit → Simpan draft → Preview → Publish. Simpan tidak mengubah versi terbit. Jika konten berubah di tab lain, server menolak penyimpanan usang dan meminta muat ulang.

Editor mendukung visual dan Markdown, gambar dari media library, blok kode, kutipan, dan tautan. Impor/ekspor Markdown bekerja per bahasa. Indonesia/Inggris dikelola dalam tab; konten satu bahasa dapat diterbitkan dan ditampilkan sebagai fallback dengan penanda bahasa.

Profil & website memuat seluruh pengaturan konten global. Media library menyediakan upload gambar (10 MB) dan PDF (20 MB), alt text bilingual, serta CV Indonesia/Inggris. File yang masih dirujuk konten atau revisi tidak dapat dihapus permanen.

Riwayat revisi memulihkan snapshot sebagai draft. Sampah tidak otomatis menerbitkan konten saat dipulihkan. Pengaturan menyediakan ekspor ZIP lengkap, tanpa kredensial AI.

AI opsional: isi base URL OpenAI-compatible, model, dan API key melalui Pengaturan. Tes koneksi dan terjemahan menggunakan konfigurasi yang sudah disimpan. Hasil terjemahan harus diterapkan manual ke draft. Tidak ada permintaan AI otomatis.

## Validasi

```sh
npm run typecheck
npm run test
npm run build
npx wrangler deploy --dry-run
```

Tes integrasi menggunakan D1/R2 Miniflare terisolasi, tidak mengubah database preview/produksi. Lingkungan sandbox perlu mengizinkan proses membuka port lokal. Browser diuji untuk save/publish/unpublish, editor bilingual, preview, mobile, dan unduh file.

## Struktur

- `src/admin/`: dashboard, editor, media, AI, statistik.
- `src/server/`: autentikasi, repository D1, API, file R2, AI dan statistik.
- `src/components/public-view.tsx`: komponen publik yang juga dipakai preview.
- `src/lib/cms.ts`: skema validasi dan tipe data bersama.
- `migrations/`: skema berversi, termasuk guard penulisan konkuren.
- `wrangler.jsonc`: resource preview serta konfigurasi produksi terpisah.

API publik: `GET /api/public`, `GET|HEAD /api/media/:id`. API admin berada di `/api/admin/*`; semua memerlukan identitas pemilik dan pemeriksaan origin untuk write. Server functions publik hanya membaca snapshot published.

## Cloudflare

Domain utama dan dashboard menggunakan Worker serta database/bucket `preview` yang sama. Domain utama hanya menampilkan konten published; dashboard dilindungi Google melalui Cloudflare Access. Resource produksi terpisah belum dibuat. Langkah lengkap, secrets, statistik, migrasi produksi, serta rollback: [docs/CLOUDFLARE-SETUP.md](docs/CLOUDFLARE-SETUP.md).

Build disimpan di `dist/`. File `.dev.vars` dan output build tidak boleh masuk git; Vite dapat menyalin secrets development ke `dist/server/.dev.vars` untuk preview lokal, bukan aset publik. Jangan membagikan direktori build sebagai arsip publik.

Foto dan ringkasan proyek awal berasal dari GitHub pemilik; pengalaman, sertifikasi, tulisan, dan CV contoh tetap ditandai demo. Ganti atau tinjau sebelum publikasi.
