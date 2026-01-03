/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      // In docker, backend is reachable by service name "backend"
      {
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*",
      },
      {
        source: "/media/:path*",
        destination: "http://backend:8000/media/:path*",
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
