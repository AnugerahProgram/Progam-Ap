import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, FileSpreadsheet, ImageDown, Loader2, CheckCircle2, CircleDashed, Package } from 'lucide-react'
import StatusBadge from './StatusBadge'
import DetailModal from './DetailModal'
import { formatRupiah } from '../lib/format'
import { downloadExcel, downloadElementAsImage } from '../lib/exportUtils'

const PAGE_SIZE = 20

const EXPORT_COLUMNS = [
  { label: 'Kode Toko', key: 'kodeToko', width: 16 },
  { label: 'Nama Pelanggan', key: 'namaPelanggan', width: 30 },
  { label: 'Depo', key: 'depo', width: 14 },
  { label: 'Kota', key: 'kota', width: 14 },
  { label: 'Sales', key: 'salesFaktur', width: 16 },
  { label: 'Supplier', key: 'supp', width: 12 },
  { label: 'Program', key: 'program', width: 14 },
  { label: 'Omset', key: 'omset', width: 18, numFmt: '#,##0', align: 'right' },
  { label: 'Varian Dibeli', value: (r) => `${r.varianCount}/${r.totalVarianProgram}`, width: 14, align: 'center' },
  { label: 'Pengajuan Paket', key: 'pengajuanPaket', width: 14, align: 'center' },
  { label: 'Form Fisik', value: (r) => (r.formFisik ? 'Sudah sampai' : 'Belum sampai'), width: 16, align: 'center' },
  { label: 'Status', value: (r) => (r.tercapai ? 'Tercapai' : 'Belum Tercapai'), width: 16, align: 'center' },
]

function FormFisikDot({ formFisik }) {
  return formFisik ? (
    <span className="inline-flex items-center gap-1 text-pine-600 text-[12px] font-medium">
      <CheckCircle2 size={13} /> Sudah sampai
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-clay-600 text-[12px] font-medium">
      <CircleDashed size={13} /> Belum sampai
    </span>
  )
}

// RecapTable receives an already globally-filtered recap (Program, Supplier,
// Depo, Kota, Sales, Status filters live one level up in App.jsx so the KPI
// cards & charts react to them too). This component adds its own local
// Kode Toko / Nama Pelanggan filters on top of that.
//
// Kolom "Pengajuan Paket" & "Form Fisik" dulunya halaman terpisah
// (PengajuanPaketTable). Sekarang digabung ke sini supaya semua info
// tentang satu toko+program ada di satu tempat.
export default function RecapTable({ recap }) {
  const [kodeToko, setKodeToko] = useState('')
  const [namaPelanggan, setNamaPelanggan] = useState('')
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(null) // 'excel' | 'image' | null
  const tableRef = useRef(null)

  const filtered = useMemo(() => {
    const qKode = kodeToko.trim().toLowerCase()
    const qNama = namaPelanggan.trim().toLowerCase()
    return recap.filter((r) => {
      if (qKode && !`${r.kodeToko || ''}`.toLowerCase().includes(qKode)) return false
      if (qNama && !`${r.namaPelanggan || ''}`.toLowerCase().includes(qNama)) return false
      return true
    })
  }, [recap, kodeToko, namaPelanggan])

  // Reset to page 1 whenever the upstream (global) filter or local filters change.
  useEffect(() => { setPage(1) }, [recap, kodeToko, namaPelanggan])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, pageCount)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  const handleDownloadExcel = async () => {
    setExporting('excel')
    try {
      await downloadExcel('rekap-program-pelanggan', 'Rekap Program', filtered, EXPORT_COLUMNS)
    } finally {
      setExporting(null)
    }
  }

  const handleDownloadImage = async () => {
    setExporting('image')
    try {
      await downloadElementAsImage('rekap-program-pelanggan', tableRef.current)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-sand-200 rounded-2xl p-4 flex flex-wrap gap-2.5 items-center">
        <input
          value={kodeToko}
          onChange={(e) => setKodeToko(e.target.value)}
          placeholder="Filter Kode Toko..."
          className="bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-ink-800/20 min-w-[140px] flex-1 sm:flex-none sm:min-w-[160px]"
        />
        <input
          value={namaPelanggan}
          onChange={(e) => setNamaPelanggan(e.target.value)}
          placeholder="Filter Nama Pelanggan..."
          className="bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-ink-800/20 min-w-[140px] flex-1"
        />
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <button
            onClick={handleDownloadExcel}
            disabled={filtered.length === 0 || exporting !== null}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Excel
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={filtered.length === 0 || exporting !== null}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-sand-200 bg-white text-ink-800 text-[13px] font-medium hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting === 'image' ? <Loader2 size={14} className="animate-spin" /> : <ImageDown size={14} />}
            Gambar
          </button>
        </div>
      </div>

      <div ref={tableRef} className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        {/* ---------- Tampilan tabel (md ke atas) ---------- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-sand-100 text-ink-700/70 text-[12px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Kode Toko</th>
                <th className="text-left px-4 py-3 font-medium">Nama Pelanggan</th>
                <th className="text-left px-4 py-3 font-medium">Depo / Kota</th>
                <th className="text-left px-4 py-3 font-medium">Sales</th>
                <th className="text-left px-4 py-3 font-medium">Supp</th>
                <th className="text-left px-4 py-3 font-medium">Program</th>
                <th className="text-right px-4 py-3 font-medium">Omset</th>
                <th className="text-left px-4 py-3 font-medium">Realisasi</th>
                <th className="text-center px-4 py-3 font-medium">Pengajuan Paket</th>
                <th className="text-left px-4 py-3 font-medium">Form Fisik</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr
                  key={`${r.kodeToko}-${r.supp}-${r.program}-${i}`}
                  onClick={() => setSelected(r)}
                  className="border-t border-sand-200 hover:bg-sand-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[12px]">{r.kodeToko}</td>
                  <td className="px-4 py-3 font-medium text-ink-900 max-w-[220px] truncate">{r.namaPelanggan}</td>
                  <td className="px-4 py-3 text-ink-700/70">{r.depo}<div className="text-[11.5px] text-ink-700/50">{r.kota}</div></td>
                  <td className="px-4 py-3 text-ink-700/70">{r.salesFaktur}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-ink-900/5 text-ink-800 text-[12px] font-medium">{r.supp}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{r.program}</td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{formatRupiah(r.omset)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.varianCount}/{r.totalVarianProgram} varian
                    {r.itemWajibTotal.length > 0 && (
                      <div className={`text-[11.5px] ${r.wajibHave >= r.wajibNeeded ? 'text-pine-600' : 'text-clay-600'}`}>
                        wajib {r.wajibHave}/{r.wajibNeeded} pcs
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-ink-900">{r.pengajuanPaket ?? 1}</td>
                  <td className="px-4 py-3"><FormFisikDot formFisik={r.formFisik} /></td>
                  <td className="px-4 py-3"><StatusBadge tercapai={r.tercapai} /></td>
                  <td className="px-4 py-3 text-ink-700/40"><ChevronRight size={16} /></td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-ink-700/50">
                    Tidak ada data yang cocok dengan filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- Tampilan kartu (di bawah md, HP) ---------- */}
        <div className="md:hidden divide-y divide-sand-200">
          {pageRows.map((r, i) => (
            <button
              key={`${r.kodeToko}-${r.supp}-${r.program}-${i}`}
              onClick={() => setSelected(r)}
              className="w-full text-left px-4 py-3.5 flex flex-col gap-2 active:bg-sand-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 text-[14px] truncate">{r.namaPelanggan}</div>
                  <div className="text-[12px] text-ink-700/60 font-mono">{r.kodeToko} · {r.depo}</div>
                </div>
                <StatusBadge tercapai={r.tercapai} />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-ink-900/5 text-ink-800 text-[11.5px] font-medium">{r.supp}</span>
                <span className="px-2 py-0.5 rounded-md bg-sand-100 text-ink-700 text-[11.5px]">{r.program}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px] pt-1">
                <div>
                  <div className="text-ink-700/50 text-[11px]">Omset</div>
                  <div className="font-semibold text-ink-900">{formatRupiah(r.omset)}</div>
                </div>
                <div>
                  <div className="text-ink-700/50 text-[11px]">Varian</div>
                  <div className="font-semibold text-ink-900">
                    {r.varianCount}/{r.totalVarianProgram}
                    {r.itemWajibTotal.length > 0 && (
                      <span className={`ml-1 font-normal ${r.wajibHave >= r.wajibNeeded ? 'text-pine-600' : 'text-clay-600'}`}>
                        (wajib {r.wajibHave}/{r.wajibNeeded})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-ink-700/50 text-[11px] flex items-center gap-1"><Package size={10} /> Pengajuan Paket</div>
                  <div className="font-semibold text-ink-900">{r.pengajuanPaket ?? 1}</div>
                </div>
                <div>
                  <div className="text-ink-700/50 text-[11px]">Form Fisik</div>
                  <FormFisikDot formFisik={r.formFisik} />
                </div>
              </div>
            </button>
          ))}
          {pageRows.length === 0 && (
            <div className="px-4 py-10 text-center text-ink-700/50 text-[13px]">
              Tidak ada data yang cocok dengan filter saat ini.
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-sand-200 text-[13px] text-ink-700/70">
            <span>{filtered.length} baris · halaman {page_} dari {pageCount}</span>
            <div className="flex gap-2">
              <button
                disabled={page_ <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-sand-200 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                disabled={page_ >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-sand-200 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <DetailModal row={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
