export interface MercadoRow {
  cat: string
  y2023: number
  y2024: number
  y2025: number
  y2026: number
}

export interface FordRow {
  cat: string
  y2023: number
  y2024: number
  y2025: number
  y2026: number
}

export interface SuvSegmento {
  seg: string
  y2024: number
  y2025: number
  y2026: number
  fcts2026: number
}

export interface BrandYearRow {
  year: string
  [brand: string]: number | string | null
}

export interface ProvinciaData {
  [provincia: string]: BrandYearRow[]
}

export interface ReportData {
  report_month: string
  mercado_nacional: MercadoRow[]
  ford_nacional: FordRow[]
  suv_segmentos: SuvSegmento[]
  suv_25_40_gas: ProvinciaData
  suv_25_40_fhev: ProvinciaData
  suv_40_50: ProvinciaData
  suv_55_80: ProvinciaData
  suv_60_80: ProvinciaData
  suv_80plus: ProvinciaData
  pick_diesel: ProvinciaData
  pick_fullsize: ProvinciaData
  wl_25_40_gas: { [prov: string]: { [brand: string]: number | null } }
  wl_25_40_fhev: { [prov: string]: { [brand: string]: number | null } }
  wl_40_50: { [prov: string]: { [brand: string]: number | null } }
  wl_55_80: { [prov: string]: { [brand: string]: number | null } }
}
