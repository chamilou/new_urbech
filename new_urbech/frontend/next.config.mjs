/** @type {import('next').NextConfig} */
// Allow overriding backend origin when running the frontend outside Docker.
// Defaults:
// - development: localhost:8000 (typical when backend runs locally)
// - production: backend:8000 (Docker service name)
const backendOrigin =
  process.env.BACKEND_ORIGIN ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "http://backend:8000");

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      // In docker, backend is reachable by service name "backend"
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backendOrigin}/media/:path*`,
      },
    ];
  },

  images: {
    // If you use <Image src="/media/...">, no remotePatterns are required.
    // But keeping this safe in case you ever use absolute URLs:
    remotePatterns: [
      // Same-origin through Caddy (recommended): no hostname needed
      // Absolute through public host (replace with your IP/domain if you use it):
      {
        protocol: "http",
        hostname: "**",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
