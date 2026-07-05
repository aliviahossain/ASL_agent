import { useState, useEffect, useRef } from 'react'

const SLIDES = [
  // a/b: accent pair the hero text & UI re-tint to on each transition
  { id: 'photo-1462331940025-496dfbfc7564', label: 'Orion Nebula — deep field',        a: '#e879f9', b: '#c4b5fd' },
  { id: 'photo-1507842217343-583bb7270b66', label: 'The long room, Trinity College',   a: '#fbbf24', b: '#fde68a' },
  { id: 'photo-1451187580459-43490279c0fa', label: 'Earth — data in orbit',            a: '#38bdf8', b: '#a5f3fc' },
  { id: 'photo-1419242902214-272b3f66ee7a', label: 'Milky Way over the treeline',      a: '#5eead4', b: '#93c5fd' },
]

const DOMAINS = [
  { id: 'photo-1462331940025-496dfbfc7564', label: 'Astrophysics',      query: 'exoplanet atmospheres' },
  { id: 'photo-1532187863486-abf9dbad1b69', label: 'Chemistry',         query: 'catalyst discovery machine learning' },
  { id: 'photo-1446776877081-d282a0f896e2', label: 'Space Systems',     query: 'satellite constellation optimization' },
  { id: 'photo-1451187580459-43490279c0fa', label: 'Machine Learning',  query: 'transformer attention mechanisms' },
  { id: 'photo-1481627834876-b7833e8f5570', label: 'Meta-science',      query: 'reproducibility crisis metascience' },
  { id: 'photo-1464802686167-b939a6910659', label: 'Cosmology',         query: 'dark matter galaxy rotation' },
]

const src = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export default function CinematicHero({ children, onPreset }) {
  const [slide, setSlide] = useState(0)
  const [par, setPar] = useState({ x: 0, y: 0 })
  const heroRef = useRef()

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 9000)
    return () => clearInterval(t)
  }, [])

  const onMouseMove = e => {
    const r = heroRef.current?.getBoundingClientRect()
    if (!r) return
    setPar({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    })
  }

  return (
    <>
      <section ref={heroRef} className="cine-hero" onMouseMove={onMouseMove}
               style={{ '--hero-a': SLIDES[slide].a, '--hero-b': SLIDES[slide].b }}>
        {/* Ken Burns slideshow */}
        <div className="kb-stage" style={{ transform: `scale(1.08) translate(${par.x * -10}px, ${par.y * -7}px)` }}>
          {SLIDES.map((s, i) => (
            <div key={s.id + i} className={`kb-slide${i === slide ? ' active' : ''}`}>
              <img src={src(s.id, 1920)} alt="" loading={i === 0 ? 'eager' : 'lazy'}
                   onError={e => { e.currentTarget.style.display = 'none' }} />
            </div>
          ))}
        </div>
        <div className="cine-overlay" />

        {/* Content over imagery */}
        <div className="cine-content">
          <div className="anim-fade-in-up" style={{
            fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '2.5px',
            textTransform: 'uppercase', color: 'rgba(226,232,250,0.75)', marginBottom: 18,
          }}>
            Autonomous Scientific Literature Agent
          </div>

          <div className="anim-fade-in-up d1">
            <h1 className="hero-title-light" style={{
              fontSize: 'clamp(34px, 5.4vw, 58px)', fontWeight: 500, fontStyle: 'italic',
              letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 18,
            }}>
              Every paper. One question away.
            </h1>
          </div>

          <p className="anim-fade-in-up d2" style={{
            fontSize: 17, color: 'rgba(224,231,248,0.88)', maxWidth: 560,
            margin: '0 auto 36px', lineHeight: 1.8, textShadow: '0 1px 12px rgba(0,0,0,0.65)',
          }}>
            Searches ArXiv &amp; Semantic Scholar, summarizes with a local LLM, maps the
            knowledge graph, and flags contradictions — live, as it works.
          </p>

          {/* Search bar (AgentRunner) rendered over the imagery */}
          <div className="anim-fade-in-up d3" style={{ textAlign: 'left', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius)' }}>
            {children}
          </div>

          {/* Feature glass chips */}
          <div className="anim-fade-in-up d5" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            {['Paper Search', 'AI Summaries', 'Knowledge Graph', 'Contradiction Flags'].map(f => (
              <span key={f} className="glass-chip">{f}</span>
            ))}
          </div>
        </div>

        {/* Slide caption + dots */}
        <div className="cine-caption">{SLIDES[slide].label}</div>
        <div className="dot-nav">
          {SLIDES.map((_, i) => (
            <button key={i} aria-label={`Slide ${i + 1}`} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} />
          ))}
        </div>
      </section>

      {/* Image collage — click a field to prefill the search */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '64px 24px 80px' }}>
        <Reveal>
          <div className="ruled-heading" style={{ marginBottom: 8 }}>explore a field</div>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, fontStyle: 'italic', marginBottom: 28 }}>
            Click any image to load a starting query
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {DOMAINS.map((d, i) => (
            <Reveal key={d.label} delay={i * 90}>
              <div className="domain-card" onClick={() => onPreset(d.query)} role="button" tabIndex={0}
                   onKeyDown={e => e.key === 'Enter' && onPreset(d.query)}>
                <img src={src(d.id, 640)} alt={d.label} loading="lazy"
                     onError={e => { e.currentTarget.style.display = 'none' }} />
                <div className="shade" />
                <div className="cap">
                  <div style={{ fontSize: 17, fontWeight: 600, fontStyle: 'italic' }}>{d.label}</div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.75, marginTop: 3 }}>“{d.query}”</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}

/* Reveal-on-scroll wrapper */
function Reveal({ children, delay = 0 }) {
  const ref = useRef()
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal${inView ? ' in' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
