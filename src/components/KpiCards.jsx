import React, { useMemo } from 'react'
import { Users, CheckCircle2, CircleDashed, Wallet, PackageCheck } from 'lucide-react'
import { formatRupiah, formatNumber } from '../lib/format'

function Card({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-sand-200 rounded-2xl p-5 flex items-start gap-4 rise-in">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent + '1A', color: accent }}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] text-ink-700/70">{label}</div>
        <div className="text-2xl font-bold text-ink-900 mt-0.5 truncate">{value}</div>
        {sub && <div className="text-[12.5px] text-ink-700/60 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function KpiCards({ recap }) {
  const stats = useMemo(() => {
    const customers = new Set(recap.map((r) => r.kodeToko))
    const tercapai = recap.filter((r) => r.tercapai)
    const belum = recap.filter((r) => !r.tercapai)
    const totalOmset = recap.reduce((s, r) => s + r.omset, 0)
    // Pengajuan Paket cuma bermakna sebagai UNIT untuk program barang fisik.
    // Untuk program reward uang (BELANJA CERIA, DISPLAY HOKI) angkanya
    // sebenarnya nominal target, jadi dijumlah terpisah supaya tidak
    // tercampur (lihat juga src/lib/pengajuanPaket.js).
    const paketFisik = recap.filter((r) => !r.isCashReward)
    const rewardUang = recap.filter((r) => r.isCashReward)
    const totalPaket = paketFisik.reduce((s, r) => s + (r.pengajuanPaket || 0), 0)
    const totalNominalReward = rewardUang.reduce((s, r) => s + (r.pengajuanPaket || 0), 0)
    return {
      totalCustomer: customers.size,
      totalEntri: recap.length,
      tercapai: tercapai.length,
      belum: belum.length,
      totalOmset,
      totalPaket,
      totalNominalReward,
      rewardCount: rewardUang.length,
    }
  }, [recap])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <Card icon={Users} label="Pelanggan ikut program" value={stats.totalCustomer} sub={`${stats.totalEntri} kombinasi pelanggan × program`} accent="#234351" />
      <Card icon={CheckCircle2} label="Tercapai syarat" value={stats.tercapai} sub="Berhak atas reward" accent="#2F8F6B" />
      <Card icon={CircleDashed} label="Belum tercapai" value={stats.belum} sub="Masih ada kekurangan" accent="#C1543C" />
      <Card icon={Wallet} label="Total omset tercatat" value={formatRupiah(stats.totalOmset)} sub="Dari item program saja" accent="#C4922F" />
      <Card
        icon={PackageCheck}
        label="Total Pengajuan Paket"
        value={formatNumber(stats.totalPaket)}
        sub={stats.rewardCount > 0 ? `+ ${formatRupiah(stats.totalNominalReward)} nominal reward uang` : 'Unit paket fisik yang diajukan'}
        accent="#6B4EA6"
      />
    </div>
  )
}
