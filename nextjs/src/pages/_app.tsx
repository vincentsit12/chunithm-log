import "../../styles/globals.css"
// import "../../styles/clear.css"
import "../../styles/utils.css"
import "../../styles/common.css"

import localFont from 'next/font/local';


import { SessionProvider } from "next-auth/react"

import type { AppProps } from 'next/app'
import Head from "next/head"
import Header from "components/Header"
import { Router } from "next/router"
import NProgress from 'nprogress'
import { useEffect } from "react"
import { Session } from "next-auth"
import classNames from "classnames";
NProgress.configure({ showSpinner: false });


const myFont = localFont({ src: '../fonts/MPLUS1-VariableFont_wght.woff2', display: "swap", preload : true });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{
  session: Session;
}>) {
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
      <main className={classNames(myFont.className)}>
        <Header />
        <Component  {...pageProps} />
      </main>
    </SessionProvider>
  )
}