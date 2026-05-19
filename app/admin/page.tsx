// @ts-nocheck
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const REPO = 'melanymendoza1/ford-report'
const FILE = 'public/report_data.json'
const PASSWORD = 'orgu2026'
const C = { night: '#081534', navy: '#133A7C', steel: '#2A6BAC', sky: '#47A8E5', bg: '#F0F4F8', w: '#fff', brd: '#E2E8F0', red: '#DC2626', green: '#059669', yellow: '#F59E0B', dark: '#0F172A', mut: '#94A3B8' }

const SEG_LABELS: Record<string, string> = {
  'SUV GAS 25 - 40': 'Gas 25-40K', 'SUV  HEV 25 - 40': 'HEV 25-40K',
  'SUV  HEV 40 - 50': 'HEV 40-50K', 'SUV  55 - 80 everest': 'Everest 55-80K',
  'SUV  55 - 80 explorer': 'Explorer Active', 'SUV  80 plus expedition': 'Expedition +80K',
  'SUV  80 plus explorer': 'Explorer Platinum', 'Pick up TM': 'Ranger XL',
  'Pick up TA': 'Ranger XLT', 'Full size Pick up': 'Full Size',
}
const SEG_DATA: Record<string, [string, string]> = {
  'SUV GAS 25 - 40': ['suv_25_40_gas', 'suv_gas_25_40'],
  'SUV  HEV 25 - 40': ['suv_25_40_fhev', 'suv_hib_25_40'],
  'SUV  HEV 40 - 50': ['suv_40_50', 'suv_hib_40_50'],
  'SUV  55 - 80 everest': ['suv_55_80', 'suv_55_80_everest'],
  'SUV  55 - 80 explorer': ['suv_60_80', 'suv_55_80_explorer'],
  'SUV  80 plus expedition': ['suv_80plus', 'suv_80plus_expedition'],
  'SUV  80 plus explorer': ['suv_80plus', 'suv_80plus_explorer_plat'],
  'Pick up TM': ['pick_diesel_tm', 'pu_diesel_ranger_xl'],
  'Pick up TA': ['pick_diesel_ta', 'pu_diesel_ranger_xlt'],
  'Full size Pick up': ['pick_fullsize', 'pu_fullsize_all'],
}
const FILTER_LABELS: Record<string, string> = {
  suv_gas_25_40: 'Gas 25-40K', suv_hib_25_40: 'HEV 25-40K', suv_hib_40_50: 'HEV 40-50K',
  suv_55_80_everest: 'Everest', suv_55_80_explorer: 'Explorer Active',
  suv_80plus_expedition: 'Expedition', suv_80plus_bronco: 'Bronco',
  suv_80plus_explorer_plat: 'Explorer Platinum', pu_diesel_ranger_xl: 'Ranger XL',
  pu_diesel_ranger_xlt: 'Ranger XLT', pu_fullsize_f150_xlt: 'F-150 XLT',
  pu_fullsize_f150_lariat_plat: 'F-150 Lariat/Platinum', pu_fullsize_all: 'Full Size Total',
}
const INS_LABELS: Record<string, string> = {
  T1_industria: 'T1 · Industria', T2_combustibles: 'T2 · Combustibles',
  T3_suv_segmentos: 'T3 · SUV Segmentos', T4_gas_25_40: 'T4 · Gas 25-40K',
  T5_hev_25_40: 'T5 · HEV 25-40K', T6_hev_40_50: 'T6 · HEV 40-50K',
  T7_everest: 'T7 · Everest', T7_explorer_active: 'T7 · Explorer Active',
  T8_suv_80plus: 'T8 · SUV +80K', T9_pu_categoria: 'T9 · PU Categoría',
  T10_ranger_xl: 'T10 · Ranger XL', T11_ranger_xlt: 'T11 · Ranger XLT',
  T11_fullsize: 'T11 · Full Size', T12_portafolio: 'T12 · Portafolio',
}

// ── Matching algorithm (mirrors page.tsx) ────────────────────────────────
const STOP_K = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','TA','TM','FWD','AWD','20','15','16','18','25','35','40','13','CVT','DSG','DCT','MT','NX4E','NX4','B01','DT','HEV','FHEV','MHEV','PHEV','SX2','SX','EV','ECOBOOST','ETORQUE','BIGHORN','TRAILBOSS','Z71','CREW','CAB','TOURING'])
const STOP_T = new Set(['5P','4X2','4X4','CD','DIESEL','HYBRID','HIBRIDO','TA','TM','FWD','AWD','20','15','16','18','25','35','40','13','CVT','DSG','DCT','MT'])
const GENERIC = new Set([...Array.from(STOP_K), 'AC'])
const rmv = (s: string) => s.replace(/-/g,'').replace(/\./g,'').toUpperCase()

function matchTrim(matchKey: string, trimKey: string, otherTrims: string[]) {
  const kW = new Set(rmv(matchKey).split(' ').filter(w => !STOP_K.has(w) && w.length >= 1))
  const tW = rmv(trimKey).split(' ').filter(w => !STOP_T.has(w) && w.length >= 1)
  if (!tW.length || !tW.every(w => kW.has(w))) return false
  const sibs = otherTrims.flatMap(t => rmv(t).split(' ').filter(w => !GENERIC.has(w) && w.length >= 1))
  return !sibs.some(s => kW.has(s))
}

function computeVol(row: Record<string,any>, brand: string, trimKey: string, otherTrims: string[]) {
  let vol = 0
  Object.entries(row).forEach(([k,v]) => {
    if (!v || k === 'year' || k === brand) return
    let mk = k
    if (k.includes(' . ')) {
      if (!k.toUpperCase().startsWith(brand.toUpperCase() + ' . ')) return
      mk = k.split(' . ').pop()!
    }
    if (matchTrim(mk, trimKey, otherTrims)) vol += (v as number) || 0
  })
  return vol > 0 ? vol : (row[brand] as number) || 0
}

function computeVolAdmin(row: Record<string,any>, brand: string, trimKey: string, otherTrims: string[]): number {
  let vol = 0
  Object.entries(row).forEach(([k,v]) => {
    if (!v || k === 'year' || k === brand) return
    let mk = k
    if (k.includes(' . ')) {
      if (!k.toUpperCase().startsWith(brand + ' . ')) return
      mk = k.split(' . ').pop()!
    }
    if (matchTrim(mk, trimKey, otherTrims)) vol += (v as number) || 0
  })
  return vol > 0 ? vol : (row[brand] as number) || 0
}

function getRow26(data: any, seg: string, scope: string): Record<string,any> {
  const [dataKey] = SEG_DATA[seg] || []
  if (!dataKey) return {}
  const section = data[dataKey] || {}
  const PROVS = ['PICHINCHA','GUAYAS','MANABI','EL ORO']
  const PMAP: Record<string,string> = {'MANABI':'MANABÍ'}
  if (scope === 'NACIONAL') {
    return (section.NACIONAL || []).find((r: any) => r.year === '2026') || {}
  }
  const pm = section.prov_marcas || {}
  const targets = scope === 'ZONA ORGU' ? ['PICHINCHA','GUAYAS','MANABÍ','EL ORO'] : [scope]
  const agg: Record<string,any> = { year: '2026' }
  targets.forEach((p: string) => {
    const rows = (pm[p] || pm[PMAP[p] || p] || [])
    const row = rows.find((r: any) => r.year === '2026') || {}
    Object.entries(row).forEach(([k,v]) => { if (k !== 'year') agg[k] = (agg[k] || 0) + ((v as number) || 0) })
  })
  return agg
}

function buildBBCData(data: any, seg: string, scope = 'NACIONAL') {
  const [dataKey, filterKey] = SEG_DATA[seg] || []
  if (!dataKey) return []
  const r26 = getRow26(data, seg, scope)
  const prices = data.precios_competidores?.[seg] || []
  const filters = data.model_filters?.[filterKey] || {}

  const BRAND_COLORS: Record<string,string> = { FORD:'#133A7C', TOYOTA:'#CC0000', KIA:'#BA0C2F', MAZDA:'#E65100', NISSAN:'#1A1A1A', HYUNDAI:'#002C5F', CHEVROLET:'#D4AC0D', MITSUBISHI:'#E30613', SUBARU:'#1C4CA3', PEUGEOT:'#192D6E', RAM:'#8B0000', GREAT_WALL:'#1B5E20', SUZUKI:'#003087', RENAULT:'#FFCC00', BYD:'#1C3E6E', CHERY:'#0D5EAF', JEEP:'#2E7D32', BMW:'#1C69D4', HONDA:'#CC0000', NISSAN2:'#C3002F' }
  const DEF_COLORS = ['#DC2626','#059669','#D97706','#7C3AED','#0891B2','#BE185D','#4338CA','#65A30D','#0EA5E9']

  return Object.keys(filters).filter(b => (filters[b] as string[]).length > 0).map((brand, bi) => {
    const bPrices = prices.filter((p: any) => p.marca?.toUpperCase() === brand)
    const models = bPrices.filter((p: any) => p.precio != null).map((p: any) => {
      const trimKey = `${p.modelo} ${p.trim || ''}`.trim()
      const others = bPrices.filter((x:any) => x.modelo === p.modelo && x.trim !== p.trim).map((x:any) => x.trim || '')
      const rawVol = computeVol(r26, brand, trimKey, others)
      const vol = (p as any).vol_override?.[scope] != null ? (p as any).vol_override[scope] : rawVol
      return { name: trimKey, price: Number(p.precio), vol, idx: prices.indexOf(p) }
    })
    const totalVol = (r26[brand] as number) || 0
    const color = BRAND_COLORS[brand] || DEF_COLORS[bi % DEF_COLORS.length]
    return { brand, models, totalVol, color }
  }).filter(b => b.models.length > 0)
}

// ── BBC Visual Component ─────────────────────────────────────────────────
function BBCView({ data, seg, scope, onClickBubble }: { data: any, seg: string, scope: string, onClickBubble: (e: any, segKey: string, idx: number) => void }) {
  const brands = buildBBCData(data, seg, scope)
  if (!brands.length) return <div style={{ padding: 32, color: C.mut, textAlign: 'center' }}>Sin datos para este segmento</div>

  const allM = brands.flatMap(b => b.models.map(m => ({ ...m, brand: b.brand, color: b.color })))
  const maxVol = Math.max(...allM.map(m => m.vol), 1)
  const validP = allM.filter(m => m.price > 0).map(m => m.price)
  if (!validP.length) return null
  const minP = Math.floor((Math.min(...validP) - 2000) / 5000) * 5000
  const maxP = Math.ceil((Math.max(...validP) + 2000) / 5000) * 5000
  const rangeP = maxP - minP || 10000

  const W = 950, H = 480, PAD = { t: 30, b: 90, l: 80, r: 20 }
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b
  const colW = plotW / brands.length
  const yScale = (p: number) => PAD.t + plotH - ((p - minP) / rangeP * plotH)
  const rScale = (v: number) => Math.max(8, Math.min(38, Math.sqrt(v / maxVol) * 38))
  const yTicks: number[] = []
  for (let p = minP; p <= maxP; p += 5000) yTicks.push(p)

  const priceBuckets: Record<number,number> = {}
  allM.filter(m => m.price > 0).forEach(m => { const b = Math.floor(m.price / 5000) * 5000; priceBuckets[b] = (priceBuckets[b] || 0) + 1 })
  const hotBucket = Object.entries(priceBuckets).sort((a, b) => b[1] - a[1])[0]
  const hotRange = hotBucket ? Number(hotBucket[0]) : -1
  const fmt = (p: number) => `$${p.toLocaleString('es-EC')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', minWidth: 700 }}>
      {yTicks.map(p => {
        const isHot = p === hotRange || p === hotRange + 5000
        return <g key={p}>
          <line x1={PAD.l} x2={W - PAD.r} y1={yScale(p)} y2={yScale(p)} stroke={isHot ? '#64748B' : '#E2E8F0'} strokeDasharray={isHot ? '8,4' : '4,4'} strokeWidth={isHot ? 2 : 0.8} />
          <text x={PAD.l - 8} y={yScale(p) + 4} textAnchor="end" fontSize={9} fill={isHot ? '#334155' : C.mut} fontWeight={isHot ? 700 : 400}>{fmt(p)}</text>
        </g>
      })}
      {hotRange >= 0 && <rect x={PAD.l} y={yScale(hotRange + 5000)} width={W - PAD.l - PAD.r} height={yScale(hotRange) - yScale(hotRange + 5000)} fill="#F1F5F9" opacity={0.5} />}
      {brands.map((_, bi) => bi > 0 && <line key={bi} x1={PAD.l + bi * colW} x2={PAD.l + bi * colW} y1={PAD.t} y2={H - PAD.b + 5} stroke="#F1F5F9" strokeWidth={1} />)}
      {brands.map((b, bi) => {
        const cx = PAD.l + bi * colW + colW / 2
        return <g key={b.brand}>
          <rect x={PAD.l + bi * colW + 2} y={H - PAD.b + 10} width={colW - 4} height={68} rx={6} fill={b.color} />
          <text x={cx} y={H - PAD.b + 27} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{b.brand}</text>
          <text x={cx} y={H - PAD.b + 42} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.9)">{(() => { const mapped = b.models.reduce((s:number,m:any)=>s+m.vol,0); return mapped === b.totalVol ? `VOL: ${mapped}` : `${mapped} / ${b.totalVol}` })()}</text>
          <text x={cx} y={H - PAD.b + 57} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.65)">{b.models.reduce((s:number,m:any)=>s+m.vol,0) === b.totalVol ? 'un. YTD' : 'mapeadas / total'}</text>
          {b.models.map((m, mi) => {
            const r = rScale(m.vol)
            const y = yScale(m.price)
            const total = b.models.length
            const xOff = total > 1 ? (mi - (total - 1) / 2) * Math.min(r * 1.5, colW * 0.38) : 0
            return <g key={m.name + mi} style={{ cursor: 'pointer' }} onClick={() => onClickBubble(m, seg, m.idx)}>
              {/* Hover ring */}
              <circle cx={cx + xOff} cy={y} r={r + 6} fill="transparent" stroke="transparent" className="bubble-hover" />
              <circle cx={cx + xOff} cy={y} r={r} fill={b.color} opacity={0.85} stroke="#fff" strokeWidth={2.5} />
              {/* Edit indicator */}
              <text x={cx + xOff + r - 3} y={y - r + 3} fontSize={8} fill="#fff" textAnchor="middle">✎</text>
              <text x={cx + xOff} y={y - r - 14} textAnchor="middle" fontSize={8} fontWeight={600} fill="#334155">{m.name}</text>
              <text x={cx + xOff} y={y - r - 4} textAnchor="middle" fontSize={7} fontWeight={500} fill={C.sky}>{fmt(m.price)}</text>
              <text x={cx + xOff} y={y + 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">{m.vol}</text>
            </g>
          })}
        </g>
      })}
    </svg>
  )
}

const SCOPES_ALL = ['NACIONAL','ZONA ORGU','PICHINCHA','GUAYAS','MANABÍ','EL ORO']

// ── Edit Drawer ───────────────────────────────────────────────────────────
function EditDrawer({ entry, segKey, idx, computedVols, onSave, onDelete, onClose }: any) {
  const [local, setLocal] = useState({ ...entry, vol_override: { ...(entry.vol_override || {}) } })
  const f = (field: string, val: any) => setLocal((p: any) => ({ ...p, [field]: val }))
  const setVol = (scope: string, val: string) => setLocal((p: any) => ({
    ...p,
    vol_override: { ...p.vol_override, [scope]: val === '' ? undefined : Number(val) }
  }))
  const clearVol = (scope: string) => setLocal((p: any) => {
    const v = { ...p.vol_override }; delete v[scope]; return { ...p, vol_override: v }
  })
  // Clean undefined from vol_override before saving
  const handleSave = () => {
    const clean = { ...local }
    if (clean.vol_override) {
      const v: Record<string,number> = {}
      Object.entries(clean.vol_override).forEach(([k,val]) => { if (val != null) v[k] = val as number })
      clean.vol_override = Object.keys(v).length > 0 ? v : undefined
    }
    onSave(segKey, idx, clean)
  }

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: C.w, boxShadow: '-8px 0 40px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: C.sky, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Editando burbuja</div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, marginTop: 2 }}>{local.marca || 'Nueva'} {local.modelo} {local.trim}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 8, width: 36, height: 36, fontSize: 20 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Basic fields */}
          {([['Marca', 'marca'], ['Modelo', 'modelo'], ['Trim', 'trim'], ['Combustible', 'combustible']] as [string,string][]).map(([label, field]) => (
            <div key={field}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>{label}</label>
              <input value={local[field] || ''} onChange={e => f(field, e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.brd}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: field === 'trim' ? 'monospace' : 'inherit', fontWeight: field === 'trim' ? 700 : 400 }} />
              {field === 'trim' && <div style={{ fontSize: 11, color: C.mut, marginTop: 3 }}>Clave que busca el volumen en AEADE. Si el vol está mal, cambia esto.</div>}
            </div>
          ))}

          {/* Price */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Precio $</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, color: C.mut }}>$</span>
              <input value={local.precio ?? ''} onChange={e => f('precio', e.target.value === '' ? null : Number(e.target.value))} type="number"
                style={{ flex: 1, padding: '9px 12px', border: `2px solid ${C.sky}`, borderRadius: 8, fontSize: 20, fontWeight: 700, color: C.navy, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Volume overrides */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: `1px solid ${C.brd}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              📊 Volumen por scope
              <span style={{ fontSize: 11, fontWeight: 400, color: C.mut }}>Deja vacío = usa el Excel automáticamente</span>
            </div>
            {SCOPES_ALL.map(scope => {
              const computed = computedVols?.[scope] ?? '—'
              const override = local.vol_override?.[scope]
              const hasOverride = override != null
              return (
                <div key={scope} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: C.dark, flexShrink: 0 }}>{scope === 'NACIONAL' ? '🌎 Nacional' : scope === 'ZONA ORGU' ? '📍 ZO' : scope}</div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      value={override ?? ''}
                      onChange={e => setVol(scope, e.target.value)}
                      type="number"
                      placeholder={`Auto: ${computed}`}
                      style={{ width: '100%', padding: '6px 10px', border: `1.5px solid ${hasOverride ? C.sky : C.brd}`, borderRadius: 7, fontSize: 13, fontWeight: hasOverride ? 700 : 400, color: hasOverride ? C.navy : '#94A3B8', outline: 'none', boxSizing: 'border-box', background: hasOverride ? '#EFF6FF' : C.w }}
                    />
                  </div>
                  {hasOverride && (
                    <button onClick={() => clearVol(scope)}
                      style={{ background: '#FEE2E2', border: 'none', color: C.red, cursor: 'pointer', borderRadius: 6, width: 26, height: 26, fontSize: 12, flexShrink: 0 }}>✕</button>
                  )}
                  {!hasOverride && <div style={{ width: 26, flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.brd}`, display: 'flex', gap: 10 }}>
        <button onClick={() => onDelete(segKey, idx)}
          style={{ padding: '10px 14px', background: '#FEE2E2', color: C.red, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          🗑 Eliminar
        </button>
        <button onClick={onClose}
          style={{ flex: 1, padding: '10px 0', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleSave}
          style={{ flex: 1, padding: '10px 0', background: C.navy, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ✅ Guardar
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('ghtoken') || '' : '')
  const [data, setData] = useState<any>(null)
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [tab, setTab] = useState<'bbc' | 'fordcards' | 'filtros' | 'insights'>('bbc')
  const [activeSeg, setActiveSeg] = useState('SUV GAS 25 - 40')
  const [loginMsg, setLoginMsg] = useState('')
  const [drawer, setDrawer] = useState<{ entry: any, segKey: string, idx: number } | null>(null)
  const [bbcScope, setBbcScope] = useState('NACIONAL')
  const SCOPES = ['NACIONAL','ZONA ORGU','PICHINCHA','GUAYAS','MANABÍ','EL ORO']

  const fetchData = useCallback(async (tok: string) => {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
      headers: { Authorization: `token ${tok}`, Accept: 'application/vnd.github.v3+json' }
    })
    const json = await res.json()
    if (!json.sha) { setLoginMsg('Token sin acceso'); return false }
    setSha(json.sha)
    setData(JSON.parse(atob(json.content.replace(/\n/g, ''))))
    return true
  }, [])

  const save = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Admin: edición manual', content: encoded, sha })
      })
      const json = await res.json()
      if (json.content?.sha) {
        setSha(json.content.sha)
        setSaveMsg('✅ Guardado — deploy en ~30s')
        setTimeout(() => setSaveMsg(''), 5000)
      } else setSaveMsg('❌ ' + (json.message || 'Error'))
    } catch (e: any) { setSaveMsg('❌ ' + e.message) }
    setSaving(false)
  }

  const login = async () => {
    if (pw !== PASSWORD) { setLoginMsg('Contraseña incorrecta'); return }
    if (!token) { setLoginMsg('Ingresa el GitHub token'); return }
    localStorage.setItem('ghtoken', token)
    setLoginMsg('Conectando...')
    const ok = await fetchData(token)
    if (ok) setAuth(true)
  }

  const mutate = (fn: (d: any) => void) => setData((p: any) => { const n = JSON.parse(JSON.stringify(p)); fn(n); return n })

  const computeAllVols = (seg: string, idx: number) => {
    const entry = data.precios_competidores[seg]?.[idx]
    if (!entry) return {}
    const trimKey = ((entry.modelo || '') + ' ' + (entry.trim || '')).trim()
    const brand = (entry.marca || '').toUpperCase()
    const otherTrims = (data.precios_competidores[seg] || []).filter((_: any, i: number) => i !== idx && _.modelo === entry.modelo).map((x: any) => x.trim || '')
    const [dataKey] = SEG_DATA[seg] || []
    if (!dataKey) return {}
    const section = data[dataKey] || {}
    const pm = section.prov_marcas || {}
    const PROVS_LIST = ['PICHINCHA','GUAYAS','MANABÍ','EL ORO']
    const g = (rows: any[]) => (rows || []).find((r: any) => r.year === '2026') || {}
    const vols: Record<string,number> = {}
    vols['NACIONAL'] = computeVolAdmin(g(section.NACIONAL), brand, trimKey, otherTrims)
    const zo: Record<string,any> = { year:'2026' }
    PROVS_LIST.forEach(p => { Object.entries(g(pm[p])).forEach(([k,v]) => { if(k!=='year') zo[k]=(zo[k]||0)+((v as number)||0) }) })
    vols['ZONA ORGU'] = computeVolAdmin(zo, brand, trimKey, otherTrims)
    PROVS_LIST.forEach(p => { vols[p] = computeVolAdmin(g(pm[p]), brand, trimKey, otherTrims) })
    return vols
  }

  const onBubbleClick = (m: any, seg: string, idx: number) => {
    const entry = data.precios_competidores[seg][idx]
    setDrawer({ entry, segKey: seg, idx, computedVols: computeAllVols(seg, idx) } as any)
  }

  const onDrawerSave = (segKey: string, idx: number, updated: any) => {
    mutate(d => { d.precios_competidores[segKey][idx] = updated })
    setDrawer(null)
  }

  const onDrawerDelete = (segKey: string, idx: number) => {
    if (!confirm('¿Eliminar esta burbuja del BBC?')) return
    mutate(d => { d.precios_competidores[segKey].splice(idx, 1) })
    setDrawer(null)
  }

  const setFilter = (seg: string, brand: string, val: string) =>
    mutate(d => { d.model_filters[seg][brand] = val.split(',').map((s: string) => s.trim()).filter(Boolean) })

  const setInsight = (key: string, i: number, val: string) =>
    mutate(d => { if (!d.insights[key]) d.insights[key] = []; d.insights[key][i] = val })
  const addInsight = (key: string) => mutate(d => { if (!d.insights[key]) d.insights[key] = []; d.insights[key].push('') })
  const removeInsight = (key: string, i: number) => mutate(d => d.insights[key].splice(i, 1))

  // ── Login Screen ─────────────────────────────────────────────────────────
  if (!auth) return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.night}, #0F2B5E)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.w, borderRadius: 20, padding: '48px 40px', width: 400, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏎</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.night }}>Panel Admin</div>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Orgu Ford · Market Report Editor</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Contraseña', pw, setPw, 'password', '••••••••'], ['GitHub Token', token, setToken, 'password', 'ghp_...']].map(([lbl, val, set, type, ph]) => (
            <div key={lbl as string}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>{lbl as string}</label>
              <input type={type as string} value={val as string} onChange={e => (set as any)(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
                style={{ width: '100%', padding: '12px 14px', border: `2px solid ${C.brd}`, borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} placeholder={ph as string} />
            </div>
          ))}
          <button onClick={login} style={{ padding: '14px 0', background: `linear-gradient(135deg, ${C.navy}, ${C.steel})`, color: C.w, border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            Entrar →
          </button>
          {loginMsg && <div style={{ textAlign: 'center', fontSize: 13, color: loginMsg.includes('✅') || loginMsg.includes('ectando') ? C.green : C.red, fontWeight: 600 }}>{loginMsg}</div>}
        </div>
      </div>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.w, textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>Cargando datos...</div>
    </div>
  )

  const ins = data.insights || {}
  const mf = data.model_filters || {}

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* Top bar */}
      <div style={{ background: C.night, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: C.w, fontSize: 16, fontWeight: 700 }}>🏎 Admin · Orgu Ford</div>
          <a href="/" target="_blank" style={{ color: '#94A3B8', fontSize: 12, textDecoration: 'none', border: '1px solid #334155', padding: '4px 10px', borderRadius: 6 }}>Ver reporte →</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith('✅') ? '#4ADE80' : '#FCA5A5' }}>{saveMsg}</span>}
          <button onClick={save} disabled={saving}
            style={{ padding: '9px 24px', background: saving ? '#334155' : C.sky, color: C.w, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? '⏳ Guardando...' : '💾 Guardar y Deployar'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.w, borderBottom: `1px solid ${C.brd}`, padding: '0 24px', display: 'flex' }}>
        {[['bbc', '📊 BBC'], ['fordcards', '🔵 Ford Cards'], ['filtros', '🔧 Filtros'], ['insights', '💬 Insights']].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ padding: '14px 22px', background: 'none', border: 'none', borderBottom: tab === t ? `3px solid ${C.sky}` : '3px solid transparent', color: tab === t ? C.sky : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ═══ BBC TAB ═══ */}
      {tab === 'bbc' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 110px)' }}>
          {/* Sidebar */}
          <div style={{ width: 190, background: C.w, borderRight: `1px solid ${C.brd}`, overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: C.mut, textTransform: 'uppercase', letterSpacing: 1, background: '#F8FAFC', borderBottom: `1px solid ${C.brd}` }}>Segmentos</div>
            {Object.keys(SEG_LABELS).map(seg => {
              const nBubbles = (data.precios_competidores[seg] || []).filter((e: any) => e.precio).length
              return (
                <button key={seg} onClick={() => setActiveSeg(seg)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', background: activeSeg === seg ? C.navy : 'none', color: activeSeg === seg ? C.w : C.dark, border: 'none', borderBottom: `1px solid ${C.brd}`, cursor: 'pointer', fontSize: 13, fontWeight: activeSeg === seg ? 700 : 400 }}>
                  {SEG_LABELS[seg]}
                  <span style={{ display: 'block', fontSize: 11, color: activeSeg === seg ? '#93C5FD' : C.mut, marginTop: 2 }}>{nBubbles} burbujas activas</span>
                </button>
              )
            })}
          </div>

          {/* BBC View */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ background: C.w, borderRadius: 14, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.brd}`, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.night }}>BBC — {SEG_LABELS[activeSeg]}</div>
                    <div style={{ fontSize: 12, color: C.mut, marginTop: 3 }}>Haz <strong>click en cualquier burbuja</strong> para editar · El volumen viene del Excel AEADE según el Trim</div>
                  </div>
                  {/* Scope selector */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {SCOPES.map((s: string) => (
                      <button key={s} onClick={() => setBbcScope(s)}
                        style={{ padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: bbcScope === s ? C.navy : '#F1F5F9', color: bbcScope === s ? '#fff' : '#475569' }}>
                        {s === 'NACIONAL' ? '🌎 Nacional' : s === 'ZONA ORGU' ? '📍 Zona Orgu' : s}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => {
                  const seg = activeSeg
                  const newEntry = { marca: '', modelo: '', trim: '', combustible: 'Gasolina', precio: null }
                  const newIdx = (data.precios_competidores[seg] || []).length
                  mutate((d:any) => { if (!d.precios_competidores[seg]) d.precios_competidores[seg]=[]; d.precios_competidores[seg].push({...newEntry}) })
                  setDrawer({ entry: newEntry, segKey: seg, idx: newIdx, computedVols: {} } as any)
                }}
                  style={{ padding: '8px 18px', background: C.sky, color: C.w, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  + Nueva burbuja
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <BBCView data={data} seg={activeSeg} scope={bbcScope} onClickBubble={onBubbleClick} />
              </div>

              {/* Tabla de entradas del segmento */}
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.mut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 8 }}>Todas las entradas de este segmento</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(data.precios_competidores[activeSeg] || []).map((e: any, i: number) => (
                    <button key={i} onClick={() => setDrawer({ entry: e, segKey: activeSeg, idx: i, computedVols: computeAllVols(activeSeg, i) } as any)}
                      style={{ background: e.precio ? '#EFF6FF' : '#FFFBEB', border: `1.5px solid ${e.precio ? C.sky : C.yellow}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontWeight: 700, color: C.navy }}>{e.marca}</span>
                      <span style={{ color: '#475569' }}> {e.modelo}</span>
                      {e.trim && <span style={{ color: C.mut, fontFamily: 'monospace' }}> · {e.trim}</span>}
                      <br />
                      {e.precio ? <span style={{ color: C.sky, fontWeight: 700 }}>${Number(e.precio).toLocaleString()}</span> : <span style={{ color: C.yellow }}>⚠ sin precio</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FILTROS TAB ═══ */}
      {tab === 'filtros' && (
        <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ background: '#EFF6FF', border: `1px solid #BFDBFE`, borderRadius: 10, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#1E40AF' }}>
            <strong>💡 Cómo funciona:</strong> Cada término se busca dentro del nombre del modelo en los datos AEADE. Ej: <code>SPORTAGE</code> suma todas las filas que contengan esa palabra. Separa con coma. Deja vacío para excluir esa marca.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 18 }}>
            {Object.entries(mf).map(([seg, brands]: [string, any]) => (
              <div key={seg} style={{ background: C.w, borderRadius: 12, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', background: C.navy, color: C.w, fontSize: 13, fontWeight: 700 }}>{FILTER_LABELS[seg] || seg}</div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {Object.entries(brands).map(([brand, terms]: [string, any]) => (
                    <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 95, fontSize: 13, fontWeight: 700, color: brand === 'FORD' ? C.sky : C.dark, flexShrink: 0 }}>{brand === 'FORD' && '🔵 '}{brand}</div>
                      <input value={Array.isArray(terms) ? terms.join(', ') : ''} onChange={e => setFilter(seg, brand, e.target.value)}
                        style={{ flex: 1, padding: '6px 9px', border: `1.5px solid ${C.brd}`, borderRadius: 7, fontSize: 12, fontFamily: 'monospace', outline: 'none' }} placeholder="término1, término2" />
                      <span style={{ fontSize: 11, color: Array.isArray(terms) && terms.length > 0 ? C.green : C.yellow, minWidth: 32, textAlign: 'right', fontWeight: 700 }}>
                        {Array.isArray(terms) ? terms.length : 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        {tab === 'fordcards' && (
          <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#1E40AF' }}>
              <strong>Ford Cards:</strong> Card de Ford en cada tab. Modelo, precio, combustible, volumen. Vacío = usa Excel.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 18 }}>
              {Object.entries(data.ford_cards || {}).map(([key, card]: [string, any]) => (
                <div key={key} style={{ background: C.w, borderRadius: 12, border: '1px solid ' + C.brd, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', background: C.navy, color: C.w, fontSize: 13, fontWeight: 700 }}>{INS_LABELS[key] || key}</div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {(['model','price','fuel'] as string[]).map((f,fi) => (
                        <div key={f}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>{['MODELO','PRECIO $','COMBUSTIBLE'][fi]}</label>
                          <input type={f==='price'?'number':'text'} value={card[f]??''} onChange={e => mutate((d:any)=>{ d.ford_cards[key][f] = f==='price' ? (e.target.value ? Number(e.target.value) : null) : e.target.value })}
                            style={{ width:'100%', padding:'7px 10px', border:'1.5px solid '+C.brd, borderRadius:7, fontSize:13, fontWeight:700, outline:'none', boxSizing:'border-box' as any }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid ' + C.brd }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>VOLUMEN - vacio = usa Excel</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {(['v26','v25'] as string[]).map((f,fi) => (
                          <div key={f}>
                            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>{['2026 YTD','2025 YTD'][fi]}</label>
                            <input type='number' value={card[f]??''} placeholder='Auto Excel' onChange={e => mutate((d:any)=>{ d.ford_cards[key][f] = e.target.value ? Number(e.target.value) : null })}
                              style={{ width:'100%', padding:'8px 10px', border:'1.5px solid '+(card[f]!=null?C.sky:C.brd), borderRadius:7, fontSize:16, fontWeight:card[f]!=null?700:400, color:card[f]!=null?C.navy:'#94A3B8', outline:'none', boxSizing:'border-box' as any, background:card[f]!=null?'#EFF6FF':C.w }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', background:'#F0F9FF', borderRadius:10 }}>
                      <div style={{ flex:1 }}><div style={{ fontWeight:700, color:C.dark }}>{card.model||'--'}</div><div style={{ fontSize:12, color:C.sky }}>${(card.price||0).toLocaleString()} . {card.fuel||'--'}</div></div>
                      <div style={{ textAlign:'right' }}>{card.v26!=null ? <div style={{ fontSize:24, fontWeight:700, color:C.navy }}>{card.v26}</div> : <div style={{ fontSize:12, color:C.mut, fontStyle:'italic' }}>Auto Excel</div>}{card.v25!=null && <div style={{ fontSize:11, color:C.mut }}>vs {card.v25}</div>}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ═══ INSIGHTS TAB ═══ */}
      {tab === 'insights' && (
        <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ background: '#F0FDF4', border: `1px solid #BBF7D0`, borderRadius: 10, padding: '12px 20px', marginBottom: 20, fontSize: 13, color: '#166534' }}>
            <strong>💬 Insights:</strong> Son los bullets de análisis que aparecen en cada tab del reporte. Edítalos y guarda.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 18 }}>
            {Object.entries(INS_LABELS).map(([key, label]) => (
              <div key={key} style={{ background: C.w, borderRadius: 12, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', background: '#1E3A5F', color: C.w, fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {label}
                  <button onClick={() => addInsight(key)}
                    style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', color: C.w, border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>+ Agregar</button>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {((ins[key] || [])).map((text: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: C.sky, fontSize: 18, lineHeight: '34px', flexShrink: 0 }}>·</span>
                      <textarea value={text} onChange={e => setInsight(key, i, e.target.value)} rows={2}
                        style={{ flex: 1, padding: '7px 10px', border: `1.5px solid ${C.brd}`, borderRadius: 7, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
                      <button onClick={() => removeInsight(key, i)}
                        style={{ background: '#FEE2E2', border: 'none', color: C.red, cursor: 'pointer', borderRadius: 6, width: 28, height: 28, fontSize: 14, flexShrink: 0, marginTop: 3 }}>×</button>
                    </div>
                  ))}
                  {(!ins[key] || ins[key].length === 0) && <div style={{ color: C.mut, fontSize: 13, fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>Sin insights</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Drawer */}
      {drawer && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }} />
          <EditDrawer entry={drawer.entry} segKey={drawer.segKey} idx={drawer.idx} computedVols={(drawer as any).computedVols}
            onSave={onDrawerSave} onDelete={onDrawerDelete} onClose={() => setDrawer(null)} />
        </>
      )}
    </div>
  )
}
