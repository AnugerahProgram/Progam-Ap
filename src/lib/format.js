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
  // "YYYY-MM-DD" (tanpa jam) kalau dilempar ke new Date() dibaca sebagai
  // UTC midnight, lalu ditampilkan pakai timezone lokal -- di zona minus
  // (mis. WIB kebalikannya) bisa mundur sehari. Jadi tanggal polos kita
  // rakit sendiri sebagai tanggal LOKAL.
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso)
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

// Ambil tanggal kalender APA ADANYA, tanpa geser timezone.
//
// PENTING: jangan pakai Date.prototype.toISOString() di sini, dan jangan
// percaya begitu saja komponen lokal Date-nya. SheetJS (cellDates: true)
// membangun Date memakai offset timezone historis, jadi "1 Juli 2026" di
// Excel bisa keluar sebagai 2026-06-30T16:59:48Z -- yaitu 23:59:48 WIB,
// meleset ~12 detik SEBELUM tengah malam. Akibatnya tanggalnya dibaca 30
// Juni, dan periode BELANJA CERIA tampil "30 Jun - 29 Sep" padahal
// seharusnya "1 Jul - 30 Sep".
//
// Solusinya: geser ke waktu lokal, lalu BULATKAN ke tengah malam terdekat
// supaya selisih detik/jam seperti itu hilang, baru diambil Y-M-D nya.
function ymdRoundedLocal(d) {
  const localMs = d.getTime() - d.getTimezoneOffset() * 60000
  const rounded = Math.round(localMs / 86400000) * 86400000
  const r = new Date(rounded)
  const y = r.getUTCFullYear()
  const m = String(r.getUTCMonth() + 1).padStart(2, '0')
  const day = String(r.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toISODate(v) {
  if (!v) return null
  if (v instanceof Date) return ymdRoundedLocal(v)
  // handle excel serial numbers
  if (typeof v === 'number') {
    // Serial Excel dihitung dalam UTC, jadi baca balik pakai getUTC*.
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const d = new Date(epoch.getTime() + Math.round(v) * 86400000)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const s = String(v).trim()
  // String yang sudah "YYYY-MM-DD" dipakai apa adanya, jangan di-parse ulang
  // (new Date('2026-07-01') dibaca sebagai UTC midnight -> bisa mundur lagi).
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const d = new Date(s)
  if (!isNaN(d.getTime())) return ymdRoundedLocal(d)
  return s
}
