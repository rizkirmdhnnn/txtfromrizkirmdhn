# Peta keyword & konten

Target: pencari global berbahasa Inggris. Fokus utama = personal brand, fokus kedua = klaster teknis dari post yang sudah ada. Semua angka di bawah adalah arahan arah, bukan riset volume resmi — kalau mau presisi, cek Search Console setelah indeksasi berjalan 2–4 minggu.

## Brand (prioritas tertinggi)

| Keyword | Halaman target |
|---|---|
| `achmad rizki ramadhan` | Homepage (`/`) |
| `achmad rizki ramadhan portfolio` | Homepage + About |
| `rizkirmdhn` / `rizkirmdhn github` | Homepage (handle sudah ada di profil) |

Sinyal yang sudah terpasang: JSON-LD `Person` dengan `sameAs` GitHub/LinkedIn, nama di title semua halaman, `llms.txt`. Yang belum: profil GitHub sebaiknya menautkan balik ke situs ini (mutual linking memperkuat entity recognition).

## Klaster dari post existing

### 1. Cloudflare R2 / storage
Post: `juicefs-r2-macos` ("R2, meet Finder.")
- Keyword: `cloudflare r2 macos finder`, `juicefs r2`, `mount cloudflare r2 as local disk`, `r2 fuse driver`
- Ide lanjutan: **"Cloudflare R2 pricing vs S3 in 2026"** (comparison = tipe konten paling dikutip AI), benchmark upload/download dari Indonesia

### 2. Self-hosted email
Post: `mailriz`
- Keyword: `self-hosted email server guide`, `self hosted email worth it`, `mail server on vps`
- Ide lanjutan: breakdown SPF/DKIM/DMARC dari pengalaman nyata, cost breakdown per bulan

### 3. Server & homelab
Post: `server-kecil-kecilan`, `lamboserver`, `openwrt-orange-pi-zero-3`
- Keyword: `openwrt orange pi zero 3`, `home server on a budget`, `mini pc homelab`
- Post `openwrt-orange-pi-zero-3` adalah konten unik bernilai tinggi (device spesifik) — kandidat terkuat untuk rank & AI citation. Pastikan heading-nya berbentuk pertanyaan yang umum dicari ("How to install OpenWrt on Orange Pi Zero 3").

### 4. Tools & automation
Post: `dsh-tool-notify`, `fakepace`, `sweetlife`, `svelte-mastery`
- Keyword: `svelte project ideas`, `web notification tool`, `indonesian apps`
- Klaster ini lebih lemah untuk pencarian — gunakan untuk memperkuat portofolio, bukan target rank.

## Ide post baru (urut potensi pencarian)

1. **Comparison post** — "Cloudflare R2 vs S3: pricing, egress, and gotchas" (klaster #1; format comparison paling sering dikutip AI)
2. **How-to dengan device spesifik** — mis. lanjutan OpenWrt: "OpenWrt on Orange Pi Zero 3: setup, firewall, and tailscale"
3. **"Self-hosting email in 2026: is it still worth it?"** — opini + data biaya (klaster #2)
4. **Cost breakdown homelab** — tabel spesifikasi + biaya bulanan (klaster #3)
5. **"What I learned shipping X"** — engineering journey dengan angka konkret

Aturan menulis: lihat `seo-content-guidelines.md` (jawaban di paragraf pertama, tabel untuk perbandingan, sumber untuk klaim).

## Interlink yang disarankan

Pasangan post yang relevan untuk saling menautkan (markdown link di body, anchor text deskriptif — bukan "click here"):

| Dari | Ke | Anchor text saran |
|---|---|---|
| `juicefs-r2-macos` | `server-kecil-kecilan` | "the small server behind this setup" |
| `server-kecil-kecilan` | `openwrt-orange-pi-zero-3` | "the router that fronts the network" |
| `mailriz` | `server-kecil-kecilan` | "the VPS that runs the mail stack" |
| `openwrt-orange-pi-zero-3` | `server-kecil-kecilan` | "how the rest of the homelab is wired" |
| `dsh-tool-notify` | `sweetlife` | konteks proyek (bila memang terkait) |

Cara: buka post di admin → tambahkan link di body → publish. Link internal membantu crawl, distribusi otoritas, dan konteks topikal untuk AI.

## Kehadiran pihak ketiga (off-site)

AI lebih sering mengutip via sumber pihak ketiga daripada situs sendiri (brand 6.5× lebih mungkin dikutip lewat pihak ketiga):

- **Dev.to / Hashnode**: cross-post artikel teknis (OpenWrt, R2) dengan canonical balik ke `txtfromrizkirmdhn.my.id` — aman dari duplicate content, menambah permukaan kutipan
- **GitHub**: repo publik aktif + README rapi; link balik ke situs ini di profil dan repo terkait
- **LinkedIn**: tautkan situs ini di profil (sudah di `sameAs`), post ringkasan artikel baru
- **Reddit/forum** (r/selfhosted, r/openwrt, forum Orange Pi): jawab pertanyaan relevan dengan substansi — jangan spam link, sisipkan link hanya saat menjawab langsung kebutuhan (pertanyaan "how to" yang persis cocok dengan post kita)
- **YouTube**: video how-to untuk query yang sama dengan post (sering dikutip AI Overviews)

## Prioritas 90 hari

1. Minggu 1–2: selesaikan GSC verifikasi + submit sitemap; interlink pasangan post di atas
2. Minggu 3–4: tulis 1 comparison post (R2 vs S3) — format dengan peluang kutipan tertinggi
3. Minggu 5–8: cross-post 2–3 artikel existing ke Dev.to dengan canonical; perbaiki profil GitHub
4. Minggu 9–12: 1 post baru (OpenWrt lanjutan atau self-hosted email), cek GSC query report untuk arah berikutnya
