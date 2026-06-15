/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["172.30.114.177"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
