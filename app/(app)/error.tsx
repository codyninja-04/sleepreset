'use client'

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="text-lg font-bold">That did not load</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Something went wrong on our side. Your logs are safe. Try again in a moment.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  )
}
