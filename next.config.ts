import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // three.js ships modern ESM; let Next transpile the R3F ecosystem consistently.
  transpilePackages: ["three"],
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        // Textures, HDRI and model files are versioned by filename; cache them hard.
        source: "/:dir(textures|hdri|models)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
