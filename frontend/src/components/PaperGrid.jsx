export default function PaperGrid({ papers, summaries, query, onSelect }) {
  if (papers.length === 0) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div>
      <div className="anim-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
          {papers.length} paper{papers.length !== 1 ? 's' : ''} found
        </span>
        {Object.keys(summaries).length > 0 && (
          <span className="count-badge" style={{ fontSize: 12, padding: '1px 9px', borderRadius: 3, background: 'rgba(52,211,153,0.12)', color: 'var(--sage)', border: '1px solid rgba(52,211,153,0.3)', fontFamily: 'var(--font-mono)' }}>
            {Object.keys(summaries).length} summarised
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {papers.map((paper, i) => (
          <PaperCard key={paper.paper_id} paper={paper} summarized={!!summaries[paper.paper_id]} index={i} onClick={() => onSelect(paper)} />
        ))}
      </div>
    </div>
  )
}

function PaperCard({ paper, summarized, index, onClick }) {
  const isArxiv = paper.source === 'arxiv'
  const accentColor = isArxiv ? 'var(--gold)' : 'var(--sage)'

  return (
    <div
      onClick={onClick}
      className="panel panel-hover anim-fade-in-up"
      style={{
        borderLeft: `3px solid ${isArxiv ? 'var(--gold2)' : 'rgba(52,211,153,0.45)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        cursor: 'pointer',
        position: 'relative',
        animationDelay: `${Math.min(index, 8) * 0.06}s`,
      }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6, alignItems: 'flex-start' }}>
        <h3 style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.4, flex: 1, color: 'var(--text)' }}>
          {paper.title}
        </h3>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {summarized && (
            <span className="count-badge" style={{ fontSize: 11, padding: '1px 8px', borderRadius: 3, background: 'rgba(52,211,153,0.12)', color: 'var(--sage)', border: '1px solid rgba(52,211,153,0.3)', fontFamily: 'var(--font-mono)' }}>
              summarised
            </span>
          )}
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 3, background: 'var(--surface2)', color: accentColor, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)' }}>
            {isArxiv ? 'arXiv' : 'S2'}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 9, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontStyle: 'italic' }}>
        <span>{paper.authors?.slice(0, 3).join(', ')}{paper.authors?.length > 3 ? ' et al.' : ''}</span>
        {paper.published && <><span style={{ opacity: 0.35 }}>·</span><span>{paper.published.slice(0, 7)}</span></>}
        {paper.citation_count != null && <><span style={{ opacity: 0.35 }}>·</span><span>{paper.citation_count.toLocaleString()} citations</span></>}
        {paper.venue && <><span style={{ opacity: 0.35 }}>·</span><span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{paper.venue}</span></>}
      </div>

      {/* Abstract */}
      <p style={{
        fontSize: 14, color: 'var(--text2)', lineHeight: 1.7,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        marginBottom: paper.keywords?.length ? 10 : 0,
      }}>
        {paper.abstract}
      </p>

      {/* Keywords */}
      {paper.keywords?.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {paper.keywords.slice(0, 5).map(k => (
            <span key={k} className="tag" style={{ fontSize: 11 }}>{k}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--border)' }}>
      <div className="skeleton" style={{ height: 15, width: '78%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 12, width: '38%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 12, width: '88%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 12, width: '65%' }} />
    </div>
  )
}
