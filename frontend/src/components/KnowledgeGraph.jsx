import { useRef, useCallback, useState, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const NODE_CFG = {
  paper:   { color: '#a78bfa', glow: 'rgba(167,139,250,0.6)', size: 9,  ring: '#c4b5fd' },
  concept: { color: '#34d399', glow: 'rgba(52,211,153,0.5)',  size: 5,  ring: '#6ee7b7' },
  method:  { color: '#fbbf24', glow: 'rgba(251,191,36,0.5)',  size: 6,  ring: '#fde68a' },
  dataset: { color: '#f87171', glow: 'rgba(248,113,113,0.5)', size: 5,  ring: '#fca5a5' },
  task:    { color: '#38bdf8', glow: 'rgba(56,189,248,0.5)',  size: 5,  ring: '#7dd3fc' },
}

const LEGEND = [
  { type: 'paper',   label: 'Paper' },
  { type: 'concept', label: 'Concept' },
  { type: 'method',  label: 'Method' },
  { type: 'dataset', label: 'Dataset' },
  { type: 'task',    label: 'Task' },
]

export default function KnowledgeGraph({ data }) {
  const fgRef   = useRef()
  const [hovered, setHovered]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [dims, setDims]         = useState({ w: 900, h: 520 })
  const containerRef = useRef()

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const el = entries[0].contentRect
      setDims({ w: Math.floor(el.width), h: Math.max(480, Math.floor(el.height)) })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  if (!data.nodes.length) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>
        <div style={{ fontSize: 14 }}>Knowledge graph appears here after the agent runs.</div>
        <div style={{ fontSize: 13, marginTop: 8, color: 'var(--muted2)' }}>Papers, concepts, and methods will be connected automatically.</div>
      </div>
    )
  }

  const filteredData = filter === 'all' ? data : {
    nodes: data.nodes.filter(n => n.type === 'paper' || n.type === filter),
    links: data.links.filter(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source
      const tid = typeof l.target === 'object' ? l.target.id : l.target
      const sn  = data.nodes.find(n => n.id === sid)
      const tn  = data.nodes.find(n => n.id === tid)
      return sn && tn && (sn.type === 'paper' || sn.type === filter) && (tn.type === 'paper' || tn.type === filter)
    }),
  }

  const nodeCanvasObject = useCallback((node, ctx, scale) => {
    const cfg = NODE_CFG[node.type] || NODE_CFG.concept
    const size = cfg.size + (hovered?.id === node.id || selected?.id === node.id ? 3 : 0)
    const isActive = hovered?.id === node.id || selected?.id === node.id

    if (isActive) {
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3)
      grad.addColorStop(0, cfg.glow)
      grad.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2)
      ctx.fillStyle = grad; ctx.fill()
    }

    if (node.type === 'paper') {
      ctx.beginPath(); ctx.arc(node.x, node.y, size + 2, 0, Math.PI * 2)
      ctx.strokeStyle = isActive ? cfg.ring : `${cfg.ring}50`
      ctx.lineWidth = 1.5; ctx.stroke()
    }

    ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? '#ffffff' : cfg.color; ctx.fill()

    const fontSize = Math.max(8 / scale, 3.5)
    const showLabel = scale > 1.2 || node.type === 'paper' || isActive
    if (showLabel) {
      const label = node.type === 'paper'
        ? (node.title || node.id).slice(0, 28)
        : (node.label || node.id).slice(0, 20)
      ctx.font = `${node.type === 'paper' ? 600 : 400} ${fontSize}px 'EB Garamond', Georgia, serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      const textY = node.y + size + 2
      ctx.fillStyle = 'rgba(4,6,14,0.85)'
      ctx.fillText(label, node.x + 0.5, textY + 0.5)
      ctx.fillStyle = isActive ? '#ffffff' : (node.type === 'paper' ? 'rgba(236,239,249,0.92)' : 'rgba(165,176,210,0.78)')
      ctx.fillText(label, node.x, textY)
    }
  }, [hovered, selected])

  const handleNodeClick = useCallback(node => {
    setSelected(s => s?.id === node.id ? null : node)
    fgRef.current?.centerAt(node.x, node.y, 600)
    fgRef.current?.zoom(node.type === 'paper' ? 3.5 : 2.5, 600)
  }, [])

  const stats = {
    papers:   data.nodes.filter(n => n.type === 'paper').length,
    concepts: data.nodes.filter(n => n.type === 'concept').length,
    methods:  data.nodes.filter(n => n.type === 'method').length,
    edges:    data.links.length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Toolbar */}
      <div className="panel" style={{
        padding: '10px 16px', borderRadius: 'var(--radius) var(--radius) 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 4, fontStyle: 'italic' }}>Filter:</span>
          {LEGEND.map(l => {
            const cfg = NODE_CFG[l.type]
            const active = filter === l.type
            return (
              <button key={l.type} onClick={() => setFilter(active ? 'all' : l.type)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '3px 11px',
                borderRadius: 3, border: `1px solid ${active ? cfg.color + '80' : 'var(--border)'}`,
                background: active ? `${cfg.color}18` : 'transparent',
                color: active ? cfg.ring : 'var(--muted)', fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font)',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                {l.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {[['papers', stats.papers], ['concepts', stats.concepts], ['methods', stats.methods], ['edges', stats.edges]].map(([lbl, val]) => (
            <span key={lbl}><strong style={{ color: 'var(--text2)' }}>{val}</strong> {lbl}</span>
          ))}
        </div>
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} style={{ position: 'relative', background: 'var(--bg)', borderRadius: '0 0 var(--radius) var(--radius)', border: '1px solid var(--border)', borderTop: 'none', overflow: 'hidden', height: 540 }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={filteredData}
          width={dims.w}
          height={dims.h}
          backgroundColor="#070a13"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          onNodeHover={setHovered}
          onNodeClick={handleNodeClick}
          linkColor={link => link.relation === 'SIMILAR_TO' ? 'rgba(167,139,250,0.45)' : 'rgba(120,132,175,0.22)'}
          linkWidth={link => link.relation === 'SIMILAR_TO' ? 1.5 : 1}
          linkDirectionalParticles={link => link.relation === 'SIMILAR_TO' ? 2 : 0}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={() => '#a78bfa'}
          linkDirectionalParticleSpeed={0.005}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTicks={150}
          enableNodeDrag={true}
        />

        {hovered && hovered.type === 'paper' && hovered !== selected && (
          <div className="anim-fade-in-up" style={{
            position: 'absolute', bottom: 16, left: 16, maxWidth: 360,
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderLeft: '3px solid var(--gold)', borderRadius: 6, padding: 14,
            pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>{hovered.title}</div>
            {hovered.abstract && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, fontStyle: 'italic' }}>{hovered.abstract.slice(0, 180)}…</div>}
          </div>
        )}

        {selected && selected.type !== 'paper' && (
          <div className="anim-scale-in" style={{
            position: 'absolute', bottom: 16, right: 16, maxWidth: 260,
            background: 'var(--surface2)', border: `1px solid ${NODE_CFG[selected.type]?.color + '50' || 'var(--border)'}`,
            borderRadius: 6, padding: 14, pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', color: NODE_CFG[selected.type]?.color || 'var(--muted)', marginBottom: 6 }}>
              {selected.type}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{selected.label || selected.id}</div>
          </div>
        )}

        <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
          scroll to zoom · drag nodes · click to focus
        </div>
      </div>
    </div>
  )
}
