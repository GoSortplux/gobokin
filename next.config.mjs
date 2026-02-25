/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-bebfb8756c034cec903236ae2544a084.r2.dev',
      },
      {
        protocol: 'http',
        hostname: 'pub-bebfb8756c034cec903236ae2544a084.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/halls/:path*',
        destination: '/venues/:path*',
        permanent: true,
      },
      {
        source: '/apply-hall-owner',
        destination: '/apply-venue-owner',
        permanent: true,
      },
      {
        source: '/admin/dashboard/halls',
        destination: '/admin/dashboard/venues',
        permanent: true,
      },
      {
        source: '/vendor/dashboard/halls',
        destination: '/vendor/dashboard/venues',
        permanent: true,
      },
      {
        source: '/auth/reset-password/:path*',
        destination: '/auth/password-reset/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
