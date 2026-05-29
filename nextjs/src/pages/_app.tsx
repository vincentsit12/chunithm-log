import "../../styles/globals.css"

import type { AppProps } from 'next/app'
import { Router } from "next/router"
import NProgress from 'nprogress'
import { useEffect } from "react"
import { Session } from "next-auth"
import { AppShell } from "@/features/layout/AppShell"
import { AppProviders } from "@/lib/providers/AppProviders"
NProgress.configure({ showSpinner: false });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{
  session: Session;
}>) {
  useEffect(() => {
    const handleRouteChangeStart = () => {
      NProgress.start()
    }
    const handleRouteChangeComplete = () => {
      NProgress.done(false)
    }

    Router.events.on("routeChangeStart", handleRouteChangeStart)
    Router.events.on("routeChangeComplete", handleRouteChangeComplete)
    Router.events.on("routeChangeError", handleRouteChangeComplete)

    return () => {
      Router.events.off("routeChangeStart", handleRouteChangeStart)
      Router.events.off("routeChangeComplete", handleRouteChangeComplete)
      Router.events.off("routeChangeError", handleRouteChangeComplete)
    }
  }, [])

  return (
    <AppProviders session={session}>
      <AppShell>
        <Component  {...pageProps} />
      </AppShell>
    </AppProviders>
  )
}