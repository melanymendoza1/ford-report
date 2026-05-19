// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'

const REPO = 'melanymendoza1/ford-report'
const FILE = 'public/report_data.json'
const PASSWORD = 'orgu2026'
const C = {
  night: '#081534', navy: '#133A7C', steel: '#2A6BAC', sky: '#47A8E5',
  bg: '#F0F4F8', w: '#fff', brd: '#E2E8F0', red: '#DC2626', green: '#059669',
  yellow: '#F59E0B', dark: '#0F172A'
}

const SEG_LABELS: Record<string, string> = {
  'SUV GAS 25 - 40': 'Gas 25-40K', 'SUV  HEV 25 - 40': 'HEV 25-40K',
  'SUV  HEV 40 - 50': 'HEV 40-50K', 'SUV  55 - 80 everest': 'Everest 55-80K',
  'SUV  55 - 80 explorer': 'Explorer Active', 'SUV  80 plus expedition': 'Expedition +80K',
  'SUV  80 plus explorer': 'Explorer Platinum', 'Pick up TM': 'Ranger XL (TM)',
  'Pick up TA': 'Ranger XLT (TA)', 'Full size Pick up': 'Full Size',
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

const Btn = ({ children, onClick, variant = 'primary', small = false, disabled = false }: any) => {
  const bg: any = { primary: C.sky, danger: C.red, ghost: 'transparent', success: C.green, dark: C.navy }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: small ? '6px 14px' : '10px 22px', background: bg[variant] || C.sky, color: variant === 'ghost' ? C.steel : C.w, border: variant === 'ghost' ? `1px solid ${C.brd}` : 'none', borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, transition: 'opacity .15s' }}>
      {children}
    </button>
  )
}

const Input = ({ value, onChange, placeholder, type = 'text', bold = false, mono = false }: any) => (
  <input value={value ?? ''} onChange={e => onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
    type={type === 'number' ? 'number' : 'text'}
    placeholder={placeholder}
    style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.brd}`, borderRadius: 7, fontSize: 13, fontWeight: bold ? 700 : 400, fontFamily: mono ? 'monospace' : 'inherit', color: bold ? C.navy : C.dark, outline: 'none', boxSizing: 'border-box', background: C.w, transition: 'border .15s' }} />
)

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('ghtoken') || '' : '')
  const [data, setData] = useState<any>(null)
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [tab, setTab] = useState<'precios' | 'filtros' | 'insights'>('precios')
  const [activeSeg, setActiveSeg] = useState('SUV GAS 25 - 40')
  const [loginMsg, setLoginMsg] = useState('')

  const fetchData = useCallback(async (tok: string) => {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
      headers: { Authorization: `token ${tok}`, Accept: 'application/vnd.github.v3+json' }
    })
    const json = await res.json()
    if (!json.sha) { setLoginMsg('Token sin acceso al repositorio'); return false }
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
        body: JSON.stringify({ message: 'Admin: edición manual de precios/filtros/insights', content: encoded, sha })
      })
      const json = await res.json()
      if (json.content?.sha) {
        setSha(json.content.sha)
        setSaveMsg('✅ Guardado — deploy en ~30 segundos')
        setTimeout(() => setSaveMsg(''), 5000)
      } else { setSaveMsg('❌ Error: ' + (json.message || 'desconocido')) }
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

  // ── Data mutators ─────────────────────────────────────────────────────────
  const mutate = (fn: (d: any) => void) => setData((prev: any) => {
    const next = JSON.parse(JSON.stringify(prev)); fn(next); return next
  })

  const setPrecio = (seg: string, i: number, field: string, val: any) =>
    mutate(d => { d.precios_competidores[seg][i][field] = field === 'precio' ? (val === '' || val === null ? null : Number(val)) : val })

  const addRow = (seg: string) => mutate(d => d.precios_competidores[seg].push({ marca: '', modelo: '', trim: '', combustible: 'Gasolina', precio: null }))
  const removeRow = (seg: string, i: number) => mutate(d => d.precios_competidores[seg].splice(i, 1))
  const setFilter = (seg: string, brand: string, val: string) =>
    mutate(d => { d.model_filters[seg][brand] = val.split(',').map((s: string) => s.trim()).filter(Boolean) })
  const setInsight = (key: string, i: number, val: string) =>
    mutate(d => { if (!d.insights) d.insights = {}; if (!d.insights[key]) d.insights[key] = []; d.insights[key][i] = val })
  const addInsight = (key: string) => mutate(d => { if (!d.insights[key]) d.insights[key] = []; d.insights[key].push('') })
  const removeInsight = (key: string, i: number) => mutate(d => d.insights[key].splice(i, 1))

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!auth) return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.night}, #0F2B5E)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.w, borderRadius: 20, padding: '48px 40px', width: 400, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, background: C.navy, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🔐</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.night }}>Panel Admin</div>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>Orgu Ford · Market Report Editor</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${C.brd}`, borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} placeholder="••••••••" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>GitHub Token</label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${C.brd}`, borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} placeholder="ghp_..." />
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>Se guarda en tu navegador para no ingresarlo cada vez</div>
          </div>
          <button onClick={login} style={{ padding: '14px 0', background: `linear-gradient(135deg, ${C.navy}, ${C.steel})`, color: C.w, border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            Entrar al panel →
          </button>
          {loginMsg && <div style={{ textAlign: 'center', fontSize: 13, color: loginMsg.includes('✅') || loginMsg.includes('Conect') ? C.green : C.red, fontWeight: 600 }}>{loginMsg}</div>}
        </div>
      </div>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.w, textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div><div>Cargando datos...</div></div>
    </div>
  )

  const pc = data.precios_competidores || {}
  const mf = data.model_filters || {}
  const ins = data.insights || {}

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Top Bar ── */}
      <div style={{ background: C.night, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <span style={{ color: C.sky, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Admin · </span>
            <span style={{ color: C.w, fontSize: 15, fontWeight: 700 }}>Orgu Ford Market Report</span>
          </div>
          <a href="/" target="_blank" style={{ color: '#94A3B8', fontSize: 12, textDecoration: 'none', border: '1px solid #334155', padding: '4px 10px', borderRadius: 6 }}>
            👁 Ver reporte →
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith('✅') ? '#4ADE80' : '#FCA5A5', maxWidth: 300 }}>{saveMsg}</span>}
          <Btn onClick={save} disabled={saving} variant={saving ? 'ghost' : 'primary'}>
            {saving ? '⏳ Guardando...' : '💾 Guardar y Deployar'}
          </Btn>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ background: C.w, borderBottom: `1px solid ${C.brd}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {[['precios', '🏷️ Precios y Competidores'], ['filtros', '🔧 Filtros de Modelos'], ['insights', '💬 Insights del Reporte']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ padding: '15px 24px', background: 'none', border: 'none', borderBottom: tab === t ? `3px solid ${C.sky}` : '3px solid transparent', color: tab === t ? C.sky : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'color .15s' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>

        {/* ═══════════════════════════════════════════════════════
            TAB: PRECIOS
        ═══════════════════════════════════════════════════════ */}
        {tab === 'precios' && (
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Sidebar */}
            <div style={{ width: 200, flexShrink: 0 }}>
              <div style={{ background: C.w, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.brd}` }}>
                <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${C.brd}`, background: '#F8FAFC' }}>Segmentos</div>
                {Object.keys(pc).map(seg => (
                  <button key={seg} onClick={() => setActiveSeg(seg)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', background: activeSeg === seg ? C.navy : 'none', color: activeSeg === seg ? C.w : C.dark, border: 'none', borderBottom: `1px solid ${C.brd}`, cursor: 'pointer', fontSize: 13, fontWeight: activeSeg === seg ? 700 : 400 }}>
                    {SEG_LABELS[seg] || seg}
                    <span style={{ display: 'block', fontSize: 11, color: activeSeg === seg ? '#93C5FD' : '#94A3B8', marginTop: 2 }}>{pc[seg]?.filter((e: any) => e.precio)?.length}/{pc[seg]?.length} con precio</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1 }}>
              <div style={{ background: C.w, borderRadius: 12, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.night }}>{SEG_LABELS[activeSeg] || activeSeg}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                      El campo <strong>Trim</strong> debe coincidir con la palabra clave en los datos AEADE · El <strong>Precio</strong> aparece en el BBC del reporte
                    </div>
                  </div>
                  <Btn onClick={() => addRow(activeSeg)} small>+ Agregar fila</Btn>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9' }}>
                      {['#', 'Marca', 'Modelo', 'Trim (clave AEADE)', 'Combustible', 'Precio $', ''].map((h, i) => (
                        <th key={i} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${C.brd}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(pc[activeSeg] || []).map((e: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.brd}`, background: !e.precio ? '#FFFBEB' : C.w }}>
                        <td style={{ padding: '6px 12px', color: '#94A3B8', fontSize: 12, fontWeight: 700, width: 32 }}>{i + 1}</td>
                        <td style={{ padding: '6px 8px', minWidth: 110 }}>
                          <Input value={e.marca} onChange={(v: string) => setPrecio(activeSeg, i, 'marca', v)} placeholder="Marca" />
                        </td>
                        <td style={{ padding: '6px 8px', minWidth: 110 }}>
                          <Input value={e.modelo} onChange={(v: string) => setPrecio(activeSeg, i, 'modelo', v)} placeholder="Modelo" />
                        </td>
                        <td style={{ padding: '6px 8px', minWidth: 120 }}>
                          <Input value={e.trim} onChange={(v: string) => setPrecio(activeSeg, i, 'trim', v)} placeholder="ej: GT, GLX, Core..." bold mono />
                        </td>
                        <td style={{ padding: '6px 8px', minWidth: 100 }}>
                          <select value={e.combustible || 'Gasolina'} onChange={ev => setPrecio(activeSeg, i, 'combustible', ev.target.value)}
                            style={{ width: '100%', padding: '8px 8px', border: `1.5px solid ${C.brd}`, borderRadius: 7, fontSize: 13, outline: 'none', background: C.w }}>
                            {['Gasolina', 'Hibrido', 'Diésel', 'Eléctrico'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px', width: 130 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#94A3B8', fontSize: 13, flexShrink: 0 }}>$</span>
                            <Input value={e.precio} onChange={(v: any) => setPrecio(activeSeg, i, 'precio', v)} placeholder="0" type="number" bold />
                          </div>
                        </td>
                        <td style={{ padding: '6px 8px', width: 36 }}>
                          <button onClick={() => removeRow(activeSeg, i)}
                            style={{ background: '#FEE2E2', border: 'none', color: C.red, cursor: 'pointer', borderRadius: 6, width: 30, height: 30, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Preview */}
                <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: `1px solid ${C.brd}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    Vista previa BBC — burbujas activas
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(pc[activeSeg] || []).map((e: any, i: number) => (
                      e.marca ? (
                        <div key={i} style={{ border: `1.5px solid ${e.precio ? C.sky : C.yellow}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, background: e.precio ? '#EFF6FF' : '#FFFBEB' }}>
                          <span style={{ fontWeight: 700, color: C.navy }}>{e.marca}</span>
                          {e.modelo && <span style={{ color: '#475569' }}> {e.modelo}</span>}
                          {e.trim && <span style={{ color: '#94A3B8' }}> · {e.trim}</span>}
                          {e.precio ? <span style={{ color: C.sky, fontWeight: 700, marginLeft: 6 }}>${Number(e.precio).toLocaleString()}</span>
                            : <span style={{ color: C.yellow, marginLeft: 6 }}>sin precio</span>}
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: FILTROS
        ═══════════════════════════════════════════════════════ */}
        {tab === 'filtros' && (
          <div>
            <div style={{ background: '#EFF6FF', border: `1px solid #BFDBFE`, borderRadius: 10, padding: '12px 20px', marginBottom: 24, fontSize: 13, color: '#1E40AF' }}>
              <strong>💡 Cómo funciona:</strong> Cada término se busca dentro de los nombres de modelo del Excel AEADE. Si pones <code>SPORTAGE</code>, cuenta todas las filas que contengan "SPORTAGE". Separa múltiples términos con coma. <strong>Deja vacío</strong> para excluir esa marca del ranking/BBC.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
              {Object.entries(mf).map(([seg, brands]: [string, any]) => (
                <div key={seg} style={{ background: C.w, borderRadius: 12, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', background: C.navy, color: C.w, fontSize: 14, fontWeight: 700 }}>
                    {FILTER_LABELS[seg] || seg}
                  </div>
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(brands).map(([brand, terms]: [string, any]) => (
                      <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 100, fontSize: 13, fontWeight: 700, color: brand === 'FORD' ? C.sky : C.dark, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {brand === 'FORD' && <span style={{ fontSize: 10 }}>🔵</span>}{brand}
                        </div>
                        <input value={Array.isArray(terms) ? terms.join(', ') : ''}
                          onChange={e => setFilter(seg, brand, e.target.value)}
                          style={{ flex: 1, padding: '7px 10px', border: `1.5px solid ${C.brd}`, borderRadius: 7, fontSize: 12, fontFamily: 'monospace', outline: 'none', background: !Array.isArray(terms) || terms.length === 0 ? '#F8FAFC' : C.w }}
                          placeholder="término1, término2, ..." />
                        <span style={{ fontSize: 11, color: '#94A3B8', minWidth: 50, textAlign: 'right' }}>
                          {Array.isArray(terms) && terms.length > 0 ? `${terms.length} término${terms.length > 1 ? 's' : ''}` : <span style={{ color: C.yellow }}>vacío</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB: INSIGHTS
        ═══════════════════════════════════════════════════════ */}
        {tab === 'insights' && (
          <div>
            <div style={{ background: '#F0FDF4', border: `1px solid #BBF7D0`, borderRadius: 10, padding: '12px 20px', marginBottom: 24, fontSize: 13, color: '#166534' }}>
              <strong>💬 Insights:</strong> Son los bullets de análisis que aparecen en cada tab del reporte. Edítalos directamente aquí y se actualizan en el reporte al guardar.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 20 }}>
              {Object.entries(INS_LABELS).map(([key, label]) => (
                <div key={key} style={{ background: C.w, borderRadius: 12, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', background: '#1E3A5F', color: C.w, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {label}
                    <Btn onClick={() => addInsight(key)} small variant="ghost">+ Agregar</Btn>
                  </div>
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {((ins[key] || [])).map((text: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: C.sky, fontSize: 16, marginTop: 8, flexShrink: 0 }}>·</span>
                        <textarea value={text} onChange={e => setInsight(key, i, e.target.value)}
                          rows={2}
                          style={{ flex: 1, padding: '8px 10px', border: `1.5px solid ${C.brd}`, borderRadius: 7, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
                        <button onClick={() => removeInsight(key, i)}
                          style={{ background: '#FEE2E2', border: 'none', color: C.red, cursor: 'pointer', borderRadius: 6, width: 28, height: 28, fontSize: 14, flexShrink: 0, marginTop: 4 }}>×</button>
                      </div>
                    ))}
                    {(!ins[key] || ins[key].length === 0) && (
                      <div style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Sin insights — presiona + Agregar</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
