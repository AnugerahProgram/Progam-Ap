import { CASH_REWARD_PROGRAMS } from './compute'
import { formatRupiah, formatNumber } from './format'

// Untuk program berbasis reward uang (BELANJA CERIA, DISPLAY HOKI -- ini
// yang dipakai supplier INLITE), kolom "PENGAJUAN PAKET" di Excel sebenarnya
// diisi NOMINAL yang harus dicapai, bukan jumlah paket fisik. Program lain
// (mis. SUPERFAN dari DCOTA) memang literal jumlah paket (1, 2, 3, dst).
// Helper ini memformat nilainya secara konsisten di seluruh UI.
export function formatPengajuanPaket(row) {
  const val = row?.pengajuanPaket ?? 1
  if (CASH_REWARD_PROGRAMS.includes(row?.program)) {
    return formatRupiah(val)
  }
  return formatNumber(val)
}

export function pengajuanPaketLabel(row) {
  return CASH_REWARD_PROGRAMS.includes(row?.program) ? 'Nominal Pengajuan' : 'Pengajuan Paket'
}
