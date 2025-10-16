import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Operis - Software Company Management',
  description: 'Management system for software development company',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
