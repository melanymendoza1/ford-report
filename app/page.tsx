'use client'
import { useState, useEffect, useMemo } from 'react'
import { ReportData } from './types'
import { N, getBrandColor, shortName } from './utils'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/* ═══ TOKENS ═══ */
const C = { night: '#081534', navy: '#133A7C', steel: '#2A6BAC', sky: '#47A8E5', bg: '#F0F4F8', w: '#FFF', brd: '#E8ECF1', mut: '#8896AB', txt: '#1A2332', sub: '#5A6B80', up: '#0D9F6E', upB: '#ECFDF5', dn: '#DC2626', dnB: '#FEF2F2', ac: '#3B82F6', acB: '#EFF6FF', gld: '#F59E0B', glB: '#FFFBEB' }
const SEG: Record<string, string> = { 'B SUV': 'BSUV', 'C SUV': 'Compact', 'D SUV': 'Midsize', 'E SUV': 'Full Size', 'PREMIUM SUV': 'Premium' }
const cn = (c: string) => ({ 'AUTOMOV. DE PASAJEROS': 'Automóviles', 'SUV': 'SUV', 'PICK UPS': 'Pick Ups', 'CAMION': 'Camiones', 'BUS': 'Buses', 'VAN': 'Vans' }[c] || c)
const sn = (s: string) => SEG[s] || s
const fc = (v: number) => Math.round(v / 3 * 12)
const gr = (c: number, gap = 16) => ({ display: 'grid' as const, gridTemplateColumns: `repeat(${c},1fr)`, gap, marginBottom: 20 })
const PROVS = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']

const TABS = [
  { id: 'ind', l: 'Industria' }, { id: 'comb', l: 'Combustibles' }, { id: 'seg', l: 'SUV Segmentos' },
  { id: 'g25', l: 'Gas 25-40K' }, { id: 'h25', l: 'HEV 25-40K' }, { id: 'h40', l: 'HEV 40-50K' },
  { id: 's55', l: 'SUV 55-80K' }, { id: 's80', l: 'SUV +80K' },
  { id: 'pcat', l: 'Pickups' }, { id: 'pd', l: 'PU Diesel' }, { id: 'pf', l: 'PU Full Size' },
  { id: 'ford', l: 'Ford Portfolio' },
]

/* ═══ UI PRIMITIVES ═══ */
const Card = ({ children, s }: { children: React.ReactNode, s?: React.CSSProperties }) =>
  <div style={{ background: C.w, border: `1px solid ${C.brd}`, borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.04)', ...s }}>{children}</div>
const Lbl = ({ children }: { children: React.ReactNode }) =>
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: C.mut, marginBottom: 14 }}>{children}</div>
const Hd = ({ tag, title }: { tag: string, title: string }) =>
  <div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: C.ac, marginBottom: 4 }}>{tag}</div><h2 style={{ fontSize: 22, fontWeight: 700, color: C.txt, margin: 0 }}>{title}</h2></div>

function Ins({ items }: { items: string[] }) {
  return <div style={{ padding: '14px 20px', background: C.acB, borderLeft: `3px solid ${C.ac}`, borderRadius: '0 12px 12px 0', marginBottom: 20 }}>
    {items.map((t, i) => <div key={i} style={{ fontSize: 13, lineHeight: 1.7, color: C.navy }}>• {t}</div>)}
  </div>
}

/* Delta with context: ↑ +73.2% vs 306 un. */
function Dl({ a, b, suffix }: { a?: number | null, b?: number | null, suffix?: string }) {
  if (a == null || !b) return <span style={{ color: C.mut, fontSize: 11 }}>—</span>
  if (b === 0) return <span style={{ color: C.up, fontSize: 11, fontWeight: 600 }}>NEW</span>
  const v = ((a - b) / b * 100); const u = v >= 0
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>
    {u ? '↑' : '↓'} {Math.abs(v).toFixed(1)}% vs {N(b)} un.{suffix ? ` ${suffix}` : ''}
  </span>
}

function KPI({ label, value, sub, icon, accent = 'blue' }: { label: string, value: string, sub?: string, icon?: string, accent?: string }) {
  const a = { blue: C.ac, green: C.up, gold: C.gld, navy: C.navy }[accent] || C.ac
  return <Card s={{ borderLeft: `4px solid ${a}`, position: 'relative', overflow: 'hidden' }}>
    {icon && <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 12, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>}
    <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>{sub}</div>}
  </Card>
}

function Foto({ name, price, v26, v25, img, hideUnits }: { name: string, price?: string, v26?: number | null, v25?: number | null, img?: string, hideUnits?: boolean }) {
  return <Card s={{ padding: 0, overflow: 'hidden' }}>
    <div style={{ height: 150, background: 'linear-gradient(135deg,#F8FAFC,#EDF2F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {img ? <img src={img} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <div style={{ color: C.mut, fontSize: 32 }}>🚗</div>}
    </div>
    <div style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>{name}</div>
      {price && <div style={{ fontSize: 12, color: C.ac, fontWeight: 600, marginTop: 2 }}>{price}</div>}
      {!hideUnits && v26 != null && <>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(v26)}</span>
          <span style={{ fontSize: 11, color: C.mut }}>un. YTD</span>
        </div>
        {v25 != null && <div style={{ marginTop: 6 }}><Dl a={v26} b={v25} /></div>}
      </>}
    </div>
  </Card>
}

function RankBar({ rank, name, val, max, ford, v25, models }: { rank: number, name: string, val: number, max: number, ford?: boolean, v25?: number, models?: { n: string, v: number }[] }) {
  const w = max > 0 ? (val / max) * 100 : 0
  return <div style={{ padding: '10px 0', borderBottom: `1px solid ${C.bg}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: ford ? C.ac : C.mut, textAlign: 'center' }}>#{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: ford ? 700 : 600, color: ford ? C.navy : C.txt }}>{shortName(name)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: ford ? C.navy : C.txt }}>{N(val)}</span>
            {v25 != null && <Dl a={val} b={v25} />}
          </div>
        </div>
        <div style={{ height: 5, background: C.bg, borderRadius: 99, overflow: 'hidden', marginBottom: models && models.length > 0 ? 6 : 0 }}>
          <div style={{ width: `${w}%`, height: '100%', borderRadius: 99, background: ford ? `linear-gradient(90deg,${C.navy},${C.ac})` : `linear-gradient(90deg,${C.brd},#D1D5DB)` }} />
        </div>
        {models && models.length > 0 && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {models.map(m => <span key={m.n} style={{ fontSize: 10, color: C.sub, background: C.bg, padding: '2px 8px', borderRadius: 4 }}>
            {shortName(m.n)}: <strong>{N(m.v)}</strong>
          </span>)}
        </div>}
      </div>
    </div>
  </div>
}

function SubTab({ tabs, active, onChange }: { tabs: { id: string, label: string }[], active: string, onChange: (id: string) => void }) {
  return <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => <button key={t.id} onClick={() => onChange(t.id)} style={{ fontSize: 12, fontWeight: 600, padding: '10px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', background: active === t.id ? C.navy : C.bg, color: active === t.id ? '#fff' : C.sub }}>{t.label}</button>)}
  </div>
}

/* Province selector + chart */
function ProvSection({ data, label }: { data: any[], label: string }) {
  const [sel, setSel] = useState('TODAS')
  if (!data || !data.length) return null
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const items = provOrder.map(p => data.find((r: any) => (r.label || r.prov) === p)).filter(Boolean)
  if (!items.length) return null

  const chartData = items.map((r: any) => {
    const nm = r.label || r.prov
    const v26 = r.ytd2026 || 0, v25 = r.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    return { prov: nm, '2025 YTD': v25, '2026 YTD': v26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const ProvDL = (props: any) => {
    const { x, y, width, index } = props
    if (!chartData[index]) return null
    const dd = chartData[index].delta
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text>
  }

  return <Card s={{ marginTop: 16 }}>
    <Lbl>{label}</Lbl>
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {['TODAS', ...provOrder].map(p =>
        <button key={p} onClick={() => setSel(p)} style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', background: sel === p ? C.navy : C.bg, color: sel === p ? '#fff' : C.sub }}>{p}</button>
      )}
    </div>
    {sel === 'TODAS' ? (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={20}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<ProvDL />} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      (() => {
        const r = items.find((x: any) => (x.label || x.prov) === sel)
        if (!r) return null
        const v26 = r.ytd2026 || 0, v25 = r.ytd2025 || 0
        return <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '12px 0' }}>
          <div>
            <div style={{ fontSize: 11, color: C.mut }}>2025 YTD</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.sub }}>{N(v25)}</div>
          </div>
          <div style={{ fontSize: 28, color: C.mut }}>→</div>
          <div>
            <div style={{ fontSize: 11, color: C.mut }}>2026 YTD</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy }}>{N(v26)}</div>
          </div>
          <div><Dl a={v26} b={v25} /></div>
        </div>
      })()
    )}
  </Card>
}

/* ═══ BRAND RANKING (integrated — no separate W&L) ═══ */
function BrandRanking({ data, dataKey, wlKey, fordModel }: { data: any, dataKey: string, wlKey: string | null, fordModel: string }) {
  const rows = data[dataKey]?.NACIONAL || []
  const r25 = rows.find((r: any) => r.year === '2025') || {} as any
  const r26 = rows.find((r: any) => r.year === '2026') || {} as any
  const allBrands = Object.keys(r26).filter(k => k !== 'year' && !k.includes(' . '))
  const brands = allBrands.filter(b => (r26[b] || 0) > 0).sort((a, b) => (r26[b] || 0) - (r26[a] || 0))
  const top10 = brands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => r26[b] || 0), 1)
  const fordIn = top10.includes('FORD')
  const fordPos = brands.indexOf('FORD') + 1
  const precio = (data.precios_ford || []).find((p: any) => p.modelo === fordModel)

  const getModels = (brand: string) => Object.keys(r26).filter(k => k.startsWith(brand + ' . ') && r26[k]).sort((a, b) => (r26[b] || 0) - (r26[a] || 0)).slice(0, 2).map(k => ({ n: k, v: r26[k] }))

  // Line chart data for top 5
  const top5 = brands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const row = rows.find((r: any) => r.year === yr) || {} as any
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
    if (!top5.includes('FORD') && (r26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
    return obj
  })
  const lineKeys = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (r26['FORD'] || 0) > 0 ? ['FORD'] : [])]

  return <>
    <div style={gr(2)}>
      <Card>
        <Lbl>Top marcas · YTD 2026</Lbl>
        {top10.map((b, i) => <RankBar key={b} rank={i + 1} name={b} val={r26[b] || 0} max={maxV} ford={b === 'FORD'} v25={r25[b]} models={getModels(b)} />)}
        {!fordIn && (r26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={r26['FORD'] || 0} max={maxV} ford v25={r25['FORD']} models={getModels('FORD')} />
        </>}
        {precio && <div style={{ marginTop: 16, padding: '14px 18px', background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', borderRadius: 12 }}>
          <div style={{ fontSize: 10, color: C.mut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ford en este rango</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{precio.modelo} {precio.trim}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.ac }}>{precio.precio}</span>
          </div>
        </div>}
      </Card>
      <Card>
        <Lbl>Evolución top marcas · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {lineKeys.map((b, i) => {
              const BCOLORS = ['#DC2626','#059669','#D97706','#7C3AED','#0891B2','#BE185D','#4338CA','#65A30D','#EA580C','#6366F1']
              return <Line key={b} type="monotone" dataKey={b} stroke={b === 'FORD' ? C.navy : BCOLORS[i % BCOLORS.length]} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />
            })}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  </>
}

/* ═══ MAIN ═══ */
export default function Page() {
  const [data, setData] = useState<ReportData | null>(null)
  const [tab, setTab] = useState('ind')
  useEffect(() => { fetch('/report_data.json').then(r => r.json()).then(setData) }, [])
  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg }}><div style={{ fontSize: 16, color: C.navy, fontWeight: 600 }}>Cargando reporte…</div></div>

  const ytdM = ((data as any).mercado_ytd || []) as any[]
  const ytdF = ((data as any).ford_ytd || []) as any[]
  const mT = ytdM.find((r: any) => r.cat === 'Total general') || {} as any
  const fT = ytdF.find((r: any) => r.cat === 'Total general') || {} as any
  const dInd = mT.ytd2025 ? ((mT.ytd2026 - mT.ytd2025) / mT.ytd2025 * 100).toFixed(1) : '0'
  const dFord = fT.ytd2025 ? ((fT.ytd2026 - fT.ytd2025) / fT.ytd2025 * 100).toFixed(1) : '0'
  const msF = mT.ytd2026 ? ((fT.ytd2026 || 0) / mT.ytd2026 * 100).toFixed(2) : '0'
  const ms25 = mT.ytd2025 ? ((fT.ytd2025 || 0) / mT.ytd2025 * 100).toFixed(2) : '0'

  return <div style={{ minHeight: '100vh', background: C.bg }}>
    {/* HEADER */}
    <header style={{ background: C.night, position: 'sticky', top: 0, zIndex: 50, padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <img src="/images/logo_orgu_ford.png" alt="Orgu Ford" style={{ height: 28 }} />
      <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Análisis de Mercado Automotriz</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ background: C.sky, color: C.night, fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 99 }}>{data.report_month}</span>
        <button onClick={() => window.print()} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#94BFDC', fontSize: 11, padding: '5px 14px', borderRadius: 99, cursor: 'pointer' }}>⎙ Imprimir</button>
      </div>
    </header>

    {/* NAV */}
    <nav style={{ background: C.w, borderBottom: `1px solid ${C.brd}`, position: 'sticky', top: 56, zIndex: 40 }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ fontSize: 11, fontWeight: 600, padding: '14px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: tab === t.id ? `3px solid ${C.ac}` : '3px solid transparent', color: tab === t.id ? C.navy : C.mut, whiteSpace: 'nowrap' }}>{t.l}</button>)}
      </div>
    </nav>

    {/* HERO — ONLY ON INDUSTRIA */}
    {tab === 'ind' && <div style={{ background: `linear-gradient(135deg,${C.night},#0F2B5E)`, padding: '28px 32px 32px' }}>
      <div style={{ maxWidth: 1360, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: C.sky, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Q1 2026 · YTD Comparable ene-feb-mar</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Ford crece 1.8x más rápido que el mercado</h1>
        <p style={{ fontSize: 13, color: '#7BA8D4', margin: '0 0 20px' }}>Industria +{dInd}% vs Ford +{dFord}% YTD comparable (ene-feb-mar 2026 vs 2025)</p>
        <div style={gr(4, 16)}>
          {[
            { l: 'Industria YTD', v: N(mT.ytd2026), s: `↑ +${dInd}% vs ${N(mT.ytd2025)} un. (2025 YTD)`, c: C.sky },
            { l: 'Ford Nacional YTD', v: N(fT.ytd2026), s: `↑ +${dFord}% vs ${N(fT.ytd2025)} un. (2025 YTD)`, c: '#10B981' },
            { l: 'Market Share Ford', v: `${msF}%`, s: `vs ${ms25}% (2025 YTD)`, c: C.gld },
            { l: 'Forecast 2026', v: N(fc(fT.ytd2026 || 0)), s: 'Proyección lineal · 3m × 4', c: '#94A3B8' },
          ].map((k, i) => <div key={i} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: '16px 20px', borderLeft: `4px solid ${k.c}` }}>
            <div style={{ fontSize: 10, color: '#7BA8D4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{k.l}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: '#4ade80', marginTop: 6 }}>{k.s}</div>
          </div>)}
        </div>
      </div>
    </div>}

    {/* CONTENT */}
    <main style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 32px 80px' }}>
      {tab === 'ind' && <T1 d={data} />}
      {tab === 'comb' && <T2 d={data} />}
      {tab === 'seg' && <T3 d={data} />}
      {tab === 'g25' && <T4 d={data} />}
      {tab === 'h25' && <T5 d={data} />}
      {tab === 'h40' && <T6 d={data} />}
      {tab === 's55' && <T7 d={data} />}
      {tab === 's80' && <T8 d={data} />}
      {tab === 'pcat' && <T9 d={data} />}
      {tab === 'pd' && <T10 d={data} />}
      {tab === 'pf' && <T11 d={data} />}
      {tab === 'ford' && <T12 d={data} />}
    </main>

    <footer style={{ borderTop: `1px solid ${C.brd}`, padding: '20px 32px', textAlign: 'center', background: C.w }}>
      <p style={{ fontSize: 11, color: C.mut, margin: 0 }}>Datos a {data.report_month} · Fuente: AEADE Matriculación · YTD comparable ene-feb-mar · Orgu Ford Ecuador</p>
    </footer>
  </div>
}

/* ═══ T1: INDUSTRIA ═══ */
function T1({ d }: { d: any }) {
  const ytdM = (d.mercado_ytd || []).filter((r: any) => r.cat !== 'Total general')
  const ytdF = (d.ford_ytd || []) as any[]
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const provs = provOrder.map(p => (d.provincias_ytd || []).find((r: any) => r.prov === p)).filter(Boolean)
  const fProvs = d.ford_provincias_ytd || []
  const catProv = d.cat_por_provincia_ytd || []
  const [selProv, setSelProv] = useState('TODAS')

  /* Chart data with delta labels */
  const chartData = ytdM.map((r: any) => {
    const pct = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
    return { cat: cn(r.cat), '2025 YTD': r.ytd2025, '2026 YTD': r.ytd2026, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })

  /* Custom bar label showing delta */
  const DeltaLabel = (props: any) => {
    const { x, y, width, index } = props
    if (!chartData[index]) return null
    const d = chartData[index].delta
    const isNeg = d.startsWith('-')
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={isNeg ? C.dn : C.up}>{d}</text>
  }

  return <>
    <Hd tag="Industria Nacional + Zona Orgu" title="Análisis de mercado automotriz" />
    <Ins items={['El mercado ecuatoriano crece +41.7% YTD. Ford crece 1.8x más rápido que la industria (+73.2%)', 'Estamos ganando share en un mercado que se expande — la mejor combinación posible']} />

    {/* Chart with deltas on bars */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>YTD Comparable ene-feb-mar · Industria por categoría</Lbl>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={22}>
          <XAxis dataKey="cat" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<DeltaLabel />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Table — simplified headers, delta as just percentage */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Detalle por categoría · Industria + Ford</Lbl>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ borderBottom: `2px solid ${C.brd}` }}>
          {['Categoría', 'Industria 2025 YTD', 'Industria 2026 YTD', 'Var', 'Ford 2025 YTD', 'Ford 2026 YTD', 'Var', 'MS Ford'].map((h, i) =>
            <th key={h} style={{ padding: '8px 6px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontWeight: 600, color: C.mut, textTransform: 'uppercase' }}>{h}</th>)}
        </tr></thead>
        <tbody>{ytdM.map((r: any) => {
          const f = ytdF.find((fr: any) => fr.cat === r.cat) || {} as any
          const indVar = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100) : 0
          const fordVar = f.ytd2025 ? ((f.ytd2026 - f.ytd2025) / f.ytd2025 * 100) : 0
          return <tr key={r.cat} style={{ borderBottom: `1px solid ${C.bg}` }}>
            <td style={{ padding: '8px 6px', fontWeight: 600, color: C.txt }}>{cn(r.cat)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', color: C.sub }}>{N(r.ytd2025)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.navy }}>{N(r.ytd2026)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: indVar >= 0 ? C.up : C.dn }}>{indVar >= 0 ? '↑' : '↓'} {Math.abs(indVar).toFixed(1)}%</span>
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'right', color: C.sub }}>{N(f.ytd2025)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.ac }}>{N(f.ytd2026)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: fordVar >= 0 ? C.up : C.dn }}>{fordVar >= 0 ? '↑' : '↓'} {Math.abs(fordVar).toFixed(1)}%</span>
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: C.steel }}>{r.ytd2026 ? ((f.ytd2026 || 0) / r.ytd2026 * 100).toFixed(2) + '%' : '—'}</td>
          </tr>
        })}</tbody>
      </table>
    </Card>

    {/* ZONA ORGU TABLE — sum of 4 provinces */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Zona Orgu · Detalle por categoría (Pichincha + Guayas + Manabí + El Oro)</Lbl>
      {(() => {
        const provKeys = ['cat_pichincha_ytd', 'cat_guayas_ytd', 'cat_manabi_ytd', 'cat_eloro_ytd']
        const cats = ['AUTOMOV. DE PASAJEROS', 'BUS', 'CAMION', 'PICK UPS', 'SUV', 'VAN']
        const zonaData = cats.map(cat => {
          let s25 = 0, s26 = 0, s24 = 0
          provKeys.forEach(pk => {
            const rows = (d[pk] || []) as any[]
            const r = rows.find((x: any) => x.cat === cat)
            if (r) { s24 += (r.ytd2024 || 0); s25 += (r.ytd2025 || 0); s26 += (r.ytd2026 || 0) }
          })
          return { cat, s24, s25, s26 }
        })
        const totZ = zonaData.reduce((a, r) => ({ s24: a.s24 + r.s24, s25: a.s25 + r.s25, s26: a.s26 + r.s26 }), { s24: 0, s25: 0, s26: 0 })
        // Ford zona orgu
        const fZona = fProvs.filter((fp: any) => fp.prov !== 'Total general')
        const fZ25 = fZona.reduce((s: number, fp: any) => s + (fp.ytd2025 || 0), 0)
        const fZ26 = fZona.reduce((s: number, fp: any) => s + (fp.ytd2026 || 0), 0)

        return <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ borderBottom: `2px solid ${C.brd}` }}>
            {['Categoría', 'Zona Orgu 2025 YTD', 'Zona Orgu 2026 YTD', 'Var', 'Forecast'].map((h, i) =>
              <th key={h} style={{ padding: '8px 6px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontWeight: 600, color: C.mut, textTransform: 'uppercase' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {zonaData.map(r => {
              const v = r.s25 ? ((r.s26 - r.s25) / r.s25 * 100) : 0
              return <tr key={r.cat} style={{ borderBottom: `1px solid ${C.bg}` }}>
                <td style={{ padding: '8px 6px', fontWeight: 600, color: C.txt }}>{cn(r.cat)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: C.sub }}>{N(r.s25)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.navy }}>{N(r.s26)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: v >= 0 ? C.up : C.dn }}>{v >= 0 ? '↑' : '↓'} {Math.abs(v).toFixed(1)}%</span>
                </td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: C.ac, fontWeight: 600 }}>{N(fc(r.s26))}</td>
              </tr>
            })}
          </tbody>
          <tfoot><tr style={{ borderTop: `2px solid ${C.brd}`, background: C.bg }}>
            <td style={{ padding: '8px 6px', fontWeight: 700, color: C.txt }}>Total Zona Orgu</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>{N(totZ.s25)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.navy }}>{N(totZ.s26)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: totZ.s25 ? (((totZ.s26 - totZ.s25) / totZ.s25 * 100) >= 0 ? C.up : C.dn) : C.mut }}>
                {totZ.s25 ? `${((totZ.s26 - totZ.s25) / totZ.s25 * 100) >= 0 ? '↑' : '↓'} ${Math.abs((totZ.s26 - totZ.s25) / totZ.s25 * 100).toFixed(1)}%` : '—'}
              </span>
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'right', color: C.ac, fontWeight: 700 }}>{N(fc(totZ.s26))}</td>
          </tr>
          <tr style={{ background: C.bg }}>
            <td style={{ padding: '8px 6px', fontWeight: 700, color: C.ac }}>Ford Zona Orgu</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>{N(fZ25)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.ac }}>{N(fZ26)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: fZ25 ? (((fZ26 - fZ25) / fZ25 * 100) >= 0 ? C.up : C.dn) : C.mut }}>
                {fZ25 ? `${((fZ26 - fZ25) / fZ25 * 100) >= 0 ? '↑' : '↓'} ${Math.abs((fZ26 - fZ25) / fZ25 * 100).toFixed(1)}%` : '—'}
              </span>
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'right', color: C.ac, fontWeight: 700 }}>{N(fc(fZ26))}</td>
          </tr>
          </tfoot>
        </table>
      })()}
    </Card>

    {/* PROVINCES — chart with deltas + MS, then category breakdown per province */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Zona Orgu · Desempeño por provincia</Lbl>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={provs.map((r: any) => {
          const f = fProvs.find((fp: any) => fp.prov === r.prov) || {} as any
          const ms = r.ytd2026 ? ((f.ytd2026 || 0) / r.ytd2026 * 100).toFixed(1) : '0'
          const dI = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
          return { prov: r.prov, 'Ind 2025': r.ytd2025, 'Ind 2026': r.ytd2026, 'Ford 2026': f.ytd2026 || 0, delta: `+${dI}%`, ms: `MS ${ms}%` }
        })} barSize={18}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Ind 2025" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Ind 2026" fill={C.ac} radius={[6, 6, 0, 0]} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {/* Delta + MS summary below chart */}
      <div style={gr(4)}>
        {provs.map((r: any) => {
          const f = fProvs.find((fp: any) => fp.prov === r.prov) || {} as any
          const ms = r.ytd2026 ? ((f.ytd2026 || 0) / r.ytd2026 * 100).toFixed(2) : '0'
          return <div key={r.prov} style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{r.prov}</div>
            <div style={{ marginTop: 4 }}><Dl a={r.ytd2026} b={r.ytd2025} /></div>
            <div style={{ fontSize: 11, color: C.ac, fontWeight: 600, marginTop: 4 }}>MS Ford: {ms}%</div>
          </div>
        })}
      </div>
    </Card>

    {/* Category breakdown per province */}
    <Lbl>Zona Orgu · Categorías por provincia</Lbl>
    <SubTab tabs={[...provOrder.map(p => ({ id: p, label: p }))]} active={selProv === 'TODAS' ? 'PICHINCHA' : selProv} onChange={setSelProv} />
    <Card>
      {(() => {
        const sp = selProv === 'TODAS' ? 'PICHINCHA' : selProv
        const provKeyMap: Record<string, string> = { 'PICHINCHA': 'cat_pichincha_ytd', 'GUAYAS': 'cat_guayas_ytd', 'MANABÍ': 'cat_manabi_ytd', 'EL ORO': 'cat_eloro_ytd' }
        const catData = (d[provKeyMap[sp]] || []).filter((r: any) => r.cat !== 'Total general')
        const r = provs.find((x: any) => x.prov === sp)
        const f = fProvs.find((fp: any) => fp.prov === sp) || {} as any
        if (!r) return null
        const ms = r.ytd2026 ? ((f.ytd2026 || 0) / r.ytd2026 * 100).toFixed(2) : '0'
        return <>
          <div style={gr(4)}>
            <KPI label={`Industria ${sp}`} value={N(r.ytd2026)} sub={`vs ${N(r.ytd2025)} un. (2025 YTD)`} />
            <KPI label={`Ford ${sp}`} value={N(f.ytd2026)} sub={`vs ${N(f.ytd2025 || 0)} un. (2025 YTD)`} accent="navy" />
            <KPI label="MS Ford" value={`${ms}%`} sub={sp} accent="green" />
            <KPI label="Ford Variación" value={f.ytd2025 ? `${((f.ytd2026 - f.ytd2025) / f.ytd2025 * 100).toFixed(1)}%` : '—'} sub={`vs ${N(f.ytd2025 || 0)} un. (2025 YTD)`} accent="gold" />
          </div>
          {catData.length > 0 && <>
            <Lbl>{sp} · Desglose por categoría · YTD</Lbl>
            {(() => {
              const provChartData = catData.map((c: any) => {
                const pct = c.ytd2025 ? ((c.ytd2026 - c.ytd2025) / c.ytd2025 * 100).toFixed(1) : '0'
                return { cat: cn(c.cat), '2025 YTD': c.ytd2025 || 0, '2026 YTD': c.ytd2026 || 0, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
              })
              const ProvDeltaLabel = (props: any) => {
                const { x, y, width, index } = props
                if (!provChartData[index]) return null
                const dd = provChartData[index].delta
                const isNeg = dd.startsWith('-')
                return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={isNeg ? C.dn : C.up}>{dd}</text>
              }
              return <ResponsiveContainer width="100%" height={220}>
                <BarChart data={provChartData} barSize={20}>
                  <XAxis dataKey="cat" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<ProvDeltaLabel />} />
                </BarChart>
              </ResponsiveContainer>
            })()}
          </>}
        </>
      })()}
    </Card>
  </>
}

/* ═══ T2: COMBUSTIBLES ═══ */
function T2({ d }: { d: any }) {
  const comb = (d.combustible || []).filter((r: any) => !['SUV', 'Total general'].includes(r.label))
  const tot26 = comb.reduce((s: number, r: any) => s + (r.ytd2026 || 0), 0)
  const tot25 = comb.reduce((s: number, r: any) => s + (r.ytd2025 || 0), 0)

  /* Chart data with deltas */
  const barData = comb.map((r: any) => {
    const pct = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
    return { tipo: r.label, '2025 YTD': r.ytd2025 || 0, '2026 YTD': r.ytd2026 || 0, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const CombDeltaLabel = (props: any) => {
    const { x, y, width, index } = props
    if (!barData[index]) return null
    const dd = barData[index].delta
    const isNeg = dd.startsWith('-')
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={isNeg ? C.dn : C.up}>{dd}</text>
  }

  /* Line chart trend 2024→2025→2026 */
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    comb.forEach((r: any) => { obj[r.label] = r[`ytd${yr}`] || 0 })
    return obj
  })

  return <>
    <Hd tag="Tendencia Combustibles SUV · Zona Orgu" title="El shift hacia híbrido" />
    <Ins items={['El shift de gasolina a híbrido se acelera. HEV pasó de 17% a 23% del mix en un año', 'Ford capturó esta tendencia con Territory — sin ese modelo, estaríamos perdiendo el tren']} />

    {/* 4 cards aligned */}
    <div style={gr(4)}>
      {comb.map((r: any) => {
        const pct26 = tot26 ? (r.ytd2026 / tot26 * 100).toFixed(1) : '0'
        const pct25 = tot25 ? (r.ytd2025 / tot25 * 100).toFixed(1) : '0'
        const delta = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
        const u = parseFloat(delta) >= 0
        return <Card key={r.label} s={{ borderLeft: `4px solid ${r.label === 'HIBRIDO' ? C.navy : r.label === 'ELECTRICO BEV' ? C.gld : r.label === 'GASOLINA' ? C.steel : C.mut}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{r.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(r.ytd2026)}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>{pct26}% del total · vs {pct25}% en 2025</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>
              {u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}% vs {N(r.ytd2025)} un. (2025 YTD)
            </span>
          </div>
          {/* Mini participation bar */}
          <div style={{ marginTop: 10, height: 6, background: C.bg, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct26}%`, height: '100%', borderRadius: 99, background: r.label === 'HIBRIDO' ? C.navy : r.label === 'ELECTRICO BEV' ? C.gld : r.label === 'GASOLINA' ? C.steel : C.mut }} />
          </div>
        </Card>
      })}
    </div>

    <div style={gr(2)}>
      {/* Bar chart with deltas */}
      <Card>
        <Lbl>Volumen por combustible · YTD comparable</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} barSize={24}>
            <XAxis dataKey="tipo" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<CombDeltaLabel />} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Line chart trend */}
      <Card>
        <Lbl>Tendencia 2024 → 2025 → 2026 YTD</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {comb.map((r: any) => <Line key={r.label} type="monotone" dataKey={r.label}
              stroke={r.label === 'GASOLINA' ? C.steel : r.label === 'HIBRIDO' ? C.navy : r.label === 'ELECTRICO BEV' ? C.gld : C.mut}
              strokeWidth={r.label === 'HIBRIDO' || r.label === 'GASOLINA' ? 3 : 1.5}
              dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Insight box */}
    <Ins items={[
      `Gasolina baja de ${tot25 ? ((comb.find((r:any)=>r.label==='GASOLINA')?.ytd2025||0)/tot25*100).toFixed(0) : 0}% a ${tot26 ? ((comb.find((r:any)=>r.label==='GASOLINA')?.ytd2026||0)/tot26*100).toFixed(0) : 0}% de participación`,
      `Híbrido sube de ${tot25 ? ((comb.find((r:any)=>r.label==='HIBRIDO')?.ytd2025||0)/tot25*100).toFixed(0) : 0}% a ${tot26 ? ((comb.find((r:any)=>r.label==='HIBRIDO')?.ytd2026||0)/tot26*100).toFixed(0) : 0}% — Territory captura esta tendencia`,
      `Eléctrico BEV se triplica: ${N(comb.find((r:any)=>r.label==='ELECTRICO BEV')?.ytd2025)} → ${N(comb.find((r:any)=>r.label==='ELECTRICO BEV')?.ytd2026)}`,
      `Diesel cae -5.7% — segmento en retroceso`,
    ]} />
  </>
}

/* ═══ T3: SUV SEGMENTOS ═══ */
function T3({ d }: { d: any }) {
  const segsNac = (d.suv_segmentos_nacional || []).filter((s: any) => s.seg !== 'Total general')
  const segsOrgu = (d.suv_segmentos || []).filter((s: any) => s.seg !== 'Total general')
  const segProv = d.suv_seg_por_provincia || []
  const [selProv, setSelProv] = useState('TODAS')

  // Group segProv by segment with provinces
  const segGroups = useMemo(() => {
    const groups: Record<string, any[]> = {}
    let currentSeg = ''
    segProv.forEach((r: any) => {
      if (PROVS.includes(r.label)) {
        if (currentSeg) groups[currentSeg] = [...(groups[currentSeg] || []), r]
      } else if (r.label !== 'Total general') {
        currentSeg = r.label
        groups[currentSeg] = []
      }
    })
    return groups
  }, [segProv])

  /* Nacional chart data with deltas */
  const segChartData = segsNac.map((s: any) => {
    const pct = s.y2025 ? ((s.y2026 - s.y2025) / s.y2025 * 100).toFixed(1) : '0'
    return { seg: sn(s.seg), '2024 YTD': s.y2024, '2025 YTD': s.y2025, '2026 YTD': s.y2026, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const SegDeltaLabel = (props: any) => {
    const { x, y, width, index } = props
    if (!segChartData[index]) return null
    const dd = segChartData[index].delta
    const isNeg = dd.startsWith('-')
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={isNeg ? C.dn : C.up}>{dd}</text>
  }

  return <>
    <Hd tag="Segmentación SUV · Nacional + Zona Orgu" title="El mercado SUV segmento a segmento" />
    <Ins items={['BSUV y Compact concentran el 80% del volumen SUV', 'Ford compite en Compact con Territory y Escape, en Midsize con Everest y Bronco, y en Full Size con Explorer y Expedition']} />
    {/* Nacional cards with deltas */}
    <Lbl>Nacional</Lbl>
    <div style={gr(5)}>
      {segsNac.map((s: any) => {
        const delta = s.y2025 ? ((s.y2026 - s.y2025) / s.y2025 * 100).toFixed(1) : '0'
        const u = parseFloat(delta) >= 0
        return <Card key={s.seg} s={{ borderLeft: `4px solid ${C.ac}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{sn(s.seg)}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(s.y2026)}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>2025 YTD: {N(s.y2025)}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>
              {u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}% vs {N(s.y2025)} un. (2025 YTD)
            </span>
          </div>
        </Card>
      })}
    </div>
    {/* Nacional chart */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Evolución por segmento · Nacional · YTD comparable</Lbl>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={segChartData} barSize={18}>
          <XAxis dataKey="seg" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="2024 YTD" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2025 YTD" fill={C.steel} radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<SegDeltaLabel />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Provinces by segment */}
    <Card>
      <Lbl>Segmentos × Provincia · YTD</Lbl>
      <SubTab tabs={[{ id: 'TODAS', label: 'Todas' }, ...PROVS.map(p => ({ id: p, label: p }))]} active={selProv} onChange={setSelProv} />
      {selProv === 'TODAS' ? (
        <>
          <Lbl>Zona Orgu (Pichincha + Guayas + Manabí + El Oro) · Por segmento</Lbl>
          {(() => {
            const zonaSegData = Object.entries(segGroups).map(([seg, provData]) => {
              let s24 = 0, s25 = 0, s26 = 0
              provData.forEach((p: any) => { s24 += (p.ytd2024 || 0); s25 += (p.ytd2025 || 0); s26 += (p.ytd2026 || 0) })
              const pct = s25 ? ((s26 - s25) / s25 * 100).toFixed(1) : '0'
              return { seg: sn(seg), '2024 YTD': s24, '2025 YTD': s25, '2026 YTD': s26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
            })
            const ZonaDeltaLabel = (props: any) => {
              const { x, y, width, index } = props
              if (!zonaSegData[index]) return null
              const dd = zonaSegData[index].delta
              const isNeg = dd.startsWith('-')
              return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={isNeg ? C.dn : C.up}>{dd}</text>
            }
            return <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zonaSegData} barSize={18}>
                <XAxis dataKey="seg" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="2024 YTD" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                <Bar dataKey="2025 YTD" fill={C.steel} radius={[6, 6, 0, 0]} />
                <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<ZonaDeltaLabel />} />
              </BarChart>
            </ResponsiveContainer>
          })()}
        </>
      ) : (
        <>
          <div style={gr(5)}>
            {Object.entries(segGroups).map(([seg, provData]) => {
              const prov = provData.find((p: any) => p.label === selProv)
              const delta = prov?.ytd2025 ? ((prov.ytd2026 - prov.ytd2025) / prov.ytd2025 * 100).toFixed(1) : '0'
              const u = parseFloat(delta) >= 0
              return <Card key={seg} s={{ borderLeft: `4px solid ${C.ac}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 6 }}>{sn(seg)}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(prov?.ytd2026 || 0)}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>vs {N(prov?.ytd2025 || 0)} un. (2025)</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>
                    {u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}%
                  </span>
                </div>
              </Card>
            })}
          </div>
          {/* Province segment chart */}
          {(() => {
            const provChartData = Object.entries(segGroups).map(([seg, provData]) => {
              const prov = provData.find((p: any) => p.label === selProv)
              return { seg: sn(seg), '2025 YTD': prov?.ytd2025 || 0, '2026 YTD': prov?.ytd2026 || 0 }
            })
            return <ResponsiveContainer width="100%" height={200}>
              <BarChart data={provChartData} barSize={22}>
                <XAxis dataKey="seg" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          })()}
        </>
      )}
    </Card>
  </>
}

/* ═══ T4–T6: SUV RANGE SECTIONS ═══ */
function SuvSection({ d, tag, title, dataKey, wlKey, fordModel, modelCards, provKey }: { d: any, tag: string, title: string, dataKey: string, wlKey: string | null, fordModel: string, modelCards: React.ReactNode, provKey?: string }) {
  return <>
    <Hd tag={tag} title={title} />
    {modelCards}
    <BrandRanking data={d} dataKey={dataKey} wlKey={wlKey} fordModel={fordModel} />
    <ProvSection data={d[dataKey]?.por_provincia} label={`${title} · Por provincia · YTD`} />
  </>
}

function T4({ d }: { d: any }) {
  const [prov, setProv] = useState('ZONA ORGU')
  const provMarcas = d.suv_25_40_gas?.prov_marcas || {}
  const nacRows = d.suv_25_40_gas?.NACIONAL || []
  const precio = (d.precios_ford || []).find((p: any) => p.modelo === 'Escape')
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const provTotals = d.suv_25_40_gas?.por_provincia || []
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  // Helper: build ranking + line chart for a given dataset
  function RankSection({ rows, label, showFordCard }: { rows: any[], label: string, showFordCard?: boolean }) {
    const r25 = rows.find((r: any) => r.year === '2025') || {} as any
    const r26 = rows.find((r: any) => r.year === '2026') || {} as any
    const allB = Object.keys(r26).filter(k => k !== 'year' && !k.includes(' . '))
    const brands = allB.filter(b => (r26[b] || 0) > 0).sort((a, b) => (r26[b] || 0) - (r26[a] || 0))
    const top10 = brands.slice(0, 10)
    const maxV = Math.max(...top10.map(b => r26[b] || 0), 1)
    const fordIn = top10.includes('FORD')
    const fordPos = brands.indexOf('FORD') + 1
    const getMod = (brand: string) => Object.keys(r26).filter(k => k.startsWith(brand + ' . ') && r26[k]).sort((a, b) => (r26[b] || 0) - (r26[a] || 0)).slice(0, 3).map(k => ({ n: k, v: r26[k] }))
    const top5 = brands.slice(0, 5)
    const lineData = ['2024', '2025', '2026'].map(yr => {
      const row = rows.find((r: any) => r.year === yr) || {} as any
      const obj: any = { year: yr + ' YTD' }
      top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
      if (!top5.includes('FORD') && (r26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
      return obj
    })
    const lk = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (r26['FORD'] || 0) > 0 ? ['FORD'] : [])]

    return <>
      <Card s={{ marginTop: 16 }}>
        <Lbl>Top marcas · {label} · YTD 2026 vs YTD 2025</Lbl>
        {top10.map((b, i) => <RankBar key={b + label} rank={i + 1} name={b} val={r26[b] || 0} max={maxV} ford={b === 'FORD'} v25={r25[b]} models={getMod(b)} />)}
        {!fordIn && (r26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={r26['FORD'] || 0} max={maxV} ford v25={r25['FORD']} models={getMod('FORD')} />
        </>}
        {!fordIn && (!r26['FORD'] || r26['FORD'] === 0) && (r25['FORD'] || 0) > 0 &&
          <div style={{ marginTop: 12, padding: '10px 14px', background: C.dnB, borderRadius: 8, fontSize: 12, color: C.dn }}>Ford: 0 un. en {label} YTD 2026 (vs {N(r25['FORD'])} en 2025)</div>
        }
        {showFordCard && precio && <div style={{ marginTop: 16, padding: '14px 18px', background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', borderRadius: 12 }}>
          <div style={{ fontSize: 10, color: C.mut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ford en este rango</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{precio.modelo} {precio.trim}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.ac }}>{precio.precio}</span>
          </div>
        </div>}
      </Card>
      <Card s={{ marginTop: 16 }}>
        <Lbl>Evolución top marcas · {label} · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {lk.map((b, i) => <Line key={b} type="monotone" dataKey={b} stroke={bCol(b, i)} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  }

  // Zona Orgu = sum of 4 provinces
  const zonaRows = useMemo(() => {
    const allProvData = provOrder.map(p => provMarcas[p] || [])
    if (!allProvData.length || !allProvData[0].length) return nacRows // fallback
    return ['2024', '2025', '2026'].map(yr => {
      const merged: any = { year: yr }
      allProvData.forEach(pd => {
        const row = pd.find((r: any) => r.year === yr) || {}
        Object.entries(row).forEach(([k, v]) => {
          if (k === 'year') return
          merged[k] = (merged[k] || 0) + ((v as number) || 0)
        })
      })
      // Clean zeros
      Object.keys(merged).forEach(k => { if (k !== 'year' && merged[k] === 0) merged[k] = null })
      return merged
    })
  }, [provMarcas])

  // Current province rows
  const provRows = prov === 'ZONA ORGU' ? zonaRows : (provMarcas[prov] || [])

  // Province chart data with deltas
  const provChartData = provOrder.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    return { prov: p, '2025 YTD': v25, '2026 YTD': v26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const ProvDL = (props: any) => {
    const { x, y, width, index } = props
    if (!provChartData[index]) return null
    const dd = provChartData[index].delta
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text>
  }

  return <>
    <Hd tag="SUV Gasolina 25-40K" title="Análisis de marcas · Rango $25K–$40K Gasolina" />
    <Ins items={['Escape 1.5 ya no se está importando. El volumen residual son unidades de inventario', 'La estrategia de Ford apunta al híbrido con Territory en este rango de precio']} />

    {/* 1. Card horizontal */}
    <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px', marginBottom: 24 }}>
      <img src="/images/escape15.png" alt="Escape 1.5" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>Escape 1.5</div>
        <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>{precio?.precio || '$35,990'} · Gasolina</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>14</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
        </div>
        <Dl a={14} b={45} />
      </div>
    </Card>

    {/* 2. Province chart — always visible */}
    <Card s={{ marginBottom: 24 }}>
      <Lbl>SUV Gas 25-40K · Por provincia · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<ProvDL />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* 3. Nacional — always visible */}
    <RankSection rows={nacRows} label="Nacional" showFordCard />

    {/* 4. Zona Orgu — selector */}
    <div style={{ marginTop: 32, marginBottom: 16 }}>
      <SubTab tabs={[{ id: 'ZONA ORGU', label: 'Zona Orgu' }, ...provOrder.map(p => ({ id: p, label: p }))]} active={prov} onChange={setProv} />
    </div>
    <RankSection rows={provRows} label={prov === 'ZONA ORGU' ? 'Zona Orgu' : prov} />
  </>
}

function T5({ d }: { d: any }) {
  const [prov, setProv] = useState('ZONA ORGU')
  const provMarcas = d.suv_25_40_fhev?.prov_marcas || {}
  const nacRows = d.suv_25_40_fhev?.NACIONAL || []
  const precio = (d.precios_ford || []).find((p: any) => p.modelo === 'Territory')
  const provTotals = d.suv_25_40_fhev?.por_provincia || []
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const r26nac = nacRows.find((r: any) => r.year === '2026') || {} as any
  const r25nac = nacRows.find((r: any) => r.year === '2025') || {} as any
  const fordVal = r26nac['FORD . NEW TERRITORY'] || r26nac['FORD . TERRITORY'] || 0
  const fordPrev = 0 // Territory no existía en 2025

  function RankBlock({ rows, label }: { rows: any[], label: string }) {
    const r25 = rows.find((r: any) => r.year === '2025') || {} as any
    const r26 = rows.find((r: any) => r.year === '2026') || {} as any
    const allB = Object.keys(r26).filter(k => k !== 'year' && !k.includes(' . '))
    const brands = allB.filter(b => (r26[b] || 0) > 0).sort((a, b) => (r26[b] || 0) - (r26[a] || 0))
    const top10 = brands.slice(0, 10)
    const maxV = Math.max(...top10.map(b => r26[b] || 0), 1)
    const fordIn = top10.includes('FORD')
    const fordPos = brands.indexOf('FORD') + 1
    const getMod = (brand: string) => {
      const mods = Object.keys(r26).filter(k => k.startsWith(brand + ' . ') && r26[k]).sort((a, b) => (r26[b] || 0) - (r26[a] || 0)).slice(0, 3).map(k => ({ n: k, v: r26[k] }))
      if (brand === 'FORD') return mods.filter(m => m.n.includes('TERRITORY'))
      return mods
    }
    const top5 = brands.slice(0, 5)
    const lineData = ['2024', '2025', '2026'].map(yr => {
      const row = rows.find((r: any) => r.year === yr) || {} as any
      const obj: any = { year: yr + ' YTD' }
      top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
      if (!top5.includes('FORD') && (r26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
      return obj
    })
    const lk = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (r26['FORD'] || 0) > 0 ? ['FORD'] : [])]
    return <>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Top marcas · {label} · YTD 2026 vs YTD 2025</Lbl>
        {top10.map((b, i) => <RankBar key={b + label} rank={i + 1} name={b} val={r26[b] || 0} max={maxV} ford={b === 'FORD'} v25={r25[b]} models={getMod(b)} />)}
        {!fordIn && (r26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={r26['FORD'] || 0} max={maxV} ford v25={r25['FORD']} models={getMod('FORD')} />
        </>}
      </Card>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Evolución top marcas · {label} · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {lk.map((b, i) => <Line key={b} type="monotone" dataKey={b} stroke={bCol(b, i)} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  }

  const zonaRows = useMemo(() => {
    const allPD = provOrder.map(p => provMarcas[p] || [])
    if (!allPD.length || !allPD[0].length) return nacRows
    return ['2024', '2025', '2026'].map(yr => {
      const m: any = { year: yr }
      allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
      Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
      return m
    })
  }, [provMarcas])
  const provRows = prov === 'ZONA ORGU' ? zonaRows : (provMarcas[prov] || [])

  const provChartData = provOrder.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    return { prov: p, '2025 YTD': v25, '2026 YTD': v26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const PDL = (props: any) => {
    const { x, y, width, index } = props
    if (!provChartData[index]) return null
    const dd = provChartData[index].delta
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text>
  }

  return <>
    <Hd tag="SUV Híbrido 25-40K" title="Análisis de marcas · Rango $25K–$40K Híbrido" />
    <Ins items={['Territory es el modelo que cambió el juego. 201 unidades en su primer Q1 completo', 'A $35,990 en HEV, captura exactamente donde el mercado está migrando']} />

    {/* Territory horizontal card + Territory Effect */}
    <div style={gr(2)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px' }}>
        <img src="/images/territory.png" alt="Territory" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>New Territory</div>
          <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>{precio?.precio || '$35,990'} · HEV</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(fordVal)}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
          </div>
          <Dl a={fordVal} b={fordPrev} />
        </div>
      </Card>
      <Card s={{ background: `linear-gradient(135deg,${C.glB},#FEF3C7)`, border: `1px solid #FDE68A`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 28px' }}>
        <div style={{ fontSize: 11, color: C.gld, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>⭐ Territory Effect</div>
        <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.8 }}>
          El New Territory redefinió el posicionamiento de Ford en Ecuador. Con {N(fordVal)} unidades YTD representa el <strong>38% del volumen total Ford</strong> y es el principal motor del crecimiento de +73% de la marca. A $35,990 en versión híbrida, captura exactamente donde el mercado está migrando. Posición <strong>#5 nacional</strong> en su primer año completo.
        </div>
      </Card>
    </div>

    {/* Province chart */}
    <Card s={{ marginBottom: 24 }}>
      <Lbl>SUV HEV 25-40K · Por provincia · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Nacional */}
    <RankBlock rows={nacRows} label="Nacional" />

    {/* Zona Orgu selector */}
    <div style={{ marginTop: 24 }}>
      <SubTab tabs={[{ id: 'ZONA ORGU', label: 'Zona Orgu' }, ...provOrder.map(p => ({ id: p, label: p }))]} active={prov} onChange={setProv} />
      <RankBlock rows={provRows} label={prov === 'ZONA ORGU' ? 'Zona Orgu' : prov} />
    </div>
  </>
}

function T6({ d }: { d: any }) {
  const [prov, setProv] = useState('ZONA ORGU')
  const provMarcas = d.suv_40_50?.prov_marcas || {}
  const nacRows = d.suv_40_50?.NACIONAL || []
  const precio = (d.precios_ford || []).find((p: any) => p.modelo === 'Escape' && p.trim?.includes('ST'))
  const provTotals = d.suv_40_50?.por_provincia || []
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  function RankBlock({ rows, label }: { rows: any[], label: string }) {
    const r25 = rows.find((r: any) => r.year === '2025') || {} as any
    const r26 = rows.find((r: any) => r.year === '2026') || {} as any
    const allB = Object.keys(r26).filter(k => k !== 'year' && !k.includes(' . '))
    const brands = allB.filter(b => (r26[b] || 0) > 0).sort((a, b) => (r26[b] || 0) - (r26[a] || 0))
    const top10 = brands.slice(0, 10)
    const maxV = Math.max(...top10.map(b => r26[b] || 0), 1)
    const fordIn = top10.includes('FORD')
    const fordPos = brands.indexOf('FORD') + 1
    const getMod = (brand: string) => Object.keys(r26).filter(k => k.startsWith(brand + ' . ') && r26[k]).sort((a, b) => (r26[b] || 0) - (r26[a] || 0)).slice(0, 3).map(k => ({ n: k, v: r26[k] }))
    const top5 = brands.slice(0, 5)
    const lineData = ['2024', '2025', '2026'].map(yr => {
      const row = rows.find((r: any) => r.year === yr) || {} as any
      const obj: any = { year: yr + ' YTD' }
      top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
      if (!top5.includes('FORD') && (r26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
      return obj
    })
    const lk = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (r26['FORD'] || 0) > 0 ? ['FORD'] : [])]
    return <>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Top marcas · {label} · YTD 2026 vs YTD 2025</Lbl>
        {top10.map((b, i) => <RankBar key={b + label} rank={i + 1} name={b} val={r26[b] || 0} max={maxV} ford={b === 'FORD'} v25={r25[b]} models={getMod(b)} />)}
        {!fordIn && (r26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={r26['FORD'] || 0} max={maxV} ford v25={r25['FORD']} models={getMod('FORD')} />
        </>}
      </Card>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Evolución top marcas · {label} · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
            {lk.map((b, i) => <Line key={b} type="monotone" dataKey={b} stroke={bCol(b, i)} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  }

  const zonaRows = useMemo(() => {
    const allPD = provOrder.map(p => provMarcas[p] || [])
    if (!allPD.length || !allPD[0].length) return nacRows
    return ['2024', '2025', '2026'].map(yr => {
      const m: any = { year: yr }
      allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
      Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
      return m
    })
  }, [provMarcas])
  const provRows = prov === 'ZONA ORGU' ? zonaRows : (provMarcas[prov] || [])

  const provChartData = provOrder.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    return { prov: p, '2025 YTD': v25, '2026 YTD': v26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  return <>
    <Hd tag="SUV Híbrido 40-50K" title="Análisis de marcas · Rango $40K–$50K Híbrido" />
    <Ins items={['Escape ST-Line cae -50%. Territory captura volumen en el rango inferior', 'Monitorear si el ST-Line necesita reposicionamiento de precio o de comunicación']} />
    <div style={gr(2)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px' }}>
        <img src="/images/escapestline.png" alt="Escape ST-Line" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>Escape ST-Line</div>
          <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>$46,990 · HEV</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
          </div>
          <Dl a={7} b={14} />
        </div>
      </Card>
      <Card s={{ background: C.dnB, border: `1px solid #FECACA`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 28px' }}>
        <div style={{ fontSize: 11, color: C.dn, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>⚠️ Alerta de canibalización</div>
        <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.8 }}>
          El Escape ST-Line HEV cae -50% YTD (14→7 un.) por canibalización directa del Territory. Territory captura volumen en el rango inferior con una propuesta de valor más agresiva. Monitorear si el ST-Line necesita reposicionamiento de precio o de comunicación.
        </div>
      </Card>
    </div>
    <Card s={{ marginBottom: 24 }}>
      <Lbl>SUV HEV 40-50K · Por provincia · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
    <RankBlock rows={nacRows} label="Nacional" />
    <div style={{ marginTop: 24 }}>
      <SubTab tabs={[{ id: 'ZONA ORGU', label: 'Zona Orgu' }, ...provOrder.map(p => ({ id: p, label: p }))]} active={prov} onChange={setProv} />
      <RankBlock rows={provRows} label={prov === 'ZONA ORGU' ? 'Zona Orgu' : prov} />
    </div>
  </>
}

/* ═══ T7: SUV 55-80K ═══ */
function T7({ d }: { d: any }) {
  const [sub, setSub] = useState('everest')
  const [prov, setProv] = useState('ZONA ORGU')
  const n55 = d.suv_55_80?.NACIONAL || []
  const n60 = d.suv_60_80?.NACIONAL || []
  const r25_55 = n55.find((r: any) => r.year === '2025') || {} as any
  const r26_55 = n55.find((r: any) => r.year === '2026') || {} as any
  const r25_60 = n60.find((r: any) => r.year === '2025') || {} as any
  const r26_60 = n60.find((r: any) => r.year === '2026') || {} as any
  const provMarcas55 = d.suv_55_80?.prov_marcas || {}
  const provMarcas60 = d.suv_60_80?.prov_marcas || {}
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const activeNac = sub === 'everest' ? n55 : n60
  // Brand filter: Everest competes with Fortuner/Trailblazer, Explorer with the rest
  const everestModels = ['CHEVROLET . TRAILBLAZER', 'TOYOTA . FORTUNER', 'FORD . EVEREST', 'MITSUBISHI . MONTERO']
  const explorerExclude = ['CHEVROLET . TRAILBLAZER', 'TOYOTA . FORTUNER', 'FORD . EVEREST', 'FORD . EXPEDITION', 'MITSUBISHI . MONTERO']
  const activePM = sub === 'everest' ? provMarcas55 : provMarcas60

  function filterRows(rows: any[]) {
    return rows.map((r: any) => {
      const filtered: any = { year: r.year }
      if (sub === 'everest') {
        // Only keep specific models, rebuild brand totals from them
        const brandTotals: Record<string, number> = {}
        everestModels.forEach(m => {
          if (r[m]) {
            filtered[m] = r[m]
            const brand = m.split(' . ')[0]
            brandTotals[brand] = (brandTotals[brand] || 0) + (r[m] || 0)
          }
        })
        Object.entries(brandTotals).forEach(([b, v]) => { filtered[b] = v })
      } else {
        // Explorer: exclude Everest-specific models, rebuild brand totals
        const brandTotals: Record<string, number> = {}
        Object.entries(r).forEach(([k, v]) => {
          if (k === 'year') return
          if (k.includes(' . ')) {
            if (!explorerExclude.includes(k)) {
              filtered[k] = v
              const brand = k.split(' . ')[0]
              brandTotals[brand] = (brandTotals[brand] || 0) + ((v as number) || 0)
            }
          }
        })
        Object.entries(brandTotals).forEach(([b, v]) => { if (v > 0) filtered[b] = v })
      }
      return filtered
    })
  }

  function RankBlock({ rows, label }: { rows: any[], label: string }) {
    const fRows = filterRows(rows)
    const r25 = fRows.find((r: any) => r.year === '2025') || {} as any
    const r26 = fRows.find((r: any) => r.year === '2026') || {} as any
    const allB = Object.keys(r26).filter(k => k !== 'year' && !k.includes(' . '))
    const brands = allB.filter(b => (r26[b] || 0) > 0).sort((a, b) => (r26[b] || 0) - (r26[a] || 0))
    const top10 = brands.slice(0, 10)
    const maxV = Math.max(...top10.map(b => r26[b] || 0), 1)
    const fordIn = top10.includes('FORD')
    const fordPos = brands.indexOf('FORD') + 1
    const getMod = (brand: string) => Object.keys(r26).filter(k => k.startsWith(brand + ' . ') && r26[k]).sort((a, b) => (r26[b] || 0) - (r26[a] || 0)).slice(0, 3).map(k => ({ n: k, v: r26[k] }))
    const top5 = brands.slice(0, 5)
    const lineData = ['2024', '2025', '2026'].map(yr => {
      const row = rows.find((r: any) => r.year === yr) || {} as any
      const obj: any = { year: yr + ' YTD' }
      top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
      if (!top5.includes('FORD') && (r26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
      return obj
    })
    const lk = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (r26['FORD'] || 0) > 0 ? ['FORD'] : [])]
    return <>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Top marcas · {label} · YTD 2026 vs YTD 2025</Lbl>
        {top10.map((b, i) => <RankBar key={b + label + sub} rank={i + 1} name={b} val={r26[b] || 0} max={maxV} ford={b === 'FORD'} v25={r25[b]} models={getMod(b)} />)}
        {!fordIn && (r26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={r26['FORD'] || 0} max={maxV} ford v25={r25['FORD']} models={getMod('FORD')} />
        </>}
      </Card>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Evolución top marcas · {label} · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
            {lk.map((b, i) => <Line key={b} type="monotone" dataKey={b} stroke={bCol(b, i)} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  }

  const zonaRows = useMemo(() => {
    const allPD = provOrder.map(p => activePM[p] || [])
    if (!allPD.length || !allPD[0].length) return activeNac
    return ['2024', '2025', '2026'].map(yr => {
      const m: any = { year: yr }
      allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
      Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
      return m
    })
  }, [activePM, sub])
  const provRows = prov === 'ZONA ORGU' ? zonaRows : (activePM[prov] || [])

  return <>
    <Hd tag="SUV 55-80K" title="Análisis de marcas · Rango $55K–$80K" />
    <Ins items={['Everest sube a #3 con +82% de crecimiento. Explorer Active se mantiene estable', 'Ambos modelos consolidan la presencia de Ford en el rango medio-alto']} />
    <div style={gr(2)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px' }}>
        <img src="/images/everest.png" alt="Everest" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>Everest Active</div>
          <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>$69,990</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(r26_55['FORD . EVEREST'])}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
          </div>
          <Dl a={r26_55['FORD . EVEREST']} b={r25_55['FORD . EVEREST']} />
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px' }}>
        <img src="/images/exploreractive.png" alt="Explorer" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>Explorer Active</div>
          <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>$79,990</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(r26_60['FORD . EXPLORER'])}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
          </div>
          <Dl a={r26_60['FORD . EXPLORER']} b={r25_60['FORD . EXPLORER']} />
        </div>
      </Card>
    </div>

    <SubTab tabs={[{ id: 'everest', label: 'Everest' }, { id: 'explorer', label: 'Explorer Active' }]} active={sub} onChange={(id) => { setSub(id); setProv('ZONA ORGU') }} />

    {/* Nacional */}
    <RankBlock rows={activeNac} label="Nacional" />

    {/* Zona Orgu selector */}
    <div style={{ marginTop: 24 }}>
      <SubTab tabs={[{ id: 'ZONA ORGU', label: 'Zona Orgu' }, ...provOrder.map(p => ({ id: p, label: p }))]} active={prov} onChange={setProv} />
      <RankBlock rows={provRows} label={prov === 'ZONA ORGU' ? 'Zona Orgu' : prov} />
    </div>
  </>
}

/* ═══ T8: SUV +80K ═══ */
function T8({ d }: { d: any }) {
  const [sub, setSub] = useState('expedition')
  const [prov, setProv] = useState('ZONA ORGU')
  const nacRows = d.suv_80plus?.NACIONAL || []
  const provMarcas = d.suv_80plus?.prov_marcas || {}
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const r25 = nacRows.find((r: any) => r.year === '2025') || {} as any
  const r26 = nacRows.find((r: any) => r.year === '2026') || {} as any
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const expeditionModels = ['CHEVROLET . TAHOE', 'CHEVROLET . SUBURBAN', 'TOYOTA . LAND CRUISER', 'TOYOTA . LAND CRUISER PRADO', 'FORD . EXPEDITION']
  const broncoModels = ['FORD . BRONCO', 'JEEP . WRANGLER']
  const explorerExclude = [...expeditionModels, ...broncoModels]

  function filterRows(rows: any[]) {
    const activeModels = sub === 'expedition' ? expeditionModels : sub === 'bronco' ? broncoModels : null
    return rows.map((r: any) => {
      const filtered: any = { year: r.year }
      const brandTotals: Record<string, number> = {}
      Object.entries(r).forEach(([k, v]) => {
        if (k === 'year' || !k.includes(' . ')) return
        if (activeModels) {
          if (activeModels.includes(k) && v) { filtered[k] = v; const b = k.split(' . ')[0]; brandTotals[b] = (brandTotals[b] || 0) + ((v as number) || 0) }
        } else {
          if (!explorerExclude.includes(k) && v) { filtered[k] = v; const b = k.split(' . ')[0]; brandTotals[b] = (brandTotals[b] || 0) + ((v as number) || 0) }
        }
      })
      Object.entries(brandTotals).forEach(([b, v]) => { if (v > 0) filtered[b] = v })
      return filtered
    })
  }

  function RankBlock({ rows, label }: { rows: any[], label: string }) {
    const fRows = filterRows(rows)
    const fr25 = fRows.find((r: any) => r.year === '2025') || {} as any
    const fr26 = fRows.find((r: any) => r.year === '2026') || {} as any
    const allB = Object.keys(fr26).filter(k => k !== 'year' && !k.includes(' . '))
    const brands = allB.filter(b => (fr26[b] || 0) > 0).sort((a, b) => (fr26[b] || 0) - (fr26[a] || 0))
    const top10 = brands.slice(0, 10)
    const maxV = Math.max(...top10.map(b => fr26[b] || 0), 1)
    const fordIn = top10.includes('FORD')
    const fordPos = brands.indexOf('FORD') + 1
    const getMod = (brand: string) => Object.keys(fr26).filter(k => k.startsWith(brand + ' . ') && fr26[k]).sort((a, b) => (fr26[b] || 0) - (fr26[a] || 0)).slice(0, 3).map(k => ({ n: k, v: fr26[k] }))
    const top5 = brands.slice(0, 5)
    const lineData = ['2024', '2025', '2026'].map(yr => {
      const row = fRows.find((r: any) => r.year === yr) || {} as any
      const obj: any = { year: yr + ' YTD' }
      top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
      if (!top5.includes('FORD') && (fr26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
      return obj
    })
    const lk = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (fr26['FORD'] || 0) > 0 ? ['FORD'] : [])]

    if (brands.length === 0) return <Card s={{ marginBottom: 16 }}><div style={{ padding: 20, textAlign: 'center', color: C.mut, fontSize: 13 }}>No hay datos suficientes para {label} en esta categoría YTD 2026</div></Card>

    return <>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Top marcas · {label} · YTD 2026 vs YTD 2025</Lbl>
        {top10.map((b, i) => <RankBar key={b + label + sub} rank={i + 1} name={b} val={fr26[b] || 0} max={maxV} ford={b === 'FORD'} v25={fr25[b]} models={getMod(b)} />)}
        {!fordIn && (fr26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={fr26['FORD'] || 0} max={maxV} ford v25={fr25['FORD']} models={getMod('FORD')} />
        </>}
      </Card>
      {lk.length > 1 && <Card s={{ marginBottom: 16 }}>
        <Lbl>Evolución · {label} · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
            {lk.map((b, i) => <Line key={b} type="monotone" dataKey={b} stroke={bCol(b, i)} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>}
    </>
  }

  const zonaRows = useMemo(() => {
    const allPD = provOrder.map(p => provMarcas[p] || [])
    if (!allPD.length || !allPD[0].length) return nacRows
    return ['2024', '2025', '2026'].map(yr => {
      const m: any = { year: yr }
      allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
      Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
      return m
    })
  }, [provMarcas])
  const provRows = prov === 'ZONA ORGU' ? zonaRows : (provMarcas[prov] || [])

  return <>
    <Hd tag="SUV +80K" title="Análisis de marcas · Rango +$80K" />
    <Ins items={['Expedition compite en un nicho de 3 jugadores donde Land Cruiser Prado domina', 'Bronco sin unidades YTD — evaluar inventario y estrategia de comunicación']} />
    <div style={gr(3)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/expeditionplatinum.png" alt="Expedition" style={{ height: 70, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Expedition Platinum</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$129,990</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginTop: 4 }}>{N(r26['FORD . EXPEDITION'])}<span style={{ fontSize: 11, color: C.sub }}> un.</span></div>
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/bronco.png" alt="Bronco" style={{ height: 70, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Bronco Badlands</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$119,990</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginTop: 4 }}>{N(r26['FORD . BRONCO'] || 0)}<span style={{ fontSize: 11, color: C.sub }}> un.</span></div>
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/explorerplatinum.png" alt="Explorer" style={{ height: 70, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Explorer Platinum</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$94,990</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginTop: 4 }}>{N(r26['FORD . EXPLORER'] || 0)}<span style={{ fontSize: 11, color: C.sub }}> un.</span></div>
        </div>
      </Card>
    </div>

    <SubTab tabs={[{ id: 'expedition', label: 'Expedition' }, { id: 'bronco', label: 'Bronco' }, { id: 'explorer', label: 'Explorer Platinum' }]} active={sub} onChange={(id) => { setSub(id); setProv('ZONA ORGU') }} />

    <RankBlock rows={nacRows} label="Nacional" />
    <div style={{ marginTop: 24 }}>
      <SubTab tabs={[{ id: 'ZONA ORGU', label: 'Zona Orgu' }, ...provOrder.map(p => ({ id: p, label: p }))]} active={prov} onChange={setProv} />
      <RankBlock rows={prov === 'ZONA ORGU' ? zonaRows : (provMarcas[prov] || [])} label={prov === 'ZONA ORGU' ? 'Zona Orgu' : prov} />
    </div>
  </>
}

/* ═══ T9: PICKUPS CATEGORÍAS ═══ */
function T9({ d }: { d: any }) {
  const puNac = (d.pickup_cat_nacional || []).filter((r: any) => r.seg !== 'Total general')
  const puOrgu = (d.pickup_cat_ytd || []).filter((r: any) => r.seg !== 'Total general')
  const puProv = d.pu_cat_por_prov || []
  const [selProv, setSelProv] = useState('TODAS')

  // Group puProv by province with categories
  const provGroups = useMemo(() => {
    const groups: Record<string, any[]> = {}
    let currentProv = ''
    const provNames = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
    puProv.forEach((r: any) => {
      if (provNames.includes(r.label)) {
        currentProv = r.label
        groups[currentProv] = []
      } else if (currentProv && r.label !== 'Total general') {
        groups[currentProv].push(r)
      }
    })
    return groups
  }, [puProv])

  // Nacional chart with deltas
  const nacChartData = puNac.map((r: any) => {
    const pct = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
    return { cat: r.seg.replace(' PICK UPS', ''), '2024 YTD': r.ytd2024, '2025 YTD': r.ytd2025, '2026 YTD': r.ytd2026, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const NacDL = (props: any) => {
    const { x, y, width, index } = props
    if (!nacChartData[index]) return null
    const dd = nacChartData[index].delta
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text>
  }

  // Zona Orgu chart with deltas
  const orguChartData = puOrgu.map((r: any) => {
    const pct = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
    return { cat: r.seg.replace(' PICK UPS', ''), '2024 YTD': r.ytd2024, '2025 YTD': r.ytd2025, '2026 YTD': r.ytd2026, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const OrguDL = (props: any) => {
    const { x, y, width, index } = props
    if (!orguChartData[index]) return null
    const dd = orguChartData[index].delta
    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text>
  }

  return <>
    <Hd tag="Categoría Pick Ups · Nacional + Zona Orgu" title="Compact · Mid Size · Full Size" />
    <Ins items={['Mid Size es el 93% del volumen pickup. Full Size crece +34.8%', 'Segmento donde Ford tiene dominio absoluto pero hay que vigilar nuevos competidores']} />

    {/* Nacional cards with deltas */}
    <Lbl>Nacional</Lbl>
    <div style={gr(3)}>
      {puNac.map((r: any) => {
        const delta = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
        const u = parseFloat(delta) >= 0
        return <Card key={r.seg} s={{ borderLeft: `4px solid ${C.ac}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{r.seg.replace(' PICK UPS', '')}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(r.ytd2026)}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>2025 YTD: {N(r.ytd2025)}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>
              {u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}% vs {N(r.ytd2025)} un.
            </span>
          </div>
        </Card>
      })}
    </div>

    {/* Nacional chart */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Evolución por categoría · Nacional · YTD comparable</Lbl>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={nacChartData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="cat" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="2024 YTD" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2025 YTD" fill={C.steel} radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<NacDL />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Zona Orgu chart */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Evolución por categoría · Zona Orgu · YTD comparable</Lbl>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={orguChartData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="cat" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="2024 YTD" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2025 YTD" fill={C.steel} radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<OrguDL />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Province selector */}
    <Card>
      <Lbl>Categorías × Provincia · YTD</Lbl>
      <SubTab tabs={[{ id: 'TODAS', label: 'Todas' }, ...['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO'].map(p => ({ id: p, label: p }))]} active={selProv} onChange={setSelProv} />
      {selProv === 'TODAS' ? (
        <>
          <Lbl>Zona Orgu · Por provincia y categoría</Lbl>
          {(() => {
            const zonaData = Object.entries(provGroups).map(([prov, cats]) => {
              let s25 = 0, s26 = 0
              cats.forEach((c: any) => { s25 += (c.ytd2025 || 0); s26 += (c.ytd2026 || 0) })
              const pct = s25 ? ((s26 - s25) / s25 * 100).toFixed(1) : '0'
              return { prov, s25, s26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
            })
            const ordered = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO'].map(p => zonaData.find(z => z.prov === p)).filter(Boolean)
            const TDL = (props: any) => { const { x, y, width, index } = props; if (!ordered[index]) return null; const dd = (ordered[index] as any).delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }
            return <ResponsiveContainer width="100%" height={230}>
              <BarChart data={ordered.map((z: any) => ({ prov: z.prov, '2025 YTD': z.s25, '2026 YTD': z.s26 }))} barSize={20} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<TDL />} />
              </BarChart>
            </ResponsiveContainer>
          })()}
        </>
      ) : (
        <>
          <div style={gr(3)}>
            {(provGroups[selProv] || []).map((r: any) => {
              const delta = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
              const u = parseFloat(delta) >= 0
              return <Card key={r.label} s={{ borderLeft: `4px solid ${C.ac}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 6 }}>{r.label.replace(' PICK UPS', '')}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(r.ytd2026)}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>vs {N(r.ytd2025)} un.</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>
                    {u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}%
                  </span>
                </div>
              </Card>
            })}
          </div>
          {/* Province chart */}
          {(() => {
            const provData = (provGroups[selProv] || []).map((r: any) => ({
              cat: r.label.replace(' PICK UPS', ''), '2025 YTD': r.ytd2025 || 0, '2026 YTD': r.ytd2026 || 0
            }))
            return <ResponsiveContainer width="100%" height={200}>
              <BarChart data={provData} barSize={22}>
                <XAxis dataKey="cat" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          })()}
        </>
      )}
    </Card>
  </>
}

/* ═══ T10: PU DIESEL ═══ */
function T10({ d }: { d: any }) {
  const [prov, setProv] = useState('ZONA ORGU')
  const provMarcas = d.pick_diesel?.prov_marcas || {}
  const nacRows = d.pick_diesel?.NACIONAL || []
  const provTotals = d.pick_diesel?.por_provincia || []
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]
  const r26nac = nacRows.find((r: any) => r.year === '2026') || {} as any
  const r25nac = nacRows.find((r: any) => r.year === '2025') || {} as any

  function RankBlock({ rows, label }: { rows: any[], label: string }) {
    const r25 = rows.find((r: any) => r.year === '2025') || {} as any
    const r26 = rows.find((r: any) => r.year === '2026') || {} as any
    const allB = Object.keys(r26).filter(k => k !== 'year' && !k.includes(' . '))
    const brands = allB.filter(b => (r26[b] || 0) > 0).sort((a, b) => (r26[b] || 0) - (r26[a] || 0))
    const top10 = brands.slice(0, 10)
    const maxV = Math.max(...top10.map(b => r26[b] || 0), 1)
    const fordIn = top10.includes('FORD')
    const fordPos = brands.indexOf('FORD') + 1
    const getMod = (brand: string) => Object.keys(r26).filter(k => k.startsWith(brand + ' . ') && r26[k]).sort((a, b) => (r26[b] || 0) - (r26[a] || 0)).slice(0, 3).map(k => ({ n: k, v: r26[k] }))
    const top5 = brands.slice(0, 5)
    const lineData = ['2024', '2025', '2026'].map(yr => {
      const row = rows.find((r: any) => r.year === yr) || {} as any
      const obj: any = { year: yr + ' YTD' }
      top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
      if (!top5.includes('FORD') && (r26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
      return obj
    })
    const lk = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (r26['FORD'] || 0) > 0 ? ['FORD'] : [])]
    return <>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Top marcas · {label} · YTD 2026 vs YTD 2025</Lbl>
        {top10.map((b, i) => <RankBar key={b + label} rank={i + 1} name={b} val={r26[b] || 0} max={maxV} ford={b === 'FORD'} v25={r25[b]} models={getMod(b)} />)}
        {!fordIn && (r26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={r26['FORD'] || 0} max={maxV} ford v25={r25['FORD']} models={getMod('FORD')} />
        </>}
      </Card>
      {lk.length > 1 && <Card s={{ marginBottom: 16 }}>
        <Lbl>Evolución top marcas · {label} · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
            {lk.map((b, i) => <Line key={b} type="monotone" dataKey={b} stroke={bCol(b, i)} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>}
    </>
  }

  const zonaRows = useMemo(() => {
    const allPD = provOrder.map(p => provMarcas[p] || [])
    if (!allPD.length || !allPD[0].length) return nacRows
    return ['2024', '2025', '2026'].map(yr => {
      const m: any = { year: yr }
      allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
      Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
      return m
    })
  }, [provMarcas])
  const provRows = prov === 'ZONA ORGU' ? zonaRows : (provMarcas[prov] || [])

  const provChartData = provOrder.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    return { prov: p, '2025 YTD': v25, '2026 YTD': v26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  return <>
    <Hd tag="Pick Ups Diesel 4x4 · 50-70K" title="Análisis de marcas · Ranger" />
    <Ins items={['Ranger crece +13% en un segmento dominado por Toyota Hilux y Chevrolet Colorado', 'Posición modesta pero creciente']} />
    <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px', marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        <img src="/images/rangerxl.png" alt="Ranger XL" style={{ height: 80, objectFit: 'contain' }} />
        <img src="/images/rangerxlt.png" alt="Ranger XLT" style={{ height: 80, objectFit: 'contain' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>Ranger</div>
        <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>XL $53,990 · XLT $67,990 · Diesel 4x4</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(r26nac['FORD'] || 0)}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
        </div>
        <Dl a={r26nac['FORD']} b={r25nac['FORD']} />
      </div>
    </Card>
    <Card s={{ marginBottom: 24 }}>
      <Lbl>Pickup Diesel 4x4 · Por provincia · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
    <RankBlock rows={nacRows} label="Nacional" />
    <div style={{ marginTop: 24 }}>
      <SubTab tabs={[{ id: 'ZONA ORGU', label: 'Zona Orgu' }, ...provOrder.map(p => ({ id: p, label: p }))]} active={prov} onChange={setProv} />
      <RankBlock rows={provRows} label={prov === 'ZONA ORGU' ? 'Zona Orgu' : prov} />
    </div>
  </>
}

/* ═══ T11: PU FULL SIZE ═══ */
function T11({ d }: { d: any }) {
  const [prov, setProv] = useState('ZONA ORGU')
  const provMarcas = d.pick_fullsize?.prov_marcas || {}
  const nacRows = d.pick_fullsize?.NACIONAL || []
  const provTotals = d.pick_fullsize?.por_provincia || []
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]
  const r26nac = nacRows.find((r: any) => r.year === '2026') || {} as any
  const r25nac = nacRows.find((r: any) => r.year === '2025') || {} as any
  const fTot = Object.keys(r26nac).filter(k => k !== 'year' && !k.includes(' . ')).reduce((s, b) => s + (r26nac[b] || 0), 0)
  const f150Ms = fTot ? ((r26nac['FORD'] || 0) / fTot * 100).toFixed(1) : '0'

  function RankBlock({ rows, label }: { rows: any[], label: string }) {
    const r25 = rows.find((r: any) => r.year === '2025') || {} as any
    const r26 = rows.find((r: any) => r.year === '2026') || {} as any
    const allB = Object.keys(r26).filter(k => k !== 'year' && !k.includes(' . '))
    const brands = allB.filter(b => (r26[b] || 0) > 0).sort((a, b) => (r26[b] || 0) - (r26[a] || 0))
    const top10 = brands.slice(0, 10)
    const maxV = Math.max(...top10.map(b => r26[b] || 0), 1)
    const fordIn = top10.includes('FORD')
    const fordPos = brands.indexOf('FORD') + 1
    const getMod = (brand: string) => Object.keys(r26).filter(k => k.startsWith(brand + ' . ') && r26[k]).sort((a, b) => (r26[b] || 0) - (r26[a] || 0)).slice(0, 3).map(k => ({ n: k, v: r26[k] }))
    const top5 = brands.slice(0, 5)
    const lineData = ['2024', '2025', '2026'].map(yr => {
      const row = rows.find((r: any) => r.year === yr) || {} as any
      const obj: any = { year: yr + ' YTD' }
      top5.forEach(b => { obj[shortName(b)] = row[b] || 0 })
      if (!top5.includes('FORD') && (r26['FORD'] || 0) > 0) obj['FORD'] = row['FORD'] || 0
      return obj
    })
    const lk = [...top5.map(shortName), ...(top5.includes('FORD') ? [] : (r26['FORD'] || 0) > 0 ? ['FORD'] : [])]
    return <>
      <Card s={{ marginBottom: 16 }}>
        <Lbl>Top marcas · {label} · YTD 2026 vs YTD 2025</Lbl>
        {top10.map((b, i) => <RankBar key={b + label} rank={i + 1} name={b} val={r26[b] || 0} max={maxV} ford={b === 'FORD'} v25={r25[b]} models={getMod(b)} />)}
        {!fordIn && (r26['FORD'] || 0) > 0 && <>
          <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
          </div>
          <RankBar rank={fordPos} name="FORD" val={r26['FORD'] || 0} max={maxV} ford v25={r25['FORD']} models={getMod('FORD')} />
        </>}
      </Card>
      {lk.length > 1 && <Card s={{ marginBottom: 16 }}>
        <Lbl>Evolución top marcas · {label} · YTD 2024–2026</Lbl>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
            {lk.map((b, i) => <Line key={b} type="monotone" dataKey={b} stroke={bCol(b, i)} strokeWidth={b === 'FORD' ? 3 : 2} dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>}
    </>
  }

  const zonaRows = useMemo(() => {
    const allPD = provOrder.map(p => provMarcas[p] || [])
    if (!allPD.length || !allPD[0].length) return nacRows
    return ['2024', '2025', '2026'].map(yr => {
      const m: any = { year: yr }
      allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
      Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
      return m
    })
  }, [provMarcas])
  const provRows = prov === 'ZONA ORGU' ? zonaRows : (provMarcas[prov] || [])

  const provChartData = provOrder.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    return { prov: p, '2025 YTD': v25, '2026 YTD': v26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  return <>
    <Hd tag="Pick Ups Full Size" title="Análisis de marcas · F-150" />
    <Ins items={['F-150 lidera con 50% MS pero RAM aparece con 65 unidades YTD — hay que prestarle atención', 'Es la primera competencia real en Full Size en Ecuador']} />
    <div style={gr(2)}>
      <Card s={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <img src="/images/f150xlt.png" alt="F-150 XLT" style={{ height: 65, objectFit: 'contain' }} />
          <img src="/images/f150lariat.png" alt="F-150 Lariat" style={{ height: 65, objectFit: 'contain' }} />
          <img src="/images/f150platinum.png" alt="F-150 Platinum" style={{ height: 65, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>F-150</div>
            <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>XLT $75,990 · Lariat $85,990 · Platinum $95,990</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(r26nac['FORD'] || 0)}</div>
              <div style={{ fontSize: 11, color: C.sub }}>un. YTD</div>
            </div>
            <Dl a={r26nac['FORD']} b={r25nac['FORD']} />
          </div>
        </div>
      </Card>
      <Card s={{ background: `linear-gradient(135deg,${C.glB},#FEF3C7)`, border: `1px solid #FDE68A`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 28px' }}>
        <div style={{ fontSize: 11, color: C.gld, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🏆 Dominio Full Size</div>
        <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.8 }}>
          La F-150 domina el segmento Full Size con <strong>{f150Ms}% de market share</strong>. Con {N(r26nac['FORD'] || 0)} unidades YTD vs {N(r25nac['FORD'] || 0)} en 2025, Ford mantiene liderazgo. RAM aparece con {N(r26nac['RAM'] || 0)} unidades — es la primera competencia real en Full Size y hay que prestarle atención.
        </div>
      </Card>
    </div>
    <Card s={{ marginBottom: 24 }}>
      <Lbl>Full Size · Por provincia · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
    <RankBlock rows={nacRows} label="Nacional" />
    <div style={{ marginTop: 24 }}>
      <SubTab tabs={[{ id: 'ZONA ORGU', label: 'Zona Orgu' }, ...provOrder.map(p => ({ id: p, label: p }))]} active={prov} onChange={setProv} />
      <RankBlock rows={provRows} label={prov === 'ZONA ORGU' ? 'Zona Orgu' : prov} />
    </div>
  </>
}

/* ═══ T12: FORD PORTFOLIO ═══ */
function T12({ d }: { d: any }) {
  const ytdF = (d.ford_ytd || []) as any[]
  const fT = ytdF.find((r: any) => r.cat === 'Total general') || {} as any
  const mktT = (d.mercado_ytd || []).find((r: any) => r.cat === 'Total general') || {} as any
  const ms = mktT.ytd2026 ? ((fT.ytd2026 || 0) / mktT.ytd2026 * 100).toFixed(2) : '0'
  const growth = fT.ytd2025 ? ((fT.ytd2026 / fT.ytd2025 - 1) * 100).toFixed(1) : '0'

  // Build portfolio items from data
  const portfolio = [
    { name: 'New Territory', trim: 'Titanium Plus', fuel: 'HEV', price: '$35,990', img: '/images/territory.png', v26: 201, v25: 0, segment: 'SUV HEV 25-40K', highlight: 'Motor del crecimiento Ford' },
    { name: 'F-150', trim: 'XLT · Lariat · Platinum', fuel: 'Gasolina', price: 'Desde $75,990', img: '/images/f150xlt.png', v26: 93, v25: 65, segment: 'Full Size', highlight: '#1 Full Size' },
    { name: 'Everest', trim: 'Active', fuel: 'Diésel', price: '$69,990', img: '/images/everest.png', v26: 31, v25: 17, segment: 'SUV 55-80K', highlight: '#3 en su segmento' },
    { name: 'Ranger', trim: 'XL · XLT', fuel: 'Diésel 4x4', price: 'Desde $53,990', img: '/images/rangerxl.png', v26: 26, v25: 23, segment: 'Pickup Diesel', highlight: 'Crecimiento sostenido' },
    { name: 'Explorer Active', trim: 'Active', fuel: 'Gasolina', price: '$79,990', img: '/images/exploreractive.png', v26: 24, v25: 21, segment: 'SUV 60-80K', highlight: '+14.3% YTD' },
    { name: 'Escape 1.5', trim: 'Titanium', fuel: 'Gasolina', price: '$35,990', img: '/images/escape15.png', v26: 14, v25: 45, segment: 'SUV Gas 25-40K', highlight: 'Ajuste de mix' },
    { name: 'Escape ST-Line', trim: 'ST-Line', fuel: 'HEV', price: '$46,990', img: '/images/escapestline.png', v26: 7, v25: 14, segment: 'SUV HEV 40-50K', highlight: 'Monitorear canibalización' },
    { name: 'Expedition', trim: 'Platinum', fuel: 'Gasolina', price: '$129,990', img: '/images/expeditionplatinum.png', v26: 2, v25: 2, segment: 'SUV +80K', highlight: 'Premium estable' },
    { name: 'Bronco', trim: 'Badlands', fuel: 'Gasolina', price: '$119,990', img: '/images/bronco.png', v26: 0, v25: 2, segment: 'SUV +80K', highlight: 'Sin unidades YTD' },
    { name: 'Explorer Platinum', trim: 'Platinum', fuel: 'Gasolina', price: '$94,990', img: '/images/explorerplatinum.png', v26: 0, v25: 1, segment: 'SUV +80K', highlight: 'Sin unidades YTD' },
  ]

  return <>
    <Hd tag="Ford Portfolio Ecuador" title="Rendimiento Q1 2026 · Todos los modelos" />
    <Ins items={['Ford Ecuador cierra Q1 2026 con el mejor arranque en 3 años', 'Territory redefine el mix, F-150 lidera Full Size, y Everest escala. El reto: sostener este momentum y vigilar a RAM']} />

    {/* Hero summary */}
    <Card s={{ background: `linear-gradient(135deg, ${C.navy}, #1E3A5F)`, padding: '28px 32px', marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{N(fT.ytd2026)}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Unidades YTD</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#4ADE80', lineHeight: 1 }}>+{growth}%</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Crecimiento vs 2025</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.sky, lineHeight: 1 }}>{ms}%</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Market Share</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#FBBF24', lineHeight: 1 }}>{N(fc(fT.ytd2026 || 0))}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Forecast 2026</div>
        </div>
      </div>
    </Card>

    {/* Portfolio grid — each model as a card */}
    <Lbl>Portafolio por modelo · Ordenado por volumen YTD</Lbl>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
      {portfolio.map((m, i) => {
        const u = m.v25 ? m.v26 >= m.v25 : m.v26 > 0
        return <Card key={m.name} s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderLeft: i < 3 ? `4px solid ${C.ac}` : undefined }}>
          <img src={m.img} alt={m.name} style={{ height: 65, objectFit: 'contain', flexShrink: 0, width: 100 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.sub }}>{m.trim} · {m.fuel}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ac, flexShrink: 0 }}>{m.price}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: C.txt }}>{N(m.v26)}</span>
              <span style={{ fontSize: 11, color: C.sub }}>un. YTD</span>
              <Dl a={m.v26} b={m.v25} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: C.mut, background: C.bg, padding: '2px 8px', borderRadius: 4 }}>{m.segment}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: u ? C.up : C.dn }}>{m.highlight}</span>
            </div>
          </div>
        </Card>
      })}
    </div>

    {/* Ford by category table */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Ford por categoría · YTD comparable</Lbl>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: `2px solid ${C.brd}` }}>
          {['Categoría', 'YTD 2025', 'YTD 2026', 'Variación', 'Forecast'].map((h, i) => <th key={h} style={{ padding: '10px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 11, fontWeight: 600, color: C.mut }}>{h}</th>)}
        </tr></thead>
        <tbody>{ytdF.filter((r: any) => r.cat !== 'Total general').map((r: any) =>
          <tr key={r.cat} style={{ borderBottom: `1px solid ${C.bg}` }}>
            <td style={{ padding: '12px 14px', fontWeight: 600, color: C.txt }}>{cn(r.cat)}</td>
            <td style={{ padding: '12px 14px', textAlign: 'right', color: C.sub }}>{N(r.ytd2025)}</td>
            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: C.navy }}>{N(r.ytd2026)}</td>
            <td style={{ padding: '12px 14px', textAlign: 'right' }}><Dl a={r.ytd2026} b={r.ytd2025} /></td>
            <td style={{ padding: '12px 14px', textAlign: 'right', color: C.ac, fontWeight: 600 }}>{N(fc(r.ytd2026 || 0))}</td>
          </tr>
        )}</tbody>
      </table>
    </Card>
  </>
}
