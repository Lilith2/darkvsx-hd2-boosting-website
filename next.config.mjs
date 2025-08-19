/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  compress: true,
  output: "standalone", // Enable standalone output for proper page routing
  generateEtags: true,
  experimental: {
    scrollRestoration: true,
    esmExternals: true, // Better tree shaking
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'], // Optimize icon imports
  },
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ['@supabase/supabase-js'],
  allowedDevOrigins: [
    "1c1d42e681804164827111b263e5941f-c903eba0dff24a369b0e80752.fly.dev",
    "ef297b071d014482af49aab623b4cc88-c420d88334bd4335931373581.projects.builder.codes",
    "localhost",
    "127.0.0.1",
    "*.fly.dev",
    "*.projects.builder.codes",
  ],
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Keep only essential security headers that don't break integrations
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Removed restrictive CSP and frame policies for better integration compatibility
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "ahqqptrclqtwqjgmtesv.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cdn.builder.io",
      },
    ],
    unoptimized: false,
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days (more reasonable)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    // Quality is handled by the default loader
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    styledComponents: false, // We're using Tailwind, disable styled-components
  },
  productionBrowserSourceMaps: false,
  // Bundle analyzer when needed
  bundlePagesRouterDependencies: true,
  // Advanced optimization
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true,
    },
  },
  // Removed transpilePackages to avoid conflict with serverExternalPackages
  // transpilePackages: [],
  // Webpack configuration removed - it was causing more issues than solving
  // Modern Next.js handles Supabase without custom webpack config
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
