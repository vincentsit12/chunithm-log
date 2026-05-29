import classNames from 'classnames'
import { ReactNode } from 'react'
import { Header } from '@/features/navigation/Header'
import { appFont } from '@/lib/fonts'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <main className={classNames(appFont.className)}>
      <Header />
      {children}
    </main>
  )
}