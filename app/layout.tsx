import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Análisis de Mercado · Orgu Ford',
  description: 'Reporte mensual de mercado automotriz Ecuador',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <style>{`
          @font-face {
            font-family: 'FordF1';
            src: url('/fonts/FordF1TC-Regular.otf') format('opentype');
            font-weight: 400;
            font-display: swap;
          }
          @font-face {
            font-family: 'FordF1';
            src: url('/fonts/FordF1TC-Medium.otf') format('opentype');
            font-weight: 500;
            font-display: swap;
          }
          @font-face {
            font-family: 'FordF1';
            src: url('/fonts/FordF1TC-Bold.otf') format('opentype');
            font-weight: 700;
            font-display: swap;
          }
          * { font-family: 'FordF1', system-ui, sans-serif !important; }
        `}</style>
      </head>
      <body style={{background:'#F4F6FA', color:'#0F1C2E', margin:0}}>{children}</body>
    </html>
  )
}