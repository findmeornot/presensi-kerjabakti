# Kebersihan Asrama — Sistem Absensi Kerja Bakti

Sistem absensi dan monitoring kegiatan kebersihan penghuni asrama **Lorong 3** dan **Lorong 4**. Dibangun dengan arsitektur modern yang sederhana, elegan, cepat, dan aman menggunakan **React + Vite**, **TypeScript**, **Tailwind CSS**, dan **Supabase**.

---

## 🌟 Fitur Utama

### 1. Halaman Absensi (Penghuni)
- **Informasi Kegiatan Terkini**: Menampilkan nama kegiatan, tanggal, waktu, lokasi, dan deskripsi tugas kebersihan (contoh: pembersihan kamar mandi baru & wastafel).
- **Searchable Combobox**: Penghuni memilih nama dari daftar database yang aktif (mencegah input bebas/typo).
- **Deteksi Lorong Otomatis**: Lorong (Lorong 3 atau Lorong 4) otomatis terisi berdasarkan data penghuni dan berstatus *read-only*.
- **Pilihan Kartu Hadir / Izin**:
  - **HADIR**: Konfirmasi keikutsertaan tepat waktu.
  - **IZIN**: Menampilkan kolom isian wajib untuk alasan izin.
- **Pencegahan Absensi Ganda**: Memastikan setiap penghuni hanya dapat mencatat absensi satu kali per kegiatan.
- **Konfirmasi & Bukti**: Menampilkan modal sukses dengan identitas, status, dan timestamp pencatatan.

### 2. Login Pengurus (Admin)
- Desain minimalis dan terpusat.
- Menggunakan autentikasi aman Supabase Auth (password di-hash dengan standar bcrypt).
- Proteksi penuh: Halaman dashboard dan manajemen hanya dapat diakses setelah login.
- Kredensial awal sistem:
  - **Username**: `admin` *(atau `admin@asrama.local`)*
  - **Password**: `admingacor123`

### 3. Dashboard Pengurus
- **4 Kartu Statistik**:
  1. **Total Penghuni**: Jumlah seluruh penghuni aktif.
  2. **Hadir**: Jumlah dan persentase kehadiran.
  3. **Izin**: Jumlah penghuni yang berhalangan hadir dengan alasan.
  4. **Belum Hadir**: Dihitung secara dinamis (`Total Penghuni - Hadir - Izin`). Penghuni dengan status Izin **tidak dimasukkan** ke Belum Hadir.
- **Tabel Kehadiran dengan 3 Tab**:
  - **Tab Semua**: Menampilkan seluruh penghuni aktif dan statusnya.
  - **Tab Hadir**: Hanya penghuni yang telah melakukan absensi Hadir.
  - **Tab Belum Hadir**: Penghuni aktif yang belum melakukan absensi.
- **Pencarian & Filter Cepat**: Filter Lorong 3, Lorong 4, Semua Lorong, serta pencarian nama penghuni.
- **Ekspor CSV**: Unduh laporan presensi kerja bakti ke file spreadsheet (.csv).

### 4. Manajemen Master Penghuni
- Tambah penghuni baru ke Lorong 3 atau Lorong 4.
- Edit nama dan lorong penghuni melalui modal interaktif.
- Aktifkan / Nonaktifkan status warga tanpa menghapus riwayat presensi lampau.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, Lucide React Icons
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Stored Procedures / RPC)
- **Font**: Inter

---

## 🚀 Panduan Menjalankan Proyek

### 1. Prasyarat
- Node.js (versi 18 ke atas)
- npm atau pnpm

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 4. Melakukan Build untuk Produksi
```bash
npm run build
```
File siap saji akan dibuat di folder `dist/`.

---

## 🗄️ Konfigurasi Supabase & Database Migration

### 1. Buat Proyek di Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com).
2. Buat proyek baru (*New Project*).
3. Buka **Project Settings** &rarr; **API** untuk menyalin:
   - **Project URL**
   - **Project API Anon Key**

### 2. Atur Environment Variables
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Lalu isi kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Catatan Mode Standalone/Demo**:
> Jika file `.env` belum diisi, aplikasi secara cerdas beralih ke *Local Data Engine* otomatis dengan data bawaan Lorong 3, Lorong 4, dan event aktif tanggal 10 November 2026. Anda tetap dapat langsung melakukan login menggunakan `admin` dan `admingacor123` untuk menguji semua fitur tanpa hambatan!

### 3. Eksekusi Skema & Migrasi SQL
Buka menu **SQL Editor** pada Supabase Dashboard Anda, lalu jalankan isi berkas berikut secara berurutan:

1. **Skema & Kebijakan Keamanan**:  
   Buka file `supabase/migrations/01_initial_schema.sql` dan jalankan (*Run*). Berkas ini akan membuat:
   - Tabel `residents`, `events`, `attendances` dengan *unique constraint* `(event_id, resident_id)`.
   - Konfigurasi **Row Level Security (RLS)** untuk melindungi data dari manipulasi langsung.
   - Stored Procedure `submit_attendance` (`SECURITY DEFINER`) untuk memvalidasi dan memproses absensi penghuni secara aman dari backend tanpa mengekspos *service role key*.

2. **Data Seed & Akun Admin Awal**:  
   Buka file `supabase/seed.sql` dan jalankan (*Run*). Berkas ini akan mengisi:
   - Kegiatan aktif utama: "Kerja Bakti Asrama" (10 November 2026).
   - Data 14 penghuni awal untuk Lorong 3 & Lorong 4.
   - Akun admin awal Supabase Auth:
     - **Email / Username**: `admin@asrama.local` (atau ketik `admin` di form login)
     - **Password**: `admingacor123`

---

## 🔒 Keamanan & Validasi

1. **Row Level Security (RLS)**: Publik hanya dapat membaca kegiatan aktif dan nama penghuni aktif; tidak dapat mengubah data master secara sembarangan.
2. **Absensi Aman via Backend RPC**: Pencatatan kehadiran dijalankan melalui fungsi PostgreSQL `submit_attendance` yang memverifikasi keaktifan kegiatan, status penghuni, dan menolak absensi ganda.
3. **Pemisahan Peran**: Operasi penambahan/pengubahan data penghuni dan kegiatan hanya diizinkan untuk admin yang terotentikasi.
4. **Tanpa Plaintext Password**: Password admin tidak pernah disimpan dalam frontend atau localStorage.

---

## 📁 Struktur Direktori

```
presensi-kerjabakti/
├── src/
│   ├── components/
│   │   ├── AttendanceSuccessModal.tsx  # Modal konfirmasi absensi
│   │   ├── Navbar.tsx                  # Header navigasi SaaS modern
│   │   ├── SearchableCombobox.tsx      # Dropdown pencarian nama penghuni
│   │   └── Toast.tsx                   # Notifikasi toast mengambang
│   ├── lib/
│   │   ├── supabase.ts                 # Inisialisasi Supabase client
│   │   └── utils.ts                    # Utility classnames & format tanggal Indonesia
│   ├── pages/
│   │   ├── AttendancePage.tsx          # Halaman utama absensi warga
│   │   ├── DashboardPage.tsx           # Dashboard pengurus & tabel kehadiran
│   │   ├── LoginPage.tsx               # Login admin minimalis
│   │   └── ResidentsManagementPage.tsx # Master pengelolaan penghuni (Lorong 3 & 4)
│   ├── services/
│   │   └── api.ts                      # Abstraksi data (Supabase + fallback engine)
│   ├── types/
│   │   └── index.ts                    # TypeScript interface & types
│   ├── App.tsx                         # Router tampilan & autentikasi
│   ├── index.css                       # Styling Tailwind & base layer
│   └── main.tsx                        # Entry point React
├── supabase/
│   ├── migrations/
│   │   └── 01_initial_schema.sql       # DDL tabel, RLS, & secure RPC
│   └── seed.sql                        # Data awal kegiatan, penghuni, & admin
├── legacy_v1/                          # Arsip cadangan kode lama
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
