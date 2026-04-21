#!/usr/bin/env python3
"""
COSTADRON / ORGU FORD — Parser de datos AEADE
Uso: python parser.py <ruta_al_excel.xlsx>
Genera: public/report_data.json
"""

import json
import sys
import os
from datetime import datetime
from openpyxl import load_workbook

PROVINCES = ['NACIONAL', 'PICHINCHA', 'GUAYAS', 'MANABÍ', 'EL ORO']

def safe_num(v):
    try:
        f = float(v)
        return None if (f != f) else f  # NaN check
    except:
        return None

def is_year(v):
    return v in (2023, 2024, 2025, 2026, '2023', '2024', '2025', '2026')

def extract_by_province(ws):
    rows = list(ws.iter_rows(min_row=1, max_row=400, min_col=1, max_col=55, values_only=True))
    result = {}
    current_prov = 'NACIONAL'
    i = 0
    while i < len(rows):
        row = rows[i]
        if row[0] == 'Provincia':
            pv = str(row[1]) if row[1] else ''
            current_prov = 'NACIONAL' if pv in ('(Varios elementos)', 'All') else pv
        if row[0] == 'Etiquetas de fila':
            header = list(row)
            data_rows = []
            for r in rows[i+1:]:
                if r[0] is None or r[0] == 'Provincia': break
                if r[0] == 'WINNERS AND LOSERS': break
                data_rows.append(list(r))
            if data_rows and is_year(data_rows[0][0]):
                if current_prov not in result:
                    named = []
                    for dr in [r for r in data_rows if r[0] != 'Total general']:
                        d = {'year': str(dr[0])}
                        for j, h in enumerate(header[1:], 1):
                            if h and 'col_' not in str(h) and 'Total' not in str(h):
                                val = dr[j] if j < len(dr) else None
                                d[str(h)] = val if isinstance(val, (int, float)) else None
                        named.append(d)
                    result[current_prov] = named
        i += 1
    return result

def extract_winners_losers(ws):
    rows = list(ws.iter_rows(min_row=1, max_row=400, min_col=1, max_col=55, values_only=True))
    result = {}
    current_prov = 'NACIONAL'
    header = None
    for row in rows:
        if row[0] == 'Provincia':
            pv = str(row[1]) if row[1] else ''
            current_prov = 'NACIONAL' if pv in ('(Varios elementos)', 'All') else pv
        if row[0] == 'Etiquetas de fila':
            header = list(row)
        if row[0] == 'WINNERS AND LOSERS' and header and current_prov not in result:
            wl = {}
            for j, h in enumerate(header[1:], 1):
                if h and 'col_' not in str(h) and 'Total' not in str(h):
                    wl[str(h)] = safe_num(row[j] if j < len(row) else None)
            result[current_prov] = wl
    return result

def extract_pickup(ws):
    rows = list(ws.iter_rows(min_row=1, max_row=400, min_col=1, max_col=20, values_only=True))
    result = {}
    current_prov = 'NACIONAL'
    i = 0
    while i < len(rows):
        row = rows[i]
        if row[0] == 'Provincia':
            pv = str(row[1]) if row[1] else ''
            current_prov = 'NACIONAL' if pv in ('(Varios elementos)', 'All') else pv
        if (row[0] is None and row[1] and
                isinstance(row[1], str) and row[1] not in ('Etiquetas de columna',) and
                i+1 < len(rows) and rows[i+1][0] == 'Etiquetas de fila'):
            brand_header = list(row)
            data_rows = []
            for r in rows[i+2:]:
                if r[0] is None or r[0] == 'Provincia': break
                if r[0] == 'Total general': continue
                data_rows.append(list(r))
            if data_rows and current_prov not in result:
                named = []
                for dr in data_rows:
                    d = {'year': str(dr[0])}
                    for j, brand in enumerate(brand_header[1:], 1):
                        if brand and 'Total' not in str(brand):
                            v = dr[j] if j < len(dr) else None
                            d[str(brand)] = v if isinstance(v, (int, float)) else None
                    named.append(d)
                result[current_prov] = named
        i += 1
    return result

def detect_report_month(wb):
    """Detect report month AND number of months from data"""
    months_es = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    try:
        ws = wb['PRIMERA PARTE']
        rows = list(ws.iter_rows(min_row=1, max_row=25, min_col=1, max_col=8, values_only=True))
        for row in rows:
            if row[0] == 'AñoMes':
                val = str(row[1]) if row[1] else 'All'
                if val != 'All':
                    if len(val) == 6 and val.isdigit():
                        month_num = int(val[4:6])
                        year = val[:4]
                        # Datos cerrados = mes anterior al actual
                        months_ytd = month_num - 1
                        if months_ytd < 1:
                            months_ytd = 1
                        return months_es[months_ytd-1] + ' ' + year, months_ytd
    except:
        pass

    now = datetime.now()
    months_ytd = now.month - 1 if now.month > 1 else 1
    return months_es[months_ytd-1] + ' ' + str(now.year), months_ytd

def main(excel_path):
    print(f"Leyendo: {excel_path}")
    wb = load_workbook(excel_path, read_only=False, data_only=True)

    report = {}

    # Detect month
    report_month, months_ytd = detect_report_month(wb)
    report['report_month'] = report_month
    report['months_ytd'] = months_ytd
    print(f"Mes detectado: {report_month} ({months_ytd} meses YTD)")

    # 1. Mercado nacional total
    ws = wb['PRIMERA PARTE']
    rows_fp = list(ws.iter_rows(min_row=1, max_row=80, min_col=1, max_col=8, values_only=True))
    for i, row in enumerate(rows_fp):
        if row[0] == 'Etiquetas de fila' and row[1] == '2023':
            nat = []
            for r in rows_fp[i+1:]:
                if r[0] is None: break
                nat.append({'cat': r[0], 'y2023': r[1] or 0, 'y2024': r[2] or 0,
                            'y2025': r[3] or 0, 'y2026': r[4] or 0})
            report['mercado_nacional'] = nat
            break

    # 2. Ford nacional
    for i, row in enumerate(rows_fp):
        if row[0] == 'Marca' and row[1] == 'FORD':
            for j in range(i, min(i+20, len(rows_fp))):
                if rows_fp[j][0] == 'Etiquetas de fila':
                    ford_rows = []
                    for r in rows_fp[j+1:]:
                        if r[0] is None: break
                        ford_rows.append({'cat': r[0], 'y2023': r[1] or 0, 'y2024': r[2] or 0,
                                          'y2025': r[3] or 0, 'y2026': r[4] or 0})
                    report['ford_nacional'] = ford_rows
                    break
            break

    # 3. SUV segmentos
    ws2 = wb['CAT ANALISIS']
    rows_cat = list(ws2.iter_rows(min_row=1, max_row=30, min_col=1, max_col=8, values_only=True))
    for i, row in enumerate(rows_cat):
        if row[0] == 'Etiquetas de fila' and row[1] == '2024':
            segs = []
            for r in rows_cat[i+1:]:
                if r[0] is None or r[0] == 'CAT': break
                if r[0] != 'Total general':
                    segs.append({'seg': r[0], 'y2024': r[1] or 0, 'y2025': r[2] or 0,
                                 'y2026': r[3] or 0, 'fcts2026': round(r[4] or 0)})
            report['suv_segmentos'] = segs
            break

    # 4. Marcas por rango y provincia
    sheets_map = {
        'suv_25_40_gas':  'MARCAS 25-40K',
        'suv_25_40_fhev': 'MARCAS 25-40K FHEV',
        'suv_40_50':      'MARCAS 40K -50K',
        'suv_55_80':      'MARCAS 55K -80K',
        'suv_60_80':      'MARCAS 60K -80K',
        'suv_80plus':     'MARCAS +80K1',
    }
    for key, sheet in sheets_map.items():
        print(f"  Procesando {sheet}...")
        report[key] = extract_by_province(wb[sheet])

    # 5. Winners & Losers
    wl_map = {
        'wl_25_40_gas':  'MARCAS 25-40K',
        'wl_25_40_fhev': 'MARCAS 25-40K FHEV',
        'wl_40_50':      'MARCAS 40K -50K',
        'wl_55_80':      'MARCAS 55K -80K',
    }
    for key, sheet in wl_map.items():
        report[key] = extract_winners_losers(wb[sheet])

    # 6. Pick Ups
    print("  Procesando Pick Ups...")
    report['pick_diesel']   = extract_pickup(wb['MARCAS PICKDSL'])
    report['pick_fullsize'] = extract_pickup(wb['MARCAS FULL SIZE'])

    wb.close()

    # Write output
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'report_data.json')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)

    print(f"\nListo! Generado en: {out_path}")
    print(f"Mes del reporte: {report['report_month']}")
    print(f"Categorías nacionales: {len(report.get('mercado_nacional', []))}")
    print(f"Provincias en SUV 55-80K: {list(report.get('suv_55_80', {}).keys())}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python parser.py <ruta_excel.xlsx>")
        print("Ejemplo: python parser.py ~/Downloads/MARKET_OVERVIEW.xlsx")
        sys.exit(1)
    main(sys.argv[1])
