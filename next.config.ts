import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    qualities: [100],
    remotePatterns: [
      { protocol: 'https', hostname: 'd15f34w2p8l1cc.cloudfront.net' },
      { protocol: 'https', hostname: 'blz-contentstack-images.akamaized.net' },
      { protocol: 'https', hostname: 'images.blz-contentstack.com' },
      { protocol: 'https', hostname: 'static.playoverwatch.com' },
    ],
  },
}

export default nextConfig
