import type { Metadata } from 'next'
import '../../styles/globals.css'
import { ReactNode } from 'react'
import { AppShell } from '@/features/layout/AppShell'
import { AppProviders } from '@/lib/providers/AppProviders'

export const metadata: Metadata = {
  title: 'Chuni-Log',
  description: 'Chunithm logbook, rating tools, and song utilities.',
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='en'>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  )
}