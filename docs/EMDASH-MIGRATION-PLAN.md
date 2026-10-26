# Rencana Migrasi Total ke EmDash + Cloudflare

- **Status:** draft v2 — keputusan Access/Free/host/OG/Setup-Gallery/recovery sudah diterapkan; siap masuk Fase 0 setelah sisa keputusan §14 dikonfirmasi.
- **Tanggal:** 25 Oktober 2026
- **Repo:** `porto` (`/Users/rizkirmdhn/Documents/Code/02-produk/porto`)
- **Domain produksi saat ini:** `https://txtfromrizkirmdhn.my.id`
- **Admin saat ini:** `https://admin.txtfromrizkirmdhn.my.id/admin`
- **Target:** situs publik Astro + EmDash, admin `/_emdash/admin`, seluruhnya di Cloudflare Workers + D1 + R2.

**Keputusan yang sudah dikunci:** Cloudflare Access dimatikan (passkey EmDash + recovery Google OAuth), Cloudflare Free plan (risiko CPU diterima), satu host (`admin.` di-redirect), OG dinamis wajib saat launch, Setup/Gallery memakai collection EmDash standar.

---

## 1. Ringkasan eksekutif

Situs ini sekarang adalah aplikasi **TanStack Start + React 19 + Vite** dengan CMS buatan sendiri: D1 untuk dokumen, R2 untuk media, editor TipTap, revisi, draft/publish, preview, redirect, maintenance, dan panel statistik. Total kode aplikasi sekitar **8.600 baris**; sekitar **4.000 baris** di antaranya adalah admin CMS.

Rekomendasi: **migrasi total (rewrite) situs publik ke Astro 7 + EmDash 1.3**, bukan menjalankan EmDash sebagai headless CMS di belakang TanStack. Alasannya:

1. EmDash adalah **Astro integration**. Admin, preview, visual editing, image transform, SEO, sitemap, redirect, dan media library bekerja paling baik di dalam aplikasi Astro yang sama.
2. Mode headless akan mempertahankan dua runtime, dua model auth, dan dua sistem preview. Itu menambah kompleksitas, bukan mengurangi.
3. Tujuan utama — **CMS yang lebih mudah dikelola** — tercapai dengan menghapus admin buatan sendiri, bukan membungkusnya.
4. Desain publik yang sekarang bisa dipertahankan hampir utuh karena CSS dan komponennya dapat dipindahkan ke Astro.

**Estimasi:** 10–14 hari kerja efektif. MVP yang sudah bisa dipakai untuk mengelola konten: 5–6 hari. Cutover produksi: 1 hari, dengan masa rollback 30 hari.

**Prinsip migrasi:** jangan big-bang. Bangun di Worker staging dengan D1/R2 terpisah, migrasikan data, uji paritas, baru pindahkan route produksi. Worker, D1, dan R2 lama tetap hidup tanpa route sampai masa rollback selesai.

---

## 2. Kondisi saat ini

### 2.1 Stack dan deployment

| Bagian     | Kondisi sekarang                                                               |
| ---------- | ------------------------------------------------------------------------------ |
| Framework  | TanStack Start `1.170.x`, React `19`, Vite `8`                                 |
| Runtime    | Cloudflare Workers (`nodejs_compat`)                                           |
| Database   | D1 `rizki-portfolio-english` (`97df1c8a-33e8-4183-9ac9-3d19a19dc6b4`)          |
| Media      | R2 privat `rizki-portfolio-media`                                              |
| Auth admin | Cloudflare Access + validasi JWT sendiri (`jose`), owner email                 |
| Editor     | TipTap + Markdown import/export                                                |
| Deploy     | `CLOUDFLARE_ENV=production npm run build && wrangler deploy --env production`  |
| Worker     | `rizki-portfolio` (produksi), `rizki-portfolio-preview` (pensiun, tanpa route) |
| Analytics  | Cloudflare Web Analytics, beacon disuntikkan Worker                            |

### 2.2 Isi produksi per 25 Oktober 2026

| Jenis             | Jumlah | Catatan                                           |
| ----------------- | -----: | ------------------------------------------------- |
| `projects`        |      9 | semua published                                   |
| `experience`      |      3 | semua published                                   |
| `writing`         |      3 | semua published                                   |
| `about`           |      2 | Certifications & awards, Education                |
| `gallery`         |      1 | 1 foto                                            |
| `setup`           |      0 | tab aktif tetapi kosong                           |
| `site` (profile)  |      1 | identitas, copy, section, SEO global              |
| **Total dokumen** | **19** |                                                   |
| Revisi            |     59 | riwayat tersimpan di D1                           |
| Media             |      4 | avatar JPG, CV PDF asli, CV PDF demo, 1 foto WebP |
| Redirect          |      0 | tidak ada redirect tersimpan                      |

Media yang benar-benar dipakai: avatar, CV asli, dan 1 foto gallery. CV demo tidak dipakai.

### 2.3 Routing publik yang harus dipertahankan

| URL              | Isi                                    |
| ---------------- | -------------------------------------- |
| `/`              | Projects (home)                        |
| `/experience`    | Experience                             |
| `/writing`       | Writing                                |
| `/about`         | About + 2 entry                        |
| `/setup`         | Setup (kosong)                         |
| `/gallery`       | Gallery                                |
| `/post/:slug`    | Detail semua entry                     |
| `/llms.txt`      | Ringkasan untuk LLM                    |
| `/sitemap.xml`   | Sitemap                                |
| `/robots.txt`    | Robots + blok bot training tertentu    |
| `/og.png`        | Kartu OG default                       |
| `/og/:slug.png`  | Kartu OG dinamis                       |
| `/api/media/:id` | Media publik                           |
| `/api/public`    | API konten publik (dokumentasi README) |
| `/preview`       | Preview draft (owner)                  |
| `/admin`         | Dashboard lama                         |

### 2.4 Perilaku yang harus dipertahankan

- Satu bahasa: **Inggris**. Tidak ada language switcher; `?lang=` lama diarahkan 301 ke URL tanpa query.
- `/projects` diarahkan 301 ke `/`.
- Draft tidak pernah mengubah konten published.
- Preview draft hanya untuk owner.
- Revisi bisa dipulihkan ke draft, bukan langsung publish.
- Media yang masih dipakai konten/revisi tidak boleh dihapus permanen.
- Setup dan Gallery tampil hanya jika section-nya visible.
- Section order dan visibility diatur dari satu layar.
- Copy microcopy bisa dioverride tanpa deploy.
- Maintenance mode mengembalikan 503 untuk halaman publik, bukan admin/preview/media.
- `robots.txt` memblokir bot training tertentu, tetapi tetap mengizinkan bot pencarian/citation.
- OG image dinamis 1200×630.
- Tema terang/gelap dengan animasi reveal dan tanpa flash.
- Gallery lightbox dengan navigasi keyboard.
- Modal kontak, avatar, dan CV.

### 2.5 Titik nyeri yang ingin diselesaikan

- Admin CMS buatan sendiri harus dirawat: editor, revisi, trash, media, auth, redirect, backup, statistik.
- Tidak ada scheduling, search, atau SEO panel bawaan.
- Media library terbatas; tidak ada folder, caption, usage tracking, atau transformasi gambar.
- Setiap perubahan model konten menyentuh Zod schema, SQL migration, API, admin form, dan public view.
- Editor Markdown/visual masih harus mengelola banyak field manual.

---

## 3. Keputusan arsitektur

### ADR-1 — Rewrite ke Astro + EmDash, bukan headless

**Keputusan:** ganti seluruh aplikasi dengan Astro 7 + EmDash 1.3.

**Konsekuensi:**

- `src/admin/*`, `src/server/*`, `src/lib/cms.ts`, migrasi D1 lama, dan dependensi TanStack/TipTap dihapus setelah cutover.
- Admin memakai `/_emdash/admin`.
- Akses data publik memakai `getEmDashCollection`, `getEmDashEntry`, `getMenu`, `getSiteSettings`, dan `PortableText`.
- Tidak ada lagi API admin buatan sendiri.

**Alternatif yang ditolak:** TanStack Start tetap menjadi frontend, EmDash menjadi API. Ini mempertahankan dua auth, dua preview, dan dua deployment; tidak sepadan untuk situs 19 halaman.

### ADR-2 — Satu collection per jenis konten

**Keputusan:** `projects`, `experience`, `writing`, `about`, `profile`, `setup`, `gallery`. Bukan satu tabel `documents` dengan field `category`.

**Konsekuensi:**

- Admin punya menu konten yang jelas per jenis.
- Field bisa berbeda tanpa `if category === ...`.
- URL pattern semua collection disamakan: `/post/{slug}`.
- Karena EmDash tidak menjamin slug unik lintas collection, migrasi **wajib** memeriksa duplikat slug. Saat ini tidak ada duplikat.

### ADR-3 — Setup & Gallery memakai collection EmDash standar

**Keputusan:** `setup` dan `gallery` tetap **collection biasa**, satu entry per item/foto. Bukan singleton, bukan repeater.

- `setup`: satu entry per gear/tool (`title`, `group`, `summary`, `body`, `link`, `order`).
- `gallery`: satu entry per foto (`title`, `summary`, `cover` wajib, `link`, `order`).

**Alasan:** ini mengikuti konsep inti EmDash — collection untuk tipe konten, entry untuk satu unit konten. Keuntungannya:

- draft/publish/revisi/preview per item tetap ada, sama seperti sekarang;
- media usage tracking dan alt per foto bekerja normal;
- entry punya URL, SEO panel, dan sitemap sendiri;
- tidak ada “dokumen raksasa” yang harus disimpan ulang hanya untuk menambah satu foto;
- admin memakai pola standar EmDash, sehingga lebih mudah dirawat dan dipahami.

`setup` dan `gallery` tetap memakai `urlPattern: "/post/{slug}"` agar URL lama tidak berubah. Halaman `/setup` dan `/gallery` hanya merender daftar entry; detail entry tetap tersedia seperti sekarang.

**Konsekuensi:** menambah banyak foto berarti membuat beberapa entry. EmDash belum punya “bulk create entry” seperti admin lama. Mitigasinya: upload banyak file sekaligus ke media library, lalu duplicate entry atau buat entry baru; jika ini terlalu lambat, buat plugin admin kecil di fase 8.

### ADR-4 — Auth admin memakai passkey EmDash, tanpa Cloudflare Access

**Keputusan:** **Cloudflare Access dimatikan**. Admin memakai auth bawaan EmDash: passkey-first, dengan recovery Google OAuth.

**Konsekuensi:**

- Tidak ada `auth: access(...)` di `astro.config.mjs`; tidak ada secret `CF_ACCESS_AUDIENCE`.
- Access tidak dipakai di staging maupun produksi baru. Access lama tetap melindungi Worker lama sampai cutover, lalu dilepas.
- Jika sementara masih ingin memakainya di staging, itu keputusan terpisah dan tidak mengubah produksi.
- Admin tetap di `/_emdash/admin` pada domain publik, dilindungi login EmDash.
- First user menjadi Admin. Register **minimal dua passkey** (laptop + ponsel/password manager).
- Self-signup dan invite harus dimatikan; hanya owner yang boleh punya akun.
- Kehilangan semua passkey = risiko terkunci. Recovery memakai **Google OAuth provider** bawaan EmDash dengan email owner yang sama.
- Local development memakai passkey/dev bypass seperti biasa.
- Tanpa Access, tidak ada SSO di edge. Keamanan bergantung pada passkey, rate limit EmDash, dan tidak adanya self-signup.

### ADR-5 — Data migration lewat seed + site transfer, dengan fallback REST

**Keputusan utama:**

1. Generate `seed/seed.json` (schema + settings, tanpa konten).
2. Generate `migration/seed-with-content.json` dari export D1 produksi.
3. Jalankan `emdash seed` di SQLite lokal untuk validasi dan pratinjau.
4. Export site package dari lokal, lalu `emdash site import` ke staging/produksi yang masih kosong.

**Fallback:** script REST `scripts/migrate-content.ts` yang memanggil `/_emdash/api/*` dengan API token. Dipakai jika site import terhalang (target tidak dianggap kosong, media gagal, atau ada bug import).

**Alasan:** seed/site transfer adalah jalur resmi EmDash, sudah menangani media `$media`, taxonomy, menu, redirect, dan content. Script sendiri hanya perlu mengubah format, bukan mengimplementasikan upload media dan urutan create.

### ADR-6 — Desain dipertahankan sebagai custom Astro theme

**Keputusan:** tidak memakai theme EmDash. CSS dan markup publik dipindahkan dari React ke Astro.

**Konsekuensi:**

- `src/styles.css` (1.443 baris) menjadi basis; class name dipertahankan.
- Komponen React dipecah menjadi komponen Astro dan sedikit script vanilla.
- Tidak ada React hydration di halaman publik. React hanya dimuat untuk admin EmDash.
- Interaksi berat (TipTap, drawer admin) hilang karena digantikan admin EmDash.

### ADR-7 — Cache: KV object cache dulu, Workers Cache belakangan

**Keputusan:** aktifkan `objectCache: kvCache({ binding: "CACHE" })` sejak launch. Workers Cache/route rules ditunda sampai paritas stabil.

**Alasan:** EmDash melakukan beberapa query D1 per request. KV object cache mengurangi beban baca tanpa risiko cache halaman untuk editor. Workers Cache punya jebakan: halaman ter-cache bisa dibagikan ke editor yang login; jika diaktifkan, set `toolbar: "client"` dan route rules hanya untuk halaman publik.

### ADR-8 — Lingkungan terpisah: local, staging, production

| Lingkungan | Database                            | Media                                     | Auth               | URL                               |
| ---------- | ----------------------------------- | ----------------------------------------- | ------------------ | --------------------------------- |
| Local      | SQLite `data.db`                    | `./uploads`                               | Passkey/dev bypass | `http://localhost:4321`           |
| Staging    | D1 `rizki-portfolio-emdash-staging` | R2 `rizki-portfolio-emdash-media-staging` | Passkey + recovery | `https://staging...`              |
| Production | D1 `rizki-portfolio-emdash`         | R2 `rizki-portfolio-emdash-media`         | Passkey + recovery | `https://txtfromrizkirmdhn.my.id` |

Jangan pernah mengarahkan staging ke D1/R2 produksi. Binding named environment tidak diwarisi; ulangi semua binding di `env.production` dan `env.preview`.

### ADR-9 — Cloudflare Free plan (risiko CPU diterima)

**Keputusan user:** tetap memakai **Cloudflare Workers Free plan**, dengan risiko CPU 10 ms diterima. Tidak ada upgrade ke Paid dalam scope migrasi.

**Peringatan teknis:** Workers Free membatasi **10 ms CPU per request**. EmDash SSR dan admin API secara realistis memakai **10–20 ms**; laporan issue EmDash #4218 (Oktober 2026) menunjukkan sekitar **1% request admin gagal `exceededCpu` (503)** pada Free plan, bahkan untuk lock/read/save entry. Jadi admin **tidak reliabel untuk editing harian** dan bisa gagal sesekali.

**Konsekuensi dan mitigasi yang disepakati:**

- **Gate Fase 1 menjadi baseline, bukan blocker:** ukur `$workers.cpuTimeMs` dan `exceededCpu` di staging, catat angkanya, lalu lanjut dengan risiko yang sudah diterima.
- **Mitigasi teknis:** `toolbar: false` atau `toolbar: "client"`, object cache KV, Workers Cache untuk halaman publik, plugin seminimal mungkin, dan retry manual saat aksi admin gagal.
- **Jika frekuensi `exceededCpu` mengganggu:** keputusan Free ditinjau ulang (upgrade Paid $5 atau pindahkan admin ke Node/VPS). Ini keputusan bisnis, bukan blocker plan.
- **OG dinamis vs CPU:** render satori/resvg on-demand sangat mungkin melewati 10 ms. Karena OG wajib, implementasi utama adalah **pre-generation di Node/CI**: render PNG dengan satori + `sharp`/`resvg-js`, upload ke R2 (`og/{slug}.png`), lalu route Worker hanya menyajikan bytes dari R2. Tidak ada wasm/rendering di Worker.
- **D1 Time Travel hanya 7 hari.** Untuk rollback 30 hari, wajib dump offsite mingguan (dan dump final sebelum cutover).
- **Workers Logs terbatas.** Simpan output `wrangler tail` saat cutover; aktifkan alert.
- **Batas request/hari, rows read/hari, storage D1, dan R2** cukup untuk portofolio ini, tetapi harus dipantau. Object cache KV membantu menekan rows read, bukan CPU admin.
- **Cloudflare Images transformations** punya kuota bulanan (sekitar 5.000 unique transformations). Media sedikit, jadi aman; jangan membuat banyak variasi ukuran.
- **Cron Trigger** tersedia di Free; EmDash 1.2+ sudah memperbaiki cron cold-start CPU, tetapi tetap pantau.
- Jika traffic/transformasi melewati kuota, opsi pertama adalah cache dan mengurangi varian gambar.

---

## 4. Target arsitektur

### 4.1 Stack target

| Komponen                  | Versi/konfigurasi                            |
| ------------------------- | -------------------------------------------- |
| Astro                     | `7.4.x`, `output: "server"`                  |
| EmDash                    | `emdash@1.3.x`                               |
| Cloudflare adapter        | `@astrojs/cloudflare@14.4.x`                 |
| EmDash Cloudflare adapter | `@emdash-cms/cloudflare@1.3.x`               |
| React                     | `19` (hanya untuk admin EmDash)              |
| Node                      | `22.23.4+` (sekarang `24.22.0`, aman)        |
| Database                  | D1 binding `DB`                              |
| Media                     | R2 binding `MEDIA`                           |
| Session                   | KV `SESSION` (disediakan adapter Cloudflare) |
| Object cache              | KV `CACHE`                                   |
| Image transform           | binding `IMAGES`                             |
| Scheduler                 | Cron Trigger `* * * * *` + `scheduled()`     |
| Admin auth                | Passkey EmDash + recovery (tanpa Access)     |

### 4.2 Struktur repo target

```text
porto/
├── astro.config.mjs
├── wrangler.jsonc
├── package.json
├── seed/
│   └── seed.json                 # schema + settings, tanpa konten produksi
├── migration/
│   ├── export-prod.sh            # export D1/R2 produksi
│   ├── build-content.mjs         # JSON produksi -> seed content / REST payload
│   ├── media-map.json            # old media id -> new media id/URL
│   └── output/                   # gitignored, berisi data mentah
├── scripts/
│   ├── verify-parity.mjs         # crawl URL, meta, status, redirect
│   ├── generate-og.mjs           # satori + sharp -> R2 og/{slug}.png
│   └── migrate-content.ts        # fallback REST (opsional)
├── src/
│   ├── live.config.ts
│   ├── worker.ts
│   ├── middleware.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── public/               # profile, nav, work card, detail, gallery, setup, modal
│   │   ├── seo/                  # Person JSON-LD, analytics, og
│   │   └── icons/                # ikon dari lucide
│   ├── lib/
│   │   ├── content.ts            # query + mapping + fallback
│   │   ├── copy.ts               # defaultWords + override profile.copy
│   │   ├── dates.ts
│   │   ├── theme-reveal.ts
│   │   └── og.ts                 # template satori (dipindah dari src/lib/og.ts)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── experience.astro
│   │   ├── writing.astro
│   │   ├── about.astro
│   │   ├── setup.astro
│   │   ├── gallery.astro
│   │   ├── post/[slug].astro
│   │   ├── 404.astro
│   │   ├── og.png.ts
│   │   ├── og/[slug].png.ts
│   │   ├── llms.txt.ts
│   │   ├── sitemap.xml.ts
│   │   ├── robots.txt.ts
│   │   └── api/media/[id].ts     # kompatibilitas URL media lama
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       └── public.css
├── public/
│   ├── favicon.svg
│   └── _headers
└── tests/
    ├── unit/
    └── e2e/
```

### 4.3 Resource Cloudflare target

| Resource   | Staging                                | Production                     |
| ---------- | -------------------------------------- | ------------------------------ |
| Worker     | `rizki-portfolio-emdash-staging`       | `rizki-portfolio-emdash`       |
| D1         | `rizki-portfolio-emdash-staging`       | `rizki-portfolio-emdash`       |
| R2         | `rizki-portfolio-emdash-media-staging` | `rizki-portfolio-emdash-media` |
| KV CACHE   | `rizki-portfolio-emdash-cache-staging` | `rizki-portfolio-emdash-cache` |
| KV SESSION | dibuat adapter                         | dibuat adapter                 |
| Cron       | `* * * * *`                            | `* * * * *`                    |
| Auth admin | passkey EmDash                         | passkey EmDash                 |

Nama Worker produksi boleh tetap `rizki-portfolio-emdash` agar rollback jelas. Tidak perlu mengganti nama menjadi `rizki-portfolio`; yang penting route dan perilakunya.

---

## 5. Content model EmDash

### 5.1 Ringkasan collection

| Collection   | Tipe         | Supports                                    | URL            | Keterangan                             |
| ------------ | ------------ | ------------------------------------------- | -------------- | -------------------------------------- |
| `projects`   | multiple     | drafts, revisions, preview, scheduling, seo | `/post/{slug}` | karya utama, pinned, visual, repo/demo |
| `experience` | multiple     | drafts, revisions, seo                      | `/post/{slug}` | pengalaman kerja                       |
| `writing`    | multiple     | drafts, revisions, preview, scheduling, seo | `/post/{slug}` | tulisan                                |
| `about`      | multiple     | drafts, revisions, seo                      | `/post/{slug}` | certifications, education              |
| `profile`    | single entry | drafts, revisions, preview                  | –              | identitas, copy, section, maintenance  |
| `setup`      | multiple     | drafts, revisions, preview, seo             | `/post/{slug}` | satu entry per gear/tool               |
| `gallery`    | multiple     | drafts, revisions, preview, seo             | `/post/{slug}` | satu entry per foto                    |

### 5.2 Field `projects`

| Slug       | Label          | Tipe         | Wajib | Catatan                            |
| ---------- | -------------- | ------------ | ----- | ---------------------------------- |
| `title`    | Title          | string       | ya    | searchable                         |
| `summary`  | Summary        | text         | tidak | searchable                         |
| `body`     | Body           | portableText | tidak | searchable                         |
| `date`     | Date           | datetime     | ya    | urutkan DESC                       |
| `pinned`   | Featured       | boolean      | tidak | kartu featured                     |
| `demo`     | Demo content   | boolean      | tidak | label demo                         |
| `order`    | Order          | integer      | tidak | urutkan manual                     |
| `cover`    | Cover          | image        | tidak | kartu + OG                         |
| `visual`   | Visual         | select       | tidak | `none`, `mail`, `storage`, `agent` |
| `repo`     | Repository URL | url          | tidak |                                    |
| `demo_url` | Demo URL       | url          | tidak |                                    |

`experience`, `writing`, `about` memakai subset yang sama: `title`, `summary`, `body`, `date`, `order`, `cover`. `writing` dan `projects` boleh punya `pinned`/`demo`. `setup` dan `gallery` punya field sendiri di §5.4–5.5.

### 5.3 Field `profile`

| Slug                  | Label             | Tipe         | Catatan                                     |
| --------------------- | ----------------- | ------------ | ------------------------------------------- |
| `name`                | Name              | string       |                                             |
| `brand`               | Monogram          | string       | default `ar`                                |
| `handle`              | Handle            | string       |                                             |
| `headline`            | Headline          | string       |                                             |
| `bio`                 | Bio               | text         |                                             |
| `note`                | Note              | text         |                                             |
| `location`            | Location          | string       |                                             |
| `email`               | Email             | string       | validasi email                              |
| `whatsapp`            | WhatsApp          | string       | digit saja                                  |
| `github`              | GitHub            | url          |                                             |
| `linkedin`            | LinkedIn          | url          |                                             |
| `skills`              | Skills            | repeater     | subfield `name`                             |
| `avatar`              | Avatar            | image        |                                             |
| `cv`                  | CV                | file         | PDF                                         |
| `about_title`         | About title       | string       |                                             |
| `about_body`          | About body        | portableText |                                             |
| `setup_intro`         | Setup intro       | portableText | intro di atas spec sheet                    |
| `setup_cover`         | Setup desk photo  | image        | foto meja opsional                          |
| `gallery_intro`       | Gallery intro     | portableText | opsional                                    |
| `footer`              | Footer            | string       |                                             |
| `seo_title`           | SEO title         | string       | global                                      |
| `seo_description`     | SEO description   | text         | global                                      |
| `copy`                | UI copy overrides | repeater     | subfield `key`, `value`                     |
| `sections`            | Sections          | repeater     | subfield `key` (select), `label`, `visible` |
| `maintenance_enabled` | Maintenance       | boolean      |                                             |
| `maintenance_title`   | Maintenance title | string       |                                             |
| `maintenance_body`    | Maintenance body  | text         |                                             |

`sections` menggantikan section order/visibility lama. Urutan baris = urutan tab. `visible=false` menyembunyikan tab dan route section.

`copy` berisi override microcopy. Key yang dipakai sekarang: `space`, `contact`, `cv`, `pinned`, `read`, `article`, `demo`, `back`, `end`, `source`, `liveDemo`, `close`, `by`, `updated`, `contactSub`, `cvTitle`, `downloadPdf`, `profileLabel`, `viewProfilePhoto`, `selectedWork`, `workIntro`, `notebook`, `browseProjects`, `projectsEmpty`, `experienceEmpty`, `writingEmpty`, `aboutEmpty`, `setupEmpty`, `galleryEmpty`, `setupOther`, `link`, `previousPhoto`, `nextPhoto`, `sectionsEmpty`, `built`, `unavailable`, `cvNote`, `download`, `projectsLabel`. Nilai fallback tetap di `src/lib/copy.ts`; repeater hanya menimpa yang diisi.

### 5.4 Field `setup`

Satu entry = satu gear/tool. Intro, foto meja, dan judul section tetap di `profile` (`setup_intro`, `setup_cover`, `sections`).

| Slug      | Label       | Tipe         | Wajib | Catatan                         |
| --------- | ----------- | ------------ | ----- | ------------------------------- |
| `title`   | Name        | string       | ya    | searchable                      |
| `group`   | Group       | string       | tidak | Hardware, Software, Services, … |
| `summary` | Description | text         | tidak | satu baris di spec sheet        |
| `body`    | Notes       | portableText | tidak | detail opsional                 |
| `link`    | Link        | url          | tidak | situs/repo produk               |
| `order`   | Order       | integer      | tidak | urutan dalam grup               |

### 5.5 Field `gallery`

Satu entry = satu foto. Judul/intro section tetap di `profile` (`sections`, `gallery_intro`).

| Slug      | Label       | Tipe     | Wajib | Catatan                        |
| --------- | ----------- | -------- | ----- | ------------------------------ |
| `title`   | Title       | string   | ya    | alt fallback + lightbox title  |
| `summary` | Description | text     | tidak | caption di lightbox            |
| `cover`   | Photo       | image    | ya    | wajib; divalidasi saat publish |
| `link`    | Link        | url      | tidak | tautan foto/karya              |
| `order`   | Order       | integer  | tidak | urutan grid                    |
| `date`    | Date        | datetime | tidak | untuk sorting/arsip            |

### 5.6 Taxonomy

Satu taxonomy: **`tag`**, non-hierarkis, berlaku untuk `projects`, `experience`, `writing`, `about`.

- Label asli dipertahankan; slug dibuat kebab-case.
- Contoh: `Cloudflare Workers` → `cloudflare-workers`.
- Migrasi membuat semua term dari tag produksi dan mengaitkannya ke entry.
- Jangan memakai nama `tags` (plural); query harus `tag`.

### 5.7 Settings

- Site settings: `title` = “Achmad Rizki Ramadhan”, `tagline` = headline, `url` = domain produksi, `locale` = `en`, `seo.titleSeparator` = `—`.
- Navigasi tab **tidak** memakai menu EmDash; memakai `profile.sections` agar visibility/order/label ada di satu tempat.
- Menu `primary` opsional untuk footer/links; tidak wajib.
- Redirect lama (0) tetap dimigrasikan ke EmDash Redirects jika nanti ada.

### 5.8 Gotcha implementasi

- `entry.id` = slug (`en/...` jika locale prefix). `entry.data.id` = ULID database. Jangan tertukar saat memanggil `getEntryTerms`.
- Image field adalah **objek** `{ id, src, alt, width, height }`, bukan string. Gunakan `<Image image={...} />`.
- Taxonomy name harus persis `tag`.
- Karena ada enam collection dengan `/post/{slug}`, halaman `[slug].astro` harus me-resolve collection pemilik slug. Gunakan `resolveEmDashPath` jika tersedia; jika tidak, query keenam collection secara paralel dan ambil yang cocok. Object cache KV mengurangi biaya query ini.
- Jangan mengandalkan `entry.id` untuk lookup lintas collection; `entry.data.id` adalah ULID dan `entry.id` adalah slug.
- Konten CMS dinamis: tidak boleh `getStaticPaths`; `output: "server"`.
- Jika route cache diaktifkan, panggil `Astro.cache.set(cacheHint)` untuk setiap query.

---

## 6. Matriks paritas fitur

| Fitur                   | Sekarang                | EmDash                                              | Tindakan                                         | Fase |
| ----------------------- | ----------------------- | --------------------------------------------------- | ------------------------------------------------ | ---- |
| Login admin             | Access + JWT custom     | Passkey EmDash                                      | setup passkey + recovery; tanpa Access           | 1    |
| CRUD konten             | Admin custom            | Admin EmDash                                        | hapus admin lama                                 | 2    |
| Draft/publish           | Custom                  | `supports: ["drafts"]`                              | migrasi snapshot published + draft               | 4    |
| Revisi                  | Custom                  | `supports: ["revisions"]`                           | aktifkan; riwayat lama diarsipkan, tidak diimpor | 2/4  |
| Preview                 | `/preview` custom       | Signed preview EmDash                               | redirect `/preview` → admin                      | 5    |
| Scheduling              | Tidak ada               | `supports: ["scheduling"]`                          | aktifkan, Cron                                   | 2    |
| Media library           | Custom, 4 file          | EmDash media + R2                                   | upload, alt, folder, usage                       | 4    |
| Image resize            | Browser resize          | Cloudflare Images                                   | aktifkan binding `IMAGES`                        | 1    |
| SEO per entry           | Field custom            | SEO panel                                           | tidak ada data lama; aktifkan                    | 2    |
| SEO global              | `site.seoTitle`         | Profile + Settings                                  | pindahkan                                        | 4    |
| Sitemap                 | Custom                  | Bawaan EmDash                                       | override custom agar archive section ikut        | 5    |
| Robots                  | Custom                  | Bawaan + setting                                    | override custom agar kebijakan AI sama           | 5    |
| llms.txt                | Custom                  | Tidak ada                                           | port endpoint                                    | 5    |
| OG dinamis              | satori + resvg          | Tidak ada                                           | **wajib**; port endpoint + verifikasi wasm       | 1/5  |
| Redirect                | Custom                  | Bawaan                                              | migrasikan + `/projects`, `?lang`                | 5    |
| 404 log                 | Tidak ada               | Bawaan                                              | gunakan                                          | 2    |
| Maintenance             | Custom                  | Tidak ada                                           | middleware + field profile                       | 5    |
| Analytics               | Beacon + panel          | Beacon saja                                         | panel statistik hilang; pakai dashboard CF       | 5/8  |
| Search                  | Tidak ada               | Bawaan                                              | opsional, aktifkan untuk writing/projects        | 8    |
| Comments                | Tidak ada               | Bawaan                                              | tidak diaktifkan                                 | –    |
| Backup                  | ZIP custom              | JSON + D1 Time Travel                               | Free: Time Travel 7 hari + dump offsite mingguan | 4/7  |
| Markdown import/export  | Per dokumen             | CLI `content get` (Markdown) / editor Portable Text | tidak ada bulk import UI; pakai CLI/migrasi      | 5    |
| Edit conflict           | Version check           | `_rev` + edit lock                                  | uji; tidak perlu kode                            | 2    |
| Media delete protection | Cek referensi manual    | Usage tracking                                      | repair usage setelah migrasi                     | 4    |
| Batas upload            | 10 MB image / 20 MB PDF | `maxUploadSize` EmDash                              | sesuaikan; uji PDF CV                            | 2    |
| Section order           | Custom                  | Profile repeater                                    | pindahkan                                        | 4    |
| Copy override           | Custom `words`          | Profile repeater                                    | pindahkan                                        | 4    |
| Gallery bulk add        | 1 halaman               | Collection per foto                                 | upload media massal; duplicate entry/plugin      | 4    |
| Setup spec sheet        | 1 halaman               | Collection per gear                                 | group + order; halaman `/setup` merender daftar  | 4    |
| CV modal                | iframe PDF              | Static component                                    | port                                             | 3    |
| Contact modal           | Custom                  | Static component                                    | port                                             | 3    |
| Theme toggle            | Custom                  | Static script                                       | port + view transition                           | 3    |
| Lightbox                | Custom                  | Static script                                       | port + keyboard                                  | 3    |
| `/api/public`           | Ada                     | Tidak ada                                           | cek pemakaian; kompatibilitas/410                | 5    |
| `/api/media/:id`        | Ada                     | URL baru                                            | redirect map                                     | 5    |
| Admin host              | `admin.`                | `/_emdash/admin`                                    | `admin.` 301 ke host utama                       | 7    |

---

## 7. Fase migrasi

### Fase 0 — Persiapan & baseline (0,5–1 hari)

**Tugas**

1. Buat tag `pre-emdash` dan branch/worktree `emdash-migration`.
2. Catat baseline produksi:
   - screenshot semua halaman (desktop/tablet/mobile, light/dark, modal, lightbox),
   - crawl semua URL: status, title, description, canonical, OG, JSON-LD,
   - Lighthouse/Web Vitals,
   - `robots.txt`, `sitemap.xml`, `llms.txt`,
   - akses admin dan alur publish.
3. Export cadangan:
   - D1 Time Travel bookmark,
   - `wrangler d1 export` (JSON/SQL),
   - sync R2 ke folder lokal,
   - salinan `EMDASH_ENCRYPTION_KEY` nanti (key baru).
4. Inventaris media dan URL lama.
5. Tentukan keputusan yang masih terbuka (lihat §14).

**Deliverable:** `docs/baseline/` berisi screenshot, `urls.json`, `meta.json`, catatan performa; backup D1/R2 di luar repo.

**Exit criteria:** baseline bisa direproduksi; backup bisa dibuka; tidak ada perubahan konten selama fase ini.

### Fase 1 — Scaffold & infrastruktur staging (1–2 hari)

**Tugas**

1. Scaffold EmDash Cloudflare di worktree:
   ```bash
   npm create emdash@latest
   # pilih: Cloudflare, template Blank/Portfolio, npm
   ```
2. Pindahkan boilerplate ke repo target:
   - `astro.config.mjs`
   - `wrangler.jsonc`
   - `src/worker.ts`
   - `src/live.config.ts`
3. Install:
   ```bash
   npm install astro emdash @astrojs/cloudflare @astrojs/react @emdash-cms/cloudflare react react-dom
   npm install -D wrangler @portabletext/markdown lucide-astro satori sharp
   ```
   Template EmDash sudah membawa peer dependency admin seperti `@cloudflare/kumo` dan `@phosphor-icons/react`; jangan dihapus. Jika memilih install manual, biarkan npm memasang peer tersebut.
4. Buat resource staging:
   ```bash
   npx wrangler d1 create rizki-portfolio-emdash-staging
   npx wrangler r2 bucket create rizki-portfolio-emdash-media-staging
   npx wrangler kv namespace create CACHE
   ```
5. Isi `wrangler.jsonc` staging (contoh di §9.1).
6. Konfigurasi `astro.config.mjs` (contoh di §9.2).
7. Generate `EMDASH_ENCRYPTION_KEY`:
   ```bash
   npx emdash secrets generate --write .env
   ```
8. Set `EMDASH_SITE_URL` ke URL staging sebelum request pertama.
9. Deploy staging:
   ```bash
   npm run build
   npx wrangler deploy
   ```
10. Selesaikan setup wizard di staging. First user menjadi Admin.
11. Daftarkan **dua passkey** (laptop + ponsel/password manager).
12. Konfigurasi recovery Google OAuth (dipilih): tambahkan provider Google dan kredensialnya (detail di §9.5).
13. Matikan self-signup/invite; pastikan hanya akun owner yang ada.
14. **Spike OG wajib (pre-generation):** buat `scripts/generate-og.mjs` yang menjalankan satori + `sharp`/`resvg-js` di Node, menghasilkan PNG 1200×630, lalu upload ke R2 (`og/{slug}.png`). Route Worker hanya membaca R2 dan mengirim PNG. Verifikasi di staging bahwa route OG ber-CPU rendah dan tidak `exceededCpu`. Ini harus lulus sebelum port desain.
15. Verifikasi:
    - halaman publik 200,
    - `/_emdash/admin` menampilkan login EmDash, bukan admin terbuka,
    - login passkey, logout, dan rate limit berjalan,
    - `/_emdash/api/content/...` tanpa sesi ditolak,
    - upload media uji dan tampilkan,
    - OG `/og.png` menghasilkan PNG 1200×630,
    - Cron Trigger muncul.
16. **Ukur CPU Free plan:** buka Workers Observability, lihat `$workers.cpuTimeMs` dan outcome `exceededCpu` untuk request admin/public. Ulangi 15–30 menit editing. Catat baseline; risiko sudah diterima.

**Deliverable:** staging Worker hidup, admin bisa diakses dengan passkey, D1/R2/KV terpisah, OG spike lulus, data CPU Free plan tercatat.

**Exit criteria:** `npx emdash doctor` lulus untuk scheduler; admin tidak terbuka tanpa login; recovery Google OAuth tersedia; OG dinamis terbukti jalan di runtime Cloudflare; tidak ada binding produksi; baseline CPU Free plan tercatat (risiko `exceededCpu` diterima).

### Fase 2 — Schema, seed, dan admin UX (1–2 hari)

**Tugas**

1. Tulis `seed/seed.json`:
   - collections + fields (§5),
   - taxonomy `tag`,
   - settings,
   - `sections` awal di profile.
2. Validasi:
   ```bash
   npx emdash seed seed/seed.json --validate
   ```
3. Terapkan ke lokal:
   ```bash
   npm run dev
   # buka /_emdash/admin, selesaikan setup tanpa sample content
   ```
   Seed schema diterapkan otomatis pada request pertama sebelum setup.
4. Buat profile (satu entry `profile`) dan isi struktur section.
5. Buat beberapa entry `setup` dan `gallery` untuk menguji collection standar.
6. Uji admin:
   - buat project,
   - upload cover,
   - publish,
   - buat draft,
   - preview,
   - revisi,
   - ubah slug (pastikan redirect otomatis),
   - SEO panel,
   - publish gallery tanpa foto (harus ditolak),
   - group/order setup,
   - duplicate entry gallery.
7. Generate types:
   ```bash
   npx emdash types
   ```
   atau biarkan `emdash-env.d.ts` dibuat dev server.
8. Export seed dari DB lokal setelah schema final:
   ```bash
   npx emdash export-seed > seed/seed.json
   ```
9. Commit `seed/seed.json` dan `emdash-env.d.ts` (atau gitignore sesuai kebiasaan template).

**Deliverable:** model konten final, admin bisa mengelola semua jenis konten.

**Exit criteria:** semua collection/field tampil di admin; seed valid; setup/gallery bisa create/publish per entry; profile (satu entry) punya instruksi jelas.

### Fase 3 — Port desain publik ke Astro (3–5 hari)

**Tugas**

1. Pindahkan CSS:
   - `tokens.css`: variabel warna, tipografi, spacing, dark theme.
   - `base.css`: reset, focus, tombol, link, skip link.
   - `public.css`: semua class `.public-site`, `.portfolio-layout`, `.work-card`, `.prose`, `.modal`, `.gallery-grid`, `.spec`, dan responsive.
2. Self-host DM Sans dari `src/assets/fonts/`; hapus import Google Fonts.
3. Buat `BaseLayout.astro`:
   - `<head>` meta dasar, favicon, canonical, `EmDashHead`,
   - skip link,
   - header topbar + theme toggle,
   - footer,
   - analytics beacon (hanya publik),
   - slot.
4. Pecah `public-view.tsx` menjadi:
   - `ProfilePanel.astro` (identitas, avatar, bio, note, location, actions, skills, social),
   - `SectionTabs.astro` (dari `profile.sections`),
   - `WorkCard.astro` + `WorkGrid.astro`,
   - `EntryDetail.astro`,
   - `EmptyState.astro`,
   - `ContactModal.astro`, `CvModal.astro`, `AvatarModal.astro`,
   - `GalleryGrid.astro`, `GalleryLightbox.astro`,
   - `SetupSpec.astro`,
   - `Visual.astro` (mail/storage/agent).
5. Port interaksi ke script vanilla:
   - theme toggle + view transition reveal (`theme-reveal.ts`),
   - modal `<dialog>` dengan focus trap, ESC, click backdrop,
   - gallery lightbox + ArrowLeft/ArrowRight,
   - category indicator motion (bisa disederhanakan),
   - `prefers-reduced-motion`.
6. Ikon: gunakan `lucide-astro` atau SVG inline; pertahankan ukuran/stroke.
7. Markdown → `PortableText`:
   - bungkus output dengan `.prose`,
   - pastikan style `h2/h3`, `p/ul/ol/blockquote/pre/code/a/strong/em`.
8. Image:
   - gunakan `<Image image={...} />` dari `emdash/ui`,
   - wrapper class untuk aspect ratio,
   - `loading="eager"` untuk cover pertama/featured, `lazy` untuk sisanya,
   - alt fallback ke title jika alt kosong.
9. Routes:
   - `/` = projects (fallback ke section visible pertama jika projects hidden),
   - `/experience`, `/writing`, `/about`, `/setup`, `/gallery`,
   - `/post/[slug]` untuk enam collection entry (projects, experience, writing, about, setup, gallery),
   - `/404`.
10. Section visibility:
    - jika section hidden, route 301 ke `/` (atau 404) dan tab tidak dirender.
11. Responsive & dark mode parity.

**Deliverable:** situs publik baru yang secara visual mendekati situs lama, dengan data dummy dari admin.

**Exit criteria:** semua route tampil, tidak ada hydration React di publik, screenshot side-by-side disetujui.

### Fase 4 — Migrasi data (2–3 hari)

**Tugas**

1. Export produksi:
   ```bash
   npx wrangler d1 execute rizki-portfolio-english --remote --env production \
     --json --command "SELECT * FROM documents" > migration/output/documents.json
   npx wrangler d1 execute rizki-portfolio-english --remote --env production \
     --json --command "SELECT * FROM media" > migration/output/media.json
   npx wrangler d1 execute rizki-portfolio-english --remote --env production \
     --json --command "SELECT * FROM redirects" > migration/output/redirects.json
   ```
2. Download media dari R2:
   ```bash
   npx wrangler r2 object get rizki-portfolio-media/<id> --file migration/output/media/<id>
   ```
   atau gunakan URL publik untuk media yang sudah published.
3. Buat `migration/build-content.mjs`:
   - baca JSON,
   - pilih snapshot `published` (dan `draft` jika berbeda),
   - konversi `body` Markdown → Portable Text dengan `markdownToPortableText`,
   - map field lama → field baru,
   - slugify tag,
   - buat `seed-with-content.json`,
   - buat `media-map.json`,
   - validasi duplikat slug,
   - validasi semua media ID yang dipakai ada.
4. Jalankan seed lokal:
   ```bash
   npx emdash seed migration/seed-with-content.json --database ./data.db --on-conflict=skip
   ```
5. Verifikasi lokal:
   - jumlah entry per collection (projects 9, experience 3, writing 3, about 2, gallery 1, setup 0),
   - isi body (heading, link, code, list),
   - tag,
   - cover/avatar/CV,
   - profile copy/sections/setup intro/setup cover,
   - group dan order setup,
   - gallery cover wajib,
   - URL `/post/:slug` untuk setiap entry.
6. Export site package:
   ```bash
   npx emdash site export --output migration/output/site.emdash
   ```
7. Import ke staging:
   ```bash
   npx emdash site import migration/output/site.emdash --analyze --token "$EMDASH_TOKEN"
   npx emdash site import migration/output/site.emdash --plan <digest> --confirm --token "$EMDASH_TOKEN"
   ```
   Jika site import menolak target yang sudah menyelesaikan setup, gunakan fallback `scripts/migrate-content.ts` (REST) dan jangan reset situs staging/produksi.
8. Bandingkan staging dengan produksi:
   - 19 dokumen (termasuk 1 gallery; setup 0),
   - 4 media (atau 3 yang dipakai),
   - 0 redirect,
   - semua published,
   - tidak ada broken media,
   - gallery entry tetap punya detail URL lama.
9. Simpan pemetaan media lama → baru untuk route kompatibilitas.
10. Arsipkan 59 revisi lama sebagai JSON di luar repo; **jangan** mengimpor ke tabel internal EmDash.

**Deliverable:** staging berisi konten produksi yang sudah dimigrasikan.

**Exit criteria:** tidak ada perbedaan konten yang disengaja; semua media tampil; body ter-render benar; URL sama.

### Fase 5 — Paritas fitur & SEO (2–3 hari)

**Tugas**

1. **Sitemap custom** `src/pages/sitemap.xml.ts`:
   - daftar section visible,
   - daftar semua entry published,
   - `lastmod` dari `updatedAt`,
   - URL absolut dari `siteUrl`.
2. **Robots custom** `src/pages/robots.txt.ts`:
   - pertahankan kebijakan sekarang: allow search/citation, block CCBot/Bytespider/Amazonbot/Applebot-Extended/meta-externalagent,
   - `Disallow: /_emdash/`,
   - `Sitemap: https://.../sitemap.xml`.
3. **llms.txt** `src/pages/llms.txt.ts`:
   - identitas, lokasi, email, GitHub, LinkedIn, skills,
   - daftar section + entry + tanggal.
4. **OG image (wajib launch)**:
   - pertahankan template `src/lib/og.ts` (murni, tanpa wasm),
   - buat `scripts/generate-og.mjs` yang merender satori → SVG → PNG dengan `sharp`/`resvg-js` di Node,
   - upload hasil ke R2: `og/{slug}.png` dan `og/default.png`,
   - endpoint `/og.png` dan `/og/[slug].png` hanya menyajikan bytes dari R2 + `Cache-Control` (CPU rendah),
   - fallback ke cover entry jika ada; jika PNG belum ada, sajikan default,
   - cache 1 jam.
   - **Strategi Free plan:** pre-generation adalah implementasi utama. Jalankan script setelah publish (manual/CI) atau nightly GitHub Action; jangan render satori/resvg di Worker.
   - **Tidak boleh** meninggalkan OG dinamis sebagai known gap. Jika pipeline R2 gagal, alternatif sebelum cutover: Worker OG terpisah (Paid) atau `workers-og`; static image hanya fallback darurat.
5. **Redirect**:
   - `/projects` → `/` 301,
   - `?lang=` → URL tanpa query 301,
   - `/admin` → `/_emdash/admin` 301,
   - `/preview` → `/_emdash/admin` 301,
   - redirect lama dari tabel `redirects` (0 saat ini),
   - redirect media lama `/api/media/:id` → URL EmDash baru (301/302).
6. **Maintenance mode**:
   - middleware membaca profile,
   - aktif hanya untuk host publik,
   - 503 HTML/JSON, `Retry-After`, `no-store`,
   - exclude `/_emdash/*`, `/_astro/*`, `/api/media/*`, preview, OG.
7. **Analytics**:
   - beacon Cloudflare Web Analytics di layout publik,
   - jangan aktif di `/_emdash/*` atau preview.
8. **JSON-LD**:
   - `EmDashHead` menghasilkan WebSite/BlogPosting,
   - tambahkan Person graph dari profile (nama, headline, avatar, sameAs),
   - pastikan tidak duplikat.
9. **404**:
   - halaman 404 dengan desain yang sama,
   - EmDash 404 log aktif.
10. **Kompatibilitas API**:
    - cek request `/api/public` di log/analytics,
    - jika nol: 410 dengan pesan,
    - jika ada: implementasi endpoint kompatibel dari EmDash, atau pertahankan selama 90 hari.

**Deliverable:** semua URL dan metadata lama tersedia di staging.

**Exit criteria:** crawl parity lulus; tidak ada 404 tak sengaja; OG/llms/robots/sitemap benar.

### Fase 6 — QA dan UAT (2–3 hari)

**Tugas**

1. **Visual regression**
   - screenshot production vs staging: `/`, `/experience`, `/writing`, `/about`, `/setup`, `/gallery`, `/post/mailriz`, 404,
   - viewport 390/768/1440,
   - light/dark,
   - modal kontak, CV, avatar, lightbox.
2. **Content parity**
   - jumlah entry, judul, summary, body, tag, cover,
   - tidak ada teks terpotong/berubah.
3. **SEO parity**
   - status code,
   - title/description/canonical,
   - OG/Twitter,
   - JSON-LD,
   - `sitemap.xml`, `robots.txt`, `llms.txt`,
   - redirect.
4. **Performance**
   - Lighthouse mobile/desktop,
   - LCP/CLS/INP,
   - tidak ada regresi >10%,
   - cek bundle publik tidak memuat React admin.
5. **Accessibility**
   - axe scan,
   - keyboard: tab, ESC, arrow lightbox,
   - focus visible,
   - alt text,
   - reduced motion.
6. **Security (tanpa Access)**
   - `/_emdash/admin` tanpa sesi → halaman login, bukan dashboard,
   - `/_emdash/api/content/...` tanpa sesi → 401/403,
   - endpoint signup/self-registration ditolak,
   - passkey login, logout, dan rate limit berjalan,
   - recovery Google OAuth berhasil,
   - media draft tidak bisa diakses publik,
   - CSRF header untuk session write,
   - `robots.txt` men-disallow `/_emdash/`,
   - tidak ada secret di repo/build.
7. **Admin UAT**
   - login passkey,
   - daftarkan passkey kedua,
   - create/edit/publish/unpublish,
   - draft preview,
   - revisi + restore,
   - schedule,
   - upload/delete media,
   - alt/caption,
   - SEO panel,
   - ubah slug → redirect,
   - section visibility,
   - copy override,
   - setup group/order,
   - gallery publish tanpa foto ditolak,
   - maintenance toggle,
   - backup download.
8. **Rollback rehearsal**
   - restore D1 Time Travel ke database uji (ingat: Free = 7 hari),
   - buka dump offsite mingguan di SQLite/D1 uji,
   - pastikan perintah rollback Worker dan data tersedia.

**Deliverable:** laporan QA + daftar bug + sign-off.

**Exit criteria:** tidak ada bug P0/P1; P2 diketahui dan diterima; UAT admin lulus.

### Fase 7 — Cutover produksi (0,5–1 hari)

**Penting:** tanpa Access, passkey harus dibuat di domain final. Sediakan **maintenance window singkat 15–30 menit** antara pelepasan route lama dan selesainya setup + import. Jangan mengumumkan cutover sebagai zero-downtime.

**Tugas**

1. **Change freeze** konten lama (jangan publish/edit).
2. Final delta:
   - export ulang D1,
   - jalankan `build-content.mjs` lagi,
   - bandingkan hash konten,
   - import delta ke staging, verifikasi.
3. Backup final:
   - D1 Time Travel bookmark,
   - export SQL/JSON,
   - sync R2,
   - catat versi Worker lama.
4. Siapkan production Worker:
   - `wrangler.jsonc` `env.production` dengan D1/R2/KV produksi,
   - `EMDASH_SITE_URL` = `https://txtfromrizkirmdhn.my.id`,
   - `EMDASH_ENCRYPTION_KEY` produksi,
   - secret Google OAuth untuk recovery.
5. Deploy production Worker dengan `workers_dev: true` **sementara dan tanpa route** untuk smoke test halaman publik. Jangan menyelesaikan setup/passkey di `workers.dev`; passkey terikat hostname dan tidak akan bekerja di domain produksi. Setelah smoke test, set `workers_dev: false`.
6. **Hapus route lama** dari Worker `rizki-portfolio` (Cloudflare tidak menghapus route otomatis; `wrangler deploy` hanya menambah).
7. Detach custom domain `admin.txtfromrizkirmdhn.my.id` dari Worker lama, lalu deploy Worker baru dengan route `txtfromrizkirmdhn.my.id/*`:
   ```bash
   npx wrangler deploy --env production
   ```
8. Buka `https://txtfromrizkirmdhn.my.id/_emdash/admin` dan selesaikan setup **di domain produksi**; first user Admin. Daftarkan minimal dua passkey.
9. Import site package / jalankan migrasi final ke D1 produksi.
10. Pasang Cloudflare Redirect Rule `admin.txtfromrizkirmdhn.my.id/*` → `https://txtfromrizkirmdhn.my.id/_emdash/admin` (301).
11. Verifikasi:
    - `/`, semua section, `/post/:slug`,
    - `/_emdash/admin` login passkey di domain produksi,
    - media, CV, avatar,
    - OG, sitemap, robots, llms,
    - redirect,
    - maintenance off,
    - Cron trigger (`wrangler tail`).
12. Aktifkan monitoring 48 jam:
    - Workers Logs,
    - error rate,
    - 404 log EmDash,
    - D1 latency,
    - Cron.
13. Umumkan/update dokumentasi.

**Deliverable:** produksi berjalan di EmDash.

**Exit criteria:** semua URL 200/301 benar; admin bisa login; tidak ada error 5xx berulang; Cron berjalan.

### Fase 8 — Stabilisasi & cleanup (setelah 7–30 hari)

1. Perbaiki bug temuan produksi.
2. Opsional: aktifkan search, Workers Cache, plugin analytics.
3. Update `README.md` dan `docs/CLOUDFLARE-SETUP.md` untuk stack baru.
4. Hapus kode lama dari branch utama setelah rollback window:
   - `src/admin`, `src/server`, `src/routes`, `src/components` lama,
   - `migrations/` lama,
   - dependensi TanStack/TipTap/Zod/Jose/dll.
5. Hapus Access app lama untuk `admin.` jika masih ada.
6. Hapus Worker/D1/R2 lama setelah backup final dan 30 hari (Free plan Time Travel hanya 7 hari; simpan dump offsite).
7. Simpan export D1/R2 lama di penyimpanan offsite.

---

## 8. Detail migrasi data

### 8.1 Alur utama

```text
D1 produksi
  ├─ documents.json ──┐
  ├─ media.json ──────┤
  └─ redirects.json ──┘
                      │
                      ▼
          migration/build-content.mjs
          - pilih published/draft
          - markdown -> Portable Text
          - map field
          - slugify tag
          - validasi duplikat & media
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
 seed-with-content.json     media-map.json
          │                       │
          ▼                       ▼
 emdash seed (lokal)      route /api/media/:id
          │
          ▼
 emdash site export
          │
          ▼
 emdash site import (staging/produksi)
```

### 8.2 Mapping field

| Lama                                                  | Baru                      | Transformasi                                                  |
| ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| `kind`                                                | collection                | `projects`→`projects`; `gallery`/`setup` tetap entry per item |
| `slug`                                                | `slug`                    | sama; cek unik                                                |
| `title`                                               | `title`                   | sama                                                          |
| `summary`                                             | `summary`                 | sama; gallery = caption                                       |
| `body` (Markdown)                                     | `body` (Portable Text)    | `markdownToPortableText`                                      |
| `date`                                                | `date`                    | `YYYY-MM-DD` → `YYYY-MM-DDT00:00:00.000Z`                     |
| `tags[]`                                              | taxonomy `tag`            | slugify label; buat term                                      |
| `pinned`                                              | `pinned`                  | boolean                                                       |
| `demo`                                                | `demo`                    | boolean                                                       |
| `order`                                               | `order`                   | integer                                                       |
| `cover`                                               | `cover`                   | `/api/media/<id>` → image object; gallery wajib               |
| `visual`                                              | `visual`                  | `""` → `none`                                                 |
| `repo`                                                | `repo`                    | URL                                                           |
| `demoUrl`                                             | `demo_url` / `link`       | `link` untuk setup/gallery                                    |
| `group`                                               | `setup.group`             | hanya setup                                                   |
| `site.name`                                           | `profile.name`            | sama                                                          |
| `site.brand`                                          | `profile.brand`           | sama                                                          |
| `site.headline`                                       | `profile.headline`        | sama                                                          |
| `site.bio`                                            | `profile.bio`             | sama                                                          |
| `site.note`                                           | `profile.note`            | sama                                                          |
| `site.aboutTitle`                                     | `profile.about_title`     | sama                                                          |
| `site.aboutBody`                                      | `profile.about_body`      | Markdown → Portable Text                                      |
| `site.footer`                                         | `profile.footer`          | sama                                                          |
| `site.words`                                          | `profile.copy`            | key/value repeater                                            |
| `site.sections`                                       | `profile.sections`        | key/label/visible                                             |
| `site.avatar`                                         | `profile.avatar`          | media object                                                  |
| `site.cv`                                             | `profile.cv`              | file object                                                   |
| `site.setupCover`                                     | `profile.setup_cover`     | media object                                                  |
| `site.setupIntro`                                     | `profile.setup_intro`     | Markdown → Portable Text                                      |
| `site.seoTitle`                                       | `profile.seo_title`       | sama                                                          |
| `site.seoDescription`                                 | `profile.seo_description` | sama                                                          |
| `site.email/github/linkedin/whatsapp/location/skills` | profile                   | sama                                                          |
| `media.alt`                                           | media alt                 | kosong → fallback title                                       |
| `redirects`                                           | EmDash Redirects          | `slug` → `/post/{slug}`                                       |

### 8.3 Aturan konversi Markdown

- Gunakan `markdownToPortableText` dari `@portabletext/markdown`.
- Heading `##`/`###` → `style: "h2"/"h3"`.
- Link → `markDefs` + `marks`.
- List → `bullet`/`number`.
- Code fence → `code` block.
- Blockquote → `blockquote`.
- Tidak ada gambar inline di konten lama; jika ada, upload media lalu buat image block.
- Validasi dengan merender 3 sampel: `mailriz` (heading + link), `kenapa-alias-email`, `server-kecil-kecilan`.

### 8.4 Media

- Upload melalui seed `$media` (otomatis download) atau `POST /_emdash/api/media`.
- Untuk setiap media:
  - `name`, `type`, `size`, `alt`,
  - `width`/`height` jika image.
- Media lama yang tidak dipakai (CV demo) boleh tidak dimigrasikan; simpan di arsip.
- Jika upload/confirm media via API kena `exceededCpu` di Free plan, upload ulang satu per satu lewat admin Media Library (hanya 4 file).
- Setelah import, jalankan:
  ```bash
  npx emdash media repair-usage --all --token "$EMDASH_TOKEN"
  ```
- Buat `media-map.json`:
  ```json
  {
    "c612447b-...": { "id": "01J...", "url": "/_emdash/api/media/file/..." }
  }
  ```
- Route `src/pages/api/media/[id].ts`:
  - cari ID di map,
  - 301 ke URL baru,
  - jika tidak ada, 410.

### 8.5 Draft dan revisi

- Bandingkan `draft` vs `published` per dokumen.
- Jika sama: import published saja.
- Jika berbeda:
  - import published sebagai published,
  - lalu update dengan `--draft` agar draft tersimpan,
  - verifikasi preview menampilkan draft.
- Revisi lama:
  - export ke `migration/output/revisions.json`,
  - simpan offsite,
  - tidak diimpor ke tabel internal EmDash.
- Dokumen yang deleted=1 tidak dimigrasikan; simpan di arsip.

### 8.6 Redirect dan URL legacy

| Sumber                            | Tujuan                                  | Status  |
| --------------------------------- | --------------------------------------- | ------- |
| `/projects`                       | `/`                                     | 301     |
| `/?lang=en`                       | `/`                                     | 301     |
| `/about?lang=id`                  | `/about`                                | 301     |
| `/admin`                          | `/_emdash/admin`                        | 302/301 |
| `/preview`                        | `/_emdash/admin`                        | 302     |
| `/api/media/<old-id>`             | URL media baru                          | 301     |
| `admin.txtfromrizkirmdhn.my.id/*` | `txtfromrizkirmdhn.my.id/_emdash/admin` | 301     |

Redirect 301 permanen untuk URL publik; 302 untuk admin/preview.

### 8.7 Validasi data

Script validasi harus gagal jika:

- ada slug duplikat lintas collection,
- ada entry tanpa title/slug,
- ada `cover`/`avatar`/`cv` yang media ID-nya tidak ditemukan,
- ada entry `gallery` tanpa `cover`,
- ada `group`/`order` setup yang tidak valid,
- ada tag yang gagal dibuat,
- ada body yang menghasilkan 0 block padahal body lama tidak kosong,
- jumlah entry per collection tidak sama dengan produksi,
- ada media yang ukurannya 0 atau MIME tidak cocok.

Output:

```json
{
  "documents": 19,
  "projects": 9,
  "experience": 3,
  "writing": 3,
  "about": 2,
  "gallery": 1,
  "setup": 0,
  "profile": 1,
  "media": 4,
  "taxonomyTerms": 40,
  "redirects": 0,
  "warnings": []
}
```

---

## 9. Konfigurasi Cloudflare

### 9.1 `wrangler.jsonc` (contoh staging)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "rizki-portfolio-emdash-staging",
  "main": "./src/worker.ts",
  "compatibility_date": "2026-09-05",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": true,
  "observability": { "enabled": true },
  "vars": {
    "EMDASH_SITE_URL": "https://rizki-portfolio-emdash-staging.<subdomain>.workers.dev",
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "rizki-portfolio-emdash-staging",
      "database_id": "<uuid>",
    },
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "rizki-portfolio-emdash-media-staging",
    },
  ],
  "kv_namespaces": [{ "binding": "CACHE", "id": "<kv-id>" }],
  "images": { "binding": "IMAGES" },
  "triggers": { "crons": ["* * * * *"] },
  "placement": { "mode": "targeted", "region": "<region D1>" },
  "env": {
    "production": {
      "name": "rizki-portfolio-emdash",
      "workers_dev": false,
      "routes": [
        {
          "pattern": "txtfromrizkirmdhn.my.id/*",
          "zone_name": "txtfromrizkirmdhn.my.id",
        },
      ],
      "vars": {
        "EMDASH_SITE_URL": "https://txtfromrizkirmdhn.my.id",
      },
      "d1_databases": [/* ulangi binding produksi */],
      "r2_buckets": [/* ulangi binding produksi */],
      "kv_namespaces": [/* ulangi binding produksi */],
      "images": { "binding": "IMAGES" },
      "triggers": { "crons": ["* * * * *"] },
    },
  },
}
```

Catatan:

- `SESSION` KV biasanya ditambahkan otomatis oleh `@astrojs/cloudflare`; untuk named environment/preview, pastikan binding-nya ada.
- `placement.region` harus sesuai region D1 primary. Cek dashboard D1; jangan menebak. Jika ragu, hapus dulu `placement` dan ukur latency.
- Jangan menaruh `EMDASH_ENCRYPTION_KEY`, kredensial Google OAuth, atau secret lain di file ini.

### 9.2 `astro.config.mjs` (contoh)

```js
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { d1, kvCache, r2 } from "@emdash-cms/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
      objectCache: kvCache({ binding: "CACHE" }),
    }),
  ],
  devToolbar: { enabled: false },
});
```

### 9.3 `src/worker.ts`

```ts
import handler, {
  createScheduledHandler,
  PluginBridge,
} from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

export default {
  ...handler,
  scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
```

`PluginBridge` aman meski belum ada plugin sandbox. Cron memakai `* * * * *`; jika diubah, samakan dengan `createScheduledHandler({ generalCron: "..." })`.

### 9.4 `src/live.config.ts`

```ts
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
  _emdash: defineLiveCollection({ loader: emdashLoader() }),
};
```

### 9.5 Auth admin tanpa Access (passkey + Google OAuth)

1. Pastikan `astro.config.mjs` **tidak** memuat `auth: access(...)`.
2. Deploy staging, buka `/_emdash/admin`, selesaikan setup wizard.
3. Daftarkan minimal dua passkey: satu di laptop, satu di ponsel/password manager.
4. Matikan self-signup: di **Settings → Security**, kosongkan daftar **allowed signup domains**. Jangan menambahkan domain apa pun (termasuk `gmail.com`). Dengan daftar kosong, self-signup tidak bisa membuat akun baru. Jangan gunakan invite untuk selain owner.
5. Siapkan recovery **Google OAuth** (dipilih):
   - gunakan akun Google dengan email yang sama seperti email owner saat setup,
   - buat OAuth client tipe Web application di Google Cloud,
   - redirect URI: `https://txtfromrizkirmdhn.my.id/_emdash/api/auth/oauth/google/callback` (dan staging),
   - `npx wrangler secret put EMDASH_OAUTH_GOOGLE_CLIENT_ID`,
   - `npx wrangler secret put EMDASH_OAUTH_GOOGLE_CLIENT_SECRET`,
   - tambahkan provider:
     ```js
     import { google } from "emdash/auth/providers/google";
     emdash({ /* ... */, authProviders: [google()] });
     ```
   - Google provider hanya dipakai untuk login owner yang sudah ada. Self-signup tetap tertutup karena allowed domains kosong; uji bahwa akun Google lain tidak bisa membuat akun.
6. Pastikan `robots.txt` men-disallow `/_emdash/`.
7. Rate limit auth sudah aktif di EmDash (passkey options, magic link, signup, OAuth device).
8. Opsional: tambahkan Cloudflare WAF rate limiting untuk `/_emdash/api/auth/*` jika ingin lapisan tambahan.
9. Jangan mengandalkan passkey yang dibuat di `localhost` atau `workers.dev` untuk domain produksi; passkey terikat hostname.

### 9.6 Secrets

| Secret                              | Keterangan                              |
| ----------------------------------- | --------------------------------------- |
| `EMDASH_ENCRYPTION_KEY`             | Enkripsi plugin secret; backup terpisah |
| `EMDASH_OAUTH_GOOGLE_CLIENT_ID`     | Recovery Google OAuth (dipakai)         |
| `EMDASH_OAUTH_GOOGLE_CLIENT_SECRET` | Recovery Google OAuth (dipakai)         |
| `EMDASH_PREVIEW_SECRET`             | Opsional; override preview HMAC         |
| `EMDASH_IP_SALT`                    | Opsional; salt IP komentar              |

Jangan commit `.env`/`.dev.vars`. Jangan membaca secret lewat `import.meta.env`; gunakan `process.env`/binding.

### 9.7 Object cache & route cache

- Launch: `objectCache: kvCache({ binding: "CACHE" })`.
- Jika nanti mengaktifkan Workers Cache:
  - `cache: { provider: cacheCloudflare() }`,
  - `routeRules` hanya untuk halaman publik,
  - `toolbar: "client"` agar editor tidak menerima HTML anonim ter-cache,
  - panggil `Astro.cache.set(cacheHint)` di setiap query.
- Jangan menaruh route rule `[...slug]` di root karena akan menangkap `/_emdash/*`.

### 9.8 Monitoring

- Workers Logs aktif.
- Alert: error rate 5xx, D1 latency, R2 usage, Cron failure.
- Cek `wrangler tail` untuk baris `[scheduled] Published ...` dan error.
- EmDash admin menampilkan peringatan jika scheduler tidak berjalan >5 menit.
- Free plan: simpan output `wrangler tail` saat cutover karena retensi log terbatas.

### 9.9 Backup di Free plan

- Sebelum cutover: catat D1 Time Travel bookmark dan buat dump offsite.
- Selama 30 hari rollback: buat dump offsite **mingguan** (Time Travel Free hanya 7 hari).
- Simpan `EMDASH_ENCRYPTION_KEY` di password manager, terpisah dari dump.
- Sync R2 media ke penyimpanan offsite setelah perubahan media besar.
- Aktifkan **Settings → Backups → Daily automatic backups** di EmDash (JSON, untuk inspeksi; bukan pengganti dump D1).
- Uji restore minimal sekali ke database uji sebelum cutover.

---

## 10. QA dan acceptance criteria

### 10.1 Definition of Done

- [ ] Semua URL publik lama merespons 200/301 yang benar.
- [ ] Semua 19 dokumen dan 4 media tersedia; tidak ada konten hilang.
- [ ] Body ter-render dengan heading, link, list, code, blockquote.
- [ ] Semua gambar memakai alt yang masuk akal.
- [ ] Desain light/dark, desktop/tablet/mobile tidak regresi.
- [ ] Modal kontak, CV, avatar, dan lightbox berfungsi dengan keyboard.
- [ ] Theme toggle tanpa flash dan menghormati prefers-color-scheme.
- [ ] Section order/visibility dan copy override berfungsi dari admin.
- [ ] Semua halaman publik punya title, description, canonical, OG, JSON-LD.
- [ ] `sitemap.xml`, `robots.txt`, `llms.txt` benar.
- [ ] Redirect `/projects`, `?lang`, `/admin`, `/preview`, media lama benar.
- [ ] `/_emdash/*` terlindungi login EmDash; tanpa sesi ditolak.
- [ ] Passkey login dan recovery berfungsi; self-signup mati.
- [ ] Setup/Gallery memakai collection per entry; publish per item berfungsi.
- [ ] OG dinamis 1200×630 berfungsi untuk home dan setiap entry.
- [ ] Admin bisa create/edit/publish/preview/revisi/schedule/upload/SEO.
- [ ] Maintenance mode 503 untuk publik, admin tetap bisa.
- [ ] Cron Trigger berjalan dan publish terjadwal.
- [ ] Backups: dump offsite + D1 Time Travel 7 hari + R2 sync; restore rehearsal lulus.
- [ ] Rollback runbook diuji.
- [ ] Dokumentasi diperbarui.
- [ ] Tidak ada secret di repo.
- [ ] Tidak ada dependensi/admin lama yang tersisa setelah cleanup.

### 10.2 Metrik performa

| Metrik           | Target                                                    |
| ---------------- | --------------------------------------------------------- |
| LCP mobile       | ≤ baseline + 10%                                          |
| CLS              | ≤ 0.1                                                     |
| INP              | ≤ 200 ms                                                  |
| Total JS publik  | lebih kecil dari baseline (tanpa React admin)             |
| TTFB             | tidak lebih buruk dari baseline                           |
| CPU admin (Free) | baseline dicatat; p50 ≤ 10 ms best effort                 |
| CPU OG (Free)    | disajikan dari R2 (pre-generated), bukan render on-demand |

Free plan tetap dipakai sesuai keputusan. Jika `exceededCpu` terlalu sering, catat frekuensinya dan tinjau ulang keputusan Free (Paid/Node), bukan menganggapnya bug aplikasi.

### 10.3 Uji keamanan

- Request `/_emdash/admin` tanpa sesi → halaman login, bukan dashboard.
- Request `/_emdash/api/content/projects` tanpa sesi → 401/403, bukan data.
- Endpoint signup/self-registration → ditolak.
- Passkey login, logout, dan rate limit berjalan.
- Recovery Google OAuth berhasil.
- Passkey yang dibuat di `localhost`/`workers.dev` tidak dipakai di produksi.
- Request media draft tanpa auth → 403/404.
- Request write dengan session tanpa `X-EmDash-Request` → ditolak.
- `robots.txt` men-disallow `/_emdash/`.
- Pastikan `global_fetch_strictly_public` tidak memblokir image transform.
- Pastikan R2 bucket tidak public dan `backups/` tidak terekspos.

### 10.4 Uji rollback

1. Catat bookmark D1 sebelum cutover (Free plan: hanya 7 hari).
2. Buat dump offsite final sebelum cutover.
3. Setelah cutover, lakukan perubahan konten uji.
4. Restore D1 ke database uji dari bookmark; verifikasi.
5. Import dump offsite ke D1/SQLite uji; verifikasi.
6. Kembalikan route ke Worker lama di staging; verifikasi.
7. Dokumentasikan waktu dan hasil.

---

## 11. Risiko dan mitigasi

| Risiko                                 | Dampak                       | Mitigasi                                                                                    |
| -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| **Free plan 10 ms CPU**                | admin gagal `exceededCpu`    | risiko diterima; catat baseline, retry, mitigasi cache/toolbar; tinjau Paid jika mengganggu |
| EmDash 1.x masih muda                  | bug/regresi                  | pin versi exact, baca upgrade guide, staging dulu, jangan auto-update                       |
| Admin publik tanpa Access              | percobaan login/abuse        | passkey kuat, self-signup mati, rate limit, WAF opsional                                    |
| Kehilangan semua passkey               | terkunci dari admin          | dua passkey + recovery Google OAuth                                                         |
| Passkey terikat hostname               | login gagal setelah pindah   | setup di domain produksi, bukan `workers.dev`                                               |
| Gallery bulk add kurang nyaman         | menambah banyak foto lambat  | upload media massal, duplicate entry, plugin admin di fase 8                                |
| Desain bergeser                        | brand regression             | screenshot diff, port CSS class per class                                                   |
| SEO turun                              | traffic hilang               | crawl parity, URL sama, canonical, sitemap, redirect                                        |
| OG pre-generation/R2                   | OG dinamis gagal/stale       | spike fase 1; Node script + R2, CI/nightly, fallback default; Worker hanya serve bytes      |
| Media URL lama 404                     | tautan/CV rusak              | media-map + redirect route                                                                  |
| D1 latency                             | halaman lambat               | object cache KV, targeted placement, ukur                                                   |
| Cron tidak jalan                       | scheduled post tidak publish | `emdash doctor`, `wrangler tail`, alert                                                     |
| Site import gagal                      | migrasi terhambat            | fallback REST script, uji di staging                                                        |
| Rollback kehilangan edit pasca-cutover | data loss                    | change freeze, export sebelum rollback, delta sync                                          |
| Free plan limits                       | transform/requests terbatas  | monitor; cache; kurangi varian gambar; upgrade hanya jika perlu                             |
| Time Travel hanya 7 hari               | rollback window pendek       | dump offsite mingguan + dump final sebelum cutover                                          |
| Backup tidak restorable                | disaster                     | uji restore, simpan key terpisah, R2 sync                                                   |

---

## 12. Timeline dan effort

| Fase                    |         Durasi | Output                                             |
| ----------------------- | -------------: | -------------------------------------------------- |
| 0. Persiapan & baseline |     0,5–1 hari | backup, screenshot, URL inventory                  |
| 1. Scaffold & staging   |       1–2 hari | Worker staging + passkey + CPU baseline + D1/R2/KV |
| 2. Schema & admin       |       1–2 hari | seed, collection, admin UAT awal                   |
| 3. Port desain          |       3–5 hari | situs publik Astro                                 |
| 4. Migrasi data         |       2–3 hari | konten produksi di staging                         |
| 5. Paritas fitur/SEO    |       2–3 hari | OG, sitemap, robots, llms, redirect, maintenance   |
| 6. QA & UAT             |       2–3 hari | sign-off                                           |
| 7. Cutover              |     0,5–1 hari | produksi EmDash                                    |
| 8. Stabilisasi          |      7–30 hari | cleanup + observasi                                |
| **Total efektif**       | **10–14 hari** |                                                    |

Saran penjadwalan: kerjakan Fase 0–2 di minggu pertama, Fase 3–4 di minggu kedua, Fase 5–7 di minggu ketiga. Jangan cutover di hari Jumat atau sebelum periode sibuk.

---

## 13. Checklist go/no-go cutover

### Sebelum cutover

- [ ] Staging lulus semua acceptance criteria.
- [ ] CPU baseline Free plan tercatat; risiko `exceededCpu` diterima.
- [ ] Konten staging = produksi (hash/jumlah sama).
- [ ] Semua media tampil, tidak ada 404.
- [ ] Passkey login + recovery staging diuji.
- [ ] Rencana setup passkey di domain produksi sudah jelas (dilakukan setelah route pindah).
- [ ] Backup D1/R2 final + bookmark (Free: 7 hari) + dump offsite.
- [ ] `EMDASH_ENCRYPTION_KEY` produksi disimpan di password manager.
- [ ] Route lama dicatat; perintah rollback disiapkan.
- [ ] Change freeze aktif.
- [ ] Maintenance window 15–30 menit diumumkan/dijadwalkan.
- [ ] Tidak ada deploy lain selama cutover.

### Setelah cutover

- [ ] `/` dan semua section 200.
- [ ] `/post/:slug` semua 200.
- [ ] `/sitemap.xml`, `/robots.txt`, `/llms.txt` benar.
- [ ] `/og.png` dan `/og/:slug.png` 200 dan PNG valid.
- [ ] Redirect 301 benar, termasuk `admin.` host.
- [ ] Admin login passkey di domain produksi.
- [ ] Dua passkey terdaftar dan recovery diuji di domain produksi.
- [ ] Media/CV/avatar 200.
- [ ] Cron berjalan.
- [ ] Tidak ada 5xx berulang di logs.
- [ ] 404 log kosong/aneh.
- [ ] Submit sitemap ke Search Console (jika perlu).
- [ ] Monitoring 48 jam.

---

## 14. Keputusan yang sudah ditetapkan dan yang masih terbuka

### Sudah ditetapkan

1. **Tanpa Cloudflare Access.** Admin memakai passkey EmDash; Access dimatikan.
2. **Cloudflare Free plan.** Time Travel 7 hari; backup offsite wajib. Risiko CPU 10 ms diterima; jika `exceededCpu` mengganggu, keputusan ditinjau ulang.
3. **Satu host.** Produksi hanya `txtfromrizkirmdhn.my.id`; `admin.` 301 ke `/_emdash/admin`.
4. **OG dinamis wajib saat launch.** Tidak boleh ditunda atau diganti static image permanen. Karena Free plan, implementasi utamanya pre-generation ke R2; render on-demand hanya fallback yang diukur.
5. **Setup & Gallery memakai collection EmDash standar**, satu entry per item/foto. Bukan singleton/repeater.
6. **Recovery passkey memakai Google OAuth.**

### Masih perlu dikonfirmasi

1. **Maintenance mode:** tetap dipertahankan saat launch?
   - Rekomendasi: ya; sekarang sudah ada dan implementasinya kecil.
2. **`/api/public`:** masih dipakai klien eksternal?
   - Rekomendasi: cek log; kalau nol, 410 setelah 30 hari.
3. **Statistik admin:** cukup Cloudflare dashboard, atau plugin analytics EmDash?
   - Rekomendasi: dashboard dulu; plugin nanti jika perlu.
4. **Search:** aktifkan EmDash search untuk projects/writing?
   - Rekomendasi: fase 8, bukan blocker.
5. **Jadwal cutover:** tanggal target dan periode change freeze?
6. **Draft produksi:** apakah ada draft yang belum published dan perlu dibawa?
   - Saat ini semua dokumen punya published snapshot; verifikasi delta saat migrasi.

---

## 15. Perintah referensi

```bash
# Local
npm install
npx emdash secrets generate --write .env
npm run dev                     # http://localhost:4321
npx emdash seed seed/seed.json --validate
npx emdash types
npx emdash doctor

# Build & deploy
npm run build
npx wrangler deploy
npx wrangler deploy --env production
npx wrangler tail

# Resource
npx wrangler d1 create rizki-portfolio-emdash
npx wrangler r2 bucket create rizki-portfolio-emdash-media
npx wrangler kv namespace create CACHE
npx wrangler secret put EMDASH_ENCRYPTION_KEY
# recovery Google OAuth (dipakai)
npx wrangler secret put EMDASH_OAUTH_GOOGLE_CLIENT_ID
npx wrangler secret put EMDASH_OAUTH_GOOGLE_CLIENT_SECRET

# Export produksi lama
npx wrangler d1 execute rizki-portfolio-english --remote --env production \
  --json --command "SELECT * FROM documents" > migration/output/documents.json
npx wrangler d1 execute rizki-portfolio-english --remote --env production \
  --json --command "SELECT * FROM media" > migration/output/media.json
npx wrangler r2 object get rizki-portfolio-media/<id> --file migration/output/media/<id>

# Migrasi
node migration/build-content.mjs
npx emdash seed migration/seed-with-content.json --database ./data.db --on-conflict=skip
npx emdash site export --output migration/output/site.emdash
npx emdash site import migration/output/site.emdash --analyze --token "$EMDASH_TOKEN"
npx emdash site import migration/output/site.emdash --plan <digest> --confirm --token "$EMDASH_TOKEN"
npx emdash media repair-usage --all --token "$EMDASH_TOKEN"

# OG pre-generation (Node, bukan Worker)
EMDASH_URL=https://txtfromrizkirmdhn.my.id EMDASH_TOKEN=... node scripts/generate-og.mjs
# script upload ke R2 og/{slug}.png; route /og hanya serve bytes

# Backup EmDash (D1)
npx wrangler d1 time-travel info rizki-portfolio-emdash
# ikuti dokumentasi EmDash untuk dump per tabel (FTS5 harus dikecualikan)
```

---

## 16. Ringkasan perubahan yang akan dihapus

| Area               |            Baris kode (perkiraan) | Pengganti                        |
| ------------------ | --------------------------------: | -------------------------------- |
| `src/admin/*`      |                            ~4.000 | Admin EmDash                     |
| `src/server/*`     |                            ~1.000 | EmDash API + adapter Cloudflare  |
| `src/routes/*`     |                              ~800 | Astro pages                      |
| `src/components/*` |                            ~1.500 | Komponen Astro (sebagian diport) |
| `src/lib/*`        |                            ~1.300 | EmDash API + lib kecil           |
| `migrations/*`     |                        SQL custom | Migrasi internal EmDash          |
| Dependensi         | TanStack, TipTap, Zod, Jose, dll. | Astro, EmDash, adapter           |

Perkiraan hasil akhir: **~2.500–3.500 baris** kode tema publik + konfigurasi, turun sekitar **60–70%** dari 8.600 baris. Admin, auth, revisi, media, SEO, redirect, dan backup tidak lagi dirawat sendiri.

---

## 17. Langkah berikutnya

1. Konfirmasi sisa keputusan di §14 (maintenance, `/api/public`, statistik, search, jadwal).
2. Buat branch/worktree `emdash-migration` dan tag `pre-emdash`.
3. Jalankan Fase 0 (baseline + backup + dump offsite).
4. Scaffold staging; selesaikan setup passkey dan **spike OG** sebagai gate pertama.
5. Setelah staging hidup dan OG lulus, kunci content model dan mulai port desain.

Rencana ini sengaja tidak mengubah kode apa pun. Semua langkah destruktif (hapus Worker/D1/R2 lama, hapus kode lama) baru dilakukan setelah cutover dan masa rollback selesai.
