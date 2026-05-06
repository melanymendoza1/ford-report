// @ts-nocheck
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
const fc = (v: number, m = 3) => Math.round(v / m * 12)
const gr = (c: number, gap = 16) => ({ display: 'grid' as const, gridTemplateColumns: `repeat(${c},1fr)`, gap, marginBottom: 20 })
const PROVS = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
const pn = (p: string) => ({ 'PICHINCHA': 'Pichincha', 'GUAYAS': 'Guayas', 'MANABÍ': 'Manabí', 'EL ORO': 'El Oro', 'ZONA ORGU': 'Zona Orgu', 'NACIONAL': 'Nacional', 'TODAS': 'Todas' }[p] || p)

const TABS = [
  { id: 'ind', l: 'Industria' }, { id: 'comb', l: 'Combustibles' }, { id: 'seg', l: 'SUV Segmentos' },
  { id: 'g25', l: 'Gas 25-40K' }, { id: 'h25', l: 'HEV 25-40K' }, { id: 'h40', l: 'HEV 40-50K' },
  { id: 's55', l: 'SUV 55-80K' }, { id: 's80', l: 'SUV +80K' },
  { id: 'pcat', l: 'PU Segmentos' }, { id: 'pd', l: 'PU Diesel' }, { id: 'pf', l: 'PU Full Size' },
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
  // Clean model name — remove brand prefix and trim specs
  const cleanModel = (n: string) => {
    let m = n.includes(' · ') ? n.split(' · ')[1] : n.includes(' . ') ? n.split(' . ')[1] : n
    return m || n
  }
  return <div style={{ padding: '10px 0', borderBottom: `1px solid ${C.bg}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: ford ? C.ac : C.mut, textAlign: 'center' }}>#{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: ford ? 700 : 600, color: ford ? C.navy : C.txt }}>{shortName(name)}</span>
            {models && models.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              {models.map(m => <span key={m.n} style={{ fontSize: 10, color: C.mut }}>{cleanModel(m.n)}</span>)}
            </div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: ford ? C.navy : C.txt }}>{N(val)}</span>
            {v25 != null && <Dl a={val} b={v25} />}
          </div>
        </div>
        <div style={{ height: 5, background: C.bg, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${w}%`, height: '100%', borderRadius: 99, background: ford ? `linear-gradient(90deg,${C.navy},${C.ac})` : `linear-gradient(90deg,${C.brd},#D1D5DB)` }} />
        </div>
      </div>
    </div>
  </div>
}

function SubTab({ tabs, active, onChange }: { tabs: { id: string, label: string }[], active: string, onChange: (id: string) => void }) {
  return <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => <button key={t.id} onClick={() => onChange(t.id)} style={{ fontSize: 12, fontWeight: 600, padding: '10px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', background: active === t.id ? C.navy : C.bg, color: active === t.id ? '#fff' : C.sub }}>{t.label}</button>)}
  </div>
}

/* BBC — Bubble Brand Chart */
function BBC({ brands, scopeLabel }: { brands: { brand: string, models: { name: string, price: number, vol: number, noPrice?: boolean }[], totalVol: number, ms: number, color: string }[], scopeLabel: string }) {
  if (!brands.length) return null
  const allModels = brands.flatMap(b => b.models.map(m => ({ ...m, brand: b.brand, color: b.color })))
  const maxVol = Math.max(...allModels.map(m => m.vol), 1)
  const validPrices = allModels.filter(m => m.price > 0 && !m.noPrice).map(m => m.price)
  if (!validPrices.length) return null
  const minP = Math.floor((Math.min(...validPrices) - 2000) / 5000) * 5000
  const maxP = Math.ceil((Math.max(...validPrices) + 2000) / 5000) * 5000
  const rangeP = maxP - minP || 10000

  const W = 950, H = 480, PAD = { t: 30, b: 85, l: 80, r: 20 }
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b
  const colW = plotW / brands.length

  const yScale = (p: number) => PAD.t + plotH - ((p - minP) / rangeP * plotH)
  const rScale = (v: number) => Math.max(8, Math.min(38, Math.sqrt(v / maxVol) * 38))

  const yTicks: number[] = []
  for (let p = minP; p <= maxP; p += 5000) yTicks.push(p)

  // Find THE one $5K range with most bubbles
  const priceBuckets: Record<number, number> = {}
  allModels.filter(m => m.price > 0).forEach(m => {
    const bucket = Math.floor(m.price / 5000) * 5000
    priceBuckets[bucket] = (priceBuckets[bucket] || 0) + 1
  })
  const hotBucket = Object.entries(priceBuckets).sort((a, b) => b[1] - a[1])[0]
  const hotRange = hotBucket ? Number(hotBucket[0]) : -1

  const fmtPrice = (p: number) => `$${p.toLocaleString('es-EC')}`

  return <Card s={{ marginBottom: 20, overflow: 'hidden' }}>
    <Lbl>Competencia por precio y volumen · {scopeLabel}</Lbl>
    <div style={{ fontSize: 10, color: C.mut, marginBottom: 8 }}>Tamaño = volumen YTD · Posición vertical = precio</div>
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 750, height: 'auto' }}>
        {/* Grid lines — ONE strong range */}
        {yTicks.map(p => {
          const isHot = p === hotRange || p === hotRange + 5000
          return <g key={p}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yScale(p)} y2={yScale(p)} stroke={isHot ? '#64748B' : '#E2E8F0'} strokeDasharray={isHot ? '8,4' : '4,4'} strokeWidth={isHot ? 2 : 0.8} />
            <text x={PAD.l - 8} y={yScale(p) + 4} textAnchor="end" fontSize={9} fill={isHot ? C.txt : C.mut} fontWeight={isHot ? 700 : 400}>{fmtPrice(p)}</text>
          </g>
        })}
        {/* Hot range shading */}
        {hotRange >= 0 && <rect x={PAD.l} y={yScale(hotRange + 5000)} width={W - PAD.l - PAD.r} height={yScale(hotRange) - yScale(hotRange + 5000)} fill="#F1F5F9" opacity={0.5} />}
        {/* Column separators */}
        {brands.map((_, bi) => bi > 0 && <line key={bi} x1={PAD.l + bi * colW} x2={PAD.l + bi * colW} y1={PAD.t} y2={H - PAD.b + 5} stroke="#F1F5F9" strokeWidth={1} />)}
        {/* Brand columns */}
        {brands.map((b, bi) => {
          const cx = PAD.l + bi * colW + colW / 2
          const visibleModels = b.models.filter(m => m.price > 0 && m.vol > 0)
          return <g key={b.brand}>
            <rect x={PAD.l + bi * colW + 2} y={H - PAD.b + 10} width={colW - 4} height={65} rx={6} fill={b.color} />
            <text x={cx} y={H - PAD.b + 28} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{b.brand}</text>
            <text x={cx} y={H - PAD.b + 44} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.85)">VOL: {N(b.totalVol)}</text>
            <text x={cx} y={H - PAD.b + 58} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.85)">MS: {b.ms.toFixed(0)}%</text>
            {visibleModels.map((m, mi) => {
              const r = rScale(m.vol)
              const y = yScale(m.price)
              const total = visibleModels.length
              const xOff = total > 1 ? (mi - (total - 1) / 2) * Math.min(r * 1.4, colW * 0.35) : 0
              return <g key={m.name + mi}>
                <circle cx={cx + xOff} cy={y} r={r} fill={b.color} opacity={m.noPrice ? 0.4 : 0.85} stroke="#fff" strokeWidth={2} strokeDasharray={m.noPrice ? '4,3' : ''} />
                <text x={cx + xOff} y={y - r - 14} textAnchor="middle" fontSize={8} fontWeight={600} fill={C.txt}>{m.name}</text>
                {!m.noPrice && <text x={cx + xOff} y={y - r - 4} textAnchor="middle" fontSize={7} fontWeight={500} fill={C.ac}>{fmtPrice(m.price)}</text>}
                <text x={cx + xOff} y={y + 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">{m.vol}</text>
              </g>
            })}
          </g>
        })}
      </svg>
    </div>
  </Card>
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
  // Hero uses Nacional totals; scope cards use Zona Orgu
  const ytdMNac = ((data as any).mercado_ytd_nacional || ytdM) as any[]
  const ytdFNac = ((data as any).ford_ytd_nacional || ytdF) as any[]
  const mT = ytdMNac.find((r: any) => r.cat === 'Total general') || {} as any
  const fT = ytdFNac.find((r: any) => r.cat === 'Total general') || {} as any
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
        <div style={{ fontSize: 11, color: C.sky, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Q1 2026 · YTD Comparable ene-feb-mar-abr</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Ford crece 1.8x más rápido que el mercado</h1>
        <p style={{ fontSize: 13, color: '#7BA8D4', margin: '0 0 20px' }}>Industria +{dInd}% vs Ford +{dFord}% YTD comparable (ene-feb-mar-abr 2026 vs 2025)</p>
        <div style={gr(4, 16)}>
          {[
            { l: 'Industria YTD', v: N(mT.ytd2026), s: `↑ +${dInd}% vs ${N(mT.ytd2025)} un. (2025 YTD)`, c: C.sky },
            { l: 'Ford Nacional YTD', v: N(fT.ytd2026), s: `↑ +${dFord}% vs ${N(fT.ytd2025)} un. (2025 YTD)`, c: '#10B981' },
            { l: 'Market Share Ford', v: `${msF}%`, s: `vs ${ms25}% (2025 YTD)`, c: C.gld },
            { l: 'Forecast 2026', v: N(fc(fT.ytd2026 || 0, (data as any).months_ytd || 4)), s: `Proyección lineal · ${(data as any).months_ytd || 4}m × ${Math.round(12 / ((data as any).months_ytd || 4))}`, c: '#94A3B8' },
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
      <p style={{ fontSize: 11, color: C.mut, margin: 0 }}>Datos a {data.report_month} · Fuente: AEADE Matriculación · YTD comparable ene-feb-mar-abr · Orgu Ford Ecuador</p>
    </footer>
  </div>
}

/* ═══ T1: INDUSTRIA ═══ */
function T1({ d }: { d: any }) {
  const [scope, setScope] = useState('NACIONAL')
  const ytdM = (d.mercado_ytd || []).filter((r: any) => r.cat !== 'Total general')
  const ytdF = (d.ford_ytd || []) as any[]
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const provs = provOrder.map(p => (d.provincias_ytd || []).find((r: any) => r.prov === p)).filter(Boolean)
  const fProvs = d.ford_provincias_ytd || []
  const fordCatProv = d.ford_cat_por_prov || []
  const cats = ['AUTOMOV. DE PASAJEROS', 'BUS', 'CAMION', 'PICK UPS', 'SUV', 'VAN']

  // Build data based on scope
  const getScopeData = () => {
    if (scope === 'NACIONAL') {
      const nacM = ((d.mercado_ytd_nacional || []) as any[]).filter((r: any) => r.cat !== 'Total general')
      const nacF = (d.ford_ytd_nacional || []) as any[]
      return nacM.map((r: any) => {
        const f = nacF.find((fr: any) => fr.cat === r.cat) || {} as any
        return { cat: r.cat, ind25: r.ytd2025, ind26: r.ytd2026, ford25: f.ytd2025 || 0, ford26: f.ytd2026 || 0 }
      })
    }
    // Zona Orgu or specific province
    const provKeys: Record<string, string> = { 'PICHINCHA': 'cat_pichincha_ytd', 'GUAYAS': 'cat_guayas_ytd', 'MANABÍ': 'cat_manabi_ytd', 'EL ORO': 'cat_eloro_ytd' }
    const targetProvs = scope === 'ZONA ORGU' ? provOrder : [scope]
    return cats.map(cat => {
      let ind25 = 0, ind26 = 0, ford25 = 0, ford26 = 0
      targetProvs.forEach(p => {
        const catRows = (d[provKeys[p]] || []) as any[]
        const r = catRows.find((x: any) => x.cat === cat)
        if (r) { ind25 += (r.ytd2025 || 0); ind26 += (r.ytd2026 || 0) }
        // Ford by cat by province
        const fp = fordCatProv.filter((x: any) => x.label === cat)
        // fordCatProv has structure: PICHINCHA, then cats under it
        // Need to find province then cat
      })
      // Ford from ford_cat_por_prov structure: [PICHINCHA, AUTOMOV, CAMION, PICK UPS, SUV, GUAYAS, ...]
      let fcur = null as string | null
      fordCatProv.forEach((r: any) => {
        if (provOrder.includes(r.label)) fcur = r.label
        else if (fcur && targetProvs.includes(fcur) && r.label === cat) {
          ford25 += (r['2025'] || 0); ford26 += (r['2026'] || 0)
        }
      })
      return { cat, ind25, ind26, ford25, ford26 }
    })
  }

  const scopeData = getScopeData()
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : scope
  const totInd25 = scopeData.reduce((s: number, r: any) => s + r.ind25, 0)
  const totInd26 = scopeData.reduce((s: number, r: any) => s + r.ind26, 0)
  const totFord25 = scopeData.reduce((s: number, r: any) => s + r.ford25, 0)
  const totFord26 = scopeData.reduce((s: number, r: any) => s + r.ford26, 0)

  const chartData = scopeData.map(r => {
    const pct = r.ind25 ? ((r.ind26 - r.ind25) / r.ind25 * 100).toFixed(1) : '0'
    return { cat: cn(r.cat), 'Ind 2025': r.ind25, 'Ind 2026': r.ind26, 'Ford 2026': r.ford26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const DL = (props: any) => { const { x, y, width, index } = props; if (!chartData[index]) return null; const dd = chartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  return <>
    <Hd tag="Industria Nacional + Zona Orgu" title="Análisis de mercado automotriz" />
    <Ins items={['El mercado ecuatoriano crece +41.7% YTD. Ford crece 1.8x más rápido que la industria (+73.2%)', 'Estamos ganando share en un mercado que se expande — la mejor combinación posible']} />

    {/* Scope selector */}
    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...provOrder.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* Hero KPIs */}
    {(() => {
      const dInd = totInd25 ? ((totInd26 - totInd25) / totInd25 * 100) : 0
      const dFord = totFord25 ? ((totFord26 - totFord25) / totFord25 * 100) : 0
      const dMS = totInd25 ? (totFord26/totInd26*100 - totFord25/totInd25*100) : 0
      const cards = [
        { label: `Industria ${scopeLabel}`, v26: totInd26, v25: totInd25, delta: dInd, accent: C.ac },
        { label: `Ford ${scopeLabel}`, v26: totFord26, v25: totFord25, delta: dFord, accent: C.navy },
        { label: 'Crecimiento Industria', v26: totInd26, v25: totInd25, delta: dInd, accent: C.up, isGrowth: true },
        { label: 'MS Ford', v26: totFord26, v25: totFord25, delta: dMS, accent: C.gld, isMS: true },
      ]
      return <div style={gr(4)}>{cards.map((c, i) => {
        const u = c.delta >= 0
        const val = c.isGrowth ? `${dInd.toFixed(1)}%` : c.isMS ? `${(totFord26/totInd26*100).toFixed(2)}%` : N(c.v26)
        const sub = c.isGrowth ? `vs ${(totFord25/totInd25*100).toFixed(2)}% en 2025` : c.isMS ? scopeLabel : `2025 YTD: ${N(c.v25)}`
        const badge = !c.isGrowth && !c.isMS && c.v25 ? `${u ? '↑' : '↓'} ${u ? '+' : ''}${c.delta.toFixed(1)}% vs ${N(c.v25)} un.` : null
        return <Card key={i} s={{ borderLeft: `4px solid ${c.accent}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{c.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{val}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>{sub}</div>
          {badge && <div style={{ marginTop: 8 }}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>{badge}</span></div>}
        </Card>
      })}</div>
    })()}

    {/* Chart with Ind + Ford bars */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>YTD Comparable · {scopeLabel} · Industria + Ford por categoría</Lbl>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="cat" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Ind 2025" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Ind 2026" fill={C.ac} radius={[6, 6, 0, 0]} label={<DL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Table Industria + Ford */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>Detalle por categoría · {scopeLabel} · Industria + Ford</Lbl>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ borderBottom: `2px solid ${C.brd}` }}>
          {['Categoría', 'Ind 2025', 'Ind 2026', 'Var Ind', 'Ford 2025', 'Ford 2026', 'Var Ford', 'MS Ford'].map((h, i) =>
            <th key={h} style={{ padding: '8px 6px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontWeight: 600, color: C.mut, textTransform: 'uppercase' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {scopeData.map(r => {
            const indV = r.ind25 ? ((r.ind26 - r.ind25) / r.ind25 * 100) : 0
            const fordV = r.ford25 ? ((r.ford26 - r.ford25) / r.ford25 * 100) : 0
            const ms = r.ind26 ? (r.ford26 / r.ind26 * 100).toFixed(2) : '0'
            return <tr key={r.cat} style={{ borderBottom: `1px solid ${C.bg}` }}>
              <td style={{ padding: '8px 6px', fontWeight: 600, color: C.txt }}>{cn(r.cat)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', color: C.sub }}>{N(r.ind25)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.navy }}>{N(r.ind26)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right' }}><span style={{ fontSize: 11, fontWeight: 600, color: indV >= 0 ? C.up : C.dn }}>{indV >= 0 ? '↑' : '↓'} {Math.abs(indV).toFixed(1)}%</span></td>
              <td style={{ padding: '8px 6px', textAlign: 'right', color: C.sub }}>{N(r.ford25)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.ac }}>{N(r.ford26)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right' }}>{r.ford25 ? <span style={{ fontSize: 11, fontWeight: 600, color: fordV >= 0 ? C.up : C.dn }}>{fordV >= 0 ? '↑' : '↓'} {Math.abs(fordV).toFixed(1)}%</span> : <span style={{ color: C.mut }}>—</span>}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: C.steel }}>{ms}%</td>
            </tr>
          })}
          <tr style={{ borderTop: `2px solid ${C.brd}`, background: C.bg }}>
            <td style={{ padding: '8px 6px', fontWeight: 700 }}>Total</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>{N(totInd25)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.navy }}>{N(totInd26)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}><span style={{ fontSize: 11, fontWeight: 600, color: C.up }}>{totInd25 ? `↑ ${((totInd26-totInd25)/totInd25*100).toFixed(1)}%` : '—'}</span></td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>{N(totFord25)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.ac }}>{N(totFord26)}</td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}><span style={{ fontSize: 11, fontWeight: 600, color: C.up }}>{totFord25 ? `↑ ${((totFord26-totFord25)/totFord25*100).toFixed(1)}%` : '—'}</span></td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: C.steel }}>{totInd26 ? `${(totFord26/totInd26*100).toFixed(2)}%` : '—'}</td>
          </tr>
        </tbody>
      </table>
    </Card>

    {/* Province overview — only show when Nacional or Zona Orgu */}
    {(scope === 'NACIONAL' || scope === 'ZONA ORGU') && <Card>
      <Lbl>Zona Orgu · Desempeño por provincia</Lbl>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={provs.map((r: any) => {
          const f = fProvs.find((fp: any) => fp.prov === r.prov) || {} as any
          const dI = r.ytd2025 ? ((r.ytd2026 - r.ytd2025) / r.ytd2025 * 100).toFixed(1) : '0'
          return { prov: r.prov, 'Ind 2025': r.ytd2025, 'Ind 2026': r.ytd2026, 'Ford 2026': f.ytd2026 || 0, delta: `+${dI}%` }
        })} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Ind 2025" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Ind 2026" fill={C.ac} radius={[6, 6, 0, 0]} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
    </Card>}
  </>
}

/* ═══ T2: COMBUSTIBLES ═══ */
function T2({ d }: { d: any }) {
  const [cat, setCat] = useState('suv')
  const [scope, setScope] = useState('NACIONAL')
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']
  const fuelColors: Record<string, string> = { 'GASOLINA': C.steel, 'HIBRIDO': C.navy, 'ELECTRICO BEV': C.gld, 'DIESEL': C.mut }

  const nacData = cat === 'suv' ? (d.combustible_suv_nacional || []) : (d.combustible_pu_nacional || [])
  const provData = cat === 'suv' ? (d.combustible_suv_prov || []) : (d.combustible_pu_prov || [])

  const provParsed = useMemo(() => {
    const result: Record<string, any[]> = {}
    let cp = ''
    provData.forEach((r: any) => {
      if (['PICHINCHA','GUAYAS','MANABÍ','EL ORO'].includes(r.label)) { cp = r.label; result[cp] = [] }
      else if (cp && !['Total general'].includes(r.label)) result[cp].push(r)
    })
    return result
  }, [provData, cat])

  const getFuelData = () => {
    const exclude = ['SUV', 'PICK UPS', 'Total general']
    if (scope === 'NACIONAL') return nacData.filter((r: any) => !exclude.includes(r.label))
    const targetProvs = scope === 'ZONA ORGU' ? provOrder : [scope]
    const merged: Record<string, any> = {}
    targetProvs.forEach(p => {
      (provParsed[p] || []).forEach((r: any) => {
        if (!merged[r.label]) merged[r.label] = { label: r.label, '2024': 0, '2025': 0, '2026': 0, '2026 FCTS': 0 }
        merged[r.label]['2024'] += (r['2024'] || 0)
        merged[r.label]['2025'] += (r['2025'] || 0)
        merged[r.label]['2026'] += (r['2026'] || 0)
        merged[r.label]['2026 FCTS'] += (r['2026 FCTS'] || 0)
      })
    })
    return Object.values(merged)
  }

  const fuels = getFuelData()
  const tot26 = fuels.reduce((s: number, r: any) => s + (r['2026'] || 0), 0)
  const tot25 = fuels.reduce((s: number, r: any) => s + (r['2025'] || 0), 0)
  const label = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  // Ford by fuel — dynamic based on scope
  const fordCombNac = cat === 'suv' ? (d.ford_comb_suv_nacional || []) : (d.ford_comb_pu_nacional || [])
  const fordCombProv = cat === 'suv' ? (d.ford_comb_suv_prov || []) : (d.ford_comb_pu_prov || [])
  const getFordByFuel = () => {
    const exclude = ['SUV', 'PICK UPS', 'Total general']
    if (scope === 'NACIONAL') return fordCombNac.filter((r: any) => !exclude.includes(r.label))
    // Parse provincial structure
    const targetProvs = scope === 'ZONA ORGU' ? provOrder : [scope]
    const merged: Record<string, any> = {}
    let cp = ''
    fordCombProv.forEach((r: any) => {
      if (['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO'].includes(r.label)) cp = r.label
      else if (cp && targetProvs.includes(cp) && !exclude.includes(r.label)) {
        if (!merged[r.label]) merged[r.label] = { label: r.label, '2024': 0, '2025': 0, '2026': 0 }
        merged[r.label]['2024'] += (r['2024'] || 0)
        merged[r.label]['2025'] += (r['2025'] || 0)
        merged[r.label]['2026'] += (r['2026'] || 0)
      }
    })
    return Object.values(merged)
  }
  const fordFuels = getFordByFuel()
  const fordTotal26 = fordFuels.reduce((s: number, r: any) => s + (r['2026'] || 0), 0)
  const fordTotal25 = fordFuels.reduce((s: number, r: any) => s + (r['2025'] || 0), 0)
  const msF = tot26 ? (fordTotal26 / tot26 * 100).toFixed(2) : '0'

  const barData = fuels.map((r: any) => {
    const v26 = r['2026'] || 0, v25 = r['2025'] || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const ff = fordFuels.find((f: any) => f.label === r.label)
    return { tipo: r.label, '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': ff ? (ff['2026'] || 0) : 0, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const DL = (props: any) => { const { x, y, width, index } = props; if (!barData[index]) return null; const dd = barData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    fuels.forEach((r: any) => { obj[r.label] = r[yr] || 0 })
    return obj
  })

  const catLabel = cat === 'suv' ? 'SUVs' : 'Pickups'
  const insItems = cat === 'suv'
    ? ['El shift de gasolina a híbrido se acelera. HEV pasó de 17% a 23% del mix en un año', 'Ford capturó esta tendencia con Territory']
    : ['Diesel sigue siendo el 77% del volumen pickup', 'Hibrido pickup crece — tendencia emergente a monitorear']

  return <>
    <Hd tag="Combustibles" title="Análisis por tipo de combustible" />
    <Ins items={insItems} />
    <SubTab tabs={[{ id: 'suv', label: 'SUVs' }, { id: 'pu', label: 'Pickups' }]} active={cat} onChange={(id) => { setCat(id); setScope('NACIONAL') }} />
    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...provOrder.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    <div style={gr(4)}>
      {fuels.map((r: any) => {
        const v26 = r['2026'] || 0, v25 = r['2025'] || 0
        const pct26 = tot26 ? (v26 / tot26 * 100).toFixed(1) : '0'
        const pct25 = tot25 ? (v25 / tot25 * 100).toFixed(1) : '0'
        const delta = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
        const u = parseFloat(delta) >= 0
        return <Card key={r.label} s={{ borderLeft: `4px solid ${fuelColors[r.label] || C.mut}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{r.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(v26)}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>{pct26}% del total vs {pct25}% en 2025</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>
              {u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}% vs {N(v25)} un.
            </span>
          </div>
          <div style={{ marginTop: 10, height: 6, background: C.bg, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct26}%`, height: '100%', borderRadius: 99, background: fuelColors[r.label] || C.mut }} />
          </div>
        </Card>
      })}
    </div>

    <div style={gr(2)}>
      <Card>
        <Lbl>Volumen por combustible · {catLabel} · {label} · YTD</Lbl>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} barSize={22} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="tipo" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<DL />} />
            <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {/* Ford vs Industria summary below chart */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '12px 16px', background: C.bg, borderRadius: 10 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.mut }}>Industria {catLabel}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.txt }}>{N(tot26)}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.mut }}>Ford {catLabel}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.navy }}>{N(fordTotal26)}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.mut }}>MS Ford</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ac }}>{msF}%</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: C.mut }}>Var Ford</div>
            <div style={{ marginTop: 2 }}><Dl a={fordTotal26} b={fordTotal25} /></div>
          </div>
        </div>
      </Card>
      <Card>
        <Lbl>Tendencia 2024 a 2026 {catLabel} {label}</Lbl>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
            {fuels.map((r: any) => <Line key={r.label} type="monotone" dataKey={r.label}
              stroke={fuelColors[r.label] || C.mut}
              strokeWidth={r.label === 'HIBRIDO' || r.label === 'GASOLINA' || r.label === 'DIESEL' ? 3 : 1.5}
              dot={{ r: 5, strokeWidth: 2 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  </>
}

function T3({ d }: { d: any }) {
  const [scope, setScope] = useState('NACIONAL')
  const segsNac = (d.suv_segmentos_nacional || []).filter((s: any) => s.seg !== 'Total general')
  const segProv = d.suv_seg_por_provincia || []
  const segsOrgu = (d.suv_segmentos || []).filter((s: any) => s.seg !== 'Total general')
  const fordSegNac = d.ford_suv_seg_nacional || []
  const fordSegProv = d.ford_suv_seg_prov || []
  const provOrder = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']

  // Group segProv: segment -> provinces
  const segGroups = useMemo(() => {
    const g: Record<string, any[]> = {}; let cs = ''
    segProv.forEach((r: any) => { if (PROVS.includes(r.label)) { if (cs) g[cs] = [...(g[cs]||[]), r] } else if (r.label !== 'Total general') { cs = r.label; g[cs] = [] } })
    return g
  }, [segProv])

  // Ford prov parsed: segment -> province -> data
  const fordPP = useMemo(() => {
    const r: Record<string, Record<string, any>> = {}; let cs = ''
    fordSegProv.forEach((x: any) => {
      if (['B SUV','C SUV','D SUV','E SUV','PREMIUM SUV'].includes(x.label)) { cs = x.label; r[cs] = {} }
      else if (cs && PROVS.includes(x.label)) r[cs][x.label] = x
    })
    return r
  }, [fordSegProv])

  const getFordSeg = (seg: string, sc: string) => {
    if (sc === 'NACIONAL') { const f = fordSegNac.find((r: any) => r.label === seg); return { f26: f?.['2026'] || 0, f25: f?.['2025'] || 0 } }
    const tgt = sc === 'ZONA ORGU' ? PROVS : [sc]
    let f26 = 0, f25 = 0; tgt.forEach(p => { const v = fordPP[seg]?.[p]; if (v) { f26 += (v['2026'] || 0); f25 += (v['2025'] || 0) } })
    return { f26, f25 }
  }

  // Get industry segments based on scope
  const getSegs = () => {
    if (scope === 'NACIONAL') return segsNac.map(s => ({ seg: s.seg, y2024: s.y2024, y2025: s.y2025, y2026: s.y2026 }))
    const tgt = scope === 'ZONA ORGU' ? PROVS : [scope]
    return Object.entries(segGroups).map(([seg, pds]) => {
      let y24=0,y25=0,y26=0
      pds.filter((p: any) => tgt.includes(p.label)).forEach((p: any) => { y24+=(p.ytd2024||0); y25+=(p.ytd2025||0); y26+=(p.ytd2026||0) })
      return { seg, y2024: y24, y2025: y25, y2026: y26 }
    })
  }
  const segs = getSegs()
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  const chartData = segs.map(s => {
    const pct = s.y2025 ? ((s.y2026 - s.y2025) / s.y2025 * 100).toFixed(1) : '0'
    const { f26 } = getFordSeg(s.seg, scope)
    return { seg: sn(s.seg), '2024 YTD': s.y2024, '2025 YTD': s.y2025, '2026 YTD': s.y2026, 'Ford 2026': f26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const DL = (props: any) => { const { x, y, width, index } = props; if (!chartData[index]) return null; const dd = chartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  return <>
    <Hd tag="Segmentación SUV · Nacional + Zona Orgu" title="El mercado SUV segmento a segmento" />
    <Ins items={['BSUV y Compact concentran el 80% del volumen SUV', 'Ford compite en Compact con Territory y Escape, en Midsize con Everest, Bronco y Explorer, y en Full Size con Expedition']} />

    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    <div style={gr(5)}>
      {segs.map(s => {
        const delta = s.y2025 ? ((s.y2026 - s.y2025) / s.y2025 * 100).toFixed(1) : '0'
        const u = parseFloat(delta) >= 0
        const { f26, f25 } = getFordSeg(s.seg, scope)
        const ms26 = s.y2026 ? (f26 / s.y2026 * 100).toFixed(1) : '0'
        const ms25 = s.y2025 ? (f25 / s.y2025 * 100).toFixed(1) : '0'
        return <Card key={s.seg} s={{ borderLeft: `4px solid ${C.ac}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{sn(s.seg)}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(s.y2026)}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>2025 YTD: {N(s.y2025)}</div>
          <div style={{ marginTop: 8 }}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>{u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}% vs {N(s.y2025)} un.</span></div>
          {f26 > 0 && <div style={{ marginTop: 8, padding: '6px 10px', background: C.acB, borderRadius: 8, fontSize: 10 }}>
            <div><span style={{ fontWeight: 700, color: C.navy }}>Ford: {N(f26)}</span> · <span style={{ color: C.ac }}>MS {ms26}%</span></div>
            <div style={{ marginTop: 2, color: C.sub }}>vs MS {ms25}% en 2025 {parseFloat(ms26) > parseFloat(ms25) ? <span style={{ color: C.up, fontWeight: 600 }}>↑</span> : parseFloat(ms26) < parseFloat(ms25) ? <span style={{ color: C.dn, fontWeight: 600 }}>↓</span> : null}</div>
          </div>}
        </Card>
      })}
    </div>

    <Card s={{ marginBottom: 20 }}>
      <Lbl>Evolución por segmento · {scopeLabel} · YTD comparable</Lbl>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={16} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="seg" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2024 YTD" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2025 YTD" fill={C.steel} radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<DL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </>
}

function T4({ d }: { d: any }) {
  const [scope, setScope] = useState('NACIONAL')
  const provMarcas = d.suv_25_40_gas?.prov_marcas || {}
  const nacRows = d.suv_25_40_gas?.NACIONAL || []
  const provTotals = d.suv_25_40_gas?.por_provincia || []
  const precio = (d.precios_ford || []).find((p: any) => p.modelo === 'Escape')
  const filters = d.model_filters?.suv_gas_25_40 || {}
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const getRawRows = () => {
    if (scope === 'NACIONAL') return nacRows
    if (scope === 'ZONA ORGU') {
      const allPD = PROVS.map(p => provMarcas[p] || [])
      if (!allPD.length || !allPD[0].length) return nacRows
      return ['2024', '2025', '2026'].map(yr => {
        const m: any = { year: yr }
        allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
        Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
        return m
      })
    }
    return provMarcas[scope] || []
  }

  const rows = getRawRows()

  // Sum only filtered models per brand per year — recalculate brand totals
  const getFilteredBrandTotal = (brand: string, yr: string) => {
    const terms = filters[brand] || []
    if (!terms.length) return 0
    const row = rows.find((r: any) => r.year === yr) || {} as any
    const allKeys = Object.keys(row).filter(k => k !== 'year')

    if (scope === 'NACIONAL') {
      let total = 0
      allKeys.forEach(k => {
        if (k === brand) return
        const isBrandKey = k === k.toUpperCase() && k.length < 20 && !k.includes(' AC ') && !k.includes(' 5P') && !k.includes(' TD ')
        if (isBrandKey || k.includes(' . ')) return
        terms.forEach(term => {
          if (k.toUpperCase().includes(term.toUpperCase())) total += (row[k] || 0)
        })
      })
      return total
    } else {
      // Provincial: brand · model format
      let total = 0
      allKeys.forEach(k => {
        if (!k.startsWith(brand + ' . ')) return
        if (terms.some(t => k.toUpperCase().includes(t.toUpperCase()))) total += (row[k] || 0)
      })
      // If no model-level keys, use brand total (provincial often only has brand)
      if (total === 0 && row[brand]) return row[brand] || 0
      return total
    }
  }

  // Build filtered brand data for ranking
  const filteredBrands = useMemo(() => {
    const brandList = Object.keys(filters).filter(b => filters[b]?.length > 0)
    return brandList.map(b => ({
      brand: b,
      v26: getFilteredBrandTotal(b, '2026'),
      v25: getFilteredBrandTotal(b, '2025'),
      v24: getFilteredBrandTotal(b, '2024'),
    })).filter(x => x.v26 > 0).sort((a, b) => b.v26 - a.v26)
  }, [scope, rows])

  const top10 = filteredBrands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => b.v26), 1)
  const fordEntry = filteredBrands.find(b => b.brand === 'FORD')
  const fordIn = top10.some(b => b.brand === 'FORD')
  const fordPos = filteredBrands.findIndex(b => b.brand === 'FORD') + 1

  // Get model names for display
  const getModelNames = (brand: string) => {
    const terms = filters[brand] || []
    return terms.filter(t => t.length > 0).map(t => t.replace(/-/g, ' ').toUpperCase())
  }

  // Province chart — always Zona Orgu
  const fordProvData = PROVS.map(p => {
    const fp = provMarcas[p] || []
    const fr26 = fp.find((x: any) => x.year === '2026') || {} as any
    const fr25 = fp.find((x: any) => x.year === '2025') || {} as any
    return { prov: p, f26: fr26['FORD'] || 0, f25: fr25['FORD'] || 0 }
  })
  const provChartData = PROVS.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const fd = fordProvData.find(f => f.prov === p)
    const ms = v26 && fd ? (fd.f26 / v26 * 100).toFixed(1) : '0'
    return { prov: pn(p), '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': fd?.f26 || 0, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`, ms }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  // Line + bubble chart data
  const top5 = filteredBrands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b.brand)] = getFilteredBrandTotal(b.brand, yr) })
    if (!top5.some(b => b.brand === 'FORD') && fordEntry) obj['FORD'] = getFilteredBrandTotal('FORD', yr)
    return obj
  })
  const lineKeys = [...top5.map(b => shortName(b.brand)), ...(!top5.some(b => b.brand === 'FORD') && fordEntry ? ['FORD'] : [])]

  // Bubble chart data: x=2025, y=2026, size=growth
  const bubbleData = filteredBrands.slice(0, 8).map(b => ({
    name: shortName(b.brand),
    x: b.v25 || 0,
    y: b.v26,
    z: Math.max(b.v26 - (b.v25 || 0), 5),
    ford: b.brand === 'FORD',
    delta: b.v25 ? ((b.v26 - b.v25) / b.v25 * 100).toFixed(0) : 'NEW'
  }))

  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  return <>
    <Hd tag="SUV Gasolina 25-40K" title="Análisis de marcas · Rango $25K-$40K Gasolina" />
    <Ins items={['Escape 1.5 ya no se está importando. El volumen residual son unidades de inventario', 'La estrategia de Ford apunta al híbrido con Territory en este rango de precio']} />

    <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px', marginBottom: 24 }}>
      <img src="/images/escape15.png" alt="Escape 1.5" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>Escape 1.5</div>
        <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>{precio?.precio || '$35,990'} · Gasolina</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{fordEntry?.v26 || 0}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
        </div>
        <Dl a={fordEntry?.v26 || 0} b={fordEntry?.v25 || 0} />
      </div>
    </Card>

    {/* Province chart — always Zona Orgu with Ford + MS */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>SUV Gas 25-40K · Zona Orgu . YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={gr(4)}>
        {provChartData.map((r: any) => <div key={r.prov} style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{r.prov}</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>MS Ford: {r.ms}%</div>
        </div>)}
      </div>
    </Card>

    {/* Selector for rankings + BBC */}
    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* BBC — Bubble Brand Chart */}
    {(() => {
      const BRAND_COLORS: Record<string, string> = { 'FORD': C.navy, 'TOYOTA': '#EB0A1E', 'MAZDA': '#E87722', 'KIA': '#BB162B', 'NISSAN': '#1A1A1A', 'HYUNDAI': '#00287A', 'SUZUKI': '#005BAC', 'SUBARU': '#013B7C', 'PEUGEOT': '#1E3A5F', 'JETOUR': '#2E8B57', 'MITSUBISHI': '#CC0000', 'HONDA': '#CC0000', 'AUDI': '#333', 'CHEVROLET': '#D4A500', 'JEEP': '#4A6741', 'RAM': '#1A1A1A', 'GMC': '#CC0000', 'BMW': '#1C69D4', 'MERCEDES BENZ': '#333' }
      const priceKey = 'SUV GAS 25 - 40'
      const prices = (d.precios_competidores?.[priceKey] || []) as any[]
      // Ford first — Escape Titanium 1.5 only (not ST-Line)
      const fordModels = [{ name: 'Escape 1.5', price: 35990, vol: fordEntry?.v26 || 0 }]
      const allBrandsForBBC = [...filteredBrands]
      const bbcBrands = allBrandsForBBC.map(b => {
        if (b.brand === 'FORD') return { brand: 'FORD', models: fordModels, totalVol: b.v26, ms: 0, color: BRAND_COLORS['FORD'] }
        const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === b.brand)
        const models = bPrices.filter((p: any) => p.precio).map((p: any) => {
          const trimKey = `${p.modelo} ${p.trim || ''}`.trim().toUpperCase()
          const price = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/[^0-9.]/g, '')) || 0
          // Match trim to actual volume — flexible word matching
          const row = rows.find((r: any) => r.year === '2026') || {} as any
          let vol = 0
          Object.entries(row).forEach(([k, v]) => {
            if (k === 'year' || k === b.brand) return
            let matchKey = k
            if (k.includes(' . ')) {
              if (!k.startsWith(b.brand + ' . ')) return  // different brand subtotal
              // Strip to leaf model name
              const parts = k.split(' . ')
              const leaf = parts[parts.length - 1]
              if (!leaf.includes(' ')) return  // single-word = subtotal, skip
              matchKey = leaf
            }
            const K_STRIP = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','EV','2.0','1.5','1.3','1.6','2.5','3.0','3.5','2.4','2.8','2.2','1.4','1.2','2.3','2.7','3.5','4.0','4.4','5.3','5.8','CVT','TA','TM','6DCT','DCT','BA6','16E','FHEV','ATK','NX4E','BOOSTERJET','EPOWER','NEW','IRG','MX5','DMI','PHEV','FJNACG','F3NA6Y','SPORTBACK','LAREDO','BIGHORN','ETORQUE','FLAGSHIP','TRAILBOSS'])
            const T_STRIP = new Set(['4X2','4X4','CD','DIESEL','HYBRID','CVT','4.0','2.7','2.3','3.5','3.6','5.3','5.8','4.4','2.0','1.5','1.6','2.5','2.4','2.8','1.4','1.3','1.2'])
            const normW = (w:string) => { const m=w.match(/^(\d{3,})[A-Z]$/); return m?m[1]:w }
            const kWords = matchKey.toUpperCase().replace(/-/g,'').split(' ').filter((w:string)=>w&&!K_STRIP.has(w)).map(normW)
            const tWords = trimKey.replace(/-/g,'').split(' ').filter((w:string)=>w&&!T_STRIP.has(w))
            if (!tWords.length) return
            const kPhrase = ' ' + kWords.join(' ') + ' '
            const tPhrase = ' ' + tWords.join(' ') + ' '
            if (kPhrase.includes(tPhrase)) vol += ((v as number) || 0)
          })
          return { name: `${p.modelo} ${p.trim || ''}`.trim(), price, vol }
        })
        return { brand: shortName(b.brand), models, totalVol: b.v26, ms: 0, color: BRAND_COLORS[b.brand] || '#666' }
      }).filter(b => b.models.some(m => m.price > 0))
      // Recalculate MS
      // Add fallback bubble for brands with volume but no matching price trims
      bbcBrands.forEach(b => {
        const matchedVol = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedVol === 0 && b.totalVol > 0) {
          const allP = bbcBrands.flatMap(x => x.models.filter(m => m.price > 0).map(m => m.price))
          const avg = allP.length ? allP.reduce((s: number, p: number) => s + p, 0) / allP.length : 0
          if (avg > 0) b.models.push({ name: b.brand, price: avg, vol: b.totalVol, noPrice: true })
        }
      })
      const totalSeg = bbcBrands.reduce((s: number, x: any) => s + x.totalVol, 0)
      bbcBrands.forEach(b => { b.ms = totalSeg ? (b.totalVol / totalSeg * 100) : 0 })
      // Ford first
      bbcBrands.sort((a, b) => a.brand === 'FORD' ? -1 : b.brand === 'FORD' ? 1 : b.totalVol - a.totalVol)
      return <BBC brands={bbcBrands} scopeLabel={scopeLabel} />
    })()}

    {/* Insight */}
    <Ins items={[
      `El rango de $35K-$40K concentra el mayor volumen. Ford compite con Escape 1.5 a $35,990 pero ya no se importa`,
      `Mazda CX-5, Nissan Qashqai y KIA Sportage dominan este segmento. La estrategia Ford migra al híbrido con Territory`
    ]} />

    {/* Ranking — filtered brand totals */}
    <Card s={{ marginBottom: 16 }}>
      <Lbl>Top marcas · {scopeLabel} · YTD 2026 vs YTD 2025</Lbl>
      {top10.map((b, i) => <RankBar key={b.brand + scope} rank={i + 1} name={b.brand} val={b.v26} max={maxV} ford={b.brand === 'FORD'} v25={b.v25} models={getModelNames(b.brand).map(m => ({ n: b.brand + ' · ' + m, v: b.v26 }))} />)}
      {!fordIn && fordEntry && fordEntry.v26 > 0 && <>
        <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
        </div>
        <RankBar rank={fordPos} name="FORD" val={fordEntry.v26} max={maxV} ford v25={fordEntry.v25} models={getModelNames('FORD').map(m => ({ n: 'FORD · ' + m, v: fordEntry.v26 }))} />
      </>}
    </Card>
  </>
}

function T5({ d }: { d: any }) {
  const [scope, setScope] = useState('NACIONAL')
  const provMarcas = d.suv_25_40_fhev?.prov_marcas || {}
  const nacRows = d.suv_25_40_fhev?.NACIONAL || []
  const provTotals = d.suv_25_40_fhev?.por_provincia || []
  const precio = (d.precios_ford || []).find((p: any) => p.modelo === 'Territory')
  const filters = d.model_filters?.suv_hib_25_40 || {}
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const r26nac = nacRows.find((r: any) => r.year === '2026') || {} as any
  const fordVal = (() => {
    const terms = filters['FORD'] || []
    let total = 0
    Object.entries(r26nac).forEach(([k, v]) => {
      if (k === 'year' || k === 'FORD') return
      if (terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) total += ((v as number) || 0)
    })
    return total || 0
  })()

  const getRawRows = () => {
    if (scope === 'NACIONAL') return nacRows
    if (scope === 'ZONA ORGU') {
      const allPD = PROVS.map(p => provMarcas[p] || [])
      if (!allPD.length || !allPD[0].length) return nacRows
      return ['2024', '2025', '2026'].map(yr => {
        const m: any = { year: yr }
        allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
        Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
        return m
      })
    }
    return provMarcas[scope] || []
  }

  const rows = getRawRows()
  const r25 = rows.find((r: any) => r.year === '2025') || {} as any
  const r26 = rows.find((r: any) => r.year === '2026') || {} as any

  // Filtered brand totals
  const getFilteredTotal = (brand: string, yr: string) => {
    const terms = filters[brand] || []
    if (!terms.length) return 0
    const row = rows.find((r: any) => r.year === yr) || {} as any
    let total = 0
    // Track which terms are already covered by dot-subtotal keys to avoid double-count
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand) return
      if (k.includes(' . ') && k.startsWith(brand + ' . ')) {
        // Dot-subtotal key: BRAND . MODEL aggregate
        const matchingTerms = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (matchingTerms.length) {
          total += ((v as number) || 0)
          matchingTerms.forEach(t => coveredByDot.add(t.toUpperCase()))
        }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand || k.includes(' . ')) return
      // Flat format: raw model names
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const matchingTerms = terms.filter((t: string) => 
          k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase())
        )
        if (matchingTerms.length) total += ((v as number) || 0)
      }
    })
    // No fallback — if no filtered models found, return 0
    return total
  }

  const filteredBrands = useMemo(() => {
    return Object.keys(filters).filter(b => filters[b]?.length > 0)
      .map(b => ({ brand: b, v26: getFilteredTotal(b, '2026'), v25: getFilteredTotal(b, '2025'), v24: getFilteredTotal(b, '2024') }))
      .filter(x => x.v26 > 0).sort((a, b) => b.v26 - a.v26)
  }, [scope, rows])

  const top10 = filteredBrands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => b.v26), 1)
  const fordEntry = filteredBrands.find(b => b.brand === 'FORD')
  const fordIn = top10.some(b => b.brand === 'FORD')
  const fordPos = filteredBrands.findIndex(b => b.brand === 'FORD') + 1
  const getModelNames = (brand: string) => (filters[brand] || []).filter((t: string) => t.length > 0).map((t: string) => t.replace(/-/g, ' ').toUpperCase())

  // Province chart
  const provChartData = PROVS.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const fp = provMarcas[p] || []
    const fr26 = fp.find((x: any) => x.year === '2026') || {} as any
    const ms = v26 ? ((fr26['FORD'] || 0) / v26 * 100).toFixed(1) : '0'
    return { prov: pn(p), '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': fr26['FORD'] || 0, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`, ms }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  // Line chart
  const top5 = filteredBrands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b.brand)] = getFilteredTotal(b.brand, yr) })
    if (!top5.some(b => b.brand === 'FORD') && fordEntry) obj['FORD'] = getFilteredTotal('FORD', yr)
    return obj
  })
  const lineKeys = [...top5.map(b => shortName(b.brand)), ...(!top5.some(b => b.brand === 'FORD') && fordEntry ? ['FORD'] : [])]
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  return <>
    <Hd tag="SUV Híbrido 25-40K" title="Análisis de marcas · Rango $25K-$40K Híbrido" />
    <Ins items={['Territory es el modelo que cambió el juego. 201 unidades en su primer Q1 completo', 'A $35,990 en HEV, captura exactamente donde el mercado está migrando']} />

    {/* Territory card + Territory Effect */}
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
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: C.upB, color: C.up }}>NEW</span>
        </div>
      </Card>
      <Card s={{ background: `linear-gradient(135deg,${C.glB},#FEF3C7)`, border: `1px solid #FDE68A`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 28px' }}>
        <div style={{ fontSize: 11, color: C.gld, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Territory Effect</div>
        <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.8 }}>
          El New Territory redefinió el posicionamiento de Ford en Ecuador. Con {N(fordVal)} unidades YTD representa el <strong>38% del volumen total Ford</strong> y es el principal motor del crecimiento de +73% de la marca. A $35,990 en versión híbrida, captura exactamente donde el mercado está migrando. Posición <strong>#5 nacional</strong> en su primer Q1 completo.
        </div>
      </Card>
    </div>

    {/* Province chart — always Zona Orgu */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>SUV HEV 25-40K · Zona Orgu · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={gr(4)}>
        {provChartData.map((r: any) => <div key={r.prov} style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{r.prov}</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>MS Ford: {r.ms}%</div>
        </div>)}
      </div>
    </Card>

    {/* Selector for rankings */}
    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* BBC */}
    {(() => {
      const BRAND_COLORS: Record<string, string> = { 'FORD': C.navy, 'TOYOTA': '#EB0A1E', 'MAZDA': '#E87722', 'KIA': '#BB162B', 'NISSAN': '#1A1A1A', 'HYUNDAI': '#00287A', 'SUZUKI': '#005BAC', 'SUBARU': '#013B7C', 'PEUGEOT': '#1E3A5F', 'JETOUR': '#2E8B57', 'MITSUBISHI': '#CC0000', 'HONDA': '#CC0000', 'AUDI': '#333', 'CHEVROLET': '#D4A500', 'JEEP': '#4A6741', 'RAM': '#1A1A1A', 'GMC': '#CC0000', 'BMW': '#1C69D4', 'MERCEDES BENZ': '#333' }
      const prices = (d.precios_competidores?.['SUV  HEV 25 - 40'] || []) as any[]
      const fordModels = [{ name: 'Territory', price: 35990, vol: fordEntry?.v26 || 0 }]
      const bbcBrands = filteredBrands.map(b => {
        if (b.brand === 'FORD') return { brand: 'FORD', models: fordModels, totalVol: b.v26, ms: 0, color: BRAND_COLORS['FORD'] }
        const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === b.brand)
        const models = bPrices.filter((p: any) => p.precio).map((p: any) => {
          const trimKey = `${p.modelo} ${p.trim || ''}`.trim().toUpperCase()
          const price = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/[^0-9.]/g, '')) || 0
          // Match trim to actual volume — flexible word matching
          const row = rows.find((r: any) => r.year === '2026') || {} as any
          let vol = 0
          Object.entries(row).forEach(([k, v]) => {
            if (k === 'year' || k === b.brand) return
            let matchKey = k
            if (k.includes(' . ')) {
              if (!k.startsWith(b.brand + ' . ')) return  // different brand subtotal
              // Strip to leaf model name
              const parts = k.split(' . ')
              const leaf = parts[parts.length - 1]
              if (!leaf.includes(' ')) return  // single-word = subtotal, skip
              matchKey = leaf
            }
            const K_STRIP = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','EV','2.0','1.5','1.3','1.6','2.5','3.0','3.5','2.4','2.8','2.2','1.4','1.2','2.3','2.7','3.5','4.0','4.4','5.3','5.8','CVT','TA','TM','6DCT','DCT','BA6','16E','FHEV','ATK','NX4E','BOOSTERJET','EPOWER','NEW','IRG','MX5','DMI','PHEV','FJNACG','F3NA6Y','SPORTBACK','LAREDO','BIGHORN','ETORQUE','FLAGSHIP','TRAILBOSS'])
            const T_STRIP = new Set(['4X2','4X4','CD','DIESEL','HYBRID','CVT','4.0','2.7','2.3','3.5','3.6','5.3','5.8','4.4','2.0','1.5','1.6','2.5','2.4','2.8','1.4','1.3','1.2'])
            const normW = (w:string) => { const m=w.match(/^(\d{3,})[A-Z]$/); return m?m[1]:w }
            const kWords = matchKey.toUpperCase().replace(/-/g,'').split(' ').filter((w:string)=>w&&!K_STRIP.has(w)).map(normW)
            const tWords = trimKey.replace(/-/g,'').split(' ').filter((w:string)=>w&&!T_STRIP.has(w))
            if (!tWords.length) return
            const kPhrase = ' ' + kWords.join(' ') + ' '
            const tPhrase = ' ' + tWords.join(' ') + ' '
            if (kPhrase.includes(tPhrase)) vol += ((v as number) || 0)
          })
          return { name: `${p.modelo} ${p.trim || ''}`.trim(), price, vol }
        })
        return { brand: shortName(b.brand), models, totalVol: b.v26, ms: 0, color: BRAND_COLORS[b.brand] || '#666' }
      }).filter(b => b.totalVol > 0)
      // Scale bubble vols to match totalVol (prevents double-count from subtotal keys)
      bbcBrands.forEach(b => {
        const matchedTotal = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedTotal > 0 && matchedTotal !== b.totalVol) {
          const scale = b.totalVol / matchedTotal
          b.models.forEach(m => { m.vol = Math.round(m.vol * scale) })
        }
      })
      // Brands with volume but no price — place at range average with negative price flag
      const allPricesInBBC = bbcBrands.flatMap(b => b.models.filter(m => m.price > 0).map(m => m.price))
      const avgPrice = allPricesInBBC.length ? allPricesInBBC.reduce((s: number, p: number) => s + p, 0) / allPricesInBBC.length : 0
      bbcBrands.forEach(b => { b.models.forEach(m => { if (m.price === 0 && m.vol > 0 && avgPrice > 0) m.price = -avgPrice }) })
      // Add fallback bubble for brands with volume but no matching price trims
      bbcBrands.forEach(b => {
        const matchedVol = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedVol === 0 && b.totalVol > 0) {
          const allP = bbcBrands.flatMap(x => x.models.filter(m => m.price > 0).map(m => m.price))
          const avg = allP.length ? allP.reduce((s: number, p: number) => s + p, 0) / allP.length : 0
          if (avg > 0) b.models.push({ name: b.brand, price: avg, vol: b.totalVol, noPrice: true })
        }
      })
      const totalSeg = bbcBrands.reduce((s: number, x: any) => s + x.totalVol, 0)
      bbcBrands.forEach(b => { b.ms = totalSeg ? (b.totalVol / totalSeg * 100) : 0 })
      bbcBrands.sort((a, b) => a.brand === 'FORD' ? -1 : b.brand === 'FORD' ? 1 : b.totalVol - a.totalVol)
      return <BBC brands={bbcBrands} scopeLabel={scopeLabel} />
    })()}

    {/* Ranking */}
    <Card s={{ marginBottom: 16 }}>
      <Lbl>Top marcas · {scopeLabel} · YTD 2026 vs YTD 2025</Lbl>
      {top10.map((b, i) => <RankBar key={b.brand + scope} rank={i + 1} name={b.brand} val={b.v26} max={maxV} ford={b.brand === 'FORD'} v25={b.v25} models={getModelNames(b.brand).map(m => ({ n: b.brand + ' · ' + m, v: b.v26 }))} />)}
      {!fordIn && fordEntry && fordEntry.v26 > 0 && <>
        <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
        </div>
        <RankBar rank={fordPos} name="FORD" val={fordEntry.v26} max={maxV} ford v25={fordEntry.v25} models={getModelNames('FORD').map(m => ({ n: 'FORD · ' + m, v: fordEntry.v26 }))} />
      </>}
    </Card>

    <Ins items={['Territory a $35,990 compite directamente con Corolla Cross ($35,999) y Niro ($28,499)', 'El rango HEV 25-40K es el de mayor crecimiento. Ford capturo esta tendencia con Territory']} />
  </>
}

function T6({ d }: { d: any }) {
  const [scope, setScope] = useState('NACIONAL')
  const provMarcas = d.suv_40_50?.prov_marcas || {}
  const nacRows = d.suv_40_50?.NACIONAL || []
  const provTotals = d.suv_40_50?.por_provincia || []
  const filters = d.model_filters?.suv_hib_40_50 || {}
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const getRawRows = () => {
    if (scope === 'NACIONAL') return nacRows
    if (scope === 'ZONA ORGU') {
      const allPD = PROVS.map(p => provMarcas[p] || [])
      if (!allPD.length || !allPD[0].length) return nacRows
      return ['2024', '2025', '2026'].map(yr => {
        const m: any = { year: yr }
        allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
        Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
        return m
      })
    }
    return provMarcas[scope] || []
  }

  const rows = getRawRows()
  const r25 = rows.find((r: any) => r.year === '2025') || {} as any
  const r26 = rows.find((r: any) => r.year === '2026') || {} as any

  const getFilteredTotal = (brand: string, yr: string) => {
    const terms = filters[brand] || []
    if (!terms.length) return 0
    const row = rows.find((r: any) => r.year === yr) || {} as any
    let total = 0
    // Track which terms are already covered by dot-subtotal keys to avoid double-count
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand) return
      if (k.includes(' . ') && k.startsWith(brand + ' . ')) {
        // Dot-subtotal key: BRAND . MODEL aggregate
        const matchingTerms = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (matchingTerms.length) {
          total += ((v as number) || 0)
          matchingTerms.forEach(t => coveredByDot.add(t.toUpperCase()))
        }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand || k.includes(' . ')) return
      // Flat format: raw model names (Nacional and v16 provincial flat keys)
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const matchingTerms = terms.filter((t: string) =>
          k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase())
        )
        if (matchingTerms.length) total += ((v as number) || 0)
      }
    })
    return total
  }

  const filteredBrands = useMemo(() => {
    return Object.keys(filters).filter(b => filters[b]?.length > 0)
      .map(b => ({ brand: b, v26: getFilteredTotal(b, '2026'), v25: getFilteredTotal(b, '2025'), v24: getFilteredTotal(b, '2024') }))
      .filter(x => x.v26 > 0).sort((a, b) => b.v26 - a.v26)
  }, [scope, rows])

  const top10 = filteredBrands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => b.v26), 1)
  const fordEntry = filteredBrands.find(b => b.brand === 'FORD')
  const fordIn = top10.some(b => b.brand === 'FORD')
  const fordPos = filteredBrands.findIndex(b => b.brand === 'FORD') + 1
  const getModelNames = (brand: string) => (filters[brand] || []).filter((t: string) => t.length > 0).map((t: string) => t.replace(/-/g, ' ').toUpperCase())

  // Province chart
  const provChartData = PROVS.map(p => {
    const r = (provTotals || []).find((x: any) => (x.label || x.prov) === p)
    const v26 = r?.ytd2026 || 0, v25 = r?.ytd2025 || 0
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const fp = provMarcas[p] || []
    const fr26 = fp.find((x: any) => x.year === '2026') || {} as any
    const ms = v26 ? ((fr26['FORD'] || 0) / v26 * 100).toFixed(1) : '0'
    return { prov: pn(p), '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': fr26['FORD'] || 0, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`, ms }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  // Line chart
  const top5 = filteredBrands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b.brand)] = getFilteredTotal(b.brand, yr) })
    if (!top5.some(b => b.brand === 'FORD') && fordEntry) obj['FORD'] = getFilteredTotal('FORD', yr)
    return obj
  })
  const lineKeys = [...top5.map(b => shortName(b.brand)), ...(!top5.some(b => b.brand === 'FORD') && fordEntry ? ['FORD'] : [])]
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  return <>
    <Hd tag="SUV Híbrido 40-50K" title="Análisis de marcas · Rango $40K-$50K Híbrido" />
    <Ins items={['Escape ST-Line cae -50%. Territory captura volumen en el rango inferior', 'Monitorear si el ST-Line necesita reposicionamiento de precio o de comunicación']} />

    <div style={gr(2)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px' }}>
        <img src="/images/escapestline.png" alt="Escape ST-Line" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>Escape ST-Line</div>
          <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>$44,990 · HEV</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(fordEntry?.v26 || 0)}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>un. YTD</div>
          </div>
          <Dl a={fordEntry?.v26 || 0} b={fordEntry?.v25 || 0} />
        </div>
      </Card>
      <Card s={{ background: C.dnB, border: `1px solid #FECACA`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 28px' }}>
        <div style={{ fontSize: 11, color: C.dn, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Alerta de canibalización</div>
        <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.8 }}>
          El Escape ST-Line HEV cae -50% YTD (14 a 7 un.) por canibalización directa del Territory. Territory captura volumen en el rango inferior con una propuesta de valor más agresiva. Monitorear si el ST-Line necesita reposicionamiento de precio o de comunicación.
        </div>
      </Card>
    </div>

    {/* Province chart */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>SUV HEV 40-50K · Zona Orgu · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={gr(4)}>
        {provChartData.map((r: any) => <div key={r.prov} style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{r.prov}</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>MS Ford: {r.ms}%</div>
        </div>)}
      </div>
    </Card>

    {/* Selector */}
    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* BBC */}
    {(() => {
      const BRAND_COLORS: Record<string, string> = { 'FORD': C.navy, 'TOYOTA': '#EB0A1E', 'MAZDA': '#E87722', 'KIA': '#BB162B', 'NISSAN': '#1A1A1A', 'HYUNDAI': '#00287A', 'SUZUKI': '#005BAC', 'SUBARU': '#013B7C', 'PEUGEOT': '#1E3A5F', 'JETOUR': '#2E8B57', 'MITSUBISHI': '#CC0000', 'HONDA': '#CC0000', 'AUDI': '#333', 'CHEVROLET': '#D4A500', 'JEEP': '#4A6741', 'RAM': '#1A1A1A', 'GMC': '#CC0000', 'BMW': '#1C69D4', 'MERCEDES BENZ': '#333' }
      const prices = (d.precios_competidores?.['SUV  HEV 40 - 50'] || []) as any[]
      const fordModels = [{ name: 'Escape ST-Line', price: 44990, vol: fordEntry?.v26 || 0 }]
      const bbcBrands = filteredBrands.map(b => {
        if (b.brand === 'FORD') return { brand: 'FORD', models: fordModels, totalVol: b.v26, ms: 0, color: BRAND_COLORS['FORD'] }
        const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === b.brand)
        const models = bPrices.filter((p: any) => p.precio).map((p: any) => {
          const trimKey = `${p.modelo} ${p.trim || ''}`.trim().toUpperCase()
          const price = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/[^0-9.]/g, '')) || 0
          // Match trim to actual volume — flexible word matching
          const row = rows.find((r: any) => r.year === '2026') || {} as any
          let vol = 0
          Object.entries(row).forEach(([k, v]) => {
            if (k === 'year' || k === b.brand) return
            let matchKey = k
            if (k.includes(' . ')) {
              if (!k.startsWith(b.brand + ' . ')) return  // different brand subtotal
              // Strip to leaf model name
              const parts = k.split(' . ')
              const leaf = parts[parts.length - 1]
              if (!leaf.includes(' ')) return  // single-word = subtotal, skip
              matchKey = leaf
            }
            const K_STRIP = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','EV','2.0','1.5','1.3','1.6','2.5','3.0','3.5','2.4','2.8','2.2','1.4','1.2','2.3','2.7','3.5','4.0','4.4','5.3','5.8','CVT','TA','TM','6DCT','DCT','BA6','16E','FHEV','ATK','NX4E','BOOSTERJET','EPOWER','NEW','IRG','MX5','DMI','PHEV','FJNACG','F3NA6Y','SPORTBACK','LAREDO','BIGHORN','ETORQUE','FLAGSHIP','TRAILBOSS'])
            const T_STRIP = new Set(['4X2','4X4','CD','DIESEL','HYBRID','CVT','4.0','2.7','2.3','3.5','3.6','5.3','5.8','4.4','2.0','1.5','1.6','2.5','2.4','2.8','1.4','1.3','1.2'])
            const normW = (w:string) => { const m=w.match(/^(\d{3,})[A-Z]$/); return m?m[1]:w }
            const kWords = matchKey.toUpperCase().replace(/-/g,'').split(' ').filter((w:string)=>w&&!K_STRIP.has(w)).map(normW)
            const tWords = trimKey.replace(/-/g,'').split(' ').filter((w:string)=>w&&!T_STRIP.has(w))
            if (!tWords.length) return
            const kPhrase = ' ' + kWords.join(' ') + ' '
            const tPhrase = ' ' + tWords.join(' ') + ' '
            if (kPhrase.includes(tPhrase)) vol += ((v as number) || 0)
          })
          return { name: `${p.modelo} ${p.trim || ''}`.trim(), price, vol }
        })
        return { brand: shortName(b.brand), models, totalVol: b.v26, ms: 0, color: BRAND_COLORS[b.brand] || '#666' }
      }).filter(b => b.totalVol > 0)
      // Scale bubble vols to match totalVol (prevents double-count from subtotal keys)
      bbcBrands.forEach(b => {
        const matchedTotal = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedTotal > 0 && matchedTotal !== b.totalVol) {
          const scale = b.totalVol / matchedTotal
          b.models.forEach(m => { m.vol = Math.round(m.vol * scale) })
        }
      })
      // Brands with volume but no price — place at range average with negative price flag
      const allPricesInBBC = bbcBrands.flatMap(b => b.models.filter(m => m.price > 0).map(m => m.price))
      const avgPrice = allPricesInBBC.length ? allPricesInBBC.reduce((s: number, p: number) => s + p, 0) / allPricesInBBC.length : 0
      bbcBrands.forEach(b => { b.models.forEach(m => { if (m.price === 0 && m.vol > 0 && avgPrice > 0) m.price = -avgPrice }) })
      // Add fallback bubble for brands with volume but no matching price trims
      bbcBrands.forEach(b => {
        const matchedVol = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedVol === 0 && b.totalVol > 0) {
          const allP = bbcBrands.flatMap(x => x.models.filter(m => m.price > 0).map(m => m.price))
          const avg = allP.length ? allP.reduce((s: number, p: number) => s + p, 0) / allP.length : 0
          if (avg > 0) b.models.push({ name: b.brand, price: avg, vol: b.totalVol, noPrice: true })
        }
      })
      const totalSeg = bbcBrands.reduce((s: number, x: any) => s + x.totalVol, 0)
      bbcBrands.forEach(b => { b.ms = totalSeg ? (b.totalVol / totalSeg * 100) : 0 })
      bbcBrands.sort((a, b) => a.brand === 'FORD' ? -1 : b.brand === 'FORD' ? 1 : b.totalVol - a.totalVol)
      return <BBC brands={bbcBrands} scopeLabel={scopeLabel} />
    })()}

    {/* Ranking */}
    <Card s={{ marginBottom: 16 }}>
      <Lbl>Top marcas · {scopeLabel} · YTD 2026 vs YTD 2025</Lbl>
      {top10.map((b, i) => <RankBar key={b.brand + scope} rank={i + 1} name={b.brand} val={b.v26} max={maxV} ford={b.brand === 'FORD'} v25={b.v25} models={getModelNames(b.brand).map(m => ({ n: b.brand + ' · ' + m, v: b.v26 }))} />)}
      {!fordIn && fordEntry && fordEntry.v26 > 0 && <>
        <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
        </div>
        <RankBar rank={fordPos} name="FORD" val={fordEntry.v26} max={maxV} ford v25={fordEntry.v25} models={getModelNames('FORD').map(m => ({ n: 'FORD · ' + m, v: fordEntry.v26 }))} />
      </>}
    </Card>

    <Ins items={['Escape ST-Line a $44,990 compite con Xtrail ($43,990-$48,990) y RAV4 ($45,999-$51,999)', 'Territory canibaliza al ST-Line desde el rango inferior. Monitorear reposicionamiento']} />
  </>
}

function T7({ d }: { d: any }) {
  const [sub, setSub] = useState('everest')
  const [scope, setScope] = useState('NACIONAL')
  const n55 = d.suv_55_80?.NACIONAL || []
  const n60 = d.suv_60_80?.NACIONAL || []
  const pm55 = d.suv_55_80?.prov_marcas || {}
  const pm60 = d.suv_60_80?.prov_marcas || {}
  const pt55 = d.suv_55_80?.por_provincia || []
  const pt60 = d.suv_60_80?.por_provincia || []
  const filters55 = d.model_filters?.suv_55_80_everest || {}
  const filters60 = d.model_filters?.suv_55_80_explorer || {}
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const activeNac = sub === 'everest' ? n55 : n60
  const activePM = sub === 'everest' ? pm55 : pm60
  const activePT = sub === 'everest' ? pt55 : pt60
  const activeFilters = sub === 'everest' ? filters55 : filters60

  const getRawRows = () => {
    if (scope === 'NACIONAL') return activeNac
    if (scope === 'ZONA ORGU') {
      const allPD = PROVS.map(p => activePM[p] || [])
      if (!allPD.length || !allPD[0].length) return activeNac
      return ['2024', '2025', '2026'].map(yr => {
        const m: any = { year: yr }
        allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
        Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
        return m
      })
    }
    return activePM[scope] || []
  }

  const rows = getRawRows()
  const r25 = rows.find((r: any) => r.year === '2025') || {} as any
  const r26 = rows.find((r: any) => r.year === '2026') || {} as any

  const getFilteredTotal = (brand: string, yr: string) => {
    const terms = activeFilters[brand] || []
    if (!terms.length) return 0
    const row = rows.find((r: any) => r.year === yr) || {} as any
    let total = 0
    // Track which terms are already covered by dot-subtotal keys to avoid double-count
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand) return
      if (k.includes(' . ') && k.startsWith(brand + ' . ')) {
        // Dot-subtotal key: BRAND . MODEL aggregate
        const matchingTerms = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (matchingTerms.length) {
          total += ((v as number) || 0)
          matchingTerms.forEach(t => coveredByDot.add(t.toUpperCase()))
        }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand || k.includes(' . ')) return
      // Flat format: raw model names (Nacional and v16 provincial flat keys)
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const matchingTerms = terms.filter((t: string) =>
          k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase())
        )
        if (matchingTerms.length) total += ((v as number) || 0)
      }
    })
    return total
  }

  const filteredBrands = useMemo(() => {
    return Object.keys(activeFilters).filter(b => activeFilters[b]?.length > 0)
      .map(b => ({ brand: b, v26: getFilteredTotal(b, '2026'), v25: getFilteredTotal(b, '2025'), v24: getFilteredTotal(b, '2024') }))
      .filter(x => x.v26 > 0).sort((a, b) => b.v26 - a.v26)
  }, [scope, rows, sub])

  const top10 = filteredBrands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => b.v26), 1)
  const fordEntry = filteredBrands.find(b => b.brand === 'FORD')
  const fordIn = top10.some(b => b.brand === 'FORD')
  const fordPos = filteredBrands.findIndex(b => b.brand === 'FORD') + 1
  const getModelNames = (brand: string) => (activeFilters[brand] || []).filter((t: string) => t.length > 0).map((t: string) => t.replace(/-/g, ' ').toUpperCase())

  // Province chart
  // Province chart — sum only filtered models per province
  const getProvFilteredTotal = (p: string, yr: string) => {
    const fp = activePM[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    Object.keys(activeFilters).forEach(brand => {
      const terms = activeFilters[brand] || []
      if (!terms.length) return
      Object.entries(row).forEach(([k, v]) => {
        if (k === 'year' || k === brand) return
        if (k.startsWith(brand + ' . ') && terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) {
          total += ((v as number) || 0)
        } else if (!k.includes(' . ') && k !== brand) {
          // Flat format (v16): no brand prefix — check all model keys under this brand
          // Only count keys that appear after the brand total in the row
          // Use brand total as gate: only count if brand has volume
          const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
          if (!isBrandKey && row[brand] && terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) {
            total += ((v as number) || 0)
          }
        }
      })
    })
    return total
  }
  const getProvFordTotal = (p: string, yr: string) => {
    const terms = activeFilters['FORD'] || []
    if (!terms.length) return 0
    const fp = activePM[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k.includes(' . ') && k.startsWith('FORD . ')) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (mt.length) { total += ((v as number) || 0); mt.forEach(t => coveredByDot.add(t.toUpperCase())) }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === 'FORD' || k.includes(' . ') || !v) return
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase()))
        if (mt.length) total += ((v as number) || 0)
      }
    })
    return total
  }

  const provChartData = PROVS.map(p => {
    const v26 = getProvFilteredTotal(p, '2026')
    const v25 = getProvFilteredTotal(p, '2025')
    const f26 = getProvFordTotal(p, '2026')
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const ms = v26 ? (f26 / v26 * 100).toFixed(1) : '0'
    return { prov: pn(p), '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': f26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`, ms }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  // Line chart
  const top5 = filteredBrands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b.brand)] = getFilteredTotal(b.brand, yr) })
    if (!top5.some(b => b.brand === 'FORD') && fordEntry) obj['FORD'] = getFilteredTotal('FORD', yr)
    return obj
  })
  const lineKeys = [...top5.map(b => shortName(b.brand)), ...(!top5.some(b => b.brand === 'FORD') && fordEntry ? ['FORD'] : [])]
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  // Everest/Explorer values for cards — use filtered totals
  const getCardFordVal = (nacData: any[], filterSet: any, yr: string) => {
    const row = nacData.find((r: any) => r.year === yr) || {} as any
    const terms = filterSet['FORD'] || []
    let total = 0
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === 'FORD' || k.includes(' . ')) return
      if (terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) total += ((v as number) || 0)
    })
    return total
  }
  const everestV26 = getCardFordVal(n55, filters55, '2026')
  const everestV25 = getCardFordVal(n55, filters55, '2025')
  const explorerV26 = getCardFordVal(n60, filters60, '2026')
  const explorerV25 = getCardFordVal(n60, filters60, '2025')

  return <>
    <Hd tag="SUV 55-80K" title="Análisis de marcas · Rango $55K-$80K" />
    <Ins items={['Everest sube a #3 con +82% de crecimiento. Explorer Active se mantiene estable', 'Ambos modelos consolidan la presencia de Ford en el rango medio-alto']} />

    <div style={gr(2)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/everest.png" alt="Everest" style={{ height: 80, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Everest Active</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$69,990</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(everestV26)}</div>
            <div style={{ fontSize: 10, color: C.sub }}>un. YTD</div>
          </div>
          <Dl a={everestV26} b={everestV25} />
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/exploreractive.png" alt="Explorer" style={{ height: 80, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Explorer Active</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$79,990</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(explorerV26)}</div>
            <div style={{ fontSize: 10, color: C.sub }}>un. YTD</div>
          </div>
          <Dl a={explorerV26} b={explorerV25} />
        </div>
      </Card>
    </div>

    {/* Everest / Explorer sub-tabs */}
    <SubTab tabs={[{ id: 'everest', label: 'Everest' }, { id: 'explorer', label: 'Explorer Active' }]} active={sub} onChange={(id) => { setSub(id); setScope('NACIONAL') }} />

    {/* Province chart */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>SUV 55-80K · {sub === 'everest' ? 'Everest' : 'Explorer'} · Zona Orgu · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={gr(4)}>
        {provChartData.map((r: any) => <div key={r.prov} style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{r.prov}</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>MS Ford: {r.ms}%</div>
        </div>)}
      </div>
    </Card>

    {/* Scope selector for ranking */}
    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* BBC */}
    {(() => {
      const BRAND_COLORS: Record<string, string> = { 'FORD': C.navy, 'TOYOTA': '#EB0A1E', 'MAZDA': '#E87722', 'KIA': '#BB162B', 'NISSAN': '#1A1A1A', 'HYUNDAI': '#00287A', 'SUZUKI': '#005BAC', 'SUBARU': '#013B7C', 'PEUGEOT': '#1E3A5F', 'JETOUR': '#2E8B57', 'MITSUBISHI': '#CC0000', 'HONDA': '#CC0000', 'AUDI': '#333', 'CHEVROLET': '#D4A500', 'JEEP': '#4A6741', 'RAM': '#1A1A1A', 'GMC': '#CC0000', 'BMW': '#1C69D4', 'MERCEDES BENZ': '#333' }
      const pk = sub === 'everest' ? 'SUV  55 - 80 everest' : 'SUV  55 - 80 explorer'
      const fm = sub === 'everest' ? 'Everest' : 'Explorer Active'
      const fp = sub === 'everest' ? 69990 : 89990
      const prices = (d.precios_competidores?.[pk] || []) as any[]
      const fordModels = [{ name: fm, price: fp, vol: fordEntry?.v26 || 0 }]
      const bbcBrands = filteredBrands.map(b => {
        if (b.brand === 'FORD') return { brand: 'FORD', models: fordModels, totalVol: b.v26, ms: 0, color: BRAND_COLORS['FORD'] }
        const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === b.brand)
        const models = bPrices.filter((p: any) => p.precio).map((p: any) => {
          const trimKey = `${p.modelo} ${p.trim || ''}`.trim().toUpperCase()
          const price = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/[^0-9.]/g, '')) || 0
          // Match trim to actual volume — flexible word matching
          const row = rows.find((r: any) => r.year === '2026') || {} as any
          let vol = 0
          Object.entries(row).forEach(([k, v]) => {
            if (k === 'year' || k === b.brand) return
            let matchKey = k
            if (k.includes(' . ')) {
              if (!k.startsWith(b.brand + ' . ')) return  // different brand subtotal
              // Strip to leaf model name
              const parts = k.split(' . ')
              const leaf = parts[parts.length - 1]
              if (!leaf.includes(' ')) return  // single-word = subtotal, skip
              matchKey = leaf
            }
            const K_STRIP = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','EV','2.0','1.5','1.3','1.6','2.5','3.0','3.5','2.4','2.8','2.2','1.4','1.2','2.3','2.7','3.5','4.0','4.4','5.3','5.8','CVT','TA','TM','6DCT','DCT','BA6','16E','FHEV','ATK','NX4E','BOOSTERJET','EPOWER','NEW','IRG','MX5','DMI','PHEV','FJNACG','F3NA6Y','SPORTBACK','LAREDO','BIGHORN','ETORQUE','FLAGSHIP','TRAILBOSS'])
            const T_STRIP = new Set(['4X2','4X4','CD','DIESEL','HYBRID','CVT','4.0','2.7','2.3','3.5','3.6','5.3','5.8','4.4','2.0','1.5','1.6','2.5','2.4','2.8','1.4','1.3','1.2'])
            const normW = (w:string) => { const m=w.match(/^(\d{3,})[A-Z]$/); return m?m[1]:w }
            const kWords = matchKey.toUpperCase().replace(/-/g,'').split(' ').filter((w:string)=>w&&!K_STRIP.has(w)).map(normW)
            const tWords = trimKey.replace(/-/g,'').split(' ').filter((w:string)=>w&&!T_STRIP.has(w))
            if (!tWords.length) return
            const kPhrase = ' ' + kWords.join(' ') + ' '
            const tPhrase = ' ' + tWords.join(' ') + ' '
            if (kPhrase.includes(tPhrase)) vol += ((v as number) || 0)
          })
          return { name: `${p.modelo} ${p.trim || ''}`.trim(), price, vol }
        })
        return { brand: shortName(b.brand), models, totalVol: b.v26, ms: 0, color: BRAND_COLORS[b.brand] || '#666' }
      }).filter(b => b.totalVol > 0)
      // Scale bubble vols to match totalVol (prevents double-count from subtotal keys)
      bbcBrands.forEach(b => {
        const matchedTotal = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedTotal > 0 && matchedTotal !== b.totalVol) {
          const scale = b.totalVol / matchedTotal
          b.models.forEach(m => { m.vol = Math.round(m.vol * scale) })
        }
      })
      // Brands with volume but no price — place at range average with negative price flag
      const allPricesInBBC = bbcBrands.flatMap(b => b.models.filter(m => m.price > 0).map(m => m.price))
      const avgPrice = allPricesInBBC.length ? allPricesInBBC.reduce((s: number, p: number) => s + p, 0) / allPricesInBBC.length : 0
      bbcBrands.forEach(b => { b.models.forEach(m => { if (m.price === 0 && m.vol > 0 && avgPrice > 0) m.price = -avgPrice }) })
      // Add fallback bubble for brands with volume but no matching price trims
      bbcBrands.forEach(b => {
        const matchedVol = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedVol === 0 && b.totalVol > 0) {
          const allP = bbcBrands.flatMap(x => x.models.filter(m => m.price > 0).map(m => m.price))
          const avg = allP.length ? allP.reduce((s: number, p: number) => s + p, 0) / allP.length : 0
          if (avg > 0) b.models.push({ name: b.brand, price: avg, vol: b.totalVol, noPrice: true })
        }
      })
      const totalSeg = bbcBrands.reduce((s: number, x: any) => s + x.totalVol, 0)
      bbcBrands.forEach(b => { b.ms = totalSeg ? (b.totalVol / totalSeg * 100) : 0 })
      bbcBrands.sort((a, b) => a.brand === 'FORD' ? -1 : b.brand === 'FORD' ? 1 : b.totalVol - a.totalVol)
      return <BBC brands={bbcBrands} scopeLabel={scopeLabel} />
    })()}

    {/* Ranking */}
    <Card s={{ marginBottom: 16 }}>
      <Lbl>Top marcas · {sub === 'everest' ? 'Everest' : 'Explorer'} · {scopeLabel} · YTD 2026 vs YTD 2025</Lbl>
      {top10.map((b, i) => <RankBar key={b.brand + scope + sub} rank={i + 1} name={b.brand} val={b.v26} max={maxV} ford={b.brand === 'FORD'} v25={b.v25} models={getModelNames(b.brand).map(m => ({ n: b.brand + ' · ' + m, v: b.v26 }))} />)}
      {!fordIn && fordEntry && fordEntry.v26 > 0 && <>
        <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
        </div>
        <RankBar rank={fordPos} name="FORD" val={fordEntry.v26} max={maxV} ford v25={fordEntry.v25} models={getModelNames('FORD').map(m => ({ n: 'FORD · ' + m, v: fordEntry.v26 }))} />
      </>}
    </Card>
  </>
}

function T8({ d }: { d: any }) {
  const [sub, setSub] = useState('expedition')
  const [scope, setScope] = useState('NACIONAL')
  const nacRows80 = d.suv_80plus?.NACIONAL || []
  const nacRows60 = d.suv_60_80?.NACIONAL || []
  const provMarcas80 = d.suv_80plus?.prov_marcas || {}
  const provMarcas60 = d.suv_60_80?.prov_marcas || {}
  const filtersExp = d.model_filters?.suv_80plus_expedition || {}
  const filtersBr = d.model_filters?.suv_80plus_bronco || {}
  const filtersEP = d.model_filters?.suv_80plus_explorer_plat || {}
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const activeFilters = sub === 'expedition' ? filtersExp : sub === 'bronco' ? filtersBr : filtersEP
  // Explorer Platinum needs combined data from both sheets
  const isEP = sub === 'explorer_plat'

  // Merge two row arrays by summing values per key per year
  const mergeRows = (rows1: any[], rows2: any[]) => {
    return ['2024', '2025', '2026'].map(yr => {
      const r1 = rows1.find((r: any) => r.year === yr) || {} as any
      const r2 = rows2.find((r: any) => r.year === yr) || {} as any
      const merged: any = { year: yr }
      const allKeys = new Set([...Object.keys(r1), ...Object.keys(r2)])
      allKeys.forEach(k => { if (k !== 'year') merged[k] = (r1[k] || 0) + (r2[k] || 0) || null })
      return merged
    })
  }

  const getNacRows = () => isEP ? mergeRows(nacRows60, nacRows80) : nacRows80
  const getProvMarcas = () => {
    if (!isEP) return provMarcas80
    const merged: Record<string, any[]> = {}
    PROVS.forEach(p => { merged[p] = mergeRows(provMarcas60[p] || [], provMarcas80[p] || []) })
    return merged
  }

  const activeNac = getNacRows()
  const activePM = getProvMarcas()

  const getRawRows = () => {
    if (scope === 'NACIONAL') return activeNac
    if (scope === 'ZONA ORGU') {
      const allPD = PROVS.map(p => activePM[p] || [])
      if (!allPD.length || !allPD[0].length) return activeNac
      return ['2024', '2025', '2026'].map(yr => {
        const m: any = { year: yr }
        allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
        Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
        return m
      })
    }
    return activePM[scope] || []
  }

  const rows = getRawRows()

  const getFilteredTotal = (brand: string, yr: string) => {
    const terms = activeFilters[brand] || []
    if (!terms.length) return 0
    const row = rows.find((r: any) => r.year === yr) || {} as any
    let total = 0
    // Track covered terms to avoid double-count with dot subtotals
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand) return
      if (k.includes(' . ') && k.startsWith(brand + ' . ')) {
        const matchingTerms = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (matchingTerms.length) {
          total += ((v as number) || 0)
          matchingTerms.forEach(t => coveredByDot.add(t.toUpperCase()))
        }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand || k.includes(' . ')) return
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const matchingTerms = terms.filter((t: string) =>
          k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase())
        )
        if (matchingTerms.length) total += ((v as number) || 0)
      }
    })
    return total
  }

  const filteredBrands = useMemo(() => {
    return Object.keys(activeFilters).filter(b => activeFilters[b]?.length > 0)
      .map(b => ({ brand: b, v26: getFilteredTotal(b, '2026'), v25: getFilteredTotal(b, '2025') }))
      .filter(x => x.v26 > 0).sort((a, b) => b.v26 - a.v26)
  }, [scope, rows, sub])

  const top10 = filteredBrands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => b.v26), 1)
  const fordEntry = filteredBrands.find(b => b.brand === 'FORD')
  const fordIn = top10.some(b => b.brand === 'FORD')
  const fordPos = filteredBrands.findIndex(b => b.brand === 'FORD') + 1
  const getModelNames = (brand: string) => (activeFilters[brand] || []).filter((t: string) => t.length > 0).map((t: string) => t.replace(/-/g, ' ').toUpperCase())

  // Province chart with filtered totals
  const getProvFilteredTotal = (p: string, yr: string) => {
    const fp = activePM[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    Object.keys(activeFilters).forEach(brand => {
      const terms = activeFilters[brand] || []
      if (!terms.length) return
      Object.entries(row).forEach(([k, v]) => {
        if (k === 'year' || k === brand) return
        if (k.startsWith(brand + ' . ') && terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) {
          total += ((v as number) || 0)
        } else if (!k.includes(' . ') && k !== brand) {
          const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
          if (!isBrandKey && row[brand] && terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) {
            total += ((v as number) || 0)
          }
        }
      })
    })
    return total
  }
  const getProvFordTotal = (p: string, yr: string) => {
    const terms = activeFilters['FORD'] || []
    if (!terms.length) return 0
    const fp = activePM[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k.includes(' . ') && k.startsWith('FORD . ')) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (mt.length) { total += ((v as number) || 0); mt.forEach(t => coveredByDot.add(t.toUpperCase())) }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === 'FORD' || k.includes(' . ') || !v) return
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase()))
        if (mt.length) total += ((v as number) || 0)
      }
    })
    return total
  }
  const provChartData = PROVS.map(p => {
    const v26 = getProvFilteredTotal(p, '2026')
    const v25 = getProvFilteredTotal(p, '2025')
    const f26 = getProvFordTotal(p, '2026')
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const ms = v26 ? (f26 / v26 * 100).toFixed(1) : '0'
    return { prov: pn(p), '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': f26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`, ms }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  // Line chart
  const top5 = filteredBrands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b.brand)] = getFilteredTotal(b.brand, yr) })
    if (!top5.some(b => b.brand === 'FORD') && fordEntry) obj['FORD'] = getFilteredTotal('FORD', yr)
    return obj
  })
  const lineKeys = [...top5.map(b => shortName(b.brand)), ...(!top5.some(b => b.brand === 'FORD') && fordEntry ? ['FORD'] : [])]
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  // Ford card values
  const getCardFordVal = (filterKey: string, yr: string) => {
    const flt = d.model_filters?.[filterKey] || {}
    const terms = flt['FORD'] || []
    // For Explorer Plat, combine both sheets
    const sources = filterKey === 'suv_80plus_explorer_plat' ? [nacRows60, nacRows80] : [nacRows80]
    let total = 0
    sources.forEach(src => {
      const r = src.find((x: any) => x.year === yr) || {} as any
      Object.entries(r).forEach(([k, v]) => { if (k !== 'year' && k !== 'FORD' && !k.includes(' . ') && terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) total += ((v as number) || 0) })
    })
    return total
  }

  const subLabel = sub === 'expedition' ? 'Expedition' : sub === 'bronco' ? 'Bronco' : 'Explorer Platinum'

  return <>
    <Hd tag="SUV +80K" title="Análisis de marcas · Rango +$80K" />
    <Ins items={['Segmento premium de bajo volumen pero alto margen', 'Expedition, Bronco y Explorer Platinum posicionan a Ford en el tope del mercado']} />

    <div style={gr(3)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <img src="/images/expeditionplatinum.png" alt="Expedition" style={{ height: 60, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Expedition</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>$129,990</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.navy }}>{N(getCardFordVal('suv_80plus_expedition', '2026'))}</div>
          <div style={{ fontSize: 9, color: C.sub }}>un. YTD</div>
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <img src="/images/bronco.png" alt="Bronco" style={{ height: 60, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Bronco</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>$119,990</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.navy }}>{N(getCardFordVal('suv_80plus_bronco', '2026'))}</div>
          <div style={{ fontSize: 9, color: C.sub }}>un. YTD</div>
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <img src="/images/explorerplatinum.png" alt="Explorer Platinum" style={{ height: 60, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Explorer Platinum</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>$94,990</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.navy }}>{N(getCardFordVal('suv_80plus_explorer_plat', '2026'))}</div>
          <div style={{ fontSize: 9, color: C.sub }}>un. YTD</div>
        </div>
      </Card>
    </div>

    <SubTab tabs={[{ id: 'expedition', label: 'Expedition' }, { id: 'bronco', label: 'Bronco' }, { id: 'explorer_plat', label: 'Explorer Platinum' }]} active={sub} onChange={(id) => { setSub(id); setScope('NACIONAL') }} />

    {/* Province chart */}
    <Card s={{ marginBottom: 20 }}>
      <Lbl>SUV +80K · {subLabel} · Zona Orgu · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={gr(4)}>
        {provChartData.map((r: any) => <div key={r.prov} style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{r.prov}</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>MS Ford: {r.ms}%</div>
        </div>)}
      </div>
    </Card>

    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* BBC */}

    {(() => {
      const BRAND_COLORS: Record<string, string> = { 'FORD': C.navy, 'TOYOTA': '#EB0A1E', 'MAZDA': '#E87722', 'KIA': '#BB162B', 'NISSAN': '#1A1A1A', 'HYUNDAI': '#00287A', 'SUZUKI': '#005BAC', 'SUBARU': '#013B7C', 'PEUGEOT': '#1E3A5F', 'JETOUR': '#2E8B57', 'MITSUBISHI': '#CC0000', 'HONDA': '#CC0000', 'AUDI': '#333', 'CHEVROLET': '#D4A500', 'JEEP': '#4A6741', 'RAM': '#1A1A1A', 'GMC': '#CC0000', 'BMW': '#1C69D4', 'MERCEDES BENZ': '#333' }
      const pkMap: Record<string,string> = { 'expedition': 'SUV  80 plus expedition', 'bronco': '', 'explorer_plat': 'SUV  80 plus explorer' }
      const fmMap: Record<string,string> = { 'expedition': 'Expedition', 'bronco': 'Bronco', 'explorer_plat': 'Explorer Platinum' }
      const fpMap: Record<string,number> = { 'expedition': 139990, 'bronco': 119990, 'explorer_plat': 98990 }
      const pk = pkMap[sub] || ''
      if (!pk) return null
      const prices = (d.precios_competidores?.[pk] || []) as any[]
      const fordModels = [{ name: fmMap[sub], price: fpMap[sub], vol: fordEntry?.v26 || 0 }]
      const bbcBrands = filteredBrands.map(b => {
        if (b.brand === 'FORD') return { brand: 'FORD', models: fordModels, totalVol: b.v26, ms: 0, color: BRAND_COLORS['FORD'] }
        const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === b.brand)
        const models = bPrices.filter((p: any) => p.precio).map((p: any) => {
          const trimKey = `${p.modelo} ${p.trim || ''}`.trim().toUpperCase()
          const price = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/[^0-9.]/g, '')) || 0
          // Match trim to actual volume — flexible word matching
          const row = rows.find((r: any) => r.year === '2026') || {} as any
          let vol = 0
          Object.entries(row).forEach(([k, v]) => {
            if (k === 'year' || k === b.brand) return
            let matchKey = k
            if (k.includes(' . ')) {
              if (!k.startsWith(b.brand + ' . ')) return  // different brand subtotal
              // Strip to leaf model name
              const parts = k.split(' . ')
              const leaf = parts[parts.length - 1]
              if (!leaf.includes(' ')) return  // single-word = subtotal, skip
              matchKey = leaf
            }
            const K_STRIP = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','EV','2.0','1.5','1.3','1.6','2.5','3.0','3.5','2.4','2.8','2.2','1.4','1.2','2.3','2.7','3.5','4.0','4.4','5.3','5.8','CVT','TA','TM','6DCT','DCT','BA6','16E','FHEV','ATK','NX4E','BOOSTERJET','EPOWER','NEW','IRG','MX5','DMI','PHEV','FJNACG','F3NA6Y','SPORTBACK','LAREDO','BIGHORN','ETORQUE','FLAGSHIP','TRAILBOSS'])
            const T_STRIP = new Set(['4X2','4X4','CD','DIESEL','HYBRID','CVT','4.0','2.7','2.3','3.5','3.6','5.3','5.8','4.4','2.0','1.5','1.6','2.5','2.4','2.8','1.4','1.3','1.2'])
            const normW = (w:string) => { const m=w.match(/^(\d{3,})[A-Z]$/); return m?m[1]:w }
            const kWords = matchKey.toUpperCase().replace(/-/g,'').split(' ').filter((w:string)=>w&&!K_STRIP.has(w)).map(normW)
            const tWords = trimKey.replace(/-/g,'').split(' ').filter((w:string)=>w&&!T_STRIP.has(w))
            if (!tWords.length) return
            const kPhrase = ' ' + kWords.join(' ') + ' '
            const tPhrase = ' ' + tWords.join(' ') + ' '
            if (kPhrase.includes(tPhrase)) vol += ((v as number) || 0)
          })
          return { name: `${p.modelo} ${p.trim || ''}`.trim(), price, vol }
        })
        return { brand: shortName(b.brand), models, totalVol: b.v26, ms: 0, color: BRAND_COLORS[b.brand] || '#666' }
      }).filter(b => b.totalVol > 0)
      // Scale bubble vols to match totalVol (prevents double-count from subtotal keys)
      bbcBrands.forEach(b => {
        const matchedTotal = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedTotal > 0 && matchedTotal !== b.totalVol) {
          const scale = b.totalVol / matchedTotal
          b.models.forEach(m => { m.vol = Math.round(m.vol * scale) })
        }
      })
      // Brands with volume but no price — place at range average with negative price flag
      const allPricesInBBC = bbcBrands.flatMap(b => b.models.filter(m => m.price > 0).map(m => m.price))
      const avgPrice = allPricesInBBC.length ? allPricesInBBC.reduce((s: number, p: number) => s + p, 0) / allPricesInBBC.length : 0
      bbcBrands.forEach(b => { b.models.forEach(m => { if (m.price === 0 && m.vol > 0 && avgPrice > 0) m.price = -avgPrice }) })
      // Add fallback bubble for brands with volume but no matching price trims
      bbcBrands.forEach(b => {
        const matchedVol = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedVol === 0 && b.totalVol > 0) {
          const allP = bbcBrands.flatMap(x => x.models.filter(m => m.price > 0).map(m => m.price))
          const avg = allP.length ? allP.reduce((s: number, p: number) => s + p, 0) / allP.length : 0
          if (avg > 0) b.models.push({ name: b.brand, price: avg, vol: b.totalVol, noPrice: true })
        }
      })
      const totalSeg = bbcBrands.reduce((s: number, x: any) => s + x.totalVol, 0)
      bbcBrands.forEach(b => { b.ms = totalSeg ? (b.totalVol / totalSeg * 100) : 0 })
      bbcBrands.sort((a, b) => a.brand === 'FORD' ? -1 : b.brand === 'FORD' ? 1 : b.totalVol - a.totalVol)
      return <BBC brands={bbcBrands} scopeLabel={scopeLabel} />
    })()}

    <Card s={{ marginBottom: 16 }}>
      <Lbl>Top marcas · {subLabel} · {scopeLabel} · YTD 2026 vs YTD 2025</Lbl>
      {top10.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: C.mut, fontSize: 13 }}>No hay matriculación al 2026 YTD en este segmento</div>}
      {top10.map((b, i) => <RankBar key={b.brand + scope + sub} rank={i + 1} name={b.brand} val={b.v26} max={maxV} ford={b.brand === 'FORD'} v25={b.v25} models={getModelNames(b.brand).map(m => ({ n: b.brand + ' · ' + m, v: b.v26 }))} />)}
      {!fordIn && fordEntry && fordEntry.v26 > 0 && <>
        <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
        </div>
        <RankBar rank={fordPos} name="FORD" val={fordEntry.v26} max={maxV} ford v25={fordEntry.v25} models={getModelNames('FORD').map(m => ({ n: 'FORD · ' + m, v: fordEntry.v26 }))} />
      </>}
    </Card>
  </>
}

function T9({ d }: { d: any }) {
  const [scope, setScope] = useState('NACIONAL')
  const segsNac = (d.pickup_cat_nacional || []).filter((s: any) => s.seg !== 'Total general')
  const segsOrgu = (d.pickup_cat_ytd || []).filter((s: any) => s.seg !== 'Total general')
  const segProv = d.pu_cat_por_prov || []
  const fordCatProv = d.ford_cat_por_prov || []

  // Ford pickup by segment (derived from pick_diesel and pick_fullsize)
  const fordDiesel = d.pick_diesel?.FORD || []
  const fordFullsize = d.pick_fullsize?.FORD || []
  const getFordSeg = (seg: string, sc: string) => {
    const dieselPM = d.pick_diesel?.prov_marcas || {}
    const fullPM = d.pick_fullsize?.prov_marcas || {}
    const getVal = (pm: any, nacRows: any[], yr: string) => {
      if (sc === 'NACIONAL') {
        const r = nacRows.find((x: any) => x.year === yr) || {} as any
        return r['FORD'] || 0
      }
      const tgt = sc === 'ZONA ORGU' ? PROVS : [sc]
      let total = 0
      tgt.forEach(p => {
        const fp = pm[p] || []
        const r = fp.find((x: any) => x.year === yr) || {} as any
        total += (r['FORD'] || 0)
      })
      return total
    }
    if (seg === 'MID SIZE PICK UPS') return { f26: getVal(dieselPM, fordDiesel, '2026'), f25: getVal(dieselPM, fordDiesel, '2025') }
    if (seg === 'FULL SIZE PICK UPS') return { f26: getVal(fullPM, fordFullsize, '2026'), f25: getVal(fullPM, fordFullsize, '2025') }
    return { f26: 0, f25: 0 }
  }

  // Parse provincial segments
  const segGroups = useMemo(() => {
    const g: Record<string, any[]> = {}; let cs = ''
    segProv.forEach((r: any) => {
      if (PROVS.includes(r.label)) { if (cs) g[cs] = [...(g[cs]||[]), r]; cs = '' }
      else if (!['Total general'].includes(r.label)) { cs = r.label; if (!g[cs]) g[cs] = [] }
    })
    // Fix: segProv has province as parent, segments as children
    const g2: Record<string, any[]> = {}
    let cp = ''
    segProv.forEach((r: any) => {
      if (PROVS.includes(r.label)) { cp = r.label }
      else if (cp && r.label !== 'Total general') {
        if (!g2[r.label]) g2[r.label] = []
        g2[r.label].push({ label: cp, ytd2024: r.ytd2024, ytd2025: r.ytd2025, ytd2026: r.ytd2026 })
      }
    })
    return g2
  }, [segProv])

  // Get segments based on scope
  const getSegs = () => {
    if (scope === 'NACIONAL') return segsNac.map(s => ({ seg: s.seg, y2024: s.ytd2024, y2025: s.ytd2025, y2026: s.ytd2026 }))
    if (scope === 'ZONA ORGU') return segsOrgu.map(s => ({ seg: s.seg, y2024: s.ytd2024, y2025: s.ytd2025, y2026: s.ytd2026 }))
    return Object.entries(segGroups).map(([seg, pds]) => {
      const prov = pds.find((p: any) => p.label === scope)
      return { seg, y2024: prov?.ytd2024 || 0, y2025: prov?.ytd2025 || 0, y2026: prov?.ytd2026 || 0 }
    })
  }
  const segs = getSegs()
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)

  const chartData = segs.map(s => {
    const pct = s.y2025 ? ((s.y2026 - s.y2025) / s.y2025 * 100).toFixed(1) : '0'
    const { f26 } = getFordSeg(s.seg, scope)
    return { seg: s.seg.replace(' PICK UPS', ''), '2024 YTD': s.y2024, '2025 YTD': s.y2025, '2026 YTD': s.y2026, 'Ford 2026': f26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%` }
  })
  const DL = (props: any) => { const { x, y, width, index } = props; if (!chartData[index]) return null; const dd = chartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  return <>
    <Hd tag="PickUp Segmentos" title="El mercado Pickup segmento a segmento" />
    <Ins items={['Mid Size concentra el 93% del volumen Pickup', 'Ford compite en Mid Size con Ranger y en Full Size con F-150']} />

    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    <div style={gr(3)}>
      {segs.map(s => {
        const delta = s.y2025 ? ((s.y2026 - s.y2025) / s.y2025 * 100).toFixed(1) : '0'
        const u = parseFloat(delta) >= 0
        const { f26, f25 } = getFordSeg(s.seg, scope)
        const ms26 = s.y2026 ? (f26 / s.y2026 * 100).toFixed(1) : '0'
        const ms25 = s.y2025 ? (f25 / s.y2025 * 100).toFixed(1) : '0'
        return <Card key={s.seg} s={{ borderLeft: `4px solid ${C.ac}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.mut, marginBottom: 8 }}>{s.seg.replace(' PICK UPS', '')}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.txt, lineHeight: 1 }}>{N(s.y2026)}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>2025 YTD: {N(s.y2025)}</div>
          <div style={{ marginTop: 8 }}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: u ? C.upB : C.dnB, color: u ? C.up : C.dn }}>{u ? '↑' : '↓'} {Math.abs(parseFloat(delta)).toFixed(1)}% vs {N(s.y2025)} un.</span></div>
          {f26 > 0 && <div style={{ marginTop: 8, padding: '6px 10px', background: C.acB, borderRadius: 8, fontSize: 10 }}>
            <div><span style={{ fontWeight: 700, color: C.navy }}>Ford: {N(f26)}</span> · <span style={{ color: C.ac }}>MS {ms26}%</span></div>
            <div style={{ marginTop: 2, color: C.sub }}>vs MS {ms25}% en 2025 {parseFloat(ms26) > parseFloat(ms25) ? <span style={{ color: C.up, fontWeight: 600 }}>↑</span> : parseFloat(ms26) < parseFloat(ms25) ? <span style={{ color: C.dn, fontWeight: 600 }}>↓</span> : null}</div>
          </div>}
        </Card>
      })}
    </div>

    <Card s={{ marginBottom: 20 }}>
      <Lbl>Evolución por segmento · {scopeLabel} · YTD comparable</Lbl>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={20} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="seg" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2024 YTD" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2025 YTD" fill={C.steel} radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<DL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </>
}

function T10({ d }: { d: any }) {
  const [sub, setSub] = useState('xl')
  const [scope, setScope] = useState('NACIONAL')
  const nacTM = d.pick_diesel_tm?.NACIONAL || []
  const nacTA = d.pick_diesel_ta?.NACIONAL || []
  const pmTM = d.pick_diesel_tm?.prov_marcas || {}
  const pmTA = d.pick_diesel_ta?.prov_marcas || {}
  const filtersTM = d.model_filters?.pu_diesel_ranger_xl || {}
  const filtersTA = d.model_filters?.pu_diesel_ranger_xlt || {}
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const activeNac = sub === 'xl' ? nacTM : nacTA
  const activePM = sub === 'xl' ? pmTM : pmTA
  const activeFilters = sub === 'xl' ? filtersTM : filtersTA

  const getRawRows = () => {
    if (scope === 'NACIONAL') return activeNac
    if (scope === 'ZONA ORGU') {
      const allPD = PROVS.map(p => activePM[p] || [])
      if (!allPD.length || !allPD[0].length) return activeNac
      return ['2024', '2025', '2026'].map(yr => {
        const m: any = { year: yr }
        allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
        Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
        return m
      })
    }
    return activePM[scope] || []
  }

  const rows = getRawRows()

  const getFilteredTotal = (brand: string, yr: string) => {
    const terms = activeFilters[brand] || []
    if (!terms.length) return 0
    const row = rows.find((r: any) => r.year === yr) || {} as any
    let total = 0
    // Track covered terms to avoid double-count with dot subtotals
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand) return
      if (k.includes(' . ') && k.startsWith(brand + ' . ')) {
        const matchingTerms = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (matchingTerms.length) {
          total += ((v as number) || 0)
          matchingTerms.forEach(t => coveredByDot.add(t.toUpperCase()))
        }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand || k.includes(' . ')) return
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const matchingTerms = terms.filter((t: string) =>
          k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase())
        )
        if (matchingTerms.length) total += ((v as number) || 0)
      }
    })
    return total
  }

  const filteredBrands = useMemo(() => {
    return Object.keys(activeFilters).filter(b => activeFilters[b]?.length > 0)
      .map(b => ({ brand: b, v26: getFilteredTotal(b, '2026'), v25: getFilteredTotal(b, '2025') }))
      .filter(x => x.v26 > 0).sort((a, b) => b.v26 - a.v26)
  }, [scope, rows, sub])

  const top10 = filteredBrands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => b.v26), 1)
  const fordEntry = filteredBrands.find(b => b.brand === 'FORD')
  const fordIn = top10.some(b => b.brand === 'FORD')
  const fordPos = filteredBrands.findIndex(b => b.brand === 'FORD') + 1
  const displayNamesXL: Record<string,string> = { 'FORD': 'Ranger XL', 'CHEVROLET': 'Colorado LT', 'TOYOTA': 'Hilux 2.4 TM', 'MAZDA': 'BT-50 TM', 'NISSAN': 'Frontier', 'KIA': 'Tasman TM' }
  const displayNamesXLT: Record<string,string> = { 'FORD': 'Ranger XLT', 'CHEVROLET': 'Colorado', 'TOYOTA': 'Hilux 2.8 TA', 'MAZDA': 'BT-50 TA', 'NISSAN': 'Frontier', 'KIA': 'Tasman TA', 'ISUZU': 'Pickup RBD Plus', 'MITSUBISHI': 'Triton GLS' }
  const displayNames = sub === 'xl' ? displayNamesXL : displayNamesXLT
  const getModelNames = (brand: string) => {
    const dn = displayNames[brand]
    return dn ? [dn] : []
  }

  // Province chart with filtered totals
  const getProvFilteredTotal = (p: string, yr: string) => {
    const fp = activePM[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    Object.keys(activeFilters).forEach(brand => {
      const terms = activeFilters[brand] || []
      if (!terms.length) return
      Object.entries(row).forEach(([k, v]) => {
        if (k === 'year' || k === brand) return
        if (k.startsWith(brand + ' . ') && terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) {
          total += ((v as number) || 0)
        } else if (!k.includes(' . ') && k !== brand) {
          const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
          if (!isBrandKey && row[brand] && terms.some((t: string) => k.toUpperCase().includes(t.toUpperCase()))) {
            total += ((v as number) || 0)
          }
        }
      })
    })
    return total
  }
  const getProvFordTotal = (p: string, yr: string) => {
    const terms = activeFilters['FORD'] || []
    if (!terms.length) return 0
    const fp = activePM[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k.includes(' . ') && k.startsWith('FORD . ')) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (mt.length) { total += ((v as number) || 0); mt.forEach(t => coveredByDot.add(t.toUpperCase())) }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === 'FORD' || k.includes(' . ') || !v) return
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase()))
        if (mt.length) total += ((v as number) || 0)
      }
    })
    return total
  }
  const provChartData = PROVS.map(p => {
    const v26 = getProvFilteredTotal(p, '2026')
    const v25 = getProvFilteredTotal(p, '2025')
    const f26 = getProvFordTotal(p, '2026')
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const ms = v26 ? (f26 / v26 * 100).toFixed(1) : '0'
    return { prov: pn(p), '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': f26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`, ms }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  // Line chart
  const top5 = filteredBrands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b.brand)] = getFilteredTotal(b.brand, yr) })
    if (!top5.some(b => b.brand === 'FORD') && fordEntry) obj['FORD'] = getFilteredTotal('FORD', yr)
    return obj
  })
  const lineKeys = [...top5.map(b => shortName(b.brand)), ...(!top5.some(b => b.brand === 'FORD') && fordEntry ? ['FORD'] : [])]
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)
  const subLabel = sub === 'xl' ? 'Ranger XL (TM)' : 'Ranger XLT (TA)'

  // Card values
  const xlV26 = (() => { const r = nacTM.find((x: any) => x.year === '2026') || {} as any; return r['FORD'] || 0 })()
  const xlV25 = (() => { const r = nacTM.find((x: any) => x.year === '2025') || {} as any; return r['FORD'] || 0 })()
  const xltV26 = (() => { const r = nacTA.find((x: any) => x.year === '2026') || {} as any; return r['FORD'] || 0 })()
  const xltV25 = (() => { const r = nacTA.find((x: any) => x.year === '2025') || {} as any; return r['FORD'] || 0 })()

  return <>
    <Hd tag="Pick Up Diesel 4x4" title="Análisis de marcas · Ranger XL y XLT" />
    <Ins items={['Ranger XL compite en transmisión manual, Ranger XLT en automática', 'Dos mercados distintos con competidores diferentes']} />

    <div style={gr(2)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/rangerxl.png" alt="Ranger XL" style={{ height: 70, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Ranger XL</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$53,990 · Diesel TM 4x4</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(xlV26)}</div>
            <div style={{ fontSize: 10, color: C.sub }}>un. YTD</div>
          </div>
          <Dl a={xlV26} b={xlV25} />
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/rangerxlt.png" alt="Ranger XLT" style={{ height: 70, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>Ranger XLT</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$67,990 · Diesel TA 4x4</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(xltV26)}</div>
            <div style={{ fontSize: 10, color: C.sub }}>un. YTD</div>
          </div>
          <Dl a={xltV26} b={xltV25} />
        </div>
      </Card>
    </div>

    <SubTab tabs={[{ id: 'xl', label: 'Ranger XL (TM)' }, { id: 'xlt', label: 'Ranger XLT (TA)' }]} active={sub} onChange={(id) => { setSub(id); setScope('NACIONAL') }} />

    <Card s={{ marginBottom: 20 }}>
      <Lbl>PU Diesel · {subLabel} · Zona Orgu · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={gr(4)}>
        {provChartData.map((r: any) => <div key={r.prov} style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{r.prov}</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>MS Ford: {r.ms}%</div>
        </div>)}
      </div>
    </Card>

    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* BBC */}
    {(() => {
      const BRAND_COLORS: Record<string, string> = { 'FORD': C.navy, 'TOYOTA': '#EB0A1E', 'MAZDA': '#E87722', 'KIA': '#BB162B', 'NISSAN': '#1A1A1A', 'HYUNDAI': '#00287A', 'SUZUKI': '#005BAC', 'SUBARU': '#013B7C', 'PEUGEOT': '#1E3A5F', 'JETOUR': '#2E8B57', 'MITSUBISHI': '#CC0000', 'HONDA': '#CC0000', 'AUDI': '#333', 'CHEVROLET': '#D4A500', 'JEEP': '#4A6741', 'RAM': '#1A1A1A', 'GMC': '#CC0000', 'BMW': '#1C69D4', 'MERCEDES BENZ': '#333' }
      const fm = sub === 'xl' ? 'Ranger XL' : 'Ranger XLT'
      const fp = sub === 'xl' ? 53990 : 67990
      const prices = (d.precios_competidores?.[sub === 'xl' ? 'Pick up XL' : 'Pick up XLT'] || []) as any[]
      const fordModels = [{ name: fm, price: fp, vol: fordEntry?.v26 || 0 }]
      const bbcBrands = filteredBrands.map(b => {
        if (b.brand === 'FORD') return { brand: 'FORD', models: fordModels, totalVol: b.v26, ms: 0, color: BRAND_COLORS['FORD'] }
        const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === b.brand)
        const models = bPrices.filter((p: any) => p.precio).map((p: any) => {
          const trimKey = `${p.modelo} ${p.trim || ''}`.trim().toUpperCase()
          const price = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/[^0-9.]/g, '')) || 0
          // Match trim to actual volume — flexible word matching
          const row = rows.find((r: any) => r.year === '2026') || {} as any
          let vol = 0
          Object.entries(row).forEach(([k, v]) => {
            if (k === 'year' || k === b.brand) return
            let matchKey = k
            if (k.includes(' . ')) {
              if (!k.startsWith(b.brand + ' . ')) return  // different brand subtotal
              // Strip to leaf model name
              const parts = k.split(' . ')
              const leaf = parts[parts.length - 1]
              if (!leaf.includes(' ')) return  // single-word = subtotal, skip
              matchKey = leaf
            }
            const K_STRIP = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','EV','2.0','1.5','1.3','1.6','2.5','3.0','3.5','2.4','2.8','2.2','1.4','1.2','2.3','2.7','3.5','4.0','4.4','5.3','5.8','CVT','TA','TM','6DCT','DCT','BA6','16E','FHEV','ATK','NX4E','BOOSTERJET','EPOWER','NEW','IRG','MX5','DMI','PHEV','FJNACG','F3NA6Y','SPORTBACK','LAREDO','BIGHORN','ETORQUE','FLAGSHIP','TRAILBOSS'])
            const T_STRIP = new Set(['4X2','4X4','CD','DIESEL','HYBRID','CVT','4.0','2.7','2.3','3.5','3.6','5.3','5.8','4.4','2.0','1.5','1.6','2.5','2.4','2.8','1.4','1.3','1.2'])
            const normW = (w:string) => { const m=w.match(/^(\d{3,})[A-Z]$/); return m?m[1]:w }
            const kWords = matchKey.toUpperCase().replace(/-/g,'').split(' ').filter((w:string)=>w&&!K_STRIP.has(w)).map(normW)
            const tWords = trimKey.replace(/-/g,'').split(' ').filter((w:string)=>w&&!T_STRIP.has(w))
            if (!tWords.length) return
            const kPhrase = ' ' + kWords.join(' ') + ' '
            const tPhrase = ' ' + tWords.join(' ') + ' '
            if (kPhrase.includes(tPhrase)) vol += ((v as number) || 0)
          })
          return { name: `${p.modelo} ${p.trim || ''}`.trim(), price, vol }
        })
        return { brand: shortName(b.brand), models, totalVol: b.v26, ms: 0, color: BRAND_COLORS[b.brand] || '#666' }
      }).filter(b => b.totalVol > 0)
      // Scale bubble vols to match totalVol (prevents double-count from subtotal keys)
      bbcBrands.forEach(b => {
        const matchedTotal = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedTotal > 0 && matchedTotal !== b.totalVol) {
          const scale = b.totalVol / matchedTotal
          b.models.forEach(m => { m.vol = Math.round(m.vol * scale) })
        }
      })
      // Brands with volume but no price — place at range average with negative price flag
      const allPricesInBBC = bbcBrands.flatMap(b => b.models.filter(m => m.price > 0).map(m => m.price))
      const avgPrice = allPricesInBBC.length ? allPricesInBBC.reduce((s: number, p: number) => s + p, 0) / allPricesInBBC.length : 0
      bbcBrands.forEach(b => { b.models.forEach(m => { if (m.price === 0 && m.vol > 0 && avgPrice > 0) m.price = -avgPrice }) })
      // Add fallback bubble for brands with volume but no matching price trims
      bbcBrands.forEach(b => {
        const matchedVol = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedVol === 0 && b.totalVol > 0) {
          const allP = bbcBrands.flatMap(x => x.models.filter(m => m.price > 0).map(m => m.price))
          const avg = allP.length ? allP.reduce((s: number, p: number) => s + p, 0) / allP.length : 0
          if (avg > 0) b.models.push({ name: b.brand, price: avg, vol: b.totalVol, noPrice: true })
        }
      })
      const totalSeg = bbcBrands.reduce((s: number, x: any) => s + x.totalVol, 0)
      bbcBrands.forEach(b => { b.ms = totalSeg ? (b.totalVol / totalSeg * 100) : 0 })
      bbcBrands.sort((a, b) => a.brand === 'FORD' ? -1 : b.brand === 'FORD' ? 1 : b.totalVol - a.totalVol)
      return <BBC brands={bbcBrands} scopeLabel={scopeLabel} />
    })()}

    <Card s={{ marginBottom: 16 }}>
      <Lbl>Top marcas · {subLabel} · {scopeLabel} · YTD 2026 vs YTD 2025</Lbl>
      {top10.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: C.mut, fontSize: 13 }}>No hay matriculación al 2026 YTD en este segmento</div>}
      {top10.map((b, i) => <RankBar key={b.brand + scope + sub} rank={i + 1} name={b.brand} val={b.v26} max={maxV} ford={b.brand === 'FORD'} v25={b.v25} models={getModelNames(b.brand).map(m => ({ n: b.brand + ' · ' + m, v: b.v26 }))} />)}
      {!fordIn && fordEntry && fordEntry.v26 > 0 && <>
        <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
        </div>
        <RankBar rank={fordPos} name="FORD" val={fordEntry.v26} max={maxV} ford v25={fordEntry.v25} models={getModelNames('FORD').map(m => ({ n: 'FORD · ' + m, v: fordEntry.v26 }))} />
      </>}
    </Card>
  </>
}

function T11({ d }: { d: any }) {
  const [sub, setSub] = useState('xlt')
  const [scope, setScope] = useState('NACIONAL')
  const nacRows = d.pick_fullsize?.NACIONAL || []
  const provMarcas = d.pick_fullsize?.prov_marcas || {}
  const filtersXLT = d.model_filters?.pu_fullsize_f150_xlt || {}
  const filtersLP = d.model_filters?.pu_fullsize_f150_lariat_plat || {}
  const CCOLS = ['#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA', '#65A30D']
  const bCol = (b: string, i: number) => b === 'FORD' ? C.navy : CCOLS[i % CCOLS.length]

  const activeFilters = sub === 'xlt' ? filtersXLT : filtersLP

  const getRawRows = () => {
    if (scope === 'NACIONAL') return nacRows
    if (scope === 'ZONA ORGU') {
      const allPD = PROVS.map(p => provMarcas[p] || [])
      if (!allPD.length || !allPD[0].length) return nacRows
      return ['2024', '2025', '2026'].map(yr => {
        const m: any = { year: yr }
        allPD.forEach(pd => { const row = pd.find((r: any) => r.year === yr) || {}; Object.entries(row).forEach(([k, v]) => { if (k !== 'year') m[k] = (m[k] || 0) + ((v as number) || 0) }) })
        Object.keys(m).forEach(k => { if (k !== 'year' && m[k] === 0) m[k] = null })
        return m
      })
    }
    return provMarcas[scope] || []
  }

  const rows = getRawRows()

  const getFilteredTotal = (brand: string, yr: string) => {
    const terms = activeFilters[brand] || []
    if (!terms.length) return 0
    const row = rows.find((r: any) => r.year === yr) || {} as any
    let total = 0
    // Track covered terms to avoid double-count with dot subtotals
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand) return
      if (k.includes(' . ') && k.startsWith(brand + ' . ')) {
        const matchingTerms = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (matchingTerms.length) {
          total += ((v as number) || 0)
          matchingTerms.forEach(t => coveredByDot.add(t.toUpperCase()))
        }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === brand || k.includes(' . ')) return
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const matchingTerms = terms.filter((t: string) =>
          k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase())
        )
        if (matchingTerms.length) total += ((v as number) || 0)
      }
    })
    return total
  }

  const filteredBrands = useMemo(() => {
    return Object.keys(activeFilters).filter(b => activeFilters[b]?.length > 0)
      .map(b => ({ brand: b, v26: getFilteredTotal(b, '2026'), v25: getFilteredTotal(b, '2025') }))
      .filter(x => x.v26 > 0).sort((a, b) => b.v26 - a.v26)
  }, [scope, rows, sub])

  const top10 = filteredBrands.slice(0, 10)
  const maxV = Math.max(...top10.map(b => b.v26), 1)
  const fordEntry = filteredBrands.find(b => b.brand === 'FORD')
  const fordIn = top10.some(b => b.brand === 'FORD')
  const fordPos = filteredBrands.findIndex(b => b.brand === 'FORD') + 1

  const displayNamesXLT: Record<string,string> = { 'FORD': 'F-150 XLT', 'RAM': 'RAM 1500' }
  const displayNamesLP: Record<string,string> = { 'FORD': 'F-150 Lariat + Platinum', 'CHEVROLET': 'Silverado', 'JEEP': 'Gladiator', 'TOYOTA': 'Tundra', 'GMC': 'Sierra' }
  const displayNames = sub === 'xlt' ? displayNamesXLT : displayNamesLP
  const getModelNames = (brand: string) => {
    const dn = displayNames[brand]
    return dn ? [dn] : []
  }

  // Province chart with filtered totals
  const getProvFilteredTotal = (p: string, yr: string) => {
    const fp = provMarcas[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    Object.keys(activeFilters).forEach(brand => {
      const terms = activeFilters[brand] || []
      if (!terms.length) return
      const coveredByDot = new Set<string>()
      Object.entries(row).forEach(([k, v]) => {
        if (k === 'year' || k === brand || !v) return
        if (k.includes(' . ') && k.startsWith(brand + ' . ')) {
          const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
          if (mt.length) { total += ((v as number) || 0); mt.forEach(t => coveredByDot.add(t.toUpperCase())) }
        }
      })
      Object.entries(row).forEach(([k, v]) => {
        if (k === 'year' || k === brand || k.includes(' . ') || !v) return
        const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
        if (!isBrandKey && row[brand]) {
          const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase()))
          if (mt.length) total += ((v as number) || 0)
        }
      })
    })
    return total
  }
  const getProvFordTotal = (p: string, yr: string) => {
    const terms = activeFilters['FORD'] || []
    if (!terms.length) return 0
    const fp = provMarcas[p] || []
    const row = fp.find((x: any) => x.year === yr) || {} as any
    let total = 0
    const coveredByDot = new Set<string>()
    Object.entries(row).forEach(([k, v]) => {
      if (k.includes(' . ') && k.startsWith('FORD . ')) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()))
        if (mt.length) { total += ((v as number) || 0); mt.forEach(t => coveredByDot.add(t.toUpperCase())) }
      }
    })
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'year' || k === 'FORD' || k.includes(' . ') || !v) return
      const isBrandKey = k === k.toUpperCase() && k.length < 15 && !k.includes(' AC ') && !k.includes(' 5P')
      if (!isBrandKey) {
        const mt = terms.filter((t: string) => k.toUpperCase().includes(t.toUpperCase()) && !coveredByDot.has(t.toUpperCase()))
        if (mt.length) total += ((v as number) || 0)
      }
    })
    return total
  }
  const provChartData = PROVS.map(p => {
    const v26 = getProvFilteredTotal(p, '2026')
    const v25 = getProvFilteredTotal(p, '2025')
    const f26 = getProvFordTotal(p, '2026')
    const pct = v25 ? ((v26 - v25) / v25 * 100).toFixed(1) : '0'
    const ms = v26 ? (f26 / v26 * 100).toFixed(1) : '0'
    return { prov: pn(p), '2025 YTD': v25, '2026 YTD': v26, 'Ford 2026': f26, delta: `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`, ms }
  })
  const PDL = (props: any) => { const { x, y, width, index } = props; if (!provChartData[index]) return null; const dd = provChartData[index].delta; return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={dd.startsWith('-') ? C.dn : C.up}>{dd}</text> }

  // Line chart
  const top5 = filteredBrands.slice(0, 5)
  const lineData = ['2024', '2025', '2026'].map(yr => {
    const obj: any = { year: yr + ' YTD' }
    top5.forEach(b => { obj[shortName(b.brand)] = getFilteredTotal(b.brand, yr) })
    if (!top5.some(b => b.brand === 'FORD') && fordEntry) obj['FORD'] = getFilteredTotal('FORD', yr)
    return obj
  })
  const lineKeys = [...top5.map(b => shortName(b.brand)), ...(!top5.some(b => b.brand === 'FORD') && fordEntry ? ['FORD'] : [])]
  const scopeLabel = scope === 'NACIONAL' ? 'Nacional' : scope === 'ZONA ORGU' ? 'Zona Orgu' : pn(scope)
  const subLabel = sub === 'xlt' ? 'F-150 XLT vs RAM' : 'F-150 Lariat + Platinum'

  // Card values
  const xltV26 = (() => { let t=0; const r=nacRows.find((x:any)=>x.year==='2026')||{} as any; Object.entries(r).forEach(([k,v])=>{ if(k!=='year'&&k!=='FORD'&&!' . '.includes(k)&&(k.toUpperCase().includes('F150 XLT')||k.toUpperCase().includes('F-150 XLT'))&&v) t+=((v as number)||0) }); return t })()
  const xltV25 = (() => { let t=0; const r=nacRows.find((x:any)=>x.year==='2025')||{} as any; Object.entries(r).forEach(([k,v])=>{ if(k!=='year'&&k!=='FORD'&&!k.includes(' . ')&&(k.toUpperCase().includes('F150 XLT')||k.toUpperCase().includes('F-150 XLT'))&&v) t+=((v as number)||0) }); return t })()
  const lpV26 = (() => { let t=0; const r=nacRows.find((x:any)=>x.year==='2026')||{} as any; const terms=['F150 LARIAT','F150 PLATINUM','F-150 LARIAT','F-150 PLATINUM']; Object.entries(r).forEach(([k,v])=>{ if(k!=='year'&&k!=='FORD'&&!k.includes(' . ')&&terms.some(tt=>k.toUpperCase().includes(tt.toUpperCase()))&&v) t+=((v as number)||0) }); return t })()
  const lpV25 = (() => { let t=0; const r=nacRows.find((x:any)=>x.year==='2025')||{} as any; const terms=['F150 LARIAT','F150 PLATINUM','F-150 LARIAT','F-150 PLATINUM']; Object.entries(r).forEach(([k,v])=>{ if(k!=='year'&&k!=='FORD'&&!k.includes(' . ')&&terms.some(tt=>k.toUpperCase().includes(tt.toUpperCase()))&&v) t+=((v as number)||0) }); return t })()

  return <>
    <Hd tag="Pick Up Full Size" title="Análisis de marcas · F-150" />
    <Ins items={['F-150 XLT domina contra RAM en el segmento de entrada Full Size', 'F-150 Lariat y Platinum compiten contra Silverado, Gladiator, Tundra y Sierra en premium']} />

    <div style={gr(2)}>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <img src="/images/f150xlt.png" alt="F-150 XLT" style={{ height: 70, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>F-150 XLT</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$75,990</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(xltV26)}</div>
            <div style={{ fontSize: 10, color: C.sub }}>un. YTD</div>
          </div>
          <Dl a={xltV26} b={xltV25} />
        </div>
      </Card>
      <Card s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <img src="/images/f150lariat.png" alt="F-150 Lariat" style={{ height: 60, objectFit: 'contain' }} />
          <img src="/images/f150platinum.png" alt="F-150 Platinum" style={{ height: 60, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>F-150 Lariat + Platinum</div>
          <div style={{ fontSize: 12, color: C.ac, fontWeight: 600 }}>$85,990 - $95,990</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{N(lpV26)}</div>
            <div style={{ fontSize: 10, color: C.sub }}>un. YTD</div>
          </div>
          <Dl a={lpV26} b={lpV25} />
        </div>
      </Card>
    </div>

    <SubTab tabs={[{ id: 'xlt', label: 'F-150 XLT vs RAM' }, { id: 'lp', label: 'F-150 Lariat + Platinum' }]} active={sub} onChange={(id) => { setSub(id); setScope('NACIONAL') }} />

    <Card s={{ marginBottom: 20 }}>
      <Lbl>Full Size · {subLabel} · Zona Orgu · YTD 2026 vs 2025</Lbl>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={provChartData} barSize={18} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="prov" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: C.mut }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => N(v)} contentStyle={{ borderRadius: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="2025 YTD" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
          <Bar dataKey="2026 YTD" fill={C.ac} radius={[6, 6, 0, 0]} label={<PDL />} />
          <Bar dataKey="Ford 2026" fill={C.navy} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={gr(4)}>
        {provChartData.map((r: any) => <div key={r.prov} style={{ textAlign: 'center', padding: '6px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{r.prov}</div>
          <div style={{ fontSize: 11, color: C.ac, fontWeight: 600 }}>MS Ford: {r.ms}%</div>
        </div>)}
      </div>
    </Card>

    <SubTab tabs={[{ id: 'NACIONAL', label: pn('NACIONAL') }, { id: 'ZONA ORGU', label: pn('ZONA ORGU') }, ...PROVS.map(p => ({ id: p, label: pn(p) }))]} active={scope} onChange={setScope} />

    {/* BBC */}
    {(() => {
      const BRAND_COLORS: Record<string, string> = { 'FORD': C.navy, 'TOYOTA': '#EB0A1E', 'MAZDA': '#E87722', 'KIA': '#BB162B', 'NISSAN': '#1A1A1A', 'HYUNDAI': '#00287A', 'SUZUKI': '#005BAC', 'SUBARU': '#013B7C', 'PEUGEOT': '#1E3A5F', 'JETOUR': '#2E8B57', 'MITSUBISHI': '#CC0000', 'HONDA': '#CC0000', 'AUDI': '#333', 'CHEVROLET': '#D4A500', 'JEEP': '#4A6741', 'RAM': '#1A1A1A', 'GMC': '#CC0000', 'BMW': '#1C69D4', 'MERCEDES BENZ': '#333' }
      const fm = sub === 'xlt' ? 'F-150 XLT' : 'F-150 Lariat'
      const fp = sub === 'xlt' ? 79990 : 89990
      const prices = (d.precios_competidores?.['Full size Pick up'] || []) as any[]
      // For lariat+plat: two Ford bubbles (Lariat $85,990 and Platinum $95,990)
      const fordModels = (() => {
        if (sub !== 'lp') return [{ name: fm, price: fp, vol: fordEntry?.v26 || 0 }]
        const row = rows.find((r: any) => r.year === '2026') || {} as any
        const lariTerms = ['LARIAT']
        const platTerms = ['PLATINUM']
        const sumTerms = (terms: string[]) => Object.entries(row).reduce((s: number, [k, v]) => {
          if (k === 'year' || k === 'FORD' || !v) return s
          let mk = k
          if (k.includes(' . ')) {
            if (!k.startsWith('FORD . ')) return s
            const parts = k.split(' . '); const leaf = parts[parts.length - 1]
            if (!leaf.includes(' ')) return s
            mk = leaf
          }
          const mkU = mk.toUpperCase()
          if (terms.every(t => mkU.includes(t)) && !mkU.includes('RAPTOR')) s += ((v as number) || 0)
          return s
        }, 0)
        const lariatVol = sumTerms(lariTerms)
        const platVol = sumTerms(platTerms)
        return [
          { name: 'F-150 Lariat', price: 89990, vol: lariatVol },
          { name: 'F-150 Platinum', price: 99990, vol: platVol },
        ]
      })()
      const bbcBrands = filteredBrands.map(b => {
        if (b.brand === 'FORD') return { brand: 'FORD', models: fordModels, totalVol: b.v26, ms: 0, color: BRAND_COLORS['FORD'] }
        const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === b.brand)
        const models = bPrices.filter((p: any) => p.precio).map((p: any) => {
          const trimKey = `${p.modelo} ${p.trim || ''}`.trim().toUpperCase()
          const price = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/[^0-9.]/g, '')) || 0
          // Match trim to actual volume — flexible word matching
          const row = rows.find((r: any) => r.year === '2026') || {} as any
          let vol = 0
          Object.entries(row).forEach(([k, v]) => {
            if (k === 'year' || k === b.brand) return
            let matchKey = k
            if (k.includes(' . ')) {
              if (!k.startsWith(b.brand + ' . ')) return  // different brand subtotal
              // Strip to leaf model name
              const parts = k.split(' . ')
              const leaf = parts[parts.length - 1]
              if (!leaf.includes(' ')) return  // single-word = subtotal, skip
              matchKey = leaf
            }
            const K_STRIP = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','EV','2.0','1.5','1.3','1.6','2.5','3.0','3.5','2.4','2.8','2.2','1.4','1.2','2.3','2.7','3.5','4.0','4.4','5.3','5.8','CVT','TA','TM','6DCT','DCT','BA6','16E','FHEV','ATK','NX4E','BOOSTERJET','EPOWER','NEW','IRG','MX5','DMI','PHEV','FJNACG','F3NA6Y','SPORTBACK','LAREDO','BIGHORN','ETORQUE','FLAGSHIP','TRAILBOSS'])
            const T_STRIP = new Set(['4X2','4X4','CD','DIESEL','HYBRID','CVT','4.0','2.7','2.3','3.5','3.6','5.3','5.8','4.4','2.0','1.5','1.6','2.5','2.4','2.8','1.4','1.3','1.2'])
            const normW = (w:string) => { const m=w.match(/^(\d{3,})[A-Z]$/); return m?m[1]:w }
            const kWords = matchKey.toUpperCase().replace(/-/g,'').split(' ').filter((w:string)=>w&&!K_STRIP.has(w)).map(normW)
            const tWords = trimKey.replace(/-/g,'').split(' ').filter((w:string)=>w&&!T_STRIP.has(w))
            if (!tWords.length) return
            const kPhrase = ' ' + kWords.join(' ') + ' '
            const tPhrase = ' ' + tWords.join(' ') + ' '
            if (kPhrase.includes(tPhrase)) vol += ((v as number) || 0)
          })
          return { name: `${p.modelo} ${p.trim || ''}`.trim(), price, vol }
        })
        return { brand: shortName(b.brand), models, totalVol: b.v26, ms: 0, color: BRAND_COLORS[b.brand] || '#666' }
      }).filter(b => b.totalVol > 0)
      // Scale bubble vols to match totalVol (prevents double-count from subtotal keys)
      bbcBrands.forEach(b => {
        const matchedTotal = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedTotal > 0 && matchedTotal !== b.totalVol) {
          const scale = b.totalVol / matchedTotal
          b.models.forEach(m => { m.vol = Math.round(m.vol * scale) })
        }
      })
      // Brands with volume but no price — place at range average with negative price flag
      const allPricesInBBC = bbcBrands.flatMap(b => b.models.filter(m => m.price > 0).map(m => m.price))
      const avgPrice = allPricesInBBC.length ? allPricesInBBC.reduce((s: number, p: number) => s + p, 0) / allPricesInBBC.length : 0
      bbcBrands.forEach(b => { b.models.forEach(m => { if (m.price === 0 && m.vol > 0 && avgPrice > 0) m.price = -avgPrice }) })
      // Add fallback bubble for brands with volume but no matching price trims
      bbcBrands.forEach(b => {
        const matchedVol = b.models.reduce((s: number, m: any) => s + m.vol, 0)
        if (matchedVol === 0 && b.totalVol > 0) {
          const allP = bbcBrands.flatMap(x => x.models.filter(m => m.price > 0).map(m => m.price))
          const avg = allP.length ? allP.reduce((s: number, p: number) => s + p, 0) / allP.length : 0
          if (avg > 0) b.models.push({ name: b.brand, price: avg, vol: b.totalVol, noPrice: true })
        }
      })
      const totalSeg = bbcBrands.reduce((s: number, x: any) => s + x.totalVol, 0)
      bbcBrands.forEach(b => { b.ms = totalSeg ? (b.totalVol / totalSeg * 100) : 0 })
      bbcBrands.sort((a, b) => a.brand === 'FORD' ? -1 : b.brand === 'FORD' ? 1 : b.totalVol - a.totalVol)
      return <BBC brands={bbcBrands} scopeLabel={scopeLabel} />
    })()}

    <Card s={{ marginBottom: 16 }}>
      <Lbl>Top marcas · {subLabel} · {scopeLabel} · YTD 2026 vs YTD 2025</Lbl>
      {top10.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: C.mut, fontSize: 13 }}>No hay matriculación al 2026 YTD en este segmento</div>}
      {top10.map((b, i) => <RankBar key={b.brand + scope + sub} rank={i + 1} name={b.brand} val={b.v26} max={maxV} ford={b.brand === 'FORD'} v25={b.v25} models={getModelNames(b.brand).map(m => ({ n: b.brand + ' · ' + m, v: b.v26 }))} />)}
      {!fordIn && fordEntry && fordEntry.v26 > 0 && <>
        <div style={{ borderTop: `2px dashed ${C.brd}`, margin: '14px 0', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: 16, background: C.w, padding: '0 8px', fontSize: 10, fontWeight: 700, color: C.ac }}>FORD · #{fordPos}</span>
        </div>
        <RankBar rank={fordPos} name="FORD" val={fordEntry.v26} max={maxV} ford v25={fordEntry.v25} models={getModelNames('FORD').map(m => ({ n: 'FORD · ' + m, v: fordEntry.v26 }))} />
      </>}
    </Card>
  </>
}

function T12({ d }: { d: any }) {
  const ytdF = (d.ford_ytd || []) as any[]
  const fT = ytdF.find((r: any) => r.cat === 'Total general') || {} as any
  const mktT = (d.mercado_ytd || []).find((r: any) => r.cat === 'Total general') || {} as any
  const ms = mktT.ytd2026 ? ((fT.ytd2026 || 0) / mktT.ytd2026 * 100).toFixed(2) : '0'
  const growth = fT.ytd2025 ? ((fT.ytd2026 / fT.ytd2025 - 1) * 100).toFixed(1) : '0'

  // Calculate each model from data
  const getVal = (section: string, yr: string, terms: string[]) => {
    const rows = d[section]?.NACIONAL || []
    const r = rows.find((x: any) => x.year === yr) || {} as any
    let total = 0
    Object.entries(r).forEach(([k, v]) => {
      if (k === 'year' || k === 'FORD' || k.includes(' . ')) return
      if (terms.some(t => k.toUpperCase().includes(t.toUpperCase()))) total += ((v as number) || 0)
    })
    return total
  }

  const suvs = [
    { name: 'New Territory', trim: 'Titanium · Titanium Plus', fuel: 'HEV', price: '$35,990', img: '/images/territory.png',
      v26: getVal('suv_25_40_fhev', '2026', ['TERRITORY TITANIUM']), v25: 0, segment: 'SUV HEV 25-40K', highlight: 'Motor del crecimiento Ford' },
    { name: 'Escape 1.5', trim: 'Titanium', fuel: 'Gasolina', price: '$35,990', img: '/images/escape15.png',
      v26: getVal('suv_25_40_gas', '2026', ['ESCAPE']), v25: getVal('suv_25_40_gas', '2025', ['ESCAPE']), segment: 'SUV Gas 25-40K', highlight: 'Inventario residual' },
    { name: 'Escape ST-Line', trim: 'ST-Line', fuel: 'HEV', price: '$44,990', img: '/images/escapestline.png',
      v26: getVal('suv_40_50', '2026', ['ESCAPE ST']), v25: getVal('suv_40_50', '2025', ['ESCAPE ST']), segment: 'SUV HEV 40-50K', highlight: 'Monitorear' },
    { name: 'Everest', trim: 'Active', fuel: 'Gasolina', price: '$69,990', img: '/images/everest.png',
      v26: getVal('suv_55_80', '2026', ['EVEREST']), v25: getVal('suv_55_80', '2025', ['EVEREST']), segment: 'SUV 55-80K', highlight: '#3 en su segmento' },
    { name: 'Explorer Active', trim: 'Active', fuel: 'Gasolina', price: '$89,990', img: '/images/exploreractive.png',
      v26: getVal('suv_60_80', '2026', ['EXPLORER ACTIVE']), v25: getVal('suv_60_80', '2025', ['EXPLORER ACTIVE']), segment: 'SUV 60-80K', highlight: 'Estable' },
    { name: 'Explorer Platinum', trim: 'Platinum', fuel: 'Gasolina', price: '$98,990', img: '/images/explorerplatinum.png',
      v26: getVal('suv_60_80', '2026', ['EXPLORER PLATINUM']), v25: getVal('suv_60_80', '2025', ['EXPLORER PLATINUM']), segment: 'SUV 60-80K', highlight: 'Premium' },
    { name: 'Bronco', trim: 'Wildtrak · Badlands', fuel: 'Gasolina', price: '$119,990', img: '/images/bronco.png',
      v26: getVal('suv_80plus', '2026', ['BRONCO']), v25: getVal('suv_80plus', '2025', ['BRONCO']), segment: 'SUV +80K', highlight: 'Sin unidades YTD' },
    { name: 'Expedition', trim: 'Platinum', fuel: 'Gasolina', price: '$139,990', img: '/images/expeditionplatinum.png',
      v26: getVal('suv_80plus', '2026', ['EXPEDITION']), v25: getVal('suv_80plus', '2025', ['EXPEDITION']), segment: 'SUV +80K', highlight: 'Premium estable' },
  ]
  const pickups = [
    { name: 'Ranger XL', trim: 'XL', fuel: 'Diesel TM 4x4', price: '$53,990', img: '/images/rangerxl.png',
      v26: (d.pick_diesel_tm?.NACIONAL?.find((r:any)=>r.year==='2026') || {})['FORD'] || 0,
      v25: (d.pick_diesel_tm?.NACIONAL?.find((r:any)=>r.year==='2025') || {})['FORD'] || 0, segment: 'Pickup Diesel TM', highlight: 'Mid Size manual' },
    { name: 'Ranger XLT', trim: 'XLT', fuel: 'Diesel TA 4x4', price: '$67,990', img: '/images/rangerxlt.png',
      v26: (d.pick_diesel_ta?.NACIONAL?.find((r:any)=>r.year==='2026') || {})['FORD'] || 0,
      v25: (d.pick_diesel_ta?.NACIONAL?.find((r:any)=>r.year==='2025') || {})['FORD'] || 0, segment: 'Pickup Diesel TA', highlight: 'Mid Size automática' },
    { name: 'F-150 XLT', trim: 'XLT', fuel: 'HEV', price: '$79,990', img: '/images/f150xlt.png',
      v26: getVal('pick_fullsize', '2026', ['F150 XLT', 'F-150 XLT']), v25: getVal('pick_fullsize', '2025', ['F150 XLT', 'F-150 XLT']), segment: 'Full Size', highlight: '#1 vs RAM' },
    { name: 'F-150 Lariat + Platinum', trim: 'Lariat · Platinum', fuel: 'HEV', price: '$89,990 – $99,990', img: '/images/f150lariat.png',
      v26: getVal('pick_fullsize', '2026', ['F150 LARIAT', 'F150 PLATINUM']), v25: getVal('pick_fullsize', '2025', ['F150 LARIAT', 'F150 PLATINUM']), segment: 'Full Size Premium', highlight: 'Dominio premium' },
    { name: 'F-150 Raptor', trim: 'Raptor', fuel: 'Gasolina', price: '$119,990', img: '/images/f150platinum.png',
      v26: getVal('pick_fullsize', '2026', ['F150 RAPTOR', 'F-150 RAPTOR']), v25: getVal('pick_fullsize', '2025', ['F150 RAPTOR', 'F-150 RAPTOR']), segment: 'Full Size', highlight: 'Performance' },
  ]

  return <>
    <Hd tag="Ford Portfolio Ecuador" title="Rendimiento Q1 2026 · Todos los modelos" />
    <Ins items={['Ford Ecuador cierra Q1 2026 con el mejor arranque en 3 años', 'Territory redefine el mix, F-150 lidera Full Size, y Everest escala']} />

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
          <div style={{ fontSize: 36, fontWeight: 700, color: '#FBBF24', lineHeight: 1 }}>{N(fc(fT.ytd2026 || 0, (d as any).months_ytd || 4))}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Forecast 2026</div>
        </div>
      </div>
    </Card>

    <Lbl>Nacional · SUVs · Ordenado por precio (menor a mayor)</Lbl>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
      {suvs.map((m, i) => {
        const u = m.v25 ? m.v26 >= m.v25 : m.v26 > 0
        return <Card key={m.name} s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderLeft: m.v26 > 20 ? `4px solid ${C.ac}` : undefined }}>
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
              {m.v25 === 0 && m.v26 > 0 ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: C.upB, color: C.up }}>NEW</span> : <Dl a={m.v26} b={m.v25} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: C.mut, background: C.bg, padding: '2px 8px', borderRadius: 4 }}>{m.segment}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: u ? C.up : C.dn }}>{m.highlight}</span>
            </div>
          </div>
        </Card>
      })}
    </div>

    <Lbl>Nacional · Pickups · Ordenado por precio (menor a mayor)</Lbl>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
      {pickups.map((m, i) => {
        const u = m.v25 ? m.v26 >= m.v25 : m.v26 > 0
        return <Card key={m.name} s={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderLeft: m.v26 > 20 ? `4px solid ${C.ac}` : undefined }}>
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
            <td style={{ padding: '12px 14px', textAlign: 'right', color: C.ac, fontWeight: 600 }}>{N(fc(r.ytd2026 || 0, (d as any).months_ytd || 4))}</td>
          </tr>
        )}</tbody>
      </table>
    </Card>
  </>
}

