import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* data/db.json 은 경로를 조립해 fs 로 읽는다.
     정적 분석으로는 안 잡히므로 서버 번들에 직접 넣어준다. */
  outputFileTracingIncludes: {
    "/*": ["./data/**"],
    "/**": ["./data/**"],
  },
};

export default nextConfig;
