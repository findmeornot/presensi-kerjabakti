# Kebersihan Asrama — Sistem Absensi Kerja Bakti (Zero-Config Standalone)

Sistem absensi dan monitoring kegiatan kebersihan penghuni asrama **Lorong 3** dan **Lorong 4**.
Dibuat **mandiri (standalone)** tanpa dependensi Supabase atau layanan database eksternal yang rumit. Siap langsung di-deploy ke **Railway** dalam 2 menit.

---

## 🌟 Keunggulan Versi Ini
- **Tanpa Supabase / Tanpa Akun Cloud Eksternal**: Menggunakan backend Express bawaan yang menyimpan data ke file JSON lokal di server (`data/database.json`).
- **Sinkronisasi Real-Time**: Semua penghuni yang mengisi dari HP masing-masing akan langsung tersimpan di server terpusat. Admin membuka laptop/HP langsung melihat rekap absensi yang sama secara real-time.
- **Zero Configuration**: Tidak perlu isi `.env` atau variabel apapun. Langsung deploy dan jalan!
- **Tampilan Modern & Responsif**: Dibangun dengan React 19, Tailwind CSS, Lucide Icons, dan font Inter.

---

## 🚀 Cara Cepat Deploy ke Railway

1. **Push ke GitHub**:
   ```bash
   git add .
   git commit -m "deploy to railway"
   git push origin main
   ```

2. **Deploy di Railway**:
   - Buka dashboard [Railway.app](https://railway.app).
   - Klik **New Project** &rarr; **Deploy from GitHub repo** &rarr; Pilih repository ini.
   - Railway akan otomatis menjalankan `npm run build` lalu `npm start` (`node server.js`).

3. **Generate Link Domain**:
   - Di Railway, klik service proyek kamu &rarr; buka tab **Settings**.
   - Pada bagian **Networking**, klik tombol **Generate Domain**.
   - Link publik kamu (contoh: `https://kebersihan-asrama-production.up.railway.app`) langsung aktif dan bisa disebarkan ke grup warga asrama!

---

## 🔐 Kredensial Admin Awal
- **Username**: `admin`
- **Password**: `admingacor123`

---

## 💻 Menjalankan di Lokal (Development)

1. Jalankan server backend:
   ```bash
   node server.js
   ```
2. Atau jalankan build & start:
   ```bash
   npm run build
   npm start
   ```
   Aplikasi akan aktif di `http://localhost:3000`.
