import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

// Dropdown multi-pilih generik (dipakai a.l. untuk filter Nama Pelanggan
// yang bisa punya ratusan pilihan). Ada kotak pencarian di dalamnya supaya
// tetap gampang dipakai walau daftar opsinya panjang. Klik di luar dropdown
// otomatis menutupnya.
export default function MultiSelect({ options, selected, onChange, placeholder, className = '' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const filteredOptions = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt))
    else onChange([...selected, opt])
  }

  const label =
    selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} dipilih`

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 bg-white border border-sand-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-ink-800/20 min-w-[170px] max-w-[220px] ${
          selected.length ? 'text-ink-900' : 'text-ink-700/60'
        }`}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown size={14} className="shrink-0 text-ink-700/50" />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-64 bg-white border border-sand-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-sand-200 flex items-center gap-1.5">
            <Search size={13} className="text-ink-700/40 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama pelanggan..."
              className="w-full text-[13px] outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-[12.5px] text-ink-700/50">Tidak ada hasil.</div>
            )}
            {filteredOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-sand-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="rounded border-sand-300"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full flex items-center justify-center gap-1 px-3 py-2 text-[12.5px] text-clay-600 hover:bg-clay-500/10 border-t border-sand-200"
            >
              <X size={12} /> Bersihkan ({selected.length})
            </button>
          )}
        </div>
      )}
    </div>
  )
}
