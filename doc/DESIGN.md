# DESIGN.md — HaloSanak

Sumber kebenaran visual untuk HaloSanak. Dipakai bersama `AGENTS.md` dan `prd-halosanak.md`. Kalau ada komponen baru dibuat AI dan tidak ada tokennya di sini, **jangan menebak** — cek dulu apakah bisa diturunkan dari prinsip di bawah, kalau tidak, tanya user.

## 1. Prinsip

- **Ceria & ringan**: latar terang, hangat, tidak steril. Warna hidup tapi disiplin — kegembiraan datang dari satu-dua aksen kuat, bukan dari banyak warna bersaing.
- **Clean & tegas di bentuk, hangat di warna**: sudut elemen tidak terlalu bulat (kesan rapi), tapi palet dan ilustrasi tetap terasa hangat dan personal — supaya nyaman dipakai lintas generasi, dari kakek-nenek sampai cucu.
- **Satu titik keberanian**: nama anggota (di card & detail) tampil besar dan tebal sebagai elemen paling hidup di setiap layar. Elemen lain di sekitarnya (border, label, ikon) tetap tenang supaya nama itu yang menonjol.
- **Hindari kesan generik AI**: tidak pakai kombinasi krem+terracotta atau dark+neon yang jadi ciri khas "template AI". Tidak ada label ALL-CAPS bertitik-titik, tidak ada tanda panah `→` di tombol, tidak ada radius seragam di semua elemen tanpa hierarki.

## 2. Warna

### Mode terang

| Token | Hex | Pemakaian |
|---|---|---|
| `bg-base` | `#FCFCF9` | Latar utama aplikasi (putih hangat, bukan putih steril) |
| `surface` | `#FFFFFF` | Kartu, modal, input |
| `surface-muted` | `#F3F4F1` | Latar section sekunder, filter bar |
| `border` | `#E4E5E1` | Border tipis kartu/input |
| `text-primary` | `#1F2420` | Teks utama |
| `text-secondary` | `#6B7268` | Domisili, label, teks sekunder |
| `blue-tint` | `#EAF4FE` | Latar avatar/badge Laki-laki, highlight lembut |
| `blue-soft` | `#9AD0F5` | Aksen sekunder, hover state ringan |
| `blue-primary` | `#3F9AE0` | Tombol utama, link, ikon aktif, fokus |
| `blue-primary-hover` | `#2C86CC` | Hover/pressed dari blue-primary |
| `pink-tint` | `#FDECF2` | Latar avatar/badge Perempuan |
| `pink-primary` | `#EE93B4` | Aksen avatar/badge Perempuan |
| `accent-warm` | `#FFB84D` | Aksen ceria untuk ilustrasi empty-state & sukses feedback saja — **jangan** dipakai di elemen UI struktural (tombol/nav) |
| `danger` | `#E4574B` | Aksi destruktif (hapus), pesan error |
| `success` | `#5FBF8B` | Feedback simpan sukses, toast |

### Mode gelap

| Token | Hex | Pemakaian |
|---|---|---|
| `bg-base` | `#15181C` | Latar utama |
| `surface` | `#1E2227` | Kartu, modal |
| `surface-muted` | `#262A30` | Section sekunder |
| `border` | `#333840` | Border tipis |
| `text-primary` | `#EDEFEC` | Teks utama |
| `text-secondary` | `#9AA0A6` | Teks sekunder |
| `blue-tint` | `#1E3A52` | Latar avatar Laki-laki |
| `blue-primary` | `#6FBBF0` | Tombol utama, link, fokus (dicerahkan untuk kontras di gelap) |
| `pink-tint` | `#3A2530` | Latar avatar Perempuan |
| `pink-primary` | `#F4A6C4` | Aksen avatar Perempuan (dicerahkan) |
| `accent-warm` | `#FFC670` | Versi gelap accent-warm |
| `danger` | `#F0776D` | Aksi destruktif |
| `success` | `#7ED4A6` | Feedback sukses |

**Anggota wafat**: foto/inisial grayscale (`filter: grayscale(100%)`) + border tipis `border` dengan opacity lebih tinggi di dark mode (`~40%`) supaya kartu tetap terlihat kontras dari latar gelap, sesuai PRD §9.

## 3. Tipografi

Font tunggal: **Nanum Gothic** (sesuai PRD, tidak diganti).

| Peran | Ukuran/Line-height | Weight | Pemakaian |
|---|---|---|---|
| Display | 28px / 34px | 800 (extrabold) | Judul layar utama (jarang dipakai) |
| Heading | 20px / 26px | 700 (bold) | Judul section, header modal |
| Nama anggota (card) | 16px / 20px | 700 (bold) | Nama di tree card & member card — elemen paling hidup di kartu |
| Nama anggota (detail) | 22px / 28px | 800 (extrabold) | Nama di header detail anggota |
| Body | 14px / 20px | 400 (regular) | Deskripsi, isi form |
| Secondary/domisili | 13px / 18px | 400 (regular), warna `text-secondary` | Domisili di kartu, subtitle |
| Label/caption | 12px / 16px | 600 (semibold) | Label field form, badge kecil |

Catatan: karena preferensi "tebal & besar" untuk heading, jangan turunkan weight nama jadi regular walau di ruang sempit (tree card mobile) — kalau perlu, kecilkan ukuran, bukan weight-nya.

## 4. Bentuk, spacing, bayangan

| Token | Nilai | Pemakaian |
|---|---|---|
| `radius-sm` | 4px | Badge, chip, filter pill |
| `radius-md` | 8px | Tombol, input, tree card, member card |
| `radius-lg` | 12px | Modal, bottom sheet |
| `shadow-card` | `0 1px 2px rgba(0,0,0,0.05)` | Tree card, member card |
| `shadow-modal` | `0 8px 24px rgba(0,0,0,0.12)` | Modal, popover, bottom sheet |
| `space-unit` | 4px | Basis skala spacing (pakai kelipatan: 4/8/12/16/24/32) |

Sudut sengaja tidak terlalu bulat (clean, bukan pill-shape) — ini pembeda dari kesan "SaaS card generik" yang biasanya bulat seragam di semua elemen.

## 5. Ikon & ilustrasi

- Ikon navigasi/aksi: line icon, stroke 1.5–2px, **rounded line-cap & line-join** (bukan siku tajam) — memberi sentuhan lembut/organik tanpa jadi playful berlebihan.
- Ilustrasi empty-state (mis. "Tidak ada anggota ditemukan"): gaya line-art sederhana dengan satu aksen warna (pakai `accent-warm` atau `blue-soft`), bentuk sedikit organik/melengkung, bukan ilustrasi flat-vector penuh warna ala stock illustration.
- Satu ilustrasi = satu aksen warna. Jangan campur banyak warna di satu ilustrasi kecil, supaya tetap terasa ringan bukan ramai.

## 6. Motion

Sesuai PRD §9: singkat, tidak menghambat interaksi.

- Transisi tab: fade 150–200ms.
- Tap kartu/tombol: scale-down halus ke `0.97` selama ~100ms saat pressed, kembali saat release — memberi rasa "ceria/responsif" tanpa bounce berlebihan.
- Toast sukses (simpan/export/import): slide-up + fade, 200ms masuk, tahan ~2.5s, fade keluar.
- Hormati `prefers-reduced-motion`: matikan scale/slide, sisakan fade instan.

## 7. Catatan komponen kunci

**Tree card** — avatar 32–40px (mobile) dengan ring warna tipis sesuai gender (`blue-primary`/`pink-primary`), nama bold 2 baris max, domisili 1 baris `text-secondary`, `radius-md`, `shadow-card`. Grayscale total jika wafat (termasuk ring warnanya).

**Member card** (list) — struktur sama seperti tree card tapi avatar sedikit lebih besar (48–56px) karena lebih banyak ruang di grid.

**Detail modal/screen** — header sticky, nama pakai skala "Nama anggota (detail)", background `surface`, radius-lg khusus di desktop (modal tengah), full-screen tanpa radius di mobile.

**Tombol** — primer: bg `blue-primary`, teks putih, bold, `radius-md`. Sekunder: outline `blue-primary` di atas `surface`. Destruktif (hapus): teks/bg `danger`, dipakai sangat terbatas (hanya di aksi hapus & konfirmasi permanen) supaya tetap terasa serius saat muncul.

**Badge gender** — background `blue-tint`/`pink-tint`, teks/ikon `blue-primary`/`pink-primary`, `radius-sm`.

## 8. Hal yang sengaja dihindari

Supaya tidak jatuh ke pola default AI-generated UI:
- Tidak ada label ALL-CAPS bertracking lebar di atas heading.
- Tidak ada tanda panah `→` di akhir teks tombol/link.
- Tidak ada radius seragam di semua elemen tanpa memandang hierarki (lihat §4 — tiga tingkat radius berbeda fungsi).
- Tidak ada shadow abu-abu generik yang sama persis di setiap kartu tanpa mempertimbangkan konteks (modal butuh shadow lebih kuat dari card).
- Ilustrasi empty-state tidak memakai gaya flat-illustration stock yang penuh warna — cukup line-art + satu aksen.
