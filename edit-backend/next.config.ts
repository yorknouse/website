import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://lh3.googleusercontent.com/a/*"),
      new URL("https://bbcdn.nouse.co.uk/*"),
    ],
  },
};

export default nextConfig;
