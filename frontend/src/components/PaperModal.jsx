import { useEffect } from 'react'

export default function PaperModal({ paper, summary, onClose }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  const isArxiv = paper.source === 'arxiv'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,8,5,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderTop: '3px solid var(--gold)',
          borderRadius: 'var(--radius)',
          maxWidth: 820, width: '100%', maxHeight: '90vh',
          overflowY: 'auto',
        }}>

        <div style={{ padding: '26px 30px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 3, background: 'var(--surface2)', color: isArxiv ? 'var(--gold)' : 'var(--sage)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border)' }}>
                  {isArxiv ? 'arXiv' : 'Semantic Scholar'}
                </span>
                {paper.venue && <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>{paper.venue}</span>}
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.4, color: 'var(--text)' }}>
                {paper.title}
              </h2>
            </div>
            <button onClick={onClose} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--muted)', width: 34, height: 34, borderRadius: 4,
              fontSize: 14, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s',
            }}>✕</button>
          </div>

          {/* Authors / meta */}
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 26, display: 'flex', flexWrap: 'wrap', gap: 10, fontStyle: 'italic' }}>
            <span>{paper.authors?.join(', ')}</span>
            {paper.published && <MetaPill>{paper.published.slice(0, 10)}</MetaPill>}
            {paper.citation_count != null && <MetaPill>{paper.citation_count.toLocaleString()} citations</MetaPill>}
            {paper.doi && <MetaPill>DOI: {paper.doi}</MetaPill>}
          </div>

          <div style={{ width: '100%', height: 1, background: 'var(--border)', marginBottom: 24 }} />

          {/* Abstract */}
          <Section title="Abstract">
            <p style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--text2)' }}>{paper.abstract}</p>
          </Section>

          {/* AI Summary */}
          {summary && (
            <Section title="AI-Generated Summary">
              <div style={{
                background: 'rgba(122,158,126,0.05)', border: '1px solid rgba(122,158,126,0.2)',
                borderRadius: 6, padding: '16px 18px',
                fontSize: 15, lineHeight: 1.85, color: 'var(--text2)',
                whiteSpace: 'pre-wrap',
              }}>
                {summary}
              </div>
            </Section>
          )}

          {/* Keywords */}
          {paper.keywords?.length > 0 && (
            <Section title="Keywords">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {paper.keywords.map(k => <span key={k} className="tag">{k}</span>)}
              </div>
            </Section>
          )}

          {/* Links */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
            {paper.url && <LinkButton href={paper.url} primary>View Paper ↗</LinkButton>}
            {paper.pdf_url && <LinkButton href={paper.pdf_url}>Download PDF</LinkButton>}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaPill({ children }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>
      {children}
    </span>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function LinkButton({ href, children, primary }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      padding: '8px 20px', borderRadius: 4, fontSize: 14, fontWeight: 500,
      textDecoration: 'none', fontFamily: 'var(--font)',
      background: primary ? 'var(--gold)' : 'var(--surface)',
      border: primary ? 'none' : '1px solid var(--border2)',
      color: primary ? 'var(--bg)' : 'var(--text2)',
      transition: 'opacity 0.15s',
    }}>
      {children}
    </a>
  )
}
