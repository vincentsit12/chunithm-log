import "../../styles/globals.css"
import "../../styles/clear.css"
import "../../styles/utils.css"
import "../../styles/common.css"


import { SessionProvider } from "next-auth/react"

import type { AppProps } from 'next/app'
import Head from "next/head"
import Header from "components/Header"

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head><title>Chuni-Log</title></Head>
      <Header />
      <Component {...pageProps} />
    </SessionProvider>

  )
}