import React from 'react'
import { NAV } from './Sidebar'

// Sidebar disembunyikan total di layar kecil (`hidden md:flex`), jadi tanpa
// ini pengguna HP tidak akan punya cara untuk pindah menu sama sekali.
// Bottom tab bar adalah pola paling gampang dijangkau ibu jari di HP.
export default function MobileNav({ active, onChange }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ink-900 border-t border-ink-800 flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {NAV.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] transition-colors ${
              isActive ? 'text-brass-400' : 'text-sand-200/60'
            }`}
          >
            <Icon size={19} strokeWidth={2.2} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
