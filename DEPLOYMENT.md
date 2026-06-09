# Panduan Deployment: Render & Neon.tech

Proyek Anda sudah saya siapkan untuk bisa langsung dideploy ke **Render** dengan database dari **Neon.tech**. Berikut adalah langkah-langkah detail yang harus Anda ikuti.

## 1. Persiapan Database (Neon.tech)
1. Buka [neon.tech](https://neon.tech/) dan buat akun/login.
2. Buat project baru (misalnya dengan nama `gor-booking-db`).
3. Pada halaman *Dashboard*, cari bagian **Connection Details**.
4. Salin (copy) seluruh **Connection String** yang diberikan. Bentuknya akan seperti ini:
   `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`
   *(Simpan string ini, Anda akan membutuhkannya di Render)*.

## 2. Push Kode ke GitHub
Pastikan Anda sudah mem-push seluruh kode proyek Anda (termasuk folder `frontend` dan `backend`) ke repository GitHub Anda. 

> [!TIP]
> File `.env` dan `node_modules` sudah otomatis saya kecualikan menggunakan `.gitignore` agar password lokal Anda aman dan tidak ter-upload ke publik.

## 3. Deploy Aplikasi ke Render
1. Buka [render.com](https://render.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **New +** di pojok kanan atas, lalu pilih **Web Service**.
3. Hubungkan repository GitHub yang berisi proyek booking GOR Anda ini.
4. Pada halaman konfigurasi Web Service, isi data berikut dengan tepat:
   
   - **Name**: (Terserah Anda, misal: `gor-booking`)
   - **Root Directory**: `backend` *(Sangat Penting! Harus diisi "backend" karena file package.json Anda berada di folder ini)*
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Tambahkan Environment Variables:**
   Scroll ke bawah pada halaman konfigurasi Render, temukan bagian **Environment Variables** lalu tambahkan variabel berikut:
   
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | *Paste Connection String dari Neon.tech di sini* |
   | `PORT` | `3000` |

6. Klik tombol **Create Web Service**.

## Proses Selesai!
Render akan mulai meng-install dependensi dan menjalankan server Anda. Karena saya telah menyetel sistem otomatis (auto-migrate) di `db.js`, saat server pertama kali menyala di Render, sistem akan **secara otomatis membuat seluruh tabel database** Anda di Neon.tech beserta data awal (Admin & Lapangan)!

Anda dapat memantau prosesnya di tab *Logs* pada dashboard Render Anda. Jika tertulis *Server is running*, berarti website Anda sudah online dan dapat diakses publik melalui URL yang diberikan Render.
