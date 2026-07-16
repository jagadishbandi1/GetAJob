import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in pdfjs-dist, which needs its worker file at runtime;
  // leaving them unbundled lets them resolve from node_modules.
  serverExternalPackages: ['better-sqlite3', 'playwright', 'pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;
