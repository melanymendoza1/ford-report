// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'

const GITHUB_REPO = 'melanymendoza1/ford-report'
const GITHUB_FILE = 'public/report_data.json'
const PASSWORD = 'orgu2026'

const C = { night: '#081534', navy: '#133A7C', steel: '#2A6BAC', sky: '#47A8E5', bg: '#F0F4F8', w: '#fff', brd: '#E2E8F0', red: '#DC2626', green: '#059669' }

const SEGMENT_LABELS: Record<string, string> = {
  'SUV GAS 25 - 40': 'Gas 25-40K',
  'SUV  HEV 25 - 40': 'HEV 25-40K',
  'SUV  HEV 40 - 50': 'HEV 40-50K',
  'SUV  55 - 80 everest': 'Everest 55-80K',
  'SUV  55 - 80 explorer': 'Explorer Active 60-80K',
  'SUV  80 plus expedition': 'Expedition +80K',
  'SUV  80 plus explorer': 'Explorer Platinum +80K',
  'Pick up TM': 'Ranger XL (TM)',
  'Pick up TA': 'Ranger XLT (TA)',
  'Full size Pick up': 'Full Size F-150',
}

const FILTER_LABELS: Record<string, string> = {
  suv_gas_25_40: 'Gas 25-40K', suv_hib_25_40: 'HEV 25-40K', suv_hib_40_50: 'HEV 40-50K',
  suv_55_80_everest: 'Everest', suv_55_80_explorer: 'Explorer Active',
  suv_80plus_expedition: 'Expedition', suv_80plus_bronco: 'Bronco',
  suv_80plus_explorer_plat: 'Explorer Platinum', pu_diesel_ranger_xl: 'Ranger XL',
  pu_diesel_ranger_xlt: 'Ranger XLT', pu_fullsize_f150_xlt: 'F-150 XLT',
  pu_fullsize_f150_lariat_plat: 'F-150 Lariat/Platinum', pu_fullsize_all: 'Full Size Total',
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [token, setToken] = useState('')
  const [data, setData] = useState<any>(null)
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'precios' | 'filtros'>('precios')
  const [activeSeg, setActiveSeg] = useState('SUV GAS 25 - 40')
  const [msg, setMsg] = useState('')

  const fetchData = useCallback(async (tok: string) => {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
      headers: { Authorization: `token ${tok}`, Accept: 'application/vnd.github.v3+json' }
    })
    const json = await res.json()
    if (!json.sha) { setMsg('❌ Token inválido o sin acceso'); return }
    setSha(json.sha)
    setData(JSON.parse(atob(json.content.replace(/\n/g, ''))))
  }, [])

  const saveData = async () => {
    setSaving(true); setMsg('')
    try {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Admin: actualización manual de precios/filtros', content, sha })
      })
      const json = await res.json()
      if (json.content) {
        setSha(json.content.sha); setSaved(true)
        setMsg('✅ Guardado. Vercel deployará en ~30 segundos.')
        setTimeout(() => setSaved(false), 4000)
      } else { setMsg('❌ Error: ' + (json.message || 'desconocido')) }
    } catch (e: any) { setMsg('❌ ' + e.message) }
    setSaving(false)
  }

  const handleLogin = () => {
    if (pw !== PASSWORD) { setMsg('Contraseña incorrecta'); return }
    if (!token) { setMsg('Ingresa el GitHub token'); return }
    setAuth(true)
    setMsg('Cargando datos...')
    fetchData(token).then(() => setMsg(''))
  }

  if (!auth) return (
    <div style={{ minHeight: '100vh', background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.w, borderRadius: 16, padding: 40, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.night }}>Panel Admin</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Orgu Ford · Market Report</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>CONTRASEÑA</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '10px 14px', border: `2px solid ${C.brd}`, borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} placeholder="••••••••" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>GITHUB TOKEN</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '10px 14px', border: `2px solid ${C.brd}`, borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} placeholder="ghp_..." />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Pide el token a Mateo o Diego</div>
        </div>
        <button onClick={handleLogin}
          style={{ width: '100%', padding: '12px 0', background: C.navy, color: C.w, border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Entrar →
        </button>
        {msg && <div style={{ marginTop: 12, color: C.red, fontSize: 13, textAlign: 'center' }}>{msg}</div>}
      </div>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.w, fontSize: 18 }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>Cargando datos desde GitHub...</div>
    </div>
  )

  const pc = data.precios_competidores || {}
  const mf = data.model_filters || {}

  const updatePrecio = (seg: string, idx: number, field: string, val: any) => {
    setData((prev: any) => {
      const d = JSON.parse(JSON.stringify(prev))
      d.precios_competidores[seg][idx][field] = field === 'precio' ? (val === '' ? null : Number(val)) : val
      return d
    })
  }
  const addPrecio = (seg: string) => setData((prev: any) => {
    const d = JSON.parse(JSON.stringify(prev))
    d.precios_competidores[seg].push({ marca: '', modelo: '', trim: '', combustible: 'Gasolina', precio: null })
    return d
  })
  const removePrecio = (seg: string, idx: number) => setData((prev: any) => {
    const d = JSON.parse(JSON.stringify(prev)); d.precios_competidores[seg].splice(idx, 1); return d
  })
  const updateFilter = (seg: string, brand: string, val: string) => setData((prev: any) => {
    const d = JSON.parse(JSON.stringify(prev))
    d.model_filters[seg][brand] = val.split(',').map((s: string) => s.trim()).filter(Boolean)
    return d
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.night, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ color: C.sky, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Orgu Ford · Admin</div>
          <div style={{ color: C.w, fontSize: 18, fontWeight: 700 }}>Panel de edición · Market Report</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {msg && <div style={{ fontSize: 13, color: msg.startsWith('✅') ? '#4ADE80' : '#FCA5A5', maxWidth: 320 }}>{msg}</div>}
          <button onClick={saveData} disabled={saving}
            style={{ padding: '10px 28px', background: saved ? C.green : C.sky, color: C.w, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar y Deployar'}
          </button>
        </div>
      </div>

      <div style={{ background: C.w, borderBottom: `1px solid ${C.brd}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {(['precios', 'filtros'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '14px 28px', background: 'none', border: 'none', borderBottom: activeTab === tab ? `3px solid ${C.sky}` : '3px solid transparent', color: activeTab === tab ? C.sky : '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {tab === 'precios' ? '🏷️ Precios y Competidores' : '🔧 Filtros de Modelos'}
          </button>
        ))}
      </div>

      <div style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'precios' && (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ width: 210, flexShrink: 0 }}>
              <div style={{ background: C.w, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                {Object.keys(pc).map(seg => (
                  <button key={seg} onClick={() => setActiveSeg(seg)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', background: activeSeg === seg ? C.navy : 'none', color: activeSeg === seg ? C.w : C.night, border: 'none', borderBottom: `1px solid ${C.brd}`, cursor: 'pointer', fontSize: 13, fontWeight: activeSeg === seg ? 700 : 400 }}>
                    {SEGMENT_LABELS[seg] || seg}
                    <span style={{ display: 'block', fontSize: 11, color: activeSeg === seg ? '#93C5FD' : '#94A3B8', marginTop: 2 }}>{pc[seg]?.length} entradas</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ background: C.w, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.brd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.night }}>{SEGMENT_LABELS[activeSeg] || activeSeg}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>El campo "Trim" debe coincidir exactamente con el texto del Excel AEADE (ej: GT, GTL, GLX, Core)</div>
                  </div>
                  <button onClick={() => addPrecio(activeSeg)}
                    style={{ padding: '8px 20px', background: C.sky, color: C.w, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Agregar</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Marca', 'Modelo', 'Trim', 'Combustible', 'Precio $', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${C.brd}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(pc[activeSeg] || []).map((e: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.brd}`, background: e.precio ? C.w : '#FFFBEB' }}>
                        {(['marca', 'modelo', 'trim', 'combustible'] as const).map(field => (
                          <td key={field} style={{ padding: '8px 10px' }}>
                            <input value={e[field] || ''} onChange={ev => updatePrecio(activeSeg, i, field, ev.target.value)}
                              style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.brd}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'transparent' }} placeholder={field} />
                          </td>
                        ))}
                        <td style={{ padding: '8px 10px', width: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>$</span>
                            <input type="number" value={e.precio ?? ''} onChange={ev => updatePrecio(activeSeg, i, 'precio', ev.target.value)}
                              style={{ flex: 1, padding: '7px 8px', border: `1px solid ${C.brd}`, borderRadius: 6, fontSize: 13, fontWeight: 700, color: C.navy, outline: 'none', boxSizing: 'border-box', background: 'transparent' }} placeholder="0" />
                          </div>
                        </td>
                        <td style={{ padding: '8px 8px', width: 36 }}>
                          <button onClick={() => removePrecio(activeSeg, i)}
                            style={{ background: '#FEE2E2', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16, borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: `1px solid ${C.brd}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Burbujas activas en BBC</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(pc[activeSeg] || []).filter((e: any) => e.precio && e.marca).map((e: any, i: number) => (
                      <div key={i} style={{ background: C.w, border: `1px solid ${C.brd}`, borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: C.navy }}>{e.marca}</span>
                        {e.modelo && <span style={{ color: '#64748B' }}> {e.modelo}</span>}
                        {e.trim && <span style={{ color: '#94A3B8' }}> {e.trim}</span>}
                        <span style={{ color: C.sky, fontWeight: 700, marginLeft: 6 }}>${Number(e.precio).toLocaleString()}</span>
                      </div>
                    ))}
                    {(pc[activeSeg] || []).filter((e: any) => !e.precio && e.marca).map((e: any, i: number) => (
                      <div key={i} style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#92400E' }}>
                        ⚠️ {e.marca} {e.modelo} {e.trim} (sin precio)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'filtros' && (
          <div>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 20px', marginBottom: 24, fontSize: 13, color: '#1E40AF' }}>
              <strong>ℹ️ Cómo funcionan los filtros:</strong> Cada término se busca en los datos AEADE. Si una marca tiene "SPORTAGE" como término, se suman todas las unidades cuya clave contenga "SPORTAGE". Deja vacío si no quieres filtrar esa marca. Separa términos con coma.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
              {Object.entries(mf).map(([seg, brands]: [string, any]) => (
                <div key={seg} style={{ background: C.w, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', background: C.navy, color: C.w, fontSize: 14, fontWeight: 700 }}>{FILTER_LABELS[seg] || seg}</div>
                  <div style={{ padding: '12px 16px' }}>
                    {Object.entries(brands).map(([brand, terms]: [string, any]) => (
                      <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 120, fontSize: 13, fontWeight: 700, color: brand === 'FORD' ? C.sky : C.night, flexShrink: 0 }}>{brand}</div>
                        <input value={Array.isArray(terms) ? terms.join(', ') : ''} onChange={e => updateFilter(seg, brand, e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', border: `1px solid ${C.brd}`, borderRadius: 6, fontSize: 12, outline: 'none' }} placeholder="término1, término2" />
                        <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, minWidth: 60 }}>{Array.isArray(terms) ? terms.join(', ') || '—' : '—'}</span>
                      </div>
                    ))}
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
