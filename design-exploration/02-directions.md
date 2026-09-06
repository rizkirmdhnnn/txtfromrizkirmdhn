# Tiga arah eksplorasi

Ketiganya memakai konten inti yang sama, UI berbahasa Inggris sesuai produk, avatar yang sama, dan interaksi dasar yang berfungsi. Catatan desain di pojok berbahasa Indonesia. Batas responsif utama: desktop lebar, reflow di 760 px, penyederhanaan di 480 px. Tidak ada animasi otomatis.

## A — Refined personal feed · konservatif

**Konsep:** memperbaiki kenyamanan membaca sambil mempertahankan pengalaman “personal space”.

```text
             monogram                    tema
             ┌──────────────────────────────┐
             │ identitas + avatar           │
             │ bio, kontak, CV, skills      │
             ├──────── kategori ────────────┤
             │ featured → proyek → visual   │
             │ proyek konsep berikutnya     │
             └──────────────────────────────┘
```

- Kartu diperluas dari 680 menjadi 760 px agar pembesaran teks tidak terlalu memperpanjang feed. Profil, tab, urutan vertikal, monogram, dan radius besar dipertahankan.
- Nama penulis tetap muncul per entry untuk menjaga karakter feed, tetapi rail dekoratif dihilangkan agar ruang isi lebih lapang.
- Font DM Sans; nama 29 px desktop, judul proyek 25 px, body 15–17 px, metadata 12–14 px. Tombol minimal 44 px; tombol aksi utama 46 px.
- Basis warna: background `#f8f9fb`, paper `#fff`, ink `#282d34`, muted `#626b77`, accent `#4b6c9d`, line `#dfe4ea`. Muted dan line sengaja diubah dari token asli untuk kontras dan batas komponen.
- Gelap tetap mengikuti charcoal asli; muted `#a8b0bc`, line `#414852` membuat label/batas lebih jelas.
- Akhir feed menyebut jumlah proyek; kategori kosong menyatakan kondisi dan menawarkan kembali ke proyek.

**Kelebihan:** biaya adopsi rendah, identitas asli paling kuat, cocok jika ingin perbaikan bertahap.

**Risiko:** tetap panjang pada mobile; repetisi penulis tidak memberi banyak informasi baru. Perubahan hierarki terbatas saat jumlah karya bertambah.

**Alasan memilih bentuk ini:** tidak menambahkan hero pemasaran atau kartu dashboard yang tidak sesuai portfolio personal. Perubahan difokuskan pada baca dan aksi.

## B — Work comes first · moderat

**Konsep:** pengunjung dapat memahami siapa pembuatnya dan melihat karya pada saat yang sama.

```text
monogram                                                tema
profil 284 px           kategori
nama + avatar          Selected work
bio                    ┌──────── Mailriz unggulan ────────┐
kontak / CV            │ ilustrasi besar → konteks → aksi │
skills                 └─────────────────────────────────┘
                       proyek konsep       proyek konsep
                       tulisan terbaru
```

- Lebar total 1180 px; profil sticky di kiri, karya di kanan. Profil kembali ke atas pada mobile agar urutan baca tetap alami.
- Proyek unggulan memakai visual besar, judul, manfaat, teknologi, dan tautan detail. Proyek tambahan memakai dua kolom yang turun menjadi satu di layar kecil.
- Identitas penulis tidak diulang. Ruang itu digunakan untuk ringkasan fungsi proyek dan konteks teknis, sehingga penilaian tidak bergantung pada gambar saja.
- Font DM Sans; nama 31 px, heading 29 px, judul proyek 25 px, body 15–16 px. Token warna sama dengan A, sehingga perubahan utama adalah arsitektur informasi.
- Radius 16 px untuk proyek unggulan dan 9 px untuk tombol membedakan wadah konten dari kontrol. Proyek tambahan tidak semuanya dimasukkan ke kartu berpagar yang identik.
- “From the notebook” menghubungkan tulisan dengan karya, tetapi tetap sekunder.

**Kelebihan:** memberi prioritas pada bukti kerja, kontak mudah ditemukan di desktop, dan perubahan dapat menggunakan field CMS yang ada.

**Risiko:** sidebar dapat membungkus nama panjang; mobile masih harus melewati profil. Dengan satu proyek saja, gunakan satu featured block tanpa memaksakan grid kosong. Data kontribusi dan outcome tetap harus ditulis pemilik.

**Alasan memilih bentuk ini:** kebutuhan portfolio adalah menilai karya, bukan melihat statistik atau membaca promosi. Karena itu tidak ada angka pencapaian dummy, logo klien fiktif, atau badge ketersediaan kerja.

## C — The working studio · berani

**Konsep:** portfolio menjadi ruang untuk melihat gagasan proyek bekerja. Satu panggung visual berubah saat proyek dipilih.

```text
monogram             kategori                     kontak / tema
From interface to infrastructure.                 identitas
┌─ pilih proyek ─────┬─ panggung konsep ──────────────────────┐
│ Mailriz           │ inbox + simulasi pesan masuk           │
│ Cloud drive       ├────────────────────────────────────────┤
│ Agent relay       │ fungsi proyek              buka detail │
└───────────────────┴────────────────────────────────────────┘
interface                infrastructure             working habit
```

- Identitas “fullstack & cloud” diterjemahkan menjadi demonstrasi antarmuka dan sistem. Headline 44–72 px menjadi satu elemen ekspresif; area lain tetap tenang.
- Panggung Mailriz menampilkan email dummy berlabel alias. “Try an incoming email” menambah pesan; “Reset demo” mengembalikan state. Tidak mengirim email atau memanggil backend.
- Selector proyek memakai tombol berlabel, state terpilih yang terlihat, dan pengumuman status. Pada mobile, selector menjadi deretan horizontal yang dapat digeser atau dijangkau dengan keyboard; bukan interaksi drag-only.
- Palet terang diperluas: background `#f0f4fa`, paper `#fff`, ink `#1c304f`, muted `#55677e`, accent `#315f9e`, stage `#e0ebf8`. Gelap: background `#101d30`, paper `#192a40`, ink `#e5eef9`, muted `#a9bcd3`, accent `#a5caff`, stage `#203b5d`.
- Biru berasal dari accent dan ilustrasi Mailriz yang sudah ada. Perluasan dipakai untuk membedakan ruang demonstrasi dari teks portfolio; bukan warna brand baru yang dipilih tanpa hubungan dengan produk. DM Sans dan monogram tetap dipertahankan.
- Ilustrasi storage tetap memakai pasangan hijau terang yang sama di kedua tema sebagai canvas proyek mandiri; teksnya tidak mewarisi warna gelap yang menurunkan kontras.

**Kelebihan:** khas untuk pembuat aplikasi/infrastruktur, memberi pengalaman nyata atas gagasan, dan mengurangi daftar karya vertikal di desktop.

**Risiko:** demo konsep dapat disalahartikan sebagai produk aktif; label konsep harus tetap terlihat. Proyek di luar pilihan aktif kurang terekspos. Panggung baru memerlukan pemeliharaan per proyek dan tidak boleh mengorbankan HTML yang dapat dirayapi atau akses URL detail.

**Alasan memilih bentuk ini:** interaksi punya fungsi penjelasan. Tidak memakai parallax, animasi terminal otomatis, atau dekorasi jaringan yang tidak menambah pemahaman.

## Keputusan bersama dan batas implementasi

Kontak menggunakan kanal terbit yang tersedia; CV ditandai contoh. Native dialog memberi modalitas dan Escape; fokus kembali ke pembuka. Mode mengikuti preferensi sistem saat belum dipilih, dan pilihan manual tersimpan dengan kegagalan storage yang ditangani.

Detail proyek yang seragam memuat problem → approach → scope/bukti yang masih perlu diisi. Dialog detail pada mockup adalah alat review; jika diimplementasikan, pertahankan route `/post/$slug` agar konten tetap dapat dibagikan, diindeks, dan dinavigasi dengan tombol Back.
