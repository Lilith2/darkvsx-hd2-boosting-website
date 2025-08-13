import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  structuredData?: object;
}

const defaultSEO = {
  title: 'HelldiversBoost - Professional Helldivers 2 Boosting Services',
  description: 'Get the best Helldivers 2 boosting services. Level up faster, unlock weapons, earn credits, and complete missions with our professional team. Safe, fast, and reliable.',
  keywords: 'helldivers 2, helldivers boost, helldivers 2 boosting, helldivers level boost, helldivers weapons, helldivers credits, helldivers missions',
  image: '/placeholder.svg',
  url: typeof window !== 'undefined' ? window.location.href : '',
  type: 'website' as const,
};

export function SEOHead({
  title = defaultSEO.title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  image = defaultSEO.image,
  url = defaultSEO.url,
  type = defaultSEO.type,
  structuredData,
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', 'HelldiversBoost', 'property');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', image, 'name');
    
    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'HelldiversBoost');
    updateMetaTag('language', 'en');
    updateMetaTag('revisit-after', '7 days');
    
    // Canonical URL
    updateCanonicalLink(url);
    
    // Structured data
    if (structuredData) {
      updateStructuredData(structuredData);
    } else {
      // Default structured data
      const defaultStructuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "HelldiversBoost",
        "url": url,
        "description": description,
        "logo": image,
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "en"
        },
        "offers": {
          "@type": "Offer",
          "category": "Gaming Services",
          "description": "Professional Helldivers 2 boosting services"
        }
      };
      updateStructuredData(defaultStructuredData);
    }
  }, [title, description, keywords, image, url, type, structuredData]);

  return null; // This component doesn't render anything
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

function updateCanonicalLink(url: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', url);
}

function updateStructuredData(data: object) {
  const id = 'structured-data';
  let element = document.getElementById(id) as HTMLScriptElement;
  
  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }
  
  element.textContent = JSON.stringify(data);
}

// Pre-defined SEO configurations for different pages
export const SEO_CONFIGS = {
  home: {
    title: 'HelldiversBoost - Professional Helldivers 2 Boosting Services',
    description: 'Get the best Helldivers 2 boosting services. Level up faster, unlock weapons, earn credits, and complete missions with our professional team.',
    keywords: 'helldivers 2, helldivers boost, helldivers 2 boosting, helldivers level boost, helldivers weapons',
  },
  services: {
    title: 'Helldivers 2 Boosting Services - Level Up, Weapons & More',
    description: 'Browse our complete range of Helldivers 2 boosting services including level boosts, weapon unlocks, credit farming, and mission completion.',
    keywords: 'helldivers 2 services, level boost, weapon unlock, credits farming, mission completion',
  },
  bundles: {
    title: 'Helldivers 2 Boost Bundles - Save More with Package Deals',
    description: 'Save money with our Helldivers 2 boost bundles. Combine multiple services for maximum value and faster progression.',
    keywords: 'helldivers 2 bundles, boost packages, gaming deals, helldivers combo',
  },
  account: {
    title: 'My Account - HelldiversBoost Dashboard',
    description: 'Manage your Helldivers 2 boosting orders, track progress, and view your account information.',
    keywords: 'account dashboard, order tracking, helldivers 2 progress',
  },
  faq: {
    title: 'FAQ - Helldivers 2 Boosting Questions Answered',
    description: 'Get answers to frequently asked questions about our Helldivers 2 boosting services, safety, and ordering process.',
    keywords: 'helldivers 2 faq, boosting questions, helldivers help, gaming service questions',
  },
  contact: {
    title: 'Contact Us - HelldiversBoost Customer Support',
    description: 'Get in touch with our Helldivers 2 boosting support team. We\'re here to help with your orders and questions.',
    keywords: 'contact support, helldivers 2 help, customer service, gaming support',
  },
};
