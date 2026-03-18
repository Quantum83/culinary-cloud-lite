declare module "next-pwa" {
  import type { NextConfig } from "next";
  function withPWA(config: {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    [key: string]: any;
  }): (nextConfig: NextConfig) => NextConfig;
  export = withPWA;
}
