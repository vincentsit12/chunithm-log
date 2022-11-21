import "../../styles/globals.css"
// import "../../styles/clear.css"
import "../../styles/utils.css"
import "../../styles/common.css"


import { SessionProvider } from "next-auth/react"

import type { AppProps } from 'next/app'
import Head from "next/head"
import Header from "components/Header"
import { Router } from "next/router"
import NProgress from 'nprogress'
import { useEffect } from "react"
NProgress.configure({showSpinner: false});


export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  useEffect(() => {
    Router.events.on("routeChangeStart", (url) => {
      NProgress.start()
    });
    Router.events.on("routeChangeComplete", (url) => {
      NProgress.done(false)
    });
  }, [])
  return (
    <SessionProvider session={session}>
      <Head><title>Chuni-Log</title></Head>
      <Header />
      <Component {...pageProps} />
    </SessionProvider>

  )
}