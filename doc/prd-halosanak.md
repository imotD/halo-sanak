# HaloSanak — Product Requirements Document

## 1. Ringkasan produk

**HaloSanak** adalah web app/PWA offline untuk membuat dan menjelajahi satu pohon keluarga besar. Setiap pengguna mengelola data lokal miliknya sendiri, dapat bebas mengisi atau mengubah catatan, lalu membagikan snapshot melalui file JSON.

Produk bersifat mandiri. Tidak ada master data global, akun, sinkronisasi, merge, atau kolaborasi waktu nyata.

## 2. Masalah yang diselesaikan

Keluarga membutuhkan cara sederhana untuk mendata keluarga besar dari pihak ayah dan ibu dalam satu pohon terhubung. Pengguna juga perlu membagikan salinan data ke saudara tanpa backend atau internet permanen.

## 3. Sasaran produk

- Pengguna bebas membangun satu graph keluarga dari anggota mana pun.
- Pohon menampilkan jalur pihak ayah dan ibu sebagai satu struktur terhubung.
- Data tetap tersedia offline setelah app pertama kali dimuat atau dipasang.
- Pengguna dapat export seluruh data, termasuk foto, sebagai satu JSON mandiri.
- Pengguna lain dapat import JSON dan memperoleh salinan penuh yang boleh mereka ubah bebas.
- Penggunaan tetap ringan, minimalis, cepat, dan mudah untuk lintas generasi.

## 4. Bukan sasaran produk

- Backend, API, akun, login, cloud sync, telemetry, tracking.
- Kolaborasi, usulan perubahan, merge konflik, atau sumber data resmi.
- PDF, PNG, GEDCOM, GEDZIP, album foto, dokumen, sumber sejarah.
- PIN in-app, enkripsi backup/database, auto-backup folder.
- Status/tanggal pernikahan atau cerai.
- Relasi selain ayah, ibu, pasangan, anak.
- Dashboard statistik kompleks.

## 5. Pengguna dan model data

### Pengguna

- Siapa pun dapat memakai HaloSanak.
- Pengguna utama awal: keluarga pengguna, dengan pengguna sebagai anak sulung yang mendata keluarga besar.
- Saudara dapat menerima file JSON, meng-import, lalu bebas membuat versi data sendiri.

### Model kepemilikan data

- Tiap perangkat/browser menyimpan data lokal terpisah.
- Tidak ada master data atau sinkronisasi antar perangkat.
- Export menghasilkan snapshot seluruh data pada perangkat saat export.
- Import **secara sengaja menghapus semua data lokal lama** dan menggantinya dengan snapshot file import.
- Perubahan pengguna lain tidak kembali otomatis ke perangkat pengirim.

## 6. Kontrak data anggota

### Field wajib

| Field | Aturan |
|---|---|
| Nama lengkap | Teks wajib; nama duplikat diperbolehkan |
| Jenis kelamin | `Laki-laki` atau `Perempuan` |
| Domisili | Teks bebas; boleh kota, provinsi, negara, atau detail yang diketahui |

### Field opsional

| Field | Aturan |
|---|---|
| Foto profil | Satu foto; JPG, PNG, WebP; sumber maksimum 10 MB |
| Tanggal lahir | Tanggal lengkap atau tahun saja |
| Sudah wafat | Penanda boolean, terpisah dari tanggal wafat |
| Tanggal wafat | Tanggal lengkap atau tahun saja; hanya tersedia bila Sudah wafat aktif |
| Pekerjaan | Satu teks bebas |
| Deskripsi | Teks bebas maksimum 1.000 karakter |

### Foto

- Foto disimpan sebagai WebP teroptimasi.
- Ukuran hasil maksimum `400 × 400 px` dan `100 KB`.
- Jika foto gagal diproses, pengguna tetap dapat menyimpan profil tanpa foto.
- Jika foto kosong, tampilkan inisial huruf pertama nama lengkap.
- Jika Sudah wafat aktif, foto atau placeholder tampil grayscale.

### Usia

- Umur hanya tampil pada detail anggota.
- Jika tanggal lahir lengkap tersedia dan anggota hidup, tampilkan umur saat ini.
- Jika tanggal lahir dan tanggal wafat lengkap tersedia, tampilkan umur saat wafat.
- Jika hanya tahun tersedia atau tanggal lahir kosong, umur tidak ditampilkan.
- Data lahir lebih baru dari wafat tetap diizinkan; pengguna bertanggung jawab atas akurasi sejarah.

## 7. Relasi keluarga

### Relasi yang didukung

- Ayah
- Ibu
- Pasangan
- Anak

Saudara kandung adalah relasi turunan: anggota yang berbagi ayah atau ibu dianggap saudara. Tidak ada input relasi saudara manual.

### Aturan relasi

- Anak boleh hanya punya ayah, hanya ibu, atau keduanya.
- Ayah harus anggota Laki-laki.
- Ibu harus anggota Perempuan.
- Satu anggota dapat memiliki banyak pasangan.
- Pasangan harus terdiri dari satu anggota Laki-laki dan satu anggota Perempuan.
- Relasi pasangan simetris: tambah A sebagai pasangan B otomatis menambah B sebagai pasangan A; pelepasan juga dua arah.
- Tidak ada pasangan utama, status pasangan, tanggal relasi, atau urutan semantik. Tampilan pasangan mengikuti urutan ditambahkan.
- Orang tua anak boleh tidak memiliki relasi pasangan.
- Melepas relasi pasangan tidak mengubah ayah/ibu anak.
- Melepas relasi ayah/ibu hanya menghapus edge relasi; anak tetap tersimpan.
- Tolak relasi ke diri sendiri dan siklus leluhur.

### Membuat dan mengubah relasi

Pengguna dapat:
- Menambah anggota tanpa relasi, lalu menghubungkan kemudian.
- Memilih anggota lama sebagai ayah, ibu, atau pasangan dari form tambah/edit.
- Dari detail anggota, tambah atau pilih ayah, ibu, pasangan, dan anak.
- Menambah anggota baru langsung dari profil sebagai relasi tertentu.
- Ketika tambah anak dari profil orang tua, app otomatis mengisi ayah atau ibu berdasarkan gender; pengguna tetap dapat mengubah sebelum simpan.
- Mengubah atau melepas semua relasi dari form edit atau detail profil.

### Menghapus anggota

- Anggota dengan relasi tidak dapat dihapus.
- App menjelaskan semua relasi yang harus dilepas lebih dulu.
- Anggota tanpa relasi dapat dihapus setelah konfirmasi nama lengkap dan peringatan permanen.

## 8. Fitur inti

### 8.1 Pohon

- Menampilkan seluruh anggota dalam satu graph keluarga.
- Anggota tanpa relasi tetap muncul sebagai cabang terpisah.
- Semua pasangan tampil sebagai relasi terpisah.
- Anak dari dua orang tua dihubungkan dari unit dua orang tua.
- Anak dengan satu orang tua dihubungkan dari orang tua yang tersedia.
- Pan horizontal/vertikal harus smooth.
- Zoom masuk, zoom keluar, dan pas ke layar.
- Drag tidak membuka profil; hanya tap/klik singkat pada kartu yang membuka detail.

**Kartu pohon:**
- Foto atau inisial.
- Nama lengkap, maksimum dua baris lalu elipsis.
- Domisili, maksimum satu baris.
- Perlakuan grayscale jika wafat.
- Warna lembut berbeda untuk avatar/inisial Laki-laki dan Perempuan.
- Tidak menampilkan pekerjaan, atau tanggal.

### 8.2 Anggota

- Menampilkan semua anggota secara default.
- Pencarian nama parsial dan tidak peka huruf besar/kecil.
- Filter gabungan: domisili, jenis kelamin, hidup/wafat.
- Urut nama lengkap A–Z.
- Filter aktif memiliki badge dan aksi reset.
- Hasil kosong tampilkan ilustrasi kecil, teks `Tidak ada anggota ditemukan`, serta aksi reset.

**Kartu anggota:**
- Foto atau inisial.
- Nama lengkap, maksimum dua baris.
- Domisili, maksimum satu baris.
- Efek grayscale jika wafat, tanpa label teks wafat.
- Tidak menampilkan umur atau pekerjaan.

### 8.3 Detail anggota

Urutan detail:
1. Foto/inisial dan nama.
2. Status wafat.
3. Data dasar.
4. Deskripsi.
5. Relasi.

- Bila status wafat aktif tanpa tanggal wafat: tampil `Sudah wafat`.
- Nama ayah, ibu, pasangan, dan anak dapat ditekan untuk membuka detail mereka.
- Setiap blok Ayah, Ibu, Pasangan, Anak memiliki aksi kecil `+`.

### 8.4 Tambah/edit anggota

Urutan form:
1. Foto.
2. Nama lengkap.
3. Jenis kelamin.
4. Domisili.
5. Tanggal lahir.
6. Sudah wafat dan tanggal wafat.
7. Pekerjaan.
8. Deskripsi.
9. Relasi.

- Gender berupa dua tombol eksplisit: Laki-laki, Perempuan.
- Tanggal lahir/wafat memilih presisi: Tanggal lengkap atau Tahun saja.
- Switch Sudah wafat membuka input tanggal wafat.
- Bagian relasi dapat dibuka/tutup di bawah form.
- Semua create/edit memakai Simpan eksplisit.
- Tutup form dengan perubahan belum disimpan menampilkan `Perubahan belum disimpan. Buang perubahan?` dengan aksi Tetap Edit dan Buang Perubahan.
- Simpan sukses menampilkan feedback Bahasa Indonesia.

### 8.5 Pengaturan dan file data

Menu Pengaturan hanya memuat operasi seluruh dataset:
- Export JSON.
- Import JSON.
- Hapus Semua Data.

**Export JSON**
- Mencakup semua anggota dan foto terkompresi.
- Nama file: `halosanak-<tanggal>.json`.
- Feedback sukses memuat jumlah anggota yang diexport.

**Import JSON**
- Tampilkan nama file dan jumlah anggota impor.
- Tampilkan peringatan tegas bahwa seluruh data lokal lama akan dihapus.
- Format rusak/tidak didukung ditolak tanpa mengubah data lama.
- Setelah sukses, Pengaturan ditutup, Pohon hasil import dibuka, dan jumlah anggota ditampilkan.

**Hapus Semua Data**
- Tersedia sebagai aksi destruktif.
- App menyarankan export backup, tetapi pengguna dapat lanjut setelah konfirmasi.

**Operasi panjang**
- Export, import, dan hapus memperlihatkan loading.
- Aksi bersaing dinonaktifkan sampai operasi selesai.

## 9. Pengalaman pengguna dan visual

### Prinsip

- Mobile-first responsive.
- Minimalis: teks sedikit, ikon garis sederhana, ruang kosong luas.
- Permukaan putih/abu bersih dengan aksen biru.
- Border tipis, sudut membulat sedang, bayangan sangat halus.
- Font seluruh UI: Nanum Gothic.
- Animasi kartu, angka, dan dekorasi diperbolehkan, tetapi tetap singkat dan tidak menghambat interaksi.
- Transisi tab memakai fade 150–200ms.

### Tema

- Mode terang dan gelap.
- Toggle tema langsung mengubah UI dan tersimpan lokal.
- Dark mode memakai permukaan gelap netral dengan aksen biru.
- Anggota wafat tetap grayscale dengan border/overlay halus agar terlihat di dark mode.

## 10. Responsif dan navigasi

### Mobile

- Header ringkas: logo/HaloSanak kiri, toggle tema kanan atas.
- Bottom navigation icon-only: Pohon, Anggota, Tambah, Pengaturan.
- Form tambah/edit dan detail anggota adalah modal layar penuh.
- Bottom navigation tersembunyi ketika form/detail layar penuh aktif.
- Header sticky pada Anggota dan Pengaturan.

**Pohon mobile**
- Kanvas memakai seluruh ruang tersedia.
- Kartu kompak: avatar 32–40px, nama dua baris, domisili satu baris.
- Zoom jauh mempertahankan kartu mini, bukan berubah jadi titik.
- Kontrol zoom bertumpuk kanan bawah di atas bottom nav.
- Jumlah anggota di kiri bawah.
- Pas ke layar adalah ikon tanpa teks dengan label aksesibilitas.

**Anggota mobile**
- Pencarian muncul langsung saat tab dibuka.
- Filter berupa ikon di samping pencarian dan membuka bottom sheet.
- Grid adaptif: dua kartu/baris bila layar kecil; kolom bertambah hanya ketika kartu tetap terbaca.

**Detail mobile**
- Full-screen modal.
- Header: kembali kiri, Edit dan menu overflow kanan.
- Hapus berada di menu overflow.
- Menekan relasi mengganti konten pada modal sama; tombol kembali menuju profil sebelumnya.

**Form mobile**
- Full-screen modal.
- Header: Batal kiri, judul tengah, Simpan kanan.

### Tablet 768–1023px

- Bottom navigation icon-only seperti mobile.
- FAB tambah berada kanan bawah.
- Grid anggota maksimum empat kartu/baris.

### Desktop

- Header sticky.
- Kiri: logo, HaloSanak, Pohon, Anggota.
- Kanan: toggle tema dan ikon Pengaturan.
- Semua ikon tanpa label memiliki tooltip hover, label pembaca layar, dan focus state keyboard jelas.
- FAB Tambah Anggota berupa ikon `+` di kanan bawah.

**Pohon desktop**
- Viewport penuh di bawah header.
- Zoom masuk, zoom keluar, pas ke layar di kanan atas.
- FAB Tambah Anggota di kanan bawah.
- Pan dengan drag mouse; zoom dengan scroll mouse.

**Anggota desktop**
- Toolbar satu baris: input pencarian lebar di kiri, filter di kanan.
- Filter membuka popover kecil.
- Grid responsif hingga lima kartu/baris.
- Klik kartu membuka detail modal tengah.

**Detail desktop**
- Modal tengah 560–640px dengan overlay gelap transparan.
- Konten scroll bila perlu.
- Relasi sebagai blok di bawah detail.

**Form desktop**
- Modal tengah lebar dan dapat scroll.
- Dua kolom pada layar lebar.
- Bagian relasi full-width di bawah.
- Footer sticky: Batal kiri, Simpan kanan.

**Pengaturan desktop**
- Ikon roda gigi membuka dropdown: Export JSON, Import JSON, Hapus Semua Data.

## 11. Offline dan privasi

- PWA dapat dipasang di HP/laptop.
- Berfungsi offline setelah pertama kali dimuat atau dipasang.
- Penyimpanan browser lokal adalah sumber data perangkat.
- Tidak ada server, akun, tracking, analytics, API eksternal, atau sinkronisasi.
- Tidak ada PIN in-app; keamanan bergantung pada perangkat/browser pengguna.
- App perlu meminta persistent storage bila browser mendukung agar risiko eviction data berkurang.

## 12. Stack teknis yang disepakati

```text
SvelteKit 2 + Svelte 5 + TypeScript
Tailwind CSS 4 + DaisyUI 5
Dexie 4 + dexie-svelte-query
IndexedDB
vite-plugin-pwa + Workbox
SVG + d3-zoom
d3-zoom
Zod
Vitest + fake-indexeddb
Playwright
Nanum Gothic
```

Ketentuan teknis:
- UI state memakai Svelte 5 runes/stores.
- Data query reaktif memakai `dexie-svelte-query`.
- Akses Dexie/IndexedDB hanya pada browser runtime; SSR SvelteKit wajib diguard.
- DaisyUI wajib v5 untuk kompatibilitas Tailwind CSS v4.

## 13. Agile delivery

- Sprint berdurasi satu minggu.
- Setiap backlog item harus punya acceptance criteria dan QA otomatis.
- Feedback keluarga dipakai untuk menyusun backlog sprint berikutnya.
- Sprint 1 fokus: data profil anggota, relasi, pohon dasar, dan persistence offline.

### Backlog awal terprioritas

| Prioritas | Epic | Hasil |
|---|---|---|
| P0 | Fondasi app | SvelteKit PWA, tema, layout responsif, IndexedDB, model data dan validasi |
| P0 | Anggota | CRUD profil, foto teroptimasi, status wafat, usia detail, validasi form |
| P0 | Relasi | Ayah/ibu/pasangan/anak, aturan konsistensi, larangan siklus, hapus aman |
| P0 | Pohon | SVG graph, pasangan/anak, pan/zoom/fit, tree card dan detail navigation |
| P1 | Anggota discovery | Grid adaptif, pencarian, filter, empty states |
| P1 | Pengaturan data | Export/import JSON, clear-all, konfirmasi destruktif, error/loading states |
| P1 | PWA/reliability | Offline shell, persistent storage request, error boundaries |
| P1 | QA | Unit DB/domain dan Playwright PWA offline/responsive E2E |
| P2 | Polish | Motion, tooltip, aksesibilitas detail, visual regression testing |

## 14. Acceptance criteria produk

- Pengguna dapat membuat anggota dengan nama lengkap, gender, domisili; penyimpanan lokal bertahan setelah reload offline.
- Pengguna dapat membuat satu pohon dari pihak ayah dan ibu melalui relasi eksplisit.
- App menolak self-link dan ancestral cycle.
- Pasangan multi-link tampil tanpa mengubah relasi anak.
- Anggota wafat tampak grayscale; usia hanya tersedia pada detail dengan tanggal lahir lengkap.
- Foto besar diproses menjadi WebP maksimum 400×400px/100KB atau profil masih dapat disimpan tanpa foto.
- Pohon dapat pan/zoom/fit dengan lancar pada mouse dan touch.
- Daftar anggota mendukung pencarian nama dan kombinasi filter.
- Export menghasilkan JSON lengkap dengan semua foto; import valid menggantikan seluruh data hanya setelah konfirmasi; import rusak tidak mengubah data lama.
- App dapat di-install dan dibuka offline setelah service worker aktif.
- UI memenuhi semua aturan responsive, tema, keyboard focus, tooltip, dan label aksesibilitas yang tercatat di dokumen ini.
