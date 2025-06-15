/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'clerk.dev'],
  },
  transpilePackages: ['@carhub/shared', '@carhub/db'],
  // Add headers for 3D model files
  async headers() {
    return [
      {
        source: '/demo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.(glb|gltf)',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 