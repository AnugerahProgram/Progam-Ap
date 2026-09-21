import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  FileSpreadsheet,
  ImageDown,
  Loader2,
  CheckCircle2,
  CircleDashed,
  Package,
  Columns3,
} from 'lucide-react'
import StatusBadge from './StatusBadge'
import DetailModal from './DetailModal'
import MultiSelect from './MultiSelect'
import { formatRupiah, formatNumber } from '../lib/format'
import { formatPengajuanPaket, pengajuanPaketLabel } from '../lib/pengajuanPaket'
import { downloadExcel, downloadElementAsImage } from '../lib/exportUtils'
import { CASH_REWARD_PROGRAMS } from '../lib/compute'

const PAGE_SIZE = 20

// Kolom-kolom tabel desktop yang bisa dipilih tampil/sembunyi lewat
// tombol "Kolom". Urutannya dipakai juga buat colSpan baris subtotal.
const COLUMNS = [
  { id: 'kodeToko', label: 'Kode Toko' },
  { id: 'namaPelanggan', label: 'Nama Pelanggan' },
  { id: 'alamat', label: 'Alamat' },
  { id: 'kota', label: 'Kota' },
  { id: 'depoKota', label: 'Depo / Kota' },
  { id: 'sales', label: 'Sales' },
  { id: 'supp', label: 'Supp' },
  { id: 'program', label: 'Program' },
  { id: 'omset', label: 'Omset' },
  { id: 'realisasi', label: 'Realisasi' },
  { id: 'pengajuanPaket', label: 'Pengajuan Paket' },
  { id: 'formFisik', label: 'Form Fisik' },
  { id: 'status', label: 'Status' },
  { id: 'note', label: 'Note' },
]
const ALL_COLUMN_IDS = COLUMNS.map((c) => c.id)

// Kolom id -> label kolom di export Excel (satu kolom tabel bisa map ke
// lebih dari satu kolom Excel, mis. "Depo / Kota" -> Depo + Kota).
const EXPORT_COLUMN_MAP = {
  kodeToko: ['Kode Toko'],
  namaPelanggan: ['Nama Pelanggan'],
  alamat: ['Alamat'],
  kota: ['Kota'],
  depoKota: ['Depo', 'Kota'],
  sales: ['Sales'],
  supp: ['Supplier'],
  program: ['Program'],
  omset: ['Omset'],
  realisasi: ['Varian Dibeli'],
  pengajuanPaket: ['Pengajuan Paket'],
  formFisik: ['Form Fisik'],
  status: ['Status'],
  note: ['Note'],
}

const EXPORT_COLUMNS = [
  { label: 'Kode Toko', key: 'kodeToko', width: 16 },
  { label: 'Nama Pelanggan', key: 'namaPelanggan', width: 30 },
  { label: 'Alamat', key: 'alamatPelanggan', width: 30 },
  { label: 'Depo', key: 'depo', width: 14 },
  { label: 'Kota', key: 'kota', width: 14 },
  { label: 'Sales', key: 'salesFaktur', width: 16 },
  { label: 'Supplier', key: 'supp', width: 12 },
  { label: 'Program', key: 'program', width: 14 },
  { label: 'Omset', key: 'omset', width: 18, numFmt: '#,##0', align: 'right' },
  { label: 'Varian Dibeli', value: (r) => `${r.varianCount}/${r.totalVarianProgram}`, width: 14, align: 'center' },
  { label: 'Pengajuan Paket', value: (r) => formatPengajuanPaket(r), width: 18, align: 'right' },
  { label: 'Form Fisik', value: (r) => (r.formFisik ? 'Sudah ada' : 'Belum ada'), width: 16, align: 'center' },
  { label: 'Status', value: (r) => (r.tercapai ? 'Tercapai' : 'Belum Tercapai'), width: 16, align: 'center' },
  { label: 'Note', value: (r) => r.note || '', width: 20 },
]

function FormFisikDot({ formFisik }) {
  return formFisik ? (
    <span className="inline-flex items-center gap-1 text-sky-600 text-[12px] font-medium">
      <CheckCircle2 size={13} /> Sudah ada
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-500 text-[12px] font-medium">
      <CircleDashed size={13} /> Belum ada
    </span>
  )
}

function NoteBadge({ note, sudahDikirim }) {
  if (!note) return <span className="text-ink-700/30 text-[12px]">-</span>
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-[12px] font-medium max-w-[200px] truncate align-middle ${
        sudahDikirim ? 'bg-pine-500/15 text-pine-600' : 'bg-sand-100 text-ink-700'
      }`}
      title={note}
    >
      {note}
    </span>
  )
}

// Dropdown checklist buat pilih kolom mana saja yang tampil di tabel
// desktop. Klik di luar otomatis menutup.
function ColumnPicker({ visible, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const toggle = (id) => {
    if (visible.includes(id)) onChange(visible.filter((v) => v !== id))
    else onChange([...visible, id])
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-sand-200 bg-white text-ink-800 text-[13px] font-medium hover:bg-sand-100"
      >
        <Columns3 size={14} />
        Kolom
        {visible.length < COLUMNS.length && (
          <span className="text-ink-700/50">({visible.length}/{COLUMNS.length})</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-56 bg-white border border-sand-200 rounded-xl shadow-lg py-1 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-1.5 text-[11.5px] text-ink-700/50 uppercase tracking-wide border-b border-sand-100 mb-1">
            Tampilkan kolom
            <button
              onClick={() => onChange(visible.length === COLUMNS.length ? [] : [...ALL_COLUMN_IDS])}
              className="text-ink-700/70 hover:text-ink-900 normal-case tracking-normal font-medium"
            >
              {visible.length === COLUMNS.length ? 'Kosongkan' : 'Pilih semua'}
            </button>
          </div>
          {COLUMNS.map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-sand-50 cursor-pointer">
              <input
                type="checkbox"
                checked={visible.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="rounded border-sand-300"
              />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// RecapTable receives an already globally-filtered recap (Program, Supplier,
// Depo, Sales, Status filters live one level up in App.jsx so the KPI
// cards & charts react to them too). This component adds its own local
// Kode Toko / Nama Pelanggan filters (Nama Pelanggan bisa multi-pilih) dan
// pemilih kolom tabel di atas itu.
//
// Kolom "Pengajuan Paket" & "Form Fisik" dulunya halaman terpisah
// (PengajuanPaketTable). Sekarang digabung ke sini supaya semua info
// tentang satu toko+program ada di satu tempat.
export default function RecapTable({ recap }) {
  const [kodeToko, setKodeToko] = useState('')
  const [namaPelangganSel, setNamaPelangganSel] = useState([])
  const [noteFilter, setNoteFilter] = useState('') // '' = semua, '__NONE__' = tanpa catatan, else = nilai note persis
  const [visibleCols, setVisibleCols] = useState(ALL_COLUMN_IDS)
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(null) // 'excel' | 'image' | null
  const tableRef = useRef(null)

  const namaPelangganOptions = useMemo(
    () => Array.from(new Set(recap.map((r) => r.namaPelanggan).filter(Boolean))).sort(),
    [recap]
  )

  // Nilai NOTE unik yang ada di data (mis. "SUDAH DIKIRIM", "BARU 1 PAKET"),
  // dipakai buat isi dropdown filter Note.
  const noteOptions = useMemo(() => {
    const set = new Set()
    for (const r of recap) {
      const v = (r.note || '').trim()
      if (v) set.add(v)
    }
    return Array.from(set).sort()
  }, [recap])

  const filtered = useMemo(() => {
    const qKode = kodeToko.trim().toLowerCase()
    return recap.filter((r) => {
      if (qKode && !`${r.kodeToko || ''}`.toLowerCase().includes(qKode)) return false
      if (namaPelangganSel.length > 0 && !namaPelangganSel.includes(r.namaPelanggan)) return false
      const noteVal = (r.note || '').trim()
      if (noteFilter === '__NONE__') {
        if (noteVal) return false
      } else if (noteFilter && noteVal !== noteFilter) {
        return false
      }
      return true
    })
  }, [recap, kodeToko, namaPelangganSel, noteFilter])

  // Reset to page 1 whenever the upstream (global) filter or local filters change.
  useEffect(() => { setPage(1) }, [recap, kodeToko, namaPelangganSel, noteFilter])

  // Buang pilihan nama pelanggan yang jadi tidak valid kalau filter global
  // di atasnya berubah (mis. ganti Depo bikin toko yang tadi dipilih hilang
  // dari daftar).
  useEffect(() => {
    setNamaPelangganSel((sel) => {
      const next = sel.filter((n) => namaPelangganOptions.includes(n))
      return next.length === sel.length ? sel : next
    })
  }, [namaPelangganOptions])

  // Sama halnya untuk filter Note: kalau nilai note yang dipilih sudah
  // tidak ada lagi di data (mis. sehabis reload), balikin ke "Semua Note".
  useEffect(() => {
    setNoteFilter((v) => (v && v !== '__NONE__' && !noteOptions.includes(v) ? '' : v))
  }, [noteOptions])

  // Subtotal "Pengajuan Paket" dari SELURUH baris yang lolos filter (bukan
  // cuma yang tampil di halaman ini). Program reward uang (BELANJA CERIA,
  // DISPLAY HOKI -- ini punya supplier INLITE) nilainya nominal Rp, bukan
  // jumlah paket, dan yang diminta cuma jumlah BARIS-nya (bukan dijumlah
  // nominalnya), jadi dihitung terpisah dari subtotal paket program lain.
  const subtotal = useMemo(() => {
    let paket = 0
    let inliteBaris = 0
    for (const r of filtered) {
      const isInlite = r.supp === 'INLITE' || CASH_REWARD_PROGRAMS.includes(r.program)
      if (isInlite) inliteBaris += 1
      else paket += r.pengajuanPaket ?? 1
    }
    return { paket, inliteBaris }
  }, [filtered])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page_ = Math.min(page, pageCount)
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  // Urutan kolom yang sedang tampil, dipakai buat hitung colSpan baris
  // subtotal supaya selnya selalu jatuh di posisi kolom "Pengajuan Paket".
  const visibleOrdered = COLUMNS.filter((c) => visibleCols.includes(c.id))
  const paketColIdx = visibleOrdered.findIndex((c) => c.id === 'pengajuanPaket')
  const totalCols = visibleOrdered.length + 1 // +1 kolom chevron di ujung kanan

  const subtotalContent = (
    <>
      {subtotal.paket > 0 && <div>{formatNumber(subtotal.paket)} paket</div>}
      {subtotal.inliteBaris > 0 && <div>{subtotal.inliteBaris} baris (INLITE)</div>}
      {subtotal.paket === 0 && subtotal.inliteBaris === 0 && '-'}
    </>
  )

  const handleDownloadExcel = async () => {
    setExporting('excel')
    try {
      const activeLabels = new Set(visibleCols.flatMap((id) => EXPORT_COLUMN_MAP[id] || []))
      const cols = EXPORT_COLUMNS.filter((c) => activeLabels.has(c.label))
      await downloadExcel('rekap-program-pelanggan', 'Rekap Program', filtered, cols.length ? cols : EXPORT_COLUMNS)
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
        <MultiSelect
          options={namaPelangganOptions}
          selected={namaPelangganSel}
          onChange={setNamaPelangganSel}
          placeholder="Semua Nama Pelanggan"
        />
        <select
          value={noteFilter}
          onChange={(e) => setNoteFilter(e.target.value)}
          className="bg-sand-50 border border-sand-200 rounded-lg text-[13.5px] px-3 py-2 text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-800/20"
        >
          <option value="">Semua Note</option>
          <option value="__NONE__">Tanpa catatan</option>
          {noteOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <ColumnPicker visible={visibleCols} onChange={setVisibleCols} />
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

      <div className="flex items-center gap-2 px-1 text-[12.5px] text-ink-700/70">
        <span className="inline-block w-3.5 h-3.5 rounded-sm bg-pine-500/20 border border-pine-500/40 shrink-0" />
        Baris berwarna <span className="font-semibold text-pine-600">hijau</span> berarti reward / paket program <span className="font-semibold">sudah terkirim</span> ke pelanggan (NOTE: SUDAH DIKIRIM).
      </div>

      <div ref={tableRef} className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        {/* ---------- Tampilan tabel (md ke atas) ---------- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-sand-100 text-ink-700/70 text-[12px] uppercase tracking-wide">
              <tr>
                {visibleCols.includes('kodeToko') && <th className="text-left px-4 py-3 font-medium">Kode Toko</th>}
                {visibleCols.includes('namaPelanggan') && <th className="text-left px-4 py-3 font-medium">Nama Pelanggan</th>}
                {visibleCols.includes('alamat') && <th className="text-left px-4 py-3 font-medium">Alamat</th>}
                {visibleCols.includes('kota') && <th className="text-left px-4 py-3 font-medium">Kota</th>}
                {visibleCols.includes('depoKota') && <th className="text-left px-4 py-3 font-medium">Depo / Kota</th>}
                {visibleCols.includes('sales') && <th className="text-left px-4 py-3 font-medium">Sales</th>}
                {visibleCols.includes('supp') && <th className="text-left px-4 py-3 font-medium">Supp</th>}
                {visibleCols.includes('program') && <th className="text-left px-4 py-3 font-medium">Program</th>}
                {visibleCols.includes('omset') && <th className="text-right px-4 py-3 font-medium">Omset</th>}
                {visibleCols.includes('realisasi') && <th className="text-left px-4 py-3 font-medium">Realisasi</th>}
                {visibleCols.includes('pengajuanPaket') && <th className="text-center px-4 py-3 font-medium">Pengajuan Paket</th>}
                {visibleCols.includes('formFisik') && <th className="text-left px-4 py-3 font-medium">Form Fisik</th>}
                {visibleCols.includes('status') && <th className="text-left px-4 py-3 font-medium">Status</th>}
                {visibleCols.includes('note') && <th className="text-left px-4 py-3 font-medium">Note</th>}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr
                  key={`${r.kodeToko}-${r.supp}-${r.program}-${i}`}
                  onClick={() => setSelected(r)}
                  title={r.sudahDikirim ? 'Reward sudah terkirim ke pelanggan' : undefined}
                  className={`border-t border-sand-200 cursor-pointer transition-colors ${
                    r.sudahDikirim ? 'bg-pine-500/10 hover:bg-pine-500/15' : 'hover:bg-sand-50'
                  }`}
                >
                  {visibleCols.includes('kodeToko') && (
                    <td className="px-4 py-3 font-mono text-[12px]">{r.kodeToko}</td>
                  )}
                  {visibleCols.includes('namaPelanggan') && (
                    <td className="px-4 py-3 font-medium text-ink-900 max-w-[220px] truncate">{r.namaPelanggan}</td>
                  )}
                  {visibleCols.includes('alamat') && (
                    <td className="px-4 py-3 text-ink-700/70 max-w-[220px] truncate">{r.alamatPelanggan || '-'}</td>
                  )}
                  {visibleCols.includes('kota') && (
                    <td className="px-4 py-3 text-ink-700/70">{r.kota || '-'}</td>
                  )}
                  {visibleCols.includes('depoKota') && (
                    <td className="px-4 py-3 text-ink-700/70">
                      {r.depo}
                      <div className="text-[11.5px] text-ink-700/50">{r.kota}</div>
                    </td>
                  )}
                  {visibleCols.includes('sales') && (
                    <td className="px-4 py-3 text-ink-700/70">{r.salesFaktur}</td>
                  )}
                  {visibleCols.includes('supp') && (
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-ink-900/5 text-ink-800 text-[12px] font-medium">{r.supp}</span>
                    </td>
                  )}
                  {visibleCols.includes('program') && (
                    <td className="px-4 py-3 text-ink-700">{r.program}</td>
                  )}
                  {visibleCols.includes('omset') && (
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{formatRupiah(r.omset)}</td>
                  )}
                  {visibleCols.includes('realisasi') && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.varianCount}/{r.totalVarianProgram} varian
                      {r.varianKotakNeeded != null && (
                        <div className={`text-[11.5px] ${r.varianKotakHave >= r.varianKotakNeeded ? 'text-pine-600' : 'text-clay-600'}`}>
                          min. 1 kotak: {r.varianKotakHave}/{r.varianKotakNeeded} varian
                        </div>
                      )}
                      {r.itemWajibTotal.length > 0 && (
                        <>
                          {r.wajibVarianNeeded != null && (
                            <div className={`text-[11.5px] ${r.wajibVarianHave >= r.wajibVarianNeeded ? 'text-pine-600' : 'text-clay-600'}`}>
                              wajib {r.wajibVarianHave}/{r.wajibVarianNeeded} varian
                            </div>
                          )}
                          <div className={`text-[11.5px] ${r.wajibHave >= r.wajibNeeded ? 'text-pine-600' : 'text-clay-600'}`}>
                            wajib {r.wajibHave}/{r.wajibNeeded} {r.wajibUnit}
                            {r.wajibPcsHave != null && r.wajibUnit === 'kotak' && (
                              <span className="text-ink-700/50"> ({r.wajibPcsHave} pcs)</span>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  )}
                  {visibleCols.includes('pengajuanPaket') && (
                    <td className="px-4 py-3 text-center font-semibold text-ink-900 whitespace-nowrap">{formatPengajuanPaket(r)}</td>
                  )}
                  {visibleCols.includes('formFisik') && (
                    <td className="px-4 py-3"><FormFisikDot formFisik={r.formFisik} /></td>
                  )}
                  {visibleCols.includes('status') && (
                    <td className="px-4 py-3"><StatusBadge tercapai={r.tercapai} /></td>
                  )}
                  {visibleCols.includes('note') && (
                    <td className="px-4 py-3"><NoteBadge note={r.note} sudahDikirim={r.sudahDikirim} /></td>
                  )}
                  <td className="px-4 py-3 text-ink-700/40"><ChevronRight size={16} /></td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={totalCols} className="px-4 py-10 text-center text-ink-700/50">
                    Tidak ada data yang cocok dengan filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-sand-300 bg-sand-50/80 font-semibold text-ink-900">
                  {paketColIdx === -1 ? (
                    <td colSpan={totalCols} className="px-4 py-2.5 text-right text-[12.5px]">
                      <span className="uppercase tracking-wide text-ink-700/60 mr-2">
                        Subtotal Pengajuan Paket ({filtered.length} baris)
                      </span>
                      {subtotalContent}
                    </td>
                  ) : (
                    <>
                      {paketColIdx > 0 && (
                        <td colSpan={paketColIdx} className="px-4 py-2.5 text-right text-[12.5px] uppercase tracking-wide text-ink-700/60">
                          Subtotal Pengajuan Paket ({filtered.length} baris)
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        {paketColIdx === 0 && (
                          <div className="text-[11px] uppercase tracking-wide text-ink-700/60 mb-0.5">
                            Subtotal ({filtered.length} baris)
                          </div>
                        )}
                        {subtotalContent}
                      </td>
                      {totalCols - paketColIdx - 1 > 0 && <td colSpan={totalCols - paketColIdx - 1}></td>}
                    </>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ---------- Tampilan kartu (di bawah md, HP) ---------- */}
        <div className="md:hidden divide-y divide-sand-200">
          {pageRows.map((r, i) => (
            <button
              key={`${r.kodeToko}-${r.supp}-${r.program}-${i}`}
              onClick={() => setSelected(r)}
              title={r.sudahDikirim ? 'Reward sudah terkirim ke pelanggan' : undefined}
              className={`w-full text-left px-4 py-3.5 flex flex-col gap-2 active:bg-sand-50 ${
                r.sudahDikirim ? 'bg-pine-500/10' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 text-[14px] truncate">{r.namaPelanggan}</div>
                  {r.alamatPelanggan && (
                    <div className="text-[12px] text-ink-700/60 truncate">{r.alamatPelanggan}</div>
                  )}
                  <div className="text-[12px] text-ink-700/60 font-mono">{r.kodeToko} · {r.depo}{r.kota ? ` · ${r.kota}` : ''}</div>
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
                    {r.varianKotakNeeded != null && (
                      <span className={`ml-1 font-normal ${r.varianKotakHave >= r.varianKotakNeeded ? 'text-pine-600' : 'text-clay-600'}`}>
                        (min. 1 kotak {r.varianKotakHave}/{r.varianKotakNeeded} varian)
                      </span>
                    )}
                    {r.itemWajibTotal.length > 0 && (
                      <span className={`ml-1 font-normal ${r.wajibHave >= r.wajibNeeded && (r.wajibVarianNeeded == null || r.wajibVarianHave >= r.wajibVarianNeeded) ? 'text-pine-600' : 'text-clay-600'}`}>
                        (wajib{r.wajibVarianNeeded != null ? ` ${r.wajibVarianHave}/${r.wajibVarianNeeded} varian,` : ''} {r.wajibHave}/{r.wajibNeeded} {r.wajibUnit}{r.wajibPcsHave != null && r.wajibUnit === 'kotak' ? `, ${r.wajibPcsHave} pcs` : ''})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-ink-700/50 text-[11px] flex items-center gap-1"><Package size={10} /> {pengajuanPaketLabel(r)}</div>
                  <div className="font-semibold text-ink-900">{formatPengajuanPaket(r)}</div>
                </div>
                <div>
                  <div className="text-ink-700/50 text-[11px]">Form Fisik</div>
                  <FormFisikDot formFisik={r.formFisik} />
                </div>
                {r.note && (
                  <div className="col-span-2">
                    <div className="text-ink-700/50 text-[11px]">Note</div>
                    <NoteBadge note={r.note} sudahDikirim={r.sudahDikirim} />
                  </div>
                )}
              </div>
            </button>
          ))}
          {pageRows.length === 0 && (
            <div className="px-4 py-10 text-center text-ink-700/50 text-[13px]">
              Tidak ada data yang cocok dengan filter saat ini.
            </div>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-3 bg-sand-50/80 border-t border-sand-200 flex items-center justify-between text-[12.5px]">
              <span className="text-ink-700/60 uppercase tracking-wide">Subtotal Pengajuan Paket</span>
              <span className="font-semibold text-ink-900 text-right">{subtotalContent}</span>
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
