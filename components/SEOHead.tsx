import Head from 'next/head'
import { useRouter } from 'next/router'
import { getSiteUrl } from '@/lib/config'

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  noindex?: boolean
  canonical?: string
}

export function SEOHead({
  title = "Helldivers 2 Boosting Services - Professional Gaming Enhancement",
  description = "Premium Helldivers 2 boosting services. Fast, secure, and professional. Rank up, unlock achievements, and dominate the galaxy with our expert boosters.",
  image = "/og-image.png",
  noindex = false,
  canonical,
}: SEOHeadProps) {
  const router = useRouter()
  const siteName = "Helldivers 2 Boosting"
  const siteUrl = getSiteUrl()
  const fullUrl = `${siteUrl}${router.asPath}`
  const canonicalUrl = canonical || fullUrl

  return (
    <Head>
      {/* Basic meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${image}`} />
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#0ea5e9" />
      <meta name="keywords" content="helldivers 2, boosting, gaming, achievements, rank up, professional gaming" />
      <meta name="author" content={siteName} />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": siteName,
            "url": siteUrl,
            "description": description,
            "sameAs": [
              // Add social media URLs here
            ]
          })
        }}
      />
    </Head>
  )
}
