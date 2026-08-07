/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Local files in /public need no config. These two are whitelisted so
    // an external Unsplash/Pexels URL pasted into cover_image_url also
    // works with next/image's optimizer, in case someone doesn't use the
    // local-file approach documented in public/images/packages/README.md.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

module.exports = nextConfig;
