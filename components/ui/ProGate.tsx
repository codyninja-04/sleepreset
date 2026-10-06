import { LockIcon } from './Icons'

export function ProGate({ title, body }: { title: string; body: string }) {
  return (
    <section className="card p-6 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
        <LockIcon size={20} />
      </div>
      <h2 className="mt-3 text-lg font-bold tracking-tight">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      <p className="mt-4 text-[13px] font-semibold text-text">Pro is $5 a month. Billing is coming soon.</p>
    </section>
  )
}
