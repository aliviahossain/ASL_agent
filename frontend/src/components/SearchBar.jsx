import { useState } from 'react'

const EXAMPLES = ['exoplanet atmospheres', 'transformer attention', 'protein folding', 'diffusion models']

export default function SearchBar({ onSearch, searching }) {
  const [query, setQuery] = useState('')
  const [maxPerSource, setMaxPerSource] = useState(5)
  const [sources, setSources] = useState(['arxiv', 'semantic_scholar'])
  const [downloadPdfs, setDownloadPdfs] = useState(false)
  const [extractText, setExtractText] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const toggleSource = (src) =>
    setSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])

  const submit = () => {
    if (!query.trim() || searching || sources.length === 0) return
    onSearch(query.trim(), { maxPerSource, sources, downloadPdfs, extractText })
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter a research topic..."
          disabled={searching}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text)', fontSize: 15, outline: 'none',
          }}
        />
        <button onClick={submit} disabled={searching || !query.trim() || sources.length === 0}
          style={{
            padding: '12px 24px', borderRadius: 8, border: 'none',
            background: searching ? 'var(--surface2)' : 'var(--gold)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            opacity: searching || !query.trim() ? 0.6 : 1,
          }}>
          {searching ? 'Searching...' : 'Search'}
        </button>
        <button onClick={() => setShowOptions(p => !p)}
          style={{
            padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: showOptions ? 'var(--surface2)' : 'transparent',
            color: 'var(--muted)', fontSize: 14,
          }}>
          ⚙
        </button>
      </div>

      {showOptions && (
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 20, padding: '14px 0', borderTop: '1px solid var(--border)' }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Max per source:
            <input type="number" min={1} max={20} value={maxPerSource}
              onChange={e => setMaxPerSource(Number(e.target.value))}
              style={{ width: 56, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
            Sources:
            {['arxiv', 'semantic_scholar'].map(src => (
              <button key={src} onClick={() => toggleSource(src)}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 12,
                  background: sources.includes(src) ? 'var(--gold)' : 'transparent',
                  color: sources.includes(src) ? '#fff' : 'var(--muted)',
                }}>
                {src === 'arxiv' ? 'ArXiv' : 'Semantic Scholar'}
              </button>
            ))}
          </div>
          <label style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={downloadPdfs} onChange={e => setDownloadPdfs(e.target.checked)} />
            Download PDFs
          </label>
          {downloadPdfs && (
            <label style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={extractText} onChange={e => setExtractText(e.target.checked)} />
              Extract text
            </label>
          )}
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => setQuery(ex)}
            style={{
              padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--muted)', fontSize: 12,
            }}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
