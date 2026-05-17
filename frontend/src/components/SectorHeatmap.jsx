/* Sector heatmap grid */
const SECTORS = [
  { name: 'IT',       change: +1.42, size: 'col-span-2' },
  { name: 'Banking',  change: -0.38, size: 'col-span-2' },
  { name: 'Pharma',   change: +0.91, size: '' },
  { name: 'FMCG',     change: +0.22, size: '' },
  { name: 'Auto',     change: -0.55, size: '' },
  { name: 'Energy',   change: +0.67, size: '' },
  { name: 'Metals',   change: -1.12, size: '' },
  { name: 'Realty',   change: +2.10, size: '' },
]

function heatColor(chg) {
  if (chg >= 1.5)  return 'bg-green-500/40 border-green-500/30 text-green-300'
  if (chg >= 0.5)  return 'bg-green-500/20 border-green-500/20 text-green-400'
  if (chg >= 0)    return 'bg-green-500/10 border-green-500/10 text-green-500'
  if (chg >= -0.5) return 'bg-red-500/10 border-red-500/10 text-red-500'
  if (chg >= -1.5) return 'bg-red-500/20 border-red-500/20 text-red-400'
  return 'bg-red-500/40 border-red-500/30 text-red-300'
}

export default function SectorHeatmap() {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-400" />
        Sector Heatmap
      </h3>
      <div className="grid grid-cols-4 gap-1.5">
        {SECTORS.map(({ name, change, size }) => (
          <div key={name}
            className={`${size} border rounded-xl p-3 text-center cursor-default transition-all hover:scale-105 ${heatColor(change)}`}>
            <p className="text-xs font-semibold">{name}</p>
            <p className="text-xs font-bold mt-0.5">{change > 0 ? '+' : ''}{change.toFixed(2)}%</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/40" />
          <span className="text-gray-500 text-xs">Bearish</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/40" />
          <span className="text-gray-500 text-xs">Bullish</span>
        </div>
      </div>
    </div>
  )
}
