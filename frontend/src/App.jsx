import { useState, useCallback, useEffect } from 'react'
import AgentRunner from './components/AgentRunner'
import StatusLog from './components/StatusLog'
import PaperGrid from './components/PaperGrid'
import PaperModal from './components/PaperModal'
import KnowledgeGraph from './components/KnowledgeGraph'
import ResearchSummary from './components/ResearchSummary'
import RunHistory from './components/RunHistory'
import CinematicHero from './components/CinematicHero'

const TABS = [
  { id: 'papers',   label: 'Papers' },
  { id: 'summary',  label: 'Research Summary' },
  { id: 'graph',    label: 'Knowledge Graph' },
  { id: 'history',  label: 'Run History' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('papers')
  const [papers, setPapers]       = useState([])
  const [summaries, setSummaries] = useState({})
  const [contradictions, setContradictions] = useState([])
  const [overview, setOverview]   = useState('')
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [logs, setLogs]           = useState([])
  const [running, setRunning]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [query, setQuery]         = useState('')
  const [health, setHealth]       = useState(null)
  const [preset, setPreset]       = useState('')

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${API}/api/health`).then(r => r.json()).then(setHealth).catch(() => {})
  }, [])

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, ts: Date.now() }])
  }, [])

  const handleRun = useCallback(async (searchQuery, options) => {
    setPapers([]); setSummaries({}); setContradictions([])
    setOverview(''); setGraphData({ nodes: [], links: [] })
    setLogs([]); setQuery(searchQuery); setPreset(searchQuery); setRunning(true)
    setActiveTab('papers')

    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const resp = await fetch(`${API}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, max_per_source: options.maxPerSource, sources: options.sources }),
      })
      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'status')       addLog(evt.message, 'info')
            else if (evt.type === 'error')   addLog(evt.message, 'error')
            else if (evt.type === 'done')    addLog(evt.message, 'done')
            else if (evt.type === 'paper')   setPapers(p => [...p, evt])
            else if (evt.type === 'summary') setSummaries(s => ({ ...s, [evt.paper_id]: evt.summary }))
            else if (evt.type === 'contradictions') setContradictions(evt.items || [])
            else if (evt.type === 'graph')   setGraphData({ nodes: evt.nodes, links: evt.links })
            else if (evt.type === 'overview') setOverview(evt.text)
          } catch {}
        }
      }
    } catch (err) { addLog(`Connection error: ${err.message}`, 'error') }
    finally { setRunning(false) }
  }, [addLog])

  const counts = {
    papers:  papers.length,
    summary: overview ? 1 : 0,
    graph:   graphData.nodes.length,
    history: 0,
  }
  const hasResults = papers.length > 0 || logs.length > 0

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header health={health} paperCount={papers.length} />

      {!hasResults && (
        <CinematicHero onPreset={setPreset}>
          <AgentRunner onRun={handleRun} running={running} preset={preset} dark />
        </CinematicHero>
      )}

      {hasResults && (
        <main style={{ maxWidth: 1380, margin: '0 auto', padding: '28px 24px' }}>
          <AgentRunner onRun={handleRun} running={running} preset={preset} />

          <div className="anim-fade-in-up">
            <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} counts={counts} />
            <div style={{ display: 'grid', gridTemplateColumns: '268px 1fr', gap: 20, marginTop: 20, alignItems: 'start' }}>
              <StatusLog logs={logs} running={running} />
              <div key={activeTab} className="tab-panel" style={{ minHeight: 400 }}>
                {activeTab === 'papers'  && <PaperGrid papers={papers} summaries={summaries} query={query} onSelect={setSelected} />}
                {activeTab === 'summary' && <ResearchSummary overview={overview} contradictions={contradictions} papers={papers} running={running} />}
                {activeTab === 'graph'   && <KnowledgeGraph data={graphData} />}
                {activeTab === 'history' && <RunHistory />}
              </div>
            </div>
          </div>
        </main>
      )}

      {selected && <PaperModal paper={selected} summary={summaries[selected.paper_id]} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Header({ health, paperCount }) {
  const ollamaOk = health && health.ollama_url
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`app-header anim-fade-in-down${scrolled ? ' scrolled' : ''}`} style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(11,14,23,0.8)',
      padding: '0 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 58, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="logo-mark" style={{
          width: 32, height: 32, borderRadius: 4,
          border: '1px solid var(--border2)',
          background: 'var(--surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontStyle: 'italic', fontWeight: 700, color: 'var(--gold)',
          cursor: 'default',
        }}>A</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: '0.01em', color: 'var(--text)' }}>ASL Agent</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            Autonomous Scientific Literature Explorer
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {paperCount > 0 && (
          <div className="stat-badge count-badge" style={{ background: 'var(--surface2)', color: 'var(--gold)', border: '1px solid var(--border2)' }}>
            {paperCount} papers
          </div>
        )}
        <div className="stat-badge" style={{
          background: 'var(--surface2)',
          color: ollamaOk ? 'var(--sage)' : 'var(--muted)',
          border: `1px solid ${ollamaOk ? 'rgba(52,211,153,0.35)' : 'var(--border)'}`,
        }}>
          <span className={ollamaOk ? 'live-dot' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: ollamaOk ? 'var(--sage)' : 'var(--muted)', display: 'inline-block' }} />
          Ollama {ollamaOk ? 'ready' : 'offline'}
        </div>
      </div>
    </header>
  )
}

function TabBar({ tabs, active, onChange, counts }) {
  return (
    <div style={{ display: 'flex', gap: 0, marginTop: 28, borderBottom: '1px solid var(--border)' }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} className={`tab-btn${isActive ? ' active' : ''}`} style={{
            padding: '8px 20px',
            border: 'none',
            background: 'transparent',
            color: isActive ? 'var(--gold)' : 'var(--muted)',
            fontWeight: isActive ? 600 : 400,
            fontSize: 15,
            fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            marginBottom: -1,
          }}>
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="count-badge" style={{
                background: isActive ? 'rgba(167,139,250,0.16)' : 'var(--surface2)',
                color: isActive ? 'var(--gold)' : 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: 3, padding: '0 6px', fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}>{counts[tab.id]}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

