# Mengaktifkan dashboard online

Implementasi memakai Workers, D1, R2 privat, dan Cloudflare Access. Local development memiliki akses pemilik otomatis **hanya pada build development dan hostname localhost/127.0.0.1**. Build deployment tidak memiliki bypass ini.

## Resource yang aktif

- Account: `4a273df5ad27c77f3a28a6d0bbcf770f`.
- Zone: `txtfromrizkirmdhn.my.id` (`6a3ec6fd3b5c5f12fcf0978c4e3397c0`).
- **Produksi (melayani traffic sejak 5 September 2026):** Worker `rizki-portfolio`, D1 `rizki-portfolio` (`273db981-25ed-4464-82f3-d646fc3dc4b8`), R2 privat `rizki-portfolio-media`. Memegang route `txtfromrizkirmdhn.my.id/*` dan custom domain `admin.txtfromrizkirmdhn.my.id`.
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

## 2. Secrets dan AI

Worker preview dan produksi sama-sama sudah memiliki `CMS_ENCRYPTION_KEY`; produksi memakai kunci yang sama dengan `.dev.vars` agar data terenkripsi tetap terbaca setelah migrasi. Jangan membuat ulang kunci tersebut. Untuk lingkungan baru, `CMS_ENCRYPTION_KEY` harus berupa 32 byte acak yang di-encode base64. Simpan sebagai Worker Secret, menggunakan prompt interaktif `npx wrangler secret put CMS_ENCRYPTION_KEY`. Kunci ini berbeda dari API key provider. Jangan menggantinya setelah API key disimpan tanpa rencana migrasi: kunci lama diperlukan untuk mendekripsi kredensial.

API key provider diisi dari Dashboard → Pengaturan → Terjemahan dengan AI. Isi base URL berakhiran `/v1` jika provider memerlukannya, nama model, dan API key. Server menambahkan `/chat/completions`. Klik Simpan lalu Tes koneksi. Pilihan model dan harga sepenuhnya mengikuti provider yang kamu pilih.

Kunci provider disimpan terenkripsi di D1. Ekspor konten tidak menyertakan kunci atau pengaturan integrasi. Terjemahan tidak pernah otomatis publish. Tes koneksi juga mengirim permintaan kecil ke provider.

## 3. Statistik

1. Aktifkan Cloudflare Web Analytics untuk hostname publik `txtfromrizkirmdhn.my.id`.
2. Isi `ANALYTICS_SITE_TAG` dan `ANALYTICS_BEACON_TOKEN` di vars. Account ID sudah disiapkan.
3. Buat API token khusus dengan izin baca Account Analytics pada akun tersebut. Simpan dengan `npx wrangler secret put CF_ANALYTICS_TOKEN`.
4. Build dan deploy. Beacon hanya disisipkan pada HTML hostname publik; preview dan dashboard tidak dilacak.
5. Dashboard menampilkan kunjungan, page views, dan halaman populer dari dataset RUM, cache 15 menit. Angka bukan pengunjung unik, dan dapat dipengaruhi pemblokir tracking. Jika token/dataset belum tersedia, tampilkan status belum tersedia tanpa data buatan.

## 4. Peluncuran produksi

Dijalankan pada 5 September 2026. Produksi memakai `env.production`, database `rizki-portfolio`, dan bucket `rizki-portfolio-media`. Urutan yang terbukti bekerja:

1. Buat resource: `npx wrangler d1 create rizki-portfolio` dan `npx wrangler r2 bucket create rizki-portfolio-media`. Isikan `database_id` hasilnya beserta vars Access ke `env.production` pada `wrangler.jsonc`.
2. Salin data dengan `npx wrangler d1 export rizki-portfolio-preview --remote --output dump.sql`, lalu `npx wrangler d1 execute rizki-portfolio --remote --file dump.sql`. Dump menyertakan tabel `d1_migrations`, jadi migrasi tidak perlu dijalankan terpisah dan skema produksi identik dengan asalnya.
3. Salin objek R2 satu per satu dengan `wrangler r2 object get`/`put`; kunci objek sama dengan `media.id` di D1, jadi ID referensi tetap valid. Bandingkan hasilnya dengan `cmp` sebelum lanjut.
4. Set secret: `npx wrangler secret put CMS_ENCRYPTION_KEY --env production`. Saat migrasi ini tabel `integrations` hanya berisi baris `maintenance`, belum ada API key terenkripsi, sehingga dump aman disalin apa adanya. Jika provider AI sudah pernah disimpan, jangan salin barisnya — isi ulang dari dashboard produksi.
5. **Hapus dulu route lama sebelum deploy produksi.** `wrangler deploy` menolak route yang masih dipegang Worker lain, dan `routes: []` pada konfigurasi preview tidak menghapus route yang sudah ada — wrangler hanya menambah, tidak pernah menghapus. Hapus lewat dashboard Workers → Routes, atau `DELETE /zones/<zone>/workers/routes/<id>` pada API. Custom domain berpindah sendiri tanpa dihapus manual.
6. Pindahkan definisi `routes` di `wrangler.jsonc` dari blok utama ke `env.production`, agar deployment preview berikutnya tidak menarik kembali routing.
7. Build dan deploy: `CLOUDFLARE_ENV=production npm run build`, lalu `npx wrangler deploy --env production`. Verifikasi apex 200, admin 302 ke Access, serta `/api/media/<id>` untuk avatar dan CV.

Rollback cutover: kembalikan blok `routes` ke konfigurasi utama, hapus route produksi, lalu `npm run build && npx wrangler deploy`. Data preview masih utuh per 5 September 2026.

## Pemulihan dan rollback

- Kesalahan konten: Riwayat revisi → Pulihkan → periksa draft → Publish. Sampah → Pulihkan tidak otomatis menerbitkan kembali.
- File yang masih dipakai draft, published, atau riwayat revisi ditolak saat dihapus permanen.
- Ekspor ZIP berisi manifest `content.json`, Markdown draft, dan blob media berdasarkan ID. Simpan ZIP di tempat privat; isinya termasuk draft.
- Pemulihan bencana menggunakan ekspor D1 dan R2 / D1 Time Travel sesuai fasilitas plan akun. Buat ekspor sebelum menjalankan migrasi produksi. Jangan memulihkan seluruh database untuk membatalkan satu tulisan.
- Untuk mengembalikan versi aplikasi: `npx wrangler rollback <VERSION_ID>`. Rollback Worker tidak otomatis me-rollback database. Kedua migrasi awal bersifat additive; pertahankan skema saat rollback kode.
- Observability aktif; log aplikasi hanya mencatat tipe kegagalan, tidak request body/API key. Periksa Workers Logs ketika terjadi 5xx.

## Mode maintenance

Dashboard → Pengaturan → Mode maintenance. Toggle langsung menyimpan status; judul dan pesan ID/EN disimpan melalui tombol Simpan pesan. Status terpisah dari draft/published dan default nonaktif. Saat aktif, semua request konten pada hostname publik, termasuk detail tulisan, API konten dan media/CV, mendapat HTTP 503 dengan no-store dan Retry-After. Preview serta aset pada hostname admin tetap dilindungi Access dan bisa digunakan pemilik. Menonaktifkan mode mengembalikan konten published tanpa publish ulang. File yang sudah diunduh atau konten yang sudah terbuka pada perangkat pengunjung tidak dapat ditarik kembali.

Pengaturan disimpan di D1 pada integrations dengan ID maintenance, tanpa migrasi skema. Jangan mengganti atau menghapus baris tersebut saat deployment rutin. ZIP backup konten saat ini tidak menyertakan pengaturan integrations; ekspor D1 diperlukan untuk backup status dan pesan maintenance.
