import { useState, useRef, useEffect } from 'react'

const EXAMPLES = ['exoplanet atmospheres', 'transformer attention', 'protein folding', 'diffusion models', 'CRISPR gene editing']

export default function AgentRunner({ onRun, running, preset = '', dark = false }) {
  const [query, setQuery]             = useState(preset)
  const [maxPerSource, setMax]        = useState(5)
  const [sources, setSources]         = useState(['arxiv', 'semantic_scholar'])
  const [showOptions, setShowOptions] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    if (preset) { setQuery(preset); inputRef.current?.focus() }
  }, [preset])

  const toggle = src =>
    setSources(p => p.includes(src) ? p.filter(s => s !== src) : [...p, src])

  const submit = () => {
    if (!query.trim() || running || !sources.length) return
    onRun(query.trim(), { maxPerSource, sources })
  }

  return (
    <div>
      {/* Search bar */}
      <div className="search-shell anim-fade-in-up" style={{
        display: 'flex', gap: 0, alignItems: 'stretch',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter a research topic (e.g. 'diffusion models for protein design')"
          disabled={running}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 16,
            fontFamily: 'var(--font)',
            padding: '13px 18px',
          }}
        />
        <button
          onClick={() => setShowOptions(p => !p)}
          className="icon-btn"
          style={{
            background: showOptions ? 'var(--surface2)' : 'transparent',
            border: 'none',
            borderLeft: '1px solid var(--border)',
            color: showOptions ? 'var(--gold)' : 'var(--muted)',
            width: 44,
            fontSize: 14,
            flexShrink: 0,
          }}
          title="Options">
          ⚙
        </button>
        <button
          onClick={submit}
          disabled={running || !query.trim() || !sources.length}
          className={`btn-primary${running ? ' running-glow' : ''}`}
          style={{
            padding: '0 28px',
            border: 'none',
            borderLeft: '1px solid var(--border)',
            background: (running || !query.trim()) ? 'var(--surface2)' : 'var(--gold)',
            color: (running || !query.trim()) ? 'var(--muted)' : 'var(--bg)',
            fontWeight: 600,
            fontSize: 15,
            fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            cursor: (running || !query.trim()) ? 'not-allowed' : 'pointer',
          }}>
          {running ? <><Spinner />Running…</> : 'Run Agent'}
        </button>
      </div>

      {/* Options drawer */}
      {showOptions && (
        <div className="panel drawer" style={{ marginTop: 6, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', borderRadius: 'var(--radius)' }}>
          <OptionGroup label="Papers per source">
            <input type="number" min={1} max={20} value={maxPerSource}
              onChange={e => setMax(Number(e.target.value))}
              style={{
                width: 60, padding: '4px 8px', borderRadius: 4,
                border: '1px solid var(--border2)', background: 'var(--bg)',
                color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)',
              }} />
          </OptionGroup>
          <OptionGroup label="Sources">
            <div style={{ display: 'flex', gap: 8 }}>
              {[['arxiv', 'ArXiv'], ['semantic_scholar', 'Semantic Scholar']].map(([id, label]) => (
                <button key={id} onClick={() => toggle(id)} className="src-chip" style={{
                  padding: '4px 14px', borderRadius: 3, fontSize: 13, fontFamily: 'var(--font)',
                  border: `1px solid ${sources.includes(id) ? 'var(--gold)' : 'var(--border)'}`,
                  background: sources.includes(id) ? 'rgba(167,139,250,0.12)' : 'transparent',
                  color: sources.includes(id) ? 'var(--gold)' : 'var(--muted)',
                }}>{label}</button>
              ))}
            </div>
          </OptionGroup>
        </div>
      )}

      {/* Example chips */}
      <div className="anim-fade-in-up d2" style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: dark ? 'rgba(226,232,250,0.7)' : 'var(--muted)', fontStyle: 'italic' }}>Try:</span>
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => { setQuery(ex); inputRef.current?.focus() }} disabled={running}
            className={`tag${dark ? ' tag-dark' : ''}`}
            style={{ background: 'none', cursor: 'pointer' }}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

function OptionGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{label}</span>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 12, height: 12, borderRadius: '50%', display: 'inline-block',
      border: '1.5px solid rgba(167,139,250,0.3)', borderTopColor: 'var(--gold)',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}
