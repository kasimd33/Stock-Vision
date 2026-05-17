export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-gray-800/60 rounded-xl animate-pulse ${className}`}>
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-700 rounded w-1/3" />
        <div className="h-6 bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  )
}
