import { useEffect, useRef } from 'react'

const STYLES = {
  info:  { color: 'var(--text2)', prefix: '›', prefixColor: 'var(--muted)' },
  error: { color: 'var(--clay)',  prefix: '✕', prefixColor: 'var(--clay)' },
  done:  { color: 'var(--sage)',  prefix: '✓', prefixColor: 'var(--sage)' },
}

export default function StatusLog({ logs, running }) {
  const bottomRef = useRef()
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  return (
    <div className="panel anim-slide-left" style={{ overflow: 'hidden', position: 'sticky', top: 74 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          agent.log
        </span>
        {running && (
          <div className="anim-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="live-dot pulsing" style={{ background: 'var(--sage)' }} />
            <span style={{ fontSize: 10, color: 'var(--sage)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Log body */}
      <div style={{
        padding: '12px 14px', maxHeight: 520, overflowY: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--muted2)', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>$ </span>waiting for agent…
            {running && <span style={{ animation: 'blink 1.1s step-start infinite', marginLeft: 2 }}>█</span>}
          </div>
        ) : (
          logs.map((log, i) => {
            const s = STYLES[log.type] || STYLES.info
            const isLast = i === logs.length - 1
            return (
              <div key={i} className="log-line" style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                <span style={{ color: s.prefixColor, flexShrink: 0, width: 12, textAlign: 'center', marginTop: 1 }}>{s.prefix}</span>
                <span style={{ color: s.color, lineHeight: 1.6, flex: 1 }}>
                  {log.msg}
                  {isLast && running && <span style={{ animation: 'blink 1.1s step-start infinite', marginLeft: 2, color: 'var(--muted)' }}>█</span>}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
