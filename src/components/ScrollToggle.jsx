import React from 'react'
import { ChevronsUp, ChevronsDown } from 'lucide-react'

// Tombol melayang buat lompat langsung ke atas/bawah halaman -- berguna
// di halaman Rekap Program yang tabelnya bisa panjang banget. Posisinya
// digeser ke atas dikit di layar HP (bottom-24) supaya tidak ketutup
// bottom nav.
export default function ScrollToggle() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const scrollBottom = () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-30 flex flex-col gap-2">
      <button
        onClick={scrollTop}
        title="Scroll ke atas"
        className="w-10 h-10 rounded-full bg-ink-900 text-white shadow-lg flex items-center justify-center hover:bg-ink-800 transition-colors"
      >
        <ChevronsUp size={18} />
      </button>
      <button
        onClick={scrollBottom}
        title="Scroll ke bawah"
        className="w-10 h-10 rounded-full bg-ink-900 text-white shadow-lg flex items-center justify-center hover:bg-ink-800 transition-colors"
      >
        <ChevronsDown size={18} />
      </button>
    </div>
  )
}
