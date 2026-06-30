export default function ResearchSummary({ overview, contradictions, papers, running }) {
  if (running && !overview) return <SummaryLoading />

  if (!overview) {
    return (
      <div className="panel" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>
        <div style={{ fontSize: 15 }}>Research overview will appear here once the agent finishes summarising papers…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Stats row */}
      {papers.length > 0 && (
        <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { label: 'Papers Analysed', value: papers.length },
            { label: 'Contradictions', value: contradictions.length, warn: contradictions.length > 0 },
            { label: 'Sources', value: [...new Set(papers.map(p => p.source))].join(' + ') },
          ].map((s, i) => (
            <div key={s.label} className="panel" style={{
              flex: 1, minWidth: 120, padding: '12px 18px',
              borderRadius: i === 0 ? 'var(--radius) 0 0 var(--radius)' : i === 2 ? '0 var(--radius) var(--radius) 0' : 0,
              borderLeft: i > 0 ? 'none' : undefined,
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: s.warn ? 'var(--clay)' : 'var(--gold)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Overview */}
      <div className="panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 2, height: 18, background: 'var(--gold)', borderRadius: 2, flexShrink: 0 }} />
          <h2 style={{ fontSize: 17, fontWeight: 500, fontStyle: 'italic', color: 'var(--text)' }}>Research Overview</h2>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--text2)' }}>
          <MarkdownRenderer text={overview} />
        </div>
      </div>

      {/* Contradictions */}
      {contradictions.length > 0 && (
        <div style={{ background: 'rgba(176,112,96,0.04)', border: '1px solid rgba(176,112,96,0.22)', borderRadius: 'var(--radius)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 2, height: 18, background: 'var(--clay)', borderRadius: 2, flexShrink: 0 }} />
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--clay)', fontStyle: 'italic' }}>
              Contradictions Detected ({contradictions.length})
            </h2>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {contradictions.map((c, i) => (
              <div key={i} style={{ background: 'rgba(176,112,96,0.05)', border: '1px solid rgba(176,112,96,0.15)', borderRadius: 6, padding: 16 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--clay)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {c.topic || 'Conflicting Claims'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[{ id: c.paper_a, claim: c.claim_a }, { id: c.paper_b, claim: c.claim_b }].map((side, si) => {
                    const p = papers.find(p => p.paper_id === side.id)
                    return (
                      <div key={si} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
                          {p ? p.title.slice(0, 48) + '…' : side.id}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{side.claim}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MarkdownRenderer({ text }) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h3 key={i} style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 22, marginBottom: 8 }}>
          {line.slice(3)}
        </h3>
      )
    }
    if (line.startsWith('# ')) {
      return <h2 key={i} style={{ fontSize: 18, fontWeight: 500, fontStyle: 'italic', marginTop: 24, marginBottom: 10, color: 'var(--text)' }}>{line.slice(2)}</h2>
    }
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={j} style={{ background: 'var(--surface2)', color: 'var(--gold)', padding: '1px 5px', borderRadius: 3, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{part.slice(1, -1)}</code>
      return part
    })
    return line
      ? <p key={i} style={{ marginBottom: 8 }}>{rendered}</p>
      : <div key={i} style={{ height: 6 }} />
  })
}

function SummaryLoading() {
  return (
    <div className="panel" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--gold2)', borderTopColor: 'var(--gold)', animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
        <span style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Generating research overview…</span>
      </div>
      {[100, 82, 95, 68, 88, 58].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: 13, width: `${w}%`, marginBottom: 10 }} />
      ))}
    </div>
  )
}
