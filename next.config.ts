import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 預設 1 MB；放寬到 6 MB，配合 SPEC 5 MB 檔案上限 + form 其他欄位
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
