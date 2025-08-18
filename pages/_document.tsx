import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to optimize external font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://discord.gg" />
        <link rel="dns-prefetch" href="https://ahqqptrclqtwqjgmtesv.supabase.co" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Essential meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
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
              "name": "HelldiversBoost",
              "url": "https://helldivers2boost.com",
              "logo": "https://helldivers2boost.com/placeholder.svg",
              "description": "Professional Helldivers 2 boosting services with fast delivery, secure methods, and competitive pricing.",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "en",
                "url": "https://discord.gg/helldivers2boost"
              },
              "sameAs": [
                "https://discord.gg/helldivers2boost"
              ],
              "offers": {
                "@type": "Offer",
                "category": "Gaming Services",
                "description": "Professional Helldivers 2 boosting services including level boosts, weapon unlocks, credit farming, and mission completion.",
                "areaServed": "Worldwide",
                "availability": "https://schema.org/InStock"
              }
            })
          }}
        />
        
        {/* Performance optimizations */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
