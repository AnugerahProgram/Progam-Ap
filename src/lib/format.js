export function formatRupiah(n) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

// Angka biasa dengan pemisah ribuan (titik, gaya Indonesia), tanpa prefix
// "Rp". Dipakai untuk kolom seperti "Pengajuan Paket" yang kadang berisi
// angka besar (mis. toko INLITE yang nilainya sebenarnya nominal, bukan
// jumlah paket) supaya tetap gampang dibaca (10.000.000, bukan 10000000).
export function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  return Math.round(n).toLocaleString('id-ID')
}

export function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateRange(awal, akhir) {
  if (!awal || !akhir) return 'Sepanjang data'
  return `${formatDate(awal)} – ${formatDate(akhir)}`
}

// Menyamakan penulisan nama orang (SALES FAKTUR / SALESMAN) yang di Excel
// sering diketik dengan kapitalisasi berbeda-beda (mis. "ZHULVAN" di satu
// baris, "Zhulvan" di baris lain). Tanpa ini keduanya dianggap 2 sales
// berbeda oleh filter dropdown (Set/groupBy itu case-sensitive). Hasilnya
// selalu Title Case ("Zhulvan", "Kasmuri", "Indah Widarsih") supaya rapi
// dan konsisten dilihat di mana pun (dropdown, tabel, export).
export function normPersonName(v) {
  const s = (v ?? '').toString().trim().replace(/\s+/g, ' ')
  if (!s) return s
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export function toISODate(v) {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  // handle excel serial numbers
  if (typeof v === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const d = new Date(epoch.getTime() + v * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const s = String(v).trim()
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return s
}
