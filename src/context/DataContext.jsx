import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { loadAllData } from '../lib/supabaseLoader'
import { computeRecap, computeKekuranganPaket } from '../lib/compute'

const DataContext = createContext(null)

const EMPTY = { sales: [], masterBarang: [], rekapanProgram: [], nominalWajib: [], periodeProgram: [] }

export function DataProvider({ children }) {
  const [raw, setRaw] = useState(EMPTY)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMsg, setErrorMsg] = useState(null)
  // default false: setiap baris di INPUT_REKAPAN_PROGRAM sudah membawa
  // AWAL PROGRAM / AKHIR PROGRAM sendiri, jadi periode itu dipakai secara
  // default supaya rekap selalu sesuai dengan yang tertulis di Excel.
  const [ignorePeriod, setIgnorePeriod] = useState(false)

  const load = useCallback(() => {
    setStatus('loading')
    setErrorMsg(null)
    loadAllData()
      .then((data) => {
        setRaw(data)
        setStatus('ready')
      })
      .catch((err) => {
        console.error(err)
        setErrorMsg(err.message || 'Gagal memuat data dari Supabase')
        setStatus('error')
      })
  }, [])

  useEffect(() => { load() }, [load])

  const meta = {
    source: 'supabase',
    tables: {
      sales: 'data_penjualan',
      masterBarang: 'master_barang',
      rekapanProgram: 'rekapan_program',
    },
  }

  const recap = useMemo(
    () => computeRecap(raw.sales, raw.masterBarang, raw.nominalWajib, raw.periodeProgram, { ignorePeriod }),
    [raw, ignorePeriod]
  )

  // Rekap "Pengajuan Paket": semua baris INPUT_REKAPAN_PROGRAM ditampilkan
  // apa adanya, dilengkapi qty yang sudah terkirim (dari data penjualan) dan
  // kekurangan qty yang masih perlu dikirim ke pelanggan.
  const kekuranganPaket = useMemo(
    () => computeKekuranganPaket(raw.rekapanProgram, raw.masterBarang, raw.sales),
    [raw]
  )

  const value = {
    ...raw, meta, status, errorMsg, reload: load,
    ignorePeriod, setIgnorePeriod,
    recap,
    kekuranganPaket,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
