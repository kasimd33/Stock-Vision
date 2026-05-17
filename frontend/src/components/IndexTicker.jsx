/* Scrolling live index ticker strip */
const INDICES = [
  { label: 'NIFTY 50', val: '24,198', chg: '+0.42%', up: true },
  { label: 'SENSEX',   val: '79,802', chg: '+0.38%', up: true },
  { label: 'BANK NIFTY', val: '51,340', chg: '-0.12%', up: false },
  { label: 'NIFTY IT',   val: '38,920', chg: '+1.05%', up: true },
  { label: 'NIFTY FMCG', val: '54,210', chg: '+0.22%', up: true },
  { label: 'NIFTY AUTO', val: '22,870', chg: '-0.31%', up: false },
]

export default function IndexTicker({ live = [] }) {
  const items = live.length > 0
    ? live.map(i => ({ label: i.short, val: i.price?.toLocaleString('en-IN'), chg: `${i.change_pct >= 0 ? '+' : ''}${i.change_pct?.toFixed(2)}%`, up: i.change_pct >= 0 }))
    : INDICES

  const doubled = [...items, ...items, ...items]

  return (
    <div className="border-b border-white/8 bg-[#0a0f1a]/80 backdrop-blur overflow-hidden">
      <div className="flex gap-0 animate-[ticker_30s_linear_infinite] whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="inline-flex items-center gap-2 px-5 py-2 border-r border-white/8 shrink-0">
            <span className="text-gray-500 text-xs font-medium">{item.label}</span>
            <span className="text-white text-xs font-bold">₹{item.val}</span>
            <span className={`text-xs font-semibold ${item.up ? 'text-green-400' : 'text-red-400'}`}>{item.chg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
