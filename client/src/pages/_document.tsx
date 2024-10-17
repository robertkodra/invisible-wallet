import Document, { Head, Html, Main, NextScript } from "next/document";

import { AppConfig } from "../utils/AppConfig";

// Need to create a custom _document because i18n support is not compatible with `next export`.
class MyDocument extends Document {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return (
      <Html lang={AppConfig.locale}>
        <Head>
          <link rel="icon" href="/favicon.ico" />
          {/* If you want to support older browsers with a fallback .ico file */}
          <link rel="alternate icon" href="/favicon.ico" />
          {/* You can also add a web app manifest link if you have one */}
          {/* <link rel="manifest" href="/site.webmanifest" /> */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
