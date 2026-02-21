/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
