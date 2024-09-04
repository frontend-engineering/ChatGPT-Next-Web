/* eslint-disable @next/next/no-page-custom-font */
import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import { getClientConfig } from "./config/client";
import Script from "next/script";
import { type Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getServerSideConfig } from "./config/server";
import { GoogleTagManager } from "@next/third-parties/google";
const serverConfig = getServerSideConfig();

export const metadata: Metadata = {
  title: "只冲科技",
  description: "Your personal ChatGPT Chat Bot.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
  appleWebApp: {
    title: "只冲科技",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="config" content={JSON.stringify(getClientConfig())} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="manifest" href="/site.webmanifest"></link>
        <script src="/serviceWorkerRegister.js" defer></script>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-6K4Z2PBCZ2"
        ></Script>
        <Script id="google-analytics">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){
            dataLayer.push(arguments);
          };
          gtag('js', new Date());

          gtag('config', 'G-6K4Z2PBCZ2');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3614870144525266"
          crossOrigin="anonymous"
        ></Script>
        {/* <Script
          async
          src="https://fundingchoicesmessages.google.com/i/pub-3614870144525266?ers=1"
          nonce="noZUSv6xBJD0HD6gHh2jSw"
        ></Script> */}
        {/* <Script nonce="noZUSv6xBJD0HD6gHh2jSw" id="ads-blocker-alert">
          {`
          (function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();
          `}
        </Script> */}
      </head>
      <body>
        {children}
        {serverConfig?.isVercel && (
          <>
            <SpeedInsights />
          </>
        )}
        {serverConfig?.gtmId && (
          <>
            <GoogleTagManager gtmId={serverConfig.gtmId} />
          </>
        )}
        <div
          style={{ display: "block", textAlign: "center", marginTop: "8px" }}
        >
          <a href="https://beian.miit.gov.cn/">沪ICP备2023003164号-1</a>
        </div>
      </body>
    </html>
  );
}
