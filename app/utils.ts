export const N = (v: number | null | undefined): string =>
  v ? Number(v).toLocaleString('es-EC') : '—'

export const PCT = (a: number | null | undefined, b: number | null | undefined): string | null => {
  if (!a || !b) return null
  return (((a - b) / b) * 100).toFixed(1)
}

export const BRAND_COLORS: Record<string, string> = {
  'FORD':           '#133A7C',
  'CHEVROLET':      '#E07020',
  'TOYOTA':         '#C0392B',
  'MITSUBISHI':     '#7D1935',
  'KIA':            '#0F2D52',
  'MAZDA':          '#8B1A2A',
  'NISSAN':         '#1A4E5E',
  'RAM':            '#922B21',
  'HYUNDAI':        '#1A3A6C',
  'SUBARU':         '#1A5276',
  'BYD':            '#145A32',
  'SUZUKI':         '#784212',
  'GREAT WALL':     '#2E4057',
  'JETOUR':         '#4A235A',
  'RENAULT':        '#C0392B',
  'HONDA':          '#636363',
}

export const getBrandColor = (name: string): string => {
  const u = name.toUpperCase()
  for (const [brand, color] of Object.entries(BRAND_COLORS)) {
    if (u.includes(brand)) return color
  }
  // deterministic fallback
  const palette = ['#2A6BAC','#47A8E5','#6E6E6E','#4A235A','#0B4619','#1B2631']
  let hash = 0
  for (const c of u) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFF
  return palette[hash % palette.length]
}

export const shortName = (name: string): string =>
  name
    .replace('FORD . ', '')
    .replace('CHEVROLET . ', '')
    .replace('TOYOTA . ', '')
    .replace('MITSUBISHI . ', '')
    .replace('JETOUR . ', '')
    .replace('HYUNDAI . ', '')

export const PROVINCES = ['PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO'] as const
export type Province = typeof PROVINCES[number]
