export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-subtle" />
      <div className="h-4 w-64 animate-pulse rounded bg-subtle" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-28 animate-pulse bg-subtle/60" />
        ))}
      </div>
    </div>
  )
}
