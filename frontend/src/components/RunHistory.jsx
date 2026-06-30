import { useState, useEffect } from 'react'

export default function RunHistory() {
  const [runs, setRuns]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${API}/api/runs`).then(r => r.json())
      .then(d => setRuns(d.runs || []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="panel" style={{ padding: 20 }}>
            <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 14 }}>
              {[1, 2, 3, 4].map(j => <div key={j} className="skeleton" style={{ height: 34, width: 80, borderRadius: 4 }} />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>No runs recorded yet</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 22, lineHeight: 1.8, fontStyle: 'italic' }}>
          Every agent run is tracked automatically with MLflow.<br/>
          Run an agent query to see metrics here.
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--gold)' }}>$</span> mlflow ui --port 5000
        </div>
      </div>
    )
  }

  const totalPapers = runs.reduce((s, r) => s + (r.papers_found || 0), 0)
  const avgDuration = Math.round(runs.reduce((s, r) => s + (r.duration_seconds || 0), 0) / runs.length)

  return (
    <div>
      {/* Summary metrics */}
      <div style={{ display: 'flex', gap: 1, marginBottom: 16 }}>
        {[
          { label: 'Total Runs',    value: runs.length },
          { label: 'Papers Fetched', value: totalPapers.toLocaleString() },
          { label: 'Avg Duration',  value: `${avgDuration}s` },
        ].map((m, i) => (
          <div key={m.label} className="panel" style={{
            flex: 1, padding: '12px 18px',
            borderRadius: i === 0 ? 'var(--radius) 0 0 var(--radius)' : i === 2 ? '0 var(--radius) var(--radius) 0' : 0,
            borderLeft: i > 0 ? 'none' : undefined,
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--gold)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {runs.map((run, i) => <RunCard key={run.run_id} run={run} />)}
      </div>
    </div>
  )
}

function RunCard({ run }) {
  const status = (run.status || '').toUpperCase()
  const statusCfg = {
    FINISHED: { color: 'var(--sage)',  bg: 'rgba(122,158,126,0.08)' },
    RUNNING:  { color: 'var(--amber)', bg: 'rgba(201,160,80,0.08)' },
    FAILED:   { color: 'var(--clay)',  bg: 'rgba(176,112,96,0.08)' },
  }[status] || { color: 'var(--muted)', bg: 'var(--surface)' }

  return (
    <div className="panel panel-hover" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4, color: 'var(--text)' }}>
            {run.query || 'Unnamed query'}
          </div>
          {run.start_time && (
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
              {new Date(run.start_time).toLocaleString()}
            </div>
          )}
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 3, fontSize: 11,
          color: statusCfg.color, background: statusCfg.bg,
          border: `1px solid ${statusCfg.color}30`,
          flexShrink: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
        }}>
          {status || 'UNKNOWN'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Papers',         value: run.papers_found },
          { label: 'Summaries',      value: run.papers_summarized },
          { label: 'Contradictions', value: run.contradictions_found },
          { label: 'Duration',       value: `${run.duration_seconds}s` },
          { label: 'Model',          value: run.model },
        ].filter(m => m.value !== undefined && m.value !== null && m.value !== '').map(m => (
          <div key={m.label}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text2)' }}>{m.value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
