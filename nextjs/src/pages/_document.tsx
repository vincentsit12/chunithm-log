// pages/_document.js

import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
    render() {
        return (
            <Html lang='en'>
                <title>Chuni-Log</title>

                <Head>
                    {/* <meta name="viewport" content="width=device-width"></meta> */}
                    <meta name='description' content="chunithm international ver score viewer"></meta>
                    <meta name="theme-color" content="rgb(20, 49, 123)"></meta>
                    <link rel="icon" href="/logo.png" />
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

                    {/* <link href="https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/> */}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument