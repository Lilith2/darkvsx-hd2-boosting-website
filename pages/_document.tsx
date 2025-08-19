import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Optimized font loading strategy */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Font with display=swap for better performance */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          media="print"
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>

        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://discord.gg" />
        <link
          rel="dns-prefetch"
          href="https://ahqqptrclqtwqjgmtesv.supabase.co"
        />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />

        {/* Essential meta tags */}
        <meta charSet="utf-8" />
        {/* Viewport meta moved to _app.tsx as recommended by Next.js */}
        <meta name="theme-color" content="#4F8FF0" />
        <meta name="msapplication-TileColor" content="#4F8FF0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/placeholder.svg" />
        <link rel="apple-touch-icon" href="/placeholder.svg" />
        <link rel="manifest" href="/manifest.json" />

        {/* Default structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "HelldiversBoost",
              url: "https://helldivers2boost.com",
              logo: "https://helldivers2boost.com/placeholder.svg",
              description:
                "Professional Helldivers 2 boosting services with fast delivery, secure methods, and competitive pricing.",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: "en",
                url: "https://discord.gg/helldivers2boost",
              },
              sameAs: ["https://discord.gg/helldivers2boost"],
              offers: {
                "@type": "Offer",
                category: "Gaming Services",
                description:
                  "Professional Helldivers 2 boosting services including level boosts, weapon unlocks, credit farming, and mission completion.",
                areaServed: "Worldwide",
                availability: "https://schema.org/InStock",
              },
            }),
          }}
        />

        {/* Critical CSS inlined for fastest rendering */}
        <style dangerouslySetInnerHTML={{
          __html: `
            *,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
            html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
            body{margin:0;line-height:inherit;background-color:hsl(210 20% 7%);color:hsl(210 40% 98%)}
            .min-h-screen{min-height:100vh}.flex{display:flex}.flex-col{flex-direction:column}.flex-1{flex:1 1 0%}
            .fixed{position:fixed}.top-0{top:0px}.left-0{left:0px}.right-0{right:0px}.z-50{z-index:50}
            .h-16{height:4rem}.items-center{align-items:center}.justify-between{justify-content:space-between}
            .bg-background\/95{background-color:hsl(210 20% 7% / 0.95)}.backdrop-blur-md{backdrop-filter:blur(12px)}
            .border-b{border-bottom-width:1px}.border-border{border-color:hsl(215 25% 20%)}
            .transition-colors{transition:color 150ms,background-color 150ms,border-color 150ms}
          `
        }} />

        {/* Performance optimizations */}
        <link rel="preload" href="/sw.js" as="script" />
        <link rel="preload" href="/api/ping" as="fetch" crossOrigin="anonymous" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
