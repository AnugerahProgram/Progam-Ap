import React, { useMemo } from 'react'
import { Users, CheckCircle2, CircleDashed, Wallet, PackageCheck } from 'lucide-react'
import { formatRupiah, formatNumber } from '../lib/format'
import { CASH_REWARD_PROGRAMS } from '../lib/compute'

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
        <div className="text-2xl font-bold text-ink-900 mt-0.5 break-words">{value}</div>
        {sub && <div className="text-[12.5px] text-ink-700/60 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function KpiCards({ recap }) {
  const stats = useMemo(() => {
    const customers = new Set(recap.map((r) => r.kodeToko))
    const tercapaiRows = recap.filter((r) => r.tercapai)
    const belumRows = recap.filter((r) => !r.tercapai)
    const totalOmset = recap.reduce((s, r) => s + r.omset, 0)

    // Pengajuan Paket cuma bermakna sebagai UNIT untuk program barang fisik.
    // Untuk program reward uang (BELANJA CERIA, DISPLAY HOKI) angka
    // pengajuanPaket sebenarnya nominal target (bukan jumlah paket), jadi
    // untuk dua program itu dihitung COUNTROWS (jumlah entri), BUKAN dijumlah
    // nominalnya. NB: baris "recap" di sini tidak punya field isCashReward
    // (itu cuma ada di data kekuranganPaket) -- makanya dicek langsung dari
    // r.program terhadap CASH_REWARD_PROGRAMS.
    // Fungsi ini dipakai untuk hitung total paket dari SEKUMPULAN baris recap,
    // dengan logika yang sama persis dipakai untuk total keseluruhan maupun
    // untuk pecahan tercapai / belum tercapai, supaya:
    //   paket memenuhi syarat + paket belum memenuhi syarat = total pengajuan paket
    const hitungPaket = (rows) => {
      const paketFisik = rows.filter((r) => !CASH_REWARD_PROGRAMS.includes(r.program))
      const rewardUang = rows.filter((r) => CASH_REWARD_PROGRAMS.includes(r.program))
      const unitPaketFisik = paketFisik.reduce((s, r) => s + (r.pengajuanPaket || 0), 0)
      const countRewardUang = rewardUang.length
      return { totalPaket: unitPaketFisik + countRewardUang, unitPaketFisik, countRewardUang }
    }

    const totalPaketStat = hitungPaket(recap)
    const tercapaiPaketStat = hitungPaket(tercapaiRows)
    const belumPaketStat = hitungPaket(belumRows)

    return {
      totalCustomer: customers.size,
      totalEntri: recap.length,
      totalOmset,
      totalPaket: totalPaketStat.totalPaket,
      unitPaketFisik: totalPaketStat.unitPaketFisik,
      countRewardUang: totalPaketStat.countRewardUang,
      paketTercapai: tercapaiPaketStat.totalPaket,
      paketBelum: belumPaketStat.totalPaket,
    }
  }, [recap])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card
          icon={PackageCheck}
          label="Total Pengajuan Paket"
          value={formatNumber(stats.totalPaket)}
          sub={stats.countRewardUang > 0 ? `${formatNumber(stats.unitPaketFisik)} unit fisik + ${stats.countRewardUang} entri reward uang` : 'Unit paket fisik yang diajukan'}
          accent="#6B4EA6"
        />
        <Card icon={CheckCircle2} label="Paket memenuhi syarat" value={formatNumber(stats.paketTercapai)} sub="Berhak atas reward" accent="#2F8F6B" />
        <Card icon={CircleDashed} label="Paket belum memenuhi syarat" value={formatNumber(stats.paketBelum)} sub="Masih ada kekurangan" accent="#C1543C" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card icon={Users} label="Pelanggan ikut program" value={stats.totalCustomer} sub={`${stats.totalEntri} kombinasi pelanggan × program`} accent="#234351" />
        <Card icon={Wallet} label="Total omset tercatat" value={formatRupiah(stats.totalOmset)} sub="Dari item program saja" accent="#C4922F" />
      </div>
    </div>
  )
}
