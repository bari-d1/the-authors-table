import { useAdminMetrics } from '../hooks/useAdminMetrics'

function StatCard({ label, value }) {
  return (
    <div className="rounded-sharp border border-border bg-white p-5">
      <p className="font-body text-sm text-ink-muted">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-ink">{value}</p>
    </div>
  )
}

function BreakdownTable({ title, rows, valueKey }) {
  return (
    <div className="rounded-sharp border border-border bg-white p-5">
      <h3 className="mb-3 font-heading text-base font-bold text-ink">{title}</h3>
      {rows.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">No books yet.</p>
      ) : (
        <table className="w-full font-body text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.bookId} className="border-t border-border first:border-t-0">
                <td className="py-2 pr-3 text-ink">{row.title}</td>
                <td className="py-2 text-right text-ink-muted">{row[valueKey]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function MetricsPanel() {
  const { metrics, error } = useAdminMetrics()

  if (error) {
    return (
      <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink">
        Couldn't load metrics: {error}
      </p>
    )
  }

  if (metrics === null) {
    return (
      <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink-muted">
        Loading metrics…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total comments" value={metrics.totalComments} />
        <StatCard label="Total quote cards" value={metrics.totalQuoteCards} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BreakdownTable title="Comments per book" rows={metrics.byBook} valueKey="comments" />
        <BreakdownTable title="Quote cards per book" rows={metrics.byBook} valueKey="quoteCards" />
      </div>
    </div>
  )
}

export default MetricsPanel
