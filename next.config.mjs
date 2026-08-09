// /** @type {import('next').NextConfig} */

// const repoName = "kiranaprakashsharma";
// const isProd = process.env.NODE_ENV === "production";

// const nextConfig = {
//   output: "export",

//   // Use basePath only in production (GitHub Pages)
//   basePath: isProd ? `/${repoName}` : "",

//   // Use assetPrefix only in production
//   assetPrefix: isProd ? `/${repoName}/` : "",

//   trailingSlash: true,

//   images: {
//     unoptimized: true,
//   },

//   env: {
//     NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : "",
//   },

//   // Optional: removes the cross-origin warning in development
//   allowedDevOrigins: ["10.21.137.148"],
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */

const nextConfig = {
  // Removed: output: "export" — Vercel runs Next.js as a real server.
  // Keeping this would limit you to static-only again, defeating the
  // reason you moved off GitHub Pages.

  // Removed: basePath / assetPrefix / NEXT_PUBLIC_BASE_PATH — those only
  // existed for GitHub Pages' subpath. Vercel serves from the domain root.

  // images.unoptimized removed too — Vercel can run Next's real Image
  // Optimization now, no reason to disable it.

  allowedDevOrigins: ["10.21.137.148"], // fine to keep, dev-only
};

export default nextConfig;