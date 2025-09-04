/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { esmExternals: true },
  async headers() {
    return [
      {
        source: '/:path*',
        has: [
          { type: 'header', key: 'accept', value: 'text/html.*' },
        ],
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },
};
export default nextConfig;
