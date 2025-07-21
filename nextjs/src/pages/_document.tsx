// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document'


class MyDocument extends Document {
    render() {
        return (
            <Html lang='en'>
                <Head>
                    {/* <meta name="viewport" content="width=device-width"></meta> */}
                    <meta name='description' content="Chunithm international ver score viewer"></meta>
                    {/* <meta name="theme-color" content="rgb(20, 49, 123)"></meta> */}
                    <link rel="icon" href="/logo.png" />
                    {/* <link href="https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@400;500;700&display=swap" rel="stylesheet"/> */}
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