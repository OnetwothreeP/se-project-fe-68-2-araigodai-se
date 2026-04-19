import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude the design/ and src/app/pages/ directories from the Next.js build
  // They contain React Router code used only for design prototyping
};

export default nextConfig;
