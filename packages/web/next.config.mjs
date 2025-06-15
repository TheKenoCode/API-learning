/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'clerk.dev'],
  },
  transpilePackages: ['@carhub/shared', '@carhub/db']
};

export default nextConfig; 