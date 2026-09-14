import React from 'react'
import { LayoutGrid, ClipboardList, Boxes, PanelLeftClose } from 'lucide-react'

// Menu "Pengajuan Paket" sudah digabung ke dalam menu "Rekap Program"
// (kolom Pengajuan Paket & Form Fisik ditampilkan langsung di tabel itu),
// jadi cuma tersisa 3 menu. NAV di-export supaya bisa dipakai ulang oleh
// bottom nav di layar HP (lihat MobileNav.jsx).
export const NAV = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutGrid },
  { id: 'recap', label: 'Rekap Program', icon: ClipboardList },
  { id: 'master', label: 'Data Master', icon: Boxes },
]

export default function Sidebar({ active, onChange, hidden, onHide }) {
  if (hidden) return null

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-ink-900 text-sand-100 px-4 py-6">
      <div className="px-2 mb-8 flex items-start justify-between gap-2">
        <div>
          <div className="text-brass-400 font-bold text-lg tracking-tight leading-tight">Rekap Program</div>
          <div className="text-ink-700 text-[13px] mt-0.5" style={{ color: '#7C93A0' }}>Supplier Compliance Board</div>
        </div>
        <button
          onClick={onHide}
          title="Sembunyikan sidebar"
          className="shrink-0 p-1.5 rounded-lg text-sand-200/60 hover:text-sand-50 hover:bg-ink-800/60 transition-colors"
        >
          <PanelLeftClose size={17} />
        </button>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14.5px] transition-colors text-left ${
                isActive
                  ? 'bg-ink-800 text-sand-50 font-semibold'
                  : 'text-sand-200/70 hover:bg-ink-800/60 hover:text-sand-50'
              }`}
            >
              <Icon size={17} strokeWidth={2} className={isActive ? 'text-brass-400' : ''} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
