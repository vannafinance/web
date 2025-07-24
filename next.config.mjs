/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'source.unsplash.com',
          pathname: '/random/**',
        },
      ],
    },
  };
  
  export default nextConfig;
  