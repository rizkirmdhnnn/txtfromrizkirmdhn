# Audit UI saat ini

Dasar audit: kode dan screenshot aplikasi lokal pada 1440 × 1080 serta 390 × 844, tema terang/gelap. Ini evaluasi heuristik, bukan hasil user testing. [Screenshot desktop](screenshots/current-desktop-light.png) dan [mobile](screenshots/current-mobile-light.png) adalah tangkapan asli.

## Yang sudah baik

- Identitas personal konsisten: monogram, DM Sans, avatar, dan ilustrasi berwarna lembut terasa saling berhubungan.
- Bio singkat menjelaskan area kemampuan tanpa jargon berlebihan. Kontak dan CV terlihat sebelum daftar karya.
- Lebar baca terkontrol dan kelompok profil/aksi/kategori punya batas visual yang jelas.
- Navigasi kategori menggunakan link dengan `aria-current`. Detail memiliki URL sendiri dan mendukung Markdown, repositori, serta live demo bila ada.
- Dasar aksesibilitas sudah ada: skip link, focus-visible, label tombol tema, native dialog, reduced-motion, dan preferensi light/dark.
- CMS memisahkan save draft dan publish; proses desain tidak perlu mengganggu model publikasi yang sudah baik.

## Temuan

| Area | Bukti | Dampak dan usulan |
| --- | --- | --- |
| Hierarki | Nama/handle/avatar diulang di setiap entry; proyek memakai judul 17 px setelah metadata penulis | Informasi identitas berulang mengambil perhatian dari karya. A menjaga pola dengan penekanan proyek lebih kuat; B/C menghapus repetisi. |
| Spacing dan layout | Kartu maksimal 680 px, padding entry 30 px, rail 34 px ditambah gap | Desktop punya ruang kosong besar, tetapi isi proyek tetap sempit. B menggunakan dua kolom dengan area karya lebih luas; mobile kembali satu kolom. |
| Tipografi | Entry body 12 px, tags 9 px, read link 10 px; mobile body 11 px, beberapa detail visual 6 px | Membaca ringkasan dan menemukan aksi memerlukan perhatian lebih. Gunakan body utama 15–17 px, navigasi/aksi 13–14 px, metadata 12–14 px. Detail inbox C yang ilustratif dapat 11–12 px pada mobile. |
| Warna | Muted `#727983` di putih memberi rasio sekitar 4,39:1; di soft `#f5f6f8` sekitar 4,06:1 | Pasangan ini di bawah target 4,5:1 untuk teks normal. A/B menggelapkan muted menjadi `#626b77` (5,40:1 di putih; 4,99:1 di soft). Ini hasil perhitungan sRGB, bukan sertifikasi aksesibilitas seluruh halaman. |
| Target interaksi | Tombol profil/icon 39 px, tema 36 px, close dialog 30 px; read link tidak punya min-height | Di bawah target desain 44 × 44 px yang dipakai eksplorasi ini. Besarkan hit area tanpa membesarkan semua ikon. Ukuran di bawah 44 px tidak otomatis membuktikan pelanggaran setiap kriteria WCAG. |
| Konsistensi responsif | `.profile-actions`, `.mail-stack`, dan `.mail-chip` mendapat beberapa override di breakpoint yang sama | Ukuran efektif sulit ditelusuri dan mudah berbeda saat konten berubah. Eksplorasi memakai skala ukuran dan pola reflow yang eksplisit; tetap perlu pengujian nama/teks panjang. |
| Alur dan state | Kategori tanpa entry masih berakhir dengan tiga titik dekoratif; tidak ada penjelasan kosong | Pengunjung dapat mengira sedang memuat data. Beri pesan “Experience details are being prepared” dan jalur ke proyek. |
| Bukti kemampuan | Body Mailriz menyatakan kontribusi, tantangan, dan hasil belum ditambahkan | Layout saja tidak cukup membantu perekrut menilai kontribusi. Detail usulan memisahkan masalah, pendekatan, dan informasi yang masih perlu dilengkapi; tidak membuat hasil fiktif. |

## Lima prioritas

1. **Keterbacaan dan kontras.** Naikkan ukuran teks utama/sekunder dan perbaiki pasangan muted. Keberhasilan: ringkasan dan aksi bisa dibaca pada mobile tanpa zoom.
2. **Bobot visual karya.** Kurangi metadata penulis berulang dan bedakan proyek unggulan dari proyek tambahan. Keberhasilan: pengunjung mengenali Mailriz dan fungsi utamanya dalam pemindaian singkat.
3. **Aksi mudah dijangkau.** Target minimal 44 px, focus terlihat, dialog dapat ditutup dengan Escape dan mengembalikan fokus. Keberhasilan: alur proyek → detail → kembali → kontak berjalan dengan keyboard dan sentuh.
4. **Konteks proyek yang dapat dipercaya.** Jelaskan problem dan pendekatan; pisahkan fakta, konsep, dan informasi yang belum dikonfirmasi. Keberhasilan: pengunjung bisa membedakan karya terbit dan konsep.
5. **Kategori kosong yang jelas.** Ganti terminator ambigu dengan pesan spesifik dan aksi lanjutan. Keberhasilan: pengguna memahami bahwa pengalaman belum diisi, bukan gagal dimuat.

Tidak dilakukan audit penuh CMS, pembaca layar, seluruh URL, atau pengukuran performa produksi. Temuan tentang kecepatan pemahaman merupakan hipotesis untuk divalidasi.
