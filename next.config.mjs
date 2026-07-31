/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.tokkobroker.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.tokkobroker.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'static.tokkobroker.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
