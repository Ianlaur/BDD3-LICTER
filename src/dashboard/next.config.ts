import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack to THIS directory. Without this, Next.js walks up the
  // filesystem looking for a lockfile and picks ~/package-lock.json, which
  // makes it load .env from the home directory instead of src/dashboard/.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
