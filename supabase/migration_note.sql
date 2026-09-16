-- ============================================================
-- MIGRASI TAMBAHAN: kolom "NOTE" di INPUT_REKAPAN_PROGRAM.xlsx
-- Jalankan ini di Supabase project yang SUDAH ada (sudah pernah
-- menjalankan supabase/schema.sql sebelumnya). Aman dijalankan
-- berkali-kali (pakai IF NOT EXISTS / OR REPLACE).
--
-- Cara pakai: buka Supabase Dashboard -> SQL Editor -> paste isi
-- file ini -> Run. Setelah itu jalankan lagi:
--   npm run import:supabase
-- supaya isi kolom NOTE dari data-in/INPUT_REKAPAN_PROGRAM.xlsx
-- (mis. "SUDAH DIKIRIM") ikut masuk ke tabel.
-- ============================================================

-- ---------- Tambah kolom NOTE ke rekapan_program ----------
alter table rekapan_program add column if not exists note text;

comment on column rekapan_program.note is
  'Catatan bebas dari tim, mis. "SUDAH DIKIRIM" = reward/paket program sudah '
  'terkirim ke pelanggan. Baris dengan note = ''SUDAH DIKIRIM'' (case insensitive) '
  'di-highlight hijau di tab "Rekap Program" pada dashboard.';

-- ---------- Perbarui view v_rekap_kekurangan supaya ikut membawa note ----------
-- Postgres tidak mengizinkan CREATE OR REPLACE VIEW mengubah urutan/nama
-- kolom yang sudah ada (note & sudah_dikirim disisipkan sebelum
-- qty_terkirim), jadi view-nya harus di-drop dulu baru dibuat ulang.
drop view if exists v_rekap_kekurangan;

create view v_rekap_kekurangan as
with realisasi as (
  select
    dp.supp,
    dp.kode_pelanggan as kode_toko,
    mb.program,
    sum(dp.f_qty)      as qty_terkirim,
    sum(dp.nominal)    as nominal_terkirim
  from data_penjualan dp
  join master_barang mb
    on mb.supp = dp.supp
   and upper(trim(mb.nama_barang)) = upper(trim(dp.nama_barang))
  group by dp.supp, dp.kode_pelanggan, mb.program
)
select
  rp.id,
  rp.supp,
  rp.kode_toko,
  rp.nama_pelanggan,
  rp.alamat_pelanggan,
  rp.depo,
  rp.kota_area,
  rp.salesman,
  rp.program,
  rp.pengajuan_paket,
  rp.form_fisik,
  case when rp.form_fisik then 'Sudah sampai kantor' else 'Belum sampai kantor' end as form_fisik_status,
  rp.target_nominal,
  rp.awal_program,
  rp.akhir_program,
  rp.note,
  (upper(trim(coalesce(rp.note, ''))) = 'SUDAH DIKIRIM') as sudah_dikirim,
  coalesce(r.qty_terkirim, 0)     as qty_terkirim,
  coalesce(r.nominal_terkirim, 0) as nominal_terkirim,
  greatest(rp.pengajuan_paket - coalesce(r.qty_terkirim, 0), 0) as kekurangan_qty,
  (rp.pengajuan_paket > 0 and coalesce(r.qty_terkirim, 0) >= rp.pengajuan_paket) as paket_terpenuhi,
  (rp.target_nominal is not null and coalesce(r.nominal_terkirim, 0) >= rp.target_nominal) as nominal_terpenuhi
from rekapan_program rp
left join realisasi r
  on r.supp = rp.supp
 and r.kode_toko = rp.kode_toko
 and r.program = rp.program;

-- Update penanda sync supaya dashboard langsung refresh cache-nya begitu
-- migration ini selesai dijalankan (kalau tabel sync_meta sudah ada).
update sync_meta set last_synced_at = now() where id = 1;
