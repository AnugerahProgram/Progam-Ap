import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, Circle, MapPin, Store, Truck, FileSpreadsheet, ImageDown, Loader2, CircleDashed, Package } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatRupiah, formatDate, formatDateRange } from '../lib/format'
import { formatPengajuanPaket, pengajuanPaketLabel } from '../lib/pengajuanPaket'
import { downloadExcel, downloadElementAsImage } from '../lib/exportUtils'

function FormFisikMini({ formFisik }) {
  return formFisik ? (
    <span className="inline-flex items-center gap-1 text-sky-600 font-bold">
      <CheckCircle2 size={14} /> Sudah ada
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
      <CircleDashed size={14} /> Belum ada
    </span>
  )
}

const TX_COLUMNS = [
  { label: 'No Faktur', key: 'noFaktur', width: 18 },
  { label: 'Tanggal', value: (t) => formatDate(t.tglFaktur), width: 16 },
  { label: 'Nama Barang', key: 'namaBarang', width: 34 },
  { label: 'Qty', key: 'qty', width: 10, numFmt: '#,##0', align: 'right' },
  { label: 'Nominal', key: 'nominal', width: 18, numFmt: '#,##0', align: 'right' },
  { label: 'Wajib', value: (t) => (t.wajib ? 'WAJIB' : ''), width: 10, align: 'center' },
]

export default function DetailModal({ row, onClose }) {
  const [exporting, setExporting] = useState(null) // 'excel' | 'image' | null
  const modalCardRef = useRef(null)
  const bodyScrollRef = useRef(null)
  const txScrollRef = useRef(null)

  if (!row) return null

  const filename = `transaksi-${row.kodeToko}-${row.program}`.replace(/\s+/g, '_')
  const grandTotalQty = row.transactions.reduce((s, t) => s + (Number(t.qty) || 0), 0)
  const grandTotalNominal = row.transactions.reduce((s, t) => s + (Number(t.nominal) || 0), 0)

  const handleDownloadExcel = async () => {
    setExporting('excel')
    try {
      await downloadExcel(filename, 'Riwayat Transaksi', row.transactions, TX_COLUMNS)
    } finally {
      setExporting(null)
    }
  }

  const handleDownloadImage = async () => {
    setExporting('image')
    // Modal-nya sendiri dibatasi tinggi (max-h) dan bagian tengahnya
    // scroll internal supaya toko dengan BANYAK varian/transaksi tetap
    // rapi di layar. Untuk screenshot, batasan itu perlu dilepas dulu
    // supaya semua konten (bukan cuma yang kelihatan di layar) ikut
    // terekam di gambar.
    const bodyEl = bodyScrollRef.current
    const cardEl = modalCardRef.current
    const scrollEl = txScrollRef.current
    const prevBodyMaxHeight = bodyEl?.style.maxHeight
    const prevBodyOverflow = bodyEl?.style.overflow
    const prevCardMaxHeight = cardEl?.style.maxHeight
    const prevCardAnimation = cardEl?.style.animation
    const prevCardOpacity = cardEl?.style.opacity
    const prevScrollMaxHeight = scrollEl?.style.maxHeight
    const prevScrollOverflow = scrollEl?.style.overflow
    if (bodyEl) {
      bodyEl.style.maxHeight = 'none'
      bodyEl.style.overflow = 'visible'
    }
    if (cardEl) {
      cardEl.style.maxHeight = 'none'
      // The modal opens with a "rise-in" fade/slide-in animation (see
      // index.css) that starts from opacity: 0. If the person clicks
      // "Download JPG" right after opening the modal, html2canvas can grab
      // its snapshot while that animation is still mid-flight, producing an
      // image where every element looks faint/washed-out instead of
      // outright missing (partial opacity, not zero). Killing the
      // animation and pinning opacity to 1 guarantees we always capture the
      // fully-settled, fully-opaque state regardless of timing.
      cardEl.style.animation = 'none'
      cardEl.style.opacity = '1'
    }
    if (scrollEl) {
      scrollEl.style.maxHeight = 'none'
      scrollEl.style.overflow = 'visible'
    }
    try {
      // Let the browser finish reflowing and painting the now-unclipped,
      // fully-opaque layout before we snapshot it. Without this, html2canvas
      // can start reading element positions/styles while the changes above
      // are still settling, producing an image with overlapping/misplaced
      // or faint text.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      await downloadElementAsImage(filename, modalCardRef.current)
    } finally {
      if (bodyEl) {
        bodyEl.style.maxHeight = prevBodyMaxHeight || ''
        bodyEl.style.overflow = prevBodyOverflow || ''
      }
      if (cardEl) {
        cardEl.style.maxHeight = prevCardMaxHeight || ''
        cardEl.style.animation = prevCardAnimation || ''
        cardEl.style.opacity = prevCardOpacity || ''
      }
      if (scrollEl) {
        scrollEl.style.maxHeight = prevScrollMaxHeight || ''
        scrollEl.style.overflow = prevScrollOverflow || ''
      }
      setExporting(null)
    }
  }

  return createPortal(
    // Dirender lewat portal ke document.body: sebelumnya modal ini
    // ditumpuk di dalam <main>, jadi kalau ada ancestor yang bikin
    // "containing block" baru (transform/filter/dsb), `fixed inset-0`
    // jadi relatif ke ancestor itu -- bukan ke seluruh layar -- sehingga
    // sidebar di kiri kelihatan "menutupi" modal. Portal menghilangkan
    // masalah itu karena modal jadi anak langsung dari <body>.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-3 md:p-6" onClick={onClose}>
      {/*
        Toko dengan BANYAK varian/transaksi (mis. BELANJA CERIA) bikin modal
        ini jadi sangat panjang. Kalau seluruh kartu ikut di-scroll, judul &
        tombol tutup ikut lenyap ke atas layar dan kelihatan seperti
        "ketutup". Jadi sekarang kartu dibatasi max-h + flex-col: header
        (judul, ringkasan status) selalu diam di tempat, dan HANYA bagian
        tengah (varian item + riwayat transaksi) yang scroll sendiri.
      */}
      <div
        ref={modalCardRef}
        className="bg-sand-50 rounded-2xl w-full max-w-3xl shadow-xl rise-in flex flex-col max-h-[calc(100vh-1.5rem)] md:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b border-sand-200">
          <div>
            <div className="text-[12.5px] uppercase tracking-wide text-brass-600 font-semibold mb-1">{row.supp} · {row.program}</div>
            <h2 className="text-lg font-bold text-ink-900">{row.namaPelanggan}</h2>
            {row.alamatPelanggan && (
              <div className="text-[12.5px] text-ink-700/60 mt-0.5 max-w-md">{row.alamatPelanggan}</div>
            )}
            <div className="text-[13px] text-ink-700/70 flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
              <span className="flex items-center gap-1"><Store size={13} /> {row.kodeToko}</span>
              <span className="flex items-center gap-1"><MapPin size={13} /> {row.kota}</span>
              <span className="flex items-center gap-1"><Truck size={13} /> {row.depo}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-700/50 hover:text-ink-900 p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div ref={bodyScrollRef} className="overflow-y-auto">
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 border-b border-sand-200">
          <div>
            <div className="text-[12px] text-ink-700/60">Omset program</div>
            <div className="font-bold text-ink-900">{formatRupiah(row.omset)}</div>
          </div>
          <div>
            <div className="text-[12px] text-ink-700/60">Syarat omset</div>
            <div className="font-bold text-ink-900">{row.nominalRequired ? formatRupiah(row.nominalRequired) : '—'}</div>
          </div>
          <div>
            <div className="text-[12px] text-ink-700/60">Varian dibeli</div>
            <div className="font-bold text-ink-900">{row.varianCount} dari {row.totalVarianProgram}</div>
          </div>
          <div>
            <div className="text-[12px] text-ink-700/60 flex items-center gap-1"><Package size={12} /> {pengajuanPaketLabel(row)}</div>
            <div className="font-bold text-ink-900">{formatPengajuanPaket(row)}</div>
          </div>
          <div>
            <div className="text-[12px] text-ink-700/60">Form Fisik</div>
            <FormFisikMini formFisik={row.formFisik} />
          </div>
          <div>
            <div className="text-[12px] text-ink-700/60">Status</div>
            <StatusBadge tercapai={row.tercapai} />
          </div>
        </div>

        <div className="px-6 py-4 border-b border-sand-200">
          <div className="text-[12.5px] text-ink-700/60 mb-2">Periode program: {formatDateRange(row.period?.awal, row.period?.akhir)}</div>
          {row.kekurangan.length > 0 ? (
            <div className="bg-clay-500/10 text-clay-600 rounded-lg px-3 py-2 text-[13px] space-y-1">
              {row.kekurangan.map((k, i) => <div key={i}>• {k}</div>)}
            </div>
          ) : (
            <div className="bg-pine-500/10 text-pine-600 rounded-lg px-3 py-2 text-[13px]">
              Semua syarat program sudah terpenuhi. Reward: <b>{row.reward}</b>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-b border-sand-200">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-ink-900 text-[14px]">Cek varian item</div>
            {row.itemWajibTotal.length > 0 && (
              <div className="text-[12.5px] text-ink-700/60">
                Item wajib: <b className={row.wajibHave >= row.wajibNeeded ? 'text-pine-600' : 'text-clay-600'}>{row.wajibHave}/{row.wajibNeeded} pcs</b>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {row.items.map((it) => (
              <div
                key={it.namaBarang}
                className="flex items-center gap-2 text-[13px] px-2.5 rounded-lg bg-white border border-sand-200"
                style={{ height: '34px' }}
              >
                <CheckCircle2 size={15} className="text-pine-500 shrink-0" />
                <span className="truncate">{it.namaBarang}</span>
                {it.wajib && <span className="ml-auto text-[11px] text-brass-600 font-semibold shrink-0">WAJIB</span>}
                <span className="text-ink-700/50 text-[12px] shrink-0">×{it.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-ink-900 text-[14px]">Riwayat transaksi ({row.transactions.length})</div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadExcel}
                disabled={row.transactions.length === 0 || exporting !== null}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ink-900 text-white text-[12px] font-medium hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exporting === 'excel' ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                Download Excel
              </button>
              <button
                onClick={handleDownloadImage}
                disabled={row.transactions.length === 0 || exporting !== null}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sand-200 bg-white text-ink-800 text-[12px] font-medium hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exporting === 'image' ? <Loader2 size={13} className="animate-spin" /> : <ImageDown size={13} />}
                Download JPG
              </button>
            </div>
          </div>
          <div className="bg-sand-50 rounded-lg">
            <div ref={txScrollRef} className="max-h-64 overflow-y-auto rounded-t-lg border border-sand-200">
              <table className="w-full text-[12.5px]">
                <thead className="bg-sand-100 text-ink-700/70 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">No Faktur</th>
                    <th className="text-left px-3 py-2 font-medium">Tanggal</th>
                    <th className="text-left px-3 py-2 font-medium">Nama Barang</th>
                    <th className="text-right px-3 py-2 font-medium">Qty</th>
                    <th className="text-right px-3 py-2 font-medium">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {row.transactions.map((t, i) => (
                    <tr key={i} className="border-t border-sand-200 bg-white">
                      <td className="px-3 py-1.5 font-mono text-[11.5px]">{t.noFaktur}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(t.tglFaktur)}</td>
                      <td className="px-3 py-1.5">{t.namaBarang}</td>
                      <td className="px-3 py-1.5 text-right">{t.qty}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">{formatRupiah(t.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-b-lg border border-t-0 border-sand-200 bg-sand-100">
              <span className="text-[12.5px] font-semibold text-ink-900 uppercase tracking-wide">Grand Total</span>
              <div className="flex items-center gap-5">
                <span className="text-[12.5px] text-ink-700/70">
                  Qty: <b className="text-ink-900">{grandTotalQty.toLocaleString('id-ID')}</b>
                </span>
                <span className="text-[13px] text-ink-700/70">
                  Nominal: <b className="text-ink-900">{formatRupiah(grandTotalNominal)}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
