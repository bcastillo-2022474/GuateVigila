/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // DuckDB uses native Node bindings — don't bundle them
  serverExternalPackages: ['@duckdb/node-api', '@duckdb/node-bindings'],
}

export default nextConfig
