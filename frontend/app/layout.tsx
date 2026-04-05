import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QueryLens — SQL Query Analyzer',
  description: 'Understand and compare SQL queries with visual execution flow diagrams',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
