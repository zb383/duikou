import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist 的 worker 文件在 Next.js 打包时会路径错乱,
  // 标记为服务端外部包,直接 require,绕开 worker 加载问题。
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
