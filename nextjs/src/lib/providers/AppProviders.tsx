'use client'

import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'
import { ReactNode } from 'react'

type AppProvidersProps = {
  children: ReactNode
  session?: Session | null
}

export function AppProviders({ children, session }: AppProvidersProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}