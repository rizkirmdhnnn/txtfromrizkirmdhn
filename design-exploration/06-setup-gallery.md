# Tab Setup dan Gallery

Eksplorasi 6 September 2026, setelah tab Setup versi pertama (foto meja + daftar gear bergambar kecil) dinilai belum pas dan halaman admin per item dinilai terlalu panjang.

## Arah tab Setup

Empat arah dibangun dengan CSS situs asli lewat `build-setup-mockups.py` → `mockups/setup-directions.html` (screenshot: `screenshots/setup-directions.png`). Semua memakai data yang sama: nama, catatan singkat, link, dan kategori.

- **A · Kartu gear** — grid kartu berfoto 4:3 per kategori. Paling menonjolkan barang, tapi menuntut foto untuk hampir semua item.
- **B · Lembar spesifikasi** — tanpa foto per item; kategori di kolom kiri, nama tebal + catatan di kanan. Gaya `/uses` klasik.
- **C · Ubin seperti Gallery** — ubin persegi kecil dengan nama di bawah, klik membuka lightbox yang sama dengan Gallery.
- **D · Penanda di foto meja** — nomor di atas foto meja, daftar bernomor di bawah. Paling khas, tetapi tiap item harus ditaruh di foto dari admin.

**Dipilih: B.** Foto meja tetap menjadi satu-satunya gambar pembuka (opsional), catatan panjang per item dihapus. Hasil implementasi: `screenshots/setup-b-desktop.png`.

## Admin satu halaman

Setup dan Gallery tidak lagi memakai editor dokumen penuh. `src/admin/item-manager.tsx` menampilkan satu halaman per bagian:

- Gallery: tombol **Add photos** mengunggah (dengan pengecilan otomatis) dan membuat satu draft per foto. Tiap baris: foto, judul, deskripsi, link.
- Setup: tombol **Add item** membuat baris kosong. Tiap baris: kategori (dengan saran dari kategori yang ada), nama, deskripsi, link. Kartu **Header** di atas mengedit foto meja dan pengantar yang tersimpan di dokumen profil.
- Perubahan tersimpan otomatis (`use-doc-autosave.ts`, tanpa revisi per ketikan). Status per baris: Draft, Changes not published, Published. Publish per baris; **Publish all** muncul saat lebih dari satu baris menunggu, misalnya setelah memindahkan urutan.
- Rute `/admin/setup/new`, `/admin/gallery/new`, dan halaman `$id` untuk dua kind ini dialihkan ke halaman daftarnya.

Yang sengaja tidak dibuat: slug, tanggal, tag, SEO, dan editor teks panjang untuk dua kind ini; drag-and-drop; album galeri.
