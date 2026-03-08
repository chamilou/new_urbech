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

const mediaHosts =
  process.env.NODE_ENV === "development"
    ? ["localhost", "127.0.0.1"]
    : ["urbechov.ru", "www.urbechov.ru", "shop.urbechov.ru"];

const remoteMediaPatterns = mediaHosts.flatMap((hostname) => {
  const protocols =
    hostname === "localhost" || hostname === "127.0.0.1"
      ? ["http"]
      : ["https"];

  return protocols.map((protocol) => ({
    protocol,
    hostname,
    pathname: "/media/**",
  }));
});

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
    // Same-origin /media/** does not need remotePatterns.
    // These patterns only allow absolute media URLs from our own hosts.
    remotePatterns: remoteMediaPatterns,
  },
};

export default nextConfig;
