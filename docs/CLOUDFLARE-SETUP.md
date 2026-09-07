# Mengaktifkan dashboard online

Implementasi memakai Workers, D1, R2 privat, dan Cloudflare Access. Local development memiliki akses pemilik otomatis **hanya pada build development dan hostname localhost/127.0.0.1**. Build deployment tidak memiliki bypass ini.

## Resource yang aktif

- Account: `4a273df5ad27c77f3a28a6d0bbcf770f`.
- Zone: `txtfromrizkirmdhn.my.id` (`6a3ec6fd3b5c5f12fcf0978c4e3397c0`).
- **Produksi (melayani traffic sejak 5 September 2026):** Worker `rizki-portfolio`, D1 `rizki-portfolio-english` (`97df1c8a-33e8-4183-9ac9-3d19a19dc6b4`), R2 privat `rizki-portfolio-media`. D1 `rizki-portfolio` (`273db981-25ed-4464-82f3-d646fc3dc4b8`) berisi konten bilingual sebelum migrasi dan dipertahankan sebagai jalur rollback. Memegang route `txtfromrizkirmdhn.my.id/*` dan custom domain `admin.txtfromrizkirmdhn.my.id`.
- **Preview (pensiun, tanpa route):** Worker `rizki-portfolio-preview`, D1 `rizki-portfolio-preview` (`cc415328-cdcc-4cf4-8449-42f401c41ecd`), R2 `rizki-portfolio-preview-media`. Dipertahankan sebagai salinan rollback berisi data sampai cutover produksi 5 September 2026. Pengembangan sehari-hari memakai `npm run dev` dengan D1/R2 Miniflare lokal.
- Kedua Worker tidak mengaktifkan workers.dev maupun preview URLs. Record CNAME Tunnel lama pada apex dipertahankan.
- Team domain dan AUD Access terpasang pada vars produksi. Policy Access diperiksa melalui browser pada 5 September 2026 dan hanya memuat email pemilik.

## 1. Google dan Cloudflare Access

1. Buka Cloudflare One / Zero Trust pada akunmu. Jika belum ada organisasi, pilih nama team milikmu dan catat domain `<team>.cloudflareaccess.com`.
2. Di Google Cloud Console, buat OAuth consent screen bertipe External. Jika masih Testing, tambahkan `achmadrizkiramadhan0101@gmail.com` sebagai test user. Buat OAuth client bertipe **Web application**.
3. Tambahkan redirect URI `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback` dan authorized origin `https://<team>.cloudflareaccess.com` sesuai panduan resmi Cloudflare.
4. Di Cloudflare One, Integrations → Identity providers → Google, masukkan OAuth Client ID dan Client Secret melalui dashboard Cloudflare. Jangan simpan client secret di repository atau chat.
5. Buat aplikasi Access bertipe **Self-hosted** untuk seluruh hostname `admin.txtfromrizkirmdhn.my.id`, tanpa membatasi path. Pilih Google sebagai satu-satunya metode login, nonaktifkan metode lain.
6. Buat policy Allow: Include **Emails** persis `achmadrizkiramadhan0101@gmail.com`. Jangan gunakan Everyone, email domain wildcard, atau policy Bypass. Gunakan durasi sesi 8 jam.
7. Salin Application Audience (AUD). Isi `ACCESS_TEAM_DOMAIN` (hostname tanpa `https://`) dan `ACCESS_AUD` pada vars preview di `wrangler.jsonc`.
8. Custom Domain Worker `admin.txtfromrizkirmdhn.my.id` sudah aktif. Tahap berikut ini menjadi referensi untuk lingkungan baru.
9. Jalankan `npm run build` lalu `npx wrangler deploy`. Buka `https://admin.txtfromrizkirmdhn.my.id/admin`, login menggunakan akun Google pemilik, dan uji akun lain ditolak.

Backend memvalidasi tanda tangan JWT, issuer, audience, expiry, dan email pemilik; header email saja tidak cukup. Route admin ditolak pada hostname publik dan URL alternatif. Mengunjungi admin tanpa konfigurasi Access menghasilkan 503, bukan akses terbuka.

Panduan resmi: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/

## 2. Konten English-only

Aplikasi, CMS, halaman maintenance, dan konten kini seluruhnya berbahasa Inggris. Pengaturan beserta endpoint terjemahan AI sudah dihapus. `CMS_ENCRYPTION_KEY` tidak lagi dipakai; simpan secret lama hanya selama rollback ke aplikasi versi sebelumnya masih mungkin dibutuhkan. Environment baru tidak memerlukannya.

Perkakas konversi bilingual sudah tidak ada di repo ini. Kalau masih ada database yang menyimpan konten dua bahasa, ambil kembali `scripts/english-migration.ts` beserta CLI-nya dari riwayat git sebelum mengonversi — menjalankan migrasi skema saja tidak mengubah isi konten. Pengunjung dapat memakai fitur terjemahan browser masing-masing.

## 3. Statistik

Site Web Analytics `txtfromrizkirmdhn.my.id` sudah ada (site tag `0540126c3fcd437493b69ef2746c9df8`). Pada 5 September 2026 modenya diubah dari injeksi otomatis ke **Enable with JS Snippet installation**, agar beacon disuntikkan Worker sendiri dan hanya pada hostname publik — dashboard tidak ikut terlacak. Konsekuensinya opsi bawaan "excluding visitor data in the EU" tidak lagi berlaku; pengunjung EU ikut terhitung. Untuk mengembalikannya, ubah mode di dashboard dan kosongkan `ANALYTICS_BEACON_TOKEN`.

`ANALYTICS_SITE_TAG` dan `ANALYTICS_BEACON_TOKEN` sudah terisi pada vars produksi. Keduanya bukan secret: beacon token memang tampil di HTML setiap pengunjung.

Yang masih kurang adalah **`CF_ANALYTICS_TOKEN`**, dipakai server untuk membaca GraphQL. Tanpa itu dashboard menampilkan "Statistik belum dikonfigurasi" dan tidak mengarang angka.

1. Buat API token di https://dash.cloudflare.com/profile/api-tokens → Create Token → Create Custom Token.
2. Permissions: **Account → Account Analytics → Read**. Account Resources: akun `Achmadrizkiramadhan0101@gmail.com's Account`. Tidak perlu izin zone.
3. Simpan dengan `npx wrangler secret put CF_ANALYTICS_TOKEN --env production`, lalu tempel nilainya saat diminta.
4. Deploy ulang tidak diperlukan; secret langsung aktif. Buka Dashboard → Ringkasan untuk memeriksa.

### Kalau angkanya tetap nol

Beacon dimuat dari `static.cloudflareinsights.com`, host yang masuk banyak blocklist pelacak. Sebagian jaringan mengembalikan `0.0.0.0` untuk host itu lewat pencegatan DNS, sehingga kunjungan dari jaringan tersebut tidak pernah terhitung — termasuk kunjunganmu sendiri saat menguji. Membedakannya:

```sh
dig +short static.cloudflareinsights.com @1.1.1.1
curl -sS -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=static.cloudflareinsights.com&type=A'
```

DNS biasa menjawab `0.0.0.0` sementara DNS over HTTPS menjawab IP asli berarti jaringanmu yang memblokir, bukan konfigurasinya. Untuk memastikan skrip beacon sehat, ambil langsung ke IP aslinya: `curl --resolve static.cloudflareinsights.com:443:<ip> https://static.cloudflareinsights.com/beacon.min.js` — jawaban wajar adalah 200 dengan sekitar 30 kB JavaScript. Uji dari jaringan lain, misalnya data seluler, sebelum menyimpulkan ada yang rusak.

Dashboard menampilkan kunjungan, page views, dan halaman populer dari dataset RUM, cache 15 menit. Angka bukan pengunjung unik, dan dapat dipengaruhi pemblokir tracking. Data baru muncul setelah ada kunjungan sejak beacon aktif.

## 4. Peluncuran produksi

Dijalankan pada 5 September 2026. Langkah di bawah ini adalah catatan peristiwa saat itu, ketika produksi masih memakai database `rizki-portfolio`. Sejak migrasi English, `env.production` pada `wrangler.jsonc` menunjuk `rizki-portfolio-english`; bucket `rizki-portfolio-media` tidak berubah. Urutan yang terbukti bekerja:

1. Buat resource: `npx wrangler d1 create rizki-portfolio` dan `npx wrangler r2 bucket create rizki-portfolio-media`. Isikan `database_id` hasilnya beserta vars Access ke `env.production` pada `wrangler.jsonc`.
2. Salin data dengan `npx wrangler d1 export rizki-portfolio-preview --remote --output dump.sql`, lalu `npx wrangler d1 execute rizki-portfolio --remote --file dump.sql`. Dump menyertakan tabel `d1_migrations`, jadi migrasi tidak perlu dijalankan terpisah dan skema produksi identik dengan asalnya.
3. Salin objek R2 satu per satu dengan `wrangler r2 object get`/`put`; kunci objek sama dengan `media.id` di D1, jadi ID referensi tetap valid. Bandingkan hasilnya dengan `cmp` sebelum lanjut.
4. Untuk rilis English-only, konversi dulu konten bilingual yang tersisa sebelum deploy. Perkakasnya sudah tidak ada di repo; ambil dari riwayat git bila diperlukan. Secret enkripsi AI tidak dibutuhkan.
5. **Hapus dulu route lama sebelum deploy produksi.** `wrangler deploy` menolak route yang masih dipegang Worker lain, dan `routes: []` pada konfigurasi preview tidak menghapus route yang sudah ada — wrangler hanya menambah, tidak pernah menghapus. Hapus lewat dashboard Workers → Routes, atau `DELETE /zones/<zone>/workers/routes/<id>` pada API. Custom domain berpindah sendiri tanpa dihapus manual.
6. Pindahkan definisi `routes` di `wrangler.jsonc` dari blok utama ke `env.production`, agar deployment preview berikutnya tidak menarik kembali routing.
7. Build dan deploy: `CLOUDFLARE_ENV=production npm run build`, lalu `npx wrangler deploy --env production`. Verifikasi apex 200, admin 302 ke Access, serta `/api/media/<id>` untuk avatar dan CV.

Rollback cutover: kembalikan blok `routes` ke konfigurasi utama, hapus route produksi, lalu `npm run build && npx wrangler deploy`. Data preview masih utuh per 5 September 2026.

## 5. Migrasi skema produksi

Tabel `d1_migrations` produksi ikut tersalin dari dump, jadi wrangler tahu migrasi mana yang sudah diterapkan. Setiap kali ada file baru di `migrations/`, jalankan **sebelum** deploy Worker:

```sh
npx wrangler d1 migrations list DB --env production --remote
npx wrangler d1 migrations apply DB --env production --remote
```

Buat ekspor D1 dulu (`npx wrangler d1 export rizki-portfolio-english --remote --output backup.sql`). Migrasi `0004` membangun ulang tabel `documents` agar kolom `kind` menerima jenis konten baru (setup, gallery); tabel `revisions` dan `redirects` disalin dan dibuat ulang di migrasi yang sama supaya FK `ON DELETE CASCADE` tidak menyapu riwayat. Setelah deploy, aktifkan tab Setup dan Gallery di Profile & website → Section order & visibility, lalu Publish.

## 6. Kartu OG dan wasm

`/og.png` dan `/og/<slug>.png` merender PNG 1200×630 di Worker dengan satori (markup → SVG) dan `@resvg/resvg-wasm` (SVG → PNG), memakai DM Sans yang disalin ke `src/assets/fonts/` (OFL). Respons di-cache satu jam seperti sitemap.

Workers melarang kompilasi wasm saat runtime, jadi setiap wasm harus diimpor sebagai modul (`import wasm from "…wasm"`, diunggah sebagai `compiled-wasm`) — bukan data URL, `fetch`, atau file di disk. Karena itu satori dipakai lewat `satori/standalone` dengan `satori/yoga.wasm` yang di-init sendiri, bukan entry `satori` biasa yang memuat yoga dari base64.

**satori dipin di `0.32.0`.** Sejak 0.33 satori memakai harfbuzzjs, yang memanggil `addFunction` emscripten dan membuat modul wasm baru saat runtime; Workers menolaknya dengan `CompileError: Wasm code generation disallowed by embedder`. Jangan naikkan versinya tanpa memverifikasi endpoint di runtime Worker.

Vitest berjalan di Node, jadi test tidak menangkap batasan ini. Verifikasi manual setelah menyentuh satori, resvg, atau font:

```sh
npm run build
npx wrangler dev -c dist/server/wrangler.json --persist-to .wrangler/state
curl -H "Host: txtfromrizkirmdhn.my.id" -o card.png http://localhost:8787/og.png
```

Tanpa `--persist-to`, wrangler membuat database kosong di `dist/server/.wrangler` dan semua endpoint publik gagal 500. Header `Host` diperlukan karena route ini hanya melayani `PUBLIC_HOST` (bypass localhost hanya ada di build development).

Ukuran bundle naik dari 3,05 MiB menjadi 6,42 MiB uncompressed (`npx wrangler deploy --dry-run`); batas Worker adalah 64 MiB uncompressed sejak 4 September 2026, jadi masih longgar.

## Pemulihan dan rollback

- Kesalahan konten: Riwayat revisi → Pulihkan → periksa draft → Publish. Sampah → Pulihkan tidak otomatis menerbitkan kembali.
- File yang masih dipakai draft, published, atau riwayat revisi ditolak saat dihapus permanen.
- Ekspor ZIP berisi manifest `content.json`, Markdown draft, dan blob media berdasarkan ID. Simpan ZIP di tempat privat; isinya termasuk draft.
- Pemulihan bencana menggunakan ekspor D1 dan R2 / D1 Time Travel sesuai fasilitas plan akun. Buat ekspor sebelum menjalankan migrasi produksi. Jangan memulihkan seluruh database untuk membatalkan satu tulisan.
- Untuk mengembalikan versi aplikasi: `npx wrangler rollback <VERSION_ID>`. Rollback Worker tidak otomatis me-rollback database. Migrasi konten English mengubah JSON yang tersimpan, jadi me-rollback rilis itu menuntut pemulihan backup database sekaligus versi Worker sebelumnya.
- Observability aktif; log aplikasi hanya mencatat tipe kegagalan, tidak request body/API key. Periksa Workers Logs ketika terjadi 5xx.

## Mode maintenance

Dashboard → Pengaturan → Mode maintenance. Toggle langsung menyimpan status; judul dan pesan Inggris disimpan melalui tombol Save message. Status terpisah dari draft/published dan default nonaktif. Saat aktif, semua request konten pada hostname publik, termasuk detail tulisan, API konten dan media/CV, mendapat HTTP 503 dengan no-store dan Retry-After. Preview serta aset pada hostname admin tetap dilindungi Access dan bisa digunakan pemilik. Menonaktifkan mode mengembalikan konten published tanpa publish ulang. File yang sudah diunduh atau konten yang sudah terbuka pada perangkat pengunjung tidak dapat ditarik kembali.

Pengaturan disimpan di D1 pada integrations dengan ID maintenance, tanpa migrasi skema. Jangan mengganti atau menghapus baris tersebut saat deployment rutin. Backup ZIP versi 2 memuat pengaturan maintenance dan redirect, tanpa kredensial integrasi. Ekspor D1 penuh tetap diperlukan untuk pemulihan bencana database.
