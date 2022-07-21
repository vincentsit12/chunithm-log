import "../../styles/globals.css"

import "../../styles/common.css"
import { SessionProvider } from "next-auth/react"

import type { AppProps } from 'next/app'
import Head from "next/head"

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head><title>Chunithm Log</title></Head>
        <Component {...pageProps} />
    </SessionProvider>

  )
}