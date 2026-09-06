# Rekomendasi

**Pilih B — Work comes first sebagai dasar iterasi berikutnya.** Akses ke identitas dan kontak tetap jelas, sementara proyek unggulan mendapat ruang untuk menunjukkan apa yang dibangun. Palet dan font tetap dekat dengan aplikasi sekarang, dan struktur utamanya dapat menggunakan field CMS yang tersedia.

A adalah pilihan paling hemat untuk perbaikan bertahap. C layak diuji sebagai pengayaan showcase Mailriz setelah struktur B dan isi studi kasus terbukti membantu pengunjung. Demo interaktif sebaiknya ditambahkan bila benar-benar menjelaskan kemampuan, bukan menjadi syarat untuk memahami proyek.

Rekomendasi ini merupakan penilaian desain, bukan kesimpulan dari eksperimen konversi. Masalah konten paling penting tetap: kontribusi, tantangan, dan hasil Mailriz belum didokumentasikan. Tidak ada layout yang dapat menggantikan bukti tersebut.

## Validasi dengan pengguna

Rekrut 5–8 orang yang mewakili perekrut, calon klien teknis/nonteknis, dan sesama pengembang. Samakan isi dan jumlah proyek pada semua arah; rotasi urutan agar arah pertama tidak selalu diuntungkan. Gunakan ponsel dan desktop.

| Tugas | Yang diamati | Hipotesis awal untuk diuji |
| --- | --- | --- |
| Lihat halaman selama 10 detik; jelaskan siapa Rizki dan apa yang ia kerjakan | Ketepatan pemahaman spesialisasi | B menjaga identitas sambil membuat karya lebih mudah diingat |
| Cari Mailriz dan jelaskan masalah yang diselesaikan | Waktu, salah klik, pemahaman ringkasan | Hierarki B membantu penilaian lebih cepat daripada feed |
| Temukan bukti kontribusi dan cara melihat kode | Apakah pengguna membedakan fakta dan bagian yang belum diisi | Detail yang jujur memberi ekspektasi lebih jelas |
| Cari cara menghubungi pemilik dan melihat CV | Keberhasilan tugas, waktu, posisi CTA saat mobile | CTA tetap ditemukan setelah membaca proyek |
| Jelaskan mana proyek nyata dan mana konsep | Salah persepsi atas label, screenshot, dan demo | Label konsep cukup jelas tanpa perlu penjelasan moderator |
| Coba C tanpa instruksi tentang selector | Penemuan proyek kedua/ketiga dan demo email | Interaksi memberi pemahaman tambahan, bukan menyembunyikan karya |
| Buka kategori Experience | Apakah disangka loading/error | Empty state memberi penjelasan dan langkah lanjutan |

Catat keberhasilan tugas, waktu, jumlah salah klik, kutipan peserta, dan kenyamanan baca. Ambang awal yang dapat disepakati untuk studi: setidaknya 4 dari 5 peserta memahami spesialisasi dan menemukan kontak tanpa bantuan; ini target eksperimen, bukan hasil yang sudah tercapai.

Lanjutkan pemeriksaan keyboard, pembaca layar, zoom 200%, kontras semua state, nama/teks panjang, serta konten CMS kosong/padat pada implementasi berikutnya. Verifikasi mockup yang sudah dilakukan dicatat di [04-verification.md](04-verification.md).

## Cara membuka

Buka [mockups/index.html](mockups/index.html) langsung di browser. File A/B/C juga dapat dibuka sendiri tanpa build atau server. Pilih arah, tema, dan lebar; gunakan “Buka penuh” untuk tampilan ukuran browser sebenarnya. Panel di pojok setiap mockup menjelaskan perubahan dan alasannya.

Jika browser membatasi iframe lokal, dari root repo jalankan:

```sh
python3 -m http.server 4177 --bind 127.0.0.1 --directory design-exploration
```

Lalu buka `http://127.0.0.1:4177/mockups/index.html`.

Semua artifact berada di `design-exploration/`. Kode aplikasi dan konten terbit tidak diubah. Screenshot baseline berasal dari aplikasi lokal, bukan situs produksi. Google Fonts bersifat opsional; layout tetap berjalan dengan font fallback saat offline.
