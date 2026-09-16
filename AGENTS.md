# AGENTS.md — HaloSanak

Panduan kerja untuk AI coding agent (opencode) saat membangun HaloSanak.

## 0. Wajib dibaca dulu di setiap sesi

File ini (`AGENTS.md`) dibaca otomatis oleh opencode di awal sesi. Tapi dua file berikut **tidak** otomatis terbaca — kamu (agent) wajib membukanya sendiri lewat file tool sebelum mengerjakan task apa pun, di setiap sesi baru:

- `prd-halosanak.md` (root project) — sumber kebenaran untuk *apa* yang dibangun: fitur, aturan bisnis, model data, acceptance criteria.
- `DESIGN.md` (root project) — sumber kebenaran untuk token visual: warna, tipografi, radius, shadow, motion. Jangan menebak nilai desain (hex warna, ukuran font, radius) — semua sudah dikunci di file itu.

Urutan prioritas kalau ada konflik: PRD (fitur/bisnis) → DESIGN.md (visual) → file ini (cara kerja teknis/proses). Kalau ketiganya tidak menjawab suatu situasi, berhenti dan tanya user (lihat §7).

## 1. Ringkasan proyek

HaloSanak adalah PWA offline-first untuk mendata satu pohon keluarga besar (garis ayah & ibu). Tidak ada backend, akun, atau sync — semua data lokal di IndexedDB, dan berpindah antar perangkat hanya lewat export/import file JSON. Lihat `prd-halosanak.md` untuk detail fitur dan aturan bisnis lengkap.

## 2. Stack & versi yang dikunci

```
SvelteKit 2 + Svelte 5 (runes) + TypeScript (strict mode)
Tailwind CSS 4 + DaisyUI 5
Dexie 4 + dexie-svelte-query
IndexedDB
vite-plugin-pwa + Workbox
SVG + d3-zoom
Zod (validasi & schema)
Vitest + fake-indexeddb (unit test)
Playwright (E2E)
Font: Nanum Gothic
```

Jangan mengganti library di atas dengan alternatif lain (misal state management lain, CSS framework lain, ORM lain) tanpa konfirmasi eksplisit ke user, walau ada opsi yang "lebih baru" atau "lebih populer".

## 3. Struktur folder yang diharapkan

```
src/
  lib/
    domain/          # logic murni: validasi relasi, cycle-detection, age calc — TANPA import Svelte/UI
    db/               # Dexie schema, migrations, query helpers (dexie-svelte-query)
    components/       # komponen UI reusable (Card, Modal, FormField, dst)
    features/
      tree/           # SVG graph + d3-zoom
      members/        # list, search, filter
      member-detail/
      member-form/
      settings/       # export/import/clear-all
    schemas/          # Zod schema untuk Member, Relationship, ExportFile
    utils/
  routes/             # SvelteKit routing tipis, panggil ke lib/features
static/
tests/
  unit/
  e2e/
```

Logic domain (validasi relasi, deteksi siklus, kalkulasi usia, kompresi foto) **harus** dipisah dari komponen UI supaya bisa di-unit-test tanpa render Svelte.

## 4. Konvensi kode

- TypeScript strict, tidak ada `any` tanpa alasan tertulis di komentar.
- Svelte 5: gunakan runes (`$state`, `$derived`, `$effect`), bukan pola Svelte 4 (`export let`, `$:`).
- Semua akses Dexie/IndexedDB wajib di-guard dari SSR (`browser` check dari `$app/environment`) — SvelteKit me-render di server saat build/dev, dan IndexedDB tidak ada di sana.
- Semua string yang tampil ke user berbahasa Indonesia, dan diambil dari satu file konstanta teks (`src/lib/strings.ts` atau serupa) — jangan hardcode string UI tersebar di banyak komponen, supaya konsisten dan mudah direvisi.
- Nama variabel/fungsi dalam bahasa Inggris; teks UI dalam bahasa Indonesia.
- Setiap fungsi domain yang disebut eksplisit di PRD (cycle detection, symmetric spouse link, age calculation, photo compression) harus punya unit test sebelum dianggap selesai.
- **Komponen UI (DaisyUI 5 First)**:
  - Selalu dahulukan komponen struktur dari DaisyUI untuk elemen interaktif/standar: tombol (`btn`, `btn-sm`, `btn-xs`), badge (`badge`, `badge-xs`), form input (`input`, `select`, `checkbox`, `textarea`), modal (`modal`, `modal-box`), feedback (`toast`, `alert`).
  - Dilarang merakit ulang elemen interaktif dari nol dengan utility manual Tailwind mentah (seperti `inline-flex items-center px-... py-... rounded-...`) jika DaisyUI sudah menyediakannya.
  - Untuk warna dan estetika, gunakan DaisyUI sebagai struktur dasar lalu timpa (override) menggunakan utility token tema proyek dari `src/app.css` / `DESIGN.md` (misal: `badge badge-xs bg-accent-warm/20 text-accent-warm border-accent-warm/40` atau `btn btn-sm bg-blue-primary text-white hover:bg-blue-primary-hover border-0`).
  - Gunakan class utility resmi yang dipetakan di `@theme` (`bg-surface`, `text-text-primary`, `border-border`, `rounded-md`, `shadow-card`, dll) alih-alih arbitrary syntax `[var(--...)]` atau `(--...)`.

## 5. Aturan bisnis kritis — jangan diinterpretasikan bebas

Bagian ini merangkum aturan dari PRD yang paling rawan salah tebak. Kalau ada keraguan, tanya user, jangan asumsikan.

**Relasi**
- Pasangan selalu dua arah: tambah/lepas satu sisi harus otomatis mengubah sisi lainnya dalam satu transaksi Dexie.
- Cycle detection: sebelum set A sebagai ayah/ibu B, telusuri leluhur A ke atas (ayah/ibu A, lalu ayah/ibu dari mereka, dst). Jika B ditemukan di jalur itu, atau A === B, tolak dan tampilkan pesan.
- Menghapus relasi ayah/ibu hanya menghapus edge, bukan menghapus anggota anak.
- Anggota dengan relasi apa pun (ayah/ibu/pasangan/anak) tidak boleh dihapus sampai semua edge dilepas dulu.

**Foto**
- Kompresi ke WebP, target akhir maksimum 400×400px dan 100KB. Kalau proses gagal (format tidak didukung, korup, dsb), profil tetap harus bisa disimpan tanpa foto — jangan blocking.

**Usia**
- Hanya dihitung dan ditampilkan jika tanggal lahir presisi "lengkap" (bukan "tahun saja"). Jika wafat dengan tanggal wafat lengkap, hitung usia saat wafat, bukan usia sekarang.

**Import/Export**
- Import menghapus SELURUH data lokal lama dan menggantinya. Ini destruktif — wajib ada konfirmasi eksplisit dan file harus divalidasi (Zod parse) dulu sebelum data lama dihapus. Kalau validasi gagal, data lama tidak boleh tersentuh sama sekali.

**Pohon**
- Drag pan tidak boleh trigger buka detail; hanya tap/klik singkat (bukan drag) yang membuka detail anggota.

## 6. Definition of Done per task

Sebuah task/fitur dianggap selesai kalau:
1. Ada unit test untuk logic domain yang ditambahkan/diubah.
2. Berfungsi offline (reload halaman tanpa network, data tetap ada).
3. Berfungsi di breakpoint mobile, tablet, dan desktop sesuai spek responsif di PRD §10.
4. Tidak ada regresi pada fitur sprint sebelumnya (jalankan test suite penuh, bukan cuma test baru).
5. Teks UI dalam bahasa Indonesia dan konsisten dengan file strings.
6. `pnpm check` / `tsc` tanpa error, lint bersih.

## 7. Kapan harus berhenti dan bertanya ke user

Jangan menebak dan lanjut jalan kalau menemukan situasi ini — stop, tanya dulu:
- Ada perilaku yang tidak dijelaskan di PRD maupun file ini (misal: apa yang terjadi kalau storage kuota browser penuh).
- Perubahan yang menyentuh skema data yang sudah ada (field baru, ubah tipe) — ini berdampak ke kompatibilitas export/import lama.
- Ingin mengganti/menambah dependency di luar daftar §2.
- Assumption soal algoritma layout pohon SVG untuk kasus kompleks (poligami, banyak generasi) yang belum ada contohnya.

## 8. Alur kerja per sprint

- Sprint mingguan. Di awal sprint, konfirmasi scope dari backlog dengan user sebelum mulai coding.
- Commit kecil dan sering, pesan commit deskriptif (`feat: tambah validasi cycle detection ayah/ibu`, bukan `update`).
- Di akhir sprint, tunjukkan hasil yang bisa dicoba langsung (build jalan, fitur bisa didemo), bukan cuma "kode sudah ditulis".
- Kalau task ternyata lebih besar dari perkiraan, laporkan ke user di tengah jalan, jangan diam-diam memperluas scope atau memotong fitur.

## 9. Testing

- Unit test (Vitest + fake-indexeddb): semua fungsi di `lib/domain` dan `lib/db`.
- E2E (Playwright): minimal per fitur besar — create member, buat relasi lengkap (2 generasi + pasangan), render pohon, export lalu import roundtrip, akses offline setelah reload.
- Test skenario data "aneh" secara sengaja: anggota tanpa relasi, anak dengan satu orang tua, satu anggota banyak pasangan, foto gagal diproses, import file JSON rusak.
