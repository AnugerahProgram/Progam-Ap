# Dashboard Rekap Program Supplier

Dashboard untuk memantau realisasi program supplier (SUPERFAN, BUCKET SEAL, KUNINGAN, PVCBV, DISPLAY HOKI, dll) per pelanggan, dibangun dengan React + Vite + Tailwind.

**Data sekarang disimpan di Supabase** (bukan lagi file Excel di `public/data/`). Excel tetap dipakai sebagai sumber input, tapi dipindahkan ke database lewat script import, lalu aplikasi membaca datanya dari Supabase setiap kali halaman dibuka.

Ada 3 tabel:
- `master_barang` — dari `MASTER_BARANG.xlsx`, daftar barang per program per supplier.
- `rekapan_program` — dari `INPUT_REKAPAN_PROGRAM.xlsx`, data master pengajuan tiap toko (Pengajuan Paket, Form Fisik, Target, Periode). **Semua baris ditampilkan apa adanya**, tidak difilter.
- `data_penjualan` — dari `DATA_PENJUALAN.xlsx`, transaksi faktur yang dipakai untuk mencocokkan apakah nominal & barang yang terjual sudah memenuhi program.

Plus 1 view, `v_rekap_kekurangan`, yang menggabungkan ketiganya untuk menghitung kekurangan qty yang masih perlu dikirim ke pelanggan (logika yang sama juga dihitung di frontend lewat `computeKekuranganPaket` di `src/lib/compute.js`).

## 1. Setup Supabase (sekali saja)

1. Buat project baru di https://supabase.com (gratis).
2. Buka **SQL Editor** di dashboard Supabase project-mu, tempel isi file [`supabase/schema.sql`](./supabase/schema.sql), lalu **Run**. Ini akan membuat 3 tabel + 1 view + izin baca publik (RLS).
3. Ambil kredensialnya di **Project Settings → API**:
   - `Project URL` → dipakai sebagai `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `service_role` key (rahasia, jangan disebar) → dipakai sebagai `SUPABASE_SERVICE_ROLE_KEY`, hanya untuk script import
   - `anon` `public` key → dipakai sebagai `VITE_SUPABASE_ANON_KEY`, dipakai aplikasi di browser

## 2. Konfigurasi environment

```bash
cp .env.example .env
```

Isi ke-4 nilai di `.env` sesuai kredensial project Supabase-mu.

## 3. Install dependency

Butuh **Node.js** versi 18 ke atas (`node -v` untuk cek).

```bash
npm install
```

## 4. Pindahkan data Excel ke Supabase

1. Buat folder `data-in/` di root project, taruh 3 file Excel di dalamnya dengan nama **persis**:
   - `data-in/INPUT_REKAPAN_PROGRAM.xlsx`
   - `data-in/MASTER_BARANG.xlsx`
   - `data-in/DATA_PENJUALAN.xlsx`
2. Jalankan:
   ```bash
   npm run import:supabase
   ```
   Script ini akan mengosongkan tabel lama lalu mengisi ulang dengan isi file Excel terbaru (full refresh), jadi aman dijalankan berulang kali tiap ada data baru.

   Kalau file Excel ada di folder lain, pakai:
   ```bash
   node scripts/import-to-supabase.mjs --dir=/path/ke/folder-excel
   ```

## 5. Jalankan dashboard

```bash
npm run dev
```

Buka browser ke alamat yang muncul di terminal (biasanya `http://localhost:5173`).

Untuk build versi produksi:
```bash
npm run build
npm run preview
```

## Update data baru (Agustus, September, dst)

Timpa file Excel di `data-in/` dengan yang terbaru (nama file & nama kolom header harus tetap sama), lalu jalankan lagi `npm run import:supabase`. Tidak perlu redeploy aplikasi — cukup refresh browser setelah import selesai.

## Cara membaca data & aturan bisnis

- **`INPUT_REKAPAN_PROGRAM.xlsx` → tabel `rekapan_program`**: ini data master, satu baris = satu toko mengajukan satu program. Ditampilkan **seluruhnya** di tab "Pengajuan Paket", tidak ada baris yang disembunyikan.
  - Kolom **FORM FISIK**: `0` = form fisik **belum sampai ke kantor**, `1` = **sudah sampai**.
  - Kolom **PENGAJUAN PAKET** (atau **PAKET PENGAJUAN** di sheet INLITE): jumlah paket program yang diajukan toko tsb.
- **`MASTER_BARANG.xlsx` → tabel `master_barang`**: daftar barang apa saja yang termasuk tiap program, per supplier.
- **`DATA_PENJUALAN.xlsx` → tabel `data_penjualan`**: dipakai untuk mencocokkan apakah nominal & nama barang yang sudah terjual (jadi faktur) memenuhi syarat program. Kolom **F. QTY** = qty barang program yang sudah jadi faktur / sudah dikirim.
- **Kekurangan kirim**: untuk tiap pengajuan (toko x program), barang program dicari di `data_penjualan` lewat nama barang yang cocok dengan `master_barang` program tsb, lalu di-jumlah F.QTY-nya. Kekurangan = `PENGAJUAN PAKET - total F.QTY yang sudah jadi faktur` (minimal 0). Ini yang dipakai untuk kolom **"Kekurangan Kirim"** di tab "Pengajuan Paket" — jumlah barang yang masih perlu dikirim ke pelanggan supaya pengajuan paketnya terpenuhi.

Logika lengkap ada di `src/lib/compute.js` (`computeKekuranganPaket`) dan di view SQL `v_rekap_kekurangan` (di `supabase/schema.sql`) untuk yang ingin query langsung dari database / bikin laporan lain.

## Ringkasan aturan program (tab "Rekap Program")

| Program | Supplier | Syarat | Reward |
|---|---|---|---|
| SUPERFAN | DCOTA | Beli min. 2 dari item wajib **dan** omset item program melebihi target nominal dalam periode | — |
| BUCKET SEAL | DCOTA | Beli semua item program | Diskon 10% |
| KUNINGAN | DCOTA | Beli minimal 2 varian berbeda dari daftar item Kuningan | Diskon 5% |
| PVCBV | DCOTA | Beli minimal 2 varian berbeda dari daftar item PVCBV | Diskon 7% |
| DISPLAY HOKI | INLITE | Omset item program mencapai target nominal dalam periode | Rp 200.000 |

Target nominal & periode tiap program sekarang diambil per-toko dari `rekapan_program` (kolom `TARGET NOMINAL`/`TARGET`, `AWAL PROGRAM`, `AKHIR PROGRAM`), bukan dari sheet terpisah lagi.

## Struktur file yang relevan

```
supabase/schema.sql            # DDL: 3 tabel + view v_rekap_kekurangan + RLS
scripts/import-to-supabase.mjs # Script Node: baca 3 Excel -> upload ke Supabase
src/lib/supabaseClient.js      # Klien Supabase untuk browser (pakai anon key)
src/lib/supabaseLoader.js      # Ambil & normalisasi data dari Supabase (pengganti excelLoader.js lama)
src/lib/compute.js             # Semua logika rekap, termasuk computeKekuranganPaket
src/components/PengajuanPaketTable.jsx  # Tab "Pengajuan Paket" (form fisik + kekurangan kirim)
```
