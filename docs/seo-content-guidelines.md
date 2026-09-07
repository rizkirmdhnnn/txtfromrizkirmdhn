# Pedoman konten yang mudah dikutip AI

Panduan menulis post di portfolio ini agar mudah diambil sebagai kutipan oleh AI search (Google AI Overviews, ChatGPT, Perplexity, Claude) sekaligus tetap enak dibaca manusia. Dasarnya: Google menilai konten AI dengan standar yang sama dengan Search biasa (E-E-A-T), sementara engine non-Google menghargai struktur yang mudah diekstrak.

## Struktur tulisan

1. **Jawab langsung di paragraf pertama.** Jangan simpan kesimpulan di akhir. Paragraf pembuka sebaiknya bisa berdiri sendiri sebagai jawaban utuh 40–60 kata — panjang ideal untuk diekstrak AI sebagai kutipan.
2. **Heading berbentuk pertanyaan atau klaim.** H2/H3 seperti "Why JuiceFS instead of rclone mount?" lebih mudah dicocokkan dengan query daripada "Latar belakang". Setiap section harus menjawab heading-nya.
3. **Satu paragraf, satu ide.** Paragraf panjang menurunkan kualitas ekstraksi.
4. **Pakai tabel untuk perbandingan** (mis. R2 vs S3, WireGuard vs Tailscale). Riset Princeton GEO: artikel comparison adalah tipe konten yang paling sering dikutip AI (~33%).
5. **Pakai numbered list untuk proses/langkah** — format paling mudah diambil untuk query "how to".

## Sinyal yang menaikkan peluang dikutip

Riset Princeton GEO (KDD 2024, diuji di Perplexity) — persentase adalah kenaikan visibility:

| Metode | Dampak | Cara menerapkan di sini |
|---|---|---|
| Kutip sumber | +40% | Link ke dokumentasi resmi, RFC, atau artikel sumber saat membuat klaim |
| Tambah statistik | +37% | Angka spesifik + tanggal + sumber (mis. "R2 egress $0/GB, per Juli 2026") |
| Kutipan ahli | +30% | Kutip maintainer/insinyur dengan nama dan afiliasi |
| Nada otoritatif | +25% | Tulis dari pengalaman langsung, hindari hedging berlebihan |
| Kejelasan | +20% | Kalimat pendek, hindari jargon tanpa penjelasan |
| Istilah teknis | +18% | Pakai terminologi domain yang tepat |
| Keyword stuffing | −10% | **Aktif menurunkan** — jangan ulang keyword paksa |

Kombinasi terbaik: **fluency + statistik**. Situs dengan otoritas rendah (kita) mendapat kenaikan paling besar dari kutipan sumber.

## Freshness

- **Tanggal terlihat otomatis** sekarang: halaman detail menampilkan "Published …" dan "Updated …", kartu writing menampilkan tanggal. Tidak perlu menambahkan manual.
- Update post lama minimal per kuartal untuk topik kompetitif — `updated_at` otomatis masuk `dateModified` schema dan sitemap.
- Saat memperbarui post: revisi klaim yang kadaluarsa, tambah referensi tahun berjalan, dan jangan lupa simpan (tanggal updated berubah otomatis).

## E-E-A-T checklist per post

- [ ] Paragraf pertama menjawab inti topik (40–60 kata, bisa berdiri sendiri)
- [ ] Ada pengalaman langsung: apa yang dicoba, apa yang gagal, apa yang dipakai sekarang
- [ ] Klaim teknis punya sumber (link) atau bukti (angka, output command)
- [ ] Heading deskriptif, bukan dekoratif
- [ ] Ada data/angka spesifik dengan tanggal bila relevan
- [ ] Post terkait saling ter-link (lihat `seo-keyword-map.md` untuk pasangan yang disarankan)
- [ ] `seoTitle`/`seoDescription` diisi bila judul tampilan kurang deskriptif

## Yang TIDAK boleh

- Jangan menulis konten terpisah "khusus AI" — Google menyebut ini risiko scaled content abuse. Satu versi konten untuk manusia dan mesin.
- Jangan pecah halaman jadi fragmen-fragmen kecil demi AI — struktur heading normal sudah cukup.
- Jangan memblokir bot AI kalau ingin dikutip — `robots.txt` kita sekarang mengizinkan bot search/citation dan hanya memblokir crawler training (CCBot, Bytespider, dll.).
- Konten ter-gate tidak bisa dikutip AI — semua post publik tetap terbuka.

## File mesin yang sudah aktif

- `llms.txt` — ringkasan situs untuk LLM (otomatis dari CMS, tidak perlu dirawat manual)
- JSON-LD `Person`/`WebSite`/`BlogPosting` — otomatis dari CMS
- `sitemap.xml` — otomatis dengan `lastmod`
