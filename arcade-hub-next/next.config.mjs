/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
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
