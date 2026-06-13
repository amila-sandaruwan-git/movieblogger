import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Allow any Supabase project
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Remove this incorrect localhost entry (it has http:// in hostname)
      // {
      //   protocol: 'https',
      //   hostname: 'http://localhost:3000/post',
      // },
      
      // Add TMDB image domains
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'www.themoviedb.org',
        pathname: '/t/p/**',
      },
      // Broader pattern for any TMDB subdomain
      {
        protocol: 'https',
        hostname: '**.tmdb.org',
      },
    ],
  },
};

export default nextConfig;