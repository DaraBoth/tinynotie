// next.config.mjs
const nextConfig = {
  experimental: {
    turbo: {}, // Set turbo to an empty object or provide specific configuration options.
    reactCompiler: true, // Ensure this is set correctly for React Compiler
    ppr: "incremental", // Enable Partial Prerendering (PPR)
    after: true, // Enable next/after for secondary tasks
  },
};

export default nextConfig;
