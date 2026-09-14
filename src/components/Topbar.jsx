import React from 'react'
import { CalendarClock, DatabaseZap, PanelLeftOpen, RefreshCw } from 'lucide-react'
import { useData } from '../context/DataContext'
import { formatDateTime } from '../lib/format'

const TITLES = {
  overview: 'Ringkasan',
  recap: 'Rekap Program per Pelanggan',
  master: 'Data Master Program',
}

function CacheBadge() {
  const { meta, reload, status } = useData()
  if (!meta.cacheEnabled) return null

  return (
    <button
      onClick={reload}
      disabled={status === 'loading'}
      title="Ambil data terbaru langsung dari Supabase (lewati cache). Klik ini setiap habis npm run import:supabase."
      className="p-1.5 rounded-full border border-sand-200 bg-white text-ink-700 hover:bg-sand-100 disabled:opacity-50 transition-colors"
    >
      <RefreshCw size={13} className={status === 'loading' ? 'animate-spin' : ''} />
    </button>
  )
}

export default function Topbar({ active, sidebarHidden, onShowSidebar }) {
  const { ignorePeriod, setIgnorePeriod, meta, lastSyncedAt } = useData()

  return (
    <header className="sticky top-0 z-20 bg-sand-50/90 backdrop-blur border-b border-sand-200 px-5 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        {sidebarHidden && (
          <button
            onClick={onShowSidebar}
            title="Tampilkan sidebar"
            className="hidden md:flex mt-0.5 shrink-0 p-2 rounded-lg border border-sand-200 bg-white text-ink-700 hover:bg-sand-100 transition-colors"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
        <div>
          <h1 className="text-lg md:text-xl font-bold text-ink-900">{TITLES[active] || ''}</h1>
          <div className="hidden sm:flex text-[13px] text-ink-700/70 items-center gap-1.5 mt-0.5">
            <DatabaseZap size={13} />
            Sumber data: {meta.source === 'supabase' ? 'Supabase' : 'Excel lokal (public/data/)'}
            {meta.source === 'supabase' && (
              <span className="text-ink-700/50">
                · Sync terakhir: {lastSyncedAt ? formatDateTime(lastSyncedAt) : 'belum pernah (jalankan npm run import:supabase)'}
                {' '}· Jika data belum berubah, silahkan refresh halaman.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <CacheBadge />
        <div className="flex items-center flex-1 sm:flex-none bg-white border border-sand-200 rounded-full p-1 text-[13px] shadow-sm" title="Periode diambil dari kolom AWAL PROGRAM / AKHIR PROGRAM di INPUT_REKAPAN_PROGRAM.xlsx, per toko & program masing-masing">
          <button
            onClick={() => setIgnorePeriod(false)}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-full flex items-center justify-center gap-1.5 transition-colors ${
              !ignorePeriod ? 'bg-ink-900 text-white' : 'text-ink-700/70 hover:text-ink-900'
            }`}
          >
            <CalendarClock size={13} />
            <span className="hidden sm:inline">Sesuai periode Excel</span>
            <span className="sm:hidden">Periode</span>
          </button>
          <button
            onClick={() => setIgnorePeriod(true)}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-full flex items-center justify-center gap-1.5 transition-colors ${
              ignorePeriod ? 'bg-ink-900 text-white' : 'text-ink-700/70 hover:text-ink-900'
            }`}
          >
            <CalendarClock size={13} />
            <span className="hidden sm:inline">Semua transaksi</span>
            <span className="sm:hidden">Semua</span>
          </button>
        </div>
      </div>
    </header>
  )
}
