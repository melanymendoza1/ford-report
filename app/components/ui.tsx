'use client'
import { N, PCT, getBrandColor, shortName } from '../utils'

const C = {
  night:  '#081534', navy: '#133A7C', steel: '#2A6BAC', sky: '#47A8E5',
  silver: '#C6C6C6', bg: '#F4F6FA', white: '#FFFFFF', border: '#E2E8F0',
  muted: '#94A3B8', text: '#0F1C2E', win: '#166534', winBg: '#DCFCE7',
  lose: '#991B1B', loseBg: '#FEE2E2',
}

export function Delta({ a, b }: { a?: number | null; b?: number | null }) {
  const v = PCT(a, b)
  if (!v) return <span style={{ color: C.muted, fontSize: 10 }}>—</span>
  const up = parseFloat(v) >= 0
  return <span style={{ display:'inline-flex', alignItems:'center', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3, background: up ? C.winBg : C.loseBg, color: up ? C.win : C.lose }}>{up ? '▲ +' : '▼ '}{v}%</span>
}

export function BarRow({ name, val2026, val2025, maxVal, isFord=false }: { name:string; val2026:number|null; val2025:number|null; maxVal:number; isFord?:boolean }) {
  const pct = maxVal > 0 ? ((val2026||0)/maxVal)*100 : 0
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:12, fontWeight: isFord?700:600, color: isFord?C.navy:'#334155' }}>{shortName(name)}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14, fontWeight:700, color: isFord?C.navy:C.night }}>{N(val2026)}</span>
          <span style={{ fontSize:10, color:'#CBD5E1' }}>vs {N(val2025)}</span>
          <Delta a={val2026} b={val2025} />
        </div>
      </div>
      <div style={{ height:5, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background: getBrandColor(name), borderRadius:3 }} />
      </div>
    </div>
  )
}

export function InsightCard({ title, big, body, variant='blue' }: { title:string; big:string; body:string; variant?:'blue'|'amber'|'green' }) {
  const s = { blue:{ bg:'#EEF4FF', border:'#BFD4FF', title:C.navy, big:C.navy }, amber:{ bg:'#FFFBEB', border:'#FDE68A', title:'#92400E', big:'#92400E' }, green:{ bg:'#F0FDF4', border:'#BBF7D0', title:C.win, big:C.win } }[variant]
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontSize:10, fontWeight:700, color:s.title, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:16, fontWeight:700, color:s.big, lineHeight:1, marginBottom:6 }}>{big}</div>
      <p style={{ fontSize:10, color:'#64748B', lineHeight:1.5 }}>{body}</p>
    </div>
  )
}

export function ModelCard({ name, range, val2026, val2025, imgSrc }: { name:string; range:string; val2026:number|null; val2025:number|null; imgSrc?:string }) {
  const pct = PCT(val2026, val2025)
  const up = pct ? parseFloat(pct) >= 0 : null
  return (
    <div style={{ border:'1px solid #EEF4FF', borderRadius:8, background:'#F8FBFF', display:'grid', gridTemplateColumns:'110px 1fr', overflow:'hidden' }}>
      <div style={{ background:'#EEF4FF', display:'flex', alignItems:'center', justifyContent:'center', minHeight:80 }}>
        {imgSrc ? <img src={imgSrc} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:8 }}>
            <div style={{ background:C.navy, borderRadius:3, width:32, height:20, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'#fff', fontSize:7, fontWeight:900 }}>FORD</span></div>
            <span style={{ color:C.navy, fontSize:8, fontWeight:700 }}>{name.replace('Ford ','')}</span>
          </div>
        )}
      </div>
      <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', justifyContent:'center', gap:6 }}>
        <div><div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{name}</div><div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>{range}</div></div>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <span style={{ fontSize:24, fontWeight:700, lineHeight:1, color: up?C.win:C.night }}>{N(val2026)}</span>
          <span style={{ fontSize:10, color:C.muted }}>uds YTD · {pct && <strong style={{ color: up?C.win:C.lose }}>{up?'▲ +':'▼ '}{pct}%</strong>} vs 2025</span>
        </div>
      </div>
    </div>
  )
}

export function SectionDivider({ chip, title, price }: { chip:string; title:string; price?:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'24px 0 16px' }}>
      <span style={{ background:C.navy, color:'#fff', fontSize:9, fontWeight:700, letterSpacing:1, padding:'3px 9px', borderRadius:2, whiteSpace:'nowrap' }}>{chip}</span>
      <span style={{ fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color:C.navy, whiteSpace:'nowrap' }}>{title}</span>
      {price && <span style={{ background:C.sky, color:C.night, fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:2, whiteSpace:'nowrap' }}>{price}</span>}
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  )
}

export function KpiCard({ label, value, sub, delta, deltaDir, variant='default' }: { label:string; value:string; sub?:string; delta?:string; deltaDir?:'up'|'down'; variant?:'default'|'dark'|'navy'|'sky' }) {
  const s = {
    default: { bg:C.white, border:C.border, label:C.muted, val:C.night, sub:C.muted },
    dark:    { bg:C.night, border:'#1E3A6E', label:'#7BA8D4', val:'#fff', sub:'#7BA8D4' },
    navy:    { bg:C.navy,  border:C.navy,   label:'#94BFDC', val:'#fff', sub:'#94BFDC' },
    sky:     { bg:C.sky,   border:C.sky,    label:C.night,  val:C.night, sub:C.night  },
  }[variant]
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:16 }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:s.label, marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:600, lineHeight:1, letterSpacing:-0.5, color:s.val }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:s.sub, marginTop:4 }}>{sub}</div>}
      {delta && <div style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:700, marginTop:8, padding:'3px 8px', borderRadius:3, background: deltaDir==='up'?(variant==='dark'||variant==='navy'?'rgba(10,124,78,0.25)':C.winBg):(variant==='dark'||variant==='navy'?'rgba(153,27,27,0.25)':C.loseBg), color: deltaDir==='up'?(variant==='dark'||variant==='navy'?'#4ade80':C.win):(variant==='dark'||variant==='navy'?'#f87171':C.lose) }}>{deltaDir==='up'?'▲ ':'▼ '}{delta}</div>}
    </div>
  )
}
